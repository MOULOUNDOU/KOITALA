import {
  buildAdminSystemPrompt,
  buildRealEstateSystemPrompt,
  OPENROUTER_BASE_URL,
  OPENROUTER_DEFAULT_MODEL,
  OPENROUTER_DEV_FALLBACK_MODEL,
} from "@/lib/ai/prompt";
import type {
  AIAssistantMode,
  AIChatAttachment,
  AIChatMessage,
  AILeadDraft,
  AIWidgetScope,
} from "@/lib/ai/types";

const OPENROUTER_VISION_FALLBACK_MODEL = "openrouter/auto";

interface OpenRouterMessageTextPart {
  type: "text";
  text: string;
}

interface OpenRouterMessageImagePart {
  type: "image_url";
  image_url: { url: string };
}

type OpenRouterMessagePart = OpenRouterMessageTextPart | OpenRouterMessageImagePart;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterMessagePart[];
}

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

function getVisionModel(): string | undefined {
  const envVisionModel = process.env.OPENROUTER_VISION_MODEL?.trim();
  return envVisionModel || undefined;
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

function buildAttachmentText(attachment: AIChatAttachment): string | null {
  if (attachment.type !== "text") return null;
  const text = attachment.textContent?.trim();
  if (!text) return null;
  return `Contenu du fichier "${attachment.name}":\n${text}`;
}

function toOpenRouterMessage(message: AIChatMessage): OpenRouterMessage {
  const attachmentList = message.attachments ?? [];
  const contentText = message.content.trim();

  if (attachmentList.length === 0) {
    return {
      role: message.role,
      content: contentText,
    };
  }

  const parts: OpenRouterMessagePart[] = [];
  if (contentText) {
    parts.push({ type: "text", text: contentText });
  }

  for (const attachment of attachmentList) {
    if (attachment.type === "text") {
      const attachmentText = buildAttachmentText(attachment);
      if (attachmentText) {
        parts.push({ type: "text", text: attachmentText });
      }
      continue;
    }

    if (attachment.type === "image" && attachment.dataUrl?.startsWith("data:image/")) {
      parts.push({
        type: "text",
        text: `Image jointe: ${attachment.name}`,
      });
      parts.push({
        type: "image_url",
        image_url: { url: attachment.dataUrl },
      });
    }
  }

  if (parts.length === 0) {
    return {
      role: message.role,
      content: contentText || "Piece jointe fournie.",
    };
  }

  return {
    role: message.role,
    content: parts,
  };
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

  const openRouterMessages: OpenRouterMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt({
        scope: params.scope,
        assistant: params.assistant,
        leadDraft: params.leadDraft ?? null,
      }),
    },
    ...params.messages.map(toOpenRouterMessage),
  ];

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
        messages: openRouterMessages,
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

  const hasImageAttachments = input.messages.some((message) =>
    (message.attachments ?? []).some((attachment) => attachment.type === "image")
  );
  const visionModel = hasImageAttachments
    ? getVisionModel() ?? OPENROUTER_VISION_FALLBACK_MODEL
    : undefined;
  const primaryModel = getModel(visionModel || input.model);
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
