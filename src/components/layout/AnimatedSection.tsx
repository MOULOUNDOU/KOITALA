"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-in";
  delay?: number;
  threshold?: number;
}

export default function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const base = "transition-all ease-out";
  const variants = {
    "fade-up": visible
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-10",
    "fade-in": visible ? "opacity-100" : "opacity-0",
    "slide-left": visible
      ? "opacity-100 translate-x-0"
      : "opacity-0 -translate-x-10",
    "slide-right": visible
      ? "opacity-100 translate-x-0"
      : "opacity-0 translate-x-10",
    "scale-in": visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
  };

  return (
    <div
      ref={ref}
      style={{ transitionDuration: "600ms", transitionDelay: `${delay}ms` }}
      className={cn(base, variants[animation], className)}
    >
      {children}
    </div>
  );
}
