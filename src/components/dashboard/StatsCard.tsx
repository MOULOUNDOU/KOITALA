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
    blue:   { ring: "ring-blue-100",   icon: "bg-blue-50 text-blue-500",   trend: "text-blue-500" },
    green:  { ring: "ring-green-100",  icon: "bg-green-50 text-green-500",  trend: "text-green-500" },
    yellow: { ring: "ring-amber-100",  icon: "bg-amber-50 text-amber-500",  trend: "text-amber-500" },
    purple: { ring: "ring-purple-100", icon: "bg-purple-50 text-purple-500", trend: "text-purple-500" },
    red:    { ring: "ring-red-100",    icon: "bg-red-50 text-red-500",    trend: "text-red-500" },
  };

  const c = palette[color];

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-3 ring-1",
      c.ring, className
    )}>
      {/* Top: title + icon */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Value + trend */}
      <div className="flex items-end gap-3">
        <p className="text-3xl font-extrabold text-[#0f1724] leading-none">{value}</p>
        {trend && (
          <span className={cn("flex items-center gap-0.5 text-xs font-semibold", trend.up ? "text-green-500" : "text-red-400")}>
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
