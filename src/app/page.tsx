export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield, Star, Users, TrendingUp, Phone, Building2, Home, Key, BarChart3, Scale, MapPin, CheckCircle } from "lucide-react";
import HeroCarousel from "@/components/layout/HeroCarousel";
import HeroTextAnimation from "@/components/layout/HeroTextAnimation";
import AnimatedSection from "@/components/layout/AnimatedSection";
import NewsletterForm from "@/components/layout/NewsletterForm";
import StatsCarousel from "@/components/layout/StatsCarousel";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyCardMobile from "@/components/properties/PropertyCardMobile";
import PropertyCardHorizontal from "@/components/properties/PropertyCardHorizontal";
import CategoryIcons from "@/components/layout/CategoryIcons";
import SearchBar from "@/components/properties/SearchBar";
import LoginPromptPopup from "@/components/layout/LoginPromptPopup";
import type { Property } from "@/types";

export const metadata: Metadata = {
  title: "KOITALA - Agence Immobilière | Achat, Vente, Construction & Location",
  description: "Agence Immobilière KOITALA : votre partenaire pour tous vos projets immobiliers, y compris pour les expatriés. Achat, vente, construction clé en main et gestion locative.",
};

async function getFeaturedProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "publie")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

async function getRecentProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "publie")
    .order("created_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

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

const RENTAL_CATEGORY_LINKS = [
  { label: "Chambre meublée", href: "/biens?listing_type=location&rental_category=chambre_meublee" },
  { label: "Studio", href: "/biens?listing_type=location&rental_category=studio" },
  { label: "Appartement", href: "/biens?listing_type=location&rental_category=appartement" },
  { label: "Mini studio", href: "/biens?listing_type=location&rental_category=mini_studio" },
  { label: "Colocation", href: "/biens?listing_type=location&rental_category=colocation" },
];

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedProperties(), getRecentProperties()]);

  return (
    <>
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
        {featured.length > 0 && (
          <section className="py-8 sm:py-20 bg-white" data-login-trigger>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between mb-5 sm:mb-10">
                <div>
                  <span className="hidden sm:block text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">Coups de cœur</span>
                  <h2 className="text-lg min-[420px]:text-xl sm:text-3xl font-extrabold text-[#0f1724] sm:mt-1">Biens recommandés</h2>
                </div>
                <Link href="/biens" className="inline-flex w-fit items-center gap-1 text-xs min-[420px]:text-sm font-semibold text-[#1a3a5c] hover:text-[#e8b86d] transition-colors shrink-0">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Desktop: 3-col */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((property, i) => (
                  <AnimatedSection key={property.id} animation="fade-up" delay={i * 80}>
                    <PropertyCard property={property} />
                  </AnimatedSection>
                ))}
              </div>
              {/* Mobile: 2-col compact grid */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:hidden">
                {featured.map((property) => (
                  <PropertyCardMobile key={property.id} property={property} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RECENT */}
        <section className="py-8 sm:py-20 bg-[#f4f6f9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between mb-5 sm:mb-10">
              <div>
                <span className="hidden sm:block text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">Nouveautés</span>
                <h2 className="text-lg min-[420px]:text-xl sm:text-3xl font-extrabold text-[#0f1724] sm:mt-1">À proximité</h2>
              </div>
              <Link href="/biens" className="inline-flex w-fit items-center gap-1 text-xs min-[420px]:text-sm font-semibold text-[#1a3a5c] hover:text-[#e8b86d] transition-colors shrink-0">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recent.length > 0 ? (
              <>
                {/* Desktop: 3-col grid */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recent.map((property, i) => (
                    <AnimatedSection key={property.id} animation="fade-up" delay={i * 80}>
                      <PropertyCard property={property} />
                    </AnimatedSection>
                  ))}
                </div>
                {/* Mobile: horizontal list cards */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {recent.map((property) => (
                    <PropertyCardHorizontal key={property.id} property={property} />
                  ))}
                </div>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Tout pour votre projet immobilier</h2>
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
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Votre projet en 4 étapes simples</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", icon: Home,         title: "Définissez votre projet",    desc: "Partagez vos critères : budget, type de bien, localisation, et vos besoins spécifiques." },
                { step: "02", icon: Users,         title: "Rencontrez notre équipe",    desc: "Un conseiller dédié vous accompagne et sélectionne les meilleures opportunités pour vous." },
                { step: "03", icon: MapPin,        title: "Visitez les biens",          desc: "Planifiez des visites et découvrez les propriétés qui correspondent à vos attentes." },
                { step: "04", icon: CheckCircle,   title: "Finalisez la transaction",   desc: "Notre équipe juridique sécurise votre transaction de A à Z, en toute transparence." },
              ].map((item, i) => (
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
            <AnimatedSection animation="fade-up" className="text-center mb-10 sm:mb-12">
              <span className="text-[#e8b86d] text-xs sm:text-sm font-semibold uppercase tracking-widest">Témoignages</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1724] mt-1">Ce que disent nos clients</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Amadou Diallo", role: "Acheteur – Villa à Almadies", text: "KOITALA m'a accompagné du début à la fin. Professionnalisme, réactivité et écoute. J'ai trouvé la maison de mes rêves en moins d'un mois.", stars: 5, avatar: "AD" },
                { name: "Fatou Ndiaye", role: "Locataire – Appartement Plateau", text: "Équipe très disponible et transparente. Toutes les démarches ont été claires et rapides. Je recommande vivement cette agence.", stars: 5, avatar: "FN" },
                { name: "Moussa Sow", role: "Investisseur – Local commercial", text: "J'ai pu investir en toute confiance grâce aux conseils experts de KOITALA. Leur connaissance du marché sénégalais est remarquable.", stars: 5, avatar: "MS" },
              ].map((t, i) => (
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f1724] mb-3">Prêt à concrétiser votre projet ?</h2>
              <p className="text-[#1a3a5c] text-base sm:text-lg mb-8">Contactez-nous dès aujourd&apos;hui pour discuter de votre projet immobilier et prendre rendez-vous avec nos conseillers.</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/contact" className="px-7 py-3.5 bg-[#1a3a5c] text-white font-semibold rounded-xl hover:bg-[#0f2540] active:scale-95 transition-all duration-200 shadow-md">
                  Nous contacter
                </Link>
                <a href="tel:+221766752135" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#1a3a5c] font-semibold rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-md">
                  <Phone className="w-4 h-4" />
                  +221 76 675 21 35
                </a>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
