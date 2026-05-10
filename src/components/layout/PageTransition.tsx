"use client";

import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  const LOADING_DURATION_MS = 300;
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPathRef = useRef("");

  const showLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(true);
    timeoutRef.current = setTimeout(() => setLoading(false), LOADING_DURATION_MS);
  }, []);

  useEffect(() => {
    if (currentPathRef.current && currentPathRef.current !== pathname) {
      const frame = requestAnimationFrame(showLoading);
      currentPathRef.current = pathname;
      return () => cancelAnimationFrame(frame);
    }

    currentPathRef.current = pathname;
  }, [pathname, showLoading]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const nextUrl = new URL(target.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);
      const samePathAndQuery =
        nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search;

      if (samePathAndQuery) return;

      showLoading();
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showLoading]);

  return (
    <>
      {loading && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-[#1a3a5c] shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin" />
            Koitala
          </div>
        </div>
      )}
      {children}
    </>
  );
}
