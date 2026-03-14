"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { cn, formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Property } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface Props {
  property: Property;
  className?: string;
}

export default function PropertyCardHorizontal({ property, className }: Props) {
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

  const imageUrl = property.main_image_url || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80";

  return (
    <Link href={`/biens/${property.slug}`} className={cn("block group", className)}>
      <article className="flex bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        {/* Image */}
        <div className="relative w-28 h-28 shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            sizes="112px"
          />
          <div
            role="button"
            tabIndex={0}
            onClick={handleFavorite}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFavorite(e as unknown as React.MouseEvent); }}
            aria-disabled={loadingFav}
            className={cn(
              "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all cursor-pointer",
              favorited ? "bg-red-500 text-white" : "bg-white/90 text-gray-500"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", favorited && "fill-current")} />
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
          <span className="inline-block w-fit px-1.5 py-0.5 rounded-md bg-[#f4f6f9] text-[10px] font-semibold text-[#1a3a5c] mb-1">
            {getPropertyTypeLabel(property.property_type)}
          </span>
          <h3 className="font-bold text-[14px] text-[#0f1724] leading-snug line-clamp-1 mb-0.5">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-500 truncate">{property.city}</span>
          </div>
          <p className="text-[14px] font-extrabold text-[#1a3a5c]">
            {formatPrice(property.price)}
            {property.listing_type === "location" && (
              <span className="text-[10px] text-gray-400 font-normal"> /mois</span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
}
