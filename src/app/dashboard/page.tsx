export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  MessageSquare,
  Heart,
  Plus,
  ArrowRight,
  Eye,
  Bell,
  MapPin,
  Bed,
  Bath,
  Maximize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatsCard from "@/components/dashboard/StatsCard";
import { formatPrice, formatDate, formatArea, getStatusColor, getStatusLabel, getPropertyTypeLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

async function getStats() {
  const supabase = await createClient();
  const [
    { count: totalProps },
    { count: publishedProps },
    { count: totalVisits },
    { count: pendingVisits },
    { count: totalMessages },
    { count: newMessages },
    { count: totalFavs },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "publie"),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }),
    supabase.from("visit_requests").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "nouveau"),
    supabase.from("favorites").select("*", { count: "exact", head: true }),
  ]);
  return {
    totalProps: totalProps ?? 0,
    publishedProps: publishedProps ?? 0,
    totalVisits: totalVisits ?? 0,
    pendingVisits: pendingVisits ?? 0,
    totalMessages: totalMessages ?? 0,
    newMessages: newMessages ?? 0,
    totalFavs: totalFavs ?? 0,
  };
}

async function getRecentProperties() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, title, slug, city, price, status, listing_type, property_type, main_image_url, bedrooms, bathrooms, area, created_at")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

async function getRecentVisits() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visit_requests")
    .select("id, full_name, email, phone, status, created_at, property:properties(title)")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export default async function DashboardPage() {
  const [stats, recentProps, recentVisits] = await Promise.all([
    getStats(),
    getRecentProperties(),
    getRecentVisits(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1724] tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bienvenue dans votre espace KOITALA</p>
        </div>
        <Link
          href="/dashboard/annonces/nouvelle"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] active:scale-[.97] transition-all shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Nouvelle annonce
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Total annonces"
          value={stats.totalProps}
          subtitle={`${stats.publishedProps} publiées`}
          icon={Building2}
          color="blue"
          href="/dashboard/annonces"
        />
        <StatsCard
          title="Demandes de visite"
          value={stats.totalVisits}
          subtitle={`${stats.pendingVisits} en attente`}
          icon={CalendarCheck}
          color="green"
          href="/dashboard/demandes"
        />
        <StatsCard
          title="Messages"
          value={stats.totalMessages}
          subtitle={`${stats.newMessages} nouveaux`}
          icon={MessageSquare}
          color="yellow"
          href="/dashboard/messages"
        />
        <StatsCard
          title="Favoris"
          value={stats.totalFavs}
          subtitle="Biens mis en favoris"
          icon={Heart}
          color="purple"
        />
      </div>

      {/* ── Alert Banner ── */}
      {stats.pendingVisits > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-[#f0faf4] border border-green-200 rounded-2xl p-4 sm:p-5">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f1724]">
              {stats.pendingVisits} demande{stats.pendingVisits > 1 ? "s" : ""} de visite en attente
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Des demandes nécessitent votre attention. Consultez et répondez rapidement.
            </p>
          </div>
          <Link
            href="/dashboard/demandes"
            className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold text-[#0f1724] rounded-xl hover:bg-gray-50 transition-colors shrink-0"
          >
            Voir les demandes
          </Link>
        </div>
      )}

      {/* ── Listing Board ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#0f1724]">Listing Board</h2>
            {recentProps.length > 0 && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[11px] font-semibold rounded-full">
                Récent
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/annonces" className="px-3.5 py-1.5 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              Toutes les annonces
            </Link>
            <Link href="/dashboard/annonces/nouvelle" className="px-3.5 py-1.5 bg-[#1a3a5c] text-white text-xs font-semibold rounded-lg hover:bg-[#0f2540] transition-colors">
              + Ajouter
            </Link>
          </div>
        </div>
        {recentProps.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune annonce pour le moment.</p>
            <Link href="/dashboard/annonces/nouvelle" className="text-sm font-semibold text-[#1a3a5c] hover:underline mt-2 inline-block">
              Créer votre première annonce →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-5">
            {recentProps.map((prop) => {
              const img = prop.main_image_url || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80";
              return (
                <Link key={prop.id} href={`/dashboard/annonces/${prop.id}`} className="group block">
                  <div className="bg-[#fafbfc] rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                    <div className="relative h-36 sm:h-40 overflow-hidden">
                      <Image src={img} alt={prop.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                      <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${prop.status === "publie" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                        {getStatusLabel(prop.status)}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#e8b86d]">{getPropertyTypeLabel(prop.property_type)}</span>
                        <span className="text-[10px] text-gray-400">{formatDate(prop.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0f1724] leading-snug line-clamp-1">{prop.title}</h3>
                      <div className="flex items-center gap-1 mt-1 mb-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-500 truncate">{prop.city}</span>
                      </div>
                      <p className="text-sm font-extrabold text-[#1a3a5c] mb-2">
                        {formatPrice(prop.price)}
                        {prop.listing_type === "location" && <span className="text-[10px] text-gray-400 font-normal"> /mois</span>}
                      </p>
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                        {prop.bedrooms != null && (
                          <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {prop.bedrooms}</span>
                        )}
                        {prop.bathrooms != null && (
                          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {prop.bathrooms}</span>
                        )}
                        {prop.area != null && (
                          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {formatArea(prop.area)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Visits Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0f1724]">Demandes récentes</h2>
          <Link href="/dashboard/demandes" className="text-xs font-semibold text-[#1a3a5c] hover:underline flex items-center gap-1">
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentVisits.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Aucune demande de visite pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Nom</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Bien</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Date</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-[#fafbfc] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#1a3a5c] to-[#2d5a8c] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {visit.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f1724] truncate">{visit.full_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{visit.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-600 truncate max-w-[200px]">
                        {(visit.property as unknown as { title: string } | null)?.title ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs text-gray-400">{formatDate(visit.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(visit.status)}`}>
                        {getStatusLabel(visit.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { href: "/dashboard/annonces/nouvelle", icon: Plus,           label: "Nouvelle annonce",    bg: "bg-[#1a3a5c]" },
          { href: "/dashboard/demandes",          icon: CalendarCheck,   label: "Demandes de visite",  bg: "bg-green-600" },
          { href: "/dashboard/messages",          icon: MessageSquare,   label: "Messages",            bg: "bg-amber-500" },
          { href: "/biens",                       icon: Eye,             label: "Voir le site",        bg: "bg-gray-700" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.bg} text-white rounded-2xl p-4 sm:p-5 flex items-center gap-3 hover:opacity-90 active:scale-[.97] transition-all`}
          >
            <action.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
