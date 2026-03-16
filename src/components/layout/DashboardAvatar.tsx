"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface DashboardAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

export default function DashboardAvatar({
  name,
  avatarUrl,
  className,
}: DashboardAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const normalizedName = name.trim() || "U";
  const normalizedAvatarUrl = avatarUrl?.trim() ?? "";
  const showAvatarImage =
    normalizedAvatarUrl.length > 0 && failedAvatarUrl !== normalizedAvatarUrl;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-full bg-white/12 text-sm font-bold text-[#e8b86d] ring-1 ring-white/10",
        className
      )}
    >
      {showAvatarImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={normalizedAvatarUrl}
          alt={normalizedName}
          className="h-full w-full object-cover"
          onError={() => setFailedAvatarUrl(normalizedAvatarUrl)}
        />
      ) : (
        normalizedName.charAt(0).toUpperCase()
      )}
    </div>
  );
}
