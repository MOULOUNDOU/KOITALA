"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Controller, type Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  X,
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
import { getEmbeddedVideoUrl, isDirectVideoUrl } from "@/lib/utils";
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
const FORM_MOBILE_BUTTON_CLASS = "h-11 min-w-0 flex-1 text-sm sm:w-auto sm:flex-none";
const HERO_FORM_SELECT_LABEL_CLASS = "text-sm font-medium text-gray-700 normal-case tracking-normal mb-1.5";
const HERO_FORM_SELECT_TRIGGER_CLASS = "py-3.5";
const HERO_FORM_SELECT_DROPDOWN_CLASS = "rounded-2xl border border-gray-100 shadow-2xl";
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;
type EditAITask = "title" | "description" | "rewrite" | null;

function createUploadToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Math.floor(Math.random() * 1_000_000_000)}`;
}

export default function EditAnnoncePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFallbackUrl, setVideoFallbackUrl] = useState<string | null>(null);
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiTask, setAiTask] = useState<EditAITask>(null);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as Resolver<PropertyInput>,
    shouldUnregister: false,
  });
  const [
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
    currentVideoUrlValue,
  ] = useWatch({
    control,
    name: [
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
      "video_url",
    ],
  });
  const rentalCategory = rentalCategoryValue ?? "";
  const rentPaymentPeriod = rentPaymentPeriodValue ?? "";
  const currentVideoUrl = currentVideoUrlValue?.trim() || "";
  const directVideoPreview = videoPreview || (currentVideoUrl && isDirectVideoUrl(currentVideoUrl) ? currentVideoUrl : null);
  const embeddedVideoPreview = !videoPreview ? getEmbeddedVideoUrl(currentVideoUrl) : null;
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
    void (async () => {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        reset({
          ...data,
          rental_category: data.rental_category ?? undefined,
          rent_payment_period: data.rent_payment_period ?? undefined,
        });
        setVideoFile(null);
        setVideoPreview(null);
        setVideoFallbackUrl(null);
      }
      setLoading(false);
    })();
  }, [params.id, supabase, reset]);

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
    setVideoFallbackUrl(currentVideoUrl || null);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    const fallbackVideoUrl = videoFile ? (videoFallbackUrl ?? "") : "";
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setVideoFallbackUrl(null);
    setValue("video_url", fallbackVideoUrl);
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
    const description = getValues("description")?.trim();
    if (description) return description;
    return getValues("title")?.trim() ?? "";
  };

  const handleAIGenerateTitle = async () => {
    const sourceText = getPrimarySourceText();
    if (!sourceText) {
      toast.error("Ajoutez un texte libre ou une description pour générer un titre.");
      return;
    }

    setAiTask("title");
    try {
      const prompt = `Génère un titre d'annonce immobilière professionnel.
- Réponds uniquement avec le titre final.
- 12 mots maximum.
- N invente pas de données critiques absentes.

Texte source:
${sourceText}

Contexte formulaire:
${buildListingContext()}`;
      const reply = await askAdminAI(prompt);
      const titleFromAI = reply.split("\n")[0]?.trim().replace(/^["']|["']$/g, "");
      if (!titleFromAI) throw new Error("Le titre généré est vide.");
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
      toast.error("Ajoutez un texte libre ou un titre pour générer une description.");
      return;
    }

    setAiTask("description");
    try {
      const prompt = `Rédige une description commerciale claire et attractive pour l'annonce.
- Français professionnel.
- 90 à 150 mots.
- N invente pas de données critiques absentes.
- Réponds uniquement avec la description.

Texte source:
${sourceText}

Contexte formulaire:
${buildListingContext()}`;
      const reply = await askAdminAI(prompt);
      const descriptionFromAI = reply.trim();
      if (!descriptionFromAI) throw new Error("La description générée est vide.");
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
      const prompt = `Améliore et corrige la description suivante.
- Ton professionnel immobilier.
- 90 à 150 mots.
- Réponds uniquement avec la version réécrite.

Description:
${description}

Contexte formulaire:
${buildListingContext()}`;
      const reply = await askAdminAI(prompt);
      const improvedDescription = reply.trim();
      if (!improvedDescription) throw new Error("La description réécrite est vide.");
      setValue("description", improvedDescription, { shouldDirty: true, shouldValidate: true });
      toast.success("Description améliorée avec l'IA.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA.";
      toast.error(message);
    } finally {
      setAiTask(null);
    }
  };

  const onSubmit = async (data: PropertyInput) => {
    const currentListingType = data.listing_type ?? getValues("listing_type");
    const currentRentalCategory = data.rental_category ?? getValues("rental_category");
    const currentRentPaymentPeriod = data.rent_payment_period ?? getValues("rent_payment_period");

    if (currentListingType === "location" && (!currentRentalCategory || !currentRentPaymentPeriod)) {
      toast.error("Choisissez une catégorie location et une période de paiement.");
      return;
    }

    const hasMainImageUrl = Boolean(data.main_image_url?.trim());
    const hasVideoUrl = Boolean(data.video_url?.trim());
    const hasPendingVideoUpload = Boolean(videoFile);
    if (!hasMainImageUrl && !hasVideoUrl && !hasPendingVideoUpload) {
      toast.error("Ajoutez au moins un media: une photo ou une video.");
      return;
    }

    const payload = {
      ...data,
      listing_type: currentListingType,
      rental_category: currentListingType === "location" ? (currentRentalCategory || null) : null,
      rent_payment_period: currentListingType === "location" ? (currentRentPaymentPeriod || null) : null,
      main_image_url: data.main_image_url?.trim() || null,
      video_url: data.video_url?.trim() || null,
    };

    let { error } = await supabase
      .from("properties")
      .update(payload)
      .eq("id", params.id);

    if (error && (error.message.includes("rental_category") || error.message.includes("rent_payment_period"))) {
      const fallbackPayload = { ...payload };
      delete (fallbackPayload as Partial<typeof fallbackPayload>).rental_category;
      delete (fallbackPayload as Partial<typeof fallbackPayload>).rent_payment_period;
      const fallbackResult = await supabase
        .from("properties")
        .update(fallbackPayload)
        .eq("id", params.id);
      error = fallbackResult.error;
      if (!error) {
        toast("Mise à jour SQL requise pour activer la catégorie location et le paiement jour/mois.", {
          icon: "!",
        });
      }
    }

    if (error) { toast.error("Erreur lors de la mise à jour"); return; }

    if (videoFile) {
      const ext = videoFile.name.split(".").pop();
      const videoPath = `properties/${params.id}/video-${createUploadToken()}.${ext}`;
      const { data: videoUploaded, error: videoUploadError } = await supabase.storage
        .from("property-videos")
        .upload(videoPath, videoFile, { upsert: true });

      if (videoUploadError || !videoUploaded) {
        toast.error("Annonce mise à jour, mais l'envoi de la vidéo vers Supabase a échoué.");
        return;
      }

      const { data: videoPublicUrl } = supabase.storage
        .from("property-videos")
        .getPublicUrl(videoPath);
      const { error: videoSaveError } = await supabase
        .from("properties")
        .update({ video_url: videoPublicUrl.publicUrl })
        .eq("id", params.id);

      if (videoSaveError) {
        toast.error("Annonce mise à jour, mais l'URL de la vidéo n'a pas pu être enregistrée.");
        return;
      }

      setValue("video_url", videoPublicUrl.publicUrl);
      setVideoFallbackUrl(null);
    }

    toast.success("Annonce mise à jour !");
    router.push("/dashboard/annonces");
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette annonce ? Cette action est irréversible.")) return;
    setDeleting(true);
    const { error } = await supabase.from("properties").delete().eq("id", params.id);
    if (error) { toast.error("Erreur lors de la suppression"); setDeleting(false); return; }
    toast.success("Annonce supprimée.");
    router.push("/dashboard/annonces");
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/annonces" className="p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-[1.35rem] font-bold text-[#0f1724] sm:text-[1.5rem] lg:text-2xl">Modifier l&apos;annonce</h1>
            <p className="text-sm text-gray-500 mt-0.5">Mettez à jour les informations du bien</p>
          </div>
        </div>
        <Button
          variant="danger"
          loading={deleting}
          onClick={handleDelete}
          className={FORM_MOBILE_BUTTON_CLASS}
        >
          <Trash2 className="w-4 h-4" /> Supprimer
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24 md:pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0f1724]">Informations générales</h2>
          <div className="rounded-xl border border-[#1a3a5c]/15 bg-[#f7f9fc] p-4">
            <div className="flex items-center gap-2 text-[#1a3a5c] mb-3">
              <Sparkles className="w-4 h-4" />
              <p className="text-sm font-semibold">Assistant IA annonce</p>
            </div>
            <Textarea
              label="Texte libre pour l'IA (brief annonce)"
              placeholder="Collez ici un brief brut ou des notes client..."
              rows={4}
              value={aiSourceText}
              onChange={(event) => setAiSourceText(event.target.value)}
            />
            <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
              <div className="flex min-w-max items-center gap-2 sm:min-w-0 sm:flex-wrap">
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
          </div>
          <Input label="Titre *" error={errors.title?.message} {...register("title")} />
          <Textarea label="Description" rows={5} {...register("description")} />
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
                    label="Catégorie location"
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Prix & caractéristiques</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Prix (XOF) *" type="number" error={errors.price?.message} {...register("price", { valueAsNumber: true })} />
            <Input label="Surface (m²)" type="number" {...register("area", { valueAsNumber: true })} />
            <Input label="Chambres" type="number" min={0} {...register("bedrooms", { valueAsNumber: true })} />
            <Input label="Salles de bain" type="number" min={0} {...register("bathrooms", { valueAsNumber: true })} />
          </div>
          {listingType === "location" && (
            <div className="mt-4">
              <Controller
                name="rent_payment_period"
                control={control}
                render={({ field }) => (
                  <div>
                    <CustomSelect
                      label="Période de paiement"
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
          <div className="mt-4 flex items-center gap-3">
            <input type="checkbox" id="is_featured" className="w-4 h-4 accent-[#1a3a5c]" {...register("is_featured")} />
            <label htmlFor="is_featured" className="text-sm text-gray-700 cursor-pointer">Mettre en avant</label>
          </div>
        </div>

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
              <Input label="Adresse" {...register("address")} />
              <Input label="Quartier" {...register("neighborhood")} />
              <Input label="Ville *" error={errors.city?.message} {...register("city")} />
              <Input label="Code postal" {...register("postal_code")} />
              <Input label="Latitude" type="number" step="any" {...register("latitude", { valueAsNumber: true })} />
              <Input label="Longitude" type="number" step="any" {...register("longitude", { valueAsNumber: true })} />
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
            description="La fiche publique affichera cette carte. Sans coordonnées GPS, la position est estimée via l'adresse."
            compact
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Médias</h2>
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="URL image principale"
              type="url"
              placeholder="https://exemple.com/image.jpg"
              {...register("main_image_url")}
            />

            <div>
              <input type="hidden" {...register("video_url")} />
              <p className="block text-sm font-medium text-gray-700 mb-1.5">Vidéo du bien</p>
              <p className="mb-4 text-xs text-gray-400">
                La vidéo est téléversée dans le stockage Supabase. Ajoutez au moins un media: une photo ou une video.
              </p>
              {!directVideoPreview && !embeddedVideoPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1a3a5c]/50 hover:bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
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
                  {directVideoPreview ? (
                    <video
                      src={directVideoPreview}
                      controls
                      className="w-full max-h-52 rounded-xl bg-black"
                    />
                  ) : (
                    <iframe
                      src={embeddedVideoPreview ?? undefined}
                      title="Vidéo du bien"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full aspect-video rounded-xl border-0 bg-black"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 active:scale-[0.96]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>
                      {videoFile ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)` : "Vidéo enregistrée"}
                    </span>
                    {videoFile ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a5c]/8 px-2 py-1 text-[#1a3a5c]">
                        <Video className="w-3 h-3" />
                        Remplacement prêt
                      </span>
                    ) : null}
                  </div>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1a3a5c] hover:text-[#0f2540]">
                    <Upload className="w-4 h-4" />
                    Remplacer la vidéo
                    <input
                      type="file"
                      accept="video/mp4,video/mov,video/webm,video/quicktime"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-3 justify-end">
          <Link href="/dashboard/annonces" className="min-w-0 flex-1 sm:w-auto sm:flex-none">
            <Button type="button" variant="ghost" className={FORM_MOBILE_BUTTON_CLASS}>
              Annuler
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting} className={FORM_MOBILE_BUTTON_CLASS}>
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
