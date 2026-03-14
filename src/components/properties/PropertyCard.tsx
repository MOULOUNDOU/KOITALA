"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Maximize2, Tag } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice, formatArea, getPropertyTypeLabel } from "@/lib/utils";
import type { Property } from "@/types";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

interface PropertyCardProps {
  property: Property;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  className?: string;
}

export default function PropertyCard({
  property,
  isFavorite = false,
  onFavoriteToggle,
  className,
}: PropertyCardProps) {
  const [favorited, setFavorited] = useState(isFavorite);
  const [loadingFav, setLoadingFav] = useState(false);
  const supabase = createClient();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingFav(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (favorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", property.id);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, property_id: property.id });
    }

    setFavorited(!favorited);
    onFavoriteToggle?.(property.id);
    setLoadingFav(false);
  };

  const imageUrl =
    property.main_image_url ||
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";

  return (
    <Link href={`/biens/${property.slug}`} className="block group">
      <article
        className={cn(
          "property-card bg-white rounded-2xl overflow-hidden border border-gray-100",
          className
        )}
      >
        {/* Image */}
        <div className="relative h-56 sm:h-52 overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow",
                property.listing_type === "vente"
                  ? "bg-[#1a3a5c] text-white"
                  : "bg-[#e8b86d] text-[#1a3a5c]"
              )}
            >
              {property.listing_type === "vente" ? "Vente" : "Location"}
            </span>
            {property.is_featured && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-green-500 text-white shadow">
                Coup de cœur
              </span>
            )}
          </div>

          {/* Favorite button */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleFavorite}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFavorite(e as unknown as React.MouseEvent); }}
            aria-disabled={loadingFav}
            className={cn(
              "absolute top-3 right-3 w-11 h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer",
              favorited
                ? "bg-red-500 text-white"
                : "bg-white text-gray-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("w-5 h-5 sm:w-4 sm:h-4", favorited && "fill-current")} />
          </div>

          {/* Price */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg text-base sm:text-sm font-bold text-[#1a3a5c] shadow">
              {formatPrice(property.price)}
              {property.listing_type === "location" && (
                <span className="text-sm sm:text-xs text-gray-500 font-normal">/mois</span>
              )}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-4">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-sm sm:text-xs text-[#e8b86d] font-semibold">
              <Tag className="w-4 h-4 sm:w-3 sm:h-3" />
              {getPropertyTypeLabel(property.property_type)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-[#0f1724] text-lg sm:text-base leading-snug mb-2 group-hover:text-[#1a3a5c] transition-colors line-clamp-2">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-base sm:text-sm text-gray-500 mb-4">
            <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {property.neighborhood ? `${property.neighborhood}, ` : ""}
              {property.city}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            {property.area && (
              <div className="flex items-center gap-1.5 text-sm sm:text-xs text-gray-600">
                <Maximize2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />
                <span>{formatArea(property.area)}</span>
              </div>
            )}
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm sm:text-xs text-gray-600">
                <Bed className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />
                <span>{property.bedrooms} ch.</span>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div className="flex items-center gap-1.5 text-sm sm:text-xs text-gray-600">
                <Bath className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-gray-400" />
                <span>{property.bathrooms} sdb.</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
