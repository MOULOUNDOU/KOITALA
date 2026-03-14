"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
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

  // iOS keyboard can shift viewport after the first frame.
  window.setTimeout(() => {
    scrollRoot.scrollTop = lockedScrollTop;
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  }, 120);
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, onFocus, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(event) => {
              stabilizeMobileDashboardFocus(event.currentTarget);
              onFocus?.(event);
            }}
            className={cn(
              "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]",
              "transition duration-150",
              "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
              icon && "pl-10",
              error && "border-red-400 focus:ring-red-200 focus:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
