"use client";

import { useState } from "react";
import { Link2, LocateFixed } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { extractGoogleMapsCoordinates } from "@/lib/googleMaps";

interface GoogleMapsLocationFieldProps {
  onResolved: (coords: { lat: number; lng: number }) => void;
}

export default function GoogleMapsLocationField({
  onResolved,
}: GoogleMapsLocationFieldProps) {
  const [value, setValue] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      toast.error("Collez un lien Google Maps ou des coordonnées.");
      return;
    }

    const directMatch = extractGoogleMapsCoordinates(trimmedValue);
    if (directMatch) {
      onResolved(directMatch);
      toast.success("Coordonnées importées depuis Google Maps.");
      return;
    }

    setResolving(true);

    const response = await fetch("/api/maps/google-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: trimmedValue }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { lat?: number; lng?: number; error?: string }
      | null;

    setResolving(false);

    if (!response.ok || typeof payload?.lat !== "number" || typeof payload?.lng !== "number") {
      toast.error(payload?.error ?? "Impossible de lire ce lien Google Maps.");
      return;
    }

    onResolved({ lat: payload.lat, lng: payload.lng });
    toast.success("Position Google Maps importée.");
  };

  return (
    <div className="rounded-2xl border border-dashed border-[#1a3a5c]/18 bg-[#f8fafc] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
          <LocateFixed className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0f1724]">
            Importer l&apos;emplacement depuis Google Maps
          </p>
          <p className="mt-1 text-xs leading-6 text-gray-500">
            Collez un lien Google Maps partagé ou des coordonnées `latitude,longitude` pour récupérer la position exacte du marker.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://maps.app.goo.gl/... ou 14.7167,-17.4677"
          icon={<Link2 className="h-4 w-4" />}
        />
        <Button
          type="button"
          loading={resolving}
          onClick={() => void handleResolve()}
          className="w-full sm:w-auto"
        >
          Importer
        </Button>
      </div>
    </div>
  );
}
