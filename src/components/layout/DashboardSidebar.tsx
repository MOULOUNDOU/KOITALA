"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  Bot,
  LayoutDashboard,
  Building2,
  BarChart3,
  FileText,
  List,
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
import DashboardAvatar from "@/components/layout/DashboardAvatar";
import SignOutConfirmDialog from "@/components/ui/SignOutConfirmDialog";

const navItems = [
  { label: "Tableau de bord",    href: "/dashboard",              icon: LayoutDashboard, exact: true },
  { label: "Annonces",           href: "/dashboard/annonces",     icon: Building2 },
  { label: "Analyse",            href: "/dashboard/analyse",      icon: BarChart3 },
  { label: "Contrats",           href: "/dashboard/contrats",     icon: FileText, exact: true },
  { label: "Liste contrats",     href: "/dashboard/contrats/liste", icon: List, exact: true },
  { label: "Utilisateurs",       href: "/dashboard/utilisateurs", icon: Users },
  { label: "Blog",               href: "/dashboard/blog",         icon: BookOpen },
];

const bottomItems = [
  { label: "Paramètres", href: "/dashboard/parametres", icon: Settings },
];
const adminProfileHref = "/dashboard/parametres";
const adminAssistantHref = "/dashboard/assistant-ia";

interface ProfileUpdatedEventDetail {
  full_name?: string;
  avatar_url?: string | null;
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [desktopAlwaysOpen, setDesktopAlwaysOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [adminName, setAdminName] = useState("Administrateur");
  const [adminAvatarUrl, setAdminAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncProfile = async (
      authUser: {
        id: string;
        email?: string | null;
        user_metadata?: { full_name?: unknown; avatar_url?: unknown };
      } | null
    ) => {
      if (!authUser) {
        if (!mounted) return;
        setAdminName("Administrateur");
        setAdminAvatarUrl(null);
        return;
      }

      const metadataName =
        typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name.trim()
          : "";
      const metadataAvatar =
        typeof authUser.user_metadata?.avatar_url === "string"
          ? authUser.user_metadata.avatar_url.trim()
          : "";
      const emailFallback = authUser.email?.split("@")[0] ?? "Administrateur";

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!mounted) return;

      setAdminName(profile?.full_name?.trim() || metadataName || emailFallback);
      setAdminAvatarUrl(profile?.avatar_url?.trim() || metadataAvatar || null);
    };

    void (async () => {
      const result = await supabase.auth.getUser();
      void syncProfile(result.data.user);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        void syncProfile(session?.user ?? null);
      }
    );

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileUpdatedEventDetail>;
      const updatedName = customEvent.detail?.full_name?.trim();

      if (updatedName) {
        setAdminName(updatedName);
      }

      if (typeof customEvent.detail?.avatar_url === "string") {
        setAdminAvatarUrl(customEvent.detail.avatar_url.trim() || null);
      } else if (customEvent.detail?.avatar_url === null) {
        setAdminAvatarUrl(null);
      }
    };

    window.addEventListener("koitala:profile-updated", handleProfileUpdated as EventListener);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("koitala:profile-updated", handleProfileUpdated as EventListener);
    };
  }, [supabase]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const syncDesktopMode = (matches: boolean) => {
      setDesktopAlwaysOpen(matches);

      if (matches) {
        setDesktopExpanded(false);
      }
    };

    syncDesktopMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncDesktopMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const displayName = adminName.trim() || "Administrateur";
  const desktopOpen = desktopAlwaysOpen || desktopExpanded;

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
          desktopOpen ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center",
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
            desktopOpen
              ? "max-w-[186px] translate-x-0 opacity-100"
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
          "hidden md:flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-[#1a3a5c] py-4 transition-[width,padding] duration-300 ease-out",
          desktopOpen ? "w-[224px] px-2.5" : "w-[64px] px-1.5"
        )}
        onMouseEnter={() => {
          if (!desktopAlwaysOpen) {
            setDesktopExpanded(true);
          }
        }}
        onMouseLeave={() => {
          if (!desktopAlwaysOpen) {
            setDesktopExpanded(false);
          }
        }}
        onFocusCapture={() => {
          if (!desktopAlwaysOpen) {
            setDesktopExpanded(true);
          }
        }}
        onBlur={(event) => {
          if (!desktopAlwaysOpen && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDesktopExpanded(false);
          }
        }}
      >
        <Link
          href="/dashboard"
          className={cn(
            "mb-6 flex items-center rounded-xl transition-all duration-300",
            desktopOpen ? "w-full gap-3 px-2" : "justify-center"
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
              "whitespace-nowrap text-sm font-bold tracking-tight text-white transition-all duration-200 lg:text-[15px] xl:text-base",
              desktopOpen
                ? "max-w-[136px] translate-x-0 opacity-100"
                : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
            )}
          >
            KOITALA
          </span>
        </Link>

        <Link
          href={adminProfileHref}
          aria-label="Ouvrir le profil administrateur"
          className={cn(
            "mb-4 flex items-center rounded-2xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
            desktopOpen
              ? "w-full gap-3 border border-white/10 bg-white/8 px-3 py-2.5 hover:border-white/20 hover:bg-white/12"
              : "justify-center p-1 hover:bg-white/10"
          )}
        >
          <DashboardAvatar
            name={displayName}
            avatarUrl={adminAvatarUrl}
            className={cn(
              "shrink-0 transition-all duration-300",
              desktopOpen ? "h-10 w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12" : "h-10 w-10 lg:h-11 lg:w-11"
            )}
          />
          <div
            className={cn(
              "min-w-0 transition-all duration-200",
              desktopOpen
                ? "max-w-[122px] translate-x-0 opacity-100"
                : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
            )}
          >
            <p className="truncate text-[13px] font-semibold text-white lg:text-sm">{displayName}</p>
            <p className="text-[11px] text-white/65">Administrateur</p>
          </div>
        </Link>

        {/* Main nav */}
        <nav
          className={cn(
            "flex flex-col gap-1.5",
            desktopOpen ? "items-stretch" : "items-center"
          )}
        >
          {navItems.map((item) => (
            <DesktopNavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom */}
        <div
          className={cn(
            "mt-2 flex flex-col gap-1.5 border-t border-white/10 pt-4",
            desktopOpen ? "items-stretch" : "items-center"
          )}
        >
          {bottomItems.map((item) => (
            <DesktopNavItem key={item.href} item={item} />
          ))}
          <Link
            href={adminAssistantHref}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group flex items-center rounded-xl transition-all duration-300",
              desktopOpen ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center",
              isActive(adminAssistantHref)
                ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            aria-label="Ouvrir la page assistant IA admin"
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
                isActive(adminAssistantHref)
                  ? "bg-white text-[#1a3a5c] shadow-sm"
                  : "bg-white/10 text-white/90 group-hover:bg-white/20 group-hover:text-white"
              )}
            >
              <Bot className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition-all duration-200",
                isActive(adminAssistantHref) ? "text-white" : "text-white/80 group-hover:text-white",
                desktopOpen
                  ? "max-w-[186px] translate-x-0 opacity-100"
                  : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
              )}
            >
              Assistant IA
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le site (nouvel onglet)"
            className={cn(
              "group flex items-center rounded-xl text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white",
              desktopOpen ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/90 transition-all duration-300 group-hover:bg-white/20 group-hover:text-white">
              <ExternalLink className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition-all duration-200",
                desktopOpen
                  ? "max-w-[186px] translate-x-0 opacity-100"
                  : "pointer-events-none max-w-0 -translate-x-2 overflow-hidden opacity-0"
              )}
            >
              Voir le site
            </span>
          </Link>
        </div>

        <div
          className={cn(
            "mt-auto flex flex-col border-t border-white/10 pt-4",
            desktopOpen ? "items-stretch" : "items-center"
          )}
        >
          <button
            onClick={() => setShowSignOutDialog(true)}
            disabled={isSigningOut}
            className={cn(
              "group flex items-center rounded-xl bg-[#6b4226] text-white transition-all duration-300 hover:bg-[#55331d] disabled:cursor-not-allowed disabled:opacity-70",
              desktopOpen ? "h-11 w-full justify-start gap-2.5 px-2.5" : "h-11 w-11 justify-center"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <LogOut className="h-[18px] w-[18px]" />
            </span>
            <span
              className={cn(
                "whitespace-nowrap text-sm font-semibold transition-all duration-200",
                desktopOpen
                  ? "max-w-[186px] translate-x-0 opacity-100"
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
          <span className="text-base font-bold text-white">KOI<span className="text-[#e8b86d]">TALA</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={adminProfileHref}
            onClick={() => setMobileOpen(false)}
            aria-label="Ouvrir le profil administrateur"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <DashboardAvatar
              name={displayName}
              avatarUrl={adminAvatarUrl}
              className="h-8 w-8 shrink-0 text-[11px]"
            />
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="w-10 h-10 flex items-center justify-center text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
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
          "md:hidden fixed top-14 left-0 bottom-0 z-40 flex w-56 flex-col overflow-hidden overscroll-none bg-[#1a3a5c] transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="px-4 py-4 border-b border-white/10">
          <Link
            href={adminProfileHref}
            onClick={() => setMobileOpen(false)}
            aria-label="Ouvrir le profil administrateur"
            className="flex items-center gap-3 rounded-2xl p-1 -m-1 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <DashboardAvatar
              name={displayName}
              avatarUrl={adminAvatarUrl}
              className="h-9 w-9 shrink-0 text-xs"
            />
            <div>
              <p className="text-[13px] font-semibold text-white">{displayName}</p>
              <p className="text-xs text-gray-400">Administrateur</p>
            </div>
          </Link>
        </div>
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
        <div className="border-t border-white/10 px-3 py-4">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all",
                  active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={adminAssistantHref}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all",
              isActive(adminAssistantHref)
                ? "bg-white/10 text-white"
                : "text-white/80 hover:bg-white/5 hover:text-white"
            )}
          >
            <Bot className="h-5 w-5 shrink-0" /> Assistant IA
          </Link>
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
