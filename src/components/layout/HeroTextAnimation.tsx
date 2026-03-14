"use client";

import { useEffect, useState } from "react";

const WORDS = ["immobilier", "de confiance", "au Sénégal", "des expatriés"];

export default function HeroTextAnimation() {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const currentWord = WORDS[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!deleting) {
          // Typing
          if (charIndex < currentWord.length) {
            setCharIndex((c) => c + 1);
          } else {
            // Pause at full word, then start deleting
            setTimeout(() => setDeleting(true), 2000);
          }
        } else {
          // Deleting
          if (charIndex > 0) {
            setCharIndex((c) => c - 1);
          } else {
            setDeleting(false);
            setWordIndex((i) => (i + 1) % WORDS.length);
          }
        }
      },
      deleting ? 40 : 80
    );

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, wordIndex, mounted]);

  const displayed = WORDS[wordIndex].slice(0, charIndex);

  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-5">
      Votre partenaire{" "}
      <br className="sm:hidden" />
      <span className="text-[#e8b86d] inline-block min-w-[200px] sm:min-w-[280px] text-left sm:text-center">
        {mounted ? displayed : WORDS[0]}
        <span className="inline-block w-[3px] h-[0.85em] bg-[#e8b86d] ml-0.5 align-middle animate-blink" />
      </span>
    </h1>
  );
}
