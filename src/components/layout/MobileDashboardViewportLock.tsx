"use client";

import { useEffect } from "react";

interface MobileDashboardViewportLockProps {
  containerId: string;
}

export default function MobileDashboardViewportLock({
  containerId,
}: MobileDashboardViewportLockProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    if (!mediaQuery.matches) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const keepViewportStable = () => {
      const container = document.getElementById(containerId);
      const currentContainerScroll = container?.scrollTop ?? 0;

      requestAnimationFrame(() => {
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
        if (container) {
          container.scrollTop = currentContainerScroll;
        }
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.matches("input, textarea, select, [contenteditable='true']")) return;
      keepViewportStable();
    };

    keepViewportStable();
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("orientationchange", keepViewportStable);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("orientationchange", keepViewportStable);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [containerId]);

  return null;
}
