export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import ContactPropertyForm from "@/components/properties/ContactPropertyForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'agence KOITALA pour tous vos projets immobiliers.",
};

const INFO = [
  {
    icon: Phone,
    title: "Téléphone",
    lines: ["+221 76 675 21 35", "+221 77 444 88 39"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["amzakoita@gmail.com"],
  },
  {
    icon: MapPin,
    title: "Adresse",
    lines: ["Mamelles Aviation", "Dakar, Sénégal"],
  },
  {
    icon: Clock,
    title: "Horaires",
    lines: ["Lun - Ven : 8h à 18h", "Sam : 9h à 14h"],
  },
];

export default function ContactPage() {
  return (
    <>
      <div className="bg-[#0f1724] pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Contactez-nous</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Une question ? Un projet ? Notre équipe est à votre disposition pour vous accompagner.
          </p>
        </div>
      </div>

      <section className="py-16 bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
            {INFO.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-12 h-12 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-5 h-5 text-[#1a3a5c]" />
                </div>
                <h3 className="font-semibold text-[#0f1724] mb-2">{item.title}</h3>
                {item.lines.map((line) => (
                  <p key={line} className="text-sm text-gray-500">{line}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <ContactPropertyForm />

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15435.945269107686!2d-17.4915584!3d14.71336565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2ssn!4v1773614550534!5m2!1sfr!2ssn"
                title="Localisation KOITALA"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[380px] w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
