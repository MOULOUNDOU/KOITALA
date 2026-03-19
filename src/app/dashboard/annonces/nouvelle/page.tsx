"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Video,
  Building2,
  Megaphone,
  BadgeCheck,
  Home,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { propertySchema, type PropertyInput } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
import GoogleMapsLocationField from "@/components/dashboard/GoogleMapsLocationField";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import CustomSelect from "@/components/ui/CustomSelect";
import PropertyMapSection from "@/components/properties/PropertyMapSection";
import toast from "react-hot-toast";

const PROPERTY_TYPES = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "villa", label: "Villa" },
  { value: "terrain", label: "Terrain" },
  { value: "bureau", label: "Bureau" },
  { value: "local_commercial", label: "Local commercial" },
  { value: "duplex", label: "Duplex" },
];

const LISTING_TYPES = [
  { value: "vente", label: "Vente" },
  { value: "location", label: "Location" },
];

const RENTAL_CATEGORY_OPTIONS = [
  { value: "chambre_meublee", label: "Chambre meublée" },
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
  { value: "mini_studio", label: "Mini studio" },
  { value: "colocation", label: "Colocation" },
];

const PAYMENT_PERIOD_OPTIONS_BY_CATEGORY: Record<string, { value: "jour" | "mois"; label: string }[]> = {
  chambre_meublee: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  studio: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  mini_studio: [
    { value: "jour", label: "Par jour" },
    { value: "mois", label: "Par mois" },
  ],
  appartement: [{ value: "mois", label: "Par mois" }],
  colocation: [{ value: "mois", label: "Par mois" }],
};

const STATUSES = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
  { value: "vendu", label: "Vendu" },
  { value: "loue", label: "Loué" },
  { value: "archive", label: "Archivé" },
];

const DEFAULT_FEATURES = [
  "Balcon", "Parking", "Piscine", "Terrasse", "Climatisation",
  "Jardin", "Gardien", "Ascenseur", "Internet", "Meublé",
];

const TOTAL_STEPS = 4;
const FORM_MOBILE_BUTTON_CLASS = "h-11 min-w-0 flex-1 text-sm sm:w-auto sm:flex-none";
const HERO_FORM_SELECT_LABEL_CLASS = "text-sm font-medium text-gray-700 normal-case tracking-normal mb-1.5";
const HERO_FORM_SELECT_TRIGGER_CLASS = "py-3.5";
const HERO_FORM_SELECT_DROPDOWN_CLASS = "rounded-2xl border border-gray-100 shadow-2xl";
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
type AITask = "prefill" | "title" | "description" | "rewrite" | "features" | null;

function extractFirstJsonObject(raw: string): Record<string, unknown> | null {
  const fencedMatch =
    raw.match(/```json\s*([\s\S]*?)```/i) ??
    raw.match(/```\s*([\s\S]*?)```/i);
  const source = fencedMatch?.[1] ?? raw;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");

  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(source.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : undefined;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeFeatureLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createUploadToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Math.floor(Math.random() * 1_000_000_000)}`;
}

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState<"forward" | "backward">("forward");
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; file?: File; is_main: boolean }[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiTask, setAiTask] = useState<AITask>(null);
  const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);

  const MAX_IMAGES = 5;

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as Resolver<PropertyInput>,
    shouldUnregister: false,
    defaultValues: {
      status: "brouillon",
      listing_type: "vente",
      property_type: "appartement",
      country: "Sénégal",
      is_featured: false,
      is_furnished: false,
      rental_category: undefined,
      rent_payment_period: undefined,
      main_image_url: "",
      video_url: "",
    },
  });

  const [
    title,
    listingType,
    rentalCategoryValue,
    rentPaymentPeriodValue,
    address,
    neighborhood,
    city,
    postalCode,
    country,
    latitude,
    longitude,
  ] = useWatch({
    control,
    name: [
      "title",
      "listing_type",
      "rental_category",
      "rent_payment_period",
      "address",
      "neighborhood",
      "city",
      "postal_code",
      "country",
      "latitude",
      "longitude",
    ],
  });
  const rentalCategory = rentalCategoryValue ?? "";
  const rentPaymentPeriod = rentPaymentPeriodValue ?? "";
  const progressPercent = (step / TOTAL_STEPS) * 100;
  const stepTransitionClass = stepDirection === "forward" ? "anim-slide-right" : "anim-slide-left";
  const paymentPeriodOptions = useMemo(
    () =>
      rentalCategory && PAYMENT_PERIOD_OPTIONS_BY_CATEGORY[rentalCategory]
        ? PAYMENT_PERIOD_OPTIONS_BY_CATEGORY[rentalCategory]
        : [
            { value: "jour", label: "Par jour" },
            { value: "mois", label: "Par mois" },
          ],
    [rentalCategory]
  );

  useEffect(() => {
    if (listingType === "vente") {
      setValue("rental_category", undefined);
      setValue("rent_payment_period", undefined);
      return;
    }
    if (listingType !== "location") return;

    if (
      rentPaymentPeriod &&
      !paymentPeriodOptions.some((option) => option.value === rentPaymentPeriod)
    ) {
      setValue("rent_payment_period", undefined);
    }
  }, [listingType, paymentPeriodOptions, rentPaymentPeriod, setValue]);

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const parseOptionalNumber = (value: unknown) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const nextStep = async () => {
    const stepOneFields: Array<keyof PropertyInput> = ["title", "property_type", "listing_type", "status"];
    if (listingType === "location") stepOneFields.push("rental_category");

    const stepTwoFields: Array<keyof PropertyInput> = ["price"];
    if (listingType === "location") stepTwoFields.push("rent_payment_period");

    const fieldsByStep: Record<number, Array<keyof PropertyInput>> = {
      1: stepOneFields,
      2: stepTwoFields,
      3: ["city"],
      4: [],
    };

    const fields = fieldsByStep[step] ?? [];
    if (fields.length > 0) {
      const isValid = await trigger(fields);
      if (!isValid) {
        toast.error("Veuillez compléter les champs requis avant de continuer.");
        return;
      }
    }

    setStepDirection("forward");
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const prevStep = () => {
    setStepDirection("backward");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos autorisées`);
      return;
    }
    const filesToAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Seulement ${remaining} photo(s) restante(s). ${files.length - remaining} ignorée(s).`);
    }
    setUploading(true);
    const newImages: { url: string; file: File; is_main: boolean }[] = [];
    for (const file of filesToAdd) {
      const preview = URL.createObjectURL(file);
      newImages.push({ url: preview, file, is_main: images.length === 0 && newImages.length === 0 });
    }
    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("La vidéo ne doit pas dépasser 100 MB");
      return;
    }
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setValue("video_url", "");
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.is_main)) {
        updated[0].is_main = true;
      }
      return updated;
    });
  };

  const setMainImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_main: i === index }))
    );
  };

  const toggleFeature = (feat: string) => {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && !features.includes(customFeature.trim())) {
      setFeatures((prev) => [...prev, customFeature.trim()]);
      setCustomFeature("");
    }
  };

  const pickEnum = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => {
    if (typeof value !== "string") return undefined;
    return allowed.find((item) => item === value.trim());
  };

  const mergeFeatures = (incoming: string[]) => {
    if (incoming.length === 0) return;
    const normalizedIncoming = incoming.map((item) => normalizeFeatureLabel(item.trim())).filter(Boolean);
    if (normalizedIncoming.length === 0) return;

    setFeatures((prev) => {
      const seen = new Set(prev.map((item) => item.toLowerCase()));
      const next = [...prev];
      for (const item of normalizedIncoming) {
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(item);
      }
      return next;
    });
  };

  const buildListingContext = () => {
    const values = getValues();
    return JSON.stringify(
      {
        title: values.title ?? "",
        description: values.description ?? "",
        property_type: values.property_type ?? "",
        listing_type: values.listing_type ?? "",
        rental_category: values.rental_category ?? "",
        rent_payment_period: values.rent_payment_period ?? "",
        price: values.price ?? null,
        area: values.area ?? null,
        bedrooms: values.bedrooms ?? null,
        bathrooms: values.bathrooms ?? null,
        city: values.city ?? "",
        neighborhood: values.neighborhood ?? "",
        address: values.address ?? "",
        country: values.country ?? "",
        features,
      },
      null,
      2
    );
  };

  const askAdminAI = async (instruction: string) => {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assistant: "admin",
        scope: "dashboard",
        messages: [{ role: "user", content: instruction }],
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { reply?: string; error?: string }
      | null;

    if (!response.ok || !payload?.reply) {
      throw new Error(payload?.error || "Assistant IA indisponible.");
    }

    return payload.reply.trim();
  };

  const getPrimarySourceText = () => {
    const freeText = aiSourceText.trim();
    if (freeText) return freeText;
    const currentDescription = getValues("description")?.trim();
    if (currentDescription) return currentDescription;
    const currentTitle = getValues("title")?.trim();
    return currentTitle ?? "";
  };

  const handleAIPrefill = async () => {
    const sourceText = getPrimarySourceText();
    if (!sourceText) {
      toast.error("Ajoutez un texte libre ou une description pour lancer l'analyse IA.");
      return;
    }

    setAiTask("prefill");
    setAiMissingFields([]);

    try {
      const prompt = `Analyse le texte d'annonce ci-dessous et retourne STRICTEMENT un JSON valide (sans markdown).

Contraintes:
- N invente pas les donnees manquantes: mets null.
- Les enums doivent respecter strictement:
  property_type: ${PROPERTY_TYPES.map((item) => item.value).join(" | ")}
  listing_type: ${LISTING_TYPES.map((item) => item.value).join(" | ")}
  rental_category: ${RENTAL_CATEGORY_OPTIONS.map((item) => item.value).join(" | ")}
  rent_payment_period: jour | mois
- price, area, bedrooms, bathrooms doivent etre des nombres ou null.
- features et missing_fields sont des tableaux de chaines.

Format attendu:
{
  "title": string | null,
  "description": string | null,
  "property_type": string | null,
  "listing_type": string | null,
  "rental_category": string | null,
  "rent_payment_period": string | null,
  "city": string | null,
  "neighborhood": string | null,
  "address": string | null,
  "price": number | null,
  "area": number | null,
  "bedrooms": number | null,
  "bathrooms": number | null,
  "features": string[],
  "missing_fields": string[]
}

Texte source:
${sourceText}

Contexte formulaire actuel:
${buildListingContext()}`;

      const reply = await askAdminAI(prompt);
      const parsed = extractFirstJsonObject(reply);
      if (!parsed) {
        throw new Error("Réponse IA non structurée. Réessayez.");
      }

      const propertyType = pickEnum(
        parsed.property_type,
        PROPERTY_TYPES.map((item) => item.value) as Array<PropertyInput["property_type"]>
      );
      const listingTypeFromAI = pickEnum(
        parsed.listing_type,
        LISTING_TYPES.map((item) => item.value) as Array<PropertyInput["listing_type"]>
      );
      const rentalCategoryFromAI = pickEnum(
        parsed.rental_category,
        RENTAL_CATEGORY_OPTIONS.map((item) => item.value) as string[]
      );
      const rentPaymentPeriodFromAI = pickEnum(parsed.rent_payment_period, ["jour", "mois"] as const);

      const titleFromAI = toOptionalString(parsed.title);
      const descriptionFromAI = toOptionalString(parsed.description);
      const cityFromAI = toOptionalString(parsed.city);
      const neighborhoodFromAI = toOptionalString(parsed.neighborhood);
      const addressFromAI = toOptionalString(parsed.address);
      const priceFromAI = toOptionalNumber(parsed.price);
      const areaFromAI = toOptionalNumber(parsed.area);
      const bedroomsFromAI = toOptionalNumber(parsed.bedrooms);
      const bathroomsFromAI = toOptionalNumber(parsed.bathrooms);
      const featuresFromAI = toStringArray(parsed.features);
      const missingFieldsFromAI = toStringArray(parsed.missing_fields);

      if (titleFromAI) {
        setValue("title", titleFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (descriptionFromAI) {
        setValue("description", descriptionFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (propertyType) {
        setValue("property_type", propertyType, { shouldDirty: true, shouldValidate: true });
      }
      if (listingTypeFromAI) {
        setValue("listing_type", listingTypeFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (listingTypeFromAI === "location") {
        if (rentalCategoryFromAI) {
          setValue("rental_category", rentalCategoryFromAI as PropertyInput["rental_category"], {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
        if (rentPaymentPeriodFromAI) {
          setValue("rent_payment_period", rentPaymentPeriodFromAI, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
      if (cityFromAI) {
        setValue("city", cityFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (neighborhoodFromAI) {
        setValue("neighborhood", neighborhoodFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (addressFromAI) {
        setValue("address", addressFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (priceFromAI !== undefined) {
        setValue("price", priceFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (areaFromAI !== undefined) {
        setValue("area", areaFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (bedroomsFromAI !== undefined) {
        setValue("bedrooms", bedroomsFromAI, { shouldDirty: true, shouldValidate: true });
      }
      if (bathroomsFromAI !== undefined) {
        setValue("bathrooms", bathroomsFromAI, { shouldDirty: true, shouldValidate: true });
      }

      mergeFeatures(featuresFromAI);
      setAiMissingFields(missingFieldsFromAI);

      if (missingFieldsFromAI.length > 0) {
        toast("Pré-remplissage IA effectué. Champs manquants suggérés plus bas.", { icon: "ℹ️" });
      } else {
        toast.success("Formulaire pré-rempli avec l'IA.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const handleAIGenerateTitle = async () => {
    const sourceText = getPrimarySourceText();
    if (!sourceText) {
      toast.error("Ajoutez un texte libre ou une description pour générer un titre.");
      return;
    }

    setAiTask("title");
    try {
      const prompt = `Génère un titre d'annonce immobilière professionnel à partir des informations suivantes.
- Réponds uniquement avec le titre final, sans guillemets.
- 12 mots maximum.
- Ne fabrique pas de donnée critique absente.

Texte source:
${sourceText}

Contexte formulaire:
${buildListingContext()}`;

      const reply = await askAdminAI(prompt);
      const titleFromAI = reply.split("\n")[0]?.trim().replace(/^["']|["']$/g, "");
      if (!titleFromAI) {
        throw new Error("Le titre généré est vide.");
      }
      setValue("title", titleFromAI, { shouldDirty: true, shouldValidate: true });
      toast.success("Titre généré avec l'IA.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const handleAIGenerateDescription = async () => {
    const sourceText = getPrimarySourceText();
    if (!sourceText) {
      toast.error("Ajoutez un texte libre ou un titre pour générer la description.");
      return;
    }

    setAiTask("description");
    try {
      const prompt = `Rédige une description commerciale claire et attractive pour une annonce immobilière.
- Français professionnel, concis.
- 90 à 150 mots.
- Mets en avant bénéfices, localisation, usage.
- Ne fabrique pas de donnée critique absente.
- Réponds uniquement avec la description finale.

Texte source:
${sourceText}

Contexte formulaire:
${buildListingContext()}`;

      const reply = await askAdminAI(prompt);
      const descriptionFromAI = reply.trim();
      if (!descriptionFromAI) {
        throw new Error("La description générée est vide.");
      }
      setValue("description", descriptionFromAI, { shouldDirty: true, shouldValidate: true });
      toast.success("Description générée avec l'IA.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const handleAIRewriteDescription = async () => {
    const description = getValues("description")?.trim();
    if (!description) {
      toast.error("Ajoutez d'abord une description à améliorer.");
      return;
    }

    setAiTask("rewrite");
    try {
      const prompt = `Améliore et corrige la description suivante d'une annonce immobilière.
- Corrige orthographe et style.
- Garde le sens métier.
- Ton professionnel et orienté vente/location.
- 90 à 150 mots.
- Réponds uniquement avec la version réécrite.

Description:
${description}

Contexte formulaire:
${buildListingContext()}`;

      const reply = await askAdminAI(prompt);
      const improvedDescription = reply.trim();
      if (!improvedDescription) {
        throw new Error("La description réécrite est vide.");
      }
      setValue("description", improvedDescription, { shouldDirty: true, shouldValidate: true });
      toast.success("Description améliorée avec l'IA.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const handleAISuggestFeatures = async () => {
    const sourceText = getPrimarySourceText();
    if (!sourceText) {
      toast.error("Ajoutez un texte libre ou une description pour suggérer des caractéristiques.");
      return;
    }

    setAiTask("features");
    try {
      const prompt = `À partir du texte ci-dessous, propose des caractéristiques pertinentes du bien.
- Réponds STRICTEMENT en JSON valide: {"features": ["..."]}.
- 8 éléments maximum.
- Pas d'invention de données critiques.

Texte source:
${sourceText}

Contexte formulaire:
${buildListingContext()}`;

      const reply = await askAdminAI(prompt);
      const parsed = extractFirstJsonObject(reply);
      if (!parsed) throw new Error("Réponse IA non structurée.");
      const suggested = toStringArray(parsed.features);
      if (suggested.length === 0) {
        throw new Error("Aucune caractéristique suggérée.");
      }
      mergeFeatures(suggested);
      toast.success("Caractéristiques suggérées ajoutées.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const resolveCurrentUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      return sessionData.session.user;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      return userData.user;
    }

    const { data: refreshedData } = await supabase.auth.refreshSession();
    return refreshedData.session?.user ?? null;
  };

  const onSubmit = async (data: PropertyInput) => {
    const currentListingType = data.listing_type ?? getValues("listing_type");
    const currentRentalCategory = data.rental_category ?? getValues("rental_category");
    const currentRentPaymentPeriod = data.rent_payment_period ?? getValues("rent_payment_period");

    if (currentListingType === "location" && (!currentRentalCategory || !currentRentPaymentPeriod)) {
      toast.error("Choisissez une catégorie location et une période de paiement.");
      return;
    }

    const hasUploadedImage = images.length > 0;
    const hasMainImageUrl = Boolean(data.main_image_url?.trim());
    const hasUploadedVideo = Boolean(videoFile);
    if (!hasUploadedImage && !hasMainImageUrl && !hasUploadedVideo) {
      setStepDirection("forward");
      setStep(4);
      toast.error("Ajoutez au moins un media: une photo ou une video.");
      return;
    }

    const user = await resolveCurrentUser();
    if (!user) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      router.replace("/auth/login?redirectTo=/dashboard/annonces/nouvelle");
      return;
    }

    const slug = `${generateSlug(data.title)}-${createUploadToken()}`;
    const normalizedData = {
      ...data,
      listing_type: currentListingType,
      rental_category: currentListingType === "location" ? (currentRentalCategory || null) : null,
      rent_payment_period: currentListingType === "location" ? (currentRentPaymentPeriod || null) : null,
      main_image_url: data.main_image_url?.trim() || null,
      video_url: null,
    };

    // Insert property
    const insertPayload = { ...normalizedData, slug, created_by: user.id };
    let { data: property, error } = await supabase
      .from("properties")
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.message.includes("rental_category") || error.message.includes("rent_payment_period"))) {
      const fallbackPayload = { ...insertPayload };
      delete (fallbackPayload as Partial<typeof fallbackPayload>).rental_category;
      delete (fallbackPayload as Partial<typeof fallbackPayload>).rent_payment_period;
      const fallbackResult = await supabase
        .from("properties")
        .insert(fallbackPayload)
        .select()
        .single();
      property = fallbackResult.data;
      error = fallbackResult.error;
      if (!error) {
        toast("Mise à jour SQL requise pour activer la catégorie location et le paiement jour/mois.", {
          icon: "!",
        });
      }
    }

    if (error || !property) {
      const details = error?.message
        ? error.message.includes("row-level security")
          ? "Accès refusé. Vérifiez que votre compte a bien le rôle admin."
          : error.message
        : "";
      toast.error(details ? `Erreur lors de la création: ${details}` : "Erreur lors de la création");
      return;
    }

    // Upload images
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.file) continue;
        const ext = img.file.name.split(".").pop();
        const path = `properties/${property.id}/${createUploadToken()}-${i}.${ext}`;
        const { data: uploaded } = await supabase.storage
          .from("property-images")
          .upload(path, img.file, { upsert: true });

        if (uploaded) {
          const { data: publicUrl } = supabase.storage
            .from("property-images")
            .getPublicUrl(path);

          await supabase.from("property_images").insert({
            property_id: property.id,
            url: publicUrl.publicUrl,
            is_main: img.is_main,
            order_index: i,
          });

          if (img.is_main) {
            await supabase
              .from("properties")
              .update({ main_image_url: publicUrl.publicUrl })
              .eq("id", property.id);
          }
        }
      }
    } else if (normalizedData.main_image_url) {
      await supabase.from("property_images").insert({
        property_id: property.id,
        url: normalizedData.main_image_url,
        is_main: true,
        order_index: 0,
      });
    }

    // Upload video
    if (videoFile) {
      const ext = videoFile.name.split(".").pop();
      const videoPath = `properties/${property.id}/video-${createUploadToken()}.${ext}`;
      const { data: videoUploaded, error: videoUploadError } = await supabase.storage
        .from("property-videos")
        .upload(videoPath, videoFile, { upsert: true });
      if (videoUploadError || !videoUploaded) {
        toast.error("Annonce créée, mais l'envoi de la vidéo vers Supabase a échoué. Réessayez depuis l'édition.");
        router.push(`/dashboard/annonces/${property.id}`);
        return;
      }

      const { data: videoPublicUrl } = supabase.storage
        .from("property-videos")
        .getPublicUrl(videoPath);
      const { error: videoSaveError } = await supabase
        .from("properties")
        .update({ video_url: videoPublicUrl.publicUrl })
        .eq("id", property.id);

      if (videoSaveError) {
        toast.error("Annonce créée, mais l'URL de la vidéo n'a pas pu être enregistrée. Réessayez depuis l'édition.");
        router.push(`/dashboard/annonces/${property.id}`);
        return;
      }

      setValue("video_url", videoPublicUrl.publicUrl);
    }

    // Insert features
    if (features.length > 0) {
      await supabase.from("property_features").insert(
        features.map((name) => ({ property_id: property.id, name }))
      );
    }

    toast.success("Annonce créée avec succès !");
    router.push("/dashboard/annonces");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-7">
        <Link
          href="/dashboard/annonces"
          className="p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-[1.35rem] font-bold text-[#0f1724] sm:text-[1.5rem] lg:text-2xl">Nouvelle annonce</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations du bien</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24 md:pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs sm:text-sm font-medium text-[#1a3a5c]">Progression du formulaire</p>
            <p className="text-xs sm:text-sm text-gray-500">{step}/{TOTAL_STEPS}</p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#1a3a5c] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div key={`step-${step}`} className={`space-y-6 ${stepTransitionClass} animate-fade-in`}>
          {/* Basic info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-[#0f1724] mb-5">Informations générales</h2>
              <div className="space-y-5">
                <div className="rounded-xl border border-[#1a3a5c]/15 bg-[#f7f9fc] p-4">
                  <div className="flex items-center gap-2 text-[#1a3a5c] mb-3">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-sm font-semibold">Assistant IA annonce</p>
                  </div>
                  <Textarea
                    label="Texte libre pour l'IA (brief annonce)"
                    placeholder="Collez ici un message WhatsApp, une note vocale transcrite ou un brief brut..."
                    rows={4}
                    value={aiSourceText}
                    onChange={(event) => setAiSourceText(event.target.value)}
                  />
                  <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
                    <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleAIPrefill()}
                        loading={aiTask === "prefill"}
                        className="shrink-0 whitespace-nowrap"
                      >
                        <Sparkles className="w-4 h-4" />
                        Pré-remplir avec IA
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleAIGenerateTitle()}
                        loading={aiTask === "title"}
                        className="shrink-0 whitespace-nowrap"
                      >
                        Générer le titre
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleAIGenerateDescription()}
                        loading={aiTask === "description"}
                        className="shrink-0 whitespace-nowrap"
                      >
                        Générer la description
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleAIRewriteDescription()}
                        loading={aiTask === "rewrite"}
                        className="shrink-0 whitespace-nowrap"
                      >
                        Réécrire la description
                      </Button>
                    </div>
                  </div>
                  {aiMissingFields.length > 0 && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Champs potentiellement manquants: {aiMissingFields.join(", ")}.
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Vérifiez toujours les données avant validation. Toute nouvelle annonce reste en brouillon par défaut.
                  </p>
                </div>

                <Input
                  label="Titre de l'annonce *"
                  placeholder="Ex: Appartement 3 pièces vue mer à Dakar"
                  error={errors.title?.message}
                  {...register("title")}
                />
                {title && (
                  <p className="text-xs text-gray-400">
                    Slug : <span className="text-[#1a3a5c] font-mono">{generateSlug(title)}</span>
                  </p>
                )}
                <Textarea
                  label="Description"
                  placeholder="Décrivez le bien en détail..."
                  rows={5}
                  {...register("description")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Controller
                    name="property_type"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Type de bien *"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || undefined)}
                          options={PROPERTY_TYPES}
                          placeholder="Choisir le type de bien"
                          searchable
                          dropUp
                          icon={<Building2 className="w-4 h-4" />}
                          labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
                          triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
                          dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
                        />
                        {errors.property_type?.message && (
                          <p className="mt-1.5 text-xs text-red-600">{errors.property_type.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="listing_type"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Type d'annonce *"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || undefined)}
                          options={LISTING_TYPES}
                          placeholder="Choisir vente ou location"
                          dropUp
                          icon={<Megaphone className="w-4 h-4" />}
                          labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
                          triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
                          dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
                        />
                        {errors.listing_type?.message && (
                          <p className="mt-1.5 text-xs text-red-600">{errors.listing_type.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Statut *"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || undefined)}
                          options={STATUSES}
                          placeholder="Choisir un statut"
                          dropUp
                          icon={<BadgeCheck className="w-4 h-4" />}
                          labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
                          triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
                          dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
                        />
                        {errors.status?.message && (
                          <p className="mt-1.5 text-xs text-red-600">{errors.status.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                {listingType === "location" && (
                  <Controller
                    name="rental_category"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Catégorie location *"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || undefined)}
                          options={RENTAL_CATEGORY_OPTIONS}
                          placeholder="Choisir une catégorie"
                          searchable
                          dropUp
                          icon={<Home className="w-4 h-4" />}
                          labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
                          triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
                          dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
                        />
                        {errors.rental_category?.message && (
                          <p className="mt-1.5 text-xs text-red-600">{errors.rental_category.message}</p>
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {/* Price & details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-[#0f1724] mb-5">Prix & caractéristiques</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Prix (XOF) *"
                  type="number"
                  placeholder="50000000"
                  error={errors.price?.message}
                  {...register("price", { setValueAs: parseOptionalNumber })}
                />
                <Input
                  label="Surface (m²)"
                  type="number"
                  placeholder="120"
                  {...register("area", { setValueAs: parseOptionalNumber })}
                />
                <Input
                  label="Chambres"
                  type="number"
                  placeholder="3"
                  min={0}
                  {...register("bedrooms", { setValueAs: parseOptionalNumber })}
                />
                <Input
                  label="Salles de bain"
                  type="number"
                  placeholder="2"
                  min={0}
                  {...register("bathrooms", { setValueAs: parseOptionalNumber })}
                />
              </div>
              {listingType === "location" && (
                <div className="mt-4">
                  <Controller
                    name="rent_payment_period"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <CustomSelect
                          label="Période de paiement *"
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || undefined)}
                          options={paymentPeriodOptions}
                          placeholder="Choisir une période"
                          dropUp
                          icon={<CalendarClock className="w-4 h-4" />}
                          labelClassName={HERO_FORM_SELECT_LABEL_CLASS}
                          triggerClassName={HERO_FORM_SELECT_TRIGGER_CLASS}
                          dropdownClassName={HERO_FORM_SELECT_DROPDOWN_CLASS}
                        />
                        {errors.rent_payment_period?.message && (
                          <p className="mt-1.5 text-xs text-red-600">{errors.rent_payment_period.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_featured"
                    className="w-4 h-4 accent-[#1a3a5c]"
                    {...register("is_featured")}
                  />
                  <label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer">
                    Mettre en avant (coup de cœur)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_furnished"
                    className="w-4 h-4 accent-[#1a3a5c]"
                    {...register("is_furnished")}
                  />
                  <label htmlFor="is_furnished" className="text-sm text-gray-700 cursor-pointer">
                    Meublé (chambre / appartement meublé)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-[#0f1724] mb-5">Localisation</h2>
                <GoogleMapsLocationField
                  onResolved={({ lat, lng }) => {
                    setValue("latitude", lat, { shouldDirty: true, shouldValidate: true });
                    setValue("longitude", lng, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Adresse"
                    placeholder="123 Rue de la Paix"
                    {...register("address")}
                  />
                  <Input
                    label="Quartier"
                    placeholder="Plateau"
                    {...register("neighborhood")}
                  />
                  <Input
                    label="Ville *"
                    placeholder="Dakar"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                  <Input
                    label="Code postal"
                    placeholder="10700"
                    {...register("postal_code")}
                  />
                  <Input
                    label="Pays"
                    {...register("country")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Latitude (GPS)"
                    type="number"
                    step="any"
                    placeholder="14.7167"
                    {...register("latitude", { setValueAs: parseOptionalNumber })}
                  />
                  <Input
                    label="Longitude (GPS)"
                    type="number"
                    step="any"
                    placeholder="-17.4677"
                    {...register("longitude", { setValueAs: parseOptionalNumber })}
                  />
                </div>
              </div>

              <PropertyMapSection
                address={address}
                neighborhood={neighborhood}
                city={city}
                postalCode={postalCode}
                country={country}
                latitude={latitude}
                longitude={longitude}
                title="Aperçu carte"
                description="Chaque annonce affichera cette carte. Sans coordonnées GPS, nous estimons la position à partir de l'adresse."
                compact
              />
            </div>
          )}

          {/* Step 4: media + features */}
          {step === 4 && (
            <>
              {/* Images */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-[#0f1724]">Photos du bien</h2>
                  <span className={`text-xs font-medium ${images.length >= MAX_IMAGES ? "text-red-500" : "text-gray-400"}`}>
                    {images.length}/{MAX_IMAGES} photos
                  </span>
                </div>
                <div className="mb-4">
                  <Input
                    label="URL image principale (optionnel si upload)"
                    type="url"
                    placeholder="https://exemple.com/image.jpg"
                    {...register("main_image_url")}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    La photo est optionnelle si vous ajoutez une video.
                  </p>
                </div>
                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors ${images.length >= MAX_IMAGES ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50" : "border-gray-200 cursor-pointer hover:border-[#1a3a5c]/50 hover:bg-gray-50"}`}>
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">
                    {images.length >= MAX_IMAGES ? "Limite de photos atteinte" : "Cliquez pour ajouter des photos"}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP jusqu&apos;à 10 MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading || images.length >= MAX_IMAGES}
                  />
                </label>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          className={`w-full h-20 object-cover rounded-xl border-2 transition-colors cursor-pointer ${
                            img.is_main ? "border-[#1a3a5c]" : "border-transparent hover:border-gray-300"
                          }`}
                          onClick={() => setMainImage(i)}
                        />
                        {img.is_main && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#1a3a5c] text-white text-[10px] rounded font-medium">
                            Principale
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-[0.96]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-[#0f1724] mb-5">Vidéo du bien</h2>
                <input type="hidden" {...register("video_url")} />
                <p className="mb-4 text-xs text-gray-400">
                  La vidéo est téléversée dans le stockage Supabase. Ajoutez au moins un media: photo ou video.
                </p>
                {!videoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1a3a5c]/50 hover:bg-gray-50 transition-colors">
                    <Video className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500">Cliquez pour ajouter une vidéo</span>
                    <span className="text-xs text-gray-400 mt-0.5">MP4, MOV, WEBM jusqu&apos;à 100 MB</span>
                    <input
                      type="file"
                      accept="video/mp4,video/mov,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-52 rounded-xl bg-black"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 active:scale-[0.96]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-400 mt-2">{videoFile?.name} ({(videoFile!.size / (1024 * 1024)).toFixed(1)} MB)</p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#0f1724]">Caractéristiques</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleAISuggestFeatures()}
                    loading={aiTask === "features"}
                  >
                    <Sparkles className="w-4 h-4" />
                    Suggérer avec IA
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {DEFAULT_FEATURES.map((feat) => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => toggleFeature(feat)}
                      className={`h-10 px-3 rounded-xl text-sm border transition-all duration-200 active:scale-[0.98] ${
                        features.includes(feat)
                          ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                          : "border-gray-200 text-gray-600 hover:border-[#1a3a5c]"
                      }`}
                    >
                      {feat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Autre caractéristique..."
                    value={customFeature}
                    onChange={(e) => setCustomFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomFeature}
                    className="h-11"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </Button>
                </div>
                {features.filter((f) => !DEFAULT_FEATURES.includes(f)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {features
                      .filter((f) => !DEFAULT_FEATURES.includes(f))
                      .map((feat) => (
                        <span
                          key={feat}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a5c]/10 text-[#1a3a5c] rounded-xl text-sm"
                        >
                          {feat}
                          <button type="button" onClick={() => toggleFeature(feat)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-row flex-wrap gap-3 justify-between">
          <Link href="/dashboard/annonces" className="min-w-0 flex-1 sm:w-auto sm:flex-none">
            <Button type="button" variant="ghost" className={FORM_MOBILE_BUTTON_CLASS}>
              Annuler
            </Button>
          </Link>

          <div className="flex min-w-0 flex-1 flex-row items-center gap-3 justify-end sm:w-auto sm:flex-none">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className={FORM_MOBILE_BUTTON_CLASS}
              >
                Précédent
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={() => void nextStep()}
                className={FORM_MOBILE_BUTTON_CLASS}
              >
                Suivant
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isSubmitting}
                className={FORM_MOBILE_BUTTON_CLASS}
              >
                <Save className="w-4 h-4" /> Enregistrer l&apos;annonce
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
