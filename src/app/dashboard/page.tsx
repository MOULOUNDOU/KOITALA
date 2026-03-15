export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarCheck,
  Eye,
  Heart,
  MessageSquare,
  Pencil,
  Plus,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import SitePagination from "@/components/ui/SitePagination";
import { getRecentPropertiesPage } from "@/lib/properties";
import { createClient } from "@/lib/supabase/server";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

const LISTING_PAGE_SIZE = 6;

async function getStats() {
  const supabase = await createClient();
  const [
    { count: totalProps },
    { count: publishedProps },
    { count: totalVisits },
    { count: pendingVisits },
    { count: totalMessages },
    { count: newMessages },
    { count: totalFavs },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "publie"),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "nouveau"),
    supabase.from("favorites").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalProps: totalProps ?? 0,
    publishedProps: publishedProps ?? 0,
    totalVisits: totalVisits ?? 0,
    pendingVisits: pendingVisits ?? 0,
    totalMessages: totalMessages ?? 0,
    newMessages: newMessages ?? 0,
    totalFavs: totalFavs ?? 0,
  };
}

async function getRecentVisits() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visit_requests")
    .select("id, full_name, email, phone, status, created_at, property:properties(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  return data ?? [];
}

interface DashboardPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const parsedListingPage = Number(params.listing_page ?? "1");
  let currentListingPage =
    Number.isFinite(parsedListingPage) && parsedListingPage > 0
      ? Math.floor(parsedListingPage)
      : 1;

  const [stats, listingQuery, recentVisits] = await Promise.all([
    getStats(),
    getRecentPropertiesPage(currentListingPage, LISTING_PAGE_SIZE),
    getRecentVisits(),
  ]);

  let listingProperties = listingQuery.properties;
  let totalListingProperties = listingQuery.total;
  const computedListingTotalPages = Math.max(
    1,
    Math.ceil(totalListingProperties / LISTING_PAGE_SIZE)
  );

  if (totalListingProperties > 0 && currentListingPage > computedListingTotalPages) {
    currentListingPage = computedListingTotalPages;
    const fallbackListingQuery = await getRecentPropertiesPage(
      currentListingPage,
      LISTING_PAGE_SIZE
    );
    listingProperties = fallbackListingQuery.properties;
    totalListingProperties = fallbackListingQuery.total;
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0f1724] sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Vue d&apos;ensemble de l&apos;activité de l&apos;agence.
          </p>
        </div>
        <Link
          href="/dashboard/annonces/nouvelle"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f2540] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nouvelle annonce
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        <StatsCard
          title="Total annonces"
          value={stats.totalProps}
          subtitle={`${stats.publishedProps} publiées`}
          icon={Building2}
          color="blue"
          href="/dashboard/annonces"
        />
        <StatsCard
          title="Demandes de visite"
          value={stats.totalVisits}
          subtitle={`${stats.pendingVisits} en attente`}
          icon={CalendarCheck}
          color="green"
          href="/dashboard/demandes"
        />
        <StatsCard
          title="Messages"
          value={stats.totalMessages}
          subtitle={`${stats.newMessages} nouveaux`}
          icon={MessageSquare}
          color="yellow"
          href="/dashboard/messages"
        />
        <StatsCard
          title="Favoris"
          value={stats.totalFavs}
          subtitle="Biens mis en favoris"
          icon={Heart}
          color="purple"
        />
      </div>

      {stats.pendingVisits > 0 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#1a3a5c]/20 bg-[#f4f6f9] p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
            <Bell className="h-5 w-5 text-[#1a3a5c]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0f1724]">
              {stats.pendingVisits} demande{stats.pendingVisits > 1 ? "s" : ""} de visite en attente
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Des demandes nécessitent votre attention. Consultez-les rapidement.
            </p>
          </div>
          <Link
            href="/dashboard/demandes"
            className="inline-flex items-center justify-center rounded-xl border border-[#1a3a5c] bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
          >
            Voir les demandes
          </Link>
        </div>
      )}

      <section
        id="listing-board"
        className="rounded-3xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0f1724] sm:text-xl">
              Annonces récentes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Annonces publiées visibles sur la page d&apos;accueil.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Link
              href="/dashboard/annonces"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:px-3.5 sm:text-sm"
            >
              Toutes les annonces
            </Link>
            <Link
              href="/dashboard/annonces/nouvelle"
              className="inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:px-3.5 sm:text-sm"
            >
              Ajouter
            </Link>
          </div>
        </div>

        {listingProperties.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-gray-200" />
            <p className="text-sm text-gray-400">Aucune annonce pour le moment.</p>
            <Link
              href="/dashboard/annonces/nouvelle"
              className="mt-2 inline-block text-sm font-semibold text-[#1a3a5c] hover:underline"
            >
              Créer votre première annonce
            </Link>
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#1a3a5c]/15 bg-white px-3 py-2.5 text-xs font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5 sm:px-4 sm:text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Link>
                    <Link
                      href={`/dashboard/annonces/${property.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#1a3a5c] px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#0f2540] sm:px-4 sm:text-sm"
                    >
                      <Pencil className="h-4 w-4" />
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#1a3a5c]/15 bg-white px-3 py-2.5 text-xs font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Link>
                    <Link
                      href={`/dashboard/annonces/${property.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#1a3a5c] px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#0f2540]"
                    >
                      <Pencil className="h-4 w-4" />
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

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-[#0f1724]">Demandes récentes</h2>
          <Link
            href="/dashboard/demandes"
            className="flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:underline"
          >
            Tout voir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentVisits.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Aucune demande de visite pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Nom
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Bien
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentVisits.map((visit) => (
                  <tr key={visit.id} className="transition-colors hover:bg-[#f4f6f9]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#0f2540] text-xs font-bold text-white">
                          {visit.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0f1724]">
                            {visit.full_name}
                          </p>
                          <p className="truncate text-[11px] text-gray-400">
                            {visit.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[200px] truncate text-sm text-gray-600">
                        {(visit.property as unknown as { title: string } | null)?.title ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-gray-400">{formatDate(visit.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusColor(visit.status)}`}
                      >
                        {getStatusLabel(visit.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-[#0f1724] sm:text-lg">
          Actions rapides
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            {
              href: "/dashboard/annonces/nouvelle",
              icon: Plus,
              label: "Nouvelle annonce",
              bg: "bg-[#1a3a5c]",
              text: "text-white",
            },
            {
              href: "/dashboard/demandes",
              icon: CalendarCheck,
              label: "Demandes de visite",
              bg: "bg-[#0f2540]",
              text: "text-white",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.bg} ${action.text} flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-center transition-all hover:opacity-92`}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
