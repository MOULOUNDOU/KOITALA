"use client";

import { useEffect, useState, type SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ArrowRight, MessageCircle } from "lucide-react";
import { PUBLIC_ASSISTANT_PAGE_HREF } from "@/lib/ai/widget";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    label: "Appartements",
    href: "/biens?type=appartement",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=320&q=80",
    alt: "Illustration appartement",
  },
  {
    label: "Maisons",
    href: "/biens?type=maison",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=320&q=80",
    alt: "Illustration maison",
  },
  {
    label: "Villas",
    href: "/biens?type=villa",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=320&q=80",
    alt: "Illustration villa",
  },
  {
    label: "Terrains",
    href: "/biens?type=terrain",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=320&q=80",
    alt: "Illustration terrain",
  },
  {
    label: "Bureaux",
    href: "/biens?type=bureau",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=320&q=80",
    alt: "Illustration bureau",
  },
  {
    label: "Locaux comm.",
    href: "/biens?type=local_commercial",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=320&q=80",
    alt: "Illustration local commercial",
  },
  {
    label: "Duplexes",
    href: "/biens?type=duplex",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=320&q=80",
    alt: "Illustration duplex",
  },
  {
    label: "Tous les biens",
    href: "/biens",
    image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=320&q=80",
    alt: "Illustration tous les biens",
  },
];

const TRANSACTION_LINKS = [
  {
    title: "Acheter",
    description: "Biens en vente",
    href: "/biens?listing_type=vente",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80",
    alt: "Illustration achat immobilier",
    className: "bg-[#1a3a5c] text-white hover:bg-[#0f2540]",
    descriptionClassName: "text-white/60",
  },
  {
    title: "Louer",
    description: "Biens en location",
    href: "/biens?listing_type=location",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80",
    alt: "Illustration location immobiliere",
    className: "bg-[#e8b86d]/15 text-[#1a3a5c] hover:bg-[#e8b86d]/25",
    descriptionClassName: "text-gray-500",
  },
] as const;

const SERVICES_LINKS = [
  { label: "Vente",            href: "/biens?listing_type=vente" },
  { label: "Location",         href: "/biens?listing_type=location" },
  { label: "Réalisations",     href: "/nos-realisations" },
  { label: "Conseil juridique",href: "/contact?sujet=juridique" },
];

function FacebookIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor" {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.12 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.54-4.7 1.31 0 2.69.24 2.69.24v2.98h-1.52c-1.5 0-1.97.94-1.97 1.9v2.24h3.35l-.54 3.49h-2.81V24C19.61 23.12 24 18.1 24 12.07Z" />
    </svg>
  );
}

function TikTokIcon({ className = "h-4 w-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor" {...props}>
      <path d="M21.7 8.73a7.4 7.4 0 0 1-4.34-1.4v6.35a5.7 5.7 0 1 1-5.7-5.7c.2 0 .4.01.6.04v2.8a2.93 2.93 0 1 0 2.33 2.86V2h2.77a4.64 4.64 0 0 0 4.34 4.34v2.4Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://wa.me/221766752135", label: "WhatsApp", Icon: WhatsAppIcon },
  { href: "https://www.facebook.com/", label: "Facebook", Icon: FacebookIcon },
  { href: "https://www.tiktok.com/", label: "TikTok", Icon: TikTokIcon },
] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [biensMobileOpen, setBiensMobileOpen] = useState(false);
  const [servicesMobileOpen, setServicesMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAssistantMenuClick = () => {
    setIsOpen(false);
    setBiensMobileOpen(false);
    setServicesMobileOpen(false);
  };

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-white shadow-md"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-koitala.png" alt="KOITALA" width={44} height={44} className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl object-cover" priority />
            <span
              className={cn(
                "text-2xl sm:text-xl font-bold tracking-wide transition-colors",
                scrolled || !isHome ? "text-[#1a3a5c]" : "text-white"
              )}
            >
              KOI<span className="text-[#e8b86d]">TALA</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {/* Accueil */}
            <Link href="/" className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/" ? (scrolled || !isHome ? "bg-[#1a3a5c]/10 text-[#1a3a5c]" : "bg-white/20 text-white")
                              : (scrolled || !isHome ? "text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10")
            )}>Accueil</Link>

            {/* Nos biens dropdown */}
            <div className="nav-submenu-trigger relative group">
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/biens") ? (scrolled || !isHome ? "bg-[#1a3a5c]/10 text-[#1a3a5c]" : "bg-white/20 text-white")
                                              : (scrolled || !isHome ? "text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10")
              )}>
                Nos biens
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              {/* Mega dropdown */}
              <div className="nav-submenu-shell absolute top-full left-0 z-50 w-[480px] pt-3">
                <div className="nav-submenu-panel w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_26px_70px_rgba(15,23,36,0.18)]">
                  <div className="grid grid-cols-2 gap-5">
                    {/* Left: Categories */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Par type de bien</p>
                      <div className="max-h-[336px] space-y-1 overflow-y-auto pr-1 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                          <Link key={cat.href} href={cat.href} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-[#f4f6f9] transition-colors group/cat">
                            <div className="relative h-12 w-14 overflow-hidden rounded-xl shrink-0 shadow-sm">
                              <Image
                                src={cat.image}
                                alt={cat.alt}
                                fill
                                className="object-cover transition-transform duration-300 group-hover/cat:scale-105"
                                sizes="56px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-[13px] font-medium text-gray-700 group-hover/cat:text-[#1a3a5c]">{cat.label}</span>
                              <span className="block text-[11px] text-gray-400">Explorer la categorie</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Right: Par transaction */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Par transaction</p>
                      <div className="space-y-1.5">
                        {TRANSACTION_LINKS.map((item) => (
                          <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${item.className}`}>
                            <div className="relative h-14 w-16 overflow-hidden rounded-xl shrink-0 shadow-sm">
                              <Image
                                src={item.image}
                                alt={item.alt}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className={`text-[11px] ${item.descriptionClassName}`}>{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-[#f4f6f9] rounded-xl">
                        <p className="text-xs font-semibold text-[#0f1724] mb-1">Besoin d&apos;aide ?</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-2">Nos conseillers vous accompagnent dans votre recherche.</p>
                        <Link href="/contact" className="text-xs font-semibold text-[#1a3a5c] hover:underline flex items-center gap-1">
                          Nous contacter <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services dropdown */}
            <div className="nav-submenu-trigger relative group">
              <button className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                scrolled || !isHome ? "text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10"
              )}>
                Services
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="nav-submenu-shell absolute top-full left-1/2 z-50 w-56 pt-3">
                <div className="-translate-x-1/2">
                  <div className="nav-submenu-panel w-full rounded-2xl border border-gray-100 bg-white py-2 shadow-[0_22px_55px_rgba(15,23,36,0.16)]">
                    {SERVICES_LINKS.map((s) => (
                      <Link key={s.href} href={s.href} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f4f6f9] hover:text-[#1a3a5c] transition-colors">
                        {s.label} <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Simple links */}
            {[
              { href: "/a-propos", label: "À propos" },
              { href: "/collaborateurs", label: "Collaborateurs" },
              { href: "/nos-realisations", label: "Réalisations" },
              { href: "/blog",     label: "Blog" },
              { href: "/contact",  label: "Contact" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href ? (scrolled || !isHome ? "bg-[#1a3a5c]/10 text-[#1a3a5c]" : "bg-white/20 text-white")
                                      : (scrolled || !isHome ? "text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100" : "text-white/90 hover:text-white hover:bg-white/10")
              )}>{link.label}</Link>
            ))}

            <Link
              href={PUBLIC_ASSISTANT_PAGE_HREF}
              onClick={handleAssistantMenuClick}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                scrolled || !isHome
                  ? "text-gray-600 hover:text-[#1a3a5c] hover:bg-gray-100"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Assistant IA
            </Link>
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-3">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                  label === "WhatsApp"
                    ? "border-[#25D366] bg-[#25D366] text-white hover:border-[#20ba5a] hover:bg-[#20ba5a]"
                    : scrolled || !isHome
                      ? "border-gray-200 bg-white text-[#1a3a5c] hover:border-[#1a3a5c] hover:bg-[#1a3a5c] hover:text-white"
                      : "border-white/40 bg-white/10 text-white hover:bg-white hover:text-[#1a3a5c]"
                )}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          {/* Animated hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors focus:outline-none",
              scrolled || !isHome
                ? "text-gray-700 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            )}
          >
            <div className="w-6 h-5 flex flex-col justify-between relative">
              <span className={cn(
                "block h-0.5 w-6 rounded-full transition-all duration-300 origin-center",
                scrolled || !isHome ? "bg-gray-700" : "bg-white",
                isOpen && "rotate-45 translate-y-[9px]"
              )} />
              <span className={cn(
                "block h-0.5 rounded-full transition-all duration-300",
                scrolled || !isHome ? "bg-gray-700" : "bg-white",
                isOpen ? "w-0 opacity-0" : "w-6 opacity-100"
              )} />
              <span className={cn(
                "block h-0.5 w-6 rounded-full transition-all duration-300 origin-center",
                scrolled || !isHome ? "bg-gray-700" : "bg-white",
                isOpen && "-rotate-45 -translate-y-[9px]"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile menu — animated slide-down */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-400 ease-in-out",
          isOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="bg-white border-t border-gray-100 pb-5 pt-2">
            <div className="flex flex-col gap-0.5 px-2">

              {/* Accueil */}
              <Link href="/" onClick={() => setIsOpen(false)}
                className={cn("flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200",
                  pathname === "/" ? "bg-[#1a3a5c] text-white" : "text-gray-700 hover:bg-[#1a3a5c]/8 hover:text-[#1a3a5c]")}>
                Accueil
              </Link>

              {/* Nos biens expandable */}
              <div>
                <button
                  onClick={() => setBiensMobileOpen(!biensMobileOpen)}
                  aria-expanded={biensMobileOpen}
                  aria-controls="mobile-biens-submenu"
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl text-gray-700 hover:bg-[#1a3a5c]/8 hover:text-[#1a3a5c] transition-all duration-200">
                  Nos biens
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", biensMobileOpen && "rotate-180")} />
                </button>
                <div id="mobile-biens-submenu" className="mobile-submenu-grid" data-open={biensMobileOpen ? "true" : "false"}>
                  <div className="mx-3 mb-2 bg-[#f8f9fb] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Par type de bien</p>
                    <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1 scrollbar-hide">
                      {CATEGORIES.map((cat) => (
                        <Link key={cat.href} href={cat.href} onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white text-[13px] font-medium text-gray-600 hover:text-[#1a3a5c] transition-colors">
                          <div className="relative h-12 w-14 overflow-hidden rounded-xl shrink-0 shadow-sm">
                            <Image
                              src={cat.image}
                              alt={cat.alt}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block">{cat.label}</span>
                            <span className="block text-[11px] text-gray-400">Voir les annonces</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2 pt-2.5 border-t border-gray-200">
                      <Link href="/biens?listing_type=vente" onClick={() => setIsOpen(false)}
                        className="flex-1 text-center py-2.5 bg-[#1a3a5c] text-white text-[13px] font-semibold rounded-lg active:scale-[.97] transition-all">Acheter</Link>
                      <Link href="/biens?listing_type=location" onClick={() => setIsOpen(false)}
                        className="flex-1 text-center py-2.5 bg-[#e8b86d] text-[#1a3a5c] text-[13px] font-semibold rounded-lg active:scale-[.97] transition-all">Louer</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services expandable */}
              <div>
                <button
                  onClick={() => setServicesMobileOpen(!servicesMobileOpen)}
                  aria-expanded={servicesMobileOpen}
                  aria-controls="mobile-services-submenu"
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl text-gray-700 hover:bg-[#1a3a5c]/8 hover:text-[#1a3a5c] transition-all duration-200">
                  Services
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", servicesMobileOpen && "rotate-180")} />
                </button>
                <div id="mobile-services-submenu" className="mobile-submenu-grid" data-open={servicesMobileOpen ? "true" : "false"}>
                  <div className="mx-3 mb-2 bg-[#f8f9fb] rounded-xl overflow-hidden">
                    {SERVICES_LINKS.map((s) => (
                      <Link key={s.href} href={s.href} onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-white hover:text-[#1a3a5c] transition-colors border-b border-gray-100 last:border-0">
                        {s.label} <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Other links */}
              {[
                { href: "/a-propos", label: "À propos" },
                { href: "/collaborateurs", label: "Collaborateurs" },
                { href: "/nos-realisations", label: "Réalisations" },
                { href: "/blog",     label: "Blog" },
                { href: "/contact",  label: "Contact" },
              ].map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                  className={cn("flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200",
                    pathname === link.href ? "bg-[#1a3a5c] text-white" : "text-gray-700 hover:bg-[#1a3a5c]/8 hover:text-[#1a3a5c]")}>
                  {link.label}
                </Link>
              ))}

              <Link
                href={PUBLIC_ASSISTANT_PAGE_HREF}
                onClick={handleAssistantMenuClick}
                className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 text-gray-700 hover:bg-[#1a3a5c]/8 hover:text-[#1a3a5c]"
              >
                <MessageCircle className="h-4 w-4" />
                Assistant IA
              </Link>
            </div>

            <hr className="my-3 border-gray-100 mx-4" />

            <div className="px-4">
              <div className="flex items-center justify-center gap-3">
                {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                  <a
                    key={`mobile-${label}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                      label === "WhatsApp"
                        ? "border-[#25D366] bg-[#25D366] text-white hover:border-[#20ba5a] hover:bg-[#20ba5a]"
                        : "border-gray-200 bg-white text-[#1a3a5c] hover:border-[#1a3a5c] hover:bg-[#1a3a5c] hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
