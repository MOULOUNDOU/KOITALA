const DEFAULT_MAPTILER_STYLE = "streets-v4";
const SENEGAL_BOUNDS = "-17.6250,12.3073,-11.3458,16.6925";

interface PropertyLocationInput {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

interface MapTilerGeocodingFeature {
  center?: [number, number];
  place_name?: string;
}

interface MapTilerGeocodingResponse {
  features?: MapTilerGeocodingFeature[];
}

export interface MapTilerGeocodingMatch {
  lat: number;
  lng: number;
  placeName: string | null;
}

function normalizeMapTilerStyleId(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return DEFAULT_MAPTILER_STYLE;
  }

  if (!trimmedValue.includes("://")) {
    return trimmedValue.replace(/^\/+|\/+$/g, "");
  }

  try {
    const parsed = new URL(trimmedValue);
    const matchedStyle = parsed.pathname.match(/\/maps\/([^/]+)(?:\/style\.json)?\/?$/);

    if (matchedStyle?.[1]) {
      return matchedStyle[1];
    }
  } catch {
    // Fall back to regex parsing below.
  }

  const fallbackMatch = trimmedValue.match(/\/maps\/([^/?#]+)/);
  return fallbackMatch?.[1] || DEFAULT_MAPTILER_STYLE;
}

export function getMapTilerStyleId(): string {
  const envStyle = process.env.NEXT_PUBLIC_MAPTILER_MAP_STYLE?.trim();
  return envStyle ? normalizeMapTilerStyleId(envStyle) : DEFAULT_MAPTILER_STYLE;
}

export function getMapTilerTileUrl(apiKey: string, styleId = getMapTilerStyleId()): string {
  return `https://api.maptiler.com/maps/${styleId}/256/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`;
}

export function getMapTilerAttribution(): string {
  return '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>';
}

export function getOpenStreetMapPlaceUrl(lat: number, lng: number, zoom = 15): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

export function getGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${lat},${lng}`);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

function normalizeLocationPart(value?: string | null): string {
  return value?.trim() ?? "";
}

function resolveCountryCode(country?: string | null): string | null {
  const normalized = normalizeLocationPart(country).toLowerCase();

  if (!normalized) return "sn";
  if (normalized === "sn" || normalized === "sénégal" || normalized === "senegal") {
    return "sn";
  }

  if (normalized.length === 2) {
    return normalized;
  }

  return null;
}

export function buildPropertyLocationLabel(location: PropertyLocationInput): string {
  const parts = [
    normalizeLocationPart(location.address),
    normalizeLocationPart(location.neighborhood),
    normalizeLocationPart(location.city),
  ].filter(Boolean);

  return parts.join(", ") || "Localisation du bien";
}

export function buildPropertyGeocodingQuery(location: PropertyLocationInput): string | null {
  const parts = [
    normalizeLocationPart(location.address),
    normalizeLocationPart(location.neighborhood),
    normalizeLocationPart(location.city),
    normalizeLocationPart(location.postalCode),
    normalizeLocationPart(location.country),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

export async function geocodePropertyLocation(
  location: PropertyLocationInput,
  apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ?? ""
): Promise<MapTilerGeocodingMatch | null> {
  if (!apiKey) return null;

  const query = buildPropertyGeocodingQuery(location);
  if (!query) return null;

  const countryCode = resolveCountryCode(location.country);
  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "fr");
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("bbox", SENEGAL_BOUNDS);
  if (countryCode) {
    url.searchParams.set("country", countryCode);
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MapTilerGeocodingResponse;
  const match = payload.features?.[0];

  if (!match?.center || match.center.length < 2) {
    return null;
  }

  const [lng, lat] = match.center;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    placeName: match.place_name?.trim() || null,
  };
}
