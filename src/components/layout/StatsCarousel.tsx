"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Star, TrendingUp, Home, Key, BarChart3, Scale, MapPin, Shield, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Users, Star, TrendingUp, Home, Key, BarChart3, Scale, MapPin, Shield, Phone, Mail,
};

export interface StatItem {
  icon: string;
  value: string;
  label: string;
}

export default function StatsCarousel({ stats }: { stats: StatItem[] }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive((prev) => (prev + 1) % stats.length);
        setAnimating(false);
      }, 250);
    }, 2800);
    return () => clearInterval(timer);
  }, [stats.length]);

  const goTo = (i: number) => {
    if (i === active) return;
    setAnimating(true);
    setTimeout(() => { setActive(i); setAnimating(false); }, 250);
  };

  return (
    <div className="bg-[#1a3a5c]/90 backdrop-blur-md border-t border-white/10">
      {/* ── Mobile: carousel ── */}
      <div className="sm:hidden px-4 py-4">
        <div className={cn(
          "flex items-center justify-center gap-4 transition-all duration-200",
          animating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            {(() => {
              const Icon = ICON_MAP[stats[active].icon] ?? Building2;
              return <Icon className="w-6 h-6 text-[#e8b86d]" />;
            })()}
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{stats[active].value}</p>
            <p className="text-sm text-gray-300 mt-0.5">{stats[active].label}</p>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {stats.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active ? "w-6 h-1.5 bg-[#e8b86d]" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
              )}
              aria-label={`Stat ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: 4-col grid ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-4 divide-x divide-white/10">
          {stats.map((stat) => {
            const Icon = ICON_MAP[stat.icon] ?? Building2;
            return (
              <div key={stat.label} className="flex items-center gap-3 px-6 py-4">
                <Icon className="w-8 h-8 text-[#e8b86d] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 leading-tight">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
