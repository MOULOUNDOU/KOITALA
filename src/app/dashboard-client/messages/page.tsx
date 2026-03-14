"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

interface MessageItem {
  id: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  property: { title: string; slug: string } | { title: string; slug: string }[] | null;
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("contacts")
        .select("id, subject, message, status, created_at, property:properties(title, slug)")
        .eq("email", user.email ?? "")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      setMessages((data as MessageItem[] | null) ?? []);
      setLoading(false);
    };

    void loadMessages();

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

  const newMessages = messages.filter((message) => message.status === "nouveau").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f1724]">Mes messages</h1>
            <p className="text-sm text-gray-500 mt-1">
              {messages.length} message{messages.length !== 1 ? "s" : ""} envoyé{messages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] font-medium">
              <MessageSquare className="w-4 h-4" /> {newMessages} nouveau{newMessages > 1 ? "x" : ""}
            </span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a3a5c] text-white font-medium hover:bg-[#0f2540] transition-colors"
            >
              <Send className="w-4 h-4" /> Nouveau message
            </Link>
          </div>
        </div>
      </section>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center px-4">
          <MessageCircle className="w-14 h-14 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun message envoyé</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md">Vos demandes envoyées à l&apos;agence apparaîtront ici.</p>
          <Link
            href="/contact"
            className="px-5 py-2.5 bg-[#1a3a5c] text-white text-sm font-semibold rounded-xl hover:bg-[#0f2540] transition-colors"
          >
            Contacter KOITALA
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const property = pickFirst(message.property);

            return (
              <article key={message.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#0f1724] line-clamp-1">
                        {message.subject?.trim() || "Message sans objet"}
                      </p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusLabel(message.status)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1">Envoyé le {formatDate(message.created_at)}</p>

                    <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">
                      {message.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {property?.title ? (
                        <p className="text-xs text-gray-500">Concernant: {property.title}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Message général</p>
                      )}

                      {property?.slug ? (
                        <Link
                          href={`/biens/${property.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Voir le bien <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Envoyer un nouveau message <ArrowRight className="w-3.5 h-3.5" />
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
