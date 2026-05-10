import {
  Activity,
  FileText,
  Flag,
  Globe2,
  Link2,
  MapPin,
  Megaphone,
  Navigation,
  Network,
  Search,
  Share2,
} from "lucide-react";

export type AnalyticsVisualKind =
  | "country"
  | "city"
  | "channel"
  | "source"
  | "medium"
  | "sourceMedium"
  | "referrer"
  | "page"
  | "event";

type AnalyticsVisualIconName =
  | "activity"
  | "file"
  | "flag"
  | "globe"
  | "link"
  | "mapPin"
  | "megaphone"
  | "navigation"
  | "network"
  | "search"
  | "share";

const COUNTRY_CODES: Record<string, string> = {
  benin: "BJ",
  belgium: "BE",
  brazil: "BR",
  "burkina faso": "BF",
  cameroon: "CM",
  canada: "CA",
  china: "CN",
  "cote d ivoire": "CI",
  france: "FR",
  gambia: "GM",
  germany: "DE",
  ghana: "GH",
  guinea: "GN",
  india: "IN",
  ireland: "IE",
  italy: "IT",
  mali: "ML",
  mauritania: "MR",
  morocco: "MA",
  netherlands: "NL",
  niger: "NE",
  nigeria: "NG",
  portugal: "PT",
  russia: "RU",
  senegal: "SN",
  "saudi arabia": "SA",
  "south africa": "ZA",
  spain: "ES",
  switzerland: "CH",
  togo: "TG",
  turkey: "TR",
  "united arab emirates": "AE",
  "united kingdom": "GB",
  "united states": "US",
};

const REGION_CODES = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW",
] as const;

let countryCodeCache: Map<string, string> | null = null;

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCountryCodeCache() {
  if (countryCodeCache) return countryCodeCache;

  const nextCache = new Map<string, string>();
  Object.entries(COUNTRY_CODES).forEach(([label, code]) => nextCache.set(label, code));

  for (const locale of ["en", "fr"]) {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    REGION_CODES.forEach((code) => {
      const label = displayNames.of(code);
      if (label) nextCache.set(normalizeLabel(label), code);
    });
  }

  countryCodeCache = nextCache;
  return nextCache;
}

function countryCodeToFlag(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCode)) return null;

  return Array.from(normalizedCode)
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

export function getAnalyticsDisplayLabel(label: string) {
  const cleaned = label.trim();
  if (!cleaned || cleaned === "(not set)") return "Non défini";
  return cleaned;
}

export function getCountryFlag(label: string) {
  const displayLabel = getAnalyticsDisplayLabel(label);
  if (displayLabel === "Non défini") return null;

  const directCode = displayLabel.length === 2 ? countryCodeToFlag(displayLabel) : null;
  if (directCode) return directCode;

  const countryCode = getCountryCodeCache().get(normalizeLabel(displayLabel));
  return countryCode ? countryCodeToFlag(countryCode) : null;
}

function getAnalyticsVisualIconName(kind: AnalyticsVisualKind, label: string): AnalyticsVisualIconName {
  const normalized = normalizeLabel(getAnalyticsDisplayLabel(label));

  if (kind === "country") return normalized ? "flag" : "globe";
  if (kind === "city") return "mapPin";
  if (kind === "referrer") return "link";
  if (kind === "page") return "file";
  if (kind === "event") return "activity";

  if (normalized.includes("organic") || normalized.includes("search") || normalized.includes("google")) {
    return "search";
  }

  if (
    normalized.includes("social") ||
    normalized.includes("facebook") ||
    normalized.includes("instagram") ||
    normalized.includes("linkedin") ||
    normalized.includes("twitter") ||
    normalized.includes("tiktok")
  ) {
    return "share";
  }

  if (normalized.includes("paid") || normalized.includes("cpc") || normalized.includes("ads")) {
    return "megaphone";
  }

  if (normalized.includes("direct") || normalized.includes("none")) {
    return "navigation";
  }

  if (normalized.includes("referral")) return "link";

  return "network";
}

function AnalyticsIcon({ name }: { name: AnalyticsVisualIconName }) {
  const className = "h-4 w-4";

  switch (name) {
    case "activity":
      return <Activity className={className} />;
    case "file":
      return <FileText className={className} />;
    case "flag":
      return <Flag className={className} />;
    case "globe":
      return <Globe2 className={className} />;
    case "link":
      return <Link2 className={className} />;
    case "mapPin":
      return <MapPin className={className} />;
    case "megaphone":
      return <Megaphone className={className} />;
    case "navigation":
      return <Navigation className={className} />;
    case "search":
      return <Search className={className} />;
    case "share":
      return <Share2 className={className} />;
    case "network":
    default:
      return <Network className={className} />;
  }
}

export default function AnalyticsVisualBadge({
  kind,
  label,
  className = "",
}: {
  kind: AnalyticsVisualKind;
  label: string;
  className?: string;
}) {
  const flag = kind === "country" ? getCountryFlag(label) : null;
  const iconName = getAnalyticsVisualIconName(kind, label);

  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#1a3a5c]/10 bg-[#1a3a5c]/5 text-[#1a3a5c] ${className}`}
      aria-hidden="true"
    >
      {flag ? <span className="text-xl leading-none">{flag}</span> : <AnalyticsIcon name={iconName} />}
    </span>
  );
}
