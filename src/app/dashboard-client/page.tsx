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

function getPropertyImage(
  property: {
    main_image_url?: string | null;
    property_images?: PropertyImageItem[] | null;
  } | null | undefined
): string {
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

      const [{ data: prof }, { data: vis }, { data: msgs }, { data: favs }, { data: properties }] =
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
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
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
  const profileCompletion = Math.round(
    ((Number(Boolean(profile.full_name)) + Number(Boolean(profile.email)) + Number(Boolean(profile.phone))) /
      3) *
      100
  );
  const engagementScore = Math.min(100, favorites.length * 12 + visits.length * 16 + messages.length * 10);
  const readinessScore = Math.min(
    100,
    Math.round(profileCompletion * 0.5 + pendingVisits * 15 + Math.max(0, 30 - unreadMessages * 5))
  );

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

  const overviewCards = [
    {
      href: "/dashboard-client/favoris",
      icon: Heart,
      iconClassName: "bg-[#e8b86d]/20 text-[#1a3a5c]",
      label: "Favoris actifs",
      value: favorites.length,
      helper:
        favorites.length > 0
          ? `${favorites.length} bien${favorites.length > 1 ? "s" : ""} à comparer`
          : "Commencez votre shortlist",
    },
    {
      href: "/dashboard-client/visites",
      icon: CalendarCheck,
      iconClassName: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
      label: "Demandes de visite",
      value: visits.length,
      helper:
        pendingVisits > 0
          ? `${pendingVisits} en attente de suivi`
          : "Aucune visite à relancer",
    },
    {
      href: "/dashboard-client/messages",
      icon: MessageSquare,
      iconClassName: "bg-[#0f2540]/10 text-[#0f2540]",
      label: "Messages envoyés",
      value: messages.length,
      helper:
        unreadMessages > 0
          ? `${unreadMessages} nouveau${unreadMessages > 1 ? "x" : ""}`
          : "Suivi de vos échanges",
    },
    {
      href: "/biens",
      icon: Home,
      iconClassName: "bg-[#e8b86d]/30 text-[#1a3a5c]",
      label: "Annonces disponibles",
      value: availableProperties.length,
      helper: "Dernières opportunités publiées",
    },
  ];

  const quickActions = [
    {
      href: "/biens",
      icon: Compass,
      title: "Explorer les biens",
      description: "Repérez rapidement les nouvelles annonces qui correspondent à votre recherche.",
      tone: "from-[#17314d] to-[#0f2540] text-white border-[#1a3a5c]",
      iconTone: "bg-white/12 text-white",
    },
    {
      href: "/dashboard-client/visites",
      icon: CalendarCheck,
      title: "Suivre mes visites",
      description:
        pendingVisits > 0
          ? `${pendingVisits} visite${pendingVisits > 1 ? "s" : ""} à confirmer ou surveiller.`
          : "Gardez un oeil sur vos prochaines visites et demandes envoyées.",
      tone: "from-[#fffaf2] to-white text-[#0f1724] border-[#e8b86d]/40",
      iconTone: "bg-[#e8b86d]/20 text-[#1a3a5c]",
    },
    {
      href: "/dashboard-client/profil",
      icon: ShieldCheck,
      title: "Compléter mon profil",
      description:
        profileCompletion < 100
          ? `Profil complété à ${profileCompletion}%. Ajoutez vos infos pour un meilleur suivi.`
          : "Votre fiche est prête et visible pour un traitement plus rapide.",
      tone: "from-white to-[#f8fafc] text-[#0f1724] border-gray-200",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
    {
      href: "/contact",
      icon: Phone,
      title: "Contacter l'agence",
      description: "Obtenez une réponse rapide pour une question, une visite ou un arbitrage.",
      tone: "from-white to-[#f8fafc] text-[#0f1724] border-gray-200",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
  ];

  const priorityCards = [
    {
      id: "profil",
      label: "Profil prêt",
      helper:
        profileCompletion >= 100
          ? "Votre profil est complet."
          : "Ajoutez vos coordonnées pour fluidifier les échanges.",
      value: profileCompletion,
      icon: ShieldCheck,
      barClassName: "bg-[#1a3a5c]",
      iconClassName: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
      href: "/dashboard-client/profil",
    },
    {
      id: "engagement",
      label: "Niveau d'activité",
      helper: "Basé sur vos favoris, visites et messages récents.",
      value: engagementScore,
      icon: Target,
      barClassName: "bg-[#e8b86d]",
      iconClassName: "bg-[#e8b86d]/20 text-[#1a3a5c]",
      href: "/dashboard-client/favoris",
    },
    {
      id: "readiness",
      label: "Prêt pour la prochaine visite",
      helper: "Plus vous êtes réactif, plus la mise en relation est rapide.",
      value: readinessScore,
      icon: Zap,
      barClassName: "bg-[#0f2540]",
      iconClassName: "bg-[#0f2540]/10 text-[#0f2540]",
      href: "/dashboard-client/visites",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#1a3a5c]/20 bg-[radial-gradient(circle_at_top_left,_rgba(232,184,109,0.30),_transparent_28%),linear-gradient(135deg,_#17314d_0%,_#0f2540_52%,_#081a2f_100%)] shadow-sm">
        <div className="absolute -right-14 top-6 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-[#e8b86d]/20 blur-3xl" />

        <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-7 lg:p-8 2xl:grid-cols-[minmax(0,1.4fr)_380px] 2xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
              <Bell className="h-3.5 w-3.5" />
              Espace utilisateur
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              Tout votre parcours immobilier,
              <span className="block text-[#f4d29a]">au meme endroit.</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
              Bienvenue, {userName}. Retrouvez vos biens favoris, vos visites, vos messages et les prochaines actions a effectuer dans un tableau de bord plus lisible sur mobile comme sur grand ecran.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90">
                <CalendarCheck className="h-4 w-4 text-[#f4d29a]" />
                {pendingVisits} visite{pendingVisits > 1 ? "s" : ""} en attente
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90">
                <MessageSquare className="h-4 w-4 text-[#f4d29a]" />
                {unreadMessages} message{unreadMessages > 1 ? "s" : ""} nouveau{unreadMessages > 1 ? "x" : ""}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90">
                <Heart className="h-4 w-4 text-[#f4d29a]" />
                {favorites.length} favori{favorites.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard-client/profil"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#1a3a5c] transition-all hover:bg-[#f4f6f9] hover:shadow-md"
              >
                Mettre a jour mon profil
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/biens"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15"
              >
                <Compass className="h-4 w-4" />
                Explorer les biens
              </Link>
            </div>
          </div>

          <aside className="rounded-[26px] border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8b86d] text-xl font-bold text-[#1a3a5c]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{userName}</p>
                <p className="truncate text-xs text-white/70">{profile.email ?? "Email non renseigne"}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  id: "profile",
                  label: "Profil complet",
                  value: profileCompletion,
                  barClassName: "bg-[#e8b86d]",
                },
                {
                  id: "engagement",
                  label: "Engagement",
                  value: engagementScore,
                  barClassName: "bg-white",
                },
              ].map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/80">
                    <span>{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/12">
                    <div className={`h-full rounded-full ${item.barClassName}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Visites</p>
                <p className="mt-1 text-xl font-bold text-white">{visits.length}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Messages</p>
                <p className="mt-1 text-xl font-bold text-white">{messages.length}</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Favoris</p>
                <p className="mt-1 text-xl font-bold text-white">{favorites.length}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 2xl:grid-cols-4">
        {overviewCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1a3a5c]/20 hover:shadow-md sm:p-5"
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconClassName}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{card.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-extrabold tracking-tight text-[#0f1724]">{card.value}</p>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-[#1a3a5c]" />
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-500">{card.helper}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group rounded-3xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${action.tone}`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.iconTone}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-lg font-bold">{action.title}</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">{action.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Ouvrir
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0f1724]">Activite recente</h2>
                <p className="mt-1 text-sm text-gray-500">Vos derniers favoris, messages et demandes de visite.</p>
              </div>
              <Link
                href="/dashboard-client/visites"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
              >
                Voir l'historique
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {activityFeed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-10 text-center text-sm text-gray-500">
                Aucune activite recente pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 transition-all hover:border-[#1a3a5c]/20 hover:bg-[#f8fafc]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c] shrink-0">
                      {item.icon === "visit" && <CalendarCheck className="h-4 w-4" />}
                      {item.icon === "message" && <MessageSquare className="h-4 w-4" />}
                      {item.icon === "favorite" && <Heart className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0f1724]">{item.label}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{item.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">{formatDate(item.date)}</p>
                      <ArrowRight className="ml-auto mt-1 h-4 w-4 text-gray-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#1a3a5c]" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0f1724]">Annonces recommandees</h2>
                <p className="mt-1 text-sm text-gray-500">Une selection recente a explorer depuis votre espace client.</p>
              </div>
              <Link
                href="/biens"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
              >
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {availableProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-10 text-center text-sm text-gray-500">
                Aucune annonce disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {availableProperties.slice(0, 6).map((property) => (
                  <Link
                    key={property.id}
                    href={`/biens/${property.slug}`}
                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1a3a5c]/20 hover:shadow-md"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={getPropertyImage(property)}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a3a5c] backdrop-blur">
                        {getListingTypeLabel(property.listing_type)}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="truncate text-base font-bold text-[#0f1724]">{property.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4 text-[#1a3a5c]" />
                        {property.city}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold text-[#1a3a5c]">{formatPrice(property.price)}</p>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a3a5c]">
                          Voir
                          <ArrowRight className="h-4 w-4" />
                        </span>
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
                <h2 className="text-lg font-bold text-[#0f1724]">Dernieres visites</h2>
                <Link
                  href="/dashboard-client/visites"
                  className="text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
                >
                  Tout voir
                </Link>
              </div>

              {visits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                  Aucune demande de visite pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 3).map((visit) => {
                    const property = pickFirst(visit.property);

                    return (
                      <div key={visit.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 px-3.5 py-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                          <Image
                            src={getPropertyImage(property)}
                            alt={property?.title ?? "Bien immobilier"}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#0f1724]">
                            {property?.title ?? "Bien supprime"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {visit.preferred_date ? `Date souhaitee: ${formatDate(visit.preferred_date)} · ` : ""}
                            Envoyee le {formatDate(visit.created_at)}
                          </p>
                          {visit.message && <p className="mt-1 truncate text-xs text-gray-500">{visit.message}</p>}
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
                <h2 className="text-lg font-bold text-[#0f1724]">Messages recents</h2>
                <Link
                  href="/dashboard-client/messages"
                  className="text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
                >
                  Tout voir
                </Link>
              </div>

              {messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                  Aucun message envoye pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.slice(0, 3).map((message) => {
                    const relatedProperty = pickFirst(message.property);

                    return (
                      <div key={message.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 px-3.5 py-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-[#0f1724]">
                              {message.subject?.trim() || "Message sans objet"}
                            </p>
                            <span className="shrink-0 text-xs text-gray-400">{formatDate(message.created_at)}</span>
                          </div>
                          <p className="line-clamp-2 text-sm text-gray-600">{message.message}</p>
                          {relatedProperty?.title && (
                            <p className="mt-1 text-xs text-gray-400">Concernant: {relatedProperty.title}</p>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(message.status)}`}>
                          {getStatusLabel(message.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0f1724]">Priorites du moment</h2>
                <p className="mt-1 text-sm text-gray-500">Les points a suivre pour avancer plus vite.</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a5c]/10 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                <Clock3 className="h-3.5 w-3.5" />
                Suivi live
              </span>
            </div>

            <div className="space-y-4">
              {priorityCards.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-gray-100 p-4 transition-all hover:border-[#1a3a5c]/15 hover:bg-[#f8fafc]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0f1724]">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{item.helper}</p>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClassName}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${item.barClassName}`} style={{ width: `${item.value}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400">{item.value}%</span>
                    <span className="font-semibold text-[#1a3a5c]">Ouvrir</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#1a3a5c]/20 bg-[#1a3a5c] p-5 text-white shadow-sm sm:p-6">
            <h2 className="text-lg font-bold">Centre d'assistance</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Besoin d'aide rapide ? Utilisez le canal adapte a votre besoin sans quitter votre espace utilisateur.
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/15"
              >
                Envoyer une demande prioritaire
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+221766752135"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/15"
              >
                Appeler le conseiller KOITALA
                <Phone className="h-4 w-4" />
              </a>
              <Link
                href="/dashboard-client/messages"
                className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold transition-colors hover:bg-white/15"
              >
                Suivre mes echanges
                <Bell className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/8 p-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-white/55">Conseil du jour</p>
              <p className="inline-flex items-start gap-2 text-sm leading-6 text-white/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d29a]" />
                <span>Preparez vos documents et vos questions avant chaque visite pour accelerer la decision.</span>
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0f1724]">Favoris recents</h2>
              <Link
                href="/dashboard-client/favoris"
                className="text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
              >
                Tout voir
              </Link>
            </div>

            {favorites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f4f6f9] py-8 text-center text-sm text-gray-500">
                Aucun bien en favori.
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
        </aside>
      </section>
    </div>
  );
}
