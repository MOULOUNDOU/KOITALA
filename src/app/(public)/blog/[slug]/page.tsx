export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Tag, ArrowLeft, User, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, getEmbeddedVideoUrl, isDirectVideoUrl } from "@/lib/utils";
import {
  absoluteUrl,
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  resolveSeoImages,
  sanitizeDescription,
  serializeJsonLd,
} from "@/lib/seo";
import type { BlogPost } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(full_name, avatar_url)")
    .eq("slug", slug)
    .eq("status", "publie")
    .single();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article non trouvé" };

  const canonicalPath = `/blog/${post.slug}`;
  const description = sanitizeDescription(post.excerpt, post.title);
  const images = resolveSeoImages(post.cover_image_url);

  return {
    title: post.title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      url: absoluteUrl(canonicalPath),
      title: post.title,
      description,
      images,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const videoUrl = post.video_url?.trim() || null;
  const directVideoUrl = videoUrl && isDirectVideoUrl(videoUrl) ? videoUrl : null;
  const embeddedVideoUrl = videoUrl && !directVideoUrl ? getEmbeddedVideoUrl(videoUrl) : null;

  const postJsonLd = buildBlogPostingJsonLd(post);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Accueil", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(postJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="bg-[#0f1724] pt-28 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>
          {post.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e8b86d]/20 text-[#e8b86d] text-xs font-medium rounded-full mb-4">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-5">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {(post.author as { full_name: string } | null)?.full_name ?? "KOITALA"}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(post.published_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {post.cover_image_url && (
          <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden shadow-md mb-10">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}
        {directVideoUrl && (
          <div className="mb-10 overflow-hidden rounded-2xl bg-black shadow-md">
            <video
              src={directVideoUrl}
              controls
              playsInline
              preload="metadata"
              poster={post.cover_image_url ?? undefined}
              className="h-auto w-full"
            />
          </div>
        )}
        {embeddedVideoUrl && (
          <div className="relative mb-10 overflow-hidden rounded-2xl bg-black shadow-md">
            <div className="relative pb-[56.25%]">
              <iframe
                src={embeddedVideoUrl}
                title={`Video ${post.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        )}
        {videoUrl && !directVideoUrl && !embeddedVideoUrl && (
          <div className="mb-10 rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#1a3a5c] hover:text-[#0f2540] transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Voir la vidéo associée à cet article
            </a>
          </div>
        )}

        {post.excerpt && (
          <p className="text-lg text-gray-500 italic border-l-4 border-[#e8b86d] pl-4 mb-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div
          className="prose prose-gray max-w-none prose-headings:text-[#0f1724] prose-a:text-[#1a3a5c] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#1a3a5c] hover:text-[#e8b86d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Tous les articles
          </Link>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
}
