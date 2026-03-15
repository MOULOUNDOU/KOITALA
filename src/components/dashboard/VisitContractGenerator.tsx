"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BadgeCheck, ChevronDown, ChevronUp, FileDown, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import CheckboxChoiceGroup from "@/components/ui/CheckboxChoiceGroup";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { AGENCY_INFO } from "@/lib/agency";
import { generateHousingContractPdf } from "@/lib/contracts/generateHousingContractPdf";

type ContractProperty = {
  title: string;
  city: string | null;
  slug: string | null;
  address: string | null;
  neighborhood: string | null;
  listing_type: "vente" | "location" | null;
  price: number | null;
  rent_payment_period: "jour" | "mois" | null;
};

type ContractVisit = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  property: ContractProperty | ContractProperty[] | null;
};

interface VisitContractGeneratorProps {
  visit: ContractVisit;
}

interface ContractFormState {
  contractReference: string;
  tenantName: string;
  tenantSex: string;
  tenantProfession: string;
  tenantNationality: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  contractDate: string;
  startDate: string;
  durationMonths: string;
  monthlyRent: string;
  securityDeposit: string;
  representativeName: string;
  specialClauses: string;
}

const CLIENT_SEX_OPTIONS = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];

const CLIENT_PROFESSION_OPTIONS = [
  { value: "etudiant", label: "Etudiant(e)" },
  { value: "travailleur", label: "Travailleur(se)" },
];

function pickProperty(property: ContractProperty | ContractProperty[] | null | undefined): ContractProperty | null {
  if (Array.isArray(property)) return property[0] ?? null;
  return property ?? null;
}

function sanitizeMoney(value: string): number {
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  return Number(normalized);
}

export default function VisitContractGenerator({ visit }: VisitContractGeneratorProps) {
  const property = pickProperty(visit.property);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const initialForm = useMemo<ContractFormState>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const currentYear = new Date().getUTCFullYear();
    const propertyAddress = [property?.address, property?.neighborhood, property?.city]
      .filter(Boolean)
      .join(", ");

    return {
      contractReference: `KT-${visit.id.slice(0, 8).toUpperCase()}-${currentYear}`,
      tenantName: visit.full_name,
      tenantSex: "",
      tenantProfession: "",
      tenantNationality: "",
      tenantEmail: visit.email,
      tenantPhone: visit.phone ?? "",
      propertyTitle: property?.title ?? "Logement a completer",
      propertyAddress: propertyAddress || property?.city || "",
      contractDate: today,
      startDate: visit.preferred_date ?? today,
      durationMonths: "12",
      monthlyRent: property?.price ? String(Math.round(property.price)) : "",
      securityDeposit: property?.price ? String(Math.round(property.price)) : "",
      representativeName: AGENCY_INFO.defaultRepresentative,
      specialClauses:
        "Ce modele est fourni a titre de base de travail. Les parties doivent verifier les montants, les dates, l'etat des lieux et toute clause specifique avant signature definitive.",
    };
  }, [property, visit.email, visit.full_name, visit.id, visit.phone, visit.preferred_date]);

  const [form, setForm] = useState<ContractFormState>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const isEligible = property?.listing_type === "location";

  const updateField = <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!property) {
      toast.error("Impossible de generer un contrat sans bien associe.");
      return;
    }

    const monthlyRent = sanitizeMoney(form.monthlyRent);
    const securityDeposit = sanitizeMoney(form.securityDeposit);
    const durationMonths = Number(form.durationMonths);

    if (!form.tenantName.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    if (!form.propertyAddress.trim()) {
      toast.error("L'adresse du logement est requise.");
      return;
    }
    if (!form.tenantSex.trim()) {
      toast.error("Le sexe du client est requis.");
      return;
    }
    if (!form.tenantProfession.trim()) {
      toast.error("La profession du client est requise.");
      return;
    }
    if (!form.tenantNationality.trim()) {
      toast.error("La nationalite du client est requise.");
      return;
    }
    if (!form.startDate) {
      toast.error("La date de prise d'effet est requise.");
      return;
    }
    if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
      toast.error("La duree du contrat doit etre valide.");
      return;
    }
    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      toast.error("Le montant du loyer doit etre valide.");
      return;
    }
    if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
      toast.error("Le depot de garantie doit etre valide.");
      return;
    }

    setIsGenerating(true);
    try {
      await generateHousingContractPdf({
        contractReference: form.contractReference.trim(),
        tenantName: form.tenantName.trim(),
        tenantSex: form.tenantSex.trim(),
        tenantProfession: form.tenantProfession.trim(),
        tenantNationality: form.tenantNationality.trim(),
        tenantEmail: form.tenantEmail.trim(),
        tenantPhone: form.tenantPhone.trim(),
        propertyTitle: form.propertyTitle.trim(),
        propertyAddress: form.propertyAddress.trim(),
        contractDate: form.contractDate,
        startDate: form.startDate,
        durationMonths,
        monthlyRent,
        securityDeposit,
        paymentFrequency: property.rent_payment_period ?? "mois",
        representativeName: form.representativeName.trim() || AGENCY_INFO.defaultRepresentative,
        specialClauses: form.specialClauses.trim(),
      });
      toast.success("Le contrat PDF a ete genere.");
    } catch {
      toast.error("La generation du contrat a echoue.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!property) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
        Aucun contrat possible: le bien associe est introuvable.
      </div>
    );
  }

  if (!isEligible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#1a3a5c]/10 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a3a5c]">
          <FileText className="h-4 w-4" />
          Contrat de logement PDF
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="mb-4 rounded-2xl border border-[#e8b86d]/35 bg-[#fffaf2] px-4 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a3a5c]">
              <BadgeCheck className="h-4 w-4" />
              Modele KOITALA a relire avant signature
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              Le PDF inclut le logo, le nom de l'agence, le telephone et l'email. Ajustez les montants et les clauses avant generation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Reference contrat"
              value={form.contractReference}
              onChange={(event) => updateField("contractReference", event.target.value)}
            />
            <Input
              label="Representant agence"
              value={form.representativeName}
              onChange={(event) => updateField("representativeName", event.target.value)}
            />
            <Input
              label="Nom du client"
              value={form.tenantName}
              onChange={(event) => updateField("tenantName", event.target.value)}
            />
            <div className="sm:col-span-2">
              <CheckboxChoiceGroup
                label="Sexe du client"
                value={form.tenantSex}
                onChange={(value) => updateField("tenantSex", value)}
                options={CLIENT_SEX_OPTIONS}
              />
            </div>
            <div className="sm:col-span-2">
              <CheckboxChoiceGroup
                label="Profession du client"
                value={form.tenantProfession}
                onChange={(value) => updateField("tenantProfession", value)}
                options={CLIENT_PROFESSION_OPTIONS}
              />
            </div>
            <Input
              label="Email du client"
              type="email"
              value={form.tenantEmail}
              onChange={(event) => updateField("tenantEmail", event.target.value)}
            />
            <Input
              label="Nationalite du client"
              value={form.tenantNationality}
              onChange={(event) => updateField("tenantNationality", event.target.value)}
            />
            <Input
              label="Telephone du client"
              value={form.tenantPhone}
              onChange={(event) => updateField("tenantPhone", event.target.value)}
            />
            <Input
              label="Date du contrat"
              type="date"
              value={form.contractDate}
              onChange={(event) => updateField("contractDate", event.target.value)}
            />
            <Input
              label="Prise d'effet"
              type="date"
              value={form.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
            />
            <Input
              label="Duree (mois)"
              type="number"
              min="1"
              value={form.durationMonths}
              onChange={(event) => updateField("durationMonths", event.target.value)}
            />
            <Input
              label="Loyer"
              inputMode="numeric"
              value={form.monthlyRent}
              onChange={(event) => updateField("monthlyRent", event.target.value)}
            />
            <Input
              label="Depot de garantie"
              inputMode="numeric"
              value={form.securityDeposit}
              onChange={(event) => updateField("securityDeposit", event.target.value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <Input
              label="Intitule du logement"
              value={form.propertyTitle}
              onChange={(event) => updateField("propertyTitle", event.target.value)}
            />
            <Input
              label="Adresse du logement"
              value={form.propertyAddress}
              onChange={(event) => updateField("propertyAddress", event.target.value)}
            />
            <Textarea
              label="Clauses particulieres"
              value={form.specialClauses}
              onChange={(event) => updateField("specialClauses", event.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Document genere avec {AGENCY_INFO.name}, {AGENCY_INFO.phone}, {AGENCY_INFO.email} et le logo agence.
            </p>
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              loading={isGenerating}
              className="w-full sm:w-auto"
            >
              <FileDown className="h-4 w-4" />
              Generer le PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
