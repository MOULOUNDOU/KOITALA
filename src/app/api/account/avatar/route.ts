import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

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

async function ensureAvatarBucket() {
  const adminSupabase = await createAdminClient();
  const { data: bucket, error } = await adminSupabase.storage.getBucket(AVATAR_BUCKET);

  if (error) {
    const shouldCreate = error.message.toLowerCase().includes("not found");

    if (!shouldCreate) {
      return { adminSupabase, error: error.message };
    }

    const { error: createError } = await adminSupabase.storage.createBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: MAX_AVATAR_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (createError) {
      return { adminSupabase, error: createError.message };
    }

    return { adminSupabase, error: null as string | null };
  }

  if (!bucket.public) {
    const { error: updateError } = await adminSupabase.storage.updateBucket(AVATAR_BUCKET, {
      public: true,
      fileSizeLimit: MAX_AVATAR_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (updateError) {
      return { adminSupabase, error: updateError.message };
    }
  }

  return { adminSupabase, error: null as string | null };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(fileEntry.type)) {
    return NextResponse.json(
      { error: "Format non pris en charge. Utilisez JPG, PNG, WEBP ou HEIC." },
      { status: 400 }
    );
  }

  if (fileEntry.size > MAX_AVATAR_SIZE_BYTES) {
    return NextResponse.json(
      { error: "La photo de profil ne doit pas dépasser 5 MB." },
      { status: 400 }
    );
  }

  const { adminSupabase, error: bucketError } = await ensureAvatarBucket();

  if (bucketError) {
    return NextResponse.json(
      { error: `Impossible d'initialiser le bucket avatars: ${bucketError}` },
      { status: 500 }
    );
  }

  const extension = getFileExtension(fileEntry);
  const objectPath = `${user.id}/avatar-${Date.now()}.${extension}`;
  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());

  const { error: uploadError } = await adminSupabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, fileBuffer, {
      upsert: true,
      contentType: fileEntry.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = adminSupabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);

  return NextResponse.json({ publicUrl: data.publicUrl }, { status: 201 });
}
