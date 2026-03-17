"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Mail, Phone, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import type { Contact } from "@/types";

const STATUSES = ["nouveau", "lu", "traite", "archive"] as const;

export default function MessagesPage() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchContacts = async () => {
    let q = supabase
      .from("contacts")
      .select("*, property:properties(title)")
      .order("created_at", { ascending: false });
    if (filter) q = q.eq("status", filter);
    const { data } = await q;
    setContacts((data as Contact[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contacts").update({ status }).eq("id", id);
    fetchContacts();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1724]">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} message{contacts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filter === s ? "bg-[#1a3a5c] text-white border-[#1a3a5c]" : "border-gray-200 text-gray-600 hover:border-[#1a3a5c]"
              }`}
            >
              {s ? getStatusLabel(s) : "Tous"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Aucun message</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setExpanded(expanded === contact.id ? null : contact.id);
                  if (contact.status === "nouveau") updateStatus(contact.id, "lu");
                }}
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${contact.status === "nouveau" ? "bg-blue-500" : "bg-gray-200"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-[#0f1724]">{contact.full_name}</p>
                    {contact.subject && (
                      <span className="text-sm text-gray-500 truncate">� {contact.subject}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="w-3 h-3" />{contact.email}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(contact.created_at)}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)} shrink-0`}>
                  {getStatusLabel(contact.status)}
                </span>
              </div>

              {expanded === contact.id && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 py-3">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{contact.email}</span>
                    {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{contact.phone}</span>}
                    {contact.property && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {(contact.property as unknown as { title: string } | null)?.title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed mb-4">
                    {contact.message}
                  </p>
                  <div className="flex gap-2">
                    {STATUSES.filter((s) => s !== contact.status).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(contact.id, s)}
                        className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-xl hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors"
                      >
                        {getStatusLabel(s)}
                      </button>
                    ))}
                    <a
                      href={`mailto:${contact.email}`}
                      className="ml-auto px-3 py-1.5 text-xs font-medium bg-[#1a3a5c] text-white rounded-xl hover:bg-[#0f2540] transition-colors"
                    >
                      Répondre par email
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

