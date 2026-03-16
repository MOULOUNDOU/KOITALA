"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsToggleOption {
  key: string;
  label: string;
  description: string;
}

interface SettingsToggleListProps {
  options: SettingsToggleOption[];
  values: Record<string, boolean>;
  onToggle: (key: string) => void;
}

export default function SettingsToggleList({
  options,
  values,
  onToggle,
}: SettingsToggleListProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const enabled = Boolean(values[option.key]);

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onToggle(option.key)}
            aria-pressed={enabled}
            className={cn(
              "flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
              enabled
                ? "border-[#1a3a5c]/25 bg-[#1a3a5c]/5 shadow-sm"
                : "border-gray-200 bg-white hover:border-[#1a3a5c]/20 hover:bg-[#f8fafc]"
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[#0f1724]">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">
                {option.description}
              </span>
            </span>

            <span
              className={cn(
                "mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors",
                enabled
                  ? "border-[#1a3a5c] bg-[#1a3a5c]"
                  : "border-gray-300 bg-gray-100"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#1a3a5c] shadow-sm transition-transform",
                  enabled ? "translate-x-5" : "translate-x-0"
                )}
              >
                {enabled ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
