export type AIChatRole = "user" | "assistant";

export type AIWidgetScope = "public" | "dashboard";
export type AIAssistantMode = "user" | "admin";
export type AIAdminActionType = "update_property" | "delete_property";
export type AIChatAttachmentType = "text" | "image";

export interface AIChatAttachment {
  type: AIChatAttachmentType;
  name: string;
  mimeType: string;
  textContent?: string;
  dataUrl?: string;
}

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
  createdAt?: string;
  attachments?: AIChatAttachment[];
}

export interface AILeadDraft {
  fullName?: string;
  phone?: string;
  email?: string;
  intent?: "achat" | "location";
  propertyType?: string;
  area?: string;
  budget?: string;
  rooms?: string;
  timeline?: string;
}

export interface AIChatRequestBody {
  messages: AIChatMessage[];
  scope?: AIWidgetScope;
  assistant?: AIAssistantMode;
  leadDraft?: AILeadDraft | null;
}

export interface AIAdminActionProposal {
  type: AIAdminActionType;
  propertyId?: string;
  propertySlug?: string;
  propertyQuery?: string;
  updates?: Record<string, unknown>;
  confirmationMessage?: string;
}

export interface AIChatResponseBody {
  reply: string;
  model: string;
  scope: AIWidgetScope;
  assistant: AIAssistantMode;
  leadDraft: AILeadDraft | null;
  adminAction?: AIAdminActionProposal | null;
}
