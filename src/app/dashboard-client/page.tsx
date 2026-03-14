"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Target,
  Zap,
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
  property: Pick<DashboardProperty, "slug" | "title" | "main_image_url"> | Pick<DashboardProperty, "slug" | "title" | "main_image_url">[] | null;
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

interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  date: string;
  href: string;
  icon: "visit" | "message" | "favorite";
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getPropertyImage(property: {
  main_image_url?: string | null;
  property_images?: PropertyImageItem[] | null;
} | null | undefined): string {
  if (!property) {
    return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
  }

  if (property.main_image_url) {
    return property.main_image_url;
  }

  const mainImage = property.property_images?.find((image) => image.is_main);
  if (mainImage?.url) {
    return mainImage.url;
  }

  const firstImage = property.property_images?.[0]?.url;
  if (firstImage) {
    return firstImage;
  }

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
      const { data: { user } } = await supabase.auth.getUser();

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
        { data: properties },
      ] = await Promise.all([
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
          .order("created_at", { ascending: false })
          .limit(8),
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

      setProfile({
        ...(prof ?? {}),
        full_name: profileName,
        email: prof?.email ?? user.email ?? "",
      });
      setVisits((vis as DashboardVisit[] | null) ?? []);
      setMessages((msgs as DashboardMessage[] | null) ?? []);
      setFavorites(favoriteItems);
      setAvailableProperties((properties as DashboardProperty[] | null) ?? []);
      setLoading(false);

      if (!prof?.full_name?.trim() && metadataName) {
        await supabase
          .from("profiles")
          .update({ full_name: metadataName })
          .eq("id", user.id);
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
  const profileCompletion = Math.round(
    ((Number(Boolean(profile.full_name)) + Number(Boolean(profile.email)) + Number(Boolean(profile.phone))) / 3) * 100
  );
  const engagementScore = Math.min(100, favorites.length * 12 + visits.length * 16 + messages.length * 10);
  const readinessScore = Math.min(100, Math.round(profileCompletion * 0.5 + pendingVisits * 15 + Math.max(0, 30 - unreadMessages * 5)));

  const activityFeed = useMemo<ActivityItem[]>(() => {
    const visitActivities: ActivityItem[] = visits.map((visit) => {
      const property = pickFirst(visit.property);
      return {
        id: `visit-${visit.id}`,
        label: "Demande de visite envoyée",
        detail: property?.title ?? "Bien supprimé",
        date: visit.created_at,
        href: property?.slug ? `/biens/${property.slug}` : "/dashboard-client/visites",
        icon: "visit",
      };
    });

    const messageActivities: ActivityItem[] = messages.map((message) => {
      const property = pickFirst(message.property);
      return {
        id: `message-${message.id}`,
        label: message.subject?.trim() || "Message envoyé à l'agence",
        detail: property?.title ? `Concernant ${property.title}` : "Message général",
        date: message.created_at,
        href: property?.slug ? `/biens/${property.slug}` : "/dashboard-client/messages",
        icon: "message",
      };
    });

    const favoriteActivities: ActivityItem[] = favorites.map((favorite) => ({
      id: `favorite-${favorite.id}`,
      label: "Bien ajouté en favori",
      detail: favorite.title,
      date: favorite.saved_at,
      href: `/biens/${favorite.slug}`,
      icon: "favorite",
    }));

    return [...visitActivities, ...messageActivities, ...favoriteActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [favorites, messages, visits]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="rounded-3xl border border-[#1a3a5c]/30 bg-[#1a3a5c] shadow-sm">
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 items-end">
          <div>
            <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Bienvenue, {userName}
            </h1>
            <p className="mt-2 text-white text-sm sm:text-base max-w-2xl">
              Suivez vos visites, vos messages et vos favoris dans un seul espace. Toutes vos actions importantes sont accessibles ici.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard-client/profil"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1a3a5c] text-sm font-semibold hover:bg-[#f4f6f9] transition-colors"
              >
                Mettre à jour mon profil <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/biens"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white border border-white/25 text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                <Compass className="w-4 h-4" /> Explorer les biens
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#e8b86d] text-[#1a3a5c] font-bold flex items-center justify-center text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-white/70 truncate">{profile.email ?? "Email non renseigné"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
                <p className="text-white/70">Visites en attente</p>
                <p className="text-white text-lg font-bold">{pendingVisits}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5">
                <p className="text-white/70">Messages nouveaux</p>
                <p className="text-white text-lg font-bold">{unreadMessages}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-[#e8b86d]/20 text-[#1a3a5c] flex items-center justify-center mb-3">
            <Heart className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500">Favoris</p>
          <p className="text-2xl font-bold text-[#0f1724] mt-0.5">{favorites.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center mb-3">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500">Demandes de visite</p>
          <p className="text-2xl font-bold text-[#0f1724] mt-0.5">{visits.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-[#0f2540]/10 text-[#0f2540] flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500">Messages envoyés</p>
          <p className="text-2xl font-bold text-[#0f1724] mt-0.5">{messages.length}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl bg-[#e8b86d]/30 text-[#1a3a5c] flex items-center justify-center mb-3">
            <Home className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-500">Annonces dispo</p>
          <p className="text-2xl font-bold text-[#0f1724] mt-0.5">{availableProperties.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard-client/favoris"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:border-[#1a3a5c]/20 hover:shadow-md transition-all"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#0f1724]">
            <Heart className="w-4 h-4 text-[#1a3a5c]" /> Voir mes favoris
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link
          href="/dashboard-client/visites"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:border-[#1a3a5c]/20 hover:shadow-md transition-all"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#0f1724]">
            <CalendarCheck className="w-4 h-4 text-[#1a3a5c]" /> Suivre mes visites
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link
          href="/contact"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:border-[#1a3a5c]/20 hover:shadow-md transition-all"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#0f1724]">
            <Phone className="w-4 h-4 text-[#1a3a5c]" /> Contacter l&apos;agence
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Priorités du moment</h2>
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] font-medium">
              <Clock3 className="w-3.5 h-3.5" /> Suivi live
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "profil",
                label: "Profil client complété",
                helper: profileCompletion >= 100 ? "Parfait, votre fiche est complète." : "Ajoutez toutes vos infos pour un meilleur suivi.",
                value: profileCompletion,
                icon: ShieldCheck,
                color: "bg-[#1a3a5c]",
              },
              {
                id: "engagement",
                label: "Niveau d'activité",
                helper: "Basé sur vos favoris, visites et messages.",
                value: engagementScore,
                icon: Target,
                color: "bg-[#e8b86d]",
              },
              {
                id: "readiness",
                label: "Prêt pour votre prochaine visite",
                helper: "Optimisez votre réactivité pour avancer plus vite.",
                value: readinessScore,
                icon: Zap,
                color: "bg-[#0f2540]",
              },
            ].map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <p className="text-sm font-semibold text-[#0f1724]">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.helper}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a3a5c] rounded-2xl border border-[#1a3a5c]/30 shadow-sm p-5 sm:p-6 text-white">
          <h2 className="text-base sm:text-lg font-semibold">Centre d&apos;assistance</h2>
          <p className="text-sm text-white/75 mt-1">
            Besoin d&apos;aide rapide ? Contactez l&apos;équipe KOITALA par le canal qui vous convient.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/contact"
              className="w-full inline-flex items-center justify-between rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/15"
            >
              Envoyer une demande prioritaire
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+221766752135"
              className="w-full inline-flex items-center justify-between rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/15"
            >
              Appeler le conseiller KOITALA
              <Phone className="w-4 h-4" />
            </a>
            <Link
              href="/dashboard-client/messages"
              className="w-full inline-flex items-center justify-between rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/15"
            >
              Suivre mes échanges
              <Bell className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-white/8 border border-white/15 p-4">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2">Conseil du jour</p>
            <p className="text-sm text-white/85 inline-flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#e8b86d] shrink-0" />
              <span>
              Préparez vos documents et vos questions avant chaque visite pour accélérer la décision.
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Activité récente</h2>
          <Link href="/dashboard-client/visites" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
            Voir l&apos;historique <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activityFeed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
            Aucune activité récente pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-[#1a3a5c]/20 hover:bg-[#f4f6f9]"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center shrink-0">
                  {item.icon === "visit" && <CalendarCheck className="w-4 h-4" />}
                  {item.icon === "message" && <MessageSquare className="w-4 h-4" />}
                  {item.icon === "favorite" && <Heart className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0f1724] truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{item.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                  <ArrowRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Annonces recommandées</h2>
          <Link href="/biens" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {availableProperties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-[#f4f6f9] py-10 text-center text-sm text-gray-500">
            Aucune annonce disponible pour le moment.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {availableProperties.slice(0, 6).map((property) => (
              <Link
                key={property.id}
                href={`/biens/${property.slug}`}
                className="min-w-[220px] sm:min-w-[260px] max-w-[300px] rounded-2xl border border-gray-100 hover:border-[#1a3a5c]/20 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="relative h-36">
                  <Image
                    src={getPropertyImage(property)}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
                <div className="p-3.5">
                  <p className="font-semibold text-[#0f1724] truncate">{property.title}</p>
                  <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {property.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-bold text-[#1a3a5c]">{formatPrice(property.price)}</span>
                    <span className="px-2 py-1 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] text-xs font-medium">
                      {getListingTypeLabel(property.listing_type)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Dernières visites</h2>
              <Link href="/dashboard-client/visites" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                Tout voir
              </Link>
            </div>

            {visits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                Aucune demande de visite pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {visits.slice(0, 3).map((visit) => {
                  const property = pickFirst(visit.property);
                  return (
                    <div key={visit.id} className="rounded-xl border border-gray-100 px-3.5 py-3 flex items-center gap-3">
                      <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={getPropertyImage(property)}
                          alt={property?.title ?? "Bien immobilier"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#0f1724] truncate text-sm">{property?.title ?? "Bien supprimé"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {visit.preferred_date ? `Date souhaitée: ${formatDate(visit.preferred_date)} · ` : ""}
                          Envoyée le {formatDate(visit.created_at)}
                        </p>
                        {visit.message && <p className="text-xs text-gray-500 mt-1 truncate">{visit.message}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(visit.status)}`}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Messages récents</h2>
              <Link href="/dashboard-client/messages" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                Tout voir
              </Link>
            </div>

            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                Aucun message envoyé pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice(0, 3).map((message) => {
                  const relatedProperty = pickFirst(message.property);
                  return (
                    <div key={message.id} className="rounded-xl border border-gray-100 px-3.5 py-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="font-medium text-[#0f1724] truncate text-sm">{message.subject?.trim() || "Message sans objet"}</p>
                          <span className="text-xs text-gray-400 shrink-0">{formatDate(message.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                        {relatedProperty?.title && (
                          <p className="text-xs text-gray-400 mt-1">Concernant: {relatedProperty.title}</p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(message.status)}`}>
                        {getStatusLabel(message.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-[#0f1724]">Favoris récents</h2>
            <Link href="/dashboard-client/favoris" className="text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
              Tout voir
            </Link>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
              Aucun bien en favori.
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.slice(0, 4).map((favorite) => (
                <Link
                  key={favorite.id}
                  href={`/biens/${favorite.slug}`}
                  className="rounded-xl border border-gray-100 px-3.5 py-3 flex items-center gap-3 hover:border-[#1a3a5c]/20 hover:bg-[#f4f6f9] transition-all"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={getPropertyImage(favorite)}
                      alt={favorite.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0f1724] truncate text-sm">{favorite.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{favorite.city}</p>
                    <p className="text-sm font-semibold text-[#1a3a5c] mt-1">{formatPrice(favorite.price)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
