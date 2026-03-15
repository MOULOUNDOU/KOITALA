"use client";

import { Play, VolumeX } from "lucide-react";
import { cn, getPropertyImageUrls, hasPropertyImageMedia, isDirectVideoUrl } from "@/lib/utils";
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
  bubbleClassName,
  fallbackImageUrl,
  children,
}: PropertyCardMediaProps) {
  const imageUrls = getPropertyImageUrls(
    property,
    fallbackImageUrl ?? "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80"
  );
  const hasImageMedia = hasPropertyImageMedia(property);
  const directVideoPreview = preferVideoBubble && !hasImageMedia && isDirectVideoUrl(property.video_url);
  const hasVideoOnly = preferVideoBubble && !hasImageMedia && Boolean(property.video_url);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {directVideoPreview ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,184,109,0.26),_transparent_45%),linear-gradient(145deg,_#132740,_#09111d)]">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={cn(
                "relative h-36 w-36 overflow-hidden rounded-full border border-white/15 shadow-[0_20px_45px_rgba(0,0,0,0.35)]",
                bubbleClassName
              )}
            >
              <video
                src={property.video_url ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            <VolumeX className="h-3 w-3" />
            Sans son
          </div>
        </div>
      ) : hasVideoOnly ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,184,109,0.22),_transparent_48%),linear-gradient(145deg,_#132740,_#09111d)]">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={cn(
                "flex h-36 w-36 flex-col items-center justify-center rounded-full border border-dashed border-white/25 bg-white/6 text-white",
                bubbleClassName
              )}
            >
              <Play className="mb-2 h-8 w-8 fill-current" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Video</span>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            <VolumeX className="h-3 w-3" />
            Sans son
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
