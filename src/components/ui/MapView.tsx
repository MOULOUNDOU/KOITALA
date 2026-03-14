"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { MapPin, ExternalLink } from "lucide-react";

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

export default function MapView({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
  label = "KOITALA – Mamelles Aviation, Dakar",
  zoom = 15,
  height = "360px",
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;

      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      mapRef.current = map;

      /* CartoDB Positron — clean, light, professional */
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        }
      ).addTo(map);

      /* Custom styled marker */
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:44px; height:44px;
            background:#1a3a5c;
            border:3px solid #e8b86d;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 4px 16px rgba(26,58,92,0.35);
            display:flex; align-items:center; justify-content:center;
          ">
            <div style="
              transform:rotate(45deg);
              color:#e8b86d;
              font-size:18px;
              line-height:1;
              margin-top:2px;
            ">⌂</div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -48],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:system-ui;padding:4px 2px">
             <strong style="color:#1a3a5c;font-size:13px">${label}</strong>
           </div>`,
          { closeButton: false, className: "koitala-popup" }
        )
        .openPopup();
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, zoom, label]);

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${className}`} style={{ height }}>
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Attribution + open in maps button */}
      <div className="absolute bottom-3 right-3 z-[1000]">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1a3a5c] text-xs font-semibold rounded-xl shadow-md hover:bg-[#1a3a5c] hover:text-white transition-all duration-200 border border-gray-100"
        >
          <ExternalLink className="w-3 h-3" />
          Ouvrir dans Google Maps
        </a>
      </div>

      {/* Address badge */}
      <div className="absolute top-3 left-3 z-[1000]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm text-[#1a3a5c] text-xs font-medium rounded-xl shadow-sm border border-gray-100">
          <MapPin className="w-3 h-3 text-[#e8b86d] shrink-0" />
          {label}
        </div>
      </div>
    </div>
  );
}
