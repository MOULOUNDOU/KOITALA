"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Compass,
  Heart,
  Home,
  LineChart,
  MapPin,
  Phone,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import DashboardAvatar from "@/components/layout/DashboardAvatar";
import WeeklyVisitsChart from "@/components/dashboard/WeeklyVisitsChart";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate,
  formatPrice,
  getListingTypeLabel,
} from "@/lib/utils";
import type { Profile } from "@/types";

interface PropertyImageItem {
  url: string;
  is_main: boolean;
  order_index: number;
}

interface DashboardProperty {
  id: string;
  slug: string;
  title: string;
  city: string;
  price: number;
  listing_type: "vente" | "location";
  main_image_url: string | null;
  property_images?: PropertyImageItem[] | null;
}

interface DashboardVisit {
  id: string;
  status: string;
  preferred_date: string | null;
  created_at: string;
  message: string | null;
  property:
    | Pick<DashboardProperty, "slug" | "title" | "main_image_url">
    | Pick<DashboardProperty, "slug" | "title" | "main_image_url">[]
    | null;
}

interface FavoriteRow {
  id: string;
  created_at: string;
  property: DashboardProperty | DashboardProperty[] | null;
}

interface DashboardFavorite extends DashboardProperty {
  saved_at: string;
}

interface WeeklyVisitPoint {
  label: string;
  total: number;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getPropertyImage(
  property: {
    main_image_url?: string | null;
    property_images?: PropertyImageItem[] | null;
  } | null | undefined
): string {
  if (!property) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
  }

  if (property.main_image_url) return property.main_image_url;

  const mainImage = property.property_images?.find((image) => image.is_main);
  if (mainImage?.url) return mainImage.url;

  const firstImage = property.property_images?.[0]?.url;
  if (firstImage) return firstImage;

  return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
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
    const createdAt = new Date(row.created_at);
    const key = toDayKey(createdAt);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });

  return days.map((day) => ({
    label: day.label,
    total: counts.get(day.key) ?? 0,
  }));
}

function countRowsBetween(
  rows: { created_at: string }[],
  startInclusive: Date,
  endExclusive: Date
): number {
  return rows.filter((row) => {
    const createdAt = new Date(row.created_at);
    return createdAt >= startInclusive && createdAt < endExclusive;
  }).length;
}

export default function DashboardClientPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [visits, setVisits] = useState<DashboardVisit[]>([]);
  const [favorites, setFavorites] = useState<DashboardFavorite[]>([]);
  const [availableProperties, setAvailableProperties] = useState<DashboardProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const metadataAvatar =
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url.trim()
          : "";
      const emailFallback = user.email?.split("@")[0] ?? "Client";

      const [
        { data: prof },
        { data: vis },
        { data: favs },
        { data: featuredProperties },
        { data: recentProperties },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("visit_requests")
          .select(
            "id, status, preferred_date, created_at, message, property:properties(slug, title, main_image_url)"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("favorites")
          .select(
            "id, created_at, property:properties(id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index))"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("properties")
          .select("id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index)")
          .eq("status", "publie")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(6),
        supabase
          .from("properties")
          .select("id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index)")
          .eq("status", "publie")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(6),
      ]);

      if (!mounted) return;

      const profileName = prof?.full_name?.trim() || metadataName || emailFallback;

      const favoriteRows = (favs as FavoriteRow[] | null) ?? [];
      const favoriteItems = favoriteRows
        .map((row) => {
          const property = pickFirst(row.property);
          if (!property) return null;
          return {
            ...property,
            saved_at: row.created_at,
          };
        })
        .filter((property): property is DashboardFavorite => property !== null);

      const featuredItems = (featuredProperties as DashboardProperty[] | null) ?? [];
      const recentItems = (recentProperties as DashboardProperty[] | null) ?? [];
      const homepageItems = Array.from(
        new Map([...featuredItems, ...recentItems].map((property) => [property.id, property])).values()
      ).slice(0, 6);

      setProfile({
        ...(prof ?? {}),
        full_name: profileName,
        email: prof?.email ?? user.email ?? "",
        avatar_url: prof?.avatar_url?.trim() || metadataAvatar || "",
      });
      setVisits((vis as DashboardVisit[] | null) ?? []);
      setFavorites(favoriteItems);
      setAvailableProperties(homepageItems);
      setLoading(false);

      if (!prof?.full_name?.trim() && metadataName) {
        await supabase.from("profiles").update({ full_name: metadataName }).eq("id", user.id);
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const userName = profile.full_name?.trim() || "Client";
  const userAvatarUrl = profile.avatar_url?.toString().trim() ?? "";
  const pendingVisits = visits.filter((visit) => visit.status === "en_attente").length;
  const confirmedVisits = visits.filter((visit) => visit.status === "confirme").length;
  const completedVisits = visits.filter((visit) => visit.status === "realise").length;
  const cancelledVisits = visits.filter((visit) => visit.status === "annule").length;
  const completedProfileFields = [profile.full_name, profile.email, profile.phone].filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;
  const profileCompletion = Math.round((completedProfileFields / 3) * 100);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingVisits = visits
    .filter(
      (visit) =>
        visit.preferred_date &&
        new Date(visit.preferred_date) >= today &&
        visit.status !== "annule" &&
        visit.status !== "realise"
    )
    .sort((left, right) => {
      const leftDate = left.preferred_date ? new Date(left.preferred_date).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = right.preferred_date ? new Date(right.preferred_date).getTime() : Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    });

  const nextVisit = upcomingVisits[0] ?? null;
  const nextVisitProperty = pickFirst(nextVisit?.property);

  const weeklyVisits = buildWeeklyVisitSeries(visits);
  const weeklyTotalVisits = weeklyVisits.reduce((sum, point) => sum + point.total, 0);
  const peakVisitPoint = weeklyVisits.reduce(
    (top, point) => (point.total > top.total ? point : top),
    { label: "-", total: 0 }
  );

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - 6);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const previousWeekVisits = countRowsBetween(visits, previousWeekStart, currentWeekStart);
  const weeklyTrend =
    previousWeekVisits === 0
      ? weeklyTotalVisits > 0
        ? 100
        : 0
      : Math.round(((weeklyTotalVisits - previousWeekVisits) / previousWeekVisits) * 100);

  const statusBoard = [
    { key: "en_attente", label: "En attente", value: pendingVisits, tone: "bg-[#e8b86d]" },
    { key: "confirme", label: "Confirmées", value: confirmedVisits, tone: "bg-[#1a3a5c]" },
    { key: "realise", label: "Réalisées", value: completedVisits, tone: "bg-[#0f2540]" },
    { key: "annule", label: "Annulées", value: cancelledVisits, tone: "bg-slate-400" },
  ];
  const maxStatusValue = Math.max(...statusBoard.map((item) => item.value), 1);

  const headerChips = [
    { icon: Bell, value: pendingVisits, label: "en attente" },
    { icon: CalendarCheck, value: confirmedVisits, label: "confirmées" },
    { icon: ShieldCheck, value: `${profileCompletion}%`, label: "profil complété" },
  ];

  const spotlight = nextVisit
    ? {
        eyebrow: "Prochaine visite",
        title: nextVisit.preferred_date
          ? `Rendez-vous prévu le ${formatDate(nextVisit.preferred_date)}`
          : "Une visite attend votre confirmation",
        description: nextVisitProperty?.title
          ? `Suivez votre échange pour ${nextVisitProperty.title}.`
          : "Retrouvez vos prochaines demandes de visite en un coup d'œil.",
        href: "/dashboard-client/visites",
        cta: "Voir mes visites",
        icon: CalendarCheck,
      } : profileCompletion < 100
        ? {
            eyebrow: "Profil à finaliser",
            title: `Votre profil est complété à ${profileCompletion}%`,
            description: "Ajoutez vos coordonnées pour accélérer les échanges sur les visites et demandes.",
            href: "/dashboard-client/parametres",
            cta: "Compléter mon profil",
            icon: UserRound,
          }
        : {
            eyebrow: "Favoris",
            title: `${favorites.length} bien(s) sauvegardé(s) dans votre sélection`,
            description: "Retrouvez rapidement les biens que vous suivez déjà ou explorez de nouvelles annonces.",
            href: "/dashboard-client/favoris",
            cta: "Voir mes favoris",
            icon: Heart,
          };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link
            href="/dashboard-client/parametres"
            aria-label="Ouvrir mon profil client"
            className="flex flex-col items-start gap-3 rounded-[24px] transition-colors hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a5c]/15 min-[430px]:flex-row min-[430px]:items-center min-[430px]:gap-4"
          >
            <DashboardAvatar
              name={userName}
              avatarUrl={userAvatarUrl}
              className="h-12 w-12 shrink-0 rounded-[16px] bg-[#1a3a5c]/10 text-sm text-[#1a3a5c] ring-0 sm:h-14 sm:w-14 sm:rounded-[18px] sm:text-base lg:h-16 lg:w-16 lg:rounded-[20px] lg:text-lg"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                ESPACE CLIENT KOITALA
              </p>
              <h1 className="mt-2 break-words text-[1.4rem] font-extrabold leading-[1.05] tracking-tight text-[#0f1724] min-[430px]:text-[1.55rem] sm:text-[1.75rem] lg:text-3xl">
                Bonjour, {userName}
              </h1>
              <p className="mt-1.5 text-sm text-gray-600">
                Suivez vos visites et favoris depuis un tableau de bord unifié.
              </p>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Link
              href="/dashboard-client/visites"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
            >
              Mes visites
            </Link>
            <Link
              href="/biens"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
            >
              <Compass className="h-4 w-4" />
              Explorer les biens
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-3xl border border-[#1a3a5c]/10 bg-[#f8fafc] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c] text-white">
                <spotlight.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                  {spotlight.eyebrow}
                </p>
                <p className="mt-1 text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-lg">{spotlight.title}</p>
                <p className="mt-1.5 text-sm text-gray-600">{spotlight.description}</p>
                <Link
                  href={spotlight.href}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1a3a5c] hover:underline"
                >
                  {spotlight.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

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
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            icon: Heart,
            label: "Favoris",
            value: favorites.length,
            helper: `${favorites.length} bien(s) suivis`,
            bgColor: "#1d4ed8",
          },
          {
            icon: CalendarCheck,
            label: "Demandes",
            value: visits.length,
            helper: `${pendingVisits} en attente`,
            bgColor: "#047857",
          },
          {
            icon: ShieldCheck,
            label: "Confirmées",
            value: confirmedVisits,
            helper: `${completedVisits} réalisées`,
            bgColor: "#6b4226",
          },
          {
            icon: Home,
            label: "Biens à explorer",
            value: availableProperties.length,
            helper: "Sélection KOITALA",
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-lg">Pipeline des visites</h2>
                <span className="inline-flex max-w-full items-center rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                  {visits.length} au total
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
                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-lg">Demandes sur 7 jours</h2>
                <span className="inline-flex max-w-full items-center rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                  {weeklyTotalVisits} cette semaine
                </span>
              </div>
              <WeeklyVisitsChart data={weeklyVisits} />

              <div className="mt-3 flex flex-col items-start gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-500">
                  Pic: <span className="font-semibold text-[#0f1724]">{peakVisitPoint.total}</span> demande(s),{" "}
                  {peakVisitPoint.label}
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
                  {weeklyTrend}% vs semaine précédente
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f1724] sm:text-[1.05rem] lg:text-xl">Biens à découvrir</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Une sélection proche de l&apos;accueil pour relancer votre recherche.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Link
                  href="/dashboard-client/favoris"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:text-sm"
                >
                  Mes favoris
                </Link>
                <Link
                  href="/biens"
                  className="inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
                >
                  Explorer
                </Link>
              </div>
            </div>

            {availableProperties.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Home className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                <p className="text-sm text-gray-400">Aucune annonce disponible pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                {availableProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/biens/${property.slug}`}
                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all hover:border-[#1a3a5c]/20 hover:shadow-md"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={getPropertyImage(property)}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a3a5c] backdrop-blur">
                        {getListingTypeLabel(property.listing_type)}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0f1724]">{property.title}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5 text-[#1a3a5c]" />
                            {property.city}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-[#1a3a5c]" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold text-[#1a3a5c]">{formatPrice(property.price)}</p>
                        <span className="rounded-full bg-[#f4f6f9] px-2.5 py-1 text-[11px] font-semibold text-[#0f1724]">
                          Voir le bien
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                Actions utiles
              </h2>
              <LineChart className="h-4 w-4 text-[#1a3a5c]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  href: "/dashboard-client/parametres",
                  icon: UserRound,
                  label: "Paramètres",
                  className: "bg-[#1a3a5c] text-white hover:bg-[#0f2540]",
                },
                {
                  href: "/dashboard-client/favoris",
                  icon: Heart,
                  label: "Mes favoris",
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

            <div className="mt-3 space-y-2 rounded-2xl bg-[#f4f6f9] p-3 text-xs text-[#0f1724]">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[#1a3a5c]" />
                <span>{pendingVisits} demande(s) en attente de retour</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#1a3a5c]" />
                <a href="tel:+221766752135" className="font-semibold text-[#1a3a5c] hover:underline">
                  +221 76 675 21 35
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1a3a5c]" />
                <span>{completedVisits} visite(s) déjà réalisées</span>
              </div>
            </div>

            <Link
              href="/biens"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:underline"
            >
              Reprendre ma recherche
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
