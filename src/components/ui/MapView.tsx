"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { MapContainer as LeafletMap, Marker, Popup, TileLayer, ZoomControl } from "react-leaflet";
import { cn } from "@/lib/utils";
import {
  getGoogleMapsDirectionsUrl,
  getMapTilerAttribution,
  getMapTilerStyleId,
  getMapTilerTileUrl,
  getOpenStreetMapPlaceUrl,
} from "@/lib/maptiler";

interface MapViewProps {
  lat?: number;
  lng?: number;
  label?: string;
  zoom?: number;
  height?: string;
  className?: string;
  popupTitle?: string;
  popupSubtitle?: string;
  popupImageUrl?: string | null;
  openPopupOnLoad?: boolean;
}

const DEFAULT_LAT = 14.7247;
const DEFAULT_LNG = -17.4952;

export default function MapView({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  label = "KOITALA – Mamelles Aviation, Dakar",
  zoom = 15,
  height = "360px",
  className = "",
  popupTitle,
  popupSubtitle,
  popupImageUrl,
  openPopupOnLoad = false,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ?? "";
  const styleId = useMemo(() => getMapTilerStyleId(), []);
  const tileUrl = useMemo(
    () => (apiKey ? getMapTilerTileUrl(apiKey, styleId) : ""),
    [apiKey, styleId]
  );
  const openStreetMapUrl = useMemo(
    () => getOpenStreetMapPlaceUrl(lat, lng, zoom),
    [lat, lng, zoom]
  );
  const directionsUrl = useMemo(
    () => getGoogleMapsDirectionsUrl(lat, lng),
    [lat, lng]
  );
  const [tileLoadCount, setTileLoadCount] = useState(0);
  const [tileErrorCount, setTileErrorCount] = useState(0);
  const tileKey = tileUrl || "missing-key";
  const showFallback = !tileUrl || (tileLoadCount === 0 && tileErrorCount >= 4);
  const markerRef = useRef<LeafletMarker | null>(null);
  const markerIcon = useMemo(
    () =>
      divIcon({
        className: "koitala-map-marker",
        html: `
          <div style="position:relative;width:32px;height:32px;">
            <div style="position:absolute;inset:0;border-radius:9999px;background:#1a3a5c;border:3px solid rgba(255,255,255,0.95);box-shadow:0 10px 24px rgba(15,23,36,0.24);"></div>
            <div style="position:absolute;left:50%;top:50%;width:10px;height:10px;border-radius:9999px;background:#e8b86d;transform:translate(-50%,-50%);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      }),
    []
  );

  useEffect(() => {
    if (!openPopupOnLoad) return;

    const timer = window.setTimeout(() => {
      markerRef.current?.openPopup();
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [label, lat, lng, openPopupOnLoad, popupImageUrl, popupSubtitle, popupTitle]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm",
        className
      )}
      style={{ height }}
    >
      {showFallback ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3f8_100%)] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-[#0f1724]">
              {!tileUrl ? "MapTiler n'est pas encore configure" : "La carte MapTiler n'a pas pu etre chargee"}
            </p>
            <p className="max-w-md text-sm leading-6 text-gray-600">
              {!tileUrl
                ? "Ajoutez NEXT_PUBLIC_MAPTILER_API_KEY dans l'environnement pour afficher la carte interactive MapTiler."
                : `Verifiez la cle MapTiler, le style "${styleId}" et les restrictions eventuelles sur votre cle.`}
            </p>
          </div>
          <a
            href={openStreetMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0f2540]"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir la localisation
          </a>
        </div>
      ) : (
        <>
          <LeafletMap
            center={[lat, lng]}
            zoom={zoom}
            className="h-full w-full"
            scrollWheelZoom={false}
            zoomControl={false}
          >
            <TileLayer
              key={tileKey}
              attribution={getMapTilerAttribution()}
              url={tileUrl}
              eventHandlers={{
                tileload: () => setTileLoadCount((current) => current + 1),
                tileerror: () => setTileErrorCount((current) => current + 1),
              }}
            />
            <ZoomControl position="bottomright" />
            <Marker position={[lat, lng]} icon={markerIcon} ref={markerRef}>
              <Popup autoPan>
                <div className="w-[180px] overflow-hidden rounded-2xl">
                  {popupImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={popupImageUrl}
                        alt={popupTitle || label}
                        className="h-24 w-full rounded-xl object-cover"
                      />
                    </>
                  ) : null}
                  <div className={cn("space-y-1", popupImageUrl ? "pt-2" : "")}>
                    <p className="text-sm font-bold leading-5 text-[#0f1724]">
                      {popupTitle || label}
                    </p>
                    <p className="text-xs leading-5 text-gray-500">
                      {popupSubtitle || label}
                    </p>
                  </div>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold !text-white no-underline transition-colors hover:bg-[#0f2540] hover:!text-white"
                  >
                    Y aller
                  </a>
                </div>
              </Popup>
            </Marker>
          </LeafletMap>

          <div className="absolute bottom-3 right-3 z-[1000] flex flex-col items-end gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#0f2540]"
            >
              <ExternalLink className="h-3 w-3" />
              Itinéraire
            </a>
            <a
              href={openStreetMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#1a3a5c] shadow-md transition-all duration-200 hover:bg-[#1a3a5c] hover:text-white"
            >
              <ExternalLink className="h-3 w-3" />
              Ouvrir la carte
            </a>
          </div>

          <div className="absolute left-3 top-3 z-[1000]">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white/95 px-3 py-1.5 text-xs font-medium text-[#1a3a5c] shadow-sm backdrop-blur-sm">
              <MapPin className="h-3 w-3 shrink-0 text-[#e8b86d]" />
              {label}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
