"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  Edit3,
  Save,
  X,
  Mail,
  Calendar,
  Activity,
  Heart,
  MessageCircle,
  Trophy,
  Target,
  Camera,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string;
  joined_at: string;
  last_active: string;
}

interface Assessment {
  predicted_mood: string;
  confidence_score: number;
}

interface UserStats {
  assessments_count: number;
  posts_count: number;
  likes_count: number;
  comments_count: number;
  favorite_mood: string;
  avg_confidence: number;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Single useEffect to handle all data fetching
  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }

    let mounted = true;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (mounted) {
          setProfile(data);
          setFormData({
            username: data.username || "",
            full_name: data.full_name || "",
            email: data.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    const fetchUserStats = async () => {
      try {
        // Get assessments count and stats
        const { data: assessments, error: assessmentsError } = await supabase
          .from("nutrition_assessments")
          .select("predicted_mood, confidence_score")
          .eq("user_id", user.id);

        if (assessmentsError) throw assessmentsError;

        // Get posts count
        const { count: postsCount, error: postsError } = await supabase
          .from("community_posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (postsError) throw postsError;

        // Get likes count (likes given by user)
        const { count: likesCount, error: likesError } = await supabase
          .from("post_likes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (likesError) throw likesError;

        // Get comments count
        const { count: commentsCount, error: commentsError } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (commentsError) throw commentsError;

        // Calculate favorite mood and average confidence
        const moodCounts: { [key: string]: number } = {};
        let totalConfidence = 0;

        assessments?.forEach((assessment: Assessment) => {
          if (assessment.predicted_mood) {
            moodCounts[assessment.predicted_mood] =
              (moodCounts[assessment.predicted_mood] || 0) + 1;
          }
          if (assessment.confidence_score) {
            totalConfidence += assessment.confidence_score;
          }
        });

        const favoriteMood = Object.keys(moodCounts).reduce(
          (a, b) => (moodCounts[a] > moodCounts[b] ? a : b),
          "N/A"
        );

        const avgConfidence = assessments?.length
          ? totalConfidence / assessments.length
          : 0;

        if (mounted) {
          setUserStats({
            assessments_count: assessments?.length || 0,
            posts_count: postsCount || 0,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            favorite_mood: favoriteMood,
            avg_confidence: avgConfidence,
          });
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    const initializeData = async () => {
      if (!mounted) return;

      setLoading(true);
      try {
        await Promise.all([fetchProfile(), fetchUserStats()]);
      } catch (error) {
        console.error("Error initializing profile data:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeData();
    return () => {
      mounted = false;
    };
  }, [user, router]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...formData } : null));
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes("bucket does not exist")) {
          alert(
            "Bucket storage 'profiles' belum dibuat di Supabase. Silakan buat terlebih dahulu di dashboard Supabase > Storage."
          );
        } else {
          alert("Gagal upload avatar: " + uploadError.message);
        }
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) =>
        prev ? { ...prev, avatar_url: data.publicUrl } : null
      );
    } catch (error) {
      console.error("Error uploading avatar:", error);
      // alert sudah ditangani di atas
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      alert("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Sign out and redirect
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-sage-900 mb-4">
            Profile not found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-sage-600 text-white px-6 py-2 rounded-lg hover:bg-sage-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMoodColor = (mood: string) => {
    const colors: { [key: string]: string } = {
      happy: "text-yellow-600",
      sad: "text-blue-600",
      calm: "text-green-600",
      anxious: "text-red-600",
      excited: "text-orange-600",
      neutral: "text-gray-600",
    };
    return colors[mood.toLowerCase()] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-sage-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-sage-200 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Profile Avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-sage-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-sage-600 text-white p-2 rounded-full cursor-pointer hover:bg-sage-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-sage-900">
                  {profile.full_name || "User"}
                </h1>
                <p className="text-sage-600">@{profile.username}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-sage-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profile.joined_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center space-x-2 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-sage-600">Assessments</p>
                  <p className="text-2xl font-bold text-sage-900">
                    {userStats.assessments_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-sage-600">Posts</p>
                  <p className="text-2xl font-bold text-sage-900">
                    {userStats.posts_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-sage-600">Likes Given</p>
                  <p className="text-2xl font-bold text-sage-900">
                    {userStats.likes_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-sage-600">Comments</p>
                  <p className="text-2xl font-bold text-sage-900">
                    {userStats.comments_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-sage-200">
          <div className="border-b border-sage-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "profile"
                    ? "border-sage-600 text-sage-600"
                    : "border-transparent text-sage-500 hover:text-sage-700"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "settings"
                    ? "border-sage-600 text-sage-600"
                    : "border-transparent text-sage-500 hover:text-sage-700"
                }`}
              >
                Account Settings
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === "stats"
                    ? "border-sage-600 text-sage-600"
                    : "border-transparent text-sage-500 hover:text-sage-700"
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Username
                      </label>
                      <p className="text-sage-900">{profile.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-sage-900">{profile.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Email
                      </label>
                      <p className="text-sage-900">{profile.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Member Since
                      </label>
                      <p className="text-sage-900">
                        {formatDate(profile.joined_at)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-1">
                        Last Active
                      </label>
                      <p className="text-sage-900">
                        {formatDate(profile.last_active)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-8">
                {/* Change Password Section */}
                <div className="border border-sage-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-sage-900 mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 pr-10 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 pr-10 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-sage-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 pr-10 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-transparent text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-500"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="bg-sage-600 text-white px-4 py-2 rounded-lg hover:bg-sage-700 transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Delete Account Section */}
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">
                    Danger Zone
                  </h3>
                  <p className="text-red-700 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  {showDeleteConfirm ? (
                    <div className="space-y-4">
                      <p className="text-red-700">
                        Are you sure you want to delete your account? This
                        action cannot be undone.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeleteAccount}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Yes, Delete My Account
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && userStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-sage-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sage-900 mb-2">
                      Activity Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sage-600">
                          Total Assessments:
                        </span>
                        <span className="font-medium text-sage-900">
                          {userStats.assessments_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-600">Community Posts:</span>
                        <span className="font-medium text-sage-900">
                          {userStats.posts_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-600">Likes Given:</span>
                        <span className="font-medium text-sage-900">
                          {userStats.likes_count}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-600">Comments Made:</span>
                        <span className="font-medium text-sage-900">
                          {userStats.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-sage-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sage-900 mb-2">
                      Mood Insights
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sage-600">Favorite Mood:</span>
                        <span
                          className={`font-medium capitalize ${getMoodColor(
                            userStats.favorite_mood
                          )}`}
                        >
                          {userStats.favorite_mood}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-600">Avg. Confidence:</span>
                        <span className="font-medium text-sage-900">
                          {(userStats.avg_confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-sage-100 to-sage-200 rounded-lg p-6">
                  <h4 className="font-semibold text-sage-900 mb-3">
                    Your NutriMood Journey
                  </h4>
                  <p className="text-sage-700 mb-4">
                    You&apos;ve been an active member of the NutriMood
                    community! Keep tracking your nutrition and mood to gain
                    deeper insights into your wellbeing.
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-sage-600" />
                      <span className="text-sm text-sage-700">
                        Next milestone:{" "}
                        {Math.ceil(userStats.assessments_count / 10) * 10}{" "}
                        assessments
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
