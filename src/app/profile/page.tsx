"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  joined_at?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // State untuk edit
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, email, joined_at")
            .eq("id", user.id)
            .single();
          if (error) {
            console.error("Error fetchProfile:", error);
            setProfile(null);
          } else if (data) {
            setProfile(data);
            setEditName(data.full_name || "");
            setEditAvatar(data.avatar_url || null);
          }
        } catch (err) {
          console.error("Error fetchProfile:", err);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditName(profile?.full_name || "");
    setEditAvatar(profile?.avatar_url || null);
    setNotif(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditName(profile?.full_name || "");
    setEditAvatar(profile?.avatar_url || null);
    setNotif(null);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName, avatar_url: editAvatar })
      .eq("id", profile?.id);
    setSaving(false);
    if (!error) {
      setProfile({
        ...profile,
        full_name: editName,
        avatar_url: editAvatar || undefined,
      });
      setEditMode(false);
      setNotif({ type: "success", message: "Profil berhasil diperbarui." });
    } else {
      setNotif({ type: "error", message: "Gagal memperbarui profil." });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImageUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${profile?.id}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      setImageUploading(false);
      setNotif({ type: "error", message: "Gagal upload foto." });
      return;
    }
    const { data } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;
    if (publicUrl) {
      setEditAvatar(publicUrl);
      setNotif({ type: "success", message: "Foto berhasil diupload." });
    }
    setImageUploading(false);
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    setSaving(true);
    // Hapus profile dari tabel profiles (akan cascade ke tabel lain jika foreign key on delete cascade)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile?.id);
    setSaving(false);
    if (!error) {
      setNotif({ type: "success", message: "Akun berhasil dihapus." });
      setTimeout(async () => {
        await signOut();
        router.replace("/");
      }, 1500);
    } else {
      setNotif({ type: "error", message: "Gagal menghapus akun." });
    }  };

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="text-sage-700">Memeriksa autentikasi...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="flex flex-col items-center gap-4">
          <div className="text-sage-700">Anda belum login.</div>
          <a
            href="/auth/login"
            className="px-4 py-2 rounded bg-forest-600 text-white hover:bg-forest-700 transition-colors"
          >
            Login Ulang
          </a>
        </div>
      </div>
    );
  }

  // Show data loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="text-sage-700">Memuat profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="flex flex-col items-center gap-4">
          <div className="text-sage-700">
            Profil tidak ditemukan atau gagal memuat data.
          </div>
          <button
            onClick={() => {
              if (!user) return;
              setLoading(true);
              // Panggil ulang fetchProfile
              (async () => {
                try {
                  const { data, error } = await supabase
                    .from("profiles")
                    .select(
                      "id, username, full_name, avatar_url, email, joined_at"
                    )
                    .eq("id", user.id)
                    .single();
                  if (error) {
                    setProfile(null);
                  } else if (data) {
                    setProfile(data);
                    setEditName(data.full_name || "");
                    setEditAvatar(data.avatar_url || null);
                  }
                } catch {
                  setProfile(null);
                } finally {
                  setLoading(false);
                }
              })();
            }}
            className="px-4 py-2 rounded bg-forest-600 text-white"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-100 to-forest-50 flex flex-col items-center py-16 px-2">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Card Profile */}
        <div className="w-full">
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-2xl p-10 pt-28 w-full flex flex-col items-center border border-sage-200 relative">
            {/* Tombol Edit di kanan atas, flexbox, tidak absolute */}
            <div className="w-full flex justify-end mb-2">
              {!editMode && (
                <button
                  className="px-4 py-2 rounded-lg bg-forest-600 text-white font-semibold shadow hover:bg-forest-700 transition"
                  onClick={handleEdit}
                >
                  Edit Profil
                </button>
              )}
            </div>
            {/* Avatar, posisikan di tengah atas, tidak overlap tombol */}
            <div className="relative -mt-24 mb-4 z-10">
              {editMode ? (
                <div>
                  {editAvatar ? (
                    <Image
                      src={editAvatar}
                      alt="Avatar"
                      width={144}
                      height={144}
                      className="w-36 h-36 rounded-full object-cover border-4 border-forest-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-sage-200 flex items-center justify-center text-5xl font-bold text-sage-600 border-4 border-forest-200 shadow-lg">
                      {getInitials(editName)}
                    </div>
                  )}
                  <button
                    className="absolute bottom-2 right-2 bg-forest-600 text-white rounded-full p-3 text-xs hover:bg-forest-700 transition shadow"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    title="Ubah Foto"
                  >
                    {imageUploading ? "..." : "Ubah"}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    disabled={imageUploading}
                  />
                </div>
              ) : profile?.avatar_url ? (
                <Image
                  src={profile?.avatar_url || ""}
                  alt="Avatar"
                  width={144}
                  height={144}
                  className="w-36 h-36 rounded-full object-cover border-4 border-forest-200 shadow-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-sage-200 flex items-center justify-center text-5xl font-bold text-sage-600 border-4 border-forest-200 shadow-lg">
                  {getInitials(profile?.full_name)}
                </div>
              )}
            </div>
            <div className="w-full flex flex-col items-center">
              {editMode ? (
                <input
                  type="text"
                  className="text-3xl font-bold text-forest-900 mb-1 text-center bg-sage-50 border-b-2 border-sage-200 focus:outline-none focus:border-forest-600 transition w-full max-w-xs"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  maxLength={40}
                  autoFocus
                />
              ) : (
                <div className="text-3xl font-bold text-forest-900 mb-1 text-center">
                  {profile?.full_name || "-"}
                </div>
              )}
              <div className="text-sage-600 mb-2 text-lg">
                {profile?.username ? `@${profile?.username}` : "-"}
              </div>
              <div className="text-sage-700 mb-2">{profile?.email || "-"}</div>
              <div className="text-xs text-sage-500 mb-4">
                Bergabung sejak{" "}
                {profile?.joined_at
                  ? new Date(profile?.joined_at).toLocaleDateString("id-ID", {
                      dateStyle: "long",
                    })
                  : "-"}
              </div>
              {editMode && (
                <div className="flex gap-3 mt-4">
                  <button
                    className="px-5 py-2 rounded-lg bg-forest-600 text-white font-semibold shadow hover:bg-forest-700 transition"
                    onClick={handleSave}
                    disabled={saving || imageUploading}
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    className="px-5 py-2 rounded-lg bg-sage-200 text-forest-700 font-semibold shadow hover:bg-sage-300 transition"
                    onClick={handleCancel}
                    disabled={saving || imageUploading}
                  >
                    Batal
                  </button>
                </div>
              )}
              {notif && (
                <div
                  className={`mt-4 text-center text-sm font-medium ${
                    notif.type === "success" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {notif.message}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tombol Hapus Akun */}
        <button
          className="mt-8 px-5 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
          onClick={() => setShowDeleteModal(true)}
          disabled={saving}
        >
          Hapus Akun
        </button>
      </div>
      {/* Modal Konfirmasi Hapus Akun */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full flex flex-col items-center">
            <div className="text-xl font-bold text-red-700 mb-2">
              Konfirmasi Hapus Akun
            </div>
            <div className="text-sage-700 mb-6 text-center">
              Apakah kamu yakin ingin menghapus akun? Semua data akan hilang dan
              tidak bisa dikembalikan.
            </div>
            <div className="flex gap-4">
              <button
                className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={handleDeleteAccount}
                disabled={saving}
              >
                {saving ? "Menghapus..." : "Ya, Hapus"}
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-sage-200 text-forest-700 font-semibold shadow hover:bg-sage-300 transition"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
