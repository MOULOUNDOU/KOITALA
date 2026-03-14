"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { VisitRequest } from "@/types";

export default function VisitesPage() {
  const supabase = createClient();
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("visit_requests")
        .select("*, property:properties(title, slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setVisits((data as VisitRequest[]) ?? []);
      setLoading(false);
    });
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0f1724]">Mes demandes de visite</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {visits.length} demande{visits.length !== 1 ? "s" : ""}
        </p>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <CalendarCheck className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune demande de visite</h3>
          <p className="text-sm text-gray-400">Vos demandes de visite apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <CalendarCheck className="w-7 h-7 text-gray-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0f1724] truncate">
                  {(v.property as { title?: string } | null)?.title ?? "Bien supprimé"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {v.preferred_date && `Souhaitée le ${formatDate(v.preferred_date)} · `}
                  Envoyée le {formatDate(v.created_at)}
                </p>
                {v.message && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{v.message}</p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${getStatusColor(v.status)}`}>
                {getStatusLabel(v.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
