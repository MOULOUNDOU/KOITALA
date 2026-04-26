import type { Metadata } from "next";
import type { Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { AGENCY_INFO } from "@/lib/agency";
import PageTransition from "@/components/layout/PageTransition";
import ScrollToTop from "@/components/layout/ScrollToTop";
import StickyContactBar from "@/components/layout/StickyContactBar";
import {
  DEFAULT_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-QV42LCNJZ6";

const commerceFont = DM_Sans({
  variable: "--font-commerce",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "KOITALA | Agence immobiliere a Dakar",
    template: "%s | KOITALA",
  },
  description: SITE_DESCRIPTION,
  keywords: [...DEFAULT_KEYWORDS],
  alternates: {
    canonical: "/",
  },
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: AGENCY_INFO.legalName,
  category: "real estate",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "KOITALA | Agence immobiliere a Dakar",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl(AGENCY_INFO.logoPath),
        alt: "Logo KOITALA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KOITALA | Agence immobiliere a Dakar",
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(AGENCY_INFO.logoPath)],
  },
  icons: {
    icon: AGENCY_INFO.logoPath,
    apple: AGENCY_INFO.logoPath,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${commerceFont.variable} antialiased`} suppressHydrationWarning>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <PageTransition>{children}</PageTransition>
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
