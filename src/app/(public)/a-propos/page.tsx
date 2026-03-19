export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shield, Star, Users, TrendingUp, ArrowRight } from "lucide-react";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "A propos de KOITALA",
  description:
    "Decouvrez KOITALA, agence immobiliere a Dakar, son experience, ses valeurs et son accompagnement pour les residents et expatries.",
  alternates: {
    canonical: "/a-propos",
  },
  openGraph: {
    title: "A propos de KOITALA",
    description:
      "Decouvrez KOITALA, agence immobiliere a Dakar, son experience, ses valeurs et son accompagnement pour les residents et expatries.",
    url: absoluteUrl("/a-propos"),
  },
};

const VALUES = [
  {
    icon: Shield,
    title: "Rigueur & Transparence",
    description:
      "Chaque transaction est gérée avec honnêteté, professionnalisme et un suivi rigoureux.",
  },
  {
    icon: Star,
    title: "Biens de qualité",
    description:
      "Des biens soigneusement sélectionnés, adaptés à chaque budget et chaque projet.",
  },
  {
    icon: Users,
    title: "Expertise expatriés",
    description:
      "Un accompagnement complet pour faciliter l'intégration dans le marché immobilier local.",
  },
  {
    icon: TrendingUp,
    title: "Accompagnement A à Z",
    description:
      "Des solutions pratiques pour naviguer facilement dans le marché immobilier.",
  },
];

const TEAM = [
  {
    name: "Kouamé Koitala",
    role: "Directeur & Fondateur",
    image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&q=80",
  },
  {
    name: "Aya Bamba",
    role: "Responsable Ventes",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  },
  {
    name: "Yves Kone",
    role: "Expert Locatif",
    image: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=400&q=80",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="relative bg-[#0f1724] pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=60"
            alt="background"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl min-[420px]:text-4xl sm:text-5xl font-bold text-white mb-4">
            À propos de <span className="text-[#e8b86d]">KOITALA</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Votre partenaire pour tous vos projets immobiliers, y compris pour les expatriés. Fort de 23 ans d&apos;expérience et 12 années dans l&apos;immobilier.
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="relative h-80 lg:h-[28rem] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                alt="Notre bureau"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <span className="text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">
                Notre histoire
              </span>
              <h2 className="text-3xl font-bold text-[#0f1724] mt-2 mb-5">
                Un savoir-faire unique à votre service
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Fort de 23 ans d&apos;expérience en tant que haut cadre dans les télécommunications et 12 années d&apos;expertise dans l&apos;immobilier, je mets à votre disposition un savoir-faire unique pour vous accompagner dans l&apos;achat, la vente, la construction ou la location de vos biens.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Que vous soyez résident ou expatrié, l&apos;agence KOITALA est votre alliée pour réaliser tous vos projets immobiliers avec succès. Nous allions rigueur, professionnalisme et une parfaite compréhension des besoins de chacun.
              </p>
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-4">
                {[
                  { value: "12+", label: "Ans en immobilier" },
                  { value: "23+", label: "Ans d'expérience" },
                  { value: "500+", label: "Clients" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-[#f4f6f9] rounded-xl p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-[#1a3a5c]">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">
              Ce qui nous guide
            </span>
            <h2 className="text-3xl font-bold text-[#0f1724] mt-2">
              Nos valeurs fondamentales
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-5 h-5 text-[#1a3a5c]" />
                </div>
                <h3 className="font-semibold text-[#0f1724] mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#e8b86d] text-sm font-semibold uppercase tracking-widest">
              Notre équipe
            </span>
            <h2 className="text-3xl font-bold text-[#0f1724] mt-2">
              Des experts à votre service
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center group">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden mx-auto mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <h3 className="font-semibold text-[#0f1724]">{member.name}</h3>
                <p className="text-sm text-[#e8b86d] font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#1a3a5c]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Travaillons ensemble
          </h2>
          <p className="text-gray-300 mb-8">
            Contactez-nous dès aujourd&apos;hui pour discuter de votre projet immobilier et prendre rendez-vous avec nos conseillers.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#e8b86d] text-[#0f1724] font-semibold rounded-xl hover:bg-[#d9a45a] transition-colors shadow-md"
          >
            Nous contacter <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
