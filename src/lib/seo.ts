import { AGENCY_INFO } from "@/lib/agency";
import type { BlogPost, Property } from "@/types";
import { getListingTypeLabel, getPropertyTypeLabel } from "@/lib/utils";

const DEFAULT_SITE_URL = "https://koitala.com";

export const SITE_NAME = "KOITALA";
export const SITE_DESCRIPTION =
  "KOITALA, agence immobiliere a Dakar : achat, vente, location, construction cle en main et accompagnement immobilier au Senegal.";
export const DEFAULT_KEYWORDS = [
  "agence immobiliere dakar",
  "immobilier senegal",
  "achat maison dakar",
  "location appartement dakar",
  "vente villa dakar",
  "construction cle en main senegal",
  "KOITALA",
] as const;

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function getSiteUrl(): string {
  const envValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = envValue || DEFAULT_SITE_URL;

  try {
    const parsed = new URL(candidate);

    if (!isLocalHostname(parsed.hostname)) {
      parsed.protocol = "https:";
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = getSiteUrl();

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeDescription(
  value: string | null | undefined,
  fallback = SITE_DESCRIPTION,
  maxLength = 170
): string {
  const normalized = cleanText(stripHtml(value || "")) || cleanText(stripHtml(fallback));

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function resolveSeoImages(...images: Array<string | null | undefined>): string[] {
  const resolved = images
    .map((image) => image?.trim() ?? "")
    .filter(Boolean)
    .map((image) => absoluteUrl(image));

  return resolved.length > 0 ? Array.from(new Set(resolved)) : [absoluteUrl(AGENCY_INFO.logoPath)];
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#organization`,
    name: AGENCY_INFO.legalName,
    alternateName: AGENCY_INFO.name,
    url: SITE_URL,
    logo: absoluteUrl(AGENCY_INFO.logoPath),
    image: absoluteUrl(AGENCY_INFO.logoPath),
    email: AGENCY_INFO.email,
    telephone: AGENCY_INFO.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: AGENCY_INFO.addressLine1,
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
    areaServed: [
      {
        "@type": "City",
        name: "Dakar",
      },
      {
        "@type": "Country",
        name: "Senegal",
      },
    ],
    geo: {
      "@type": "GeoCoordinates",
      latitude: AGENCY_INFO.latitude,
      longitude: AGENCY_INFO.longitude,
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "fr",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/biens?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildPropertyJsonLd(property: Property, images: string[]) {
  const fallbackDescription = `${getListingTypeLabel(property.listing_type)} ${getPropertyTypeLabel(property.property_type)} a ${property.city}`;

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    url: absoluteUrl(`/biens/${property.slug}`),
    priceCurrency: "XOF",
    price: property.price,
    availability:
      property.status === "publie"
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    itemOffered: {
      "@type": "Place",
      name: property.title,
      description: sanitizeDescription(property.description, fallbackDescription, 320),
      image: images,
      category: `${getListingTypeLabel(property.listing_type)} ${getPropertyTypeLabel(property.property_type)}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.address?.trim() || property.neighborhood?.trim() || undefined,
        addressLocality: property.city,
        postalCode: property.postal_code?.trim() || undefined,
        addressCountry: property.country,
      },
      geo:
        typeof property.latitude === "number" && typeof property.longitude === "number"
          ? {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            }
          : undefined,
      floorSize:
        typeof property.area === "number"
          ? {
              "@type": "QuantitativeValue",
              value: property.area,
              unitCode: "MTK",
            }
          : undefined,
      numberOfRooms: property.bedrooms ?? undefined,
      numberOfBathroomsTotal: property.bathrooms ?? undefined,
    },
    seller: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export function buildBlogPostingJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    url: absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    description: sanitizeDescription(post.excerpt, post.title),
    image: resolveSeoImages(post.cover_image_url),
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.author?.full_name?.trim() || AGENCY_INFO.defaultRepresentative,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    articleSection: post.category?.trim() || undefined,
    keywords: post.tags?.join(", ") || undefined,
  };
}
