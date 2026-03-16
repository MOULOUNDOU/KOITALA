"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface DashboardSearchInputProps {
  initialQuery: string;
}

export default function DashboardSearchInput({ initialQuery }: DashboardSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query.trim());
  const lastPushedQuery = useRef(initialQuery.trim());

  useEffect(() => {
    if (deferredQuery === lastPushedQuery.current) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (deferredQuery) {
      nextParams.set("q", deferredQuery);
    } else {
      nextParams.delete("q");
    }
    nextParams.delete("listing_page");

    const nextQueryString = nextParams.toString();
    const nextHref = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });

    lastPushedQuery.current = deferredQuery;
  }, [deferredQuery, pathname, router, searchParams]);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-[#f8fafc] px-3.5 py-2.5">
      <Search className="h-4 w-4 shrink-0 text-gray-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher une annonce, un client ou un message"
        aria-label="Recherche dashboard"
        className="w-full bg-transparent text-sm text-[#0f1724] placeholder:text-gray-400 focus:outline-none"
      />
      {query.trim() && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Effacer
        </button>
      )}
    </div>
  );
}
