import { NextRequest, NextResponse } from "next/server";
import {
  extractGoogleMapsCoordinates,
  isGoogleMapsLikeUrl,
} from "@/lib/googleMaps";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { value?: string } | null;
    const rawValue = body?.value?.trim() ?? "";

    if (!rawValue) {
      return NextResponse.json({ error: "Lien Google Maps manquant." }, { status: 400 });
    }

    const directMatch = extractGoogleMapsCoordinates(rawValue);
    if (directMatch) {
      return NextResponse.json(directMatch);
    }

    if (!isGoogleMapsLikeUrl(rawValue)) {
      return NextResponse.json(
        { error: "Collez un lien Google Maps ou des coordonnées latitude,longitude." },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(rawValue, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "KOITALA/1.0 (+https://koitala.com)",
        },
      });

      const resolvedMatch = extractGoogleMapsCoordinates(response.url);

      if (!resolvedMatch) {
        return NextResponse.json(
          { error: "Impossible d'extraire les coordonnées depuis ce lien Google Maps." },
          { status: 422 }
        );
      }

      return NextResponse.json(resolvedMatch);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json(
      { error: "Impossible de résoudre ce lien Google Maps." },
      { status: 500 }
    );
  }
}
