/* eslint-disable @next/next/no-img-element */

import { Building2, CalendarDays, MapPinned } from "lucide-react";
import type { Realisation } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface RealisationCardProps {
  realisation: Realisation;
  compact?: boolean;
}

export default function RealisationCard({ realisation, compact = false }: RealisationCardProps) {
  const imageUrl = realisation.image_url?.trim();
  const imageAlt = realisation.image_alt?.trim() || realisation.title;
  const imageCredit = realisation.image_credit?.trim();
  const imageSource = realisation.image_source?.trim();

  return (
    <article
      className="h-full overflow-hidden rounded-[28px] border border-gray-100 bg-[#f8fafc] shadow-sm transition-shadow hover:shadow-lg"
      data-ga-event="realization_click"
      data-ga-label={realisation.title}
    >
      <div className={cn("relative overflow-hidden bg-[#1a3a5c]/10", compact ? "h-56" : "h-72")}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover"
            loading={compact ? "lazy" : "eager"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1a3a5c]">
            <Building2 className="h-12 w-12 text-[#e8b86d]" />
          </div>
        )}

        {imageCredit && (
          imageSource ? (
            <a
              href={imageSource}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              {imageCredit}
            </a>
          ) : (
            <span className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-white backdrop-blur-sm">
              {imageCredit}
            </span>
          )
        )}
      </div>

      <div className={compact ? "p-5" : "p-7"}>
        <div className="flex flex-wrap items-center gap-3">
          {realisation.category && (
            <span className="rounded-full bg-[#1a3a5c] px-3 py-1 text-xs font-semibold text-white">
              {realisation.category}
            </span>
          )}
          {realisation.location && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <MapPinned className="h-4 w-4 text-[#c4903f]" />
              {realisation.location}
            </span>
          )}
          {realisation.completed_at && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4 text-[#c4903f]" />
              {formatDate(realisation.completed_at)}
            </span>
          )}
        </div>
        <h3 className={cn("mt-4 font-bold text-[#0f1724]", compact ? "text-xl" : "text-2xl")}>
          {realisation.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-gray-600">{realisation.description}</p>
      </div>
    </article>
  );
}
