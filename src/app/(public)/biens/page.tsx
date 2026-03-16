export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters from "@/components/properties/PropertyFilters";
import SitePagination from "@/components/ui/SitePagination";
import { ArrowLeft, Building2 } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";
import type { Property, SearchFilters } from "@/types";

interface BienPageProps {
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ searchParams }: BienPageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasActiveFilters = Object.values(params).some((value) => typeof value === "string" && value.trim().length > 0);

  return {
    title: "Biens immobiliers a Dakar et au Senegal",
    description:
      "Parcourez les annonces KOITALA : appartements, maisons, villas, terrains, bureaux et biens en location ou en vente.",
    alternates: {
      canonical: "/biens",
    },
    robots: hasActiveFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: "Biens immobiliers KOITALA",
      description:
        "Parcourez les annonces KOITALA : appartements, maisons, villas, terrains, bureaux et biens en location ou en vente.",
      url: absoluteUrl("/biens"),
    },
  };
}

async function getProperties(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<{ properties: Property[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, property_images(*)", { count: "exact" })
    .eq("status", "publie")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (filters.rental_category) {
    query = query.eq("listing_type", "location");
  } else if (filters.listing_type) {
    query = query.eq("listing_type", filters.listing_type);
  }

  if (filters.rental_category) {
    switch (filters.rental_category) {
      case "chambre_meublee":
        query = query
          .eq("is_furnished", true)
          .or("rental_category.eq.chambre_meublee,title.ilike.%chambre meubl%,description.ilike.%chambre meubl%,title.ilike.%meubl%,description.ilike.%meubl%");
        break;
      case "studio":
        query = query.or("rental_category.eq.studio,title.ilike.%studio%,description.ilike.%studio%");
        break;
      case "appartement":
        query = query.eq("property_type", "appartement").or("rental_category.eq.appartement");
        break;
      case "mini_studio":
        query = query.or("rental_category.eq.mini_studio,title.ilike.%mini%studio%,description.ilike.%mini%studio%,title.ilike.%ministudio%,description.ilike.%ministudio%");
        break;
      case "colocation":
        query = query.or("rental_category.eq.colocation,title.ilike.%colocation%,description.ilike.%colocation%,title.ilike.%co-location%,description.ilike.%co-location%");
        break;
      default:
        break;
    }
  }
  if (filters.rent_payment_period) {
    query = query.eq("rent_payment_period", filters.rent_payment_period);
  }

  if (filters.property_type) {
    query = query.eq("property_type", filters.property_type);
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.neighborhood) {
    query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  }
  if (filters.min_price) {
    query = query.gte("price", Number(filters.min_price));
  }
  if (filters.max_price) {
    query = query.lte("price", Number(filters.max_price));
  }
  if (filters.min_area) {
    query = query.gte("area", Number(filters.min_area));
  }
  if (filters.max_area) {
    query = query.lte("area", Number(filters.max_area));
  }
  if (filters.bedrooms) {
    query = query.gte("bedrooms", Number(filters.bedrooms));
  }
  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%,neighborhood.ilike.%${filters.query}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await query.range(from, to);
  return { properties: data ?? [], total: count ?? 0 };
}

export default async function BiensPage({ searchParams }: BienPageProps) {
  const params = await searchParams;
  const PAGE_SIZE = 9;

  const filters: SearchFilters = {
    listing_type: (params.listing_type as SearchFilters["listing_type"]) ?? "",
    rental_category: (params.rental_category as SearchFilters["rental_category"]) ?? "",
    rent_payment_period: (params.rent_payment_period as SearchFilters["rent_payment_period"]) ?? "",
    property_type:
      (params.property_type as SearchFilters["property_type"]) ??
      (params.type as SearchFilters["property_type"]) ??
      "",
    city: params.city ?? "",
    neighborhood: params.neighborhood ?? "",
    min_price: params.min_price ? Number(params.min_price) : "",
    max_price: params.max_price ? Number(params.max_price) : "",
    min_area: params.min_area ? Number(params.min_area) : "",
    max_area: params.max_area ? Number(params.max_area) : "",
    bedrooms: params.bedrooms ? Number(params.bedrooms) : "",
    query: params.query ?? "",
  };
  const normalizedSearchQuery = String(filters.query ?? "").trim();
  const isSearchMode = normalizedSearchQuery.length > 0;

  const parsedPage = Number(params.page ?? "1");
  let currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  let { properties, total } = await getProperties(filters, currentPage, PAGE_SIZE);
  const computedTotalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total > 0 && currentPage > computedTotalPages) {
    currentPage = computedTotalPages;
    const fallbackQuery = await getProperties(filters, currentPage, PAGE_SIZE);
    properties = fallbackQuery.properties;
    total = fallbackQuery.total;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resultStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, total);

  const buildPageHref = (page: number): string => {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === "page") return;
      nextParams.set(key, value);
    });
    if (page > 1) {
      nextParams.set("page", String(page));
    }
    const query = nextParams.toString();
    return query ? `/biens?${query}` : "/biens";
  };

  return (
    <>
      {/* Header */}
      <div className="bg-[#0f1724] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-[#e8b86d]/60 hover:bg-white/10 hover:text-[#e8b86d]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Nos biens</h1>
          <p className="text-gray-400">
            {isSearchMode ? (
              <>
                Résultats pour &quot;{normalizedSearchQuery}&quot;: {total} bien
                {total !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                {total} bien{total !== 1 ? "s" : ""}{" "}
                disponible{total !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`flex flex-col ${isSearchMode ? "gap-4" : "gap-8 lg:flex-row"}`}>
          {/* Filters sidebar */}
          {!isSearchMode && (
            <div className="lg:w-72 shrink-0 anim-fade-up">
              <Suspense fallback={null}>
                <PropertyFilters />
              </Suspense>
            </div>
          )}

          {/* Properties grid */}
          <div className={`flex-1 min-w-0 ${isSearchMode ? "anim-fade-up" : ""}`}>
            {isSearchMode && (
              <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-[#f8fafc] px-4 py-3 anim-fade-up sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#0f1724]">
                  Mode recherche actif: seuls les résultats correspondants sont affichés.
                </p>
                <Link
                  href="/biens"
                  className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Effacer la recherche
                </Link>
              </div>
            )}
            {properties.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-[#0f1724]">
                      {resultStart} - {resultEnd}
                    </span>{" "}
                    sur {total} résultat{total !== 1 ? "s" : ""}
                  </p>
                </div>
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 ${
                    isSearchMode ? "anim-fade-up anim-delay-1" : ""
                  }`}
                >
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} preferVideoBubble />
                  ))}
                </div>

                <SitePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  buildHref={buildPageHref}
                  pageKeyPrefix="biens"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Aucun bien trouvé
                </h3>
                <p className="text-sm text-gray-400">
                  {isSearchMode
                    ? `Aucun résultat pour "${normalizedSearchQuery}".`
                    : "Modifiez vos critères de recherche pour voir plus de résultats."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
