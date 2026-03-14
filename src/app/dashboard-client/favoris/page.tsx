"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PropertyCard from "@/components/properties/PropertyCard";
import type { Property } from "@/types";

export default function FavorisClientPage() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("property:properties(*, property_images(*))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const props = (data ?? [])
        .map((f: Record<string, unknown>) => f.property as Property)
        .filter(Boolean);
      setProperties(props);
      setLoading(false);
    });
  }, [supabase]);

  const handleFavoriteRemoved = (propertyId: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0f1724]">Mes favoris</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {properties.length} bien{properties.length !== 1 ? "s" : ""} sauvegardé{properties.length !== 1 ? "s" : ""}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <Heart className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun favori</h3>
          <p className="text-sm text-gray-400 mb-6">Enregistrez des biens en cliquant sur le coeur depuis les annonces.</p>
          <a href="/biens" className="px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors">
            Parcourir les annonces
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorite={true}
              onFavoriteToggle={handleFavoriteRemoved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
