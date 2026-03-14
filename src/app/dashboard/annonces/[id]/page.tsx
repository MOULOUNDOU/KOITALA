"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { propertySchema, type PropertyInput } from "@/lib/validations";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
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
const STATUSES = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
  { value: "vendu", label: "Vendu" },
  { value: "loue", label: "Loué" },
  { value: "archive", label: "Archivé" },
];

export default function EditAnnoncePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({ resolver: zodResolver(propertySchema) });

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) reset(data);
        setLoading(false);
      });
  }, [params.id, supabase, reset]);

  const onSubmit = async (data: PropertyInput) => {
    const { error } = await supabase
      .from("properties")
      .update(data)
      .eq("id", params.id);
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/annonces" className="p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f1724]">Modifier l&apos;annonce</h1>
            <p className="text-sm text-gray-500 mt-0.5">Mettez à jour les informations du bien</p>
          </div>
        </div>
        <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
          <Trash2 className="w-4 h-4" /> Supprimer
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-[#0f1724]">Informations générales</h2>
          <Input label="Titre *" error={errors.title?.message} {...register("title")} />
          <Textarea label="Description" rows={5} {...register("description")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Type de bien *" options={PROPERTY_TYPES} error={errors.property_type?.message} {...register("property_type")} />
            <Select label="Type d'annonce *" options={LISTING_TYPES} error={errors.listing_type?.message} {...register("listing_type")} />
            <Select label="Statut *" options={STATUSES} error={errors.status?.message} {...register("status")} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Prix & caractéristiques</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Prix (XOF) *" type="number" error={errors.price?.message} {...register("price", { valueAsNumber: true })} />
            <Input label="Surface (m²)" type="number" {...register("area", { valueAsNumber: true })} />
            <Input label="Chambres" type="number" min={0} {...register("bedrooms", { valueAsNumber: true })} />
            <Input label="Salles de bain" type="number" min={0} {...register("bathrooms", { valueAsNumber: true })} />
          </div>
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

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/annonces"><Button type="button" variant="ghost">Annuler</Button></Link>
          <Button type="submit" loading={isSubmitting} size="lg">
            <Save className="w-4 h-4" /> Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
