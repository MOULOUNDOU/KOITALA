"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home, DollarSign, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomSelect from "@/components/ui/CustomSelect";

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

const RENTAL_CATEGORY_OPTS = [
  { value: "chambre_meublee", label: "Chambre meublée" },
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
  { value: "mini_studio", label: "Mini studio" },
  { value: "colocation", label: "Colocation" },
];

const PAYMENT_PERIOD_OPTS_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  chambre_meublee: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  studio: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  mini_studio: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  appartement: [{ value: "mois", label: "Par mois" }],
  colocation: [{ value: "mois", label: "Par mois" }],
};

interface SuggestionProperty {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  neighborhood: string | null;
  price: number;
  listing_type: "vente" | "location";
}

export default function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    listing_type: "",
    rental_category: "",
    rent_payment_period: "",
    query: "",
    property_type: "",
    city: "",
    neighborhood: "",
    min_price: "",
    max_price: "",
  });
  const [suggestions, setSuggestions] = useState<SuggestionProperty[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const deferredQuery = useDeferredValue(filters.query.trim());
  const isQuickSearchActive = filters.query.trim().length >= 2;

  useEffect(() => {
    if (deferredQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("query", deferredQuery);
    params.set("limit", "6");
    params.set("status", "publie");

    if (filters.listing_type) params.set("listing_type", filters.listing_type);
    if (filters.rental_category) params.set("rental_category", filters.rental_category);
    if (filters.rent_payment_period) params.set("rent_payment_period", filters.rent_payment_period);
    if (filters.city) params.set("city", filters.city);

    fetch(`/api/properties?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossible de charger les suggestions.");
        return response.json();
      })
      .then((data: SuggestionProperty[]) => {
        if (!Array.isArray(data)) {
          setSuggestions([]);
          return;
        }
        setSuggestions(data.slice(0, 6));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      })
      .finally(() => {
        setLoadingSuggestions(false);
      });

    return () => controller.abort();
  }, [
    deferredQuery,
    filters.city,
    filters.listing_type,
    filters.rent_payment_period,
    filters.rental_category,
  ]);

  const buildSearchParams = (nextFilters: typeof filters) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = buildSearchParams(filters);
    router.push(`/biens?${params.toString()}`);
  };

  const handleListingTypeSelect = (type: "" | "vente" | "location") => {
    const nextFilters = {
      ...filters,
      listing_type: type,
      rental_category: type === "location" ? filters.rental_category : "",
      rent_payment_period: type === "location" ? filters.rent_payment_period : "",
    };

    setFilters(nextFilters);

    const params = buildSearchParams(nextFilters);
    const query = params.toString();
    router.push(query ? `/biens?${query}` : "/biens");
  };

  const cityOpts = SENEGAL_CITIES.map((c) => ({ value: c, label: c }));
  const neighOpts = (filters.city === "Dakar" || filters.city === "")
    ? DAKAR_NEIGHBORHOODS.map((n) => ({ value: n, label: n }))
    : [];
  const typeOpts = [
    { value: "appartement", label: "Appartement" },
    { value: "maison",      label: "Maison" },
    { value: "villa",       label: "Villa" },
    { value: "terrain",     label: "Terrain" },
    { value: "bureau",      label: "Bureau" },
    { value: "local_commercial", label: "Local commercial" },
    { value: "duplex",      label: "Duplex" },
  ];
  const paymentPeriodOptions =
    filters.rental_category && PAYMENT_PERIOD_OPTS_BY_CATEGORY[filters.rental_category]
      ? PAYMENT_PERIOD_OPTS_BY_CATEGORY[filters.rental_category]
      : [
          { value: "jour", label: "Par jour" },
          { value: "mois", label: "Par mois" },
        ];

  return (
    <div className={cn("bg-white rounded-2xl shadow-2xl", className)}>
      {/* Tab: Vente / Location */}
      <div className="flex border-b border-gray-100">
        {["", "vente", "location"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleListingTypeSelect(type as "" | "vente" | "location")}
            aria-pressed={filters.listing_type === type}
            className={cn(
              "flex-1 py-3.5 text-sm font-semibold transition-colors",
              filters.listing_type === type
                ? "text-[#1a3a5c] border-b-2 border-[#1a3a5c]"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {type === "" ? "Tous" : type === "vente" ? "Acheter" : "Louer"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="p-4 sm:p-5">
        {/* Row 1: keyword search (full width) */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Mot-clé, titre, adresse..."
            value={filters.query}
            onChange={(e) => {
              const nextQuery = e.target.value;
              setFilters((f) => ({ ...f, query: nextQuery }));
              if (nextQuery.trim().length < 2) {
                setSuggestions([]);
                setLoadingSuggestions(false);
              } else {
                setLoadingSuggestions(true);
              }
            }}
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
          />
        </div>

        {isQuickSearchActive && (
          <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-2.5 anim-fade-up">
            <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              Résultats instantanés
            </div>
            {loadingSuggestions ? (
              <p className="px-2 py-3 text-sm text-gray-500">Recherche en cours...</p>
            ) : suggestions.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-500">Aucune annonce trouvée.</p>
            ) : (
              <div className="space-y-1">
                {suggestions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/biens/${item.slug}`}
                    className="flex items-center justify-between rounded-xl px-2 py-2.5 transition-colors hover:bg-[#f4f6f9]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0f1724]">{item.title}</p>
                      <p className="truncate text-xs text-gray-500">
                        {[item.neighborhood, item.city].filter(Boolean).join(", ") || "Ville non précisée"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#1a3a5c]">
                        {new Intl.NumberFormat("fr-FR").format(Math.round(item.price))} FCFA
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {item.listing_type === "vente" ? "Vente" : "Location"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Row 2: City + Quartier */}
        {!isQuickSearchActive && (
          <div className="grid grid-cols-1 min-[430px]:grid-cols-2 gap-2 sm:gap-3 mb-3 anim-fade-up">
            <CustomSelect
              value={filters.city}
              onChange={(v) => setFilters((f) => ({ ...f, city: v, neighborhood: "" }))}
              options={cityOpts}
              placeholder="Ville"
              icon={<MapPin className="w-4 h-4" />}
              searchable
              clearable
              dropUp
            />
            <CustomSelect
              value={filters.neighborhood}
              onChange={(v) => setFilters((f) => ({ ...f, neighborhood: v }))}
              options={neighOpts}
              placeholder="Quartier"
              icon={<MapPin className="w-4 h-4" />}
              searchable
              clearable
              dropUp
            />
          </div>
        )}

        {!isQuickSearchActive && (filters.listing_type === "location" || filters.rental_category) && (
          <div className="mb-3">
            <CustomSelect
              value={filters.rental_category}
              onChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  rental_category: v,
                  listing_type: v ? "location" : f.listing_type,
                  rent_payment_period: v
                    ? (PAYMENT_PERIOD_OPTS_BY_CATEGORY[v]?.some((opt) => opt.value === f.rent_payment_period) ? f.rent_payment_period : "")
                    : f.rent_payment_period,
                }))
              }
              options={RENTAL_CATEGORY_OPTS}
              placeholder="Catégorie location"
              icon={<Home className="w-4 h-4" />}
              clearable
              dropUp
            />
          </div>
        )}

        {!isQuickSearchActive && (filters.listing_type === "location" || filters.rental_category) && (
          <div className="mb-3">
            <CustomSelect
              value={filters.rent_payment_period}
              onChange={(v) => setFilters((f) => ({ ...f, rent_payment_period: v, listing_type: v ? "location" : f.listing_type }))}
              options={paymentPeriodOptions}
              placeholder="Paiement: jour ou mois"
              icon={<Home className="w-4 h-4" />}
              clearable
              dropUp
            />
          </div>
        )}

        {/* Row 3: Type + Search button */}
        <div className="flex flex-col min-[430px]:flex-row gap-2 sm:gap-3">
          {!isQuickSearchActive && (
            <div className="flex-1 anim-fade-up">
              <CustomSelect
                value={filters.property_type}
                onChange={(v) => setFilters((f) => ({ ...f, property_type: v }))}
                options={typeOpts}
                placeholder="Type de bien"
                icon={<Home className="w-4 h-4" />}
                clearable
                dropUp
              />
            </div>
          )}
          <button
            type="submit"
            className={cn(
              "px-5 py-3 bg-[#1a3a5c] text-white font-semibold rounded-xl hover:bg-[#0f2540] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md text-sm sm:text-base",
              isQuickSearchActive ? "w-full anim-fade-up" : "w-full min-[430px]:w-auto sm:px-7"
            )}
          >
            <Search className="w-5 h-5" />
            <span>{isQuickSearchActive ? "Voir les résultats" : "Rechercher"}</span>
          </button>
        </div>

        {/* Advanced toggle */}
        {!isQuickSearchActive && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1a3a5c] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvanced ? "Masquer" : "Filtres avancés"}
            </button>
          </div>
        )}

        {/* Advanced filters */}
        {!isQuickSearchActive && showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 min-[430px]:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="number"
                placeholder="Prix min"
                value={filters.min_price}
                onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="number"
                placeholder="Prix max"
                value={filters.max_price}
                onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
