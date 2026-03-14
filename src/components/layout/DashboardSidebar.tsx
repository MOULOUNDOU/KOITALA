"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  MessageSquare,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview",           href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Annonces",           href: "/dashboard/annonces",     icon: Building2 },
  { label: "Demandes",           href: "/dashboard/demandes",     icon: CalendarCheck },
  { label: "Messages",           href: "/dashboard/messages",     icon: MessageSquare },
  { label: "Utilisateurs",       href: "/dashboard/utilisateurs", icon: Users },
  { label: "Blog",               href: "/dashboard/blog",         icon: BookOpen },
];

const bottomItems = [
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  /* ── Icon button used in both desktop & mobile ── */
  const NavIcon = ({ item }: { item: typeof navItems[0] }) => {
    const active = isActive(item.href, item.exact);
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all",
          active
            ? "bg-[#1a3a5c] text-white shadow-lg shadow-[#1a3a5c]/30"
            : "text-gray-500 hover:text-white hover:bg-white/8"
        )}
      >
        <item.icon className="w-5 h-5" />
        {/* Tooltip */}
        <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#1a3a5c] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ═══ DESKTOP: icon-only sidebar ═══ */}
      <aside className="hidden md:flex flex-col items-center w-[72px] bg-[#1a3a5c] min-h-screen py-4 shrink-0">
        {/* Logo */}
        <Link href="/dashboard" className="mb-6">
          <Image src="/logo-koitala.png" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-cover" />
        </Link>

        {/* Main nav */}
        <nav className="flex-1 flex flex-col items-center gap-1.5">
          {navItems.map((item) => (
            <NavIcon key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-white/10 mt-2">
          {bottomItems.map((item) => (
            <NavIcon key={item.href} item={item} />
          ))}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le site (nouvel onglet)"
            className="relative group flex items-center justify-center w-11 h-11 rounded-xl text-white/80 hover:text-white hover:bg-white/8 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#1a3a5c] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Voir le site
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="relative group flex items-center justify-center w-11 h-11 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#1a3a5c] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE: hamburger + overlay sidebar ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a3a5c] flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-koitala.png" alt="KOITALA" width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
          <span className="text-lg font-bold text-white">KOI<span className="text-[#e8b86d]">TALA</span></span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-10 h-10 flex items-center justify-center text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />
      <div
        className={cn(
          "md:hidden fixed top-14 left-0 bottom-0 w-64 bg-[#1a3a5c] z-40 overflow-y-auto transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {[...navItems, ...bottomItems].map((item) => {
              const active = isActive(item.href, (item as { exact?: boolean }).exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                      active ? "bg-[#1a3a5c] text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/5 transition-all mb-1"
          >
            <ExternalLink className="w-5 h-5" /> Voir le site
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}
