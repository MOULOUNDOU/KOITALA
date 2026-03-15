"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";

interface MapViewProps {
  lat?: number;
  lng?: number;
  label?: string;
  zoom?: number;
  height?: string;
  className?: string;
}

const DEFAULT_LAT = 14.7247;
const DEFAULT_LNG = -17.4952;
const GOOGLE_MAPS_SCRIPT_ID = "koitala-google-maps-script";

declare global {
  interface Window {
    google?: {
      maps?: any;
    };
    __koitalaGoogleMapsPromise?: Promise<any>;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadGoogleMapsApi(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("google-maps-client-only"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__koitalaGoogleMapsPromise) {
    return window.__koitalaGoogleMapsPromise;
  }

  window.__koitalaGoogleMapsPromise = new Promise((resolve, reject) => {
    const onReady = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }
      reject(new Error("google-maps-unavailable"));
    };

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", onReady, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("google-maps-script-error")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=fr`;
    script.onload = onReady;
    script.onerror = () => reject(new Error("google-maps-script-error"));
    document.head.appendChild(script);
  });

  return window.__koitalaGoogleMapsPromise;
}

export default function MapView({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  label = "KOITALA – Mamelles Aviation, Dakar",
  zoom = 15,
  height = "360px",
  className = "",
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing_key" | "error">("loading");

  const mapsUrl = useMemo(() => `https://www.google.com/maps?q=${lat},${lng}`,
    [lat, lng]
  );

  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setStatus("missing_key");
      return;
    }

    if (!containerRef.current) return;

    setStatus("loading");

    void loadGoogleMapsApi(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const center = { lat, lng };
        const popupContent = `
          <div style="font-family:Arial,sans-serif;padding:6px 8px;min-width:160px">
            <div style="font-size:13px;font-weight:700;color:#1a3a5c;line-height:1.4">${escapeHtml(label)}</div>
          </div>
        `;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center,
            zoom,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: "cooperative",
            styles: [
              {
                featureType: "poi",
                stylers: [{ visibility: "off" }],
              },
            ],
          });

          markerRef.current = new maps.Marker({
            map: mapRef.current,
            position: center,
            title: label,
            animation: maps.Animation.DROP,
          });

          infoWindowRef.current = new maps.InfoWindow({
            content: popupContent,
          });

          markerRef.current.addListener("click", () => {
            infoWindowRef.current?.open({
              anchor: markerRef.current,
              map: mapRef.current,
            });
          });

          infoWindowRef.current.open({
            anchor: markerRef.current,
            map: mapRef.current,
          });
        }

        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);
        markerRef.current?.setPosition(center);
        markerRef.current?.setTitle(label);
        infoWindowRef.current?.setContent(popupContent);

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, label, lat, lng, zoom]);

  useEffect(() => {
    return () => {
      markerRef.current?.setMap?.(null);
      markerRef.current = null;
      infoWindowRef.current?.close?.();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, []);

  const showFallback = status === "missing_key" || status === "error";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm ${className}`}
      style={{ height }}
    >
      {showFallback ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-[#0f1724]">
              {status === "missing_key" ? "Google Maps n'est pas encore active" : "La carte Google Maps n'a pas pu etre chargee"}
            </p>
            <p className="max-w-md text-sm leading-6 text-gray-600">
              {status === "missing_key"
                ? "Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans l'environnement pour afficher une vraie carte Google Maps interactive."
                : "Verifiez la cle Google Maps, les restrictions de domaine et l'activation de l'API JavaScript Maps dans Google Cloud."}
            </p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0f2540]"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir dans Google Maps
          </a>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="h-full w-full" />

          <div className="absolute bottom-3 right-3 z-[1000]">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#1a3a5c] shadow-md transition-all duration-200 hover:bg-[#1a3a5c] hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
              Ouvrir dans Google Maps
            </a>
          </div>

          <div className="absolute left-3 top-3 z-[1000]">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1a3a5c] shadow-sm backdrop-blur-sm">
              <MapPin className="h-3 w-3 shrink-0 text-[#e8b86d]" />
              {label}
            </div>
          </div>

          {status === "loading" && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
                <span className="text-sm font-medium text-[#1a3a5c]">Chargement de Google Maps...</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
