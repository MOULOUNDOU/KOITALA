export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Tag, ArrowRight, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Blog Immobilier",
  description: "Conseils, actualités et guides immobiliers par KOITALA.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog immobilier KOITALA",
    description: "Conseils, actualites et guides immobiliers par KOITALA.",
    url: absoluteUrl("/blog"),
  },
};

async function getPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(full_name, avatar_url)")
    .eq("status", "publie")
    .order("published_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <div className="bg-[#0f1724] pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Blog Immobilier</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Conseils d&apos;experts, tendances du marché et guides pratiques pour votre projet immobilier.
          </p>
        </div>
      </div>

      <section className="py-16 bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    {post.cover_image_url ? (
                      <Image
                        src={post.cover_image_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {post.category && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#1a3a5c] text-white text-xs font-medium rounded-lg">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.published_at ? formatDate(post.published_at) : ""}
                      </span>
                      {post.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {post.category}
                        </span>
                      )}
                    </div>
                    <h2 className="font-semibold text-[#0f1724] leading-snug mb-2 group-hover:text-[#1a3a5c] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-4 text-[#1a3a5c] text-xs font-medium">
                      Lire la suite <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Aucun article pour le moment
              </h3>
              <p className="text-sm text-gray-400">Revenez bientôt pour nos conseils immobiliers.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
