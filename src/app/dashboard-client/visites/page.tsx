"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Compass,
  XCircle,
} from "lucide-react";
import ClientPageHero from "@/components/dashboard/ClientPageHero";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

interface VisitProperty {
  title: string;
  slug: string;
  main_image_url: string | null;
}

interface VisitItem {
  id: string;
  status: string;
  preferred_date: string | null;
  created_at: string;
  message: string | null;
  property: VisitProperty | VisitProperty[] | null;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getVisitImage(property: VisitProperty | null): string {
  if (property?.main_image_url) {
    return property.main_image_url;
  }

  return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
}

export default function VisitesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadVisits = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("visit_requests")
        .select("id, status, preferred_date, created_at, message, property:properties(title, slug, main_image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setVisits((data as VisitItem[] | null) ?? []);
      setLoading(false);
    };

    void loadVisits();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  const pendingCount = visits.filter((visit) => visit.status === "en_attente").length;
  const confirmedCount = visits.filter((visit) => visit.status === "confirme").length;
  const cancelledCount = visits.filter((visit) => visit.status === "annule").length;

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <ClientPageHero
        title="Mes demandes de visite"
        description="Centralisez vos demandes, leur statut et les prochaines étapes depuis un écran unique."
        chips={[
          { icon: CalendarCheck, value: visits.length, label: "demandes" },
          { icon: Clock3, value: pendingCount, label: "en attente" },
          { icon: CheckCircle2, value: confirmedCount, label: "confirmées" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard-client"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
            >
              Retour dashboard
            </Link>
            <Link
              href="/biens"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
            >
              <Compass className="h-4 w-4" />
              Explorer les biens
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: CalendarCheck,
            label: "Demandes totales",
            value: visits.length,
            helper: "Historique complet",
            bgColor: "#1d4ed8",
          },
          {
            icon: Clock3,
            label: "En attente",
            value: pendingCount,
            helper: "Réponse KOITALA à venir",
            bgColor: "#047857",
          },
          {
            icon: XCircle,
            label: "Annulées",
            value: cancelledCount,
            helper: `${confirmedCount} confirmée(s)`,
            bgColor: "#6b4226",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
            style={{ backgroundColor: item.bgColor }}
          >
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {item.label}
            </p>
            <p className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/90">{item.helper}</p>
          </div>
        ))}
      </section>

      {visits.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <CalendarCheck className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700">Aucune demande de visite</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Planifiez une visite depuis une annonce pour la retrouver ici.
          </p>
          <Link
            href="/biens"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
          >
            Voir les annonces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const property = pickFirst(visit.property);
            return (
              <article key={visit.id} className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-44">
                    <Image
                      src={getVisitImage(property)}
                      alt={property?.title ?? "Bien immobilier"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 176px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-base font-semibold text-[#0f1724] sm:text-lg">
                          {property?.title ?? "Bien supprimé"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">Envoyée le {formatDate(visit.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                      <p>
                        Date souhaitée: {visit.preferred_date ? formatDate(visit.preferred_date) : "Non précisée"}
                      </p>
                      {visit.message ? <p className="line-clamp-2">Message: {visit.message}</p> : null}
                    </div>

                    <div className="mt-4 flex justify-end">
                      {property?.slug ? (
                        <Link
                          href={`/biens/${property.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Voir l&apos;annonce <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Link
                          href="/biens"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Explorer les biens <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
