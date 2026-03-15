"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Property } from "@/types";
import PropertyCardHorizontal from "@/components/properties/PropertyCardHorizontal";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";

interface HomePropertyCarouselProps {
  properties: Property[];
  variant?: "mobile-card" | "horizontal";
  preferVideoBubble?: boolean;
}

export default function HomePropertyCarousel({
  properties,
  variant = "mobile-card",
  preferVideoBubble = false,
}: HomePropertyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = properties.length;

  useEffect(() => {
    if (totalSlides <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current === totalSlides - 1 ? 0 : current + 1));
    }, 4000);

    return () => window.clearInterval(interval);
  }, [totalSlides]);

  useEffect(() => {
    if (currentIndex < totalSlides) {
      return;
    }
    setCurrentIndex(0);
  }, [currentIndex, totalSlides]);

  if (totalSlides === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? totalSlides - 1 : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === totalSlides - 1 ? 0 : current + 1));
  };

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-[28px]">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {properties.map((property) => (
            <div key={property.id} className="w-full shrink-0">
              {variant === "horizontal" ? (
                <PropertyCardHorizontal property={property} preferVideoBubble={preferVideoBubble} />
              ) : (
                <PropertyCardMobile property={property} preferVideoBubble={preferVideoBubble} />
              )}
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1a3a5c]/15 bg-white text-[#1a3a5c] shadow-sm transition-all duration-300 active:scale-[0.96]"
            aria-label="Annonce précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {properties.map((property, index) => (
              <button
                key={property.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller à l'annonce ${index + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "h-2.5 w-8 bg-[#1a3a5c]"
                    : "h-2.5 w-2.5 bg-[#e8b86d]/45"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goToNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a5c] text-white shadow-sm transition-all duration-300 active:scale-[0.96]"
            aria-label="Annonce suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
