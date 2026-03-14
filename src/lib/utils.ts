import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
    publie: "bg-green-100 text-green-700",
    brouillon: "bg-gray-100 text-gray-600",
    vendu: "bg-blue-100 text-blue-700",
    loue: "bg-purple-100 text-purple-700",
    archive: "bg-red-100 text-red-700",
    en_attente: "bg-yellow-100 text-yellow-700",
    confirme: "bg-green-100 text-green-700",
    annule: "bg-red-100 text-red-700",
    realise: "bg-blue-100 text-blue-700",
    nouveau: "bg-blue-100 text-blue-700",
    lu: "bg-gray-100 text-gray-600",
    traite: "bg-green-100 text-green-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
