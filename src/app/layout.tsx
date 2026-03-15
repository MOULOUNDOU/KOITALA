import type { Metadata } from "next";
import type { Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "@/components/layout/ScrollToTop";
import StickyContactBar from "@/components/layout/StickyContactBar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: {
    default: "KOITALA – Agence Immobilière",
    template: "%s | KOITALA",
  },
  description:
    "Agence Immobilière KOITALA : votre partenaire pour tous vos projets immobiliers, y compris pour les expatriés. Achat, vente, construction clé en main et gestion locative.",
  keywords: ["immobilier", "agence", "KOITALA", "Dakar", "vente", "location", "construction", "expatriés", "gestion locative"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "KOITALA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${display.variable} antialiased`} suppressHydrationWarning>
        {children}
        <ScrollToTop />
        <StickyContactBar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: "12px", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
