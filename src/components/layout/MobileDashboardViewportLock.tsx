"use client";

import { useEffect } from "react";

export default function MobileDashboardViewportLock() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehaviorY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehaviorY;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehaviorY = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehaviorY = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehaviorY = previousHtmlOverscroll;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehaviorY = previousBodyOverscroll;
    };
  }, []);

  return null;
}
