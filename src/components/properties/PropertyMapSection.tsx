"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import MapContainer from "@/components/ui/MapContainer";
import {
  buildPropertyGeocodingQuery,
  buildPropertyLocationLabel,
  geocodePropertyLocation,
} from "@/lib/maptiler";

interface PropertyMapSectionProps {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  description?: string;
  height?: string;
  compact?: boolean;
  popupTitle?: string;
  popupSubtitle?: string;
  popupImageUrl?: string | null;
  openPopupOnLoad?: boolean;
}

function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export default function PropertyMapSection({
  address,
  neighborhood,
  city,
  postalCode,
  country,
  latitude,
  longitude,
  title = "Localisation",
  description = "Repérez le bien sur la carte et ouvrez la localisation détaillée si besoin.",
  height = "280px",
  compact = false,
  popupTitle,
  popupSubtitle,
  popupImageUrl,
  openPopupOnLoad = false,
}: PropertyMapSectionProps) {
  const locationInput = useMemo(
    () => ({ address, neighborhood, city, postalCode, country }),
    [address, neighborhood, city, postalCode, country]
  );
  const fallbackLabel = useMemo(
    () => buildPropertyLocationLabel(locationInput),
    [locationInput]
  );
  const searchQuery = useMemo(
    () => buildPropertyGeocodingQuery(locationInput),
    [locationInput]
  );
  const hasSavedCoordinates = isValidCoordinate(latitude) && isValidCoordinate(longitude);
  const directLocation = hasSavedCoordinates
    ? {
        lat: latitude,
        lng: longitude,
        placeName: fallbackLabel,
        approximate: false,
      }
    : null;
  const [resolvedLocation, setResolvedLocation] = useState<{
    lat: number;
    lng: number;
    placeName: string | null;
    approximate: boolean;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (hasSavedCoordinates) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!searchQuery) {
        if (!cancelled) {
          setResolvedLocation(null);
          setStatus("error");
        }
        return;
      }

      setStatus("loading");

      void geocodePropertyLocation(locationInput)
        .then((match) => {
          if (cancelled) return;

          if (!match) {
            setResolvedLocation(null);
            setStatus("error");
            return;
          }

          setResolvedLocation({
            lat: match.lat,
            lng: match.lng,
            placeName: match.placeName || fallbackLabel,
            approximate: true,
          });
          setStatus("ready");
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedLocation(null);
            setStatus("error");
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fallbackLabel, hasSavedCoordinates, latitude, locationInput, longitude, searchQuery]);

  const activeLocation = directLocation ?? resolvedLocation;
  const activeStatus = directLocation ? "ready" : status;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="!text-lg sm:!text-xl font-semibold text-[#0f1724]">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {activeLocation?.approximate ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#e8b86d]/35 bg-[#e8b86d]/10 px-3 py-1 text-xs font-semibold text-[#9a6d28]">
            <MapPin className="h-3.5 w-3.5" />
            Position indicative
          </span>
        ) : activeLocation ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 px-3 py-1 text-xs font-semibold text-[#1a3a5c]">
            Coordonnées GPS
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {activeLocation ? (
          <>
            <MapContainer
              lat={activeLocation.lat}
              lng={activeLocation.lng}
              label={activeLocation.placeName || fallbackLabel}
              zoom={15}
              height={height}
              popupTitle={popupTitle}
              popupSubtitle={popupSubtitle || activeLocation.placeName || fallbackLabel}
              popupImageUrl={popupImageUrl}
              openPopupOnLoad={openPopupOnLoad}
            />
            {!compact && (
              <p className="mt-3 text-xs text-gray-500">
                {activeLocation.approximate
                  ? "La carte est centrée automatiquement à partir de l'adresse renseignée. Ajoutez des coordonnées GPS précises dans l'annonce pour un point exact."
                  : "La carte utilise les coordonnées GPS enregistrées pour cette annonce."}
              </p>
            )}
          </>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] px-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#0f1724]">
                {activeStatus === "loading" ? "Recherche de la localisation..." : "Carte indisponible pour cette annonce"}
              </p>
              <p className="text-xs leading-6 text-gray-500">
                {activeStatus === "loading"
                  ? "Nous essayons de retrouver le bien à partir de son adresse."
                  : "Renseignez au minimum la ville ou des coordonnées GPS pour afficher une carte."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
