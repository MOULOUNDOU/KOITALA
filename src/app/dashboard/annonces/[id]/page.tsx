"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Trash2,
  Building2,
  Megaphone,
  BadgeCheck,
  Home,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { propertySchema, type PropertyInput } from "@/lib/validations";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import CustomSelect from "@/components/ui/CustomSelect";
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
const FORM_MOBILE_BUTTON_CLASS = "w-full sm:w-auto h-11 text-sm";
const HERO_FORM_SELECT_LABEL_CLASS = "text-sm font-medium text-gray-700 normal-case tracking-normal mb-1.5";
const HERO_FORM_SELECT_TRIGGER_CLASS = "py-3.5";
const HERO_FORM_SELECT_DROPDOWN_CLASS = "rounded-2xl border border-gray-100 shadow-2xl";

export default function EditAnnoncePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema) as Resolver<PropertyInput>,
    shouldUnregister: false,
  });
  const listingType = watch("listing_type");
  const rentalCategory = watch("rental_category") ?? "";
  const rentPaymentPeriod = watch("rent_payment_period") ?? "";
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
    supabase
      .from("properties")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          reset({
            ...data,
            rental_category: data.rental_category ?? undefined,
            rent_payment_period: data.rent_payment_period ?? undefined,
          });
        }
        setLoading(false);
      });
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

  const onSubmit = async (data: PropertyInput) => {
    const currentListingType = data.listing_type ?? getValues("listing_type");
    const currentRentalCategory = data.rental_category ?? getValues("rental_category");
    const currentRentPaymentPeriod = data.rent_payment_period ?? getValues("rent_payment_period");

    if (currentListingType === "location" && (!currentRentalCategory || !currentRentPaymentPeriod)) {
      toast.error("Choisissez une catégorie location et une période de paiement.");
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
            <h1 className="text-2xl font-bold text-[#0f1724]">Modifier l&apos;annonce</h1>
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Localisation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Adresse" {...register("address")} />
            <Input label="Quartier" {...register("neighborhood")} />
            <Input label="Ville *" error={errors.city?.message} {...register("city")} />
            <Input label="Code postal" {...register("postal_code")} />
            <Input label="Latitude" type="number" step="any" {...register("latitude", { valueAsNumber: true })} />
            <Input label="Longitude" type="number" step="any" {...register("longitude", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Médias (URL)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="URL image principale"
              type="url"
              placeholder="https://exemple.com/image.jpg"
              {...register("main_image_url")}
            />
            <Input
              label="URL vidéo"
              type="url"
              placeholder="https://exemple.com/video.mp4 ou https://youtube.com/..."
              {...register("video_url")}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link href="/dashboard/annonces" className="w-full sm:w-auto">
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
