"use client";

import { Play, VolumeX } from "lucide-react";
import { cn, getEmbeddedVideoUrl, getPropertyImageUrls, isDirectVideoUrl } from "@/lib/utils";
import type { Property } from "@/types";
import PropertyImageCarousel from "@/components/properties/PropertyImageCarousel";

interface PropertyCardMediaProps {
  property: Property;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  compact?: boolean;
  preferVideoBubble?: boolean;
  bubbleClassName?: string;
  fallbackImageUrl?: string;
  showVideoBadge?: boolean;
  children?: React.ReactNode;
}

export default function PropertyCardMedia({
  property,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
  compact = false,
  preferVideoBubble = false,
  fallbackImageUrl,
  showVideoBadge = true,
  children,
}: PropertyCardMediaProps) {
  const imageUrls = getPropertyImageUrls(
    property,
    fallbackImageUrl ?? "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80"
  );
  const hasRealImageMedia =
    Boolean(property.main_image_url) ||
    (property.property_images?.some((image) => Boolean(image.url)) ?? false);
  const videoUrl = property.video_url?.trim() || null;
  const embeddedVideoUrl = videoUrl ? getEmbeddedVideoUrl(videoUrl) : null;
  const directVideoPreview = preferVideoBubble && videoUrl && isDirectVideoUrl(videoUrl) ? videoUrl : null;
  const embeddedVideoPreview = preferVideoBubble && !directVideoPreview ? embeddedVideoUrl : null;
  const videoPosterUrl = hasRealImageMedia ? imageUrls[0] : undefined;
  const showVideoFallback = preferVideoBubble && Boolean(videoUrl) && !directVideoPreview && !embeddedVideoPreview;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {directVideoPreview ? (
        <div className="absolute inset-0 bg-[#09111d]">
          <video
            src={directVideoPreview}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={videoPosterUrl}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            <VolumeX className="h-3 w-3" />
            Sans son
          </div>
          {showVideoBadge && (
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f1724] shadow-sm">
              <Play className="h-3 w-3 fill-current" />
              Video
            </div>
          )}
        </div>
      ) : embeddedVideoPreview ? (
        <div className="absolute inset-0 bg-[#09111d]">
          <iframe
            src={embeddedVideoPreview}
            title={alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          {showVideoBadge && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Play className="h-3 w-3 fill-current" />
              Video
            </div>
          )}
        </div>
      ) : showVideoFallback ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,184,109,0.24),_transparent_42%),linear-gradient(145deg,_#132740,_#09111d)]">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-[0_16px_35px_rgba(0,0,0,0.25)] backdrop-blur-sm">
              <Play className="h-6 w-6 fill-current" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
              Video disponible
            </span>
          </div>
        </div>
      ) : (
        <PropertyImageCarousel
          images={imageUrls}
          alt={alt}
          sizes={sizes}
          className="absolute inset-0"
          imageClassName={imageClassName}
          priority={priority}
          compact={compact}
        />
      )}

      {children}
    </div>
  );
}
