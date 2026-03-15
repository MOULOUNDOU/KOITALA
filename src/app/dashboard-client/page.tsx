"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  Heart,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate,
  formatPrice,
  getListingTypeLabel,
  getStatusColor,
  getStatusLabel,
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

interface DashboardMessage {
  id: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  property: { slug: string; title: string } | { slug: string; title: string }[] | null;
}

interface FavoriteRow {
  id: string;
  created_at: string;
  property: DashboardProperty | DashboardProperty[] | null;
}

interface DashboardFavorite extends DashboardProperty {
  saved_at: string;
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

export default function DashboardClientPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [visits, setVisits] = useState<DashboardVisit[]>([]);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
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
      const emailFallback = user.email?.split("@")[0] ?? "Client";

      const [
        { data: prof },
        { data: vis },
        { data: msgs },
        { data: favs },
        { data: featuredProperties },
        { data: recentProperties },
      ] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("visit_requests")
            .select("id, status, preferred_date, created_at, message, property:properties(slug, title, main_image_url)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("contacts")
            .select("id, subject, message, status, created_at, property:properties(slug, title)")
            .eq("email", user.email ?? "")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("favorites")
            .select("id, created_at, property:properties(id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
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
      );

      setProfile({
        ...(prof ?? {}),
        full_name: profileName,
        email: prof?.email ?? user.email ?? "",
      });
      setVisits((vis as DashboardVisit[] | null) ?? []);
      setMessages((msgs as DashboardMessage[] | null) ?? []);
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
  const pendingVisits = visits.filter((visit) => visit.status === "en_attente").length;
  const unreadMessages = messages.filter((message) => message.status === "nouveau").length;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1724] sm:text-3xl">Bonjour, {userName}</h1>
            <p className="mt-1 text-sm text-gray-500">Espace utilisateur</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <Link
              href="/dashboard-client/profil"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c]/40 hover:bg-[#f8fafc]"
            >
              <UserRound className="h-4 w-4" />
              Profil
            </Link>
            <Link
              href="/biens"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#0f2540]"
            >
              <Home className="h-4 w-4" />
              Annonces
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Favoris", value: favorites.length, icon: Heart },
          { label: "Visites", value: visits.length, icon: CalendarCheck },
          { label: "Messages", value: messages.length, icon: MessageSquare },
          { label: "Biens", value: availableProperties.length, icon: Home },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
              <item.icon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#0f1724]">{item.value}</p>
          </div>
        ))}
      </section>

      {(pendingVisits > 0 || unreadMessages > 0) && (
        <section className="rounded-2xl border border-[#1a3a5c]/20 bg-[#f4f6f9] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
              <Bell className="h-4 w-4" />
            </div>
            <div className="text-sm text-[#0f1724]">
              {pendingVisits > 0 && <p>{pendingVisits} visite(s) en attente</p>}
              {unreadMessages > 0 && <p>{unreadMessages} message(s) nouveau(x)</p>}
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0f1724]">Annonces de l&apos;accueil</h2>
              <Link href="/biens" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                Voir tout
              </Link>
            </div>

            {availableProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                Aucune annonce
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {availableProperties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/biens/${property.slug}`}
                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all hover:border-[#1a3a5c]/20 hover:shadow-md"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={getPropertyImage(property)}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a3a5c] backdrop-blur">
                        {getListingTypeLabel(property.listing_type)}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-bold text-[#0f1724]">{property.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-[#1a3a5c]" />
                        {property.city}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold text-[#1a3a5c]">{formatPrice(property.price)}</p>
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#1a3a5c]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#0f1724]">Dernières visites</h2>
                <Link href="/dashboard-client/visites" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                  Tout voir
                </Link>
              </div>

              {visits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                  Aucune visite
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 3).map((visit) => {
                    const property = pickFirst(visit.property);
                    return (
                      <div key={visit.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 px-3.5 py-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                          <Image
                            src={getPropertyImage(property)}
                            alt={property?.title ?? "Bien"}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0f1724]">
                            {property?.title ?? "Bien supprimé"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {visit.preferred_date ? `${formatDate(visit.preferred_date)} · ` : ""}
                            {formatDate(visit.created_at)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(visit.status)}`}>
                          {getStatusLabel(visit.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#0f1724]">Messages récents</h2>
                <Link href="/dashboard-client/messages" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                  Tout voir
                </Link>
              </div>

              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                  Aucun message
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 3).map((message) => (
                    <div key={message.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 px-3.5 py-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0f1724]">
                          {message.subject?.trim() || "Message"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{message.message}</p>
                        <p className="mt-1 text-[11px] text-gray-400">{formatDate(message.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusLabel(message.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0f1724]">Favoris récents</h2>
              <Link href="/dashboard-client/favoris" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                Tout voir
              </Link>
            </div>

            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                Aucun favori
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.slice(0, 4).map((favorite) => (
                  <Link
                    key={favorite.id}
                    href={`/biens/${favorite.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 px-3.5 py-3 transition-all hover:border-[#1a3a5c]/20 hover:bg-[#f8fafc]"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={getPropertyImage(favorite)}
                        alt={favorite.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0f1724]">{favorite.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{favorite.city}</p>
                      <p className="mt-1 text-sm font-bold text-[#1a3a5c]">{formatPrice(favorite.price)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#1a3a5c]/20 bg-[#1a3a5c] p-5 text-white shadow-sm sm:p-6">
            <h2 className="text-lg font-bold">Assistance</h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/15"
              >
                Écrire à l&apos;agence
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+221766752135"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/15"
              >
                Appeler
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
