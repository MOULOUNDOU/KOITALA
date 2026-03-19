"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Users, Mail, Search, Shield, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

export default function UtilisateursPage() {
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) {
        setCurrentUserId(user?.id ?? null);
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;
      setUsers((data as Profile[]) ?? []);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Changer le rôle en ${newRole} ?`)) return;
    setUpdatingRoleId(userId);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);

    if (error) {
      toast.error("Impossible de modifier le rôle.");
      setUpdatingRoleId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "user" } : u))
    );
    toast.success(`Rôle mis à jour: ${newRole === "admin" ? "Admin" : "Utilisateur"}.`);
    setUpdatingRoleId(null);
  };

  const handleDeleteUser = async (user: Profile) => {
    if (user.id === currentUserId) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte admin.");
      return;
    }

    if (!confirm(`Supprimer définitivement ${user.full_name || user.email} ?`)) return;

    setDeletingId(user.id);
    try {
      const response = await fetch("/api/account/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error || "Suppression impossible pour cet utilisateur.");
        return;
      }

      setUsers((prev) => prev.filter((entry) => entry.id !== user.id));
      toast.success("Utilisateur supprimé.");
    } catch {
      toast.error("Erreur réseau pendant la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;

    return users.filter((user) => {
      const haystack = [user.full_name ?? "", user.email ?? "", user.role].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [users, normalizedQuery]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-7">
        <h1 className="text-[1.35rem] font-bold text-[#0f1724] sm:text-[1.5rem] lg:text-2xl">Utilisateurs</h1>
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
            <div className="border-b border-gray-100 bg-white px-5 py-3.5">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher par nom, email ou rôle"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-[#f8fafc] pl-9 pr-3 text-sm text-[#0f1724] outline-none transition-all placeholder:text-gray-400 focus:border-[#1a3a5c] focus:bg-white"
                />
              </div>
            </div>
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1a3a5c]/10 rounded-full flex items-center justify-center text-xs font-bold text-[#1a3a5c] shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-[#0f1724]">{user.full_name ?? "Utilisateur"}</span>
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
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          disabled={updatingRoleId === user.id || deletingId === user.id}
                          className="text-xs text-gray-500 hover:text-[#1a3a5c] px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingRoleId === user.id ? "Mise à jour..." : "Changer rôle"}
                        </button>
                        <button
                          onClick={() => void handleDeleteUser(user)}
                          disabled={deletingId === user.id || user.id === currentUserId}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title={user.id === currentUserId ? "Suppression de votre compte désactivée" : "Supprimer l utilisateur"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingId === user.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredUsers.length === 0 && (
              <div className="border-t border-gray-100 px-6 py-10 text-center text-sm text-gray-500">
                Aucun utilisateur ne correspond à votre recherche.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
