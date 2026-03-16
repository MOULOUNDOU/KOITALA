"use client";

import { useDeferredValue, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Contact, ContactStatus } from "@/types";

const STATUSES = ["nouveau", "lu", "traite", "archive"] as const;

type MessageProperty = {
  title: string;
  slug: string | null;
  city: string | null;
};

type MessageCard = Omit<Contact, "status" | "property"> & {
  status: ContactStatus;
  property: MessageProperty | MessageProperty[] | null;
};

function pickProperty(property: MessageProperty | MessageProperty[] | null | undefined): MessageProperty | null {
  if (Array.isArray(property)) return property[0] ?? null;
  return property ?? null;
}

function getSummaryCards(messages: MessageCard[]) {
  const counts = {
    total: messages.length,
    nouveau: 0,
    lu: 0,
    traite: 0,
    archive: 0,
  };

  for (const message of messages) {
    counts[message.status] += 1;
  }

  return [
    {
      key: "total",
      label: "Total",
      value: counts.total,
      helper: "Tous les messages recus",
      icon: MessageSquare,
      tone: "bg-[#1a3a5c] text-white border-[#1a3a5c]",
      iconTone: "bg-white/15 text-white",
    },
    {
      key: "nouveau",
      label: "Nouveaux",
      value: counts.nouveau,
      helper: "Messages a ouvrir en priorite",
      icon: Sparkles,
      tone: "bg-white text-[#0f1724] border-gray-200",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
    {
      key: "lu",
      label: "Lus",
      value: counts.lu,
      helper: "Messages deja consultes",
      icon: Clock3,
      tone: "bg-white text-[#0f1724] border-[#1a3a5c]/15",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
    {
      key: "traite",
      label: "Traites",
      value: counts.traite,
      helper: "Dossiers deja pris en charge",
      icon: CheckCircle2,
      tone: "bg-white text-[#0f1724] border-[#1a3a5c]/15",
      iconTone: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    },
  ];
}

export default function MessagesPage() {
  const [supabase] = useState(() => createClient());
  const [contacts, setContacts] = useState<MessageCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "">("");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const loadContacts = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("id, property_id, full_name, email, phone, subject, message, status, created_at, updated_at, property:properties(title, slug, city)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Impossible de charger les messages.");
      if (showLoader) setLoading(false);
      if (!showLoader) setRefreshing(false);
      return;
    }

    setContacts((data as MessageCard[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, property_id, full_name, email, phone, subject, message, status, created_at, updated_at, property:properties(title, slug, city)")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        toast.error("Impossible de charger les messages.");
        setContacts([]);
        setLoading(false);
        return;
      }

      setContacts((data as MessageCard[] | null) ?? []);
      setLoading(false);
    };

    void boot();

    return () => {
      active = false;
    };
  }, [supabase]);

  const summaryCards = getSummaryCards(contacts);
  const totalMessages = contacts.length;
  const newMessages = summaryCards.find((card) => card.key === "nouveau")?.value ?? 0;

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const hasFilters = Boolean(statusFilter || normalizedQuery);

  const filteredContacts = contacts.filter((contact) => {
    if (statusFilter && contact.status !== statusFilter) return false;

    if (!normalizedQuery) return true;

    const property = pickProperty(contact.property);
    const haystack = [
      contact.full_name,
      contact.email,
      contact.phone ?? "",
      contact.subject ?? "",
      contact.message,
      property?.title ?? "",
      property?.city ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  const updateStatus = async (id: string, status: ContactStatus) => {
    const currentContact = contacts.find((contact) => contact.id === id);
    if (!currentContact || currentContact.status === status) return;

    const previousStatus = currentContact.status;
    setUpdatingId(id);
    setContacts((current) =>
      current.map((contact) => (contact.id === id ? { ...contact, status } : contact))
    );

    const { error } = await supabase.from("contacts").update({ status }).eq("id", id);

    if (error) {
      setContacts((current) =>
        current.map((contact) =>
          contact.id === id ? { ...contact, status: previousStatus } : contact
        )
      );
      toast.error("La mise a jour du message a echoue.");
      setUpdatingId(null);
      return;
    }

    toast.success(`Statut mis a jour: ${getStatusLabel(status)}.`);
    setUpdatingId(null);
  };

  const handleToggleExpand = (contact: MessageCard) => {
    const nextExpanded = expandedId === contact.id ? null : contact.id;
    setExpandedId(nextExpanded);

    if (nextExpanded === contact.id && contact.status === "nouveau") {
      void updateStatus(contact.id, "lu");
    }
  };

  const resultLabel = hasFilters
    ? `${filteredContacts.length} resultat${filteredContacts.length > 1 ? "s" : ""}`
    : `${totalMessages} message${totalMessages > 1 ? "s" : ""}`;

  return (
    <div className="min-h-full max-w-[1400px] mx-auto space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f1724] sm:text-3xl">
              Messages
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              Consultez, priorisez et traitez les messages clients depuis un ecran plus lisible sur mobile comme sur grand ecran.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
              {newMessages} nouveaux
            </div>
            <button
              type="button"
              onClick={() => void loadContacts(false)}
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
              "rounded-3xl border p-4 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 sm:p-5",
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

      {newMessages > 0 && (
        <section className="rounded-3xl border border-gray-200 bg-[#f8fafc] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0f1724]">
                {newMessages} message{newMessages > 1 ? "s" : ""} necessitent une ouverture.
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Ouvrez les nouveaux messages pour les marquer comme lus et avancer plus vite dans le traitement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter("nouveau")}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
            >
              Afficher les nouveaux
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
              placeholder="Rechercher par nom, email, sujet, message ou bien"
              className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] pl-11 pr-4 text-sm text-[#0f1724] outline-none transition-all placeholder:text-gray-400 focus:border-[#1a3a5c] focus:bg-white focus:ring-4 focus:ring-[#1a3a5c]/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: "", label: "Tous", count: totalMessages },
              ...STATUSES.map((status) => ({
                value: status,
                label: getStatusLabel(status),
                count: contacts.filter((contact) => contact.status === status).length,
              })),
            ].map((item) => (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => setStatusFilter(item.value as ContactStatus | "")}
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
              Reinitialiser les filtres
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
        </div>
      ) : totalMessages === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <MessageSquare className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h2 className="text-lg font-semibold text-[#0f1724]">Aucun message</h2>
          <p className="mt-2 text-sm text-gray-500">
            Les messages clients apparaîtront ici des qu&apos;ils utiliseront le formulaire de contact.
          </p>
        </section>
      ) : filteredContacts.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <Search className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h2 className="text-lg font-semibold text-[#0f1724]">Aucun resultat</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ajustez votre recherche ou retirez le filtre actif pour afficher plus de messages.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredContacts.map((contact) => {
            const property = pickProperty(contact.property);
            const isExpanded = expandedId === contact.id;
            const isUpdating = updatingId === contact.id;

            return (
              <article
                key={contact.id}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-base font-bold text-[#1a3a5c]">
                          {contact.full_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-bold text-[#0f1724] sm:text-lg">
                                  {contact.full_name}
                                </p>
                                {contact.status === "nouveau" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a5c]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1a3a5c]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Nouveau
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                <span>Recu le {formatDate(contact.created_at)}</span>
                                {contact.subject?.trim() && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                                    {contact.subject.trim()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusColor(contact.status))}>
                                {getStatusLabel(contact.status)}
                              </span>
                              {isUpdating && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  Mise a jour...
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600 sm:text-[15px]">
                            {contact.message}
                          </p>

                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <a
                              href={`mailto:${contact.email}`}
                              className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#0f1724] transition-all hover:border-[#1a3a5c]/20 hover:bg-white"
                            >
                              <Mail className="h-4 w-4 text-[#1a3a5c]" />
                              <span className="truncate">{contact.email}</span>
                            </a>

                            {contact.phone ? (
                              <a
                                href={`tel:${contact.phone}`}
                                className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#0f1724] transition-all hover:border-[#1a3a5c]/20 hover:bg-white"
                              >
                                <Phone className="h-4 w-4 text-[#1a3a5c]" />
                                <span className="truncate">{contact.phone}</span>
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-400">
                                <Phone className="h-4 w-4" />
                                Telephone non renseigne
                              </div>
                            )}

                            {property ? (
                              <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#0f1724]">
                                <Building2 className="h-4 w-4 text-[#1a3a5c]" />
                                <span className="truncate">{property.title}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-400">
                                <Building2 className="h-4 w-4" />
                                Message general
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-row gap-2 lg:w-auto lg:flex-col">
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#1a3a5c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
                      >
                        <Mail className="h-4 w-4" />
                        Repondre
                      </a>

                      {property?.slug && (
                        <a
                          href={`/biens/${property.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                        >
                          Voir le bien
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleExpand(contact)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition-all hover:border-[#1a3a5c]/40 hover:text-[#1a3a5c]"
                      >
                        {isExpanded ? (
                          <>
                            Replier
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Ouvrir
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-[#fcfdff] px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_320px]">
                      <div className="rounded-2xl border border-gray-200 bg-[#f8fafc] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a3a5c]">
                          Message complet
                        </p>
                        <p className="mt-3 text-sm leading-7 text-gray-700">
                          {contact.message}
                        </p>
                      </div>

                      <aside className="rounded-2xl border border-gray-100 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                          Actions rapides
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <a
                            href={`mailto:${contact.email}`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                          >
                            <Mail className="h-4 w-4" />
                            Repondre par email
                          </a>

                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                            >
                              <Phone className="h-4 w-4" />
                              Appeler
                            </a>
                          )}

                          {property?.slug && (
                            <a
                              href={`/biens/${property.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-4 text-sm font-semibold text-[#1a3a5c] transition-all hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5"
                            >
                              <Building2 className="h-4 w-4" />
                              Ouvrir l&apos;annonce
                            </a>
                          )}
                        </div>

                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                            Changer le statut
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => void updateStatus(contact.id, status)}
                                disabled={isUpdating || status === contact.status}
                                className={cn(
                                  "inline-flex min-h-11 items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition-all",
                                  status === contact.status
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
                      </aside>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
