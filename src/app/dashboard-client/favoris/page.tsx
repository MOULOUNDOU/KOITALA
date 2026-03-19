"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Heart, MapPin, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ClientPageHero from "@/components/dashboard/ClientPageHero";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice, getListingTypeLabel } from "@/lib/utils";

interface PropertyImageItem {
  url: string;
  is_main: boolean;
  order_index: number;
}

interface FavoriteProperty {
  id: string;
  slug: string;
  title: string;
  city: string;
  price: number;
  listing_type: "vente" | "location";
  main_image_url: string | null;
  property_images?: PropertyImageItem[] | null;
}

interface FavoriteItem {
  id: string;
  created_at: string;
  property: FavoriteProperty;
}

interface FavoriteRow {
  id: string;
  created_at: string;
  property: FavoriteProperty | FavoriteProperty[] | null;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getPropertyImage(property: FavoriteProperty): string {
  if (property.main_image_url) {
    return property.main_image_url;
  }

  const mainImage = property.property_images?.find((image) => image.is_main);
  if (mainImage?.url) {
    return mainImage.url;
  }

  if (property.property_images?.[0]?.url) {
    return property.property_images[0].url;
  }

  return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
}

export default function FavorisClientPage() {
  const supabase = useMemo(() => createClient(), []);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFavorites = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select(
          "id, created_at, property:properties(id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index))"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      const rows = (data as FavoriteRow[] | null) ?? [];
      const items = rows
        .map((row) => {
          const property = pickFirst(row.property);
          if (!property) return null;
          return {
            id: row.id,
            created_at: row.created_at,
            property,
          };
        })
        .filter((item): item is FavoriteItem => item !== null);

      setFavorites(items);
      setLoading(false);
    };

    void loadFavorites();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    setRemovingId(favoriteId);

    const { error } = await supabase.from("favorites").delete().eq("id", favoriteId);

    setRemovingId(null);

    if (error) {
      toast.error("Impossible de retirer ce favori.");
      return;
    }

    setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
    toast.success("Favori retiré.");
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  const saleFavorites = favorites.filter((item) => item.property.listing_type === "vente").length;
  const rentalFavorites = favorites.filter((item) => item.property.listing_type === "location").length;

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <ClientPageHero
        title="Mes favoris"
        description="Conservez vos biens préférés dans une sélection claire et directement exploitable."
        chips={[
          { icon: Heart, value: favorites.length, label: "favoris" },
          { icon: Compass, value: saleFavorites, label: "à vendre" },
          { icon: ArrowRight, value: rentalFavorites, label: "à louer" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard-client"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
            >
              Retour dashboard
            </Link>
            <Link
              href="/biens"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
            >
              <Compass className="h-4 w-4" />
              Explorer plus de biens
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Heart,
            label: "Biens sauvegardés",
            value: favorites.length,
            helper: "Sélection personnelle",
            bgColor: "#1d4ed8",
          },
          {
            icon: Compass,
            label: "Ventes suivies",
            value: saleFavorites,
            helper: "Biens à l'achat",
            bgColor: "#047857",
          },
          {
            icon: ArrowRight,
            label: "Locations suivies",
            value: rentalFavorites,
            helper: "Biens à louer",
            bgColor: "#6b4226",
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

      {favorites.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <Heart className="mx-auto mb-4 h-12 w-12 text-gray-200 sm:h-14 sm:w-14" />
          <h3 className="text-base font-semibold text-gray-700 sm:text-lg">Aucun favori pour le moment</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Ajoutez des biens à vos favoris depuis les annonces pour les retrouver rapidement ici.
          </p>
          <Link
            href="/biens"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((item) => (
            <article key={item.id} className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href={`/biens/${item.property.slug}`}
                  className="relative h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-44"
                >
                  <Image
                    src={getPropertyImage(item.property)}
                    alt={item.property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 176px"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/biens/${item.property.slug}`}
                        className="line-clamp-1 text-[15px] font-semibold text-[#0f1724] transition-colors hover:text-[#1a3a5c] sm:text-base lg:text-lg"
                      >
                        {item.property.title}
                      </Link>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" /> {item.property.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveFavorite(item.id)}
                      disabled={removingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      {removingId === item.id ? "Retrait..." : "Retirer"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
                    <p className="text-base font-bold text-[#1a3a5c] sm:text-lg">{formatPrice(item.property.price)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#1a3a5c]/10 px-2.5 py-1 text-xs font-medium text-[#1a3a5c]">
                        {getListingTypeLabel(item.property.listing_type)}
                      </span>
                      <span className="text-xs text-gray-400">Ajouté le {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
