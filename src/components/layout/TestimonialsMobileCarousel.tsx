"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  stars: number;
  avatar: string;
}

interface TestimonialsMobileCarouselProps {
  testimonials: readonly TestimonialItem[];
}

export default function TestimonialsMobileCarousel({
  testimonials,
}: TestimonialsMobileCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = testimonials.length;

  useEffect(() => {
    if (totalSlides <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current === totalSlides - 1 ? 0 : current + 1));
    }, 4000);

    return () => window.clearInterval(interval);
  }, [totalSlides]);

  if (totalSlides === 0) {
    return null;
  }

  const activeIndex = currentIndex < totalSlides ? currentIndex : 0;

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? totalSlides - 1 : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === totalSlides - 1 ? 0 : current + 1));
  };

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-[1.75rem]">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <article key={testimonial.name} className="w-full shrink-0">
              <div className="flex min-h-[264px] flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.stars }).map((_, starIndex) => (
                      <Star
                        key={`${testimonial.name}-star-${starIndex}`}
                        className="h-4 w-4 fill-[#e8b86d] text-[#e8b86d]"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a3a5c]/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="flex-1 text-[14px] italic leading-[1.6] text-gray-600">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3a5c] text-sm font-bold text-white">
                    {testimonial.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold leading-5 text-[#0f1724]">
                      {testimonial.name}
                    </p>
                    <p className="mt-1 break-words text-[12px] leading-[1.45] text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1a3a5c]/15 bg-white text-[#1a3a5c] shadow-sm transition-all duration-300 active:scale-[0.96]"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.name}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller au témoignage ${index + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  index === activeIndex
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
            aria-label="Témoignage suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
