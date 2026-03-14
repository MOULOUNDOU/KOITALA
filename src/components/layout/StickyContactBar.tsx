"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StickyContactBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
        <Link
          href="/contact"
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#e8b86d] text-[#1a3a5c] font-semibold text-sm active:bg-[#d9a45a] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Nous écrire
        </Link>
      </div>
    </div>
  );
}
