"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  joined_at: string;
  last_active: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    userData?: UserData
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const hasValidSession = useRef(false); // Track if we ever had a valid session

  useEffect(() => {
    let mounted = true;

    // Create or update profile function
    const createOrUpdateProfile = async (user: User) => {
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          // Create new profile
          const { error } = await supabase.from("profiles").insert({
            id: user.id,
            username: user.user_metadata?.username || null,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            email: user.email,
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          });

          if (error) {
            console.error("Error creating profile:", error);
          }
        } else {
          // Update last active
          const { error } = await supabase
            .from("profiles")
            .update({ last_active: new Date().toISOString() })
            .eq("id", user.id);

          if (error) {
            console.error("Error updating profile:", error);
          }
        }
      } catch (error) {
        console.error("Error in createOrUpdateProfile:", error);
      }
    };

    // Load user profile from database
    const loadUserProfile = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (mounted && profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };

    const getSession = async () => {
      try {
        // Only show loading on initial load, not on subsequent checks
        if (!initialLoadDone.current) {
          setLoading(true);
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setUserProfile(null);
            if (!initialLoadDone.current) {
              setLoading(false);
              initialLoadDone.current = true;
            }
          }
          return;
        }        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Track if we have a valid session
          if (session?.user) {
            hasValidSession.current = true;
          }
          
          // Load user profile if user exists
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
          
          if (!initialLoadDone.current) {
            setLoading(false);
            initialLoadDone.current = true;
          }
        }
      } catch (error) {
        console.error('Session recovery error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          if (!initialLoadDone.current) {
            setLoading(false);
            initialLoadDone.current = true;
          }
        }
      }
    };

    // Handle visibility change (when switching between apps)
    const handleVisibilityChange = () => {
      // Only log visibility change, don't trigger session refresh
      // This prevents "memeriksa autentikasi" when switching apps
      // Supabase auto-refresh tokens will handle session validity
      if (document.visibilityState === 'visible') {
        console.log('App became visible - session maintained');
      }
    };    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Track if we have a valid session
        if (session?.user) {
          hasValidSession.current = true;
        }
        
        // Load user profile if user exists
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        // Never show loading after initial load, unless user signs out
        if (initialLoadDone.current) {
          // If user signs out, reset the session tracking
          if (event === "SIGNED_OUT") {
            hasValidSession.current = false;
            setLoading(false); // Even on signout, don't show loading
          }
          // For all other events (TOKEN_REFRESHED, etc), keep loading false
        } else {
          // Only set loading to false on initial load completion
          setLoading(false);
          initialLoadDone.current = true;
        }

        // Handle sign in success
        if (event === "SIGNED_IN" && session?.user) {
          // Create or update user profile
          await createOrUpdateProfile(session.user);
        }
      }
    });

    // Add visibility change listener (passive monitoring only)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial session check
    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    userData?: UserData
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {},
      },
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/recommendations`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
