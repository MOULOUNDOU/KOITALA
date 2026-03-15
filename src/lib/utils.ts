import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Property } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatNumberFR(n: number): string {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPrice(price: number, currency = "XOF"): string {
  const formatted = formatNumberFR(price);
  if (currency === "XOF") {
    return `${formatted} FCFA`;
  }
  return `${formatted} ${currency}`;
}

export function formatArea(area: number): string {
  return `${formatNumberFR(area)} m\u00B2`;
}

const MONTHS_FR = [
  "janvier", "f\u00E9vrier", "mars", "avril", "mai", "juin",
  "juillet", "ao\u00FBt", "septembre", "octobre", "novembre", "d\u00E9cembre",
];

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    appartement: "Appartement",
    maison: "Maison",
    terrain: "Terrain",
    bureau: "Bureau",
    local_commercial: "Local commercial",
    villa: "Villa",
    duplex: "Duplex",
  };
  return labels[type] ?? type;
}

export function getListingTypeLabel(type: string): string {
  return type === "vente" ? "Vente" : "Location";
}

export function getRentalCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const labels: Record<string, string> = {
    chambre_meublee: "Chambre meublée",
    studio: "Studio",
    appartement: "Appartement",
    mini_studio: "Mini studio",
    colocation: "Colocation",
  };
  return labels[category] ?? category;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    brouillon: "Brouillon",
    publie: "Publié",
    vendu: "Vendu",
    loue: "Loué",
    archive: "Archivé",
    en_attente: "En attente",
    confirme: "Confirmé",
    annule: "Annulé",
    realise: "Réalisé",
    nouveau: "Nouveau",
    lu: "Lu",
    traite: "Traité",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    publie: "bg-[#1a3a5c]/15 text-[#1a3a5c]",
    brouillon: "bg-gray-100 text-gray-600",
    vendu: "bg-[#e8b86d]/25 text-[#1a3a5c]",
    loue: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    archive: "bg-[#0f2540]/10 text-[#0f2540]",
    en_attente: "bg-[#e8b86d]/25 text-[#1a3a5c]",
    confirme: "bg-[#e8b86d]/25 text-[#1a3a5c]",
    annule: "bg-[#0f2540]/10 text-[#0f2540]",
    realise: "bg-[#e8b86d]/25 text-[#1a3a5c]",
    nouveau: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
    lu: "bg-gray-100 text-gray-600",
    traite: "bg-[#e8b86d]/25 text-[#1a3a5c]",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getFakeRating(seed: string): { rating: string; reviews: number } {
  const value = seed || "koitala";
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash += value.charCodeAt(i) * (i + 1);
  }

  const rating = (4.2 + (hash % 7) * 0.1).toFixed(1);
  const reviews = 24 + (hash % 140);

  return { rating, reviews };
}

export function getPropertyImageUrls(
  property: Pick<Property, "main_image_url" | "property_images">,
  fallbackUrl = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80"
): string[] {
  const orderedGalleryUrls = (property.property_images ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_main !== b.is_main) {
        return a.is_main ? -1 : 1;
      }
      return a.order_index - b.order_index;
    })
    .map((img) => img.url)
    .filter(Boolean);

  const rawUrls = [property.main_image_url, ...orderedGalleryUrls].filter(
    (url): url is string => Boolean(url)
  );

  const uniqueUrls = Array.from(new Set(rawUrls));

  return uniqueUrls.length > 0 ? uniqueUrls : [fallbackUrl];
}

export function hasPropertyImageMedia(
  property: Pick<Property, "main_image_url" | "property_images">
): boolean {
  return Boolean(property.main_image_url) || (property.property_images?.some((img) => Boolean(img.url)) ?? false);
}

export function isDirectVideoUrl(videoUrl?: string | null): boolean {
  if (!videoUrl) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i.test(videoUrl);
}

export function getEmbeddedVideoUrl(videoUrl?: string | null): string | null {
  if (!videoUrl) return null;

  try {
    const parsedUrl = new URL(videoUrl);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
    }

    if (hostname.endsWith("youtube.com")) {
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      const watchVideoId = parsedUrl.searchParams.get("v");
      const embeddedVideoId =
        pathSegments[0] === "embed" || pathSegments[0] === "shorts"
          ? pathSegments[1]
          : watchVideoId;

      return embeddedVideoId
        ? `https://www.youtube.com/embed/${embeddedVideoId}?rel=0&modestbranding=1`
        : null;
    }

    if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
