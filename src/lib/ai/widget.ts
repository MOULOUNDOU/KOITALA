export const AI_CHAT_WIDGET_ANCHOR_ID = "assistant-ia";
export const AI_CHAT_OPEN_EVENT = "koitala:open-ai-chat";
export const AI_CHAT_OPEN_ON_NEXT_PAGE_KEY = "koitala:open-ai-chat-next";
export const PUBLIC_ASSISTANT_PAGE_HREF = "/assistant-ia";

export function getAssistantHashHref(basePath = "/"): string {
  return `${basePath}#${AI_CHAT_WIDGET_ANCHOR_ID}`;
}
