"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  CalendarCheck,
  MessageSquare,
  User,
  Compass,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Dashboard",     href: "/dashboard-client",           icon: LayoutDashboard, exact: true },
  { label: "Mon profil",    href: "/dashboard-client/profil",    icon: User },
  { label: "Mes visites",   href: "/dashboard-client/visites",   icon: CalendarCheck },
  { label: "Mes messages",  href: "/dashboard-client/messages",  icon: MessageSquare },
  { label: "Mes favoris",   href: "/dashboard-client/favoris",   icon: Heart },
];

const bottomItems = [
  { label: "Explorer les biens", href: "/biens", icon: Compass },
];

interface ClientSidebarProps {
  userName?: string | null;
}

export default function ClientSidebar({ userName }: ClientSidebarProps) {
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
        <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f1724] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ═══ DESKTOP: icon-only sidebar ═══ */}
      <aside className="hidden md:flex flex-col items-center w-[72px] bg-[#0f1724] min-h-screen py-4 shrink-0">
        <Link href="/dashboard-client" className="mb-6">
          <Image src="/logo-koitala.jpeg" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-contain" />
        </Link>

        <nav className="flex-1 flex flex-col items-center gap-1.5">
          {navItems.map((item) => (
            <NavIcon key={item.href} item={item} />
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1.5 pt-4 border-t border-white/10 mt-2">
          {bottomItems.map((item) => (
            <NavIcon key={item.href} item={item} />
          ))}
          <Link
            href="/"
            className="relative group flex items-center justify-center w-11 h-11 rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f1724] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Retour au site
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            className="relative group flex items-center justify-center w-11 h-11 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-[#0f1724] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* ═══ MOBILE: hamburger + overlay sidebar ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f1724] flex items-center justify-between px-4 h-14">
        <Link href="/dashboard-client" className="flex items-center gap-2">
          <Image src="/logo-koitala.jpeg" alt="KOITALA" width={32} height={32} className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-lg font-bold text-white">KOI<span className="text-[#e8b86d]">TALA</span></span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-10 h-10 flex items-center justify-center text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <div className="md:hidden fixed top-14 left-0 bottom-0 w-64 bg-[#0f1724] z-40 overflow-y-auto">
            {userName && (
              <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#1a3a5c] rounded-full flex items-center justify-center text-[#e8b86d] text-sm font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{userName}</p>
                    <p className="text-xs text-gray-400">Client</p>
                  </div>
                </div>
              </div>
            )}
            <nav className="px-3 py-4">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.href, item.exact);
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
              {bottomItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-1">
                  <item.icon className="w-5 h-5" /> {item.label}
                </Link>
              ))}
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-1">
                <ExternalLink className="w-5 h-5" /> Retour au site
              </Link>
              <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                <LogOut className="w-5 h-5" /> Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
