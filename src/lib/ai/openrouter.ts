import {
  buildAdminSystemPrompt,
  buildRealEstateSystemPrompt,
  OPENROUTER_BASE_URL,
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_DEV_FALLBACK_MODEL,
} from "@/lib/ai/prompt";
import type {
  AIAssistantMode,
  AIChatMessage,
  AILeadDraft,
  AIWidgetScope,
} from "@/lib/ai/types";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

export interface AICompletionInput {
  messages: AIChatMessage[];
  scope: AIWidgetScope;
  assistant?: AIAssistantMode;
  leadDraft?: AILeadDraft | null;
  timeoutMs?: number;
  allowDevFallback?: boolean;
  model?: string;
}

export interface AICompletionOutput {
  reply: string;
  model: string;
}

function getApiKey(): string {
  return process.env.OPENROUTER_API_KEY?.trim() ?? "";
}

function getModel(inputModel?: string): string {
  const envModel = process.env.OPENROUTER_MODEL?.trim();
  return inputModel?.trim() || envModel || OPENROUTER_DEFAULT_MODEL;
}

function getReferer(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return "http://localhost:3000";

  try {
    return new URL(siteUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function extractReply(payload: OpenRouterResponse): string {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join(" ")
      .trim();
    return joined;
  }

  return "";
}

function buildSystemPrompt(params: {
  scope: AIWidgetScope;
  assistant: AIAssistantMode;
  leadDraft?: AILeadDraft | null;
}): string {
  if (params.assistant === "admin") {
    return buildAdminSystemPrompt();
  }

  return buildRealEstateSystemPrompt({
    scope: params.scope,
    leadDraft: params.leadDraft ?? null,
  });
}

async function requestOpenRouter(params: {
  apiKey: string;
  model: string;
  messages: AIChatMessage[];
  scope: AIWidgetScope;
  assistant: AIAssistantMode;
  leadDraft?: AILeadDraft | null;
  timeoutMs: number;
}): Promise<AICompletionOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": getReferer(),
        "X-Title": "KOITALA",
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0.35,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt({
              scope: params.scope,
              assistant: params.assistant,
              leadDraft: params.leadDraft ?? null,
            }),
          },
          ...params.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      const upstreamMessage = payload.error?.message?.trim() || "openrouter-request-failed";
      throw new Error(`openrouter-http-${response.status}:${upstreamMessage}`);
    }

    const reply = extractReply(payload);
    if (!reply) {
      throw new Error("openrouter-empty-reply");
    }

    return {
      reply,
      model: params.model,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("openrouter-timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestAICompletion(input: AICompletionInput): Promise<AICompletionOutput> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("missing-openrouter-api-key");
  }

  const primaryModel = getModel(input.model);
  const timeoutMs = input.timeoutMs ?? 15_000;
  const assistant = input.assistant ?? "user";

  try {
    return await requestOpenRouter({
      apiKey,
      model: primaryModel,
      messages: input.messages,
      scope: input.scope,
      assistant,
      leadDraft: input.leadDraft ?? null,
      timeoutMs,
    });
  } catch (error) {
    const allowFallback =
      input.allowDevFallback &&
      process.env.NODE_ENV !== "production" &&
      primaryModel !== OPENROUTER_DEV_FALLBACK_MODEL;

    if (!allowFallback) {
      throw error;
    }

    return requestOpenRouter({
      apiKey,
      model: OPENROUTER_DEV_FALLBACK_MODEL,
      messages: input.messages,
      scope: input.scope,
      assistant,
      leadDraft: input.leadDraft ?? null,
      timeoutMs,
    });
  }
}
