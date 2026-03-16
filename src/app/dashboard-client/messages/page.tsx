"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import ClientPageHero from "@/components/dashboard/ClientPageHero";
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  const newMessages = messages.filter((message) => message.status === "nouveau").length;
  const handledMessages = messages.filter(
    (message) => message.status === "lu" || message.status === "traite"
  ).length;
  const propertyMessages = messages.filter((message) => pickFirst(message.property)?.title).length;

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <ClientPageHero
        title="Mes messages"
        description="Retrouvez l'historique de vos demandes envoyées à l'agence et les biens concernés."
        chips={[
          { icon: MessageSquare, value: messages.length, label: "messages" },
          { icon: Send, value: newMessages, label: "nouveaux" },
          { icon: ShieldCheck, value: handledMessages, label: "consultés/traités" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard-client"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
            >
              Retour dashboard
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
            >
              <Send className="h-4 w-4" />
              Nouveau message
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: MessageSquare,
            label: "Messages envoyés",
            value: messages.length,
            helper: "Historique complet",
            bgColor: "#1d4ed8",
          },
          {
            icon: Send,
            label: "Nouveaux",
            value: newMessages,
            helper: "En attente de lecture",
            bgColor: "#047857",
          },
          {
            icon: ShieldCheck,
            label: "Concernant un bien",
            value: propertyMessages,
            helper: `${handledMessages} message(s) suivis`,
            bgColor: "#6b4226",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
            style={{ backgroundColor: item.bgColor }}
          >
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {item.label}
            </p>
            <p className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/90">{item.helper}</p>
          </div>
        ))}
      </section>

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-4 py-20 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-14 w-14 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700">Aucun message envoyé</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
            Vos demandes envoyées à l&apos;agence apparaîtront ici.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f2540]"
          >
            Contacter KOITALA
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const property = pickFirst(message.property);

            return (
              <article key={message.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
                    <MessageSquare className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="line-clamp-1 font-semibold text-[#0f1724]">
                        {message.subject?.trim() || "Message sans objet"}
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusLabel(message.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">Envoyé le {formatDate(message.created_at)}</p>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{message.message}</p>

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
                          Voir le bien <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:text-[#0f2540]"
                        >
                          Envoyer un nouveau message <ArrowRight className="h-3.5 w-3.5" />
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
