"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import VisitContractGenerator from "@/components/dashboard/VisitContractGenerator";
import { AGENCY_INFO } from "@/lib/agency";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { VisitRequest, VisitStatus } from "@/types";

const STATUSES = ["en_attente", "confirme", "annule", "realise"] as const;

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
      tone: "bg-white text-[#0f1724] border-[#e8b86d]/60",
      iconTone: "bg-[#e8b86d]/20 text-[#1a3a5c]",
    },
    {
      key: "confirme",
      label: "Confirmées",
      value: counts.confirme,
      helper: "Visites validées",
      icon: CheckCircle2,
      tone: "bg-white text-[#0f1724] border-[#1a3a5c]/15",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
    {
      key: "realise",
      label: "Réalisées",
      value: counts.realise,
      helper: "Visites déjà effectuées",
      icon: Building2,
      tone: "bg-white text-[#0f1724] border-[#1a3a5c]/15",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
  ];
}

export default function DemandesPage() {
  const [supabase] = useState(() => createClient());
  const [visits, setVisits] = useState<VisitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "">("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

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
      <section className="relative overflow-hidden rounded-[28px] border border-[#1a3a5c]/10 bg-[radial-gradient(circle_at_top_left,_rgba(232,184,109,0.18),_transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] p-5 sm:p-6 lg:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f1724]">
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
                <p className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</p>
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
        <section className="rounded-3xl border border-[#e8b86d]/50 bg-[#fff9ef] px-4 py-4 sm:px-5">
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
          <CalendarCheck className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h2 className="text-lg font-semibold text-[#0f1724]">Aucune demande de visite</h2>
          <p className="mt-2 text-sm text-gray-500">
            Les nouvelles demandes apparaîtront ici dès qu&apos;un visiteur planifie une visite.
          </p>
        </section>
      ) : filteredVisits.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h2 className="text-lg font-semibold text-[#0f1724]">Aucun résultat</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ajustez votre recherche ou retirez le filtre actif pour voir plus de demandes.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredVisits.map((visit) => {
            const property = pickProperty(visit.property);
            const isUpdating = updatingId === visit.id;

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
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-base font-bold text-[#1a3a5c]">
                            {visit.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-[#0f1724] sm:text-lg">
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
                              <p className="mt-1 truncate text-sm font-semibold text-[#0f1724] sm:text-base">
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
                      <div className="mt-4 rounded-2xl border border-[#e8b86d]/35 bg-[#fffaf2] px-4 py-3">
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
                          "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/10 px-3 py-3 text-center text-[13px] font-semibold leading-tight text-[#128C7E] transition-all hover:border-[#25D366] hover:bg-[#25D366]/15 sm:px-4 sm:text-sm",
                          visit.phone ? "col-span-2" : "col-span-1"
                        )}
                      >
                        <MessageCircle className="h-4 w-4" />
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
                            disabled={isUpdating || status === visit.status}
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition-all",
                              status === visit.status
                                ? "border-[#1a3a5c] bg-[#1a3a5c] text-white shadow-sm"
                                : "border-gray-200 bg-white text-gray-600 hover:border-[#1a3a5c]/40 hover:text-[#1a3a5c]",
                              isUpdating && "cursor-not-allowed opacity-60"
                            )}
                          >
                            {getStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <VisitContractGenerator visit={visit} />
                    </div>
                  </aside>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
