"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PropertyCard from "@/components/properties/PropertyCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Property } from "@/types";

export default function FavorisPage() {
  const router = useRouter();
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async (result) => {
      const user = result.data.user;
      if (!user) { router.push("/auth/login?redirectTo=/favoris"); return; }
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
  }, [supabase, router]);

  const handleFavoriteRemoved = (propertyId: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
  };

  return (
    <>
      <Navbar />
      <div className="bg-[#0f1724] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-1">Mes favoris</h1>
          <p className="text-gray-400">
            {loading ? "Chargement..." : `${properties.length} bien${properties.length !== 1 ? "s" : ""} sauvegardé${properties.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <section className="py-12 bg-[#f4f6f9] min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Aucun favori pour le moment
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Enregistrez des biens en cliquant sur le c�ur depuis les annonces.
              </p>
              <Link
                href="/biens"
                className="px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors"
              >
                Parcourir les annonces
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      </section>
      <Footer />
    </>
  );
}
