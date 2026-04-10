export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  MousePointerClick,
  RadioTower,
  RefreshCw,
  Users,
  WifiOff,
} from "lucide-react";
import { getAdminAnalyticsOverview, type AnalyticsTopItem } from "@/lib/analytics/adminAnalytics";

export const metadata: Metadata = { title: "Analyse" };

const PERIOD_OPTIONS = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: 90, label: "90 jours" },
] as const;

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.max(0, Math.round(value)));
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSafePeriod(value: string | undefined) {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 30 || parsed === 90) return parsed;
  return 30;
}

function SectionList({
  title,
  subtitle,
  items,
  metricLabel,
}: {
  title: string;
  subtitle: string;
  items: AnalyticsTopItem[];
  metricLabel: string;
}) {
  const strongestValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">{subtitle}</p>
      <h2 className="mt-1 text-base font-bold text-[#0f1724] sm:text-lg">{title}</h2>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
          Données indisponibles pour le moment.
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const ratio = item.value <= 0 ? 0 : Math.max(8, Math.round((item.value / strongestValue) * 100));
            return (
              <li key={`${title}-${item.label}`} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[#0f1724]">{item.label}</span>
                  <span className="text-gray-500">
                    {formatMetricValue(item.value)} {metricLabel}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#1a3a5c]" style={{ width: `${ratio}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface AnalysePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardAnalysePage({ searchParams }: AnalysePageProps) {
  const params = await searchParams;
  const periodParam = Array.isArray(params.period) ? params.period[0] : params.period;
  const selectedPeriod = getSafePeriod(periodParam);

  const analytics = await getAdminAnalyticsOverview(selectedPeriod);
  const provenanceItems = analytics.gaConnected ? analytics.topCountries : analytics.localFallback.topDemandCities;

  return (
    <div className="w-full space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Dashboard KOITALA</p>
            <h1 className="mt-2 text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
              Analyse &amp; Statistiques
            </h1>
            <p className="mt-1.5 text-sm text-gray-600">
              Suivi des visiteurs, des interactions et des sources de trafic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                analytics.gaConnected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {analytics.gaConnected ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {analytics.gaConnected ? "GA4 connecté" : "GA4 non configuré"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a5c]/10 px-3 py-1 text-xs font-semibold text-[#1a3a5c]">
              <RefreshCw className="h-3.5 w-3.5" />
              Mis à jour: {formatDateTime(analytics.updatedAt)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => {
            const active = option.value === selectedPeriod;
            return (
              <Link
                key={option.value}
                href={`/dashboard/analyse?period=${option.value}`}
                className={`inline-flex items-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  active
                    ? "border-[#1a3a5c] bg-[#1a3a5c] text-white"
                    : "border-gray-200 bg-white text-[#1a3a5c] hover:bg-gray-50"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        {analytics.warning && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {analytics.warning}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Visiteurs",
            value: analytics.metrics.visitors,
            helper: analytics.gaConnected ? "Utilisateurs uniques" : "Visiteurs connus (fallback)",
            icon: Users,
            bgColor: "#1d4ed8",
          },
          {
            label: "Visites",
            value: analytics.metrics.sessions,
            helper: analytics.gaConnected ? "Sessions" : "Demandes enregistrées",
            icon: Globe2,
            bgColor: "#0f5b3d",
          },
          {
            label: "Clics",
            value: analytics.metrics.clicks,
            helper: analytics.gaConnected ? "Événements GA4" : "Interactions locales",
            icon: MousePointerClick,
            bgColor: "#6b4226",
          },
          {
            label: "Pages vues",
            value: analytics.metrics.pageViews,
            helper: analytics.gaConnected ? "Vues de page" : "Vues annonces internes",
            icon: BarChart3,
            bgColor: "#8a1f1f",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
            style={{ backgroundColor: item.bgColor }}
          >
            <div
              className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white sm:h-10 sm:w-10"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {item.label}
            </p>
            <p className="font-display mt-2 text-[1.65rem] font-extrabold text-white sm:text-[1.9rem] lg:text-3xl">
              {formatMetricValue(item.value)}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/90">{item.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionList
          title={analytics.gaConnected ? "Provenance des visiteurs" : "Provenance des demandes"}
          subtitle={analytics.gaConnected ? "Pays" : "Villes (fallback)"}
          items={provenanceItems}
          metricLabel={analytics.gaConnected ? "visiteurs" : "demandes"}
        />

        <SectionList
          title="Canaux de trafic"
          subtitle="Acquisition"
          items={analytics.trafficChannels}
          metricLabel="sessions"
        />

        <SectionList
          title="Sources de trafic"
          subtitle="Source / Medium"
          items={analytics.trafficSources}
          metricLabel="sessions"
        />
      </section>

      {!analytics.gaConnected && (
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0f1724] sm:text-lg">Connecter Google Analytics 4</h2>
              <p className="mt-1 text-sm text-gray-600">
                Configurez GA4 pour afficher les vraies données de trafic, de provenance et d&apos;acquisition.
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-gray-600">
                <li>Créer un Service Account Google Cloud et activer l&apos;API Google Analytics Data.</li>
                <li>Donner au Service Account un accès Lecteur à votre propriété GA4.</li>
                <li>
                  Ajouter les variables serveur:
                  <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">GOOGLE_ANALYTICS_PROPERTY_ID</code>,
                  <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL</code>,
                  <code className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs">GOOGLE_ANALYTICS_PRIVATE_KEY</code>.
                </li>
              </ol>
            </div>

            <Link
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-[#1a3a5c]/20 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] hover:bg-[#f8fafc] sm:text-sm"
            >
              Ouvrir GA4 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Visites internes</p>
              <p className="mt-1 text-xl font-bold text-[#0f1724]">
                {formatMetricValue(analytics.localFallback.visitRequests)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">En attente</p>
              <p className="mt-1 text-xl font-bold text-[#0f1724]">
                {formatMetricValue(analytics.localFallback.pendingVisitRequests)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Vues annonces</p>
              <p className="mt-1 text-xl font-bold text-[#0f1724]">
                {formatMetricValue(analytics.localFallback.propertyViews)}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0f1724]">Besoin d&apos;aller plus loin ?</p>
            <p className="text-sm text-gray-500">Ajoutez des objectifs GA4 (contacts, appels, WhatsApp) pour suivre la conversion.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3a5c] hover:underline sm:text-sm"
          >
            Retour tableau de bord <RadioTower className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
