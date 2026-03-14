export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, getStatusColor, getStatusLabel, getPropertyTypeLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes annonces" };

async function getProperties() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, slug, title, city, price, status, listing_type, property_type, is_featured, created_at, views_count")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AnnoncesPage() {
  const properties = await getProperties();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1724]">Mes annonces</h1>
          <p className="text-sm text-gray-500 mt-0.5">{properties.length} annonce{properties.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/dashboard/annonces/nouvelle"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm mb-4">Aucune annonce pour le moment.</p>
            <Link
              href="/dashboard/annonces/nouvelle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] text-white text-sm font-medium rounded-xl"
            >
              <Plus className="w-4 h-4" /> Créer votre première annonce
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bien</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vues</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Créé le</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-[#0f1724] truncate max-w-[220px]">{prop.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{prop.city}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-600">{getPropertyTypeLabel(prop.property_type)}</span>
                        <span className={`text-xs font-medium ${prop.listing_type === "vente" ? "text-blue-600" : "text-purple-600"}`}>
                          {prop.listing_type === "vente" ? "Vente" : "Location"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#1a3a5c]">{formatPrice(prop.price)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(prop.status)}`}>
                        {getStatusLabel(prop.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{prop.views_count}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(prop.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/biens/${prop.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/annonces/${prop.id}`}
                          className="p-1.5 text-gray-400 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

