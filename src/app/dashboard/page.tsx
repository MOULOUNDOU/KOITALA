export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Eye,
  FileClock,
  Globe2,
  MousePointerClick,
  Pencil,
  Plus,
  Users,
} from "lucide-react";
import DashboardSearchInput from "@/components/dashboard/DashboardSearchInput";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import SitePagination from "@/components/ui/SitePagination";
import { getAdminAnalyticsOverview } from "@/lib/analytics/adminAnalytics";
import { getHomepageListingsPage } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

const LISTING_PAGE_SIZE = 4;

interface DashboardStats {
  totalProps: number;
  publishedProps: number;
  draftProps: number;
  soldProps: number;
  rentedProps: number;
  archivedProps: number;
  totalVisits: number;
  pendingVisits: number;
}

interface RecentVisitRow {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

function toSearchPattern(search: string): string | null {
  const normalized = search.replace(/[,%()'"`]/g, " ").trim();
  if (!normalized) return null;
  return `*${normalized}*`;
}


async function getStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const [
    { count: totalProps },
    { count: publishedProps },
    { count: draftProps },
    { count: soldProps },
    { count: rentedProps },
    { count: archivedProps },
    { count: totalVisits },
    { count: pendingVisits },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "publie"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "brouillon"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "vendu"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "loue"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "archive"),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }),
    supabase
      .from("visit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "en_attente"),
  ]);

  return {
    totalProps: totalProps ?? 0,
    publishedProps: publishedProps ?? 0,
    draftProps: draftProps ?? 0,
    soldProps: soldProps ?? 0,
    rentedProps: rentedProps ?? 0,
    archivedProps: archivedProps ?? 0,
    totalVisits: totalVisits ?? 0,
    pendingVisits: pendingVisits ?? 0,
  };
}

async function getRecentVisits(search = ""): Promise<RecentVisitRow[]> {
  const supabase = await createClient();
  const searchPattern = toSearchPattern(search);
  let query = supabase
    .from("visit_requests")
    .select("id, full_name, email, status, created_at, property:properties(title)")
    .order("created_at", { ascending: false });

  if (searchPattern) {
    query = query.or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
  }

  const { data } = await query.limit(6);

  return (data as RecentVisitRow[] | null) ?? [];
}

interface DashboardPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? "").trim();
  const isSearchMode = searchQuery.length > 0;
  const parsedListingPage = Number(params.listing_page ?? "1");
  let currentListingPage =
    Number.isFinite(parsedListingPage) && parsedListingPage > 0
      ? Math.floor(parsedListingPage)
      : 1;

  const [stats, listingQuery, recentVisits, analyticsOverview] =
    await Promise.all([
      getStats(),
      getHomepageListingsPage(currentListingPage, LISTING_PAGE_SIZE, searchQuery),
      getRecentVisits(searchQuery),
      getAdminAnalyticsOverview(30),
    ]);

  let listingProperties = listingQuery.properties;
  let totalListingProperties = listingQuery.total;
  const computedListingTotalPages = Math.max(
    1,
    Math.ceil(totalListingProperties / LISTING_PAGE_SIZE)
  );

  if (totalListingProperties > 0 && currentListingPage > computedListingTotalPages) {
    currentListingPage = computedListingTotalPages;
    const fallbackQuery = await getHomepageListingsPage(
      currentListingPage,
      LISTING_PAGE_SIZE,
      searchQuery
    );
    listingProperties = fallbackQuery.properties;
    totalListingProperties = fallbackQuery.total;
  }

  const listingTotalPages = Math.max(
    1,
    Math.ceil(totalListingProperties / LISTING_PAGE_SIZE)
  );

  const buildListingPageHref = (page: number): string => {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === "listing_page") return;
      nextParams.set(key, value);
    });

    if (page > 1) {
      nextParams.set("listing_page", String(page));
    }

    const query = nextParams.toString();
    return query ? `/dashboard?${query}#listing-board` : "/dashboard#listing-board";
  };

  const statusBoard = [
    { key: "publie", label: "Publiées", value: stats.publishedProps, tone: "bg-[#1a3a5c]" },
    { key: "brouillon", label: "Brouillons", value: stats.draftProps, tone: "bg-gray-400" },
    { key: "vendu", label: "Vendues", value: stats.soldProps, tone: "bg-slate-600" },
    { key: "loue", label: "Louées", value: stats.rentedProps, tone: "bg-[#0f2540]" },
    { key: "archive", label: "Archivées", value: stats.archivedProps, tone: "bg-slate-500" },
  ];
  const maxStatusValue = Math.max(...statusBoard.map((item) => item.value), 1);
  const analyticsQuickMetrics = [
    {
      icon: Users,
      label: "Visiteurs",
      value: analyticsOverview.metrics.visitors,
      hint: analyticsOverview.gaConnected ? "utilisateurs uniques" : "visiteurs connus",
    },
    {
      icon: Globe2,
      label: "Visites",
      value: analyticsOverview.metrics.sessions,
      hint: analyticsOverview.gaConnected ? "sessions" : "demandes internes",
    },
    {
      icon: MousePointerClick,
      label: "Clics",
      value: analyticsOverview.metrics.clicks,
      hint: analyticsOverview.gaConnected ? "événements GA4" : "interactions locales",
    },
    {
      icon: BarChart3,
      label: "Pages vues",
      value: analyticsOverview.metrics.pageViews,
      hint: analyticsOverview.gaConnected ? "vues de page" : "vues annonces",
    },
  ] as const;
  const primaryProvenance = analyticsOverview.gaConnected
    ? analyticsOverview.topCountries[0]
    : analyticsOverview.localFallback.topDemandCities[0];
  const primaryChannel = analyticsOverview.trafficChannels[0];

  const headerChips = isSearchMode
    ? [
        { icon: Building2, value: totalListingProperties, label: "annonces" },
        { icon: CalendarCheck, value: recentVisits.length, label: "leads" },
      ]
    : [
        { icon: Bell, value: stats.pendingVisits, label: "En attente" },
        {
          icon: BarChart3,
          value: analyticsOverview.metrics.visitors,
          label: analyticsOverview.gaConnected ? "Visiteurs" : "Visiteurs connus",
        },
      ];

  return (
    <div className="w-full space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                CRM KOITALA
              </p>
              <h1 className="mt-2 text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
                Vue d&apos;ensemble
              </h1>
              <p className="mt-1.5 text-sm text-gray-600">
                Pilotage des annonces, contrats et performances depuis un seul écran.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Link
                href="/dashboard/analyse"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
              >
                Ouvrir analyse
              </Link>
              <Link
                href="/dashboard/annonces/nouvelle"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Nouvelle annonce
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <DashboardSearchInput
              key={searchQuery || "__dashboard-search-empty__"}
              initialQuery={searchQuery}
            />
            <div className="grid grid-cols-2 gap-2 min-[430px]:flex min-[430px]:items-center">
              {headerChips.map((chip) => (
                <div
                  key={chip.label}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0f1724]"
                >
                  <chip.icon className="h-3.5 w-3.5 text-[#1a3a5c]" />
                  {chip.value} {chip.label}
                </div>
              ))}
            </div>
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-gray-500">
              Recherche active: <span className="font-semibold text-[#0f1724]">{searchQuery}</span>
            </p>
          )}
        </div>
      </section>

      {!isSearchMode && (
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              icon: Building2,
              label: "Total annonces",
              value: stats.totalProps,
              helper: `${stats.publishedProps} publiées`,
              bgColor: "#1d4ed8",
            },
            {
              icon: BarChart3,
              label: "Visites",
              value: analyticsOverview.metrics.sessions,
              helper: analyticsOverview.gaConnected
                ? `${analyticsOverview.metrics.visitors} visiteurs`
                : `${stats.pendingVisits} demandes en attente`,
              bgColor: "#047857",
            },
            {
              icon: FileClock,
              label: "Brouillons",
              value: stats.draftProps,
              helper: "Annonces à finaliser",
              bgColor: "#6b4226",
            },
            {
              icon: Bell,
              label: "Publiées",
              value: stats.publishedProps,
              helper: "Annonces en ligne",
              bgColor: "#b91c1c",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
              style={{ backgroundColor: item.bgColor }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white sm:h-10 sm:w-10"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                {item.label}
              </p>
              <p className="font-display mt-2 text-[1.65rem] font-extrabold text-white sm:text-[1.9rem] lg:text-3xl">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/90">{item.helper}</p>
            </div>
          ))}
        </section>
      )}

      <section
        className={`grid grid-cols-1 gap-6 ${
          isSearchMode ? "" : "xl:grid-cols-[minmax(0,1.5fr)_360px]"
        }`}
      >
        {!isSearchMode && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-lg">Pipeline des annonces</h2>
                  <span className="inline-flex max-w-full items-center rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                    {stats.totalProps} au total
                  </span>
                </div>
                <div className="space-y-3">
                  {statusBoard.map((item) => {
                    const width =
                      item.value === 0
                        ? 0
                        : Math.max(12, Math.round((item.value / maxStatusValue) * 100));
                    return (
                      <div key={item.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0f1724]">{item.label}</span>
                          <span className="text-gray-500">{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${item.tone}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-lg">
                    Aperçu analytics (30 jours)
                  </h2>
                  <Link
                    href="/dashboard/analyse"
                    className="inline-flex items-center gap-1 rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c] hover:bg-[#1a3a5c]/10"
                  >
                    Détail Analyse <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {analyticsQuickMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-xl font-bold text-[#0f1724]">
                        {new Intl.NumberFormat("fr-FR").format(metric.value)}
                      </p>
                      <p className="text-xs text-gray-500">{metric.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Provenance principale
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0f1724]">
                      {primaryProvenance
                        ? `${primaryProvenance.label} (${new Intl.NumberFormat("fr-FR").format(
                            primaryProvenance.value
                          )})`
                        : "Aucune donnée"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Canal principal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0f1724]">
                      {primaryChannel
                        ? `${primaryChannel.label} (${new Intl.NumberFormat("fr-FR").format(
                            primaryChannel.value
                          )})`
                        : "Aucune donnée"}
                    </p>
                  </div>
                </div>

                {analyticsOverview.warning && (
                  <p className="mt-3 text-xs text-amber-700">{analyticsOverview.warning}</p>
                )}
              </div>
            </section>
          </div>
        )}

        {!isSearchMode && (
          <aside className="space-y-6 xl:order-2">
            <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                Actions rapides
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    href: "/dashboard/annonces/nouvelle",
                    icon: Plus,
                    label: "Ajouter annonce",
                    className: "bg-[#1a3a5c] text-white hover:bg-[#0f2540]",
                  },
                  {
                    href: "/dashboard/analyse",
                    icon: BarChart3,
                    label: "Voir analyse",
                    className:
                      "border border-[#1a3a5c]/20 bg-white text-[#1a3a5c] hover:bg-[#f8fafc]",
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${action.className}`}
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                ))}
              </div>

              {stats.pendingVisits > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f4f6f9] px-3 py-2 text-xs text-[#0f1724]">
                  <Bell className="h-3.5 w-3.5 text-[#1a3a5c]" />
                  {stats.pendingVisits} demande(s) en attente de traitement
                </div>
              )}

              <Link
                href="/dashboard/annonces"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:underline"
              >
                Ouvrir la gestion complète <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        )}

        <section
          id="listing-board"
          className={`rounded-3xl border border-gray-100 bg-white shadow-sm ${
            isSearchMode ? "anim-fade-up w-full" : "w-full xl:order-3 xl:col-span-2"
          }`}
        >
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-xl">
                  {isSearchMode ? "Annonces trouvées" : "Tableau des annonces"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isSearchMode
                    ? `Résultats filtrés pour "${searchQuery}".`
                    : "Annonces publiées (alignées avec l&apos;accueil)."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Link
                  href="/dashboard/annonces"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:text-sm"
                >
                  Toutes les annonces
                </Link>
                <Link
                  href="/dashboard/annonces/nouvelle"
                  className="inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
                >
                  Ajouter
                </Link>
              </div>
            </div>

            {listingProperties.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                <p className="text-sm text-gray-400">
                  {isSearchMode
                    ? "Aucune annonce ne correspond à votre recherche."
                    : "Aucune annonce publiée pour le moment."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden gap-6 p-4 sm:grid sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                  {listingProperties.map((property) => (
                    <div key={property.id} className="space-y-3">
                      <PropertyCard
                        property={property}
                        preferVideoBubble
                        showFavoriteButton={false}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/biens/${property.slug}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#1a3a5c]/15 bg-white px-2.5 py-2 text-[11px] font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5 sm:text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Link>
                        <Link
                          href={`/dashboard/annonces/${property.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#1a3a5c] px-2.5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-[#0f2540] sm:text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 sm:hidden">
                  {listingProperties.map((property) => (
                    <div key={`${property.id}-mobile`} className="space-y-3">
                      <PropertyCardMobile
                        property={property}
                        preferVideoBubble
                        showFavoriteButton={false}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/biens/${property.slug}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#1a3a5c]/15 bg-white px-2.5 py-2 text-[11px] font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Link>
                        <Link
                          href={`/dashboard/annonces/${property.id}`}
                          className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#1a3a5c] px-2.5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-[#0f2540]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {listingTotalPages > 1 && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <SitePagination
                      currentPage={currentListingPage}
                      totalPages={listingTotalPages}
                      buildHref={buildListingPageHref}
                      pageKeyPrefix="dashboard-listing-board"
                    />
                  </div>
                )}
              </>
            )}
        </section>
      </section>
    </div>
  );
}
