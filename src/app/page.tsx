export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Star, Users, TrendingUp, Phone, Building2, Home, Key, BarChart3, Scale } from "lucide-react";
import HeroCarousel from "@/components/layout/HeroCarousel";
import HeroTextAnimation from "@/components/layout/HeroTextAnimation";
import AnimatedSection from "@/components/layout/AnimatedSection";
import NewsletterForm from "@/components/layout/NewsletterForm";
import StatsCarousel from "@/components/layout/StatsCarousel";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import HomePropertyCarousel from "@/components/properties/HomePropertyCarousel";
import CategoryIcons from "@/components/layout/CategoryIcons";
import SearchBar from "@/components/properties/SearchBar";
import LoginPromptPopup from "@/components/layout/LoginPromptPopup";
import SitePagination from "@/components/ui/SitePagination";
import HowItWorksMobileCarousel from "@/components/layout/HowItWorksMobileCarousel";
import { HOW_IT_WORKS_STEPS } from "@/components/layout/howItWorksData";
import TestimonialsMobileCarousel from "@/components/layout/TestimonialsMobileCarousel";
import { getFeaturedProperties, getRecentProperties } from "@/lib/properties";
import { SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Agence immobiliere a Dakar | Achat, vente, location et construction",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KOITALA | Agence immobiliere a Dakar",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "KOITALA | Agence immobiliere a Dakar",
    description: SITE_DESCRIPTION,
  },
};

const STATS = [
  { label: "Années dans l'immobilier", value: "12+", icon: "Building2" },
  { label: "Ans d'expérience pro", value: "23+", icon: "Star" },
  { label: "Clients accompagnés", value: "500+", icon: "Users" },
  { label: "Projets réalisés", value: "300+", icon: "TrendingUp" },
];

const SERVICES = [
  { icon: Home, title: "Achat & Vente", description: "Découvrez une large sélection de biens adaptés à vos besoins et votre budget. Nous vous accompagnons tout au long du processus pour garantir une transaction réussie." },
  { icon: Key, title: "Construction clé en main", description: "Nous réalisons votre projet immobilier, de la conception à la remise des clés, avec des partenaires fiables et un suivi rigoureux." },
  { icon: BarChart3, title: "Gestion locative", description: "Confiez-nous la location et la gestion complète de votre bien : recherche de locataires, gestion des loyers, entretien et reporting régulier." },
  { icon: Scale, title: "Conseils & Accompagnement", description: "Services adaptés aux expatriés avec un accompagnement complet pour faciliter l'intégration dans le marché immobilier local." },
];

const TESTIMONIALS = [
  {
    name: "Amadou Diallo",
    role: "Acheteur – Villa à Almadies",
    text: "KOITALA m'a accompagné du début à la fin. Professionnalisme, réactivité et écoute. J'ai trouvé la maison de mes rêves en moins d'un mois.",
    stars: 5,
    avatar: "AD",
  },
  {
    name: "Fatou Ndiaye",
    role: "Locataire – Appartement Plateau",
    text: "Équipe très disponible et transparente. Toutes les démarches ont été claires et rapides. Je recommande vivement cette agence.",
    stars: 5,
    avatar: "FN",
  },
  {
    name: "Moussa Sow",
    role: "Investisseur – Local commercial",
    text: "J'ai pu investir en toute confiance grâce aux conseils experts de KOITALA. Leur connaissance du marché sénégalais est remarquable.",
    stars: 5,
    avatar: "MS",
  },
  {
    name: "Aissatou Ba",
    role: "Vendeuse - Maison a Ngor",
    text: "La mise en vente a ete rapide et bien geree. L'equipe a filtre les demandes serieusement et m'a accompagne jusqu'a la signature.",
    stars: 5,
    avatar: "AB",
  },
  {
    name: "Cheikh Gueye",
    role: "Locataire - Studio aux Mamelles",
    text: "J'avais besoin d'un logement en urgence. KOITALA a su me proposer des options adaptees et tout a ete boucle en quelques jours.",
    stars: 5,
    avatar: "CG",
  },
  {
    name: "Mariama Sarr",
    role: "Acheteuse - Appartement a Mermoz",
    text: "J'ai apprecie le suivi, la clarte des explications et la disponibilite pendant tout le processus. Je me suis sentie en confiance du debut a la fin.",
    stars: 5,
    avatar: "MS",
  },
  {
    name: "Ibrahima Fall",
    role: "Investisseur - Terrain a Saly",
    text: "Tres bon accompagnement sur la verification du dossier et la projection de rentabilite. Les conseils etaient concrets et utiles pour ma decision.",
    stars: 5,
    avatar: "IF",
  },
  {
    name: "Khady Diop",
    role: "Expatriee - Villa a Somone",
    text: "A distance, ce n'est jamais simple. KOITALA a tout fluidifie avec des comptes rendus reguliers, des visites bien preparees et une vraie transparence.",
    stars: 5,
    avatar: "KD",
  },
] as const;

function shuffleItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

const RENTAL_CATEGORY_LINKS = [
  { label: "Chambre meublée", href: "/biens?listing_type=location&rental_category=chambre_meublee" },
  { label: "Studio", href: "/biens?listing_type=location&rental_category=studio" },
  { label: "Appartement", href: "/biens?listing_type=location&rental_category=appartement" },
  { label: "Mini studio", href: "/biens?listing_type=location&rental_category=mini_studio" },
  { label: "Colocation", href: "/biens?listing_type=location&rental_category=colocation" },
];

interface HomePageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const FEATURED_PAGE_SIZE = 6;
  const RECENT_LIMIT = 6;
  const parsedFeaturedPage = Number(params.featured_page ?? "1");
  let currentFeaturedPage =
    Number.isFinite(parsedFeaturedPage) && parsedFeaturedPage > 0
      ? Math.floor(parsedFeaturedPage)
      : 1;

  const [featuredQuery, recent] = await Promise.all([
    getFeaturedProperties(currentFeaturedPage, FEATURED_PAGE_SIZE),
    getRecentProperties(RECENT_LIMIT),
  ]);

  let featured = featuredQuery.properties;
  let totalFeatured = featuredQuery.total;
  const computedFeaturedTotalPages = Math.max(1, Math.ceil(totalFeatured / FEATURED_PAGE_SIZE));

  if (totalFeatured > 0 && currentFeaturedPage > computedFeaturedTotalPages) {
    currentFeaturedPage = computedFeaturedTotalPages;
    const fallbackFeaturedQuery = await getFeaturedProperties(currentFeaturedPage, FEATURED_PAGE_SIZE);
    featured = fallbackFeaturedQuery.properties;
    totalFeatured = fallbackFeaturedQuery.total;
  }

  const featuredTotalPages = Math.max(1, Math.ceil(totalFeatured / FEATURED_PAGE_SIZE));
  const displayedFeatured = shuffleItems(featured);
  const displayedRecent = shuffleItems(recent);
  const displayedTestimonials = shuffleItems(TESTIMONIALS).slice(0, 6);

  const buildFeaturedPageHref = (page: number): string => {
    const nextParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (!value || key === "featured_page" || key === "annonces_page") return;
      nextParams.set(key, value);
    });
    if (page > 1) {
      nextParams.set("featured_page", String(page));
    }
    const query = nextParams.toString();
    return query ? `/?${query}#biens-recommandes` : "/#biens-recommandes";
  };

  return (
    <div className="public-motion-scope overflow-x-hidden">
      <Navbar />
      <LoginPromptPopup />
      <main>
          {/* HERO */}
          <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
            <HeroCarousel />
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-24">
              <div className="text-center mb-8 sm:mb-10">
                <HeroTextAnimation />
                <p className="animate-fade-up stagger-1 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed px-1">
                  Fort de 23 ans d&apos;expérience et 12 années d&apos;expertise dans l&apos;immobilier, KOITALA vous accompagne dans l&apos;achat, la vente, la construction et la location. Résidents et expatriés.
                </p>
              </div>
              <SearchBar className="max-w-4xl mx-auto" />
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <StatsCarousel stats={STATS} />
            </div>
          </section>

          {/* CATEGORY ICONS */}
          <section className="pt-6 sm:pt-10 pb-6 sm:pb-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 sm:mb-5">
              <h2 className="text-[15px] sm:text-xl font-bold text-[#0f1724]">Explorer par catégorie</h2>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <CategoryIcons />
              <div className="mt-5 sm:mt-6">
                <p className="text-xs sm:text-sm font-semibold text-[#1a3a5c] mb-2.5">Maisons à louer</p>
                <div className="flex flex-wrap gap-2">
                  {RENTAL_CATEGORY_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-[#1a3a5c]/10 text-[#1a3a5c] hover:bg-[#1a3a5c] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

        {/* FEATURED */}
        {displayedFeatured.length > 0 && (
          <section id="biens-recommandes" className="py-8 sm:py-20 bg-white" data-login-trigger>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between mb-5 sm:mb-10">
                <div>
                  <span className="hidden sm:block text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">Coups de cœur</span>
                  <h2 className="font-display text-lg min-[420px]:text-xl sm:text-3xl font-extrabold text-[#0f1724] sm:mt-1">Biens recommandés</h2>
                </div>
                <Link href="/biens" className="inline-flex w-fit items-center gap-1 text-xs min-[420px]:text-sm font-semibold text-[#1a3a5c] hover:text-[#e8b86d] transition-colors shrink-0">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Desktop: 3-col */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedFeatured.map((property, i) => (
                  <AnimatedSection key={property.id} animation="fade-up" delay={i * 80}>
                    <PropertyCard property={property} preferVideoBubble />
                  </AnimatedSection>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {displayedFeatured.map((property) => (
                  <PropertyCardMobile key={property.id} property={property} preferVideoBubble />
                ))}
              </div>

              {featuredTotalPages > 1 && (
                <SitePagination
                  currentPage={currentFeaturedPage}
                  totalPages={featuredTotalPages}
                  buildHref={buildFeaturedPageHref}
                  pageKeyPrefix="home-featured"
                />
              )}
            </div>
          </section>
        )}

        {/* RECENT */}
        <section id="annonces-recentes" className="py-8 sm:py-20 bg-[#f4f6f9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between mb-5 sm:mb-10">
              <div>
                <span className="hidden sm:block text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">Nouveautés</span>
                <h2 className="font-display text-lg min-[420px]:text-xl sm:text-3xl font-extrabold text-[#0f1724] sm:mt-1">À proximité</h2>
              </div>
              <Link href="/biens" className="inline-flex w-fit items-center gap-1 text-xs min-[420px]:text-sm font-semibold text-[#1a3a5c] hover:text-[#e8b86d] transition-colors shrink-0">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {displayedRecent.length > 0 ? (
              <>
                {/* Desktop: 3-col grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedRecent.map((property, i) => (
                    <AnimatedSection key={property.id} animation="fade-up" delay={i * 80}>
                      <PropertyCard property={property} preferVideoBubble />
                    </AnimatedSection>
                  ))}
                </div>
                <HomePropertyCarousel
                  properties={displayedRecent}
                  variant="horizontal"
                  preferVideoBubble
                />
              </>
            ) : (
              <div className="text-center py-16">
                <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Aucun bien disponible pour le moment.</p>
                <p className="text-gray-400 text-sm mt-1">Revenez bientôt pour découvrir nos nouvelles annonces.</p>
              </div>
            )}
          </div>
        </section>

        {/* SERVICES */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-10 sm:mb-12">
              <span className="text-[#e8b86d] text-xs sm:text-sm font-semibold uppercase tracking-widest">Nos services</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Tout pour votre projet immobilier</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {SERVICES.map((service, i) => (
                <AnimatedSection key={service.title} animation="scale-in" delay={i * 80}>
                  <div className="h-full bg-[#f4f6f9] rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default">
                    <div className="w-12 h-12 bg-[#1a3a5c] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#e8b86d] group-hover:scale-110 transition-all duration-300">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[#0f1724] mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="text-center mb-12">
              <span className="text-[#e8b86d] text-xs sm:text-sm font-semibold uppercase tracking-widest">Comment ça marche</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Votre projet en 4 étapes simples</h2>
            </AnimatedSection>
            <HowItWorksMobileCarousel />
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_IT_WORKS_STEPS.map((item, i) => (
                <AnimatedSection key={item.step} animation="fade-up" delay={i * 100}>
                  <div className="relative text-center">
                    {i < 3 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#e8b86d]/40 to-transparent -translate-x-4 z-0" />
                    )}
                    <div className="relative inline-flex mb-5">
                      <div className="w-16 h-16 bg-[#1a3a5c] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <item.icon className="w-7 h-7 text-[#e8b86d]" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#e8b86d] text-[#1a3a5c] text-xs font-bold rounded-full flex items-center justify-center">{item.step}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#0f1724] mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* WHY US */}
        <section className="py-16 sm:py-20 bg-[#0f1724]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <AnimatedSection animation="slide-left">
                <span className="text-[#e8b86d] text-xs sm:text-sm font-semibold uppercase tracking-widest">Pourquoi choisir KOITALA ?</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-5 leading-snug">Une expertise unique au service de vos projets</h2>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-7">
                  Une expérience de 23 ans dans les télécommunications et 12 ans dans l&apos;immobilier, alliant rigueur, professionnalisme et une parfaite compréhension des besoins des clients, y compris ceux des expatriés.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Shield, title: "Experts à votre écoute", desc: "Une équipe dédiée, attentive aux besoins spécifiques des résidents et expatriés." },
                    { icon: Star, title: "Biens de qualité", desc: "Des biens soigneusement sélectionnés, adaptés à chaque budget et chaque projet." },
                    { icon: Users, title: "Accompagnement de A à Z", desc: "Des solutions pratiques pour naviguer facilement dans le marché immobilier local." },
                  ].map((item, i) => (
                    <AnimatedSection key={item.title} animation="fade-up" delay={i * 100}>
                      <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 bg-[#e8b86d]/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <item.icon className="w-5 h-5 text-[#e8b86d]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-sm text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </AnimatedSection>
              <AnimatedSection animation="slide-right" className="relative h-72 sm:h-96 lg:h-full lg:min-h-[420px] rounded-2xl overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" alt="KOITALA équipe" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1724]/60 to-transparent" />
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 sm:py-20 bg-[#f4f6f9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-up" className="mb-8 sm:hidden">
              <div className="flex items-end justify-between gap-4">
                <div className="text-left">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#e8b86d]">Témoignages</span>
                  <h2 className="font-display mt-1 text-2xl font-bold text-[#0f1724]">Ce que disent nos clients</h2>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                    Achat, location ou investissement: ils nous ont confié leur projet.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[#1a3a5c]/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a3a5c]/60">
                  {displayedTestimonials.length} avis
                </span>
              </div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" className="hidden text-center mb-10 sm:mb-12 sm:block">
              <span className="text-[#e8b86d] text-xs sm:text-sm font-semibold uppercase tracking-widest">Témoignages</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Ce que disent nos clients</h2>
            </AnimatedSection>
            <TestimonialsMobileCarousel testimonials={displayedTestimonials} />
            <div className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {displayedTestimonials.map((t, i) => (
                <AnimatedSection key={t.name} animation="fade-up" delay={i * 100}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-[#e8b86d] text-[#e8b86d]" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1 italic">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                      <div className="w-10 h-10 bg-[#1a3a5c] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0f1724]">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <AnimatedSection animation="fade-up">
          <section className="py-14 sm:py-16 bg-[#1a3a5c]">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="w-14 h-14 bg-[#e8b86d]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <TrendingUp className="w-7 h-7 text-[#e8b86d]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Restez informé du marché</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-8">Recevez les nouvelles annonces et les tendances du marché immobilier sénégalais directement dans votre boîte mail.</p>
              <NewsletterForm />
              <p className="text-xs text-gray-500 mt-4">Pas de spam. Désinscription à tout moment.</p>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection animation="scale-in">
          <section className="py-14 sm:py-16 bg-[#e8b86d]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-[2rem] bg-[#fff8ee] px-6 py-8 shadow-[0_24px_80px_rgba(15,23,36,0.12)] sm:px-8 sm:py-10 lg:px-12">
                <div className="lg:hidden text-center">
                  <h2 className="font-display text-2xl font-bold leading-tight text-[#0f1724]">
                    Prêt à concrétiser votre projet ?
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[#1a3a5c]">
                    Contactez-nous dès aujourd&apos;hui pour discuter de votre projet immobilier et prendre rendez-vous avec nos conseillers.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link
                      href="/contact"
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#1a3a5c] px-3 py-3.5 text-[13px] font-semibold leading-tight text-white transition-all duration-200 hover:bg-[#0f2540] active:scale-95"
                    >
                      Nous contacter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="tel:+221766752135"
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#1a3a5c]/15 bg-white px-3 py-3.5 text-[13px] font-semibold leading-tight text-[#1a3a5c] transition-all duration-200 hover:bg-gray-50 active:scale-95"
                    >
                      <Phone className="h-4 w-4" />
                      +221 76 675 21 35
                    </a>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[#1a3a5c]/75">
                    Un premier échange suffit pour cadrer votre besoin.
                  </p>
                </div>

                <div className="hidden gap-8 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:items-center">
                  <div className="text-left">
                    <h2 className="font-display text-2xl font-bold leading-tight text-[#0f1724] sm:text-3xl lg:text-4xl">
                      Prêt à concrétiser votre projet ?
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#1a3a5c] sm:text-lg lg:max-w-none">
                      Contactez-nous dès aujourd&apos;hui pour discuter de votre projet immobilier et prendre rendez-vous avec nos conseillers.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
                      {["Achat", "Vente", "Location", "Construction"].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[#1a3a5c]/12 bg-white px-3.5 py-2 text-sm font-medium text-[#1a3a5c]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-[#1a3a5c] p-5 text-center text-white shadow-lg sm:p-6 lg:text-left">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                      Choisissez votre canal
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href="/contact"
                        className="inline-flex min-w-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-[#1a3a5c] transition-all duration-200 hover:bg-[#f8fafc] active:scale-95 sm:text-base"
                      >
                        Nous contacter
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <a
                        href="tel:+221766752135"
                        className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15 active:scale-95 sm:text-base"
                      >
                        <Phone className="h-4 w-4" />
                        +221 76 675 21 35
                      </a>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-white/75">
                      Un premier échange suffit pour cadrer votre besoin et définir les prochaines étapes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}
