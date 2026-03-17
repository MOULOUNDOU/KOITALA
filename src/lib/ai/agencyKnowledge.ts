import { AGENCY_INFO } from "@/lib/agency";

const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://koitala.com";

const AGENCY_SERVICES = [
  "Achat et vente de biens immobiliers",
  "Location (longue duree et formats adaptes selon le bien)",
  "Construction cle en main",
  "Gestion locative",
  "Estimation immobiliere",
  "Conseil juridique immobilier",
  "Accompagnement dedie residents et expatries",
] as const;

const PROPERTY_CATEGORIES = [
  "Appartement",
  "Maison",
  "Villa",
  "Terrain",
  "Bureau",
  "Local commercial",
  "Duplex",
] as const;

const RENTAL_SUB_CATEGORIES = [
  "Chambre meublee",
  "Studio",
  "Appartement",
  "Mini studio",
  "Colocation",
] as const;

const COVERAGE_AREAS = [
  "Dakar (zone principale)",
  "Senegal (accompagnement possible selon projet)",
] as const;

const WEBSITE_FEATURES = [
  "Recherche de biens avec filtres sur /biens (achat, location, type, ville, quartier, budget...)",
  "Fiche detaillee pour chaque annonce avec medias et localisation quand disponible",
  "Formulaire de contact sur /contact",
  "Demandes de visite directement depuis les annonces",
  "Espace client (favoris, suivi des demandes/messages)",
  "Dashboard admin de gestion annonces, demandes, messages et blog",
] as const;

const UNPUBLISHED_INFORMATION = [
  "Horaires d ouverture non explicitement publies dans l application",
  "Liens reseaux sociaux non renseignes (icones presentes mais URLs non configurees)",
] as const;

function renderBulletList(title: string, values: readonly string[]): string {
  return `${title}:\n${values.map((value) => `- ${value}`).join("\n")}`;
}

export function buildAgencyKnowledgeContext(): string {
  const mapLink = `https://www.google.com/maps?q=${AGENCY_INFO.latitude},${AGENCY_INFO.longitude}`;

  const identityBlock = [
    "Identite et contact:",
    `- Nom commercial: ${AGENCY_INFO.name}`,
    `- Raison sociale: ${AGENCY_INFO.legalName}`,
    `- Telephone principal: ${AGENCY_INFO.phone}`,
    `- Telephone secondaire: ${AGENCY_INFO.secondaryPhone}`,
    `- Email: ${AGENCY_INFO.email}`,
    `- Adresse: ${AGENCY_INFO.addressLine1}, ${AGENCY_INFO.addressLine2}`,
    `- Coordonnees GPS: ${AGENCY_INFO.latitude}, ${AGENCY_INFO.longitude}`,
    `- Lien carte: ${mapLink}`,
    `- Site web: ${WEBSITE_URL}`,
  ].join("\n");

  return [
    identityBlock,
    renderBulletList("Services proposes", AGENCY_SERVICES),
    renderBulletList("Types de biens traites", PROPERTY_CATEGORIES),
    renderBulletList("Sous-categories location gerees", RENTAL_SUB_CATEGORIES),
    renderBulletList("Zones de couverture", COVERAGE_AREAS),
    renderBulletList("Fonctionnalites principales du site", WEBSITE_FEATURES),
    renderBulletList("Informations non publiees", UNPUBLISHED_INFORMATION),
  ].join("\n\n");
}
