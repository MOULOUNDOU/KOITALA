"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, type SVGProps } from "react";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import VisitContractGenerator from "@/components/dashboard/VisitContractGenerator";
import { AGENCY_INFO } from "@/lib/agency";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { VisitRequest, VisitStatus } from "@/types";

const STATUSES = ["en_attente", "confirme", "annule", "realise"] as const;
const VISITS_PER_PAGE = 8;

type VisitProperty = {
  title: string;
  city: string | null;
  slug: string | null;
  address: string | null;
  neighborhood: string | null;
  listing_type: "vente" | "location" | null;
  price: number | null;
  rent_payment_period: "jour" | "mois" | null;
};

type VisitCard = Omit<VisitRequest, "status" | "property"> & {
  status: VisitStatus;
  property: VisitProperty | VisitProperty[] | null;
};

function pickProperty(property: VisitProperty | VisitProperty[] | null | undefined): VisitProperty | null {
  if (Array.isArray(property)) return property[0] ?? null;
  return property ?? null;
}

function sanitizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function formatMoney(value: number | null, period: "jour" | "mois" | null) {
  if (value == null || Number.isNaN(value)) return "Non renseigne";
  const amount = `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} FCFA`;
  if (!period) return amount;
  return `${amount} ${period === "jour" ? "par jour" : "par mois"}`;
}

function formatListingType(value: "vente" | "location" | null) {
  if (value === "vente") return "Vente";
  if (value === "location") return "Location";
  return "Non renseigne";
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.52 3.48A11.9 11.9 0 0 0 12.04 0C5.42 0 .04 5.38.04 12c0 2.1.55 4.16 1.58 5.97L0 24l6.2-1.63A11.95 11.95 0 0 0 12.04 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.52-8.52Zm-8.48 18.5c-1.8 0-3.56-.48-5.1-1.4l-.37-.22-3.68.97.98-3.59-.24-.37A9.9 9.9 0 0 1 2.04 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22.04 12c0 5.51-4.49 9.98-10 9.98Zm5.48-7.37c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.23-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.71.63.72.23 1.37.2 1.88.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.08-.12-.27-.2-.57-.34Z" />
    </svg>
  );
}

function buildVisitWhatsAppMessage(visit: VisitCard, property: VisitProperty | null) {
  const propertyLink =
    property?.slug && typeof window !== "undefined"
      ? `${window.location.origin}/biens/${property.slug}`
      : null;

  return [
    "KOITALA - DEMANDE DE VISITE",
    "",
    "CLIENT",
    `- Nom: ${visit.full_name}`,
    `- Email: ${visit.email}`,
    `- Telephone: ${visit.phone || "Non renseigne"}`,
    "",
    "VISITE",
    `- Date souhaitee: ${visit.preferred_date ? formatDate(visit.preferred_date) : "Non precisee"}`,
    `- Statut: ${getStatusLabel(visit.status)}`,
    `- Reçue le: ${formatDate(visit.created_at)}`,
    "",
    "ANNONCE",
    `- Titre: ${property?.title || "Bien supprime"}`,
    `- Type: ${formatListingType(property?.listing_type ?? null)}`,
    `- Ville: ${property?.city || "Non renseignee"}`,
    `- Quartier / Adresse: ${[property?.neighborhood, property?.address].filter(Boolean).join(", ") || "Non renseigne"}`,
    `- Prix: ${formatMoney(property?.price ?? null, property?.rent_payment_period ?? null)}`,
    ...(propertyLink ? [`- Lien: ${propertyLink}`] : []),
    "",
    "MESSAGE DU CLIENT",
    visit.message?.trim() || "Aucun message complementaire.",
  ].join("\n");
}

function getSummaryCards(visits: VisitCard[]) {
  const counts = {
    total: visits.length,
    en_attente: 0,
    confirme: 0,
    annule: 0,
    realise: 0,
  };

  for (const visit of visits) {
    counts[visit.status] += 1;
  }

  return [
    {
      key: "total",
      label: "Total",
      value: counts.total,
      helper: "Toutes les demandes reçues",
      icon: CalendarCheck,
      tone: "bg-[#1a3a5c] text-white border-[#1a3a5c]",
      iconTone: "bg-white/15 text-white",
    },
    {
      key: "en_attente",
      label: "En attente",
      value: counts.en_attente,
      helper: "Demandes à traiter en priorité",
      icon: Clock3,
      tone: "bg-[#6b4226] text-white border-[#6b4226]",
      iconTone: "bg-white/15 text-white",
    },
    {
      key: "confirme",
      label: "Confirmées",
      value: counts.confirme,
      helper: "Visites validées",
      icon: CheckCircle2,
      tone: "bg-[#0f5b3d] text-white border-[#0f5b3d]",
      iconTone: "bg-white/15 text-white",
    },
    {
      key: "realise",
      label: "Réalisées",
      value: counts.realise,
      helper: "Visites déjà effectuées",
      icon: Building2,
      tone: "bg-[#8a1f1f] text-white border-[#8a1f1f]",
      iconTone: "bg-white/15 text-white",
    },
  ];
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const lastVisiblePage = Math.min(totalPages, firstVisiblePage + 4);

  return Array.from(
    { length: lastVisiblePage - firstVisiblePage + 1 },
    (_, index) => firstVisiblePage + index
  );
}

export default function DemandesPage() {
  const [supabase] = useState(() => createClient());
  const [visits, setVisits] = useState<VisitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "">("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [currentPage, setCurrentPage] = useState(1);

  const loadVisits = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("visit_requests")
      .select("id, property_id, user_id, full_name, email, phone, message, preferred_date, status, created_at, updated_at, property:properties(title, city, slug, address, neighborhood, listing_type, price, rent_payment_period)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Impossible de charger les demandes de visite.");
      if (showLoader) setLoading(false);
      if (!showLoader) setRefreshing(false);
      return;
    }

    setVisits((data as VisitCard[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let active = true;

    const boot = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("visit_requests")
        .select("id, property_id, user_id, full_name, email, phone, message, preferred_date, status, created_at, updated_at, property:properties(title, city, slug, address, neighborhood, listing_type, price, rent_payment_period)")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        toast.error("Impossible de charger les demandes de visite.");
        setVisits([]);
        setLoading(false);
        return;
      }

      setVisits((data as VisitCard[] | null) ?? []);
      setLoading(false);
    };

    void boot();

    return () => {
      active = false;
    };
  }, [supabase]);

  const summaryCards = getSummaryCards(visits);
  const totalVisits = visits.length;
  const pendingVisits = summaryCards.find((card) => card.key === "en_attente")?.value ?? 0;

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasFilters = Boolean(statusFilter || normalizedQuery);

  const filteredVisits = visits.filter((visit) => {
    if (statusFilter && visit.status !== statusFilter) return false;

    if (!normalizedQuery) return true;

    const property = pickProperty(visit.property);
    const haystack = [
      visit.full_name,
      visit.email,
      visit.phone ?? "",
      property?.title ?? "",
      property?.city ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / VISITS_PER_PAGE));
  const visiblePages = useMemo(() => getVisiblePages(currentPage, totalPages), [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, normalizedQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedVisits = useMemo(() => {
    const startIndex = (currentPage - 1) * VISITS_PER_PAGE;
    return filteredVisits.slice(startIndex, startIndex + VISITS_PER_PAGE);
  }, [currentPage, filteredVisits]);

  const handleStatusChange = async (visitId: string, nextStatus: VisitStatus) => {
    const currentVisit = visits.find((visit) => visit.id === visitId);
    if (!currentVisit || currentVisit.status === nextStatus) return;

    const previousStatus = currentVisit.status;
    setUpdatingId(visitId);
    setVisits((current) =>
      current.map((visit) => (visit.id === visitId ? { ...visit, status: nextStatus } : visit))
    );

    const { error } = await supabase.from("visit_requests").update({ status: nextStatus }).eq("id", visitId);

    if (error) {
      setVisits((current) =>
        current.map((visit) => (visit.id === visitId ? { ...visit, status: previousStatus } : visit))
      );
      toast.error("La mise à jour du statut a échoué.");
      setUpdatingId(null);
      return;
    }

    toast.success(`Statut mis à jour: ${getStatusLabel(nextStatus)}.`);
    setUpdatingId(null);
  };

  const handleDeleteVisit = async (visit: VisitCard) => {
    if (!confirm(`Supprimer définitivement la demande de ${visit.full_name} ?`)) return;

    setDeletingId(visit.id);

    try {
      const response = await fetch("/api/admin/visit-requests/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visitId: visit.id }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        const { error: directDeleteError } = await supabase
          .from("visit_requests")
          .delete()
          .eq("id", visit.id);

        if (directDeleteError) {
          toast.error(payload?.error || "Suppression impossible pour cette demande.");
          return;
        }
      }

      setVisits((current) => current.filter((entry) => entry.id !== visit.id));
      toast.success("Demande supprimée.");
    } catch {
      toast.error("Erreur réseau pendant la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendToAgencyWhatsapp = (visit: VisitCard, property: VisitProperty | null) => {
    const agencyPhone = sanitizePhoneForWhatsApp(AGENCY_INFO.phone);
    if (!agencyPhone) {
      toast.error("Le numero WhatsApp de l'agence est introuvable.");
      return;
    }

    const text = buildVisitWhatsAppMessage(visit, property);
    const whatsappUrl = `https://wa.me/${agencyPhone}?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const resultLabel = hasFilters
    ? `${filteredVisits.length} résultat${filteredVisits.length > 1 ? "s" : ""}`
    : `${totalVisits} demande${totalVisits > 1 ? "s" : ""}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
              Demandes de visite
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Centralisez les demandes, priorisez les visites en attente et contactez rapidement les prospects les plus chauds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <Clock3 className="h-4 w-4" />
              {pendingVisits} en attente
            </div>
            <button
              type="button"
              onClick={() => void loadVisits(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-[#1a3a5c]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Actualiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className={cn(
              "rounded-3xl border p-4 sm:p-5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5",
              card.tone
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">{card.label}</p>
                <p className="mt-3 text-[1.8rem] font-extrabold tracking-tight sm:text-[2rem] lg:text-3xl">{card.value}</p>
                <p className="mt-2 text-sm opacity-75">{card.helper}</p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", card.iconTone)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        ))}
      </section>

      {pendingVisits > 0 && (
        <section className="rounded-3xl border border-gray-200 bg-[#f8fafc] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0f1724]">
                {pendingVisits} demande{pendingVisits > 1 ? "s" : ""} attendent une réponse.
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Traitez d&apos;abord les demandes en attente pour réduire les pertes de leads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("en_attente")}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
            >
              Afficher les urgentes
            </button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher par nom, email, téléphone ou bien"
              className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] pl-11 pr-4 text-sm text-[#0f1724] outline-none transition-all placeholder:text-gray-400 focus:border-[#1a3a5c] focus:bg-white focus:ring-4 focus:ring-[#1a3a5c]/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: "", label: "Toutes", count: totalVisits },
              ...STATUSES.map((status) => ({
                value: status,
                label: getStatusLabel(status),
                count: visits.filter((visit) => visit.status === status).length,
              })),
            ].map((item) => (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => setStatusFilter(item.value as VisitStatus | "")}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all",
                  statusFilter === item.value
                    ? "border-[#1a3a5c] bg-[#1a3a5c] text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-[#1a3a5c]/40 hover:text-[#1a3a5c]"
                )}
              >
                <span>{item.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px]",
                    statusFilter === item.value ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">{resultLabel}</p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("");
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a3a5c] transition-colors hover:text-[#0f2540]"
            >
              <XCircle className="h-4 w-4" />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-9 w-9 rounded-full border-2 border-[#1a3a5c] border-t-transparent animate-spin" />
        </div>
      ) : totalVisits === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-gray-200 sm:h-14 sm:w-14" />
          <h2 className="text-base font-semibold text-[#0f1724] sm:text-lg">Aucune demande de visite</h2>
          <p className="mt-2 text-sm text-gray-500">
            Les nouvelles demandes apparaîtront ici dès qu&apos;un visiteur planifie une visite.
          </p>
        </section>
      ) : filteredVisits.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-12 w-12 text-gray-200 sm:h-14 sm:w-14" />
          <h2 className="text-base font-semibold text-[#0f1724] sm:text-lg">Aucun résultat</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ajustez votre recherche ou retirez le filtre actif pour voir plus de demandes.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {paginatedVisits.map((visit) => {
            const property = pickProperty(visit.property);
            const isUpdating = updatingId === visit.id;
            const isDeleting = deletingId === visit.id;

            return (
              <article
                key={visit.id}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-sm font-bold text-[#1a3a5c] sm:h-12 sm:w-12 sm:text-base">
                            {visit.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-[#0f1724] sm:text-base lg:text-lg">
                              {visit.full_name}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              Reçue le {formatDate(visit.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#1a3a5c]/10 bg-[#f8fafc] p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1a3a5c]">
                                Bien concerné
                              </p>
                              <p className="mt-1 truncate text-[13px] font-semibold text-[#0f1724] sm:text-sm lg:text-base">
                                {property?.title ?? "Bien supprimé"}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {property?.city ?? "Ville non renseignée"}
                              </p>
                            </div>

                            {property?.slug && (
                              <Link
                                href={`/biens/${property.slug}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                              >
                                Voir l&apos;annonce
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusColor(visit.status))}>
                          {getStatusLabel(visit.status)}
                        </span>
                        {isUpdating && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Mise à jour...
                          </span>
                        )}
                        {isDeleting && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Suppression...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Email</p>
                        <a
                          href={`mailto:${visit.email}`}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#0f1724] transition-colors hover:text-[#1a3a5c]"
                        >
                          <Mail className="h-4 w-4 text-[#1a3a5c]" />
                          <span className="truncate">{visit.email}</span>
                        </a>
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Téléphone</p>
                        {visit.phone ? (
                          <a
                            href={`tel:${visit.phone}`}
                            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#0f1724] transition-colors hover:text-[#1a3a5c]"
                          >
                            <Phone className="h-4 w-4 text-[#1a3a5c]" />
                            {visit.phone}
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-gray-400">Non renseigné</p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Date souhaitée</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#0f1724]">
                          <Calendar className="h-4 w-4 text-[#1a3a5c]" />
                          {visit.preferred_date ? formatDate(visit.preferred_date) : "Non précisée"}
                        </p>
                      </div>
                    </div>

                    {visit.message && (
                      <div className="mt-4 rounded-2xl border border-gray-200 bg-[#f8fafc] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a3a5c]">
                          Message du prospect
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-700">{visit.message}</p>
                      </div>
                    )}
                  </div>

                  <aside className="w-full xl:w-[320px] shrink-0 rounded-3xl border border-gray-100 bg-[#fbfcfe] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Actions rapides
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={`mailto:${visit.email}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-3 py-3 text-center text-[13px] font-semibold leading-tight text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5 sm:px-4 sm:text-sm"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>

                      {visit.phone && (
                        <a
                          href={`tel:${visit.phone}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-3 py-3 text-center text-[13px] font-semibold leading-tight text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5 sm:px-4 sm:text-sm"
                        >
                          <Phone className="h-4 w-4" />
                          Appeler
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSendToAgencyWhatsapp(visit, property)}
                        className={cn(
                          "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 py-3 text-center text-[13px] font-semibold leading-tight text-white shadow-[0_10px_22px_rgba(37,211,102,0.22)] transition-colors hover:bg-[#1ebe5d] sm:px-4 sm:text-sm",
                          visit.phone ? "col-span-2" : "col-span-1"
                        )}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        WhatsApp
                      </button>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Changer le statut
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {STATUSES.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void handleStatusChange(visit.id, status)}
                            disabled={isUpdating || isDeleting || status === visit.status}
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition-all",
                              status === visit.status
                                ? "border-[#1a3a5c] bg-[#1a3a5c] text-white shadow-sm"
                                : "border-gray-200 bg-white text-gray-600 hover:border-[#1a3a5c]/40 hover:text-[#1a3a5c]",
                              (isUpdating || isDeleting) && "cursor-not-allowed opacity-60"
                            )}
                          >
                            {getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Gestion
                      </p>

                      <button
                        type="button"
                        onClick={() => void handleDeleteVisit(visit)}
                        disabled={isUpdating || isDeleting}
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer la demande
                      </button>
                    </div>

                    <div className="mt-5">
                      <VisitContractGenerator visit={visit} />
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="rounded-3xl border border-gray-100 bg-white px-4 py-5 shadow-sm sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div className="flex min-w-max items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage <= 1}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition-all duration-300 sm:h-11 sm:px-4 sm:text-sm",
                        currentPage <= 1
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 shadow-none"
                          : "border-[#1a3a5c]/18 bg-white text-[#1a3a5c] hover:border-[#1a3a5c]/35 hover:bg-[#1a3a5c]/[0.06]"
                      )}
                    >
                      Précédent
                    </button>

                    {visiblePages.map((page) => {
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={`dashboard-demandes-${page}`}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-bold transition-all duration-300 sm:h-11 sm:w-11 sm:text-sm",
                            isActive
                              ? "border-[#e8b86d] bg-[#e8b86d] text-[#0f1724] shadow-[0_10px_20px_rgba(232,184,109,0.22)]"
                              : "border-[#1a3a5c]/15 bg-white text-[#1a3a5c] hover:border-[#1a3a5c]/35 hover:-translate-y-0.5 hover:bg-[#1a3a5c]/[0.05]"
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage >= totalPages}
                      className={cn(
                        "inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition-all duration-300 sm:h-11 sm:px-4 sm:text-sm",
                        currentPage >= totalPages
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 shadow-none"
                          : "border-[#1a3a5c] bg-[#1a3a5c] text-white hover:border-[#102a44] hover:bg-[#102a44]"
                      )}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
