export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Phone, Users } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Collaborateurs",
  description:
    "Découvrez les collaborateurs de KOITALA avec leurs contacts métiers : direction, responsable commercial, maçon, électricien, plombier, peintre et menuisier.",
  alternates: {
    canonical: "/collaborateurs",
  },
  openGraph: {
    title: "Collaborateurs KOITALA",
    description:
      "Les contacts métiers et les profils de démonstration des collaborateurs de KOITALA.",
    url: absoluteUrl("/collaborateurs"),
  },
};

type Collaborator = {
  name: string;
  role: string;
  phone: string;
  image: string;
  note: string;
  featured?: boolean;
  whatsapp?: boolean;
};

const COLLABORATORS: Collaborator[] = [
  {
    name: "Hamza Koita",
    role: "Direction",
    phone: "+221774448839",
    image: "/HAMZA%20KOITA.jpg",
    note: "Point de contact principal pour les demandes clients, la coordination générale et les prises de rendez-vous.",
    featured: true,
    whatsapp: true,
  },
  {
    name: "Moussa Ndiaye",
    role: "Responsable commercial",
    phone: "711536833",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&q=80",
    note: "Suivi commercial, prospection et accompagnement des clients sur les offres immobilières.",
  },
  {
    name: "Ibrahima Fall",
    role: "Maçon",
    phone: "+221777504746",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    note: "Interventions gros œuvre, maçonnerie et suivi des travaux sur le terrain.",
  },
  {
    name: "Cheikh Ba",
    role: "Électricien",
    phone: "+221776569839",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
    note: "Installation, maintenance et vérification des équipements électriques.",
  },
  {
    name: "Ousmane Diop",
    role: "Plombier",
    phone: "774175890",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    note: "Travaux de plomberie, réseaux d'eau, maintenance et dépannage.",
  },
  {
    name: "Serigne Faye",
    role: "Peintre",
    phone: "+221772986047",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80",
    note: "Finitions, revêtements muraux et mise en valeur esthétique des espaces.",
  },
  {
    name: "Abdoulaye Kane",
    role: "Menuisier",
    phone: "771667335",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80",
    note: "Travaux bois, mobilier sur mesure, portes, rangements et finitions intérieures.",
  },
];

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("221") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+221${digits}`;
  }

  return phone.startsWith("+") ? phone : `+${digits}`;
}

function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  const digits = normalized.replace(/\D/g, "");

  if (digits.startsWith("221") && digits.length === 12) {
    const local = digits.slice(3);
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  }

  return normalized;
}

function toTelHref(phone: string): string {
  return `tel:${normalizePhoneNumber(phone)}`;
}

function toWhatsAppHref(phone: string): string {
  return `https://wa.me/${normalizePhoneNumber(phone).replace(/\D/g, "")}`;
}

const featuredCollaborator = COLLABORATORS.find((person) => person.featured);
const otherCollaborators = COLLABORATORS.filter((person) => !person.featured);

export default function CollaborateursPage() {
  const primaryPhone = featuredCollaborator?.phone ?? "+221774448839";
  const primaryImage = featuredCollaborator?.image ?? "/HAMZA%20KOITA.jpg";

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#0f1724] pt-28 pb-16 sm:pt-32 lg:min-h-[680px]">
        <Image
          src={primaryImage}
          alt={featuredCollaborator ? `${featuredCollaborator.name}, ${featuredCollaborator.role}` : "Contact KOITALA"}
          fill
          priority
          className="absolute inset-0 -z-20 object-cover object-[68%_18%] opacity-45 sm:object-[78%_18%] lg:object-[82%_16%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,23,36,0.98)_0%,rgba(15,23,36,0.92)_42%,rgba(15,23,36,0.62)_68%,rgba(15,23,36,0.36)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#0f1724] to-transparent" />

        <div className="mx-auto flex min-h-[520px] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d39b] backdrop-blur">
              <Users className="h-3.5 w-3.5" />
              Réseau KOITALA
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Les bons contacts pour faire avancer votre projet immobilier.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-200 sm:text-lg">
              Direction, suivi commercial et métiers du bâtiment sont réunis sur une
              seule page pour orienter rapidement chaque demande vers la bonne personne.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={toWhatsAppHref(primaryPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-[0_16px_40px_rgba(37,211,102,0.28)] transition-colors hover:bg-[#20ba5a]"
              >
                Écrire à la direction <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href={toTelHref(primaryPhone)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Appeler maintenant <Phone className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-white">
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                {COLLABORATORS.length} contacts métiers
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                Direction & commercial
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                Artisans terrain
              </span>
            </div>
          </div>
        </div>
      </section>

      {featuredCollaborator ? (
        <section className="bg-[#f4f6f9] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c4903f]">
                Contact principal
              </span>
              <h2 className="mt-3 text-3xl font-bold text-[#0f1724] sm:text-4xl">
                Le WhatsApp Business de référence
              </h2>
            </div>

            <div className="grid gap-8 overflow-hidden rounded-[32px] border border-white bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-[420px] bg-[#f4f6f9] lg:min-h-[560px]">
                <Image
                  src={featuredCollaborator.image}
                  alt={featuredCollaborator.name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <h3 className="text-3xl font-bold text-[#0f1724]">
                  {featuredCollaborator.name}
                </h3>
                <p className="mt-2 text-lg font-medium text-[#1a3a5c]">
                  {featuredCollaborator.role}
                </p>
                <p className="mt-4 text-base leading-relaxed text-gray-600">
                  {featuredCollaborator.note}
                </p>

                <div className="mt-6 rounded-2xl border border-[#1a3a5c]/10 bg-[#f8fafc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Numéro principal
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#0f1724]">
                    {formatPhoneNumber(featuredCollaborator.phone)}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={toWhatsAppHref(featuredCollaborator.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#20ba5a]"
                  >
                    WhatsApp Business <WhatsAppIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={toTelHref(featuredCollaborator.phone)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1a3a5c]/15 px-6 py-3.5 font-semibold text-[#1a3a5c] transition-colors hover:bg-[#f4f6f9]"
                  >
                    Appeler <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#c4903f]">
                Équipe terrain
              </span>
              <h2 className="mt-3 text-3xl font-bold text-[#0f1724] sm:text-4xl">
                Des spécialistes pour chaque intervention
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-gray-600">
              Un accès direct aux profils opérationnels qui accompagnent les missions commerciales,
              techniques et de finition.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {otherCollaborators.map((person) => (
              <article
                key={`${person.role}-${person.phone}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden bg-[#f4f6f9]">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#1a3a5c] shadow-sm">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {person.role}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#0f1724]">{person.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-[#1a3a5c]">{formatPhoneNumber(person.phone)}</p>
                    </div>
                    <span className="rounded-full bg-[#e8b86d]/18 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b4226]">
                      KOITALA
                    </span>
                  </div>

                  <p className="mt-4 min-h-[84px] text-sm leading-7 text-gray-600">{person.note}</p>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={toTelHref(person.phone)}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a3a5c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#13304d]"
                    >
                      Appeler <Phone className="h-4 w-4" />
                    </a>
                    {person.whatsapp ? (
                      <a
                        href={toWhatsAppHref(person.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#20ba5a]"
                      >
                        WhatsApp <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1a3a5c] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            La page est prête pour recevoir vos vrais profils
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-100">
            Dès que vous m&apos;envoyez les noms et les photos définitifs, je remplace les
            éléments de démonstration directement sur cette page.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8b86d] px-6 py-3.5 font-semibold text-[#0f1724] transition-colors hover:bg-[#d8a759]"
            >
              Nous contacter <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={toWhatsAppHref("+221774448839")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#20ba5a]"
            >
              Ouvrir WhatsApp <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
