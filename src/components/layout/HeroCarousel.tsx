"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85",
    alt: "Villa moderne avec piscine",
  },
  {
    src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=85",
    alt: "Appartement de luxe vue mer",
  },
  {
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=85",
    alt: "Maison contemporaine",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85",
    alt: "Residence haut standing",
  },
  {
    src: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&q=85",
    alt: "Villa avec jardin",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => {
        setPrev(c);
        return (c + 1) % SLIDES.length;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Previous slide — fades out */}
      {prev !== null && (
        <div key={`prev-${prev}`} className="absolute inset-0 animate-hero-fade-out">
          <Image
            src={SLIDES[prev].src}
            alt={SLIDES[prev].alt}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Current slide — fades in */}
      <div key={`cur-${current}`} className="absolute inset-0 animate-hero-fade-in">
        <Image
          src={SLIDES[current].src}
          alt={SLIDES[current].alt}
          fill
          className="object-cover"
          priority={current === 0}
          sizes="100vw"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1724]/75 via-[#0f1724]/60 to-[#0f1724]/80" />

      {/* Dot indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setPrev(current); setCurrent(i); }}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? "w-6 h-2 bg-[#e8b86d]"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
