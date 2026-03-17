import { NextRequest, NextResponse } from "next/server";
import { extractLeadDraftFromMessages, mergeLeadDraft } from "@/lib/ai/lead";
import { requestAICompletion } from "@/lib/ai/openrouter";
import { createClient } from "@/lib/supabase/server";
import type {
  AIAssistantMode,
  AIAdminActionProposal,
  AIChatMessage,
  AIChatRequestBody,
  AILeadDraft,
  AIWidgetScope,
} from "@/lib/ai/types";

export const runtime = "nodejs";

const MAX_HISTORY_MESSAGES = 18;
const MAX_MESSAGE_LENGTH = 1_600;
const MAX_TOTAL_CHARS = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 24;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const ACTION_BLOCK_REGEX = /\[ACTION\]\s*([\s\S]*?)\s*\[\/ACTION\]/i;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getClientIp(request: NextRequest): string {
  const headerValue = request.headers.get("x-forwarded-for");
  if (!headerValue) return "anonymous";

  const firstIp = headerValue.split(",")[0]?.trim();
  return firstIp || "anonymous";
}

function consumeRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { allowed: true, retryAfter: 0 };
}

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeScope(value: unknown): AIWidgetScope {
  return value === "dashboard" ? "dashboard" : "public";
}

function normalizeAssistant(value: unknown): AIAssistantMode {
  return value === "admin" ? "admin" : "user";
}

function sanitizeActionText(value: unknown, maxLength = 220): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = cleanText(value).slice(0, maxLength);
  return cleaned || undefined;
}

function sanitizeAdminActionProposal(raw: unknown): AIAdminActionProposal | null {
  if (!raw || typeof raw !== "object") return null;

  const actionType = Reflect.get(raw, "type");
  const type = actionType === "update_property" || actionType === "delete_property" ? actionType : null;
  if (!type) return null;

  const propertyIdRaw = Reflect.get(raw, "propertyId");
  const propertyId =
    typeof propertyIdRaw === "string" && UUID_REGEX.test(propertyIdRaw.trim())
      ? propertyIdRaw.trim()
      : undefined;

  const propertySlug = sanitizeActionText(Reflect.get(raw, "propertySlug"), 140);
  const propertyQuery = sanitizeActionText(Reflect.get(raw, "propertyQuery"), 200);
  const confirmationMessage = sanitizeActionText(Reflect.get(raw, "confirmationMessage"), 220);

  let updates: Record<string, unknown> | undefined;
  if (type === "update_property") {
    const rawUpdates = Reflect.get(raw, "updates");
    if (rawUpdates && typeof rawUpdates === "object" && !Array.isArray(rawUpdates)) {
      updates = rawUpdates as Record<string, unknown>;
    }
  }

  if (!propertyId && !propertySlug && !propertyQuery) {
    return null;
  }

  return {
    type,
    propertyId,
    propertySlug,
    propertyQuery,
    updates,
    confirmationMessage,
  };
}

function extractAdminActionFromReply(reply: string): {
  cleanReply: string;
  adminAction: AIAdminActionProposal | null;
} {
  const match = reply.match(ACTION_BLOCK_REGEX);
  if (!match) {
    return {
      cleanReply: reply.trim(),
      adminAction: null,
    };
  }

  const block = match[1]?.trim() ?? "";
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(block);
  } catch {
    const start = block.indexOf("{");
    const end = block.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(block.slice(start, end + 1));
      } catch {
        parsed = null;
      }
    } else {
      parsed = null;
    }
  }

  const adminAction = sanitizeAdminActionProposal(parsed);
  const cleanReply = reply.replace(ACTION_BLOCK_REGEX, "").trim();

  return {
    cleanReply,
    adminAction,
  };
}

function normalizeMessages(rawMessages: unknown): AIChatMessage[] {
  if (!Array.isArray(rawMessages)) return [];

  const normalized: AIChatMessage[] = [];
  for (const item of rawMessages) {
    if (!item || typeof item !== "object") continue;

    const role = Reflect.get(item, "role");
    const content = Reflect.get(item, "content");

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      continue;
    }

    const cleanedContent = cleanText(content);
    if (!cleanedContent) continue;

    normalized.push({
      role,
      content: cleanedContent,
      createdAt: typeof Reflect.get(item, "createdAt") === "string" ? String(Reflect.get(item, "createdAt")) : undefined,
    });
  }

  return normalized.slice(-MAX_HISTORY_MESSAGES);
}

function normalizeLeadDraft(rawLead: unknown): AILeadDraft | null {
  if (!rawLead || typeof rawLead !== "object") return null;

  const pickString = (key: keyof AILeadDraft): string | undefined => {
    const value = Reflect.get(rawLead, key);
    if (typeof value !== "string") return undefined;
    const cleaned = cleanText(value).slice(0, 120);
    return cleaned || undefined;
  };

  const intentValue = Reflect.get(rawLead, "intent");
  const intent = intentValue === "achat" || intentValue === "location" ? intentValue : undefined;

  const normalized: AILeadDraft = {
    fullName: pickString("fullName"),
    phone: pickString("phone"),
    email: pickString("email"),
    intent,
    propertyType: pickString("propertyType"),
    area: pickString("area"),
    budget: pickString("budget"),
    rooms: pickString("rooms"),
    timeline: pickString("timeline"),
  };

  return mergeLeadDraft(normalized, null);
}

function parseRequestBody(rawBody: unknown): AIChatRequestBody {
  if (!rawBody || typeof rawBody !== "object") {
    return { messages: [] };
  }

  return {
    messages: normalizeMessages(Reflect.get(rawBody, "messages")),
    scope: normalizeScope(Reflect.get(rawBody, "scope")),
    assistant: normalizeAssistant(Reflect.get(rawBody, "assistant")),
    leadDraft: normalizeLeadDraft(Reflect.get(rawBody, "leadDraft")),
  };
}

async function resolveAdminAccess(): Promise<{ authorized: boolean; status: number }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, status: 401 };
  }

  let hasAdminRole = false;
  const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (!rpcError && typeof rpcIsAdmin === "boolean") {
    hasAdminRole = rpcIsAdmin;
  }

  if (!hasAdminRole) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileById?.role === "admin") {
      hasAdminRole = true;
    } else if (user.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();
      hasAdminRole = profileByEmail?.role === "admin";
    }
  }

  return { authorized: hasAdminRole, status: hasAdminRole ? 200 : 403 };
}

export async function POST(request: NextRequest) {
  const rateLimit = consumeRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Trop de messages envoyes en peu de temps. Reessayez dans quelques instants.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
        },
      }
    );
  }

  try {
    const rawBody = (await request.json().catch(() => null)) as unknown;
    const parsedBody = parseRequestBody(rawBody);
    const assistant = parsedBody.assistant ?? "user";
    const scope = assistant === "admin" ? "dashboard" : parsedBody.scope ?? "public";

    if (assistant === "admin") {
      const adminAccess = await resolveAdminAccess();
      if (!adminAccess.authorized) {
        return NextResponse.json(
          {
            error:
              adminAccess.status === 401
                ? "Authentification requise pour l assistant admin."
                : "Acces refuse: assistant reserve aux administrateurs.",
          },
          { status: adminAccess.status }
        );
      }
    }

    if (parsedBody.messages.length === 0) {
      return NextResponse.json(
        { error: "Votre message est vide. Merci de saisir une question." },
        { status: 400 }
      );
    }

    const totalChars = parsedBody.messages.reduce((sum, item) => sum + item.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json(
        { error: "Conversation trop longue. Merci de raccourcir votre demande." },
        { status: 413 }
      );
    }

    const extractedLead =
      assistant === "user" ? extractLeadDraftFromMessages(parsedBody.messages) : null;
    const mergedLeadDraft =
      assistant === "user"
        ? mergeLeadDraft(parsedBody.leadDraft ?? null, extractedLead)
        : null;

    const completion = await requestAICompletion({
      messages: parsedBody.messages,
      scope,
      assistant,
      leadDraft: mergedLeadDraft,
      allowDevFallback: true,
      timeoutMs: 15_000,
    });

    const actionExtraction =
      assistant === "admin"
        ? extractAdminActionFromReply(completion.reply)
        : { cleanReply: completion.reply, adminAction: null };

    const finalReply =
      actionExtraction.cleanReply || completion.reply || "Action analysée. Merci de confirmer l étape suivante.";

    return NextResponse.json({
      reply: finalReply,
      model: completion.model,
      scope,
      assistant,
      leadDraft: mergedLeadDraft,
      adminAction: actionExtraction.adminAction,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "ai-chat-failed";
    const normalizedError = errorMessage.toLowerCase();

    if (normalizedError.includes("missing-openrouter-api-key")) {
      return NextResponse.json(
        { error: "Assistant IA non configure cote serveur." },
        { status: 503 }
      );
    }

    if (normalizedError.includes("openrouter-timeout")) {
      return NextResponse.json(
        { error: "L assistant met trop de temps a repondre. Merci de reessayer." },
        { status: 504 }
      );
    }

    if (normalizedError.includes("openrouter-http-429")) {
      return NextResponse.json(
        { error: "Le service IA est temporairement limite. Reessayez dans quelques instants." },
        { status: 429 }
      );
    }

    console.error("AI chat error:", errorMessage);
    return NextResponse.json(
      { error: "Impossible de contacter l assistant pour le moment." },
      { status: 500 }
    );
  }
}
