export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Compass,
  Hammer,
  Home,
  MapPinned,
} from "lucide-react";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Nos réalisations",
  description:
    "Découvrez les types de missions immobilières accompagnées par KOITALA à Dakar : vente, location, construction clé en main et accompagnement sur mesure.",
  alternates: {
    canonical: "/nos-realisations",
  },
  openGraph: {
    title: "Nos réalisations",
    description:
      "Découvrez les types de missions immobilières accompagnées par KOITALA à Dakar.",
    url: absoluteUrl("/nos-realisations"),
  },
};

const STATS = [
  {
    value: "13+",
    label: "ans d'expertise immobilière",
  },
  {
    value: "500+",
    label: "clients accompagnés",
  },
  {
    value: "Dakar & Sénégal",
    label: "zones d'intervention",
  },
];

const PROJECTS = [
  {
    title: "Commercialisation d'un programme résidentiel",
    category: "Vente",
    location: "Dakar",
    description:
      "Positionnement de l'offre, création des supports de vente, qualification des prospects et accompagnement jusqu'à la signature.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/DakarMermoz.JPG/1280px-DakarMermoz.JPG",
    imageAlt: "Rue résidentielle avec maisons dans le quartier Mermoz à Dakar",
    imageCredit: "Photo : Ji-Elle, Wikimedia Commons, domaine public",
    imageSource: "https://commons.wikimedia.org/wiki/File:DakarMermoz.JPG",
  },
  {
    title: "Mise en location d'appartements meublés",
    category: "Location",
    location: "Mamelles",
    description:
      "Préparation des biens, stratégie de diffusion, visites ciblées et sécurisation des dossiers locataires pour une occupation rapide.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Maison_%C3%A0_Dakar.jpg/1280px-Maison_%C3%A0_Dakar.jpg",
    imageAlt: "Maison réelle à Dakar au Sénégal",
    imageCredit: "Photo : Geertivp, Wikimedia Commons, CC BY-SA 4.0",
    imageSource: "https://commons.wikimedia.org/wiki/File:Maison_%C3%A0_Dakar.jpg",
  },
  {
    title: "Accompagnement d'acquisition pour expatrié",
    category: "Conseil",
    location: "Almadies",
    description:
      "Recherche ciblée, vérification des critères, coordination des visites et accompagnement administratif pour un achat serein à distance.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Villa_Thi%C3%A8soise_Standard.jpg/1280px-Villa_Thi%C3%A8soise_Standard.jpg",
    imageAlt: "Devanture d'une villa typique à Thiès au Sénégal",
    imageCredit: "Photo : Bigfall91, Wikimedia Commons, CC BY-SA 4.0",
    imageSource: "https://commons.wikimedia.org/wiki/File:Villa_Thi%C3%A8soise_Standard.jpg",
  },
  {
    title: "Pilotage d'une construction clé en main",
    category: "Construction",
    location: "Sénégal",
    description:
      "Cadrage du besoin, coordination terrain, suivi des étapes et contrôle de la qualité pour livrer un projet cohérent et bien maîtrisé.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Villa_dans_un_village_%C3%A0_thi%C3%A8s.jpg/1280px-Villa_dans_un_village_%C3%A0_thi%C3%A8s.jpg",
    imageAlt: "Villa dans le village de Keur Modou Ndiaye à Thiès",
    imageCredit: "Photo : Deyonro23, Wikimedia Commons, CC BY-SA 4.0",
    imageSource: "https://commons.wikimedia.org/wiki/File:Villa_dans_un_village_%C3%A0_thi%C3%A8s.jpg",
  },
] as const;

const EXPERTISES = [
  {
    icon: Building2,
    title: "Vente & commercialisation",
    description:
      "Nous structurons la présentation du bien, le ciblage commercial et la négociation pour accélérer la transaction.",
  },
  {
    icon: Home,
    title: "Location sécurisée",
    description:
      "Nous facilitons la mise en location avec une sélection rigoureuse des dossiers et un suivi fluide jusqu'à l'entrée dans les lieux.",
  },
  {
    icon: Compass,
    title: "Accompagnement sur mesure",
    description:
      "Chaque projet bénéficie d'un cadrage personnalisé selon le budget, la localisation et le niveau d'accompagnement attendu.",
  },
  {
    icon: Hammer,
    title: "Construction clé en main",
    description:
      "Nous aidons à piloter la réalisation de votre projet, du cadrage initial jusqu'au suivi des étapes clés.",
  },
] as const;

const PROMISES = [
  "Une lecture claire des besoins avant toute action.",
  "Un accompagnement terrain avec des points d'avancement réguliers.",
  "Des recommandations pratiques pour sécuriser les décisions.",
  "Une expérience fluide pour les résidents comme pour les expatriés.",
];

export default function NosRealisationsPage() {
  return (
    <>
      <section className="bg-[#0f1724] pt-28 pb-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Des missions immobilières menées avec méthode, exigence et clarté.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-300">
              Découvrez les types de projets que nous accompagnons chez KOITALA, de la
              vente à la location en passant par la construction clé en main et le
              conseil immobilier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8b86d] px-6 py-3.5 font-semibold text-[#0f1724] transition-colors hover:bg-[#d8a759]"
              >
                Lancer votre projet <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/biens"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explorer nos biens
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c4903f]">
              Exemples de missions
            </span>
            <h2 className="mt-3 text-3xl font-bold text-[#0f1724] sm:text-4xl">
              Une vitrine de notre savoir-faire sur le terrain
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Cette page présente les grands types d&apos;accompagnements que nous menons pour
              nos clients. Chaque mission est pensée pour combiner efficacité commerciale,
              suivi rigoureux et sérénité dans l&apos;exécution.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {PROJECTS.map((project) => (
              <article
                key={project.title}
                className="overflow-hidden rounded-[28px] border border-gray-100 bg-[#f8fafc] shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <a
                    href={project.imageSource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/55 px-3 py-1.5 text-left text-[11px] font-medium leading-snug text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  >
                    {project.imageCredit}
                  </a>
                </div>
                <div className="p-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#1a3a5c] px-3 py-1 text-xs font-semibold text-white">
                      {project.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <MapPinned className="h-4 w-4 text-[#c4903f]" />
                      {project.location}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-[#0f1724]">{project.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f6f9] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c4903f]">
              Ce que nous livrons
            </span>
            <h2 className="mt-3 text-3xl font-bold text-[#0f1724] sm:text-4xl">
              Un accompagnement pensé pour produire des résultats concrets
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {EXPERTISES.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a3a5c]/10">
                  <item.icon className="h-5 w-5 text-[#1a3a5c]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#0f1724]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1a3a5c] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#f3d39b]">
              Notre méthode
            </span>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Un cadre de travail fiable pour faire avancer votre projet
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100">
              Nous combinons écoute, lecture du marché, coordination et présence terrain
              pour garder le cap à chaque étape du projet immobilier.
            </p>
          </div>

          <div className="grid gap-4">
            {PROMISES.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-5"
              >
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f3d39b]" />
                <p className="text-sm leading-7 text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0f1724]">
            Vous avez un projet immobilier à concrétiser ?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            Parlons de vos objectifs et construisons ensemble un accompagnement adapté à
            votre calendrier, votre budget et votre zone de recherche.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a3a5c] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#13304d]"
            >
              Nous contacter <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/a-propos"
              className="inline-flex items-center justify-center rounded-xl border border-[#1a3a5c]/15 px-6 py-3.5 font-semibold text-[#1a3a5c] transition-colors hover:bg-[#f4f6f9]"
            >
              En savoir plus sur KOITALA
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
