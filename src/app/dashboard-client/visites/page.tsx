"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock3 } from "lucide-react";
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
      const { data: { user } } = await supabase.auth.getUser();
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
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = visits.filter((visit) => visit.status === "en_attente").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1724]">Mes demandes de visite</h1>
            <p className="text-sm text-gray-500 mt-1">
              {visits.length} demande{visits.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1a3a5c]/10 px-3 py-1.5 text-sm font-medium text-[#1a3a5c]">
            <Clock3 className="w-4 h-4" /> {pendingCount} en attente
          </div>
        </div>
      </section>

      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center px-4">
          <CalendarCheck className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune demande de visite</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md">Planifiez une visite depuis une annonce pour la retrouver ici.</p>
          <Link
            href="/biens"
            className="px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors"
          >
            Voir les annonces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const property = pickFirst(visit.property);
            return (
              <article key={visit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative w-full sm:w-44 h-36 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100">
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
                        <p className="font-semibold text-[#0f1724] text-base sm:text-lg line-clamp-1">
                          {property?.title ?? "Bien supprimé"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Envoyée le {formatDate(visit.created_at)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(visit.status)}`}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                      <p>
                        Date souhaitée: {visit.preferred_date ? formatDate(visit.preferred_date) : "Non précisée"}
                      </p>
                      {visit.message && <p className="line-clamp-2">Message: {visit.message}</p>}
                    </div>

                    <div className="mt-3 flex justify-end">
                      {property?.slug ? (
                        <Link
                          href={`/biens/${property.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Voir l&apos;annonce <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href="/biens"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Explorer les biens <ArrowRight className="w-4 h-4" />
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
