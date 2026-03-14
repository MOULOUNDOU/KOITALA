"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PropertyImageCarouselProps {
  images: string[];
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  compact?: boolean;
}

export default function PropertyImageCarousel({
  images,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
  compact = false,
}: PropertyImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const hasMultiple = images.length > 1;

  const goPrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goTo = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(index);
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image
        src={images[current]}
        alt={`${alt} - photo ${current + 1}`}
        fill
        className={cn("object-cover", imageClassName)}
        sizes={sizes}
        priority={priority}
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={goPrev}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 transition-colors",
              compact ? "w-6 h-6" : "w-8 h-8"
            )}
          >
            <ChevronLeft className={cn("mx-auto", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={goNext}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 transition-colors",
              compact ? "w-6 h-6" : "w-8 h-8"
            )}
          >
            <ChevronRight className={cn("mx-auto", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {images.map((_, index) => (
              <button
                key={`${alt}-dot-${index}`}
                type="button"
                aria-label={`Voir la photo ${index + 1}`}
                onClick={(e) => goTo(index, e)}
                className={cn(
                  "rounded-full transition-all",
                  compact ? "w-1.5 h-1.5" : "w-2 h-2",
                  index === current ? "bg-[#e8b86d]" : "bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
