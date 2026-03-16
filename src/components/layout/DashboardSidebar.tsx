"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  MessageSquare,
  FileText,
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
import SignOutConfirmDialog from "@/components/ui/SignOutConfirmDialog";

const navItems = [
  { label: "Tableau de bord",    href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Annonces",           href: "/dashboard/annonces",     icon: Building2 },
  { label: "Demandes",           href: "/dashboard/demandes",     icon: CalendarCheck },
  { label: "Messages",           href: "/dashboard/messages",     icon: MessageSquare },
  { label: "Contrats",           href: "/dashboard/contrats",     icon: FileText },
  { label: "Utilisateurs",       href: "/dashboard/utilisateurs", icon: Users },
  { label: "Blog",               href: "/dashboard/blog",         icon: BookOpen },
];

const bottomItems = [
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const confirmSignOut = async () => {
    setShowSignOutDialog(false);
    setIsSigningOut(true);
    setMobileOpen(false);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Fallback handled by server signout route below.
    } finally {
      window.location.assign("/auth/signout");
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const DesktopNavItem = ({ item }: { item: (typeof navItems)[number] | (typeof bottomItems)[number] }) => {
    const active = isActive(item.href, "exact" in item ? item.exact : undefined);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center rounded-xl transition-all duration-300 ease-out",
          desktopExpanded ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center",
          active
            ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
            active
              ? "bg-white text-[#1a3a5c] shadow-sm"
              : "bg-white/10 text-white/90 group-hover:bg-white/20 group-hover:text-white"
          )}
        >
          <item.icon className="h-[18px] w-[18px]" />
        </span>
        <span
          className={cn(
            "whitespace-nowrap text-sm font-semibold transition-all duration-200",
            desktopExpanded
              ? "max-w-[220px] translate-x-0 opacity-100"
              : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* ═══ DESKTOP: icon-only sidebar ═══ */}
      <aside
        className={cn(
          "hidden md:flex min-h-screen shrink-0 flex-col bg-[#1a3a5c] py-4 transition-[width,padding] duration-300 ease-out",
          desktopExpanded ? "w-[252px] px-3" : "w-[72px] px-2"
        )}
        onMouseEnter={() => setDesktopExpanded(true)}
        onMouseLeave={() => setDesktopExpanded(false)}
        onFocusCapture={() => setDesktopExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDesktopExpanded(false);
          }
        }}
      >
        <Link
          href="/dashboard"
          className={cn(
            "mb-6 flex items-center rounded-xl transition-all duration-300",
            desktopExpanded ? "w-full gap-3 px-2" : "justify-center"
          )}
        >
          <Image
            src="/logo-koitala.png"
            alt="KOITALA"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
          />
          <span
            className={cn(
              "whitespace-nowrap text-base font-bold tracking-tight text-white transition-all duration-200",
              desktopExpanded
                ? "max-w-[160px] translate-x-0 opacity-100"
                : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
            )}
          >
            KOITALA
          </span>
        </Link>

        {/* Main nav */}
        <nav className={cn("flex flex-1 flex-col gap-1.5", desktopExpanded ? "items-stretch" : "items-center")}>
          {navItems.map((item) => (
            <DesktopNavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom */}
        <div
          className={cn(
            "mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-4",
            desktopExpanded ? "items-stretch" : "items-center"
          )}
        >
          {bottomItems.map((item) => (
            <DesktopNavItem key={item.href} item={item} />
          ))}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le site (nouvel onglet)"
            className={cn(
              "group flex items-center rounded-xl text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white",
              desktopExpanded ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/90 transition-all duration-300 group-hover:bg-white/20 group-hover:text-white">
              <ExternalLink className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition-all duration-200",
                desktopExpanded
                  ? "max-w-[220px] translate-x-0 opacity-100"
                  : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
              )}
            >
              Voir le site
            </span>
          </Link>
          <button
            onClick={() => setShowSignOutDialog(true)}
            disabled={isSigningOut}
            className={cn(
              "group flex items-center rounded-xl bg-[#6b4226] text-white transition-all duration-300 hover:bg-[#55331d] disabled:cursor-not-allowed disabled:opacity-70",
              desktopExpanded ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition-all duration-200",
                desktopExpanded
                  ? "max-w-[220px] translate-x-0 opacity-100"
                  : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
              )}
            >
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
          <button
            onClick={() => setShowSignOutDialog(true)}
            disabled={isSigningOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#6b4226] text-sm font-semibold text-white transition-all hover:bg-[#55331d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogOut className="w-5 h-5" /> Déconnexion
          </button>
        </div>
      </div>

      <SignOutConfirmDialog
        open={showSignOutDialog}
        loading={isSigningOut}
        onCancel={() => setShowSignOutDialog(false)}
        onConfirm={confirmSignOut}
      />
    </>
  );
}
