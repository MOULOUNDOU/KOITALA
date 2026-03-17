"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, MessageSquare, Heart, ArrowRight, Search, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PropertyCard from "@/components/properties/PropertyCard";
import { formatDate, formatPrice, getListingTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Profile, VisitRequest, Contact, Property } from "@/types";

type FavoriteSummary = {
  id: string;
  slug: string;
  title: string;
  city: string;
  price: number;
  listing_type: "vente" | "location";
};

type FavoriteRow = {
  property: FavoriteSummary | FavoriteSummary[] | null;
};

export default function DashboardClientPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [messages, setMessages] = useState<Contact[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSummary[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const res = await supabase.auth.getUser();
      const user = res.data?.user ?? null;

      if (!user) {
        setLoading(false);
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user.email?.split("@")[0] ?? "";

      const [{ data: prof }, { data: vis }, { data: msgs }, { data: favs }, { data: properties }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("visit_requests").select("*, property:properties(title, slug)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("contacts").select("*, property:properties(title)").eq("email", user.email!).order("created_at", { ascending: false }),
        supabase
          .from("favorites")
          .select("property:properties(id, slug, title, city, price, listing_type)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("properties")
          .select("*")
          .eq("status", "publie")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const favoriteRows = (favs ?? []) as FavoriteRow[];

      const favoriteItems = favoriteRows
        .map((f: FavoriteRow) => {
          const property = f.property;
          if (Array.isArray(property)) return property[0] ?? null;
          return property;
        })
        .filter((property: FavoriteSummary | null): property is FavoriteSummary => property !== null);

      const profileName = prof?.full_name?.trim() || metadataName || emailFallback || "Client";

      setProfile({
        ...(prof ?? {}),
        full_name: profileName,
        email: prof?.email ?? user.email ?? "",
      });
      setVisits((vis as VisitRequest[]) ?? []);
      setMessages((msgs as Contact[]) ?? []);
      setFavorites(favoriteItems);
      setAvailableProperties((properties as Property[]) ?? []);
      setLoading(false);

      if (!prof?.full_name?.trim() && metadataName) {
        await supabase
          .from("profiles")
          .update({ full_name: metadataName })
          .eq("id", user.id);
      }
    };

    void loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f1724]">
          Bonjour, {profile.full_name || "Client"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-[#0f1724]">Annonces disponibles</h2>
          <Link
            href="/biens"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {availableProperties.length === 0 ? (
          <div className="rounded-xl bg-[#f7f9fc] border border-gray-100 py-10 text-center text-sm text-gray-500">
            Aucune annonce disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {availableProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm text-gray-500">Favoris</p>
          </div>
          <p className="text-3xl font-bold text-[#0f1724]">{favorites.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Demandes de visite</p>
          </div>
          <p className="text-3xl font-bold text-[#0f1724]">{visits.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Messages envoyés</p>
          </div>
          <p className="text-3xl font-bold text-[#0f1724]">{messages.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-[#0f1724] mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/dashboard-client/favoris" className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
            <span className="inline-flex items-center gap-2"><Heart className="w-4 h-4 text-[#1a3a5c]" /> Voir mes favoris</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link href="/biens" className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
            <span className="inline-flex items-center gap-2"><Search className="w-4 h-4 text-[#1a3a5c]" /> Explorer les annonces</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link href="/contact" className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
            <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4 text-[#1a3a5c]" /> Contacter l&apos;agence</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] flex items-center gap-2 mb-4">
            <CalendarCheck className="w-4 h-4" /> Dernières demandes de visite
          </h2>
          {visits.length === 0 ? (
            <div className="rounded-xl bg-[#f7f9fc] border border-gray-100 py-10 text-center text-sm text-gray-500">
              Aucune demande de visite pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {visits.slice(0, 3).map((v) => (
                <div key={v.id} className="rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-4">
                  <CalendarCheck className="w-6 h-6 text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0f1724] truncate text-sm">
                      {(v.property as { title?: string } | null)?.title ?? "Bien supprimé"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.preferred_date && `${formatDate(v.preferred_date)} · `}
                      {formatDate(v.created_at)}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(v.status)}`}>
                    {getStatusLabel(v.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4" /> Favoris récents
          </h2>
          {favorites.length === 0 ? (
            <div className="rounded-xl bg-[#f7f9fc] border border-gray-100 py-10 text-center text-sm text-gray-500">
              Aucun favori pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.slice(0, 3).map((fav) => (
                <Link
                  key={fav.id}
                  href={`/biens/${fav.slug}`}
                  className="rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#0f1724] truncate text-sm">{fav.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fav.city} · {getListingTypeLabel(fav.listing_type)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#1a3a5c] shrink-0">{formatPrice(fav.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
