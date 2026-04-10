import "server-only";
import { createSign } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

interface GoogleAccessTokenResponse {
  access_token?: string;
}

interface GoogleAnalyticsMetricValue {
  value?: string;
}

interface GoogleAnalyticsDimensionValue {
  value?: string;
}

interface GoogleAnalyticsRow {
  metricValues?: GoogleAnalyticsMetricValue[];
  dimensionValues?: GoogleAnalyticsDimensionValue[];
}

interface GoogleAnalyticsReportResponse {
  rows?: GoogleAnalyticsRow[];
}

interface GoogleAnalyticsConfig {
  propertyId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

export interface AnalyticsTopItem {
  label: string;
  value: number;
}

export interface LocalAnalyticsFallback {
  knownVisitors: number;
  visitRequests: number;
  pendingVisitRequests: number;
  propertyViews: number;
  topDemandCities: AnalyticsTopItem[];
}

export interface AdminAnalyticsOverview {
  periodDays: number;
  gaConnected: boolean;
  gaPropertyId: string | null;
  updatedAt: string;
  warning: string | null;
  metrics: {
    visitors: number;
    sessions: number;
    clicks: number;
    pageViews: number;
  };
  topCountries: AnalyticsTopItem[];
  trafficChannels: AnalyticsTopItem[];
  trafficSources: AnalyticsTopItem[];
  localFallback: LocalAnalyticsFallback;
}

const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ANALYTICS_REPORT_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta";
const ALLOWED_PERIODS = new Set([7, 30, 90]);

function normalizePeriod(periodDays: number) {
  if (ALLOWED_PERIODS.has(periodDays)) return periodDays;
  return 30;
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildGoogleAssertion(config: GoogleAnalyticsConfig) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.serviceAccountEmail,
    scope: GOOGLE_ANALYTICS_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(config.privateKey);
  return `${unsignedToken}.${toBase64Url(signature)}`;
}

function normalizeGoogleDimensionLabel(rawValue: string | undefined) {
  const normalized = (rawValue ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "(not set)") return "Non défini";
  return normalized;
}

function toTopItems(report: GoogleAnalyticsReportResponse, options?: { limit?: number }) {
  const rawRows = report.rows ?? [];
  const items = rawRows
    .map((row) => ({
      label:
        (row.dimensionValues ?? [])
          .map((dimension) => normalizeGoogleDimensionLabel(dimension.value))
          .filter((value) => value.length > 0)
          .join(" / ") || "Non défini",
      value: Math.max(0, Math.round(toNumber(row.metricValues?.[0]?.value))),
    }))
    .filter((item) => item.value > 0);

  if (typeof options?.limit === "number") {
    return items.slice(0, options.limit);
  }

  return items;
}

function getGoogleAnalyticsConfig(): GoogleAnalyticsConfig | null {
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim();
  const serviceAccountEmail = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyEnv = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.trim();

  if (!propertyId || !serviceAccountEmail || !privateKeyEnv) {
    return null;
  }

  return {
    propertyId,
    serviceAccountEmail,
    privateKey: privateKeyEnv.replace(/\\n/g, "\n"),
  };
}

async function getGoogleAccessToken(config: GoogleAnalyticsConfig) {
  const assertion = buildGoogleAssertion(config);
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Impossible de récupérer un token Google (${response.status}).`);
  }

  const payload = (await response.json()) as GoogleAccessTokenResponse;
  if (!payload.access_token) {
    throw new Error("Token Google Analytics invalide ou manquant.");
  }

  return payload.access_token;
}

async function runGoogleAnalyticsReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `${GOOGLE_ANALYTICS_REPORT_ENDPOINT}/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Impossible de lire les données GA4 (${response.status}).`);
  }

  return (await response.json()) as GoogleAnalyticsReportResponse;
}

function extractDemandCity(propertyField: unknown) {
  if (Array.isArray(propertyField)) {
    const firstEntry = propertyField[0] as { city?: unknown } | undefined;
    const city = typeof firstEntry?.city === "string" ? firstEntry.city.trim() : "";
    return city;
  }

  if (propertyField && typeof propertyField === "object") {
    const city = (propertyField as { city?: unknown }).city;
    return typeof city === "string" ? city.trim() : "";
  }

  return "";
}

async function getLocalAnalyticsFallback(periodDays: number): Promise<LocalAnalyticsFallback> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (periodDays - 1));
  const startIso = startDate.toISOString();

  const [
    { count: visitRequestsCount },
    { count: pendingRequestsCount },
    { data: propertyViewsRows },
    { data: visitorEmailRows },
    { data: visitCityRows },
  ] = await Promise.all([
    supabase
      .from("visit_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startIso),
    supabase
      .from("visit_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "en_attente")
      .gte("created_at", startIso),
    supabase.from("properties").select("views_count"),
    supabase.from("visit_requests").select("email").gte("created_at", startIso),
    supabase
      .from("visit_requests")
      .select("property:properties(city)")
      .gte("created_at", startIso),
  ]);

  const knownVisitors = new Set(
    ((visitorEmailRows as { email?: string | null }[] | null) ?? [])
      .map((row) => (row.email ?? "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  const propertyViews = ((propertyViewsRows as { views_count?: number | null }[] | null) ?? []).reduce(
    (sum, row) => sum + Math.max(0, Math.round(toNumber(row.views_count))),
    0
  );

  const cityCounter = new Map<string, number>();
  ((visitCityRows as { property?: unknown }[] | null) ?? []).forEach((row) => {
    const city = extractDemandCity(row.property);
    if (!city) return;
    cityCounter.set(city, (cityCounter.get(city) ?? 0) + 1);
  });

  const topDemandCities = Array.from(cityCounter.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    knownVisitors,
    visitRequests: visitRequestsCount ?? 0,
    pendingVisitRequests: pendingRequestsCount ?? 0,
    propertyViews,
    topDemandCities,
  };
}

export async function getAdminAnalyticsOverview(periodDays = 30): Promise<AdminAnalyticsOverview> {
  const normalizedPeriod = normalizePeriod(periodDays);
  const localFallback = await getLocalAnalyticsFallback(normalizedPeriod);
  const config = getGoogleAnalyticsConfig();

  if (!config) {
    return {
      periodDays: normalizedPeriod,
      gaConnected: false,
      gaPropertyId: null,
      updatedAt: new Date().toISOString(),
      warning: "Google Analytics n'est pas configuré. Affichage des indicateurs internes.",
      metrics: {
        visitors: localFallback.knownVisitors,
        sessions: localFallback.visitRequests,
        clicks: localFallback.propertyViews,
        pageViews: localFallback.propertyViews,
      },
      topCountries: [],
      trafficChannels: [],
      trafficSources: [],
      localFallback,
    };
  }

  try {
    const accessToken = await getGoogleAccessToken(config);

    const [totalsReport, countriesReport, channelsReport, sourcesReport] = await Promise.all([
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: `${normalizedPeriod}daysAgo`, endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "eventCount" },
          { name: "screenPageViews" },
        ],
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: `${normalizedPeriod}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: `${normalizedPeriod}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges: [{ startDate: `${normalizedPeriod}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
    ]);

    const totalRow = totalsReport.rows?.[0];

    return {
      periodDays: normalizedPeriod,
      gaConnected: true,
      gaPropertyId: config.propertyId,
      updatedAt: new Date().toISOString(),
      warning: null,
      metrics: {
        visitors: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[0]?.value))),
        sessions: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[1]?.value))),
        clicks: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[2]?.value))),
        pageViews: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[3]?.value))),
      },
      topCountries: toTopItems(countriesReport, { limit: 8 }),
      trafficChannels: toTopItems(channelsReport, { limit: 8 }),
      trafficSources: toTopItems(sourcesReport, { limit: 8 }),
      localFallback,
    };
  } catch {
    return {
      periodDays: normalizedPeriod,
      gaConnected: false,
      gaPropertyId: config.propertyId,
      updatedAt: new Date().toISOString(),
      warning:
        "Connexion GA4 indisponible pour le moment. Vérifiez les identifiants du service account et les permissions de la propriété.",
      metrics: {
        visitors: localFallback.knownVisitors,
        sessions: localFallback.visitRequests,
        clicks: localFallback.propertyViews,
        pageViews: localFallback.propertyViews,
      },
      topCountries: [],
      trafficChannels: [],
      trafficSources: [],
      localFallback,
    };
  }
}
