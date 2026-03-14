import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0f1724] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <Image src="/logo-koitala.jpeg" alt="KOITALA" width={40} height={40} className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-xl font-bold text-white tracking-wide">
                KOI<span className="text-[#e8b86d]">TALA</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Votre partenaire pour tous vos projets immobiliers, y compris pour les expatriés. Achat, vente, construction clé en main et gestion locative.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#e8b86d] hover:text-[#1a3a5c] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#e8b86d] hover:text-[#1a3a5c] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#e8b86d] hover:text-[#1a3a5c] transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-5">Navigation</h3>
            <ul className="space-y-3">
              {[
                { href: "/biens", label: "Nos biens" },
                { href: "/biens?listing_type=vente", label: "Vente" },
                { href: "/biens?listing_type=location", label: "Location" },
                { href: "/a-propos", label: "À propos" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#e8b86d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Types de biens */}
          <div>
            <h3 className="text-white font-semibold mb-5">Nos biens</h3>
            <ul className="space-y-3">
              {[
                { href: "/biens?type=appartement", label: "Appartements" },
                { href: "/biens?type=maison", label: "Maisons" },
                { href: "/biens?type=villa", label: "Villas" },
                { href: "/biens?type=terrain", label: "Terrains" },
                { href: "/biens?type=bureau", label: "Bureaux" },
                { href: "/biens?type=local_commercial", label: "Locaux commerciaux" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#e8b86d] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#e8b86d] mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  Mamelles Aviation<br />Dakar, Sénégal
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#e8b86d] shrink-0" />
                <a href="tel:+221766752135" className="text-sm text-gray-400 hover:text-white transition-colors">
                  +221 76 675 21 35
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#e8b86d] shrink-0" />
                <a href="mailto:amzakoita@gmail.com" className="text-sm text-gray-400 hover:text-white transition-colors">
                  amzakoita@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} KOITALA. Tous droits réservés.
          </p>
          <div className="flex gap-5">
            <Link href="/mentions-legales" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
        <p className="text-center pb-3 text-[10px] text-gray-600/40 tracking-wide select-none">
          Conçu par Digicode
        </p>
      </div>
    </footer>
  );
}
