"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxChoiceOption {
  value: string;
  label: string;
  description?: string;
}

interface CheckboxChoiceGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CheckboxChoiceOption[];
  columns?: 1 | 2 | 3;
  className?: string;
  labelClassName?: string;
}

const GRID_CLASS_BY_COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
} as const;

export default function CheckboxChoiceGroup({
  label,
  value,
  onChange,
  options,
  columns = 2,
  className,
  labelClassName,
}: CheckboxChoiceGroupProps) {
  return (
    <div className={className}>
      <label
        className={cn(
          "mb-2 block text-sm font-medium text-gray-700",
          labelClassName
        )}
      >
        {label}
      </label>

      <div className={cn("grid gap-3", GRID_CLASS_BY_COLUMNS[columns])}>
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(checked ? "" : option.value)}
              aria-pressed={checked}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                checked
                  ? "border-[#1a3a5c] bg-[#1a3a5c]/5 shadow-sm"
                  : "border-gray-200 bg-white hover:border-[#1a3a5c]/35 hover:bg-[#f8fafc]"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  checked
                    ? "border-[#1a3a5c] bg-[#1a3a5c] text-white"
                    : "border-gray-300 bg-white text-transparent"
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0f1724]">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
