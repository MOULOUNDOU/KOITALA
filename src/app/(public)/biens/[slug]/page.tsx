export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ArrowLeft,
  Eye,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getListingTypeLabel,
  formatDate,
} from "@/lib/utils";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import VisitRequestForm from "@/components/properties/VisitRequestForm";
import ContactPropertyForm from "@/components/properties/ContactPropertyForm";
import MapContainer from "@/components/ui/MapContainer";
import PropertyDetailGallery from "@/components/properties/PropertyDetailGallery";
import type { Property } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProperty(slug: string): Promise<Property | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*), property_features(*)")
    .eq("slug", slug)
    .eq("status", "publie")
    .single();
  return data ?? null;
}

async function getSimilarProperties(
  property: Property
): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "publie")
    .eq("property_type", property.property_type)
    .eq("listing_type", property.listing_type)
    .neq("id", property.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Bien non trouvé" };
  return {
    title: property.title,
    description: property.description ?? undefined,
    openGraph: {
      title: property.title,
      description: property.description ?? undefined,
      images: property.main_image_url ? [property.main_image_url] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const similar = await getSimilarProperties(property);

  const images = property.property_images ?? [];
  const rentPaymentLabel = property.rent_payment_period ?? "mois";
  const galleryImages = [
    property.main_image_url
      ? {
          id: "main-image",
          url: property.main_image_url,
          alt: property.title,
        }
      : null,
    ...images
      .slice()
      .sort((a, b) => {
        if (a.is_main !== b.is_main) {
          return a.is_main ? -1 : 1;
        }
        return a.order_index - b.order_index;
      })
      .map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt ?? property.title,
      })),
  ].filter(
    (image): image is { id: string; url: string; alt: string } => Boolean(image?.url)
  );

  if (galleryImages.length === 0) {
    galleryImages.push({
      id: "fallback-image",
      url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80",
      alt: property.title,
    });
  }

  const mobileStatCards = [
    property.bedrooms !== null && property.bedrooms !== undefined
      ? {
          key: "bedrooms",
          icon: Bed,
          value: String(property.bedrooms),
          label: `Chambre${property.bedrooms !== 1 ? "s" : ""}`,
        }
      : null,
    property.bathrooms !== null && property.bathrooms !== undefined
      ? {
          key: "bathrooms",
          icon: Bath,
          value: String(property.bathrooms),
          label: "Sdb",
        }
      : null,
    property.area
      ? {
          key: "area",
          icon: Maximize2,
          value: formatArea(property.area),
          label: "Surface",
        }
      : null,
  ].filter(
    (item): item is { key: string; icon: typeof Bed; value: string; label: string } => item !== null
  );

  const mobileKeyDetails = [
    { key: "transaction", label: "Transaction", value: getListingTypeLabel(property.listing_type) },
    { key: "vues", label: "Vues", value: `${property.views_count}` },
    { key: "publication", label: "Publié le", value: formatDate(property.created_at) },
    property.listing_type === "location"
      ? { key: "paiement", label: "Paiement", value: `Par ${rentPaymentLabel}` }
      : null,
    property.is_furnished ? { key: "mobilier", label: "Mobilier", value: "Meublé" } : null,
    property.country ? { key: "pays", label: "Pays", value: property.country } : null,
  ].filter((item): item is { key: string; label: string; value: string } => item !== null);

  return (
    <>
      {/* Back nav — desktop */}
      <div className="hidden sm:block bg-[#f4f6f9] pt-24 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a3a5c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour aux annonces
          </Link>
        </div>
      </div>

      <PropertyDetailGallery
        title={property.title}
        listingType={property.listing_type}
        propertyType={property.property_type}
        isFeatured={property.is_featured}
        images={galleryImages}
        variant="mobile"
      />

      {/* Mobile title/price/stats card */}
      <div className="sm:hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#e8b86d]">{getPropertyTypeLabel(property.property_type)}</span>
              <h1 className="!text-[1.3rem] font-extrabold text-[#0f1724] leading-snug mt-0.5">{property.title}</h1>
            </div>
            <div className="shrink-0 text-right">
              <p className="!text-[1.3rem] font-extrabold text-[#1a3a5c]">{formatPrice(property.price)}</p>
              {property.listing_type === "location" && <p className="text-[11px] text-gray-400">/{rentPaymentLabel}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1.5">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{[property.neighborhood, property.city].filter(Boolean).join(", ")}</span>
          </div>

          {mobileStatCards.length > 0 && (
            <div className="mt-4 grid grid-cols-1 min-[390px]:grid-cols-3 gap-2">
              {mobileStatCards.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#f4f6f9] px-3 py-2"
                >
                  <item.icon className="w-4 h-4 text-[#1a3a5c] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0f1724] truncate">{item.value}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mobileKeyDetails.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
              {mobileKeyDetails.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-gray-100 bg-white px-2.5 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">{item.label}</p>
                  <p className="text-[12px] font-semibold text-[#0f1724] truncate">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 sm:pb-16">
        <div className="grid lg:grid-cols-3 gap-8 sm:pt-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyDetailGallery
              title={property.title}
              listingType={property.listing_type}
              propertyType={property.property_type}
              isFeatured={property.is_featured}
              images={galleryImages}
              variant="desktop"
            />

            {/* Desktop title & price */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0f1724] leading-snug mb-2">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {property.address && `${property.address}, `}
                    {property.neighborhood && `${property.neighborhood}, `}
                    {property.city}
                  </div>
                </div>
                <div className="shrink-0">
                  <p className="text-3xl font-bold text-[#1a3a5c]">{formatPrice(property.price)}</p>
                  {property.listing_type === "location" && <p className="text-xs text-gray-400 text-right">/{rentPaymentLabel}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-5 mt-5 pt-5 border-t border-gray-100">
                {property.area && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Maximize2 className="w-4 h-4 text-[#1a3a5c]" />
                    <span className="font-medium">{formatArea(property.area)}</span>
                    <span className="text-gray-400">Surface</span>
                  </div>
                )}
                {property.bedrooms !== null && property.bedrooms !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bed className="w-4 h-4 text-[#1a3a5c]" />
                    <span className="font-medium">{property.bedrooms}</span>
                    <span className="text-gray-400">Chambre{property.bedrooms !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {property.bathrooms !== null && property.bathrooms !== undefined && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bath className="w-4 h-4 text-[#1a3a5c]" />
                    <span className="font-medium">{property.bathrooms}</span>
                    <span className="text-gray-400">Salle{property.bathrooms !== 1 ? "s" : ""} de bain</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto">
                  <Eye className="w-4 h-4" />
                  <span>{property.views_count} vue{property.views_count !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="!text-lg sm:!text-xl font-semibold text-[#0f1724] mb-3">
                  Description
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Features */}
            {property.property_features &&
              property.property_features.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <h2 className="!text-lg sm:!text-xl font-semibold text-[#0f1724] mb-4">
                    Caractéristiques
                  </h2>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.property_features.map((feat) => (
                      <div
                        key={feat.id}
                        className="flex items-center gap-2.5 p-3 bg-[#f4f6f9] rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm text-gray-700">
                          {feat.name}
                          {feat.value && (
                            <span className="text-gray-400"> : {feat.value}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Location */}
            {property.latitude && property.longitude && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="!text-lg sm:!text-xl font-semibold text-[#0f1724] mb-4">Localisation</h2>
                <MapContainer
                  lat={property.latitude}
                  lng={property.longitude}
                  label={[property.neighborhood, property.city].filter(Boolean).join(", ") || "Localisation"}
                  zoom={15}
                  height="280px"
                />
              </div>
            )}

            {/* Similar properties */}
            {similar.length > 0 && (
              <div>
                <h2 className="!text-lg sm:!text-xl font-semibold text-[#0f1724] mb-5">Biens similaires</h2>
                {/* Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {similar.map((p) => (<PropertyCard key={p.id} property={p} />))}
                </div>
                {/* Mobile 2-col */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:hidden">
                  {similar.map((p) => (<PropertyCardMobile key={p.id} property={p} />))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Agency info */}
            <div className="bg-[#0f1724] rounded-2xl p-4 sm:p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
                  <span className="text-[#e8b86d] font-bold text-lg">K</span>
                </div>
                <div>
                  <p className="font-semibold">KOITALA</p>
                  <p className="text-xs text-gray-400">Agence immobilière</p>
                </div>
              </div>
              <div className="space-y-3">
                <a
                  href="tel:+221766752135"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm break-all"
                >
                  <Phone className="w-4 h-4 text-[#e8b86d]" />
                  +221 76 675 21 35
                </a>
                <a
                  href="mailto:amzakoita@gmail.com"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm break-all"
                >
                  <Mail className="w-4 h-4 text-[#e8b86d]" />
                  amzakoita@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                Publié le {formatDate(property.created_at)}
              </div>
            </div>

            {/* Visit request form */}
            <VisitRequestForm
              propertyId={property.id}
              propertyTitle={property.title}
            />

            {/* Contact form */}
            <ContactPropertyForm propertyId={property.id} />
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY CONTACT BAR ─── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-pb">
        <div className="flex gap-3">
          <a href="tel:+221766752135" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-[#1a3a5c] text-[#1a3a5c] font-semibold text-sm rounded-xl active:scale-[.97] transition-all">
            <Phone className="w-5 h-5" /> Appeler
          </a>
          <a href="mailto:amzakoita@gmail.com" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#1a3a5c] text-white font-semibold text-sm rounded-xl active:scale-[.97] transition-all shadow-sm">
            <Mail className="w-5 h-5" /> Contacter
          </a>
        </div>
      </div>
    </>
  );
}
