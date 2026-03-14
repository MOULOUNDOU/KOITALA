"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Contact } from "@/types";

export default function MessagesPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("contacts")
        .select("*, property:properties(title)")
        .eq("email", user.email!)
        .order("created_at", { ascending: false });
      setMessages((data as Contact[]) ?? []);
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
        <h1 className="text-2xl font-bold text-[#0f1724]">Mes messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {messages.length} message{messages.length !== 1 ? "s" : ""} envoyé{messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun message</h3>
          <p className="text-sm text-gray-400">Vos messages envoyés apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-2 gap-3">
                <p className="font-medium text-[#0f1724] truncate">{m.subject ?? "Message sans objet"}</p>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(m.created_at)}</p>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{m.message}</p>
              {m.property && (
                <p className="text-xs text-gray-400 mt-2">
                  Concernant : {(m.property as unknown as { title: string } | null)?.title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
