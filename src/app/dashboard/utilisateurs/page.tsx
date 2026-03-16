"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export default function UtilisateursPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Changer le rôle en ${newRole} ?`)) return;
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u))
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0f1724]">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} utilisateur{users.length !== 1 ? "s" : ""} inscrit{users.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-14 h-14 text-gray-200 mb-3" />
            <p className="text-gray-500">Aucun utilisateur pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscrit le</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#1a3a5c] shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-[#0f1724]">{user.full_name ?? "�"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin" ? "bg-[#1a3a5c] text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role === "admin" ? "Admin" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        className="text-xs text-gray-500 hover:text-[#1a3a5c] px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Changer rôle
                      </button>
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
