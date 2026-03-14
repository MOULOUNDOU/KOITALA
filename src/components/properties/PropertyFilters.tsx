"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X, MapPin, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect from "@/components/ui/CustomSelect";

const PROPERTY_TYPE_OPTS = [
  { value: "appartement",      label: "Appartement" },
  { value: "maison",           label: "Maison" },
  { value: "villa",            label: "Villa" },
  { value: "terrain",          label: "Terrain" },
  { value: "bureau",           label: "Bureau" },
  { value: "local_commercial", label: "Local commercial" },
  { value: "duplex",           label: "Duplex" },
];

const SENEGAL_CITIES = [
  "Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack",
  "Mbour", "Rufisque", "Diourbel", "Louga", "Fatick",
  "Tambacounda", "Kolda", "Matam", "Kédougou", "Sédhiou",
];

const DAKAR_NEIGHBORHOODS = [
  "Plateau", "Almadies", "Point E", "Fann-Résidence", "Mermoz",
  "Ouakam", "Yoff", "Ngor", "Sacré-Cœur", "Liberté",
  "HLM", "Grand Dakar", "Médina", "Sicap", "Parcelles Assainies",
  "Guédiawaye", "Pikine", "Les Mamelles", "Hann Mariste",
  "Bel Air", "Corniche", "Dieuppeul", "Patte d'Oie",
  "Cité Keur Gorgui", "Amitié", "Keur Massar",
];


export default function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    listing_type: searchParams.get("listing_type") ?? "",
    property_type: searchParams.get("property_type") ?? searchParams.get("type") ?? "",
    city: searchParams.get("city") ?? "",
    neighborhood: searchParams.get("neighborhood") ?? "",
    min_price: searchParams.get("min_price") ?? "",
    max_price: searchParams.get("max_price") ?? "",
    min_area: searchParams.get("min_area") ?? "",
    max_area: searchParams.get("max_area") ?? "",
    bedrooms: searchParams.get("bedrooms") ?? "",
    query: searchParams.get("query") ?? "",
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/biens?${params.toString()}`);
    setMobileOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      listing_type: "",
      property_type: "",
      city: "",
      neighborhood: "",
      min_price: "",
      max_price: "",
      min_area: "",
      max_area: "",
      bedrooms: "",
      query: "",
    });
    router.push("/biens");
    setMobileOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const FilterContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0f1724] flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Type d'annonce */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Type d&apos;annonce
        </p>
        <div className="flex gap-2">
          {[
            { value: "", label: "Tous" },
            { value: "vente", label: "Vente" },
            { value: "location", label: "Location" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilters((f) => ({ ...f, listing_type: opt.value }))}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-medium border transition-colors",
                filters.listing_type === opt.value
                  ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                  : "border-gray-200 text-gray-600 hover:border-[#1a3a5c] hover:text-[#1a3a5c]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <CustomSelect
          label="Type de bien"
          value={filters.property_type}
          onChange={(v) => setFilters((f) => ({ ...f, property_type: v }))}
          options={PROPERTY_TYPE_OPTS}
          placeholder="Tous les types"
          icon={<Home className="w-4 h-4" />}
          clearable
          dropUp
        />
      </div>

      {/* Ville */}
      <div>
        <CustomSelect
          label="Ville"
          value={filters.city}
          onChange={(v) => setFilters((f) => ({ ...f, city: v, neighborhood: "" }))}
          options={SENEGAL_CITIES.map((c) => ({ value: c, label: c }))}
          placeholder="Toutes les villes"
          icon={<MapPin className="w-4 h-4" />}
          searchable
          clearable
          dropUp
        />
      </div>

      {/* Quartier */}
      <div>
        <CustomSelect
          label="Quartier"
          value={filters.neighborhood}
          onChange={(v) => setFilters((f) => ({ ...f, neighborhood: v }))}
          options={
            (filters.city === "Dakar" || filters.city === "")
              ? DAKAR_NEIGHBORHOODS.map((n) => ({ value: n, label: n }))
              : []
          }
          placeholder="Tous les quartiers"
          icon={<MapPin className="w-4 h-4" />}
          searchable
          clearable
          dropUp
        />
      </div>

      {/* Prix */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Budget (XOF)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
        </div>
      </div>

      {/* Surface */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Surface (m²)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_area}
            onChange={(e) => setFilters((f) => ({ ...f, min_area: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_area}
            onChange={(e) => setFilters((f) => ({ ...f, max_area: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
        </div>
      </div>

      {/* Chambres */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
          Chambres (min)
        </p>
        <div className="flex gap-2">
          {["", "1", "2", "3", "4", "5+"].map((n) => (
            <button
              key={n}
              onClick={() => setFilters((f) => ({ ...f, bedrooms: n === "5+" ? "5" : n }))}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-medium border transition-colors",
                filters.bedrooms === (n === "5+" ? "5" : n)
                  ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                  : "border-gray-200 text-gray-600 hover:border-[#1a3a5c] hover:text-[#1a3a5c]"
              )}
            >
              {n || "Tous"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={applyFilters}
        className="w-full py-3 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors shadow-sm"
      >
        Appliquer les filtres
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors",
            hasActiveFilters
              ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
              : "border-gray-200 text-gray-700 hover:border-[#1a3a5c]"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres{hasActiveFilters ? " (actifs)" : ""}
        </button>
        {mobileOpen && (
          <div className="mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
            <FilterContent />
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
        <FilterContent />
      </div>
    </>
  );
}
