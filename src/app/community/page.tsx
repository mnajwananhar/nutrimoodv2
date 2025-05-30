"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Plus,
  Heart,
  MessageCircle,
  Star,
  Clock,
  ChefHat,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Award,
  Search,
  X,
  Send,
  Trash2,
} from "lucide-react";
import { CommunitySkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  parent_id: number | null;
  user_id: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface CommunityPost {
  id: number;
  user_id: string;
  user_avatar_url: string | null;
  type: "recipe" | "story" | "question" | "tip" | "review";
  title: string;
  content: string;
  images: string[];
  tags: string[];
  food_name: string | null;
  rating: number | null;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  post_likes: { user_id: string }[];
  comments: Comment[];
}

interface NewPostData {
  type: "recipe" | "story" | "question" | "tip" | "review";
  title: string;
  content: string;
  food_name: string;
  rating: number | null;
  tags: string[];
}

const triggerPushNotification = async (
  userId: string,
  type: string,
  data: Record<string, unknown>
) => {
  // Notification functionality has been disabled
  console.log("Push notifications disabled:", { userId, type, data });
  return;
};

export default function CommunityPage() {
  const { user, userProfile, isAuthLoading } = useAuth();
  const { success, error } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newPost, setNewPost] = useState<NewPostData>({
    type: "story",
    title: "",
    content: "",
    food_name: "",
    rating: null,
    tags: [],
  });
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<{
    [key: number]: number | null;
  }>({});
  const [showReplies, setShowReplies] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [showPostDropdown, setShowPostDropdown] = useState<number | null>(null);
  const [showCommentDropdown, setShowCommentDropdown] = useState<number | null>(
    null
  );
  const [showReplyDropdown, setShowReplyDropdown] = useState<number | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState<{
    type: "post" | "comment";
    id: number;
    images?: string[];
    postId?: number;
    parentId?: number | null;
  } | null>(null);
  const router = useRouter();

  const postTypes = [
    { value: "all", label: "Semua", icon: Users, color: "bg-gray-100" },
    { value: "recipe", label: "Resep", icon: ChefHat, color: "bg-orange-100" },
    { value: "story", label: "Cerita", icon: BookOpen, color: "bg-blue-100" },
    {
      value: "question",
      label: "Pertanyaan",
      icon: HelpCircle,
      color: "bg-purple-100",
    },
    { value: "tip", label: "Tips", icon: Lightbulb, color: "bg-yellow-100" },
    { value: "review", label: "Review", icon: Award, color: "bg-green-100" },
  ];
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400); // 400ms debounce
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("community_posts")
        .select(
          `
          *,
          profiles (full_name, username, avatar_url),
          post_likes (user_id),
          comments (
            id,
            content,
            created_at,
            parent_id,
            user_id,
            profiles (full_name, username, avatar_url)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (selectedType !== "all") {
        query = query.eq("type", selectedType);
      }

      if (debouncedSearch) {
        query = query.or(
          `title.ilike.%${debouncedSearch}%,content.ilike.%${debouncedSearch}%,tags.cs.{${debouncedSearch}}`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      // Organize comments into nested structure
      const postsWithNestedComments = (data || []).map(
        (post: CommunityPost) => {
          const allComments: Comment[] = post.comments || [];
          const mainComments = allComments.filter(
            (comment: Comment) => !comment.parent_id
          );
          const nestedComments = mainComments.map((mainComment: Comment) => ({
            ...mainComment,
            replies: allComments.filter(
              (comment: Comment) => comment.parent_id === mainComment.id
            ),
          }));
          return {
            ...post,
            comments: nestedComments,
          };
        }
      );

      setPosts(postsWithNestedComments);
    } catch (err) {
      console.error("Error fetching posts:", err);
      error("Gagal Memuat", "Tidak dapat memuat posting komunitas");
    } finally {
      setLoading(false);
    }
  }, [selectedType, debouncedSearch, error]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useEffect(() => {
    if (!isAuthLoading && !user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("intendedRoute", window.location.pathname);
      }
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const uploadImagesToStorage = async (files: File[]) => {
    if (!user) return [];
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("community")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("community")
        .getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) {
      error("Form Tidak Lengkap", "Harap lengkapi judul dan konten posting");
      return;
    }
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImagesToStorage(selectedImages);
      }
      const { error: insertError } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          type: newPost.type,
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          food_name: newPost.food_name.trim() || null,
          rating: newPost.rating,
          tags: newPost.tags,
          user_avatar_url: userProfile?.avatar_url,
          images: imageUrls,
        });
      if (insertError) throw insertError;
      success("Berhasil", "Posting berhasil dibuat!");
      setShowCreatePost(false);
      setNewPost({
        type: "story",
        title: "",
        content: "",
        food_name: "",
        rating: null,
        tags: [],
      });
      setSelectedImages([]);
      setImagePreviews([]);
      fetchPosts();
      // Trigger push notification to self (optional, or to followers if implemented)
      await triggerPushNotification(user.id, "post_upload", {
        title: "Postingan Berhasil Dibuat",
        body: `Postingan Anda '${newPost.title}' berhasil diunggah ke komunitas!`,
      });
    } catch (err) {
      console.error("Error creating post:", err);
      error("Gagal Membuat Posting", "Terjadi kesalahan saat membuat posting");
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!user) return;
    try {
      const post = posts.find((p) => p.id === postId);
      const isLiked = post?.post_likes.some((like) => like.user_id === user.id);
      if (isLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        await supabase
          .from("community_posts")
          .update({ likes_count: (post?.likes_count || 1) - 1 })
          .eq("id", postId);
      } else {
        // Like
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        await supabase
          .from("community_posts")
          .update({ likes_count: (post?.likes_count || 0) + 1 })
          .eq("id", postId);
        // Trigger push notification to post owner
        if (post && post.user_id !== user.id) {
          await triggerPushNotification(post.user_id, "like", {
            title: "Postingan Anda mendapat Like",
            body: `${
              userProfile?.full_name || user.email
            } menyukai postingan Anda: '${post.title}'`,
            url: `/community#post-${post.id}`,
          });
        }
      }
      fetchPosts();
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleAddComment = async (postId: number, parentId?: number) => {
    const commentKey = parentId ? `${postId}-${parentId}` : postId;
    if (!user || !newComment[commentKey]?.trim()) return;
    try {
      const { error: insertError } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment[commentKey].trim(),
        parent_id: parentId || null,
      });
      if (insertError) throw insertError;
      // Update comments count untuk semua komentar (termasuk reply)
      const post = posts.find((p) => p.id === postId);
      await supabase
        .from("community_posts")
        .update({ comments_count: (post?.comments_count || 0) + 1 })
        .eq("id", postId);
      setNewComment((prev) => ({ ...prev, [commentKey]: "" }));
      setReplyingTo((prev) => ({ ...prev, [postId]: null }));
      fetchPosts();
      // Trigger push notification to post owner (not self)
      if (post && post.user_id !== user.id) {
        await triggerPushNotification(post.user_id, "comment", {
          title: "Komentar Baru di Postingan Anda",
          body: `${
            userProfile?.full_name || user.email
          } mengomentari postingan Anda: '${post.title}'`,
          url: `/community#post-${post.id}`,
        });
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      error("Gagal Menambah Komentar", "Terjadi kesalahan");
    }
  };

  const handleReplyToComment = (
    postId: number,
    commentId: number,
    username: string
  ) => {
    setReplyingTo((prev) => ({ ...prev, [postId]: commentId }));
    const replyKey = `${postId}-${commentId}`;
    setNewComment((prev) => ({
      ...prev,
      [replyKey]: `@${username} `,
    }));
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTypeConfig = (type: string) => {
    const config = postTypes.find((t) => t.value === type);
    return config || postTypes[0];
  };

  const handleDeletePost = async (postId: number, images: string[]) => {
    if (!confirm("Yakin ingin menghapus postingan ini?")) return;
    try {
      // Hapus file gambar di storage
      for (const url of images) {
        const path = url.split("/object/public/community/")[1];
        if (path) await supabase.storage.from("community").remove([path]);
      }
      // Hapus data di tabel
      await supabase.from("community_posts").delete().eq("id", postId);
      success("Berhasil", "Postingan dihapus");
      fetchPosts();
    } catch {
      error("Gagal Hapus", "Tidak bisa menghapus postingan");
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;
    try {
      await supabase.from("comments").delete().eq("id", commentId);
      // Kurangi comments_count untuk semua komentar (termasuk reply)
      const post = posts.find((p) => p.id === postId);
      await supabase
        .from("community_posts")
        .update({ comments_count: (post?.comments_count || 1) - 1 })
        .eq("id", postId);
      success("Berhasil", "Komentar dihapus");
      fetchPosts();
    } catch {
      error("Gagal Hapus", "Tidak bisa menghapus komentar");
    }
  };

  // State untuk show all comments per post
  const [showAllComments, setShowAllComments] = useState<{
    [postId: number]: boolean;
  }>({});

  if (isAuthLoading) return <CommunitySkeleton />;
  if (!user) return null;

  if (!posts || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
        <CommunitySkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-forest-900 mb-4">
            Komunitas NutriMood
          </h1>
          <p className="text-lg text-sage-600 mb-6">
            Berbagi pengalaman dan tips nutrisi dengan komunitas
          </p>

          <button
            onClick={() => setShowCreatePost(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-xl font-medium hover:from-forest-700 hover:to-forest-800 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Posting</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-sage-400" />
                <input
                  type="text"
                  placeholder="Cari posting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {postTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedType === type.value
                        ? `${type.color} text-forest-700`
                        : "text-sage-600 hover:bg-sage-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-sage-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-sage-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-sage-200 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="h-6 bg-sage-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-sage-200 rounded"></div>
                  <div className="h-4 bg-sage-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-sage-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-forest-900 mb-2">
              Belum Ada Posting
            </h3>
            <p className="text-sage-600 mb-6">
              Jadilah yang pertama membagikan pengalaman Anda!
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-xl font-medium hover:from-forest-700 hover:to-forest-800 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Posting Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const typeConfig = getTypeConfig(post.type);
              const isLiked = post.post_likes.some(
                (like) => like.user_id === user.id
              );

              return (
                <div
                  key={post.id}
                  className="relative bg-white rounded-2xl shadow-sm p-6"
                >
                  {/* Post Header */}{" "}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={
                          post.profiles.avatar_url || "/api/placeholder/48/48"
                        }
                        alt="Avatar"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-forest-900">
                          {post.profiles.full_name ||
                            post.profiles.username ||
                            "Pengguna"}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-sage-600">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${typeConfig.color}`}
                          >
                            <typeConfig.icon className="w-3 h-3" />
                            <span>{typeConfig.label}</span>
                          </span>
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {post.is_featured && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    )}

                    {post.user_id === user.id && (
                      <div className="absolute top-2 right-2 z-40">
                        <button
                          onClick={() => {
                            setShowPostDropdown(
                              showPostDropdown === post.id ? null : post.id
                            );
                          }}
                          className="p-1 text-sage-400 hover:text-sage-700"
                          title="Menu"
                        >
                          <svg
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <circle cx="4" cy="10" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="16" cy="10" r="1.5" />
                          </svg>
                        </button>
                        {showPostDropdown === post.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setShowPostDropdown(null);
                              }}
                            />
                            <div className="absolute right-0 top-8 w-32 bg-white border border-sage-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => {
                                  setShowDeleteModal({
                                    type: "post",
                                    id: post.id,
                                    images: post.images,
                                  });
                                  setShowPostDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-sage-50 flex items-center gap-2 text-sm"
                              >
                                <Trash2 className="w-4 h-4" /> Hapus
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Post Content */}
                  <h3 className="text-xl font-semibold text-forest-900 mb-3">
                    {post.title}
                  </h3>
                  <p className="text-sage-700 mb-4 leading-relaxed">
                    {post.content}
                  </p>
                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-2 mb-4">
                      {post.images.map((img, idx) => (
                        <Image
                          key={idx}
                          src={img}
                          alt={`post-img-${idx}`}
                          width={128}
                          height={128}
                          className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() => {
                            setModalImageUrl(img);
                            setShowImageModal(true);
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "/api/placeholder/128/128";
                          }}
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Food Name & Rating */}
                  {post.food_name && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-sage-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ChefHat className="w-4 h-4 text-forest-600" />
                        <span className="font-medium text-forest-900">
                          {post.food_name}
                        </span>
                      </div>
                      {post.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < post.rating!
                                  ? "text-yellow-500 fill-current"
                                  : "text-sage-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-sage-600 ml-1">
                            ({post.rating}/5)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-sage-200">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                          isLiked
                            ? "bg-red-50 text-red-600"
                            : "text-sage-600 hover:bg-sage-50"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                        />
                        <span>{post.likes_count}</span>
                      </button>

                      <div className="flex items-center space-x-2 text-sage-600">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                  </div>{" "}
                  {/* Comments Section */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-sage-200 space-y-4">
                      {(showAllComments[post.id]
                        ? post.comments
                        : post.comments.slice(0, 3)
                      ).map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          {/* Main Comment */}
                          <div className="relative flex space-x-3">
                            <Image
                              src={
                                comment.profiles.avatar_url ||
                                "/api/placeholder/32/32"
                              }
                              alt="Avatar"
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 bg-sage-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm text-forest-900">
                                  {comment.profiles.full_name ||
                                    comment.profiles.username ||
                                    "Pengguna"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-sage-600">
                                    {formatDate(comment.created_at)}
                                  </span>
                                  {comment.user_id === user.id && (
                                    <div className="absolute bottom-2 right-2 z-20">
                                      <button
                                        onClick={() => {
                                          setShowCommentDropdown(
                                            showCommentDropdown === comment.id
                                              ? null
                                              : comment.id
                                          );
                                        }}
                                        className="p-1 text-sage-400 hover:text-sage-700"
                                        title="Menu"
                                      >
                                        <svg
                                          width="18"
                                          height="18"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <circle cx="4" cy="10" r="1.5" />
                                          <circle cx="10" cy="10" r="1.5" />
                                          <circle cx="16" cy="10" r="1.5" />
                                        </svg>
                                      </button>
                                      {showCommentDropdown === comment.id && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => {
                                              setShowCommentDropdown(null);
                                            }}
                                          />
                                          <div className="absolute right-0 bottom-8 w-32 bg-white border border-sage-200 rounded-lg shadow-lg z-50">
                                            <button
                                              onClick={() => {
                                                setShowDeleteModal({
                                                  type: "comment",
                                                  id: comment.id,
                                                  postId: post.id,
                                                });
                                                setShowCommentDropdown(null);
                                              }}
                                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-sage-50 flex items-center gap-2 text-sm"
                                            >
                                              <Trash2 className="w-4 h-4" />{" "}
                                              Hapus
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sage-700 text-sm mb-2">
                                {comment.content}
                              </p>
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() =>
                                    handleReplyToComment(
                                      post.id,
                                      comment.id,
                                      comment.profiles.username ||
                                        comment.profiles.full_name ||
                                        "Pengguna"
                                    )
                                  }
                                  className="text-xs text-forest-600 hover:text-forest-700 font-medium"
                                >
                                  Balas
                                </button>
                                {comment.replies &&
                                  comment.replies.length > 0 && (
                                    <button
                                      onClick={() => toggleReplies(comment.id)}
                                      className="text-xs text-sage-600 hover:text-sage-700 font-medium"
                                    >
                                      {showReplies[comment.id]
                                        ? "Sembunyikan"
                                        : "Lihat"}{" "}
                                      {comment.replies.length} balasan
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* Replies */}
                          {comment.replies &&
                            comment.replies.length > 0 &&
                            showReplies[comment.id] && (
                              <div className="ml-11 space-y-3">
                                {comment.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="relative flex space-x-3"
                                  >
                                    <Image
                                      src={
                                        reply.profiles.avatar_url ||
                                        "/api/placeholder/28/28"
                                      }
                                      alt="Avatar"
                                      width={28}
                                      height={28}
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <div className="flex-1 bg-white border border-sage-200 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm text-forest-900">
                                          {reply.profiles.full_name ||
                                            reply.profiles.username ||
                                            "Pengguna"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-sage-600">
                                            {formatDate(reply.created_at)}
                                          </span>
                                          {reply.user_id === user.id && (
                                            <div className="absolute bottom-2 right-2 z-20">
                                              <button
                                                onClick={() => {
                                                  setShowReplyDropdown(
                                                    showReplyDropdown ===
                                                      reply.id
                                                      ? null
                                                      : reply.id
                                                  );
                                                }}
                                                className="p-1 text-sage-400 hover:text-sage-700"
                                                title="Menu"
                                              >
                                                <svg
                                                  width="18"
                                                  height="18"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <circle
                                                    cx="4"
                                                    cy="10"
                                                    r="1.5"
                                                  />
                                                  <circle
                                                    cx="10"
                                                    cy="10"
                                                    r="1.5"
                                                  />
                                                  <circle
                                                    cx="16"
                                                    cy="10"
                                                    r="1.5"
                                                  />
                                                </svg>
                                              </button>
                                              {showReplyDropdown ===
                                                reply.id && (
                                                <>
                                                  <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => {
                                                      setShowReplyDropdown(
                                                        null
                                                      );
                                                    }}
                                                  />
                                                  <div className="absolute right-0 bottom-8 w-32 bg-white border border-sage-200 rounded-lg shadow-lg z-50">
                                                    <button
                                                      onClick={() => {
                                                        setShowDeleteModal({
                                                          type: "comment",
                                                          id: reply.id,
                                                          postId: post.id,
                                                        });
                                                        setShowReplyDropdown(
                                                          null
                                                        );
                                                      }}
                                                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-sage-50 flex items-center gap-2 text-sm"
                                                    >
                                                      <Trash2 className="w-4 h-4" />{" "}
                                                      Hapus
                                                    </button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sage-700 text-sm">
                                        {reply.content}
                                      </p>
                                      <div className="flex items-center space-x-4 mt-2">
                                        <button
                                          onClick={() =>
                                            handleReplyToComment(
                                              post.id,
                                              comment.id,
                                              reply.profiles.username ||
                                                reply.profiles.full_name ||
                                                "Pengguna"
                                            )
                                          }
                                          className="text-xs text-forest-600 hover:text-forest-700 font-medium"
                                        >
                                          Balas
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Reply Input */}
                          {replyingTo[post.id] === comment.id && (
                            <div className="ml-11 flex space-x-3">
                              <Image
                                src={
                                  userProfile?.avatar_url ||
                                  "/api/placeholder/28/28"
                                }
                                alt="Avatar"
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <div className="flex-1 flex space-x-2">
                                <input
                                  type="text"
                                  placeholder="Tulis balasan..."
                                  value={
                                    newComment[`${post.id}-${comment.id}`] || ""
                                  }
                                  onChange={(e) =>
                                    setNewComment((prev) => ({
                                      ...prev,
                                      [`${post.id}-${comment.id}`]:
                                        e.target.value,
                                    }))
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddComment(post.id, comment.id);
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 text-sm border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sage-900 placeholder-sage-400"
                                  autoFocus
                                />
                                <button
                                  onClick={() =>
                                    handleAddComment(post.id, comment.id)
                                  }
                                  disabled={
                                    !newComment[
                                      `${post.id}-${comment.id}`
                                    ]?.trim()
                                  }
                                  className="px-3 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    setReplyingTo((prev) => ({
                                      ...prev,
                                      [post.id]: null,
                                    }))
                                  }
                                  className="px-3 py-2 text-sage-600 hover:text-sage-700 transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {post.comments.length > 3 &&
                        !showAllComments[post.id] && (
                          <button
                            className="text-sm text-forest-600 hover:text-forest-700 font-medium"
                            onClick={() =>
                              setShowAllComments((prev) => ({
                                ...prev,
                                [post.id]: true,
                              }))
                            }
                          >
                            Lihat {post.comments.length - 3} komentar lainnya
                          </button>
                        )}
                      {post.comments.length > 3 && showAllComments[post.id] && (
                        <button
                          className="text-sm text-forest-600 hover:text-forest-700 font-medium"
                          onClick={() =>
                            setShowAllComments((prev) => ({
                              ...prev,
                              [post.id]: false,
                            }))
                          }
                        >
                          Sembunyikan komentar
                        </button>
                      )}
                    </div>
                  )}{" "}
                  {/* Add Comment */}
                  <div className="mt-4 pt-4 border-t border-sage-200">
                    <div className="flex space-x-3">
                      <Image
                        src={
                          userProfile?.avatar_url || "/api/placeholder/32/32"
                        }
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          placeholder="Tulis komentar..."
                          value={newComment[post.id] || ""}
                          onChange={(e) =>
                            setNewComment((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddComment(post.id);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sage-900 placeholder-sage-400"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                          className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-sage-200">
                <h2 className="text-2xl font-bold text-forest-900">
                  Buat Posting Baru
                </h2>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 text-sage-400 hover:text-sage-600 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Post Type */}
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-3">
                    Jenis Posting
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {postTypes.slice(1).map((type) => {
                      const Icon = type.icon;
                      const isSelected = newPost.type === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() =>
                            setNewPost((prev) => ({
                              ...prev,
                              type: type.value as
                                | "recipe"
                                | "story"
                                | "question"
                                | "tip"
                                | "review",
                            }))
                          }
                          className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-forest-400 ${
                            isSelected
                              ? "border-forest-500 bg-forest-50 text-forest-700"
                              : "border-sage-200 hover:border-sage-300 text-sage-600"
                          }`}
                          type="button"
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              isSelected ? "text-forest-600" : "text-sage-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-forest-700" : "text-sage-600"
                            }`}
                          >
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Judul
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="Masukkan judul posting..."
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Konten
                  </label>{" "}
                  <textarea
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    rows={6}
                    className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sage-900 placeholder-sage-400"
                    placeholder="Tulis konten posting Anda..."
                  />
                </div>

                {/* Food Name (if recipe or review) */}
                {(newPost.type === "recipe" || newPost.type === "review") && (
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Nama Makanan
                    </label>
                    <input
                      type="text"
                      value={newPost.food_name}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          food_name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sage-900 placeholder-sage-400"
                      placeholder="Nama makanan..."
                    />
                  </div>
                )}

                {/* Rating (if review) */}
                {newPost.type === "review" && (
                  <div>
                    <label className="block text-sm font-medium text-sage-700 mb-2">
                      Rating
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() =>
                            setNewPost((prev) => ({ ...prev, rating }))
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              (newPost.rating || 0) >= rating
                                ? "text-yellow-500 fill-current"
                                : "text-sage-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Tags (opsional)
                  </label>{" "}
                  <input
                    type="text"
                    placeholder="Pisahkan dengan koma (contoh: sehat, enak, mudah)"
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean);
                      setNewPost((prev) => ({ ...prev, tags }));
                    }}
                    className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sage-900 placeholder-sage-400"
                  />
                  {newPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newPost.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-2">
                    Gambar (bisa lebih dari satu)
                  </label>
                  <label className="flex flex-col items-center px-4 py-6 bg-white text-forest-700 rounded-lg shadow-md tracking-wide uppercase border border-sage-300 cursor-pointer hover:bg-sage-50 transition-all">
                    <svg
                      className="w-8 h-8 mb-2 text-forest-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                    <span className="text-base leading-normal mb-1">
                      Pilih gambar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <span className="text-xs text-sage-500 mt-1">
                      {selectedImages.length > 0
                        ? `${selectedImages.length} file dipilih`
                        : "Belum ada file dipilih"}
                    </span>
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {imagePreviews.map((src, idx) => (
                        <Image
                          key={idx}
                          src={src}
                          alt="preview"
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-lg border cursor-pointer"
                          onClick={() => {
                            setModalImageUrl(src);
                            setShowImageModal(true);
                          }}
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 p-6 border-t border-sage-200">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-3 text-sage-600 hover:text-sage-700 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-lg font-medium hover:from-forest-700 hover:to-forest-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Posting
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal preview gambar ukuran asli */}
        {showImageModal && modalImageUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setShowImageModal(false)}
          >
            <Image
              src={modalImageUrl}
              alt="modal-img"
              width={512}
              height={512}
              className="max-w-full max-h-full rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.src = "/api/placeholder/512/512";
              }}
              style={{ objectFit: "contain" }}
            />
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-xs w-full text-center">
              <h3 className="text-forest-900 font-bold text-lg mb-2">
                Konfirmasi Hapus
              </h3>
              <p className="text-sage-700 mb-6">
                Yakin ingin menghapus{" "}
                {showDeleteModal.type === "post" ? "posting" : "komentar"} ini?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 rounded-lg bg-sage-100 text-sage-700 hover:bg-sage-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (showDeleteModal.type === "post")
                      handleDeletePost(
                        showDeleteModal.id,
                        showDeleteModal.images || []
                      );
                    else
                      handleDeleteComment(
                        showDeleteModal.id,
                        showDeleteModal.postId!
                      );
                    setShowDeleteModal(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
