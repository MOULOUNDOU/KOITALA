"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  FileDown,
  FileText,
  MapPinHouse,
  RotateCcw,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CheckboxChoiceGroup from "@/components/ui/CheckboxChoiceGroup";
import CustomSelect, { type SelectGroup } from "@/components/ui/CustomSelect";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { AGENCY_INFO } from "@/lib/agency";
import { generateHousingContractPdf } from "@/lib/contracts/generateHousingContractPdf";

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
  paymentFrequency: "jour" | "mois";
  representativeName: string;
  specialClauses: string;
}

const TOTAL_STEPS = 4;
const FORM_MOBILE_BUTTON_CLASS = "h-11 min-w-0 flex-1 text-sm sm:flex-none";
const HERO_FORM_SELECT_LABEL_CLASS = "text-sm font-medium text-gray-700 normal-case tracking-normal mb-1.5";
const HERO_FORM_SELECT_TRIGGER_CLASS = "py-3.5";
const HERO_FORM_SELECT_DROPDOWN_CLASS = "rounded-2xl border border-gray-100 shadow-2xl";

const CLIENT_SEX_OPTIONS = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
];

const CLIENT_PROFESSION_OPTIONS = [
  { value: "etudiant", label: "Etudiant(e)" },
  { value: "travailleur", label: "Travailleur(se)" },
];

const CONTRACT_PROPERTY_CATEGORY_GROUPS: SelectGroup[] = [
  {
    group: "Habitation",
    options: [
      { value: "Appartement", label: "Appartement" },
      { value: "Maison", label: "Maison" },
      { value: "Villa", label: "Villa" },
      { value: "Duplex", label: "Duplex" },
      { value: "Studio", label: "Studio" },
      { value: "Mini studio", label: "Mini studio" },
      { value: "Chambre meublee", label: "Chambre meublee" },
      { value: "Colocation", label: "Colocation" },
    ],
  },
  {
    group: "Professionnel",
    options: [
      { value: "Bureau", label: "Bureau" },
      { value: "Local commercial", label: "Local commercial" },
    ],
  },
  {
    group: "Foncier",
    options: [{ value: "Terrain", label: "Terrain" }],
  },
];

const DAKAR_NEIGHBORHOOD_GROUPS: SelectGroup[] = [
  {
    group: "Centre",
    options: [
      { value: "Plateau", label: "Plateau" },
      { value: "Medina", label: "Medina" },
      { value: "Bel Air", label: "Bel Air" },
      { value: "Corniche", label: "Corniche" },
      { value: "Gueule Tapee", label: "Gueule Tapee" },
      { value: "Fass", label: "Fass" },
      { value: "Colobane", label: "Colobane" },
    ],
  },
  {
    group: "Fann / Mermoz / Liberte",
    options: [
      { value: "Point E", label: "Point E" },
      { value: "Fann-Residence", label: "Fann-Residence" },
      { value: "Mermoz", label: "Mermoz" },
      { value: "Sacre-Coeur", label: "Sacre-Coeur" },
      { value: "Liberte", label: "Liberte" },
      { value: "Amitie", label: "Amitie" },
      { value: "Sicap", label: "Sicap" },
      { value: "HLM", label: "HLM" },
      { value: "Dieuppeul", label: "Dieuppeul" },
      { value: "Patte d'Oie", label: "Patte d'Oie" },
      { value: "Cite Keur Gorgui", label: "Cite Keur Gorgui" },
      { value: "Castors", label: "Castors" },
      { value: "Grand Dakar", label: "Grand Dakar" },
    ],
  },
  {
    group: "Ouest / Corniche",
    options: [
      { value: "Almadies", label: "Almadies" },
      { value: "Ngor", label: "Ngor" },
      { value: "Yoff", label: "Yoff" },
      { value: "Ouakam", label: "Ouakam" },
      { value: "Les Mamelles", label: "Les Mamelles" },
      { value: "Ouest Foire", label: "Ouest Foire" },
      { value: "Nord Foire", label: "Nord Foire" },
    ],
  },
  {
    group: "Nord / Est",
    options: [
      { value: "Grand Yoff", label: "Grand Yoff" },
      { value: "Cambere", label: "Cambere" },
      { value: "Hann Mariste", label: "Hann Mariste" },
      { value: "Parcelles Assainies", label: "Parcelles Assainies" },
      { value: "Guediawaye", label: "Guediawaye" },
      { value: "Pikine", label: "Pikine" },
      { value: "Keur Massar", label: "Keur Massar" },
    ],
  },
];

const STEPS = [
  {
    id: 1,
    label: "Client",
    title: "Informations client",
    description: "Renseignez l'identite du locataire et la reference du contrat.",
    icon: UserRound,
  },
  {
    id: 2,
    label: "Logement",
    title: "Informations logement",
    description: "",
    icon: Building2,
  },
  {
    id: 3,
    label: "Conditions",
    title: "Conditions du contrat",
    description: "Saisissez les dates, la duree et les montants du contrat.",
    icon: CalendarCheck,
  },
  {
    id: 4,
    label: "Validation",
    title: "Validation et export",
    description: "Relisez le dossier puis generez le PDF KOITALA.",
    icon: FileText,
  },
] as const;

const REQUIRED_FIELDS: Array<keyof ContractFormState> = [
  "contractReference",
  "tenantName",
  "tenantSex",
  "tenantProfession",
  "tenantNationality",
  "propertyTitle",
  "propertyAddress",
  "contractDate",
  "startDate",
  "durationMonths",
  "monthlyRent",
  "securityDeposit",
  "representativeName",
];

function getInitialForm(): ContractFormState {
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getUTCFullYear();

  return {
    contractReference: `KT-MANUEL-${currentYear}`,
    tenantName: "",
    tenantSex: "",
    tenantProfession: "",
    tenantNationality: "",
    tenantEmail: "",
    tenantPhone: "",
    propertyTitle: "",
    propertyAddress: "",
    contractDate: today,
    startDate: today,
    durationMonths: "12",
    monthlyRent: "",
    securityDeposit: "",
    paymentFrequency: "mois",
    representativeName: AGENCY_INFO.defaultRepresentative,
    specialClauses:
      "Ce modele doit etre relu, adapte au dossier et valide avant signature definitive par l'agence et le client.",
  };
}

function sanitizeMoney(value: string): number {
  const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
  return Number(normalized);
}

function formatMoneyDisplay(value: string) {
  const amount = sanitizeMoney(value);
  if (!Number.isFinite(amount) || amount <= 0) return value;
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

function formatPaymentFrequencyLabel(value: "jour" | "mois") {
  return value === "jour" ? "par jour" : "par mois";
}

function formatSexLabel(value: string) {
  if (value === "homme") return "Homme";
  if (value === "femme") return "Femme";
  return value;
}

function formatProfessionLabel(value: string) {
  if (value === "etudiant") return "Etudiant(e)";
  if (value === "travailleur") return "Travailleur(se)";
  return value;
}

export default function ContratsPage() {
  const [form, setForm] = useState<ContractFormState>(() => getInitialForm());
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">("forward");

  const completion = useMemo(() => {
    const completed = REQUIRED_FIELDS.filter((field) => String(form[field] ?? "").trim().length > 0).length;
    return Math.round((completed / REQUIRED_FIELDS.length) * 100);
  }, [form]);

  const progressPercent = (step / TOTAL_STEPS) * 100;
  const stepTransitionClass = stepDirection === "forward" ? "anim-slide-right" : "anim-slide-left";
  const currentStep = STEPS.find((item) => item.id === step) ?? STEPS[0];

  const updateField = <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(getInitialForm());
    setStepDirection("backward");
    setStep(1);
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!form.contractReference.trim()) {
        toast.error("La reference du contrat est requise.");
        return false;
      }
      if (!form.representativeName.trim()) {
        toast.error("Le representant de l'agence est requis.");
        return false;
      }
      if (!form.tenantName.trim()) {
        toast.error("Le nom du client est requis.");
        return false;
      }
      if (!form.tenantSex.trim()) {
        toast.error("Le sexe du client est requis.");
        return false;
      }
      if (!form.tenantProfession.trim()) {
        toast.error("La profession du client est requise.");
        return false;
      }
      if (!form.tenantNationality.trim()) {
        toast.error("La nationalite du client est requise.");
        return false;
      }
    }

    if (step === 2) {
      if (!form.propertyTitle.trim()) {
        toast.error("L'intitule du logement est requis.");
        return false;
      }
      if (!form.propertyAddress.trim()) {
        toast.error("L'adresse du logement est requise.");
        return false;
      }
    }

    if (step === 3) {
      const durationMonths = Number(form.durationMonths);
      const monthlyRent = sanitizeMoney(form.monthlyRent);
      const securityDeposit = sanitizeMoney(form.securityDeposit);

      if (!form.contractDate || !form.startDate) {
        toast.error("Les dates du contrat sont requises.");
        return false;
      }
      if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
        toast.error("La duree du contrat doit etre valide.");
        return false;
      }
      if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
        toast.error("Le montant du loyer doit etre valide.");
        return false;
      }
      if (!Number.isFinite(securityDeposit) || securityDeposit < 0) {
        toast.error("Le depot de garantie doit etre valide.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    setStepDirection("forward");
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const prevStep = () => {
    setStepDirection("backward");
    setStep((current) => Math.max(1, current - 1));
  };

  const handleGenerate = async () => {
    const monthlyRent = sanitizeMoney(form.monthlyRent);
    const securityDeposit = sanitizeMoney(form.securityDeposit);
    const durationMonths = Number(form.durationMonths);

    if (!form.tenantName.trim()) {
      toast.error("Le nom du client est requis.");
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
    if (!form.propertyTitle.trim()) {
      toast.error("L'intitule du logement est requis.");
      return;
    }
    if (!form.propertyAddress.trim()) {
      toast.error("L'adresse du logement est requise.");
      return;
    }
    if (!form.contractDate || !form.startDate) {
      toast.error("Les dates du contrat sont requises.");
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
        paymentFrequency: form.paymentFrequency,
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

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${stepTransitionClass}`}>
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
            label="Nationalite du client"
            value={form.tenantNationality}
            onChange={(event) => updateField("tenantNationality", event.target.value)}
          />
          <Input
            label="Email du client"
            type="email"
            value={form.tenantEmail}
            onChange={(event) => updateField("tenantEmail", event.target.value)}
          />
          <Input
            label="Telephone du client"
            value={form.tenantPhone}
            onChange={(event) => updateField("tenantPhone", event.target.value)}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className={`grid grid-cols-1 gap-4 ${stepTransitionClass}`}>
          <CustomSelect
            label="Intitule du logement"
            value={form.propertyTitle}
            onChange={(value) => updateField("propertyTitle", value)}
            groups={CONTRACT_PROPERTY_CATEGORY_GROUPS}
            placeholder="Choisir une categorie"
            searchable
            dropUp
            icon={<Building2 className="w-4 h-4" />}
            labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
            triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
            dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
          />
          <CustomSelect
            label="Adresse du logement"
            value={form.propertyAddress}
            onChange={(value) => updateField("propertyAddress", value)}
            groups={DAKAR_NEIGHBORHOOD_GROUPS}
            placeholder="Choisir un quartier de Dakar"
            searchable
            dropUp
            icon={<MapPinHouse className="w-4 h-4" />}
            labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
            triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
            dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
          />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className={`space-y-4 ${stepTransitionClass}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequence de paiement</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "mois", label: "Par mois" },
                  { value: "jour", label: "Par jour" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("paymentFrequency", option.value as "jour" | "mois")}
                    className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-all ${
                      form.paymentFrequency === option.value
                        ? "border-[#1a3a5c] bg-[#1a3a5c] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#1a3a5c]/40 hover:text-[#1a3a5c]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
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
        </div>
      );
    }

    return (
      <div className={`space-y-5 ${stepTransitionClass}`}>
        <div className="rounded-3xl border border-gray-200 bg-[#f8fafc] p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a3a5c]">
            <BadgeCheck className="h-4 w-4" />
            Derniere etape avant export
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Relisez les informations ci-dessous, adaptez les clauses particulieres si besoin, puis generez le PDF KOITALA.
          </p>
        </div>

        <Textarea
          label="Clauses particulieres"
          value={form.specialClauses}
          onChange={(event) => updateField("specialClauses", event.target.value)}
          className="min-h-[150px]"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Client</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.tenantName || "Non renseigne"}</p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Sexe</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.tenantSex ? formatSexLabel(form.tenantSex) : "Non renseigne"}</p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Profession</p>
            <p className="mt-1 font-semibold text-[#0f1724]">
              {form.tenantProfession ? formatProfessionLabel(form.tenantProfession) : "Non renseigne"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Nationalite</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.tenantNationality || "Non renseigne"}</p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Bien</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.propertyTitle || "Non renseigne"}</p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Quartier</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.propertyAddress || "Non renseigne"}</p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Loyer</p>
            <p className="mt-1 font-semibold text-[#0f1724]">
              {form.monthlyRent ? `${formatMoneyDisplay(form.monthlyRent)} ${formatPaymentFrequencyLabel(form.paymentFrequency)}` : "Non renseigne"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Prise d&apos;effet</p>
            <p className="mt-1 font-semibold text-[#0f1724]">{form.startDate || "Non renseigne"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8 min-h-full">
      <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-[1.45rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[1.65rem] lg:text-3xl">
              Generation de contrat
            </h1>
          </div>

          <div className="rounded-3xl border border-[#1a3a5c]/10 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Etape actuelle</p>
            <p className="mt-2 text-[1.8rem] font-extrabold tracking-tight text-[#0f1724] sm:text-[2rem] lg:text-3xl">
              {step}/{TOTAL_STEPS}
            </p>
            <p className="mt-1 text-sm text-gray-500">{currentStep.label}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0f1724]">Progression du formulaire</p>
              <p className="text-sm text-gray-500">Navigation par etapes avec verification progressive.</p>
            </div>
            <Button type="button" variant="ghost" onClick={resetForm} className="h-11 shrink-0 px-4">
              <RotateCcw className="h-4 w-4" />
              Reinitialiser
            </Button>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#1a3a5c] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STEPS.map((item, index) => (
              <div
                key={item.id}
                className={`rounded-2xl border px-4 py-3 text-sm transition-colors ${
                  step === item.id
                    ? "border-[#1a3a5c] bg-[#1a3a5c] text-white"
                    : index + 1 < step
                      ? "border-[#1a3a5c]/15 bg-[#1a3a5c]/5 text-[#1a3a5c]"
                      : "border-gray-200 bg-[#fafafa] text-gray-500"
                }`}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-xs">{step === item.id ? "En cours" : index + 1 < step ? "Complete" : "A venir"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px] xl:items-start">
        <section className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1a3a5c]/10 text-[#1a3a5c] sm:h-10 sm:w-10">
                <currentStep.icon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-[#0f1724]">{currentStep.title}</h2>
                <p className="text-sm text-gray-500">{currentStep.description}</p>
              </div>
            </div>

            {renderStepContent()}

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-500">
                Completion globale du dossier: <span className="font-semibold text-[#1a3a5c]">{completion}%</span>
              </div>

              <div className="flex w-full flex-row gap-3 sm:w-auto">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className={FORM_MOBILE_BUTTON_CLASS}>
                    <ArrowLeft className="h-4 w-4" />
                    Precedent
                  </Button>
                )}

                {step < TOTAL_STEPS ? (
                  <Button type="button" onClick={nextStep} className={FORM_MOBILE_BUTTON_CLASS}>
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void handleGenerate()}
                    loading={isGenerating}
                    className={FORM_MOBILE_BUTTON_CLASS}
                  >
                    <FileDown className="h-4 w-4" />
                    Generer le PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-[#0f1724] sm:text-lg">Resume du contrat</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Client</p>
                <p className="mt-1 font-semibold text-[#0f1724]">{form.tenantName || "Non renseigne"}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Sexe</p>
                <p className="mt-1 font-semibold text-[#0f1724]">
                  {form.tenantSex ? formatSexLabel(form.tenantSex) : "Non renseigne"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Profession</p>
                <p className="mt-1 font-semibold text-[#0f1724]">
                  {form.tenantProfession ? formatProfessionLabel(form.tenantProfession) : "Non renseigne"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Nationalite</p>
                <p className="mt-1 font-semibold text-[#0f1724]">{form.tenantNationality || "Non renseigne"}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Bien</p>
                <p className="mt-1 font-semibold text-[#0f1724]">{form.propertyTitle || "Non renseigne"}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Quartier</p>
                <p className="mt-1 font-semibold text-[#0f1724]">{form.propertyAddress || "Non renseigne"}</p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Loyer</p>
                <p className="mt-1 font-semibold text-[#0f1724]">
                  {form.monthlyRent ? `${formatMoneyDisplay(form.monthlyRent)} ${formatPaymentFrequencyLabel(form.paymentFrequency)}` : "Non renseigne"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Prise d&apos;effet</p>
                <p className="mt-1 font-semibold text-[#0f1724]">{form.startDate || "Non renseigne"}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
