"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroChip {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

interface ClientPageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  chips?: HeroChip[];
  actions?: ReactNode;
  className?: string;
}

export default function ClientPageHero({
  eyebrow = "Espace client KOITALA",
  title,
  description,
  chips = [],
  actions,
  className,
}: ClientPageHeroProps) {
  return (
    <section className={cn("rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-gray-600">{description}</p>
        </div>

        {actions ? (
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex min-w-max items-center gap-2 [&>*]:shrink-0 sm:min-w-0 sm:flex-wrap sm:justify-end">
              {actions}
            </div>
          </div>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <div
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0f1724]"
            >
              <chip.icon className="h-3.5 w-3.5 text-[#1a3a5c]" />
              <span className="text-[#1a3a5c]">{chip.value}</span>
              <span>{chip.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
