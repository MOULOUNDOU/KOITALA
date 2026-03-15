"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { HOW_IT_WORKS_STEPS } from "@/components/layout/howItWorksData";

export default function HowItWorksMobileCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndex = HOW_IT_WORKS_STEPS.length - 1;

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? lastIndex : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === lastIndex ? 0 : current + 1));
  };

  return (
    <div className="sm:hidden">
      <div className="overflow-hidden rounded-[30px]">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {HOW_IT_WORKS_STEPS.map((item) => (
            <div key={item.step} className="w-full shrink-0">
              <div className="rounded-[30px] border border-[#1a3a5c]/10 bg-[linear-gradient(180deg,_#ffffff,_#f7f2e8)] p-6 shadow-[0_18px_40px_rgba(15,37,64,0.08)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a5c] shadow-lg">
                    <item.icon className="h-6 w-6 text-[#e8b86d]" />
                  </div>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#e8b86d] px-3 text-sm font-extrabold text-[#1a3a5c]">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0f1724]">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goToPrevious}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#1a3a5c]/15 bg-white text-[#1a3a5c] shadow-sm transition-all duration-300 active:scale-[0.96]"
          aria-label="Étape précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Aller à l'étape ${item.step}`}
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1a3a5c] text-white shadow-sm transition-all duration-300 active:scale-[0.96]"
          aria-label="Étape suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
