import type { AIChatMessage, AILeadDraft } from "@/lib/ai/types";

const PROPERTY_TYPE_TERMS = [
  "appartement",
  "maison",
  "villa",
  "terrain",
  "bureau",
  "local commercial",
  "studio",
  "chambre",
  "duplex",
  "colocation",
] as const;

const TIMELINE_TERMS = [
  "urgent",
  "immediat",
  "immediate",
  "ce mois",
  "dans 1 mois",
  "dans 2 mois",
  "dans 3 mois",
  "cette annee",
  "l annee prochaine",
] as const;

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractEmail(input: string): string | undefined {
  const match = input.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.trim();
}

function extractPhone(input: string): string | undefined {
  const match = input.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  if (!match) return undefined;
  return normalizeSpaces(match[0]);
}

function extractIntent(input: string): AILeadDraft["intent"] | undefined {
  const lower = input.toLowerCase();
  const rentalHints = ["location", "louer", "rent", "lease"];
  const buyingHints = ["achat", "acheter", "buy", "vente", "acquerir", "acquerir"];

  if (rentalHints.some((term) => lower.includes(term))) return "location";
  if (buyingHints.some((term) => lower.includes(term))) return "achat";

  return undefined;
}

function extractBudget(input: string): string | undefined {
  const match = input.match(
    /(?:budget|prix|max(?:imum)?|jusqu(?:a|au)|up to)?\s*[:\-]?\s*(\d[\d\s.,]{2,})(?:\s*(?:fcfa|xof|xaf|€|eur|usd|\$))?/i
  );
  if (!match?.[1]) return undefined;
  return normalizeSpaces(match[1]);
}

function extractRooms(input: string): string | undefined {
  const match = input.match(/(\d{1,2})\s*(?:piece|pieces|chambre|chambres|room|rooms)/i);
  return match?.[1];
}

function extractArea(input: string): string | undefined {
  const match = input.match(
    /(?:zone|quartier|secteur|ville|localisation|location)\s*[:\-]?\s*([a-zA-Z0-9\s'.,-]{3,80})/i
  );
  if (!match?.[1]) return undefined;
  return normalizeSpaces(match[1]);
}

function extractPropertyType(input: string): string | undefined {
  const lower = input.toLowerCase();
  return PROPERTY_TYPE_TERMS.find((term) => lower.includes(term));
}

function extractTimeline(input: string): string | undefined {
  const lower = input.toLowerCase();
  const found = TIMELINE_TERMS.find((term) => lower.includes(term));
  if (found) return found;

  const monthMatch = lower.match(/dans\s+(\d{1,2})\s+mois/);
  if (monthMatch?.[1]) return `dans ${monthMatch[1]} mois`;

  return undefined;
}

function extractFullName(input: string): string | undefined {
  const match = input.match(
    /(?:je m(?:'|e )appelle|mon nom est|i am|my name is)\s+([a-zA-Z][a-zA-Z\s'-]{1,60})/i
  );
  if (!match?.[1]) return undefined;
  return normalizeSpaces(match[1]);
}

export function mergeLeadDraft(
  base: AILeadDraft | null | undefined,
  patch: AILeadDraft | null | undefined
): AILeadDraft | null {
  const next: AILeadDraft = {
    fullName: patch?.fullName || base?.fullName,
    phone: patch?.phone || base?.phone,
    email: patch?.email || base?.email,
    intent: patch?.intent || base?.intent,
    propertyType: patch?.propertyType || base?.propertyType,
    area: patch?.area || base?.area,
    budget: patch?.budget || base?.budget,
    rooms: patch?.rooms || base?.rooms,
    timeline: patch?.timeline || base?.timeline,
  };

  return hasLeadData(next) ? next : null;
}

export function hasLeadData(lead: AILeadDraft | null | undefined): boolean {
  if (!lead) return false;

  return Boolean(
    lead.fullName ||
      lead.phone ||
      lead.email ||
      lead.intent ||
      lead.propertyType ||
      lead.area ||
      lead.budget ||
      lead.rooms ||
      lead.timeline
  );
}

export function extractLeadDraftFromMessages(messages: AIChatMessage[]): AILeadDraft | null {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .filter((content) => content.trim().length > 0);

  if (userMessages.length === 0) return null;

  const aggregate: AILeadDraft = {};

  for (let index = userMessages.length - 1; index >= 0; index -= 1) {
    const content = userMessages[index];

    aggregate.fullName = aggregate.fullName || extractFullName(content);
    aggregate.phone = aggregate.phone || extractPhone(content);
    aggregate.email = aggregate.email || extractEmail(content);
    aggregate.intent = aggregate.intent || extractIntent(content);
    aggregate.propertyType = aggregate.propertyType || extractPropertyType(content);
    aggregate.area = aggregate.area || extractArea(content);
    aggregate.budget = aggregate.budget || extractBudget(content);
    aggregate.rooms = aggregate.rooms || extractRooms(content);
    aggregate.timeline = aggregate.timeline || extractTimeline(content);
  }

  return hasLeadData(aggregate) ? aggregate : null;
}
