"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  group: string;
  options: SelectOption[];
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  label?: string;
  icon?: ReactNode;
  searchable?: boolean;
  clearable?: boolean;
  className?: string;
  disabled?: boolean;
  dropUp?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder = "Sélectionner...",
  label,
  icon,
  searchable = false,
  clearable = false,
  className,
  disabled = false,
  dropUp = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const allOptions = groups.length > 0
    ? groups.flatMap((g) => g.options)
    : options;

  const selected = allOptions.find((o) => o.value === value);

  const filterOpt = (opt: SelectOption) =>
    opt.label.toLowerCase().includes(search.toLowerCase());

  const filteredOptions = options.filter(filterOpt);
  const filteredGroups = groups
    .map((g) => ({ ...g, options: g.options.filter(filterOpt) }))
    .filter((g) => g.options.length > 0);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm text-left transition-all duration-200 bg-white",
          open
            ? "border-[#1a3a5c] ring-2 ring-[#1a3a5c]/20 shadow-sm"
            : "border-gray-200 hover:border-[#1a3a5c]/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <span className={cn("flex-1 truncate", !selected && "text-gray-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          "absolute left-0 right-0 z-[100] bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden transition-all duration-200",
          dropUp ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
          open
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : dropUp
              ? "opacity-0 scale-y-95 translate-y-2 pointer-events-none"
              : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
        )}
      >
        {/* Search */}
        {searchable && (
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#f8f9fb] rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1a3a5c]/30 transition-all"
              />
            </div>
          </div>
        )}

        {/* Options list */}
        <div className="max-h-56 overflow-y-auto py-1.5 scrollbar-hide">
          {/* Empty placeholder option */}
          {placeholder && (
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                value === ""
                  ? "bg-[#1a3a5c]/8 text-[#1a3a5c] font-medium"
                  : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <span className="flex-1">{placeholder}</span>
              {value === "" && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          )}

          {/* Flat options */}
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                value === opt.value
                  ? "bg-[#1a3a5c] text-white font-medium"
                  : "text-gray-700 hover:bg-[#f4f6f9] hover:text-[#1a3a5c]"
              )}
            >
              <span className="flex-1">{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}

          {/* Grouped options */}
          {filteredGroups.map((g) => (
            <div key={g.group}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {g.group}
              </p>
              {g.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left",
                    value === opt.value
                      ? "bg-[#1a3a5c] text-white font-medium"
                      : "text-gray-700 hover:bg-[#f4f6f9] hover:text-[#1a3a5c]"
                  )}
                >
                  <span className="flex-1">{opt.label}</span>
                  {value === opt.value && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          ))}

          {/* No results */}
          {search && filteredOptions.length === 0 && filteredGroups.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">Aucun résultat</p>
          )}
        </div>
      </div>
    </div>
  );
}
