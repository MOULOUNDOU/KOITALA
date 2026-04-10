"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, Plus, Trash2, Eye, Upload, Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getEmbeddedVideoUrl, getStatusColor, getStatusLabel, isDirectVideoUrl } from "@/lib/utils";
import type { BlogPost } from "@/types";

const createInitialForm = () => ({
  title: "",
  excerpt: "",
  content: "",
  category: "",
  cover_image_url: "",
  video_url: "",
  status: "brouillon",
});

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

function normalizeOptionalText(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function createUploadToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Math.floor(Math.random() * 1_000_000_000)}`;
}

export default function DashboardBlogPage() {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(createInitialForm);
  const [saving, setSaving] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageFallbackUrl, setCoverImageFallbackUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFallbackUrl, setVideoFallbackUrl] = useState<string | null>(null);
  const currentVideoUrl = form.video_url.trim();
  const currentCoverImageUrl = form.cover_image_url.trim();
  const displayedCoverImage = coverImagePreview || currentCoverImageUrl || null;
  const directVideoPreview =
    videoPreview || (currentVideoUrl && isDirectVideoUrl(currentVideoUrl) ? currentVideoUrl : null);
  const embeddedVideoPreview =
    !videoPreview && currentVideoUrl ? getEmbeddedVideoUrl(currentVideoUrl) : null;

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*, author:profiles(full_name)")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    return () => {
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [coverImagePreview, videoPreview]);

  const resetMediaState = () => {
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
    }
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setCoverImageFallbackUrl(null);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoFallbackUrl(null);
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("L'image ne doit pas dépasser 10 MB.");
      return;
    }
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImageFallbackUrl(currentCoverImageUrl || null);
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const removeCoverImage = () => {
    if (coverImageFile) {
      const fallbackUrl = coverImageFallbackUrl ?? "";
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setCoverImageFallbackUrl(null);
      setForm((current) => ({ ...current, cover_image_url: fallbackUrl }));
      return;
    }
    setForm((current) => ({ ...current, cover_image_url: "" }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("La vidéo ne doit pas dépasser 100 MB.");
      return;
    }
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFallbackUrl(currentVideoUrl || null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoFile) {
      const fallbackUrl = videoFallbackUrl ?? "";
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoFile(null);
      setVideoPreview(null);
      setVideoFallbackUrl(null);
      setForm((current) => ({ ...current, video_url: fallbackUrl }));
      return;
    }
    setForm((current) => ({ ...current, video_url: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const slug = form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + "-" + Date.now();
      const publishedAt = form.status === "publie" ? new Date().toISOString() : null;
      let coverImageUrl = normalizeOptionalText(form.cover_image_url);
      let videoUrl = normalizeOptionalText(form.video_url);

      if (coverImageFile) {
        const ext = coverImageFile.name.split(".").pop() || "jpg";
        const imagePath = `blog-posts/${slug}/cover-${createUploadToken()}.${ext}`;
        const { data: uploadedCoverImage, error: coverImageUploadError } = await supabase.storage
          .from("blog-images")
          .upload(imagePath, coverImageFile);

        if (coverImageUploadError || !uploadedCoverImage) {
          toast.error("L'envoi de l'image de couverture a échoué.");
          return;
        }

        const { data: coverImagePublicUrl } = supabase.storage
          .from("blog-images")
          .getPublicUrl(imagePath);
        coverImageUrl = coverImagePublicUrl.publicUrl;
      }

      if (videoFile) {
        const ext = videoFile.name.split(".").pop() || "mp4";
        const videoPath = `blog-posts/${slug}/video-${createUploadToken()}.${ext}`;
        const { data: uploadedVideo, error: videoUploadError } = await supabase.storage
          .from("blog-videos")
          .upload(videoPath, videoFile);

        if (videoUploadError || !uploadedVideo) {
          toast.error("L'envoi de la vidéo a échoué. Vérifiez le bucket blog-videos.");
          return;
        }

        const { data: videoPublicUrl } = supabase.storage
          .from("blog-videos")
          .getPublicUrl(videoPath);
        videoUrl = videoPublicUrl.publicUrl;
      }

      const { error: insertError } = await supabase.from("blog_posts").insert({
        title: form.title.trim(),
        excerpt: normalizeOptionalText(form.excerpt),
        content: form.content.trim(),
        category: normalizeOptionalText(form.category),
        cover_image_url: coverImageUrl,
        video_url: videoUrl,
        status: form.status,
        slug,
        author_id: user.id,
        published_at: publishedAt,
      });

      if (insertError) {
        toast.error("Erreur lors de la création de l'article.");
        return;
      }

      setForm(createInitialForm());
      resetMediaState();
      setShowForm(false);
      await fetchPosts();
      toast.success("Article enregistré.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    await fetchPosts();
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "publie" ? "brouillon" : "publie";
    await supabase.from("blog_posts").update({
      status: newStatus,
      published_at: newStatus === "publie" ? new Date().toISOString() : null,
    }).eq("id", post.id);
    await fetchPosts();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[1.35rem] font-bold text-[#0f1724] sm:text-[1.5rem] lg:text-2xl">Blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} article{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouvel article
        </button>
      </div>

      {showForm && (
        <div className="mb-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-semibold text-[#0f1724]">Nouvel article</h2>
          <input
            placeholder="Titre *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          <input
            placeholder="Résumé (extrait)"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          <input
            placeholder="Catégorie"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          <input
            placeholder="Image de couverture (URL)"
            value={form.cover_image_url}
            onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          {!displayedCoverImage ? (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-[#1a3a5c]/50 hover:bg-gray-50">
              <Upload className="mb-2 h-7 w-7 text-gray-300" />
              <span className="text-sm text-gray-500">Ajouter une image depuis l&apos;appareil</span>
              <span className="mt-0.5 text-xs text-gray-400">PNG, JPG, WEBP jusqu&apos;à 10 MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageUpload}
              />
            </label>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayedCoverImage}
                alt="Image de couverture"
                className="h-48 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={removeCoverImage}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>
                  {coverImageFile
                    ? `${coverImageFile.name} (${(coverImageFile.size / (1024 * 1024)).toFixed(1)} MB)`
                    : "Image actuellement renseignée"}
                </span>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a3a5c] hover:text-[#0f2540]">
                <Upload className="h-4 w-4" />
                Remplacer l&apos;image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageUpload}
                />
              </label>
            </div>
          )}
          <input
            placeholder="Vidéo (URL YouTube, Vimeo ou MP4/WebM)"
            value={form.video_url}
            onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          {!directVideoPreview && !embeddedVideoPreview ? (
            <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-[#1a3a5c]/50 hover:bg-gray-50">
              <Video className="mb-2 h-7 w-7 text-gray-300" />
              <span className="text-sm text-gray-500">Ajouter une vidéo depuis l&apos;appareil</span>
              <span className="mt-0.5 text-xs text-gray-400">MP4, MOV, WEBM jusqu&apos;à 100 MB</span>
              <input
                type="file"
                accept="video/mp4,video/mov,video/webm,video/quicktime"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </label>
          ) : (
            <div className="relative">
              {directVideoPreview ? (
                <video
                  src={directVideoPreview}
                  controls
                  className="w-full max-h-56 rounded-xl bg-black"
                />
              ) : (
                <iframe
                  src={embeddedVideoPreview ?? undefined}
                  title="Vidéo de l'article"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full aspect-video rounded-xl border-0 bg-black"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
              <button
                type="button"
                onClick={removeVideo}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white transition-all hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span>
                  {videoFile
                    ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)`
                    : "Vidéo actuellement renseignée"}
                </span>
              </div>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a3a5c] hover:text-[#0f2540]">
                <Upload className="h-4 w-4" />
                Remplacer la vidéo
                <input
                  type="file"
                  accept="video/mp4,video/mov,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </label>
            </div>
          )}
          <textarea
            placeholder="Contenu (HTML supporté) *"
            rows={8}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c] resize-y"
          />
          <div className="rounded-2xl bg-[#f8fafc] p-3 sm:bg-transparent sm:p-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <label htmlFor="blog-status" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Statut de l&apos;article
                </label>
                <select
                  id="blog-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 sm:min-w-[180px]"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(createInitialForm());
                    resetMediaState();
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title || !form.content}
                  className="w-full rounded-xl bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540] disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Enregistrement..." : "Publier l'article"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-14 h-14 text-gray-200 mb-3" />
            <p className="text-gray-500">Aucun article pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0f1724] truncate">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.category && <span className="mr-2">{post.category}</span>}
                    {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                  {getStatusLabel(post.status)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {post.status === "publie" && (
                    <Link href={`/blog/${post.slug}`} target="_blank" className="p-1.5 text-gray-400 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => toggleStatus(post)}
                    className="p-1.5 text-gray-400 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg text-xs px-2"
                    title={post.status === "publie" ? "Dépublier" : "Publier"}
                  >
                    {post.status === "publie" ? "Dépublier" : "Publier"}
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
