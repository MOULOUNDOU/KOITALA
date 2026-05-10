"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-QV42LCNJZ6";

type GtagEventParameters = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event" | "js",
      targetIdOrDate: string | Date,
      config?: GtagEventParameters
    ) => void;
  }
}

function isPrivatePath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/auth");
}

function getElementText(element: Element) {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function getClickEventName(element: Element): string | null {
  const explicitEvent = element.getAttribute("data-ga-event");
  if (explicitEvent) return explicitEvent;

  const anchor = element instanceof HTMLAnchorElement ? element : element.closest("a");
  const href = anchor?.getAttribute("href") ?? "";
  const normalizedHref = href.toLowerCase();
  const text = getElementText(element).toLowerCase();

  if (normalizedHref.includes("wa.me") || normalizedHref.includes("whatsapp")) return "whatsapp_click";
  if (normalizedHref.startsWith("tel:")) return "phone_click";
  if (normalizedHref.startsWith("mailto:")) return "email_click";
  if (normalizedHref.startsWith("/contact") || text.includes("contact")) return "contact_click";

  if (anchor?.href) {
    try {
      const targetUrl = new URL(anchor.href);
      if (targetUrl.origin !== window.location.origin) return "external_link_click";
    } catch {
      return null;
    }
  }

  if (element.closest("form")) return "form_click";

  return null;
}

function sendGaEvent(eventName: string, params: GtagEventParameters) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const disabled = isPrivatePath(pathname);

  useEffect(() => {
    if (disabled) return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    sendGaEvent("page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [disabled, pathname, searchParams]);

  useEffect(() => {
    if (disabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trackedElement = target.closest<HTMLElement>(
        "[data-ga-event], a, button, input, select, textarea"
      );
      if (!trackedElement) return;

      const eventName = getClickEventName(trackedElement);
      if (!eventName) return;

      const anchor = trackedElement instanceof HTMLAnchorElement
        ? trackedElement
        : trackedElement.closest("a");
      const label =
        trackedElement.getAttribute("data-ga-label") ||
        anchor?.getAttribute("aria-label") ||
        getElementText(trackedElement) ||
        anchor?.href ||
        eventName;

      sendGaEvent(eventName, {
        click_label: label,
        link_url: anchor?.href,
        page_path: window.location.pathname,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [disabled]);

  if (disabled || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
