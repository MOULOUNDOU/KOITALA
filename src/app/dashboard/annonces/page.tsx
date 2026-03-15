export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import SitePagination from "@/components/ui/SitePagination";
import { getFeaturedProperties, getRecentPropertiesPage } from "@/lib/properties";
import type { Property } from "@/types";

export const metadata: Metadata = { title: "Mes annonces" };

const PAGE_SIZE = 6;

interface PropertySectionProps {
  title: string;
  properties: Property[];
  emptyLabel: string;
  pagination?: React.ReactNode;
}

function PropertySection({
  title,
  properties,
  emptyLabel,
  pagination,
}: PropertySectionProps) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-semibold text-[#0f1724] sm:text-xl">{title}</h2>
        <span className="inline-flex items-center rounded-full border border-[#1a3a5c]/10 bg-[#1a3a5c]/5 px-3 py-1 text-xs font-semibold text-[#1a3a5c]">
          {properties.length}
        </span>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafbfd] px-6 py-12 text-center text-sm text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <>
          <div className="hidden gap-6 sm:grid sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <div key={property.id} className="space-y-3">
                <PropertyCard
                  property={property}
                  preferVideoBubble
                  showFavoriteButton={false}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/biens/${property.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 py-3 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </Link>
                  <Link
                    href={`/dashboard/annonces/${property.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f2540]"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {properties.map((property) => (
              <div key={`${property.id}-mobile`} className="space-y-3">
                <PropertyCardMobile
                  property={property}
                  preferVideoBubble
                  showFavoriteButton={false}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/biens/${property.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 py-3 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </Link>
                  <Link
                    href={`/dashboard/annonces/${property.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f2540]"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {pagination}
        </>
      )}
    </section>
  );
}

interface AnnoncesPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AnnoncesPage({ searchParams }: AnnoncesPageProps) {
  const params = await searchParams;
  const parsedFeaturedPage = Number(params.featured_page ?? "1");
  const parsedRecentPage = Number(params.recent_page ?? "1");

  let currentFeaturedPage =
    Number.isFinite(parsedFeaturedPage) && parsedFeaturedPage > 0
      ? Math.floor(parsedFeaturedPage)
      : 1;
  let currentRecentPage =
    Number.isFinite(parsedRecentPage) && parsedRecentPage > 0
      ? Math.floor(parsedRecentPage)
      : 1;

  const [featuredQuery, recentQuery] = await Promise.all([
    getFeaturedProperties(currentFeaturedPage, PAGE_SIZE),
    getRecentPropertiesPage(currentRecentPage, PAGE_SIZE),
  ]);

  let featuredProperties = featuredQuery.properties;
  let totalFeatured = featuredQuery.total;
  let recentProperties = recentQuery.properties;
  let totalRecent = recentQuery.total;

  const computedFeaturedTotalPages = Math.max(1, Math.ceil(totalFeatured / PAGE_SIZE));
  const computedRecentTotalPages = Math.max(1, Math.ceil(totalRecent / PAGE_SIZE));

  if (totalFeatured > 0 && currentFeaturedPage > computedFeaturedTotalPages) {
    currentFeaturedPage = computedFeaturedTotalPages;
    const fallbackFeaturedQuery = await getFeaturedProperties(currentFeaturedPage, PAGE_SIZE);
    featuredProperties = fallbackFeaturedQuery.properties;
    totalFeatured = fallbackFeaturedQuery.total;
  }

  if (totalRecent > 0 && currentRecentPage > computedRecentTotalPages) {
    currentRecentPage = computedRecentTotalPages;
    const fallbackRecentQuery = await getRecentPropertiesPage(currentRecentPage, PAGE_SIZE);
    recentProperties = fallbackRecentQuery.properties;
    totalRecent = fallbackRecentQuery.total;
  }

  const featuredTotalPages = Math.max(1, Math.ceil(totalFeatured / PAGE_SIZE));
  const recentTotalPages = Math.max(1, Math.ceil(totalRecent / PAGE_SIZE));

  const buildPageHref = (
    pageKey: "featured_page" | "recent_page",
    page: number,
    anchor: "biens-recommandes" | "annonces-recentes"
  ): string => {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === pageKey) return;
      nextParams.set(key, value);
    });

    if (page > 1) {
      nextParams.set(pageKey, String(page));
    }

    const query = nextParams.toString();
    return query
      ? `/dashboard/annonces?${query}#${anchor}`
      : `/dashboard/annonces#${anchor}`;
  };

  return (
    <div className="mx-auto max-w-7xl p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1724] sm:text-3xl">Mes annonces</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {totalFeatured} recommandée{totalFeatured > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {totalRecent} récente{totalRecent > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/annonces/nouvelle"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f2540] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nouvelle annonce
        </Link>
      </div>

      <div className="space-y-6">
        <div id="biens-recommandes">
          <PropertySection
            title="Biens recommandés"
            properties={featuredProperties}
            emptyLabel="Aucune annonce recommandée pour le moment."
            pagination={
              featuredTotalPages > 1 ? (
                <SitePagination
                  currentPage={currentFeaturedPage}
                  totalPages={featuredTotalPages}
                  buildHref={(page) =>
                    buildPageHref("featured_page", page, "biens-recommandes")
                  }
                  pageKeyPrefix="dashboard-featured"
                />
              ) : undefined
            }
          />
        </div>

        <div id="annonces-recentes">
          <PropertySection
            title="Annonces récentes"
            properties={recentProperties}
            emptyLabel="Aucune annonce récente pour le moment."
            pagination={
              recentTotalPages > 1 ? (
                <SitePagination
                  currentPage={currentRecentPage}
                  totalPages={recentTotalPages}
                  buildHref={(page) =>
                    buildPageHref("recent_page", page, "annonces-recentes")
                  }
                  pageKeyPrefix="dashboard-recent"
                />
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
