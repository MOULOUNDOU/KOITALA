"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Upload, X, Plus, Video } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { propertySchema, type PropertyInput } from "@/lib/validations";
import { generateSlug } from "@/lib/utils";
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

const DEFAULT_FEATURES = [
  "Balcon", "Parking", "Piscine", "Terrasse", "Climatisation",
  "Jardin", "Gardien", "Ascenseur", "Internet", "Meublé",
];

export default function NouvelleAnnoncePage() {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; file?: File; is_main: boolean }[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");

  const MAX_IMAGES = 5;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      status: "brouillon",
      listing_type: "vente",
      property_type: "appartement",
      country: "Sénégal",
      is_featured: false,
      is_furnished: false,
    },
  });

  const title = watch("title");

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
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("La vidéo ne doit pas dépasser 100 MB");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
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

  const onSubmit = async (data: PropertyInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Non authentifié"); return; }

    const slug = generateSlug(data.title) + "-" + Date.now();

    // Insert property
    const { data: property, error } = await supabase
      .from("properties")
      .insert({ ...data, slug, created_by: user.id })
      .select()
      .single();

    if (error || !property) { toast.error("Erreur lors de la création"); return; }

    // Upload images
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.file) continue;
        const ext = img.file.name.split(".").pop();
        const path = `properties/${property.id}/${Date.now()}-${i}.${ext}`;
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
    }

    // Upload video
    if (videoFile) {
      const ext = videoFile.name.split(".").pop();
      const videoPath = `properties/${property.id}/video-${Date.now()}.${ext}`;
      const { data: videoUploaded } = await supabase.storage
        .from("property-videos")
        .upload(videoPath, videoFile, { upsert: true });
      if (videoUploaded) {
        const { data: videoPublicUrl } = supabase.storage
          .from("property-videos")
          .getPublicUrl(videoPath);
        await supabase
          .from("properties")
          .update({ video_url: videoPublicUrl.publicUrl })
          .eq("id", property.id);
      }
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-7">
        <Link
          href="/dashboard/annonces"
          className="p-2 text-gray-500 hover:text-[#1a3a5c] hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0f1724]">Nouvelle annonce</h1>
          <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations du bien</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Informations générales</h2>
          <div className="space-y-5">
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
              <Select
                label="Type de bien *"
                options={PROPERTY_TYPES}
                error={errors.property_type?.message}
                {...register("property_type")}
              />
              <Select
                label="Type d'annonce *"
                options={LISTING_TYPES}
                error={errors.listing_type?.message}
                {...register("listing_type")}
              />
              <Select
                label="Statut *"
                options={STATUSES}
                error={errors.status?.message}
                {...register("status")}
              />
            </div>
          </div>
        </div>

        {/* Price & details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Prix & caractéristiques</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Prix (XOF) *"
              type="number"
              placeholder="50000000"
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />
            <Input
              label="Surface (m²)"
              type="number"
              placeholder="120"
              {...register("area", { valueAsNumber: true })}
            />
            <Input
              label="Chambres"
              type="number"
              placeholder="3"
              min={0}
              {...register("bedrooms", { valueAsNumber: true })}
            />
            <Input
              label="Salles de bain"
              type="number"
              placeholder="2"
              min={0}
              {...register("bathrooms", { valueAsNumber: true })}
            />
          </div>
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

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Localisation</h2>
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
              {...register("latitude", { valueAsNumber: true })}
            />
            <Input
              label="Longitude (GPS)"
              type="number"
              step="any"
              placeholder="-17.4677"
              {...register("longitude", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#0f1724]">Photos du bien</h2>
            <span className={`text-xs font-medium ${images.length >= MAX_IMAGES ? 'text-red-500' : 'text-gray-400'}`}>
              {images.length}/{MAX_IMAGES} photos
            </span>
          </div>
          <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors ${images.length >= MAX_IMAGES ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50' : 'border-gray-200 cursor-pointer hover:border-[#1a3a5c]/50 hover:bg-gray-50'}`}>
            <Upload className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-sm text-gray-500">
              {images.length >= MAX_IMAGES ? 'Limite de photos atteinte' : 'Cliquez pour ajouter des photos'}
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
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-400 mt-2">{videoFile?.name} ({(videoFile!.size / (1024 * 1024)).toFixed(1)} MB)</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-[#0f1724] mb-5">Caractéristiques</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEFAULT_FEATURES.map((feat) => (
              <button
                key={feat}
                type="button"
                onClick={() => toggleFeature(feat)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
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
            <Button type="button" variant="outline" size="sm" onClick={addCustomFeature}>
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

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/annonces">
            <Button type="button" variant="ghost">Annuler</Button>
          </Link>
          <Button type="submit" loading={isSubmitting} size="lg">
            <Save className="w-4 h-4" /> Enregistrer l&apos;annonce
          </Button>
        </div>
      </form>
    </div>
  );
}

