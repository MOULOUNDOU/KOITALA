export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck,
  Eye,
  FileClock,
  Heart,
  MessageSquare,
  Pencil,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import DashboardSearchInput from "@/components/dashboard/DashboardSearchInput";
import WeeklyVisitsChart from "@/components/dashboard/WeeklyVisitsChart";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import SitePagination from "@/components/ui/SitePagination";
import { getHomepageListingsPage } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

const LISTING_PAGE_SIZE = 6;

interface DashboardStats {
  totalProps: number;
  publishedProps: number;
  draftProps: number;
  soldProps: number;
  rentedProps: number;
  archivedProps: number;
  totalVisits: number;
  pendingVisits: number;
  totalMessages: number;
  newMessages: number;
  totalFavs: number;
}

interface RecentVisitRow {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface RecentMessageRow {
  id: string;
  full_name: string;
  subject: string | null;
  status: string;
  created_at: string;
}

interface WeeklyVisitPoint {
  label: string;
  total: number;
}

function toSearchPattern(search: string): string | null {
  const normalized = search.replace(/[,%()'"`]/g, " ").trim();
  if (!normalized) return null;
  return `*${normalized}*`;
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function buildWeeklyVisitSeries(rows: { created_at: string }[]): WeeklyVisitPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: { key: string; label: string }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    days.push({
      key: toDayKey(day),
      label: day.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
    });
  }

  const counts = new Map(days.map((day) => [day.key, 0]));
  rows.forEach((row) => {
    const key = toDayKey(new Date(row.created_at));
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });

  return days.map((day) => ({
    label: day.label,
    total: counts.get(day.key) ?? 0,
  }));
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
    { count: totalMessages },
    { count: newMessages },
    { count: totalFavs },
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
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("status", "nouveau"),
    supabase.from("favorites").select("*", { count: "exact", head: true }),
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
    totalMessages: totalMessages ?? 0,
    newMessages: newMessages ?? 0,
    totalFavs: totalFavs ?? 0,
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

async function getRecentMessages(search = ""): Promise<RecentMessageRow[]> {
  const supabase = await createClient();
  const searchPattern = toSearchPattern(search);
  let query = supabase
    .from("contacts")
    .select("id, full_name, subject, status, created_at")
    .order("created_at", { ascending: false });

  if (searchPattern) {
    query = query.or(
      `full_name.ilike.${searchPattern},email.ilike.${searchPattern},subject.ilike.${searchPattern},message.ilike.${searchPattern}`
    );
  }

  const { data } = await query.limit(5);

  return (data as RecentMessageRow[] | null) ?? [];
}

async function getWeeklyVisits(): Promise<WeeklyVisitPoint[]> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 6);

  const { data } = await supabase
    .from("visit_requests")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  return buildWeeklyVisitSeries(
    ((data as { created_at: string }[] | null) ?? []).filter((row) => row.created_at)
  );
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

  const [stats, listingQuery, recentVisits, recentMessages, weeklyVisits] =
    await Promise.all([
      getStats(),
      getHomepageListingsPage(currentListingPage, LISTING_PAGE_SIZE, searchQuery),
      getRecentVisits(searchQuery),
      getRecentMessages(searchQuery),
      getWeeklyVisits(),
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

  const weeklyTotalVisits = weeklyVisits.reduce((sum, point) => sum + point.total, 0);
  const peakVisitPoint = weeklyVisits.reduce(
    (top, point) => (point.total > top.total ? point : top),
    { label: "-", total: 0 }
  );
  const previousWeekEstimate = Math.max(
    0,
    stats.totalVisits - weeklyTotalVisits
  );
  const weeklyTrend =
    previousWeekEstimate === 0
      ? weeklyTotalVisits > 0
        ? 100
        : 0
      : Math.round(((weeklyTotalVisits - previousWeekEstimate) / previousWeekEstimate) * 100);

  const headerChips = isSearchMode
    ? [
        { icon: Building2, value: totalListingProperties, label: "annonces" },
        { icon: CalendarCheck, value: recentVisits.length, label: "demandes" },
        { icon: MessageSquare, value: recentMessages.length, label: "messages" },
      ]
    : [
        { icon: Bell, value: stats.pendingVisits, label: "En attente" },
        { icon: MessageSquare, value: stats.newMessages, label: "Nouveaux msg" },
      ];

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                CRM KOITALA
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f1724] sm:text-3xl">
                Vue d&apos;ensemble
              </h1>
              <p className="mt-1.5 text-sm text-gray-600">
                Pilotage des annonces, demandes et messages depuis un seul écran.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Link
                href="/dashboard/demandes"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
              >
                Voir les demandes
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
              icon: CalendarCheck,
              label: "Demandes",
              value: stats.totalVisits,
              helper: `${stats.pendingVisits} en attente`,
              bgColor: "#047857",
            },
            {
              icon: MessageSquare,
              label: "Messages",
              value: stats.totalMessages,
              helper: `${stats.newMessages} nouveaux`,
              bgColor: "#6b4226",
            },
            {
              icon: Heart,
              label: "Favoris",
              value: stats.totalFavs,
              helper: "Intérêt clients",
              bgColor: "#b91c1c",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
              style={{ backgroundColor: item.bgColor }}
            >
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                {item.label}
              </p>
              <p className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
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
        <div className="space-y-6">
          {!isSearchMode && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold text-[#0f1724]">Pipeline des annonces</h2>
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
                  <h2 className="text-lg font-bold text-[#0f1724]">Flux demandes (7 jours)</h2>
                  <span className="inline-flex max-w-full items-center rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                    {weeklyTotalVisits} cette semaine
                  </span>
                </div>
                <WeeklyVisitsChart data={weeklyVisits} />

                <div className="mt-3 flex flex-col items-start gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-gray-500">
                    Pic: <span className="font-semibold text-[#0f1724]">{peakVisitPoint.total}</span>{" "}
                    demande(s), {peakVisitPoint.label}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                      weeklyTrend >= 0
                        ? "bg-[#1a3a5c]/10 text-[#1a3a5c]"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {weeklyTrend >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {weeklyTrend >= 0 ? "+" : ""}
                    {weeklyTrend}% vs période précédente
                  </span>
                </div>
              </div>
            </section>
          )}

          <section
            id="listing-board"
            className={`rounded-3xl border border-gray-100 bg-white shadow-sm ${
              isSearchMode ? "anim-fade-up" : ""
            }`}
          >
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f1724] sm:text-xl">
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
                <div className="hidden gap-6 p-4 sm:grid sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
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
        </div>

        {!isSearchMode && (
          <aside className="space-y-6">
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
                    href: "/dashboard/demandes",
                    icon: FileClock,
                    label: "Suivre demandes",
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
      </section>
    </div>
  );
}
