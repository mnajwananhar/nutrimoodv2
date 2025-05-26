"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const initialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

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

    // Initialize auth state
    const initializeAuth = async () => {
      if (initialized.current) return;

      try {
        console.log("Initializing auth...");

        // Set loading false immediately for better UX
        setLoading(false);

        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // Load profile asynchronously without blocking
          if (session?.user) {
            loadUserProfile(session.user.id);
          }

          // Mark as initialized
          initialized.current = true;
          console.log(
            "Auth initialized, user:",
            session?.user?.email || "none"
          );
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          initialized.current = true;
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      console.log("Setting up auth listener...");

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth event:", event, session?.user?.email || "no user");

        if (!mounted) return;

        try {
          switch (event) {
            case "SIGNED_IN":
              setSession(session);
              setUser(session?.user ?? null);
              if (session?.user) {
                createOrUpdateProfile(session.user);
                loadUserProfile(session.user.id);
              }
              break;

            case "SIGNED_OUT":
              setSession(null);
              setUser(null);
              setUserProfile(null);
              break;

            case "TOKEN_REFRESHED":
              setSession(session);
              setUser(session?.user ?? null);
              break;

            case "INITIAL_SESSION":
              // Skip - handled by initializeAuth
              break;

            default:
              setSession(session);
              setUser(session?.user ?? null);
              if (session?.user) {
                loadUserProfile(session.user.id);
              } else {
                setUserProfile(null);
              }
              break;
          }
        } catch (error) {
          console.error("Error handling auth event:", error);
        }
      });

      return subscription;
    };

    // Start initialization
    authSubscription = setupAuthListener();
    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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
    try {
      // Reset initialization flag before signing out
      initialized.current = false;

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
    } catch (error) {
      console.error("Sign out error:", error);
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
