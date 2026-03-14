import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "yellow" | "purple" | "red";
  trend?: { value: string; up: boolean };
  href?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  href,
  className,
}: StatsCardProps) {
  const palette = {
    blue: {
      ring: "ring-[#1a3a5c]/15",
      icon: "bg-[#1a3a5c]/10 text-[#1a3a5c]",
      trend: "text-[#1a3a5c]",
    },
    green: {
      ring: "ring-[#e8b86d]/30",
      icon: "bg-[#e8b86d]/20 text-[#1a3a5c]",
      trend: "text-[#1a3a5c]",
    },
    yellow: {
      ring: "ring-[#e8b86d]/20",
      icon: "bg-[#e8b86d]/15 text-[#1a3a5c]",
      trend: "text-[#1a3a5c]",
    },
    purple: {
      ring: "ring-[#1a3a5c]/20",
      icon: "bg-[#1a3a5c]/15 text-[#1a3a5c]",
      trend: "text-[#1a3a5c]",
    },
    red: {
      ring: "ring-[#0f2540]/15",
      icon: "bg-[#0f2540]/10 text-[#0f2540]",
      trend: "text-[#0f2540]",
    },
  };

  const c = palette[color];

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-3 ring-1",
      c.ring, className
    )}>
      {/* Top: title + icon */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Value + trend */}
      <div className="flex items-end gap-3">
        <p className="text-2xl sm:text-3xl font-extrabold text-[#0f1724] leading-none">{value}</p>
        {trend && (
          <span className={cn("flex items-center gap-0.5 text-xs font-semibold", trend.up ? "text-[#1a3a5c]" : "text-[#0f2540]")}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle + link */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <p className="text-xs text-gray-400">{subtitle}</p>
        {href && (
          <Link href={href} className="text-xs font-semibold text-[#1a3a5c] hover:underline flex items-center gap-0.5">
            Voir plus <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
