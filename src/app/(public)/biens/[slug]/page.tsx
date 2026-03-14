export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
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
  Star,
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
  const mainImage =
    property.main_image_url ??
    images.find((img) => img.is_main)?.url ??
    images[0]?.url ??
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80";

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

      {/* ─── MOBILE HERO IMAGE ─── */}
      <div className="sm:hidden relative">
        <div className="relative h-[55vh] min-h-[320px]">
          <Image
            src={mainImage}
            alt={property.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay buttons */}
          <div className="absolute top-12 left-4 right-4 flex items-center justify-between">
            <Link href="/biens" className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
              <ArrowLeft className="w-5 h-5 text-[#0f1724]" />
            </Link>
            <div className="flex gap-2">
              {property.is_featured && (
                <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#e8b86d] text-[#0f1724] text-[11px] font-bold rounded-full shadow">
                  <Star className="w-3 h-3 fill-[#0f1724]" /> Coup de c\u0153ur
                </span>
              )}
            </div>
          </div>
          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className={property.listing_type === "vente" ? "px-3 py-1.5 bg-[#1a3a5c] text-white text-xs font-bold rounded-lg" : "px-3 py-1.5 bg-[#e8b86d] text-[#1a3a5c] text-xs font-bold rounded-lg"}>
              {getListingTypeLabel(property.listing_type)}
            </span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 px-4 -mt-5 relative z-10 overflow-x-auto scrollbar-hide">
            {images.slice(0, 6).map((img, i) => (
              <div key={img.id} className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                <Image src={img.url} alt={img.alt ?? property.title} fill className="object-cover" sizes="56px" />
                {i === 5 && images.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+{images.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mobile title/price/stats card */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-[#e8b86d]">{getPropertyTypeLabel(property.property_type)}</span>
              <h1 className="text-xl font-extrabold text-[#0f1724] leading-snug mt-0.5">{property.title}</h1>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-extrabold text-[#1a3a5c]">{formatPrice(property.price)}</p>
              {property.listing_type === "location" && <p className="text-[11px] text-gray-400">/mois</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1.5">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{[property.neighborhood, property.city].filter(Boolean).join(", ")}</span>
          </div>

          {/* Stats row with dividers */}
          <div className="flex items-center justify-around mt-4 py-3 bg-[#f4f6f9] rounded-xl">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex flex-col items-center px-3">
                <Bed className="w-5 h-5 text-[#1a3a5c] mb-1" />
                <span className="text-sm font-bold text-[#0f1724]">{property.bedrooms}</span>
                <span className="text-[10px] text-gray-400">Chambre{property.bedrooms !== 1 ? "s" : ""}</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex flex-col items-center px-3">
                  <Bath className="w-5 h-5 text-[#1a3a5c] mb-1" />
                  <span className="text-sm font-bold text-[#0f1724]">{property.bathrooms}</span>
                  <span className="text-[10px] text-gray-400">Sdb</span>
                </div>
              </>
            )}
            {property.area && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex flex-col items-center px-3">
                  <Maximize2 className="w-5 h-5 text-[#1a3a5c] mb-1" />
                  <span className="text-sm font-bold text-[#0f1724]">{formatArea(property.area)}</span>
                  <span className="text-[10px] text-gray-400">Surface</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-16">
        <div className="grid lg:grid-cols-3 gap-8 sm:pt-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop main image */}
            <div className="hidden sm:block relative h-[28rem] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={mainImage}
                alt={property.title}
                fill
                className="object-cover"
                priority
                sizes="66vw"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={property.listing_type === "vente" ? "px-3 py-1.5 bg-[#1a3a5c] text-white text-xs font-bold rounded-lg uppercase" : "px-3 py-1.5 bg-[#e8b86d] text-[#1a3a5c] text-xs font-bold rounded-lg uppercase"}>
                  {getListingTypeLabel(property.listing_type)}
                </span>
                <span className="px-3 py-1.5 bg-white/90 text-gray-700 text-xs font-medium rounded-lg">
                  {getPropertyTypeLabel(property.property_type)}
                </span>
              </div>
              {property.is_featured && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8b86d] text-[#0f1724] text-xs font-bold rounded-lg shadow">
                    <Star className="w-3 h-3 fill-[#0f1724]" /> Coup de c&#x153;ur
                  </span>
                </div>
              )}
            </div>

            {/* Desktop thumbnails */}
            {images.length > 1 && (
              <div className="hidden sm:grid grid-cols-6 gap-2">
                {images.slice(0, 8).map((img) => (
                  <div key={img.id} className="relative h-16 rounded-lg overflow-hidden">
                    <Image src={img.url} alt={img.alt ?? property.title} fill className="object-cover hover:opacity-90 transition-opacity cursor-pointer" sizes="80px" />
                  </div>
                ))}
              </div>
            )}

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
                  {property.listing_type === "location" && <p className="text-xs text-gray-400 text-right">/mois</p>}
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#0f1724] mb-3">
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#0f1724] mb-4">
                    Caractéristiques
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#0f1724] mb-4">Localisation</h2>
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
                <h2 className="text-xl font-semibold text-[#0f1724] mb-5">Biens similaires</h2>
                {/* Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {similar.map((p) => (<PropertyCard key={p.id} property={p} />))}
                </div>
                {/* Mobile 2-col */}
                <div className="grid grid-cols-2 gap-3 sm:hidden">
                  {similar.map((p) => (<PropertyCardMobile key={p.id} property={p} />))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Agency info */}
            <div className="bg-[#0f1724] rounded-2xl p-5 text-white">
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
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4 text-[#e8b86d]" />
                  +221 76 675 21 35
                </a>
                <a
                  href="mailto:amzakoita@gmail.com"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm"
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
