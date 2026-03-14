"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Phone, Mail, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { VisitRequest } from "@/types";

const STATUSES = ["en_attente", "confirme", "annule", "realise"] as const;

export default function DemandesPage() {
  const supabase = createClient();
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchVisits = async () => {
    let q = supabase
      .from("visit_requests")
      .select("*, property:properties(title, city, slug)")
      .order("created_at", { ascending: false });
    if (filter) q = q.eq("status", filter);
    const { data } = await q;
    setVisits((data as VisitRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchVisits(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("visit_requests").update({ status }).eq("id", id);
    fetchVisits();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1724]">Demandes de visite</h1>
          <p className="text-sm text-gray-500 mt-0.5">{visits.length} demande{visits.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          {["", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filter === s
                  ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                  : "border-gray-200 text-gray-600 hover:border-[#1a3a5c]"
              }`}
            >
              {s ? getStatusLabel(s) : "Toutes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <CalendarCheck className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Aucune demande de visite</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <div key={visit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center text-[#1a3a5c] font-bold text-sm shrink-0">
                      {visit.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f1724]">{visit.full_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(visit.created_at)}</p>
                    </div>
                    <span className={`ml-auto sm:ml-0 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                      {getStatusLabel(visit.status)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[#1a3a5c] mb-2">
                    {(visit.property as unknown as { title: string } | null)?.title ?? "Bien supprimé"}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />{visit.email}
                    </span>
                    {visit.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />{visit.phone}
                      </span>
                    )}
                    {visit.preferred_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Souhaite visiter le {formatDate(visit.preferred_date)}
                      </span>
                    )}
                  </div>

                  {visit.message && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                      {visit.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-col shrink-0">
                  {STATUSES.filter((s) => s !== visit.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(visit.id, s)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors whitespace-nowrap"
                    >
                      �  {getStatusLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

