"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

function stabilizeMobileDashboardFocus(target: HTMLElement) {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;

  const scrollRoot = target.closest<HTMLElement>("[data-dashboard-scroll-root]");
  if (!scrollRoot) return;

  const lockedScrollTop = scrollRoot.scrollTop;
  requestAnimationFrame(() => {
    scrollRoot.scrollTop = lockedScrollTop;
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  });

  window.setTimeout(() => {
    scrollRoot.scrollTop = lockedScrollTop;
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  }, 120);
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, onFocus, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          onFocus={(event) => {
            stabilizeMobileDashboardFocus(event.currentTarget);
            onFocus?.(event);
          }}
          className={cn(
            "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 resize-y min-h-[100px]",
            "focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]",
            "transition duration-150",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            error && "border-red-400 focus:ring-red-200 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
