"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { BlogPost } from "@/types";

export default function DashboardBlogPage() {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", category: "", status: "brouillon",
  });
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*, author:profiles(full_name)")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPosts();
  }, [fetchPosts]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const slug = form.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-") + "-" + Date.now();
    const publishedAt = form.status === "publie" ? new Date().toISOString() : null;
    await supabase.from("blog_posts").insert({
      ...form, slug, author_id: user!.id, published_at: publishedAt,
    });
    setForm({ title: "", excerpt: "", content: "", category: "", status: "brouillon" });
    setShowForm(false);
    setSaving(false);
    await fetchPosts();
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
          <h1 className="text-2xl font-bold text-[#0f1724]">Blog</h1>
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

              <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:justify-end">
                <button
                  onClick={() => setShowForm(false)}
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
