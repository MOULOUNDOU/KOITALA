"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, LogIn, UserPlus, Heart, Bell, Shield, Home, Search, Star, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SESSION_KEY = "koitala_popup_shown";

interface PopupVariant {
  image: string;
  title: string;
  subtitle: string;
  benefits: { icon: LucideIcon; text: string }[];
}

const VARIANTS: PopupVariant[] = [
  {
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    title: "Connectez-vous pour en profiter",
    subtitle: "Créez un compte gratuit et accédez à toutes les fonctionnalités.",
    benefits: [
      { icon: Heart, text: "Sauvegardez vos biens favoris" },
      { icon: Bell, text: "Recevez des alertes personnalisées" },
      { icon: Shield, text: "Contactez directement les agents" },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    title: "Ne manquez aucune opportunité",
    subtitle: "Inscrivez-vous et soyez le premier informé des nouveaux biens.",
    benefits: [
      { icon: Search, text: "Recherche avancée et filtres" },
      { icon: Star, text: "Accès aux biens exclusifs" },
      { icon: Bell, text: "Notifications en temps réel" },
    ],
  },
  {
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    title: "Trouvez votre bien idéal",
    subtitle: "Rejoignez KOITALA et simplifiez votre recherche immobilière.",
    benefits: [
      { icon: Home, text: "Des milliers de biens disponibles" },
      { icon: Shield, text: "Accompagnement personnalisé" },
      { icon: Star, text: "Service gratuit et sans engagement" },
    ],
  },
];

export default function LoginPromptPopup() {
  const [show, setShow] = useState(false);
  const [variant, setVariant] = useState<PopupVariant>(VARIANTS[0]);
  const triggered = useRef(false);

  useEffect(() => {
    // Show once per session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) return;

      const timer = setTimeout(() => {
        if (!triggered.current) {
          triggered.current = true;
          setVariant(VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
          setShow(true);
        }
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-24 lg:pt-16 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-32 bg-[#1a3a5c] overflow-hidden">
          <Image
            src={variant.image}
            alt="Immobilier"
            fill
            className="object-cover opacity-30"
          />
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <Image
              src="/logo-koitala.jpeg"
              alt="KOITALA"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-contain bg-white/10 backdrop-blur-sm mb-2"
            />
            <p className="text-white font-bold text-lg">
              KOI<span className="text-[#e8b86d]">TALA</span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-bold text-[#0f1724] text-center mb-1.5">
            {variant.title}
          </h3>
          <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
            {variant.subtitle}
          </p>

          {/* Benefits */}
          <div className="space-y-2.5 mb-6">
            {variant.benefits.map((item) => (
              <div key={item.text} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1a3a5c]/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#1a3a5c]" />
                </div>
                <span className="text-sm text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/auth/login"
              onClick={handleClose}
              className="py-3 bg-[#1a3a5c] text-white font-semibold text-sm rounded-xl hover:bg-[#0f2540] active:scale-[.98] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Connexion
            </Link>
            <Link
              href="/auth/register"
              onClick={handleClose}
              className="py-3 bg-white text-[#1a3a5c] font-semibold text-sm rounded-xl border-2 border-[#1a3a5c]/20 hover:border-[#1a3a5c]/40 active:scale-[.98] transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Inscription
            </Link>
          </div>

          <button
            onClick={handleClose}
            className="w-full mt-3 text-xs text-gray-400 hover:text-gray-500 transition-colors text-center py-1"
          >
            Continuer sans compte
          </button>
        </div>
      </div>
    </div>
  );
}
