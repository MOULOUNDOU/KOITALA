"use client";

import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Maximize2, Star, Eye } from "lucide-react";
import { useState } from "react";
import { cn, formatArea, formatPrice, getListingTypeLabel, getPropertyTypeLabel, getRentalCategoryLabel, getFakeRating } from "@/lib/utils";
import type { Property } from "@/types";
import { createClient } from "@/lib/supabase/client";
import PropertyCardMedia from "@/components/properties/PropertyCardMedia";

interface Props {
  property: Property;
  className?: string;
  preferVideoBubble?: boolean;
  showFavoriteButton?: boolean;
}

export default function PropertyCardMobile({
  property,
  className,
  preferVideoBubble = false,
  showFavoriteButton = true,
}: Props) {
  const [favorited, setFavorited] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const supabase = createClient();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingFav(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }
    if (favorited) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", property.id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, property_id: property.id });
    }
    setFavorited(!favorited);
    setLoadingFav(false);
  };

  const rentPaymentLabel = property.rent_payment_period ?? "mois";
  const rentalCategoryLabel = getRentalCategoryLabel(property.rental_category) || null;
  const fakeSocialProof = getFakeRating(property.id);

  const cardDetails = [
    property.bedrooms != null ? { icon: Bed, label: `${property.bedrooms} ch.` } : null,
    property.bathrooms != null ? { icon: Bath, label: `${property.bathrooms} sdb.` } : null,
    property.area != null ? { icon: Maximize2, label: formatArea(property.area) } : null,
    { icon: Eye, label: `${property.views_count} vues` },
  ].filter((item): item is { icon: typeof Bed; label: string } => item !== null);

  return (
    <Link href={`/biens/${property.slug}`} className={cn("block group", className)}>
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PropertyCardMedia
            property={property}
            alt={property.title}
            sizes="50vw"
            className="absolute inset-0"
            imageClassName="transition-transform duration-500 group-hover:scale-105"
            compact
            preferVideoBubble={preferVideoBubble}
            bubbleClassName="h-24 w-24"
            fallbackImageUrl="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80"
          >
            <div
              className={cn(
                "absolute top-2.5 left-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white",
                property.listing_type === "vente" ? "bg-[#1a3a5c]" : "bg-[#6b4226]"
              )}
            >
              {getListingTypeLabel(property.listing_type)}
            </div>
            {showFavoriteButton && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleFavorite}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFavorite(e as unknown as React.MouseEvent); }}
                aria-disabled={loadingFav}
                className={cn(
                  "absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer",
                  favorited ? "bg-red-500 text-white" : "bg-white/90 text-gray-500"
                )}
              >
                <Heart className={cn("w-4 h-4", favorited && "fill-current")} />
              </div>
            )}
          </PropertyCardMedia>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#f4f6f9] text-[11px] font-semibold text-[#1a3a5c]">
                {getPropertyTypeLabel(property.property_type)}
              </span>
              {rentalCategoryLabel && (
                <span className="inline-block rounded-md bg-[#6b4226]/15 px-2 py-0.5 text-[10px] font-semibold text-[#6b4226]">
                  {rentalCategoryLabel}
                </span>
              )}
            </div>
            <div className="shrink-0 text-right leading-none">
              <div className="flex items-center justify-end gap-0.5 text-[#e8b86d]">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={`${property.id}-mobile-star-${idx}`} className="w-2.5 h-2.5 fill-current" />
                ))}
              </div>
              <span className="text-[9px] text-gray-500 mt-0.5 inline-block">
                {fakeSocialProof.rating} ({fakeSocialProof.reviews})
              </span>
            </div>
          </div>
          {/* Title */}
          <h3 className="font-bold text-[14px] text-[#0f1724] leading-snug line-clamp-1 mb-1">
            {property.title}
          </h3>
          {/* Location */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[12px] text-gray-500 truncate">
              {property.neighborhood ? `${property.neighborhood}, ` : ""}
              {property.city}
            </span>
          </div>
          {/* Price */}
          <p className="text-[15px] font-extrabold text-[#1a3a5c]">
            {formatPrice(property.price)}
            {property.listing_type === "location" && (
              <span className="text-[11px] text-gray-400 font-normal"> /{rentPaymentLabel}</span>
            )}
          </p>
          {cardDetails.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1.5 text-[11px] text-gray-500">
              {cardDetails.slice(0, 4).map((detail) => (
                <span
                  key={`${property.id}-${detail.label}-mobile`}
                  className="inline-flex items-center gap-1 bg-[#f4f6f9] rounded-md px-2 py-1"
                >
                  <detail.icon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{detail.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
