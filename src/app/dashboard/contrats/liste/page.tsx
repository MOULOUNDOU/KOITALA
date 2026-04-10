"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download, FileText, RefreshCw, Search, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import CustomSelect from "@/components/ui/CustomSelect";
import Input from "@/components/ui/Input";
import { GENERATED_CONTRACTS_SELECT, type GeneratedContractRecord } from "@/lib/contracts/generatedContracts";
import { SENEGAL_CITY_OPTIONS } from "@/lib/locations/senegalLocations";
import { createClient } from "@/lib/supabase/client";

const GENERATED_CONTRACTS_LIMIT = 300;
const CONTRACTS_PER_PAGE = 12;

type FrequencyFilter = "all" | "jour" | "mois";
type SortKey = "newest" | "oldest" | "rent_desc" | "rent_asc" | "name_asc" | "name_desc";

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
}

function formatMoneyAmount(value: unknown) {
  const amount = parseAmount(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Non renseigne";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

function formatPaymentFrequencyLabel(value: "jour" | "mois") {
  return value === "jour" ? "par jour" : "par mois";
}

function formatContractDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatContractDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function DashboardContractsListPage() {
  const [supabase] = useState(() => createClient());
  const [contracts, setContracts] = useState<GeneratedContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [minRentFilter, setMinRentFilter] = useState("");
  const [maxRentFilter, setMaxRentFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);

  const filteredContracts = useMemo(() => {
    const normalizedCityFilter = normalizeSearchText(cityFilter);
    const minRentAmount = parseAmount(minRentFilter);
    const maxRentAmount = parseAmount(maxRentFilter);

    const filtered = contracts.filter((contract) => {
      const searchableText = normalizeSearchText(
        [
          contract.tenant_name,
          contract.contract_reference,
          contract.tenant_email ?? "",
          contract.tenant_phone ?? "",
          contract.property_title,
          contract.property_city ?? "",
        ].join(" ")
      );

      if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;

      if (normalizedCityFilter) {
        const contractCity = normalizeSearchText(contract.property_city ?? "");
        if (contractCity !== normalizedCityFilter) return false;
      }

      if (frequencyFilter !== "all" && contract.payment_frequency !== frequencyFilter) return false;

      if (startDateFilter && contract.contract_date < startDateFilter) return false;
      if (endDateFilter && contract.contract_date > endDateFilter) return false;

      const rentAmount = parseAmount(contract.monthly_rent);
      if (minRentFilter && Number.isFinite(minRentAmount) && minRentAmount > 0 && rentAmount < minRentAmount) {
        return false;
      }
      if (maxRentFilter && Number.isFinite(maxRentAmount) && maxRentAmount > 0 && rentAmount > maxRentAmount) {
        return false;
      }

      return true;
    });

    const sorted = filtered.slice();

    sorted.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "rent_desc") {
        return parseAmount(b.monthly_rent) - parseAmount(a.monthly_rent);
      }
      if (sortBy === "rent_asc") {
        return parseAmount(a.monthly_rent) - parseAmount(b.monthly_rent);
      }
      if (sortBy === "name_asc") {
        return a.tenant_name.localeCompare(b.tenant_name, "fr", { sensitivity: "base" });
      }
      return b.tenant_name.localeCompare(a.tenant_name, "fr", { sensitivity: "base" });
    });

    return sorted;
  }, [
    cityFilter,
    contracts,
    endDateFilter,
    frequencyFilter,
    maxRentFilter,
    minRentFilter,
    normalizedQuery,
    sortBy,
    startDateFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / CONTRACTS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [
    cityFilter,
    endDateFilter,
    frequencyFilter,
    maxRentFilter,
    minRentFilter,
    normalizedQuery,
    sortBy,
    startDateFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * CONTRACTS_PER_PAGE;
    return filteredContracts.slice(start, start + CONTRACTS_PER_PAGE);
  }, [currentPage, filteredContracts]);

  const totalContracts = contracts.length;
  const filteredCount = filteredContracts.length;
  const currentMonthContracts = useMemo(() => {
    const now = new Date();
    return contracts.filter((contract) => {
      const createdDate = new Date(contract.created_at);
      return (
        createdDate.getUTCFullYear() === now.getUTCFullYear() &&
        createdDate.getUTCMonth() === now.getUTCMonth()
      );
    }).length;
  }, [contracts]);

  const filteredRentTotal = useMemo(
    () => filteredContracts.reduce((sum, contract) => sum + parseAmount(contract.monthly_rent), 0),
    [filteredContracts]
  );

  const loadContracts = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("generated_contracts")
      .select(GENERATED_CONTRACTS_SELECT)
      .order("created_at", { ascending: false })
      .limit(GENERATED_CONTRACTS_LIMIT);

    if (error) {
      toast.error("Impossible de charger les contrats.");
      if (showLoader) setLoading(false);
      if (!showLoader) setRefreshing(false);
      return;
    }

    setContracts((data as GeneratedContractRecord[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const { data, error } = await supabase
        .from("generated_contracts")
        .select(GENERATED_CONTRACTS_SELECT)
        .order("created_at", { ascending: false })
        .limit(GENERATED_CONTRACTS_LIMIT);

      if (!active) return;

      if (error) {
        toast.error("Impossible de charger les contrats.");
        setContracts([]);
        setLoading(false);
        return;
      }

      setContracts((data as GeneratedContractRecord[] | null) ?? []);
      setLoading(false);
    };

    void boot();

    return () => {
      active = false;
    };
  }, [supabase]);

  const resetFilters = () => {
    setQuery("");
    setCityFilter("");
    setFrequencyFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
    setMinRentFilter("");
    setMaxRentFilter("");
    setSortBy("newest");
  };

  const handleCopyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Matricule copie.");
    } catch {
      toast.error("Impossible de copier le matricule.");
    }
  };

  const handleDeleteContract = async (contract: GeneratedContractRecord) => {
    if (!confirm(`Supprimer le contrat ${contract.contract_reference} ?`)) return;

    setDeletingId(contract.id);
    try {
      const response = await fetch("/api/admin/contracts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractId: contract.id }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; storage_warning?: boolean }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Suppression impossible pour ce contrat.");
        return;
      }

      setContracts((current) => current.filter((entry) => entry.id !== contract.id));

      if (payload?.storage_warning) {
        toast.success("Contrat supprime. Le fichier PDF n'a pas pu etre supprime.");
        return;
      }

      toast.success("Contrat supprime.");
    } catch {
      toast.error("Erreur reseau pendant la suppression du contrat.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8 min-h-full">
      <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="inline-flex items-center gap-2 text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
              <FileText className="h-6 w-6 text-[#1a3a5c]" />
              Liste des contrats
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {filteredCount} contrat{filteredCount > 1 ? "s" : ""} affiche
              {filteredCount > 1 ? "s" : ""}
              {(normalizedQuery || cityFilter || frequencyFilter !== "all" || startDateFilter || endDateFilter || minRentFilter || maxRentFilter) ? " avec filtres" : ""}.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => void loadContracts(false)}
            loading={refreshing}
            className="h-11 shrink-0 px-4"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraichir
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Total contrats</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f1724]">{totalContracts}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Resultats filtres</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f1724]">{filteredCount}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Ce mois-ci</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f1724]">{currentMonthContracts}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Total loyer filtre</p>
          <p className="mt-2 text-lg font-extrabold tracking-tight text-[#0f1724]">{formatMoneyAmount(filteredRentTotal)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="Recherche globale"
            placeholder="Nom, matricule, email, telephone, bien..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<Search className="h-4 w-4" />}
          />

          <CustomSelect
            label="Ville"
            value={cityFilter}
            onChange={(value) => setCityFilter(value)}
            options={SENEGAL_CITY_OPTIONS}
            placeholder="Toutes les villes"
            searchable
          />

          <CustomSelect
            label="Frequence de paiement"
            value={frequencyFilter}
            onChange={(value) => setFrequencyFilter((value as FrequencyFilter) || "all")}
            options={[
              { value: "all", label: "Toutes" },
              { value: "mois", label: "Par mois" },
              { value: "jour", label: "Par jour" },
            ]}
            placeholder="Toutes"
          />

          <CustomSelect
            label="Tri"
            value={sortBy}
            onChange={(value) => setSortBy((value as SortKey) || "newest")}
            options={[
              { value: "newest", label: "Plus recents" },
              { value: "oldest", label: "Plus anciens" },
              { value: "rent_desc", label: "Loyer decroissant" },
              { value: "rent_asc", label: "Loyer croissant" },
              { value: "name_asc", label: "Nom A-Z" },
              { value: "name_desc", label: "Nom Z-A" },
            ]}
            placeholder="Plus recents"
          />

          <Input
            label="Date contrat debut"
            type="date"
            value={startDateFilter}
            onChange={(event) => setStartDateFilter(event.target.value)}
          />

          <Input
            label="Date contrat fin"
            type="date"
            value={endDateFilter}
            onChange={(event) => setEndDateFilter(event.target.value)}
          />

          <Input
            label="Loyer minimum (FCFA)"
            inputMode="numeric"
            value={minRentFilter}
            onChange={(event) => setMinRentFilter(event.target.value)}
            placeholder="Ex: 100000"
          />

          <Input
            label="Loyer maximum (FCFA)"
            inputMode="numeric"
            value={maxRentFilter}
            onChange={(event) => setMaxRentFilter(event.target.value)}
            placeholder="Ex: 500000"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Page {currentPage} / {totalPages}
          </p>
          <Button type="button" variant="outline" onClick={resetFilters} className="h-10 px-4">
            Reinitialiser les filtres
          </Button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            Chargement des contrats...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            {normalizedQuery
              ? "Aucun contrat ne correspond a cette recherche."
              : "Aucun contrat enregistre pour le moment."}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {paginatedContracts.map((contract) => (
              <article
                key={contract.id}
                className="rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#0f1724]">{contract.tenant_name}</p>
                    <p className="text-xs text-gray-500">
                      Matricule: <span className="font-semibold text-[#1a3a5c]">{contract.contract_reference}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Bien: {contract.property_title} ({contract.property_city || "Ville non renseignee"})
                    </p>
                    <p className="text-xs text-gray-500">Adresse: {contract.property_address}</p>
                    <p className="text-xs text-gray-500">
                      Loyer: {formatMoneyAmount(contract.monthly_rent)}{" "}
                      {formatPaymentFrequencyLabel(contract.payment_frequency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Contrat du {formatContractDate(contract.contract_date)} • Cree le{" "}
                      {formatContractDateTime(contract.created_at)}
                    </p>
                  </div>

                  <a
                    href={contract.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#1a3a5c]/20 bg-white px-4 text-sm font-semibold text-[#1a3a5c] transition hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                  >
                    <Download className="h-4 w-4" />
                    Voir le PDF
                  </a>

                  <button
                    type="button"
                    onClick={() => void handleCopyReference(contract.contract_reference)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copier
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteContract(contract)}
                    disabled={deletingId === contract.id}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === contract.id ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredContracts.length > CONTRACTS_PER_PAGE && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {filteredContracts.length} contrats filtres
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="h-10 px-4"
              >
                Precedent
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="h-10 px-4"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
