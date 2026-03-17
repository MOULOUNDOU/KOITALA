import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AIAdminActionProposal } from "@/lib/ai/types";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROPERTY_TYPES = [
  "appartement",
  "maison",
  "villa",
  "terrain",
  "bureau",
  "local_commercial",
  "duplex",
] as const;
const LISTING_TYPES = ["vente", "location"] as const;
const STATUSES = ["brouillon", "publie", "vendu", "loue", "archive"] as const;
const RENTAL_CATEGORIES = [
  "chambre_meublee",
  "studio",
  "appartement",
  "mini_studio",
  "colocation",
] as const;
const RENT_PAYMENT_PERIODS = ["jour", "mois"] as const;

interface AdminActionRequestBody {
  action?: AIAdminActionProposal;
  confirm?: boolean;
}

interface PropertyTarget {
  id: string;
  title: string;
  slug: string;
  status: string;
}

function cleanText(value: string, maxLength = 220): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toOptionalString(value: unknown, maxLength = 220): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value, maxLength);
  return cleaned || undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "oui", "yes"].includes(normalized)) return true;
  if (["false", "0", "non", "no"].includes(normalized)) return false;
  return undefined;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return allowed.find((item) => item === normalized);
}

function sanitizeAction(raw: unknown): AIAdminActionProposal | null {
  if (!raw || typeof raw !== "object") return null;

  const typeValue = Reflect.get(raw, "type");
  const type =
    typeValue === "update_property" || typeValue === "delete_property" ? typeValue : null;
  if (!type) return null;

  const propertyIdRaw = Reflect.get(raw, "propertyId");
  const propertyId =
    typeof propertyIdRaw === "string" && UUID_REGEX.test(propertyIdRaw.trim())
      ? propertyIdRaw.trim()
      : undefined;

  const propertySlug = toOptionalString(Reflect.get(raw, "propertySlug"), 140);
  const propertyQuery = toOptionalString(Reflect.get(raw, "propertyQuery"), 200);
  const confirmationMessage = toOptionalString(Reflect.get(raw, "confirmationMessage"), 220);

  let updates: Record<string, unknown> | undefined;
  if (type === "update_property") {
    const rawUpdates = Reflect.get(raw, "updates");
    if (rawUpdates && typeof rawUpdates === "object" && !Array.isArray(rawUpdates)) {
      updates = rawUpdates as Record<string, unknown>;
    }
  }

  if (!propertyId && !propertySlug && !propertyQuery) {
    return null;
  }

  return {
    type,
    propertyId,
    propertySlug,
    propertyQuery,
    updates,
    confirmationMessage,
  };
}

async function resolveAdminAccess(): Promise<{ allowed: boolean; status: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { allowed: false, status: 401 };
  }

  let hasAdminRole = false;
  const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (!rpcError && typeof rpcIsAdmin === "boolean") {
    hasAdminRole = rpcIsAdmin;
  }

  if (!hasAdminRole) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileById?.role === "admin") {
      hasAdminRole = true;
    } else if (user.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();
      hasAdminRole = profileByEmail?.role === "admin";
    }
  }

  return { allowed: hasAdminRole, status: hasAdminRole ? 200 : 403 };
}

async function resolvePropertyTarget(action: AIAdminActionProposal): Promise<{
  property: PropertyTarget | null;
  error?: string;
  status?: number;
}> {
  const supabase = await createClient();

  if (action.propertyId) {
    const { data, error } = await supabase
      .from("properties")
      .select("id,title,slug,status")
      .eq("id", action.propertyId)
      .maybeSingle();

    if (error) return { property: null, error: "Impossible de lire l'annonce.", status: 500 };
    if (!data) return { property: null, error: "Annonce introuvable avec cet ID.", status: 404 };
    return { property: data as PropertyTarget };
  }

  if (action.propertySlug) {
    const { data, error } = await supabase
      .from("properties")
      .select("id,title,slug,status")
      .eq("slug", action.propertySlug)
      .maybeSingle();

    if (error) return { property: null, error: "Impossible de lire l'annonce.", status: 500 };
    if (!data) return { property: null, error: "Annonce introuvable avec ce slug.", status: 404 };
    return { property: data as PropertyTarget };
  }

  const query = cleanText(action.propertyQuery ?? "", 200).replace(/[,%()'"`]/g, " ").trim();
  if (!query) {
    return { property: null, error: "Référence d'annonce manquante.", status: 400 };
  }

  const { data, error } = await supabase
    .from("properties")
    .select("id,title,slug,status")
    .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
    .limit(3);

  if (error) {
    return { property: null, error: "Impossible de rechercher l'annonce.", status: 500 };
  }

  if (!data || data.length === 0) {
    return { property: null, error: "Aucune annonce ne correspond à cette référence.", status: 404 };
  }

  if (data.length > 1) {
    return {
      property: null,
      error: "Référence ambiguë: plusieurs annonces trouvées. Précisez l'ID ou le slug.",
      status: 409,
    };
  }

  return { property: data[0] as PropertyTarget };
}

function buildUpdatePayload(rawUpdates: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!rawUpdates) return {};

  const payload: Record<string, unknown> = {};

  const title = toOptionalString(rawUpdates.title, 140);
  if (title) payload.title = title;

  const description = toOptionalString(rawUpdates.description, 4000);
  if (description) payload.description = description;

  const status = pickEnum(rawUpdates.status, STATUSES);
  if (status) payload.status = status;

  const propertyType = pickEnum(rawUpdates.property_type, PROPERTY_TYPES);
  if (propertyType) payload.property_type = propertyType;

  const listingType = pickEnum(rawUpdates.listing_type, LISTING_TYPES);
  if (listingType) {
    payload.listing_type = listingType;
    if (listingType === "vente") {
      payload.rental_category = null;
      payload.rent_payment_period = null;
    }
  }

  const rentalCategory = pickEnum(rawUpdates.rental_category, RENTAL_CATEGORIES);
  if (rentalCategory) payload.rental_category = rentalCategory;
  if (rawUpdates.rental_category === null) payload.rental_category = null;

  const rentPaymentPeriod = pickEnum(rawUpdates.rent_payment_period, RENT_PAYMENT_PERIODS);
  if (rentPaymentPeriod) payload.rent_payment_period = rentPaymentPeriod;
  if (rawUpdates.rent_payment_period === null) payload.rent_payment_period = null;

  const city = toOptionalString(rawUpdates.city, 80);
  if (city) payload.city = city;

  const neighborhood = toOptionalString(rawUpdates.neighborhood, 120);
  if (neighborhood) payload.neighborhood = neighborhood;

  const address = toOptionalString(rawUpdates.address, 180);
  if (address) payload.address = address;

  const postalCode = toOptionalString(rawUpdates.postal_code, 30);
  if (postalCode) payload.postal_code = postalCode;

  const country = toOptionalString(rawUpdates.country, 60);
  if (country) payload.country = country;

  const mainImageUrl = toOptionalString(rawUpdates.main_image_url, 600);
  if (mainImageUrl) payload.main_image_url = mainImageUrl;
  if (rawUpdates.main_image_url === null) payload.main_image_url = null;

  const price = toOptionalNumber(rawUpdates.price);
  if (price !== undefined) payload.price = price;

  const area = toOptionalNumber(rawUpdates.area);
  if (area !== undefined) payload.area = area;

  const bedrooms = toOptionalNumber(rawUpdates.bedrooms);
  if (bedrooms !== undefined) payload.bedrooms = bedrooms;

  const bathrooms = toOptionalNumber(rawUpdates.bathrooms);
  if (bathrooms !== undefined) payload.bathrooms = bathrooms;

  const isFeatured = toOptionalBoolean(rawUpdates.is_featured);
  if (isFeatured !== undefined) payload.is_featured = isFeatured;

  const isFurnished = toOptionalBoolean(rawUpdates.is_furnished);
  if (isFurnished !== undefined) payload.is_furnished = isFurnished;

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const adminAccess = await resolveAdminAccess();
    if (!adminAccess.allowed) {
      return NextResponse.json(
        {
          error:
            adminAccess.status === 401
              ? "Authentification requise pour exécuter une action admin."
              : "Accès refusé: action réservée aux administrateurs.",
        },
        { status: adminAccess.status }
      );
    }

    const rawBody = (await request.json().catch(() => null)) as AdminActionRequestBody | null;
    const confirm = Boolean(rawBody?.confirm);
    if (!confirm) {
      return NextResponse.json(
        { error: "Confirmation explicite requise avant exécution." },
        { status: 400 }
      );
    }

    const action = sanitizeAction(rawBody?.action);
    if (!action) {
      return NextResponse.json(
        { error: "Action admin invalide ou incomplète." },
        { status: 400 }
      );
    }

    const target = await resolvePropertyTarget(action);
    if (!target.property) {
      return NextResponse.json(
        { error: target.error ?? "Annonce introuvable." },
        { status: target.status ?? 404 }
      );
    }

    const supabase = await createClient();

    if (action.type === "delete_property") {
      const { data, error } = await supabase
        .from("properties")
        .delete()
        .eq("id", target.property.id)
        .select("id,title,slug")
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: "Suppression impossible pour cette annonce." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "delete_property",
        property: data ?? {
          id: target.property.id,
          title: target.property.title,
          slug: target.property.slug,
        },
        message: `Annonce supprimée: ${target.property.title}.`,
      });
    }

    const updatePayload = buildUpdatePayload(action.updates);
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Aucune mise à jour exploitable n'a été fournie." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("properties")
      .update(updatePayload)
      .eq("id", target.property.id)
      .select("id,title,slug,status,updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Modification impossible pour cette annonce." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "update_property",
      property: data,
      message: `Annonce mise à jour: ${data.title}.`,
      updatedFields: Object.keys(updatePayload),
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur pendant l'exécution de l'action IA." },
      { status: 500 }
    );
  }
}
