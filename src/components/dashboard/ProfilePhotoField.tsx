"use client";

import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import { isValidHttpUrl } from "@/lib/accountSettings";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

function getFileExtension(file: File): string {
  const filenameExtension = file.name.split(".").pop()?.trim().toLowerCase();
  if (filenameExtension) return filenameExtension;

  const mimeToExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };

  return mimeToExtension[file.type] ?? "jpg";
}

interface ProfilePhotoFieldProps {
  userId?: string | null;
  fullName: string;
  avatarUrl: string;
  onAvatarUrlChange: (nextUrl: string) => void;
  previewTitle: string;
  previewDescription: string;
}

export default function ProfilePhotoField({
  userId,
  fullName,
  avatarUrl,
  onAvatarUrlChange,
  previewTitle,
  previewDescription,
}: ProfilePhotoFieldProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasAvatarPreview = Boolean(avatarUrl) && isValidHttpUrl(avatarUrl) && !previewError;

  const updateAvatarUrl = (nextUrl: string) => {
    setPreviewError(false);
    onAvatarUrlChange(nextUrl);
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    if (!userId) {
      toast.error("Impossible d'associer la photo au compte.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error("La photo de profil ne doit pas dépasser 5 MB.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file, `avatar.${getFileExtension(file)}`);

    const response = await fetch("/api/account/avatar", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; publicUrl?: string }
      | null;

    setUploading(false);

    if (!response.ok || !payload?.publicUrl) {
      toast.error(`Upload impossible: ${payload?.error ?? "Erreur serveur"}`);
      return;
    }

    updateAvatarUrl(payload.publicUrl);
    toast.success("Photo importée. Cliquez sur Enregistrer pour la valider.");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    void handleFileUpload(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-gray-200 bg-[#f8fafc] p-4">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#1a3a5c]/10 text-2xl font-bold text-[#1a3a5c]">
            {hasAvatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={avatarUrl}
                src={avatarUrl}
                alt={fullName}
                className="h-full w-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0f1724]">{previewTitle}</p>
            <p className="mt-1 text-xs text-gray-500">{previewDescription}</p>
          </div>
        </div>
      </div>

      <Input
        label="URL de l'avatar"
        type="url"
        value={avatarUrl}
        placeholder="https://..."
        onChange={(event) => updateAvatarUrl(event.target.value)}
      />

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading || !userId}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
        >
          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {uploading ? "Envoi..." : "Prendre une photo"}
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading || !userId}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1a3a5c]/20 bg-white px-3 py-2.5 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:py-3 sm:text-sm"
        >
          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Choisir depuis l&apos;appareil
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Sur mobile, le bouton photo peut ouvrir directement l&apos;appareil photo. Formats image acceptés, 5 MB max.
      </p>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
