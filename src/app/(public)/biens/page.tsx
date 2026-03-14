export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyFilters from "@/components/properties/PropertyFilters";
import { Building2, SlidersHorizontal } from "lucide-react";
import type { Property, SearchFilters } from "@/types";

export const metadata: Metadata = {
  title: "Nos Biens",
  description:
    "Parcourez toutes nos annonces immobilières : appartements, maisons, villas, terrains et bureaux.",
};

async function getProperties(filters: SearchFilters): Promise<Property[]> {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "publie")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.listing_type) {
    query = query.eq("listing_type", filters.listing_type);
  }
  if (filters.property_type) {
    query = query.eq("property_type", filters.property_type);
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.neighborhood) {
    query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  }
  if (filters.min_price) {
    query = query.gte("price", Number(filters.min_price));
  }
  if (filters.max_price) {
    query = query.lte("price", Number(filters.max_price));
  }
  if (filters.min_area) {
    query = query.gte("area", Number(filters.min_area));
  }
  if (filters.max_area) {
    query = query.lte("area", Number(filters.max_area));
  }
  if (filters.bedrooms) {
    query = query.gte("bedrooms", Number(filters.bedrooms));
  }
  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,city.ilike.%${filters.query}%,neighborhood.ilike.%${filters.query}%`
    );
  }

  const { data } = await query.limit(50);
  return data ?? [];
}

interface BienPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function BiensPage({ searchParams }: BienPageProps) {
  const params = await searchParams;

  const filters: SearchFilters = {
    listing_type: (params.listing_type as SearchFilters["listing_type"]) ?? "",
    property_type:
      (params.property_type as SearchFilters["property_type"]) ??
      (params.type as SearchFilters["property_type"]) ??
      "",
    city: params.city ?? "",
    neighborhood: params.neighborhood ?? "",
    min_price: params.min_price ? Number(params.min_price) : "",
    max_price: params.max_price ? Number(params.max_price) : "",
    min_area: params.min_area ? Number(params.min_area) : "",
    max_area: params.max_area ? Number(params.max_area) : "",
    bedrooms: params.bedrooms ? Number(params.bedrooms) : "",
    query: params.query ?? "",
  };

  const properties = await getProperties(filters);

  return (
    <>
      {/* Header */}
      <div className="bg-[#0f1724] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nos biens</h1>
          <p className="text-gray-400">
            {properties.length} bien{properties.length !== 1 ? "s" : ""}{" "}
            disponible{properties.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <div className="lg:w-72 shrink-0">
            <Suspense fallback={null}>
              <PropertyFilters />
            </Suspense>
          </div>

          {/* Properties grid */}
          <div className="flex-1 min-w-0">
            {properties.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-[#0f1724]">
                      {properties.length}
                    </span>{" "}
                    résultat{properties.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Aucun bien trouvé
                </h3>
                <p className="text-sm text-gray-400">
                  Modifiez vos critères de recherche pour voir plus de résultats.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
