"use client";

import { Mail, Phone } from "lucide-react";
import { AGENCY_INFO } from "@/lib/agency";

interface ContactPropertyFormProps {
  propertyId?: string;
}

export default function ContactPropertyForm({ propertyId }: ContactPropertyFormProps) {
  void propertyId;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#0f1724]">Messagerie désactivée</h3>
        <p className="mt-1 text-sm text-gray-500">
          Le système de messages est indisponible sur la plateforme.
        </p>
      </div>

      <div className="space-y-3">
        <a
          href={`tel:${AGENCY_INFO.phone.replace(/\s+/g, "")}`}
          className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50"
        >
          <Phone className="h-4 w-4" />
          {AGENCY_INFO.phone}
        </a>
        <a
          href={`mailto:${AGENCY_INFO.email}`}
          className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50"
        >
          <Mail className="h-4 w-4" />
          {AGENCY_INFO.email}
        </a>
      </div>
    </div>
  );
}
