import "server-only";
import { createSign } from "node:crypto";

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

interface GoogleApiErrorPayload {
  error?: {
    message?: string;
    status?: string;
    details?: Array<{
      reason?: string;
      [key: string]: unknown;
    }>;
  };
}

interface GoogleAnalyticsConfig {
  propertyId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

interface GoogleAnalyticsConfigResolution {
  config: GoogleAnalyticsConfig | null;
  error: string | null;
}

export interface AnalyticsTopItem {
  label: string;
  value: number;
}

export interface AdminAnalyticsOverview {
  periodDays: number;
  gaConnected: boolean;
  gaPropertyId: string | null;
  updatedAt: string;
  warning: string | null;
  hasRealData: boolean;
  metrics: {
    visitors: number;
    activeUsers: number;
    sessions: number;
    clicks: number;
    pageViews: number;
  };
  topCountries: AnalyticsTopItem[];
  topCities: AnalyticsTopItem[];
  trafficChannels: AnalyticsTopItem[];
  trafficSources: AnalyticsTopItem[];
  trafficMediums: AnalyticsTopItem[];
  trafficSourceMediums: AnalyticsTopItem[];
  referrers: AnalyticsTopItem[];
  topPages: AnalyticsTopItem[];
  events: AnalyticsTopItem[];
}

const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ANALYTICS_REPORT_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta";
const ALLOWED_PERIODS = new Set([7, 30, 90]);
const EMPTY_METRICS: AdminAnalyticsOverview["metrics"] = {
  visitors: 0,
  activeUsers: 0,
  sessions: 0,
  clicks: 0,
  pageViews: 0,
};

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

function unwrapEnvValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function normalizePrivateKey(rawValue: string) {
  const normalized = unwrapEnvValue(rawValue)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (
    normalized.startsWith("-----BEGIN PRIVATE KEY-----") &&
    normalized.endsWith("-----END PRIVATE KEY-----")
  ) {
    return normalized;
  }

  return null;
}

function getGoogleAnalyticsConfig(): GoogleAnalyticsConfigResolution {
  const rawPropertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.trim() ?? "";
  const serviceAccountEmail = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
  const privateKeyEnv = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.trim() ?? "";

  if (!rawPropertyId || !serviceAccountEmail || !privateKeyEnv) {
    return {
      config: null,
      error:
        "Variables Google Analytics manquantes. Renseignez GOOGLE_ANALYTICS_PROPERTY_ID, GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL et GOOGLE_ANALYTICS_PRIVATE_KEY.",
    };
  }

  const propertyId = rawPropertyId.replace(/^properties\//i, "");
  if (!/^\d+$/.test(propertyId)) {
    return {
      config: null,
      error:
        "GOOGLE_ANALYTICS_PROPERTY_ID invalide. Utilisez l'identifiant numérique de la propriété GA4, pas le Measurement ID G-XXXXXX.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(serviceAccountEmail)) {
    return {
      config: null,
      error:
        "GOOGLE_ANALYTICS_SERVICE_ACCOUNT_EMAIL invalide. Vérifiez l'adresse email du service account Google Cloud.",
    };
  }

  const privateKey = normalizePrivateKey(privateKeyEnv);
  if (!privateKey) {
    return {
      config: null,
      error:
        "GOOGLE_ANALYTICS_PRIVATE_KEY invalide. Collez la valeur private_key complète du JSON service account avec les retours ligne \\n.",
    };
  }

  return {
    config: {
      propertyId,
      serviceAccountEmail,
      privateKey,
    },
    error: null,
  };
}

function buildGoogleAssertion(config: GoogleAnalyticsConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: GOOGLE_ANALYTICS_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const unsignedToken = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${toBase64Url(signer.sign(config.privateKey))}`;
}

async function getGoogleAccessToken(config: GoogleAnalyticsConfig) {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildGoogleAssertion(config),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as GoogleApiErrorPayload | null;
    const googleMessage = errorPayload?.error?.message?.trim();
    throw new Error(
      googleMessage
        ? `Impossible de récupérer un token Google Analytics (${response.status}): ${googleMessage}`
        : `Impossible de récupérer un token Google Analytics (${response.status}).`
    );
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
    const errorPayload = (await response.json().catch(() => null)) as GoogleApiErrorPayload | null;
    const googleMessage = errorPayload?.error?.message?.trim();
    const googleReason = errorPayload?.error?.details?.[0]?.reason?.trim();
    const details = [googleMessage, googleReason].filter(Boolean).join(" | ");
    throw new Error(
      details
        ? `Impossible de lire les données Google Analytics (${response.status}): ${details}`
        : `Impossible de lire les données Google Analytics (${response.status}).`
    );
  }

  return (await response.json()) as GoogleAnalyticsReportResponse;
}

function normalizeGoogleDimensionLabel(rawValue: string | undefined) {
  const normalized = (rawValue ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "(not set)") return "Non défini";
  return normalized;
}

function toTopItems(
  report: GoogleAnalyticsReportResponse,
  options?: {
    limit?: number;
    labelBuilder?: (dimensions: string[]) => string;
  }
) {
  const items = (report.rows ?? [])
    .map((row) => {
      const dimensions = (row.dimensionValues ?? []).map((dimension) =>
        normalizeGoogleDimensionLabel(dimension.value)
      );
      const label =
        options?.labelBuilder?.(dimensions) ||
        dimensions.filter((value) => value.length > 0).join(" / ") ||
        "Non défini";

      return {
        label,
        value: Math.max(0, Math.round(toNumber(row.metricValues?.[0]?.value))),
      };
    })
    .filter((item) => item.value > 0);

  if (typeof options?.limit === "number") {
    return items.slice(0, options.limit);
  }

  return items;
}

function hasAnyRealData(overview: Omit<AdminAnalyticsOverview, "hasRealData">) {
  const metricTotal =
    overview.metrics.visitors +
    overview.metrics.activeUsers +
    overview.metrics.sessions +
    overview.metrics.clicks +
    overview.metrics.pageViews;
  const listTotal = [
    overview.topCountries,
    overview.topCities,
    overview.trafficChannels,
    overview.trafficSources,
    overview.trafficMediums,
    overview.trafficSourceMediums,
    overview.referrers,
    overview.topPages,
    overview.events,
  ].reduce((sum, items) => sum + items.length, 0);

  return metricTotal > 0 || listTotal > 0;
}

function createEmptyOverview(
  periodDays: number,
  options: {
    gaPropertyId: string | null;
    warning: string | null;
  }
): AdminAnalyticsOverview {
  return {
    periodDays,
    gaConnected: false,
    gaPropertyId: options.gaPropertyId,
    updatedAt: new Date().toISOString(),
    warning: options.warning,
    hasRealData: false,
    metrics: { ...EMPTY_METRICS },
    topCountries: [],
    topCities: [],
    trafficChannels: [],
    trafficSources: [],
    trafficMediums: [],
    trafficSourceMediums: [],
    referrers: [],
    topPages: [],
    events: [],
  };
}

export async function getAdminAnalyticsOverview(periodDays = 30): Promise<AdminAnalyticsOverview> {
  const normalizedPeriod = normalizePeriod(periodDays);
  const configResolution = getGoogleAnalyticsConfig();
  const config = configResolution.config;

  if (!config) {
    return createEmptyOverview(normalizedPeriod, {
      gaPropertyId: null,
      warning:
        configResolution.error ??
        "Google Analytics n'est pas configuré. Aucune donnée réelle ne peut être chargée.",
    });
  }

  try {
    const accessToken = await getGoogleAccessToken(config);
    const dateRanges = [{ startDate: `${normalizedPeriod}daysAgo`, endDate: "today" }];

    const [
      totalsReport,
      countriesReport,
      citiesReport,
      channelsReport,
      sourcesReport,
      mediumsReport,
      sourceMediumReport,
      referrersReport,
      pagesReport,
      eventsReport,
    ] = await Promise.all([
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        metrics: [
          { name: "totalUsers" },
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "eventCount" },
          { name: "screenPageViews" },
        ],
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "city" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "sessionMedium" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "pageReferrer" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      runGoogleAnalyticsReport(accessToken, config.propertyId, {
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 10,
      }),
    ]);

    const totalRow = totalsReport.rows?.[0];
    const overviewWithoutDataFlag: Omit<AdminAnalyticsOverview, "hasRealData"> = {
      periodDays: normalizedPeriod,
      gaConnected: true,
      gaPropertyId: config.propertyId,
      updatedAt: new Date().toISOString(),
      warning: null,
      metrics: {
        visitors: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[0]?.value))),
        activeUsers: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[1]?.value))),
        sessions: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[2]?.value))),
        clicks: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[3]?.value))),
        pageViews: Math.max(0, Math.round(toNumber(totalRow?.metricValues?.[4]?.value))),
      },
      topCountries: toTopItems(countriesReport, { limit: 8 }),
      topCities: toTopItems(citiesReport, { limit: 8 }),
      trafficChannels: toTopItems(channelsReport, { limit: 8 }),
      trafficSources: toTopItems(sourcesReport, { limit: 8 }),
      trafficMediums: toTopItems(mediumsReport, { limit: 8 }),
      trafficSourceMediums: toTopItems(sourceMediumReport, {
        limit: 8,
        labelBuilder: ([source, medium]) => `${source || "Non défini"} / ${medium || "Non défini"}`,
      }),
      referrers: toTopItems(referrersReport, { limit: 8 }),
      topPages: toTopItems(pagesReport, {
        limit: 10,
        labelBuilder: ([path, title]) =>
          title && title !== "Non défini" ? `${title} (${path || "/"})` : path || "/",
      }),
      events: toTopItems(eventsReport, { limit: 10 }),
    };

    return {
      ...overviewWithoutDataFlag,
      hasRealData: hasAnyRealData(overviewWithoutDataFlag),
    };
  } catch (error) {
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "Erreur inconnue lors de l'appel Google Analytics.";

    return createEmptyOverview(normalizedPeriod, {
      gaPropertyId: config.propertyId,
      warning: `Connexion Google Analytics indisponible. ${detail}`,
    });
  }
}
