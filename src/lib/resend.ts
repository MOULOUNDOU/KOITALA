import { Resend } from "resend";
import { AGENCY_INFO } from "@/lib/agency";

interface EmailSummaryField {
  label: string;
  value?: string | null;
}

interface ContactEmailPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  propertyTitle?: string | null;
  propertyUrl?: string | null;
}

interface VisitEmailPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  preferredDate?: string | null;
  propertyTitle?: string | null;
  propertyUrl?: string | null;
}

const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
const resendReplyToEmail = process.env.RESEND_REPLY_TO_EMAIL?.trim() || AGENCY_INFO.email;
const notificationRecipient = process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || AGENCY_INFO.email;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeMultilineHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function formatFrenchDate(dateValue?: string | null): string {
  if (!dateValue) return "Non precisee";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(parsed);
}

function resolveSiteOrigin(request?: Request): string {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envSiteUrl) {
    try {
      return new URL(envSiteUrl).origin;
    } catch {
      // Ignore malformed env and use request fallback.
    }
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}

function buildPropertyUrl(path: string | null | undefined, request?: Request): string | null {
  if (!path) return null;
  return new URL(path, resolveSiteOrigin(request)).toString();
}

function renderSummaryTable(fields: EmailSummaryField[]): string {
  return fields
    .filter((field) => field.value && field.value.trim().length > 0)
    .map(
      (field) => `
        <tr>
          <td style="padding:10px 0; vertical-align:top; width:140px; font-size:13px; color:#64748b; font-weight:600;">
            ${escapeHtml(field.label)}
          </td>
          <td style="padding:10px 0; font-size:14px; color:#0f1724;">
            ${escapeHtml(field.value ?? "")}
          </td>
        </tr>
      `
    )
    .join("");
}

function renderEmailShell(params: {
  eyebrow: string;
  title: string;
  intro: string;
  summaryFields?: EmailSummaryField[];
  messageLabel: string;
  messageValue: string;
  ctaLabel?: string;
  ctaHref?: string | null;
  footerNote?: string;
}): string {
  const summaryHtml =
    params.summaryFields && params.summaryFields.length > 0
      ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:24px 0 0;">
          ${renderSummaryTable(params.summaryFields)}
        </table>
      `
      : "";
  const ctaHtml =
    params.ctaLabel && params.ctaHref
      ? `
        <div style="margin-top:28px;">
          <a
            href="${escapeHtml(params.ctaHref)}"
            style="display:inline-block; border-radius:12px; background:#1a3a5c; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 18px;"
          >
            ${escapeHtml(params.ctaLabel)}
          </a>
        </div>
      `
      : "";

  return `
    <div style="background:#f4f6f9; padding:32px 16px; font-family:Arial,sans-serif; color:#0f1724;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e2e8f0;">
        <div style="background:#0f1724; padding:28px 32px;">
          <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.18em; color:#e8b86d; text-transform:uppercase;">
            ${escapeHtml(params.eyebrow)}
          </p>
          <h1 style="margin:14px 0 0; font-size:28px; line-height:1.2; color:#ffffff;">
            ${escapeHtml(params.title)}
          </h1>
        </div>
        <div style="padding:28px 32px 32px;">
          <p style="margin:0; font-size:15px; line-height:1.7; color:#334155;">
            ${escapeHtml(params.intro)}
          </p>
          ${summaryHtml}
          <div style="margin-top:24px; border-radius:18px; background:#f8fafc; border:1px solid #e2e8f0; padding:18px 20px;">
            <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.14em; color:#64748b; text-transform:uppercase;">
              ${escapeHtml(params.messageLabel)}
            </p>
            <p style="margin:0; font-size:14px; line-height:1.8; color:#0f1724;">
              ${escapeMultilineHtml(params.messageValue)}
            </p>
          </div>
          ${ctaHtml}
          <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e2e8f0;">
            <p style="margin:0; font-size:13px; line-height:1.8; color:#64748b;">
              ${escapeHtml(params.footerNote || `${AGENCY_INFO.name} · ${AGENCY_INFO.phone} · ${AGENCY_INFO.email}`)}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
}): Promise<void> {
  if (!resendClient || !resendFromEmail) {
    return;
  }

  const { error } = await resendClient.emails.send({
    from: resendFromEmail,
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });

  if (error) {
    throw new Error(typeof error.message === "string" ? error.message : "resend-send-failed");
  }
}

export function isResendConfigured(): boolean {
  return Boolean(resendClient && resendFromEmail);
}

export function buildPropertyLinkFromSlug(slug?: string | null, request?: Request): string | null {
  if (!slug) return null;
  return buildPropertyUrl(`/biens/${slug}`, request);
}

export async function sendContactNotifications(
  payload: ContactEmailPayload
): Promise<void> {
  if (!isResendConfigured()) {
    console.warn("Resend non configure: emails contact non envoyes.");
    return;
  }

  const adminHtml = renderEmailShell({
    eyebrow: "Nouveau contact",
    title: payload.subject?.trim()
      ? `Message: ${payload.subject.trim()}`
      : `Nouveau message de ${payload.fullName}`,
    intro: "Un nouveau message a ete envoye depuis le site KOITALA.",
    summaryFields: [
      { label: "Nom", value: payload.fullName },
      { label: "Email", value: payload.email },
      { label: "Telephone", value: payload.phone },
      { label: "Bien", value: payload.propertyTitle },
      { label: "Sujet", value: payload.subject },
    ],
    messageLabel: "Message",
    messageValue: payload.message,
    ctaLabel: payload.propertyUrl ? "Ouvrir le bien" : undefined,
    ctaHref: payload.propertyUrl,
  });

  const customerHtml = renderEmailShell({
    eyebrow: "Message recu",
    title: "Votre message a bien ete transmis",
    intro: "Notre equipe KOITALA a bien recu votre demande. Nous reviendrons vers vous rapidement.",
    summaryFields: [
      { label: "Nom", value: payload.fullName },
      { label: "Email", value: payload.email },
      { label: "Sujet", value: payload.subject || "Demande generale" },
      { label: "Bien", value: payload.propertyTitle },
    ],
    messageLabel: "Votre message",
    messageValue: payload.message,
    ctaLabel: payload.propertyUrl ? "Consulter le bien" : undefined,
    ctaHref: payload.propertyUrl,
    footerNote: `Besoin d'une reponse rapide ? Contactez ${AGENCY_INFO.name} au ${AGENCY_INFO.phone}.`,
  });

  await Promise.all([
    sendEmail({
      to: notificationRecipient,
      subject: payload.subject?.trim()
        ? `KOITALA - Nouveau message: ${payload.subject.trim()}`
        : `KOITALA - Nouveau message de ${payload.fullName}`,
      html: adminHtml,
      replyTo: payload.email,
    }),
    sendEmail({
      to: payload.email,
      subject: "KOITALA - Nous avons bien recu votre message",
      html: customerHtml,
      replyTo: resendReplyToEmail,
    }),
  ]);
}

export async function sendVisitNotifications(
  payload: VisitEmailPayload
): Promise<void> {
  if (!isResendConfigured()) {
    console.warn("Resend non configure: emails visite non envoyes.");
    return;
  }

  const propertyLabel = payload.propertyTitle?.trim() || "Bien KOITALA";
  const adminHtml = renderEmailShell({
    eyebrow: "Nouvelle visite",
    title: `Demande de visite pour ${propertyLabel}`,
    intro: "Une nouvelle demande de visite a ete soumise sur le site KOITALA.",
    summaryFields: [
      { label: "Nom", value: payload.fullName },
      { label: "Email", value: payload.email },
      { label: "Telephone", value: payload.phone },
      { label: "Bien", value: payload.propertyTitle },
      { label: "Date souhaitee", value: formatFrenchDate(payload.preferredDate) },
    ],
    messageLabel: "Message client",
    messageValue: payload.message?.trim() || "Aucun message complementaire.",
    ctaLabel: payload.propertyUrl ? "Voir le bien" : undefined,
    ctaHref: payload.propertyUrl,
  });

  const customerHtml = renderEmailShell({
    eyebrow: "Visite enregistree",
    title: "Votre demande de visite a bien ete envoyee",
    intro: "Merci pour votre interet. Notre equipe KOITALA reviendra vers vous pour confirmer ce rendez-vous.",
    summaryFields: [
      { label: "Nom", value: payload.fullName },
      { label: "Bien", value: payload.propertyTitle },
      { label: "Date souhaitee", value: formatFrenchDate(payload.preferredDate) },
    ],
    messageLabel: "Votre demande",
    messageValue: payload.message?.trim() || "Demande de visite sans message complementaire.",
    ctaLabel: payload.propertyUrl ? "Revoir le bien" : undefined,
    ctaHref: payload.propertyUrl,
    footerNote: `Pour toute question, contactez ${AGENCY_INFO.name} au ${AGENCY_INFO.phone}.`,
  });

  await Promise.all([
    sendEmail({
      to: notificationRecipient,
      subject: `KOITALA - Nouvelle demande de visite: ${propertyLabel}`,
      html: adminHtml,
      replyTo: payload.email,
    }),
    sendEmail({
      to: payload.email,
      subject: "KOITALA - Demande de visite bien recue",
      html: customerHtml,
      replyTo: resendReplyToEmail,
    }),
  ]);
}
