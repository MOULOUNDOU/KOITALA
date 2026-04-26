"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import { AGENCY_INFO } from "@/lib/agency";
import { cn } from "@/lib/utils";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

function toWhatsAppHref(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export default function StickyContactBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const whatsappHref = toWhatsAppHref(AGENCY_INFO.secondaryPhone || AGENCY_INFO.phone);

  const isDashboardRoute = pathname?.startsWith("/dashboard") ?? false;

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        className={cn(
          "fixed left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_rgba(37,211,102,0.34)] ring-[3px] ring-white transition-all duration-300 hover:scale-105 hover:bg-[#20ba5a]",
          visible ? "bottom-[5.5rem] sm:bottom-5" : "bottom-5"
        )}
      >
        <WhatsAppIcon className="h-6 w-6 animate-pulse" />
      </a>

      <div
        className={cn(
          "sm:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 safe-area-pb",
          visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="flex border-t border-white/10 shadow-2xl">
          <a
            href="tel:+221766752135"
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#1a3a5c] text-white font-semibold text-sm active:bg-[#0f2540] transition-colors"
          >
            <Phone className="w-5 h-5" />
            Appeler
          </a>
        </div>
      </div>
    </>
  );
}
