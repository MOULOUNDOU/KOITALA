"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Eye,
  ImageIcon,
  MapPinned,
  Pencil,
  Plus,
  Save,
  Trash2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, generateSlug, getStatusColor, getStatusLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Realisation, RealisationStatus } from "@/types";

type RealisationFormState = {
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  image_alt: string;
  image_credit: string;
  image_source: string;
  completed_at: string;
  status: RealisationStatus;
  sort_order: string;
};

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
  { value: "archive", label: "Archivé" },
];

function createInitialForm(): RealisationFormState {
  return {
    title: "",
    description: "",
    category: "",
    location: "",
    image_url: "",
    image_alt: "",
    image_credit: "",
    image_source: "",
    completed_at: "",
    status: "brouillon",
    sort_order: "0",
  };
}

function normalizeOptionalText(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function createUploadToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Math.floor(Math.random() * 1_000_000_000)}`;
}

function parseSortOrder(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export default function DashboardRealisationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RealisationFormState>(createInitialForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const displayedImage = imagePreview || form.image_url.trim() || null;
  const publishedCount = realisations.filter((item) => item.status === "publie").length;
  const draftCount = realisations.filter((item) => item.status === "brouillon").length;

  const fetchRealisations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("realisations")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setRealisations([]);
      setErrorMessage("Impossible de charger les réalisations. Vérifiez que la table Supabase realisations existe.");
    } else {
      setRealisations((data as Realisation[] | null) ?? []);
      setErrorMessage(null);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchRealisations();
  }, [fetchRealisations]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const resetImageState = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const openCreateForm = () => {
    resetImageState();
    setEditingId(null);
    setForm(createInitialForm());
    setShowForm(true);
  };

  const openEditForm = (realisation: Realisation) => {
    resetImageState();
    setEditingId(realisation.id);
    setForm({
      title: realisation.title,
      description: realisation.description,
      category: realisation.category ?? "",
      location: realisation.location ?? "",
      image_url: realisation.image_url ?? "",
      image_alt: realisation.image_alt ?? "",
      image_credit: realisation.image_credit ?? "",
      image_source: realisation.image_source ?? "",
      completed_at: toDateInputValue(realisation.completed_at),
      status: realisation.status,
      sort_order: String(realisation.sort_order ?? 0),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    resetImageState();
    setEditingId(null);
    setForm(createInitialForm());
    setShowForm(false);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("L'image ne doit pas dépasser 10 MB.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);
    setForm((current) => ({ ...current, image_url: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Le titre et la description sont obligatoires.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const baseSlug = generateSlug(form.title) || "realisation";
      const slug = editingId
        ? realisations.find((item) => item.id === editingId)?.slug ?? `${baseSlug}-${Date.now()}`
        : `${baseSlug}-${Date.now()}`;

      let imageUrl = normalizeOptionalText(form.image_url);

      if (imageFile) {
        const extension = imageFile.name.split(".").pop() || "jpg";
        const imagePath = `realisations/${slug}/image-${createUploadToken()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("realisation-images")
          .upload(imagePath, imageFile);

        if (uploadError) {
          toast.error("L'envoi de l'image a échoué. Vérifiez le bucket realisation-images.");
          return;
        }

        const { data: publicUrl } = supabase.storage
          .from("realisation-images")
          .getPublicUrl(imagePath);
        imageUrl = publicUrl.publicUrl;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: normalizeOptionalText(form.category),
        location: normalizeOptionalText(form.location),
        image_url: imageUrl,
        image_alt: normalizeOptionalText(form.image_alt) ?? form.title.trim(),
        image_credit: normalizeOptionalText(form.image_credit),
        image_source: normalizeOptionalText(form.image_source),
        completed_at: form.completed_at || null,
        status: form.status,
        sort_order: parseSortOrder(form.sort_order),
      };

      const { error } = editingId
        ? await supabase.from("realisations").update(payload).eq("id", editingId)
        : await supabase.from("realisations").insert({
            ...payload,
            slug,
            created_by: user.id,
          });

      if (error) {
        toast.error(editingId ? "Erreur lors de la modification." : "Erreur lors de la création.");
        return;
      }

      await fetchRealisations();
      closeForm();
      toast.success(editingId ? "Réalisation modifiée." : "Réalisation ajoutée.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (realisation: Realisation) => {
    if (!confirm(`Supprimer définitivement "${realisation.title}" ?`)) return;

    setDeletingId(realisation.id);
    const { error } = await supabase.from("realisations").delete().eq("id", realisation.id);
    setDeletingId(null);

    if (error) {
      toast.error("Erreur lors de la suppression.");
      return;
    }

    if (editingId === realisation.id) {
      closeForm();
    }

    await fetchRealisations();
    toast.success("Réalisation supprimée.");
  };

  return (
    <div className="mx-auto max-w-7xl p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1a3a5c]/60">
            Vitrine publique
          </p>
          <h1 className="mt-1 text-[1.4rem] font-bold text-[#0f1724] sm:text-[1.6rem] lg:text-3xl">
            Réalisation
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {realisations.length} au total
            </span>
            <span className="inline-flex items-center rounded-full border border-[#1a3a5c]/10 bg-[#1a3a5c]/5 px-3 py-1 text-xs font-semibold text-[#1a3a5c]">
              {publishedCount} publiée{publishedCount > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              {draftCount} brouillon{draftCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:flex lg:items-center">
          <Link
            href="/nos-realisations"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1a3a5c]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1a3a5c] transition-all hover:bg-[#1a3a5c]/5"
          >
            <Eye className="h-4 w-4" />
            Voir la page
          </Link>
          <Button onClick={openCreateForm} className="rounded-2xl px-5 py-3">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0f1724]">
                {editingId ? "Modifier la réalisation" : "Nouvelle réalisation"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Les éléments publiés apparaissent automatiquement sur le site.
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 sm:self-start"
              aria-label="Fermer le formulaire"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Titre"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Commercialisation d'un programme résidentiel"
              required
            />
            <Input
              label="Catégorie"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Vente, Location, Conseil..."
            />
            <Input
              label="Localisation"
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Dakar, Almadies, Sénégal..."
              icon={<MapPinned className="h-4 w-4" />}
            />
            <Input
              label="Date de réalisation"
              type="date"
              value={form.completed_at}
              onChange={(event) => setForm((current) => ({ ...current, completed_at: event.target.value }))}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <Select
              label="Statut"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as RealisationStatus }))
              }
              options={STATUS_OPTIONS}
            />
            <Input
              label="Ordre d'affichage"
              type="number"
              value={form.sort_order}
              onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
              min={0}
              step={1}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Décrivez le projet, l'accompagnement et le résultat obtenu."
              className="lg:col-span-2"
              required
            />
          </div>

          <div className="mt-5 grid gap-4 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Image</p>
              {displayedImage ? (
                <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayedImage}
                    alt={form.image_alt || form.title || "Image de réalisation"}
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                    aria-label="Retirer l&apos;image"
                    title="Retirer l&apos;image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center transition-colors hover:border-[#1a3a5c]/40 hover:bg-gray-50">
                  <Upload className="mb-2 h-8 w-8 text-gray-300" />
                  <span className="text-sm font-medium text-gray-600">Ajouter une image</span>
                  <span className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP jusqu&apos;à 10 MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              {displayedImage && (
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540]">
                  <Upload className="h-4 w-4" />
                  Remplacer l&apos;image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Image (URL)"
                value={form.image_url}
                onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                placeholder="https://..."
                className="sm:col-span-2"
              />
              <Input
                label="Texte alternatif"
                value={form.image_alt}
                onChange={(event) => setForm((current) => ({ ...current, image_alt: event.target.value }))}
                placeholder="Description courte de l'image"
              />
              <Input
                label="Crédit image"
                value={form.image_credit}
                onChange={(event) => setForm((current) => ({ ...current, image_credit: event.target.value }))}
                placeholder="Photo : ..."
              />
              <Input
                label="Lien source image"
                value={form.image_source}
                onChange={(event) => setForm((current) => ({ ...current, image_source: event.target.value }))}
                placeholder="https://..."
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" onClick={closeForm} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4" />
              {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      )}

      <div className="hidden overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:block">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
          </div>
        ) : realisations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="mb-3 h-14 w-14 text-gray-200" />
            <p className="font-medium text-gray-600">Aucune réalisation pour le moment.</p>
            <p className="mt-1 text-sm text-gray-400">Ajoutez une première réalisation pour alimenter le site.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Réalisation
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Statut
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ordre
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {realisations.map((realisation) => (
                <tr key={realisation.id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#1a3a5c]/10">
                        {realisation.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={realisation.image_url}
                            alt={realisation.image_alt || realisation.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-[#1a3a5c]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#0f1724]">{realisation.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {realisation.category && <span>{realisation.category}</span>}
                          {realisation.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPinned className="h-3.5 w-3.5" />
                              {realisation.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(realisation.status)}`}>
                      {getStatusLabel(realisation.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {realisation.completed_at ? formatDate(realisation.completed_at) : "Non renseignée"}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{realisation.sort_order}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditForm(realisation)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-[#1a3a5c]/10 hover:text-[#1a3a5c]"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(realisation)}
                        disabled={deletingId === realisation.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid gap-4 md:hidden">
        {loading ? (
          <div className="flex justify-center rounded-3xl border border-gray-100 bg-white py-16 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
          </div>
        ) : realisations.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-gray-200" />
            <p className="font-medium text-gray-600">Aucune réalisation pour le moment.</p>
          </div>
        ) : (
          realisations.map((realisation) => (
            <article key={`${realisation.id}-mobile`} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="flex aspect-video items-center justify-center bg-[#1a3a5c]/10">
                {realisation.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={realisation.image_url}
                    alt={realisation.image_alt || realisation.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-[#1a3a5c]" />
                )}
              </div>
              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(realisation.status)}`}>
                    {getStatusLabel(realisation.status)}
                  </span>
                  {realisation.category && (
                    <span className="rounded-full bg-[#1a3a5c]/10 px-2.5 py-1 text-xs font-semibold text-[#1a3a5c]">
                      {realisation.category}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-[#0f1724]">{realisation.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">{realisation.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  {realisation.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPinned className="h-3.5 w-3.5" />
                      {realisation.location}
                    </span>
                  )}
                  {realisation.completed_at && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(realisation.completed_at)}
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEditForm(realisation)}>
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={deletingId === realisation.id}
                    onClick={() => void handleDelete(realisation)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
