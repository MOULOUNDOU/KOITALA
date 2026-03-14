"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice, getListingTypeLabel } from "@/lib/utils";
import toast from "react-hot-toast";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("favorites")
        .select("id, created_at, property:properties(id, slug, title, city, price, listing_type, main_image_url, property_images(url, is_main, order_index))")
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

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", favoriteId);

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
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1724]">Mes favoris</h1>
            <p className="text-sm text-gray-500 mt-1">
              {favorites.length} bien{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a5c] text-white text-sm font-semibold hover:bg-[#0f2540] transition-colors"
          >
            Explorer plus de biens <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center px-4">
          <Heart className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun favori pour le moment</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md">
            Ajoutez des biens à vos favoris depuis les annonces pour les retrouver rapidement ici.
          </p>
          <Link
            href="/biens"
            className="px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <Link href={`/biens/${item.property.slug}`} className="relative w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100">
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
                      <Link href={`/biens/${item.property.slug}`} className="font-semibold text-[#0f1724] text-base sm:text-lg hover:text-[#1a3a5c] transition-colors line-clamp-1">
                        {item.property.title}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500 inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {item.property.city}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveFavorite(item.id)}
                      disabled={removingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      {removingId === item.id ? "Retrait..." : "Retirer"}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
                    <p className="text-lg font-bold text-[#1a3a5c]">{formatPrice(item.property.price)}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] text-xs font-medium">
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
