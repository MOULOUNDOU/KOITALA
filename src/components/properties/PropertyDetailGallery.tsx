"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, Play, Star, X } from "lucide-react";
import {
  getEmbeddedVideoUrl,
  getListingTypeLabel,
  getPropertyTypeLabel,
  isDirectVideoUrl,
} from "@/lib/utils";
import type { ListingType, PropertyType } from "@/types";

interface GalleryMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt: string;
  posterUrl?: string | null;
}

interface PreparedGalleryMedia extends GalleryMedia {
  embedUrl: string | null;
}

interface PropertyDetailGalleryProps {
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  isFeatured: boolean;
  media: GalleryMedia[];
  variant?: "mobile" | "desktop" | "both";
}

function VideoPlaceholder({ label = "Video" }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(232,184,109,0.22),_transparent_38%),linear-gradient(145deg,_#132740,_#09111d)]">
      <div className="flex flex-col items-center gap-3 text-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-[0_16px_35px_rgba(0,0,0,0.24)] backdrop-blur-sm">
          <Play className="h-6 w-6 fill-current" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function PropertyDetailGallery({
  title,
  listingType,
  propertyType,
  isFeatured,
  media,
  variant = "both",
}: PropertyDetailGalleryProps) {
  const galleryItems = useMemo(() => {
    const seen = new Set<string>();

    return media
      .filter((item) => {
        const mediaKey = `${item.type}:${item.url}`;
        if (!item.url || seen.has(mediaKey)) {
          return false;
        }
        seen.add(mediaKey);
        return true;
      })
      .map((item) => ({
        ...item,
        embedUrl: item.type === "video" ? getEmbeddedVideoUrl(item.url) : null,
      }));
  }, [media]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const safeActiveIndex = activeIndex < galleryItems.length ? activeIndex : 0;
  const activeMedia = galleryItems[safeActiveIndex];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === 0 ? galleryItems.length - 1 : current - 1
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === galleryItems.length - 1 ? 0 : current + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryItems.length, isOpen]);

  if (!activeMedia) {
    return null;
  }

  const openLightbox = (index = safeActiveIndex) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? galleryItems.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === galleryItems.length - 1 ? 0 : current + 1
    );
  };

  const showMobile = variant === "both" || variant === "mobile";
  const showDesktop = variant === "both" || variant === "desktop";

  const renderMainMedia = (
    item: PreparedGalleryMedia,
    sizes: string,
    mode: "mobile" | "desktop"
  ) => {
    if (item.type === "image") {
      return (
        <Image
          src={item.url}
          alt={item.alt}
          fill
          className={mode === "mobile" ? "object-cover object-bottom" : "object-cover transition-transform duration-500 group-hover:scale-[1.015]"}
          priority
          sizes={sizes}
        />
      );
    }

    if (isDirectVideoUrl(item.url)) {
      return (
        <video
          src={item.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={item.posterUrl ?? undefined}
          className="pointer-events-none h-full w-full object-cover"
        />
      );
    }

    if (item.embedUrl) {
      return (
        <iframe
          src={item.embedUrl}
          title={item.alt}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="pointer-events-none h-full w-full border-0"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      );
    }

    return <VideoPlaceholder />;
  };

  const renderThumbnailMedia = (item: PreparedGalleryMedia) => {
    if (item.type === "image") {
      return (
        <Image
          src={item.url}
          alt={item.alt}
          fill
          className="object-cover"
          sizes="80px"
        />
      );
    }

    if (isDirectVideoUrl(item.url)) {
      return (
        <>
          <video
            src={item.url}
            muted
            playsInline
            preload="metadata"
            poster={item.posterUrl ?? undefined}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </>
      );
    }

    if (item.posterUrl) {
      return (
        <>
          <Image
            src={item.posterUrl}
            alt={item.alt}
            fill
            className="object-cover"
            sizes="80px"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/35" />
        </>
      );
    }

    return <VideoPlaceholder label="Media" />;
  };

  const renderLightboxMedia = (item: PreparedGalleryMedia) => {
    if (item.type === "image") {
      return (
        <Image
          src={item.url}
          alt={item.alt}
          width={1800}
          height={1200}
          className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
          priority
        />
      );
    }

    if (isDirectVideoUrl(item.url)) {
      return (
        <video
          src={item.url}
          controls
          autoPlay
          playsInline
          poster={item.posterUrl ?? undefined}
          className="max-h-[82vh] w-auto max-w-full rounded-2xl bg-black shadow-2xl"
        />
      );
    }

    if (item.embedUrl) {
      return (
        <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            src={item.embedUrl}
            title={item.alt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }

    return (
      <div className="relative h-[70vh] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl">
        <VideoPlaceholder label="Video" />
      </div>
    );
  };

  return (
    <>
      {showMobile && (
        <div className="sm:hidden relative pt-20">
          <div className="relative h-[54svh] min-h-[280px] overflow-hidden rounded-b-2xl bg-[#0f1724]">
            {activeMedia.type === "image" && (
              <button
                type="button"
                onClick={() => openLightbox()}
                className="absolute inset-0 z-10 cursor-zoom-in"
                aria-label="Ouvrir le media en plein ecran"
              />
            )}

            {renderMainMedia(activeMedia, "100vw", "mobile")}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between">
              <Link
                href="/biens"
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-[#0f1724]" />
              </Link>
              {isFeatured ? (
                <span className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#e8b86d] px-2.5 py-1.5 text-[11px] font-bold text-[#0f1724] shadow">
                  <Star className="h-3 w-3 fill-[#0f1724]" /> Coup de coeur
                </span>
              ) : (
                <span />
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-3">
              <span
                className={
                  listingType === "vente"
                    ? "rounded-lg bg-[#1a3a5c] px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-lg bg-[#e8b86d] px-3 py-1.5 text-xs font-bold text-[#1a3a5c]"
                }
              >
                {getListingTypeLabel(listingType)}
              </span>

              {activeMedia.type === "image" ? (
                <button
                  type="button"
                  onClick={() => openLightbox()}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#0f1724] shadow-md backdrop-blur-sm transition-transform duration-300 active:scale-[0.98]"
                >
                  <Expand className="h-3.5 w-3.5" />
                  Voir la photo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openLightbox()}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#0f1724] shadow-md backdrop-blur-sm transition-transform duration-300 active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Voir la video
                </button>
              )}
            </div>
          </div>

          {galleryItems.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide">
              {galleryItems.slice(0, 6).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 shadow-sm transition-transform duration-300 ${
                    index === safeActiveIndex
                      ? "scale-[0.98] border-[#1a3a5c]"
                      : "border-white"
                  }`}
                  aria-label={`Afficher le media ${index + 1}`}
                >
                  {renderThumbnailMedia(item)}
                  {item.type === "video" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
                        <Play className="h-3 w-3 fill-current" />
                      </span>
                    </div>
                  )}
                  {index === 5 && galleryItems.length > 6 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <span className="text-xs font-bold text-white">
                        +{galleryItems.length - 6}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showDesktop && (
        <div className="hidden sm:block">
          <div className="group relative h-[28rem] overflow-hidden rounded-2xl bg-[#0f1724] shadow-md">
            {activeMedia.type === "image" && (
              <button
                type="button"
                onClick={() => openLightbox()}
                className="absolute inset-0 z-10 cursor-zoom-in"
                aria-label="Ouvrir le media en plein ecran"
              />
            )}

            {renderMainMedia(activeMedia, "66vw", "desktop")}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <span
                className={
                  listingType === "vente"
                    ? "rounded-lg bg-[#1a3a5c] px-3 py-1.5 text-xs font-bold uppercase text-white"
                    : "rounded-lg bg-[#e8b86d] px-3 py-1.5 text-xs font-bold uppercase text-[#1a3a5c]"
                }
              >
                {getListingTypeLabel(listingType)}
              </span>
              <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700">
                {getPropertyTypeLabel(propertyType)}
              </span>
              {activeMedia.type === "video" && (
                <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f1724]">
                  Video
                </span>
              )}
            </div>

            {isFeatured && (
              <div className="absolute top-4 right-4 z-20">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e8b86d] px-3 py-1.5 text-xs font-bold text-[#0f1724] shadow">
                  <Star className="h-3 w-3 fill-[#0f1724]" /> Coup de coeur
                </span>
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20">
              <button
                type="button"
                onClick={() => openLightbox()}
                className="inline-flex items-center gap-2 rounded-full bg-white/92 px-4 py-2.5 text-sm font-semibold text-[#0f1724] shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]"
              >
                {activeMedia.type === "image" ? (
                  <Expand className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                {activeMedia.type === "image" ? "Ouvrir en grand" : "Voir la video"}
              </button>
            </div>
          </div>

          {galleryItems.length > 1 && (
            <div className="mt-2 grid grid-cols-6 gap-2">
              {galleryItems.slice(0, 8).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 overflow-hidden rounded-lg border transition-all duration-300 ${
                    index === safeActiveIndex
                      ? "border-[#1a3a5c] ring-2 ring-[#1a3a5c]/15"
                      : "border-transparent hover:border-[#1a3a5c]/30"
                  }`}
                  aria-label={`Afficher le media ${index + 1}`}
                >
                  {renderThumbnailMedia(item)}
                  {item.type === "video" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                    </div>
                  )}
                  {index === 7 && galleryItems.length > 8 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                      <span className="text-sm font-bold text-white">
                        +{galleryItems.length - 8}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-[#020711]/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie media de ${title}`}
          onClick={() => setIsOpen(false)}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-white/60">
                  Media {safeActiveIndex + 1} sur {galleryItems.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20"
                aria-label="Fermer la galerie"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center gap-3 px-3 pb-4 sm:px-6">
              {galleryItems.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevious();
                  }}
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20 sm:flex"
                  aria-label="Media precedent"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <div
                className="relative flex max-h-[82vh] w-full max-w-6xl items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                {renderLightboxMedia(activeMedia)}

                {galleryItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevious}
                      className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white transition-colors duration-300 hover:bg-black/55 sm:hidden"
                      aria-label="Media precedent"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white transition-colors duration-300 hover:bg-black/55 sm:hidden"
                      aria-label="Media suivant"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {galleryItems.length > 1 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNext();
                  }}
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20 sm:flex"
                  aria-label="Media suivant"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {galleryItems.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto px-4 pb-5 sm:px-6"
                onClick={(event) => event.stopPropagation()}
              >
                {galleryItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 sm:h-20 sm:w-20 ${
                      index === safeActiveIndex
                        ? "border-white ring-2 ring-white/25"
                        : "border-white/15 opacity-75 hover:opacity-100"
                    }`}
                    aria-label={`Afficher le media ${index + 1}`}
                  >
                    {renderThumbnailMedia(item)}
                    {item.type === "video" && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white">
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
