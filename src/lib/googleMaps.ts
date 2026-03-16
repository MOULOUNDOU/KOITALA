export interface GoogleMapsCoordinates {
  lat: number;
  lng: number;
}

function isValidCoordinatePair(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function toCoordinatePair(latValue: string, lngValue: string): GoogleMapsCoordinates | null {
  const lat = Number(latValue);
  const lng = Number(lngValue);
  return isValidCoordinatePair(lat, lng) ? { lat, lng } : null;
}

function parseCoordinateText(value: string): GoogleMapsCoordinates | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const coordinateMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!coordinateMatch) {
    return null;
  }

  return toCoordinatePair(coordinateMatch[1], coordinateMatch[2]);
}

function parseCoordinatesFromUrl(url: URL): GoogleMapsCoordinates | null {
  const atMatch = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return toCoordinatePair(atMatch[1], atMatch[2]);
  }

  const placeMatch = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    return toCoordinatePair(placeMatch[1], placeMatch[2]);
  }

  const queryKeys = ["q", "query", "ll", "sll", "center", "destination", "daddr"];
  for (const key of queryKeys) {
    const value = url.searchParams.get(key);
    if (!value) continue;

    const coordinates = parseCoordinateText(value);
    if (coordinates) {
      return coordinates;
    }
  }

  return null;
}

export function isGoogleMapsLikeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      host === "google.com" ||
      host === "www.google.com" ||
      host === "maps.google.com" ||
      host.endsWith(".google.com")
    );
  } catch {
    return false;
  }
}

export function extractGoogleMapsCoordinates(value: string): GoogleMapsCoordinates | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const directCoordinates = parseCoordinateText(trimmedValue);
  if (directCoordinates) {
    return directCoordinates;
  }

  try {
    const url = new URL(trimmedValue);
    return parseCoordinatesFromUrl(url);
  } catch {
    return null;
  }
}
