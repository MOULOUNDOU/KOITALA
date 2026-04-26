"use client";

import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Compass,
  LayoutGrid,
  Mic,
  MicOff,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  SendHorizontal,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { extractLeadDraftFromMessages, mergeLeadDraft } from "@/lib/ai/lead";
import type {
  AIAdminActionProposal,
  AIAssistantMode,
  AIChatAttachment,
  AIChatMessage,
  AIChatResponseBody,
  AILeadDraft,
  AIWidgetScope,
} from "@/lib/ai/types";
import {
  AI_CHAT_OPEN_EVENT,
  AI_CHAT_WIDGET_ANCHOR_ID,
  PUBLIC_ASSISTANT_PAGE_HREF,
} from "@/lib/ai/widget";
import { cn } from "@/lib/utils";

interface ScopeConfig {
  title: string;
  subtitle: string;
  inputPlaceholder: string;
}

interface AssistantConfig {
  apiEndpoint: string;
  welcomeMessage: string;
  openButtonLabel: string;
  openButtonAriaLabel: string;
  panelAriaLabel: string;
  loadingLabel: string;
  pageEmptyTitle: string;
  pageEmptySubtitle: string;
  pageSidebarTitle: string;
  pageFooterHint: string;
  topicsPrompts: readonly string[];
  guidancePrompts: readonly string[];
  showLeadBadges: boolean;
}

const SCOPE_CONFIG: Record<AIAssistantMode, Record<AIWidgetScope, ScopeConfig>> = {
  user: {
    public: {
      title: "Assistant Immobilier KOITALA",
      subtitle: "Questions sur les biens, services et recherche personnalisee.",
      inputPlaceholder: "Decrivez votre besoin immobilier...",
    },
    dashboard: {
      title: "Assistant KOITALA Dashboard",
      subtitle: "Guide interface, actions utiles et qualification rapide.",
      inputPlaceholder: "Posez votre question rapide...",
    },
  },
  admin: {
    public: {
      title: "Assistant Immobilier KOITALA",
      subtitle: "Questions sur les biens, services et recherche personnalisee.",
      inputPlaceholder: "Decrivez votre besoin immobilier...",
    },
    dashboard: {
      title: "Assistant Immobilier KOITALA",
      subtitle: "Questions sur les biens, services et recherche personnalisee.",
      inputPlaceholder: "Decrivez votre besoin immobilier...",
    },
  },
};

interface UIMessage extends AIChatMessage {
  id: string;
}

interface StoredAIConversation {
  messages: UIMessage[];
  leadDraft: AILeadDraft | null;
  pendingAdminAction?: AIAdminActionProposal | null;
}

interface AIChatWidgetProps {
  scope: AIWidgetScope;
  assistant?: AIAssistantMode;
  mode?: "floating" | "page";
}

type PageSidebarTool = "search" | "topics" | "guidance";
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionResultLike {
  0?: {
    transcript?: string;
  };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(win: Window): SpeechRecognitionCtor | null {
  const speechWindow = win as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const MALE_VOICE_HINTS = [
  "male",
  "homme",
  "man",
  "thomas",
  "henri",
  "paul",
  "antoine",
  "gabriel",
  "nicolas",
  "julien",
  "mathieu",
  "david",
  "francois",
  "xavier",
  "michel",
  "jean",
  "daniel",
] as const;

const PROFESSIONAL_VOICE_HINTS = [
  "neural",
  "premium",
  "enhanced",
  "natural",
  "wavenet",
  "studio",
  "pro",
  "high quality",
] as const;

function normalizeVoiceText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function scoreVoiceForKoitala(voice: SpeechSynthesisVoice): number {
  const normalizedName = normalizeVoiceText(voice.name);
  const normalizedLang = normalizeVoiceText(voice.lang);
  const searchableText = `${normalizedName} ${normalizedLang}`;

  let score = 0;

  if (normalizedLang.startsWith("fr")) {
    score += 70;
  } else if (normalizedLang.includes("fr")) {
    score += 30;
  }

  if (MALE_VOICE_HINTS.some((hint) => searchableText.includes(hint))) {
    score += 45;
  }

  if (PROFESSIONAL_VOICE_HINTS.some((hint) => searchableText.includes(hint))) {
    score += 25;
  }

  if (voice.localService) {
    score += 5;
  }

  return score;
}

function pickPreferredKoitalaVoice(synthesis: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synthesis.getVoices();
  if (voices.length === 0) return null;

  const scoredVoices = voices
    .map((voice) => ({
      voice,
      score: scoreVoiceForKoitala(voice),
    }))
    .sort((a, b) => b.score - a.score);

  return scoredVoices[0]?.voice ?? null;
}

const MAX_PENDING_ATTACHMENTS = 4;
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_ATTACHMENT_CHARS = 8_000;
const FILE_INPUT_ACCEPT =
  "image/*,.txt,.md,.csv,.json,.xml,.html,.htm,.log,.yaml,.yml,.ini,.conf";
const TEXT_MIME_TYPES = [
  "application/json",
  "application/xml",
  "application/xhtml+xml",
  "application/x-yaml",
] as const;
const TEXT_FILE_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".htm",
  ".log",
  ".yaml",
  ".yml",
  ".ini",
  ".conf",
] as const;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("file-read-error"));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("file-read-error"));
    reader.readAsDataURL(file);
  });
}

function isTextFileLike(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.startsWith("text/")) return true;
  if (TEXT_MIME_TYPES.includes(type as (typeof TEXT_MIME_TYPES)[number])) return true;
  const fileName = file.name.toLowerCase();
  return TEXT_FILE_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} o`;
}

async function buildAttachmentFromFile(
  file: File
): Promise<{ attachment: AIChatAttachment | null; error: string | null }> {
  const name = file.name.trim() || "fichier";
  const mimeType = (file.type || "application/octet-stream").trim();

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      return {
        attachment: null,
        error: `${name}: image trop lourde (max ${formatFileSize(MAX_IMAGE_FILE_BYTES)}).`,
      };
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (!dataUrl.startsWith("data:image/")) {
        return { attachment: null, error: `${name}: format image non supporte.` };
      }

      return {
        attachment: {
          type: "image",
          name,
          mimeType,
          dataUrl,
        },
        error: null,
      };
    } catch {
      return { attachment: null, error: `${name}: lecture de l image impossible.` };
    }
  }

  if (!isTextFileLike(file)) {
    return {
      attachment: null,
      error: `${name}: type de fichier non supporte. Utilisez texte/JSON/CSV/MD/XML ou image.`,
    };
  }

  if (file.size > MAX_TEXT_FILE_BYTES) {
    return {
      attachment: null,
      error: `${name}: fichier texte trop lourd (max ${formatFileSize(MAX_TEXT_FILE_BYTES)}).`,
    };
  }

  try {
    const rawText = await readFileAsText(file);
    const normalizedText = rawText
      .replace(/\r\n/g, "\n")
      .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
      .trim();
    const textContent = normalizedText.slice(0, MAX_TEXT_ATTACHMENT_CHARS);

    if (!textContent) {
      return { attachment: null, error: `${name}: fichier vide ou non lisible.` };
    }

    return {
      attachment: {
        type: "text",
        name,
        mimeType,
        textContent,
      },
      error: null,
    };
  } catch {
    return { attachment: null, error: `${name}: lecture du fichier impossible.` };
  }
}

const USER_PAGE_TOPICS_PROMPTS = [
  "Je cherche un studio a louer a Dakar avec un budget mensuel de 250000 FCFA.",
  "Je veux acheter une villa familiale avec 4 pieces a Dakar.",
  "Je cherche un terrain pour construction a vendre.",
  "Je veux comparer location et achat pour mon projet.",
] as const;

const USER_PAGE_GUIDANCE_PROMPTS = [
  "Quels documents dois-je preparer pour louer un bien ?",
  "Comment bien definir mon budget immobilier ?",
  "Comment se passe l accompagnement KOITALA pour un expatrie ?",
  "Quelles etapes pour finaliser un achat immobilier ?",
] as const;

const ADMIN_PAGE_TOPICS_PROMPTS = [
  "Cree un brouillon d annonce a partir de ce texte: Appartement 3 pieces a Mermoz, 85m2, 180000 FCFA/mois.",
  "Reecris cette annonce en version plus commerciale et corrige les fautes.",
  "Extrait les champs structures de ce texte d annonce et liste les donnees manquantes.",
  "Genere une version courte pour WhatsApp puis une autre pour Facebook/Instagram.",
] as const;

const ADMIN_PAGE_GUIDANCE_PROMPTS = [
  "Aide-moi a qualifier ce prospect: budget 45M FCFA, souhaite acheter sous 2 mois, zone Almadies.",
  "Prepare une reponse professionnelle a ce client qui demande une reduction de prix.",
  "Suggere des filtres pour retrouver les leads inactifs depuis 14 jours.",
  "Propose les prochaines actions utiles pour accelerer le traitement de cette annonce.",
] as const;

const ASSISTANT_CONFIG: Record<AIAssistantMode, AssistantConfig> = {
  user: {
    apiEndpoint: "/api/ai/chat",
    welcomeMessage:
      "Bonjour, je suis votre assistant immobilier. Je peux vous aider a trouver un bien ou repondre a vos questions.",
    openButtonLabel: "Assistant IA",
    openButtonAriaLabel: "Ouvrir l assistant immobilier",
    panelAriaLabel: "Assistant IA KOITALA",
    loadingLabel: "L assistant reflechit...",
    pageEmptyTitle: "Toujours pret a repondre.",
    pageEmptySubtitle:
      "Posez votre question sur un bien, une zone, un budget ou le processus KOITALA.",
    pageSidebarTitle: "Assistant KOITALA",
    pageFooterHint: "Assistant immobilier et qualification prospects.",
    topicsPrompts: USER_PAGE_TOPICS_PROMPTS,
    guidancePrompts: USER_PAGE_GUIDANCE_PROMPTS,
    showLeadBadges: true,
  },
  admin: {
    apiEndpoint: "/api/ai/chat",
    welcomeMessage:
      "Bonjour, je suis votre assistant immobilier. Je peux vous aider a trouver un bien ou repondre a vos questions.",
    openButtonLabel: "Assistant IA",
    openButtonAriaLabel: "Ouvrir l assistant admin",
    panelAriaLabel: "Assistant admin KOITALA",
    loadingLabel: "L assistant reflechit...",
    pageEmptyTitle: "Toujours pret a repondre.",
    pageEmptySubtitle:
      "Posez votre question sur un bien, une zone, un budget ou le processus KOITALA.",
    pageSidebarTitle: "Assistant KOITALA",
    pageFooterHint: "Assistant immobilier et qualification prospects.",
    topicsPrompts: ADMIN_PAGE_TOPICS_PROMPTS,
    guidancePrompts: ADMIN_PAGE_GUIDANCE_PROMPTS,
    showLeadBadges: true,
  },
};

function createMessageId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
}

function getStorageKey(scope: AIWidgetScope, assistant: AIAssistantMode): string {
  return `koitala.ai.chat.${assistant}.${scope}.v1`;
}

function getDefaultMessages(welcomeMessage: string): UIMessage[] {
  return [
    {
      id: createMessageId(),
      role: "assistant",
      content: welcomeMessage,
      createdAt: new Date().toISOString(),
    },
  ];
}

function isAIChatAttachmentArray(value: unknown): value is AIChatAttachment[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (!item || typeof item !== "object") return false;

    const type = Reflect.get(item, "type");
    const name = Reflect.get(item, "name");
    const mimeType = Reflect.get(item, "mimeType");
    const textContent = Reflect.get(item, "textContent");
    const dataUrl = Reflect.get(item, "dataUrl");

    if ((type !== "text" && type !== "image") || typeof name !== "string" || typeof mimeType !== "string") {
      return false;
    }

    if (textContent !== undefined && typeof textContent !== "string") return false;
    if (dataUrl !== undefined && typeof dataUrl !== "string") return false;

    return true;
  });
}

function isUIMessageArray(value: unknown): value is UIMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const role = Reflect.get(item, "role");
    const content = Reflect.get(item, "content");
    const id = Reflect.get(item, "id");
    const attachments = Reflect.get(item, "attachments");
    return (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      typeof id === "string" &&
      (attachments === undefined || isAIChatAttachmentArray(attachments))
    );
  });
}

function isAIAdminActionProposal(value: unknown): value is AIAdminActionProposal {
  if (!value || typeof value !== "object") return false;
  const type = Reflect.get(value, "type");
  return type === "create_property" || type === "update_property" || type === "delete_property";
}

function readConversationFromSession(
  scope: AIWidgetScope,
  assistant: AIAssistantMode
): StoredAIConversation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(scope, assistant));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAIConversation>;

    if (!isUIMessageArray(parsed.messages)) {
      return null;
    }

    return {
      messages: parsed.messages.slice(-24),
      leadDraft: parsed.leadDraft ?? null,
      pendingAdminAction: isAIAdminActionProposal(parsed.pendingAdminAction)
        ? parsed.pendingAdminAction
        : null,
    };
  } catch {
    return null;
  }
}

function persistConversationToSession(
  scope: AIWidgetScope,
  assistant: AIAssistantMode,
  value: StoredAIConversation
) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      getStorageKey(scope, assistant),
      JSON.stringify({
        messages: value.messages.slice(-24),
        leadDraft: value.leadDraft,
        pendingAdminAction: value.pendingAdminAction ?? null,
      })
    );
  } catch {
    // Ignore storage quota issues.
  }
}

function toApiMessages(messages: UIMessage[]): AIChatMessage[] {
  const latestUserMessageWithAttachmentsId =
    [...messages].reverse().find((message) => message.role === "user" && (message.attachments?.length ?? 0) > 0)?.id ??
    null;

  return messages.map(({ id, role, content, createdAt, attachments }) => ({
    role,
    content,
    createdAt,
    attachments: id === latestUserMessageWithAttachmentsId ? attachments : undefined,
  }));
}

function normalizeLeadIntent(intent: AILeadDraft["intent"]): string | null {
  if (intent === "achat") return "Achat";
  if (intent === "location") return "Location";
  return null;
}

function buildLeadBadges(draft: AILeadDraft | null): Array<{ label: string; value: string }> {
  if (!draft) return [];

  const badges = [
    { label: "Projet", value: normalizeLeadIntent(draft.intent) },
    { label: "Type", value: draft.propertyType },
    { label: "Zone", value: draft.area },
    { label: "Budget", value: draft.budget },
    { label: "Email", value: draft.email },
    { label: "Tel", value: draft.phone },
  ];

  return badges.filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function describeAdminAction(action: AIAdminActionProposal): string {
  if (action.type === "create_property") {
    const title =
      action.property && typeof action.property.title === "string"
        ? action.property.title
        : "nouvelle annonce";
    return `Créer l'annonce en brouillon: ${title}`;
  }

  const target = action.propertyId || action.propertySlug || action.propertyQuery || "annonce non précisée";
  if (action.type === "delete_property") {
    return `Supprimer l'annonce: ${target}`;
  }

  const updateKeys = action.updates ? Object.keys(action.updates).filter((key) => key.trim().length > 0) : [];
  const fieldLabel = updateKeys.length > 0 ? updateKeys.slice(0, 5).join(", ") : "champs non précisés";
  return `Modifier l'annonce ${target} (champs: ${fieldLabel})`;
}

export default function AIChatWidget({
  scope,
  assistant = "user",
  mode = "floating",
}: AIChatWidgetProps) {
  const isPageMode = mode === "page";
  const pathname = usePathname();
  const router = useRouter();
  const assistantConfig = ASSISTANT_CONFIG[assistant];
  const [isOpen, setIsOpen] = useState(isPageMode);
  const [inputValue, setInputValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AIChatAttachment[]>([]);
  const [messages, setMessages] = useState<UIMessage[]>(() =>
    getDefaultMessages(assistantConfig.welcomeMessage)
  );
  const [leadDraft, setLeadDraft] = useState<AILeadDraft | null>(null);
  const [pendingAdminAction, setPendingAdminAction] = useState<AIAdminActionProposal | null>(null);
  const [executingAdminAction, setExecutingAdminAction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSidebarTool, setActiveSidebarTool] = useState<PageSidebarTool | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const [voiceOutputSupported, setVoiceOutputSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isVoicePlaybackEnabled, setIsVoicePlaybackEnabled] = useState(false);

  const messageViewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const config = SCOPE_CONFIG[assistant][scope];
  const pageCloseHref =
    assistant === "admin"
      ? "/dashboard"
      : scope === "dashboard"
        ? "/"
        : "/";
  const pageCloseLabel =
    assistant === "admin"
      ? "Fermer et revenir au dashboard admin"
      : scope === "dashboard"
        ? "Fermer et revenir a l accueil"
        : "Fermer et revenir a l accueil";

  useEffect(() => {
    const stored = readConversationFromSession(scope, assistant);
    if (!stored) {
      setMessages(getDefaultMessages(assistantConfig.welcomeMessage));
      setLeadDraft(null);
      setPendingAdminAction(null);
      setPendingAttachments([]);
      return;
    }

    setMessages(
      stored.messages.length > 0
        ? stored.messages
        : getDefaultMessages(assistantConfig.welcomeMessage)
    );
    setLeadDraft(assistantConfig.showLeadBadges ? stored.leadDraft : null);
    setPendingAdminAction(assistant === "admin" ? stored.pendingAdminAction ?? null : null);
    setPendingAttachments([]);
  }, [scope, assistant, assistantConfig.welcomeMessage, assistantConfig.showLeadBadges]);

  useEffect(() => {
    persistConversationToSession(scope, assistant, { messages, leadDraft, pendingAdminAction });
  }, [scope, assistant, messages, leadDraft, pendingAdminAction]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages, loading, isOpen, isPageMode]);

  useEffect(() => {
    if (typeof window === "undefined" || isPageMode) return;

    const handleExternalOpen: EventListener = () => {
      setIsOpen(true);
    };

    window.addEventListener(AI_CHAT_OPEN_EVENT, handleExternalOpen);

    return () => {
      window.removeEventListener(AI_CHAT_OPEN_EVENT, handleExternalOpen);
    };
  }, [isPageMode]);

  useEffect(() => {
    if (!isPageMode) return;
    void router.prefetch(pageCloseHref);
  }, [isPageMode, pageCloseHref, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const synthesis = window.speechSynthesis;
    setVoiceInputSupported(getSpeechRecognitionCtor(window) !== null);
    setVoiceOutputSupported(typeof synthesis !== "undefined");

    if (!synthesis) {
      return;
    }

    const syncVoices = () => {
      synthesis.getVoices();
      setVoiceOutputSupported(true);
    };

    syncVoices();
    synthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      synthesis.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
  }, []);

  useEffect(() => {
    if (isPageMode || isOpen || !recognitionRef.current) return;
    recognitionRef.current.stop();
  }, [isOpen, isPageMode]);

  useEffect(() => {
    if (typeof window === "undefined" || !voiceOutputSupported) return;
    if (!isVoicePlaybackEnabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  }, [isVoicePlaybackEnabled, voiceOutputSupported]);

  if (!isPageMode && pathname === "/assistant-ia") {
    return null;
  }

  const focusComposer = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const activateSidebarTool = (tool: PageSidebarTool) => {
    setActiveSidebarTool((current) => (current === tool ? null : tool));

    if (tool === "search") {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return;
    }

    focusComposer();
  };

  const handleOpenFilePicker = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleCloseAssistantPage = () => {
    if (!isPageMode) {
      setIsOpen(false);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();

      try {
        const sameOriginReferrer =
          document.referrer.length > 0 &&
          new URL(document.referrer, window.location.href).origin === window.location.origin;

        if (sameOriginReferrer && window.history.length > 1) {
          startTransition(() => {
            router.back();
          });
          return;
        }
      } catch {
        // Fall back to the default route below if referrer parsing fails.
      }
    }

    startTransition(() => {
      router.replace(pageCloseHref);
    });
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";

    if (selectedFiles.length === 0) return;

    const remainingSlots = MAX_PENDING_ATTACHMENTS - pendingAttachments.length;
    if (remainingSlots <= 0) {
      setError(`Vous pouvez joindre jusqu a ${MAX_PENDING_ATTACHMENTS} fichiers par message.`);
      return;
    }

    const filesToProcess = selectedFiles.slice(0, remainingSlots);
    const results = await Promise.all(filesToProcess.map((file) => buildAttachmentFromFile(file)));

    const nextAttachments = results
      .map((item) => item.attachment)
      .filter((item): item is AIChatAttachment => item !== null);
    const errors = results
      .map((item) => item.error)
      .filter((item): item is string => Boolean(item));

    if (nextAttachments.length > 0) {
      setPendingAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_PENDING_ATTACHMENTS));
    }

    if (selectedFiles.length > filesToProcess.length) {
      errors.unshift(`Maximum ${MAX_PENDING_ATTACHMENTS} fichiers par message.`);
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    setError(null);
  };

  const handleRemovePendingAttachment = (indexToRemove: number) => {
    setPendingAttachments((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleResetConversation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (typeof window !== "undefined" && voiceOutputSupported) {
      window.speechSynthesis.cancel();
    }

    setIsListening(false);
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setMessages(getDefaultMessages(assistantConfig.welcomeMessage));
    setLeadDraft(null);
    setPendingAdminAction(null);
    setPendingAttachments([]);
    setError(null);
    setSearchQuery("");
    setActiveSidebarTool(null);
  };

  const handleToggleVoicePlayback = () => {
    if (!voiceOutputSupported) {
      setError("Lecture vocale non supportee sur ce navigateur.");
      return;
    }

    setError(null);
    const shouldEnablePlayback = !isVoicePlaybackEnabled;
    setIsVoicePlaybackEnabled(shouldEnablePlayback);

    if (!shouldEnablePlayback) {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const handleSpeakAssistantMessage = (message: UIMessage) => {
    if (message.role !== "assistant") return;

    if (!voiceOutputSupported) {
      setError("Lecture vocale non supportee sur ce navigateur.");
      return;
    }

    if (!isVoicePlaybackEnabled) {
      setError("Activez d abord le bouton voix pour lire les reponses.");
      return;
    }

    if (typeof window === "undefined") return;
    const utteranceText = message.content.trim();
    if (!utteranceText) return;

    const synthesis = window.speechSynthesis;
    if (isSpeaking && speakingMessageId === message.id) {
      synthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.lang = "fr-FR";
    const preferredVoice = pickPreferredKoitalaVoice(synthesis);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 0.96;
    utterance.pitch = 0.86;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(message.id);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId((current) => (current === message.id ? null : current));
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      setIsSpeaking(false);
      setSpeakingMessageId((current) => (current === message.id ? null : current));

      const errorCode = (event.error || "").toLowerCase();
      if (errorCode === "canceled" || errorCode === "interrupted") {
        setError(null);
        return;
      }

      setError("Lecture vocale indisponible pour cette reponse.");
    };

    try {
      synthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setError(null);
      synthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      setError("Lecture vocale indisponible pour cette reponse.");
    }
  };

  const handleToggleVoiceInput = () => {
    if (loading) return;

    if (!voiceInputSupported) {
      setError("Dictee vocale non supportee sur ce navigateur.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    if (typeof window === "undefined") return;
    const RecognitionCtor = getSpeechRecognitionCtor(window);
    if (!RecognitionCtor) {
      setVoiceInputSupported(false);
      setError("Dictee vocale non supportee sur ce navigateur.");
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript?.trim() ?? "")
        .filter((chunk): chunk is string => chunk.length > 0)
        .join(" ")
        .trim();

      if (!transcript) return;

      setInputValue(transcript);
      setError(null);
      void handleSendMessage(transcript);
    };
    recognition.onerror = (event: { error?: string }) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Acces micro refuse. Autorisez le micro puis reessayez.");
        return;
      }
      if (event.error === "no-speech") {
        setError("Aucune voix detectee. Reessayez.");
        return;
      }
      setError("La dictee vocale a echoue. Reessayez.");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setError("Impossible de demarrer la dictee vocale.");
    }
  };

  const handleSendMessage = async (presetText?: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const textToSend = (presetText ?? inputValue).trim();
    const attachmentsToSend = pendingAttachments;
    if ((!textToSend && attachmentsToSend.length === 0) || loading) return;

    const finalUserContent =
      textToSend || "Merci d analyser les fichiers joints et de repondre de maniere claire.";

    const userMessage: UIMessage = {
      id: createMessageId(),
      role: "user",
      content: finalUserContent,
      createdAt: new Date().toISOString(),
      attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
    };

    const nextMessages = [...messages, userMessage];
    const extractedLead = assistantConfig.showLeadBadges
      ? extractLeadDraftFromMessages(toApiMessages(nextMessages))
      : null;
    const mergedLead = assistantConfig.showLeadBadges
      ? mergeLeadDraft(leadDraft, extractedLead)
      : null;

    setMessages(nextMessages);
    setLeadDraft(mergedLead);
    setInputValue("");
    setPendingAttachments([]);
    setError(null);
    if (assistant === "admin") {
      setPendingAdminAction(null);
    }
    setLoading(true);

    try {
      const response = await fetch(assistantConfig.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistant,
          scope,
          messages: toApiMessages(nextMessages).slice(-18),
          leadDraft: mergedLead,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (AIChatResponseBody & { error?: string })
        | null;

      if (!response.ok || !payload?.reply) {
        const message = payload?.error || "Assistant indisponible. Veuillez reessayer.";
        setError(message);
        return;
      }

      const assistantMessage: UIMessage = {
        id: createMessageId(),
        role: "assistant",
        content: payload.reply.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (assistantConfig.showLeadBadges) {
        setLeadDraft((prev) => mergeLeadDraft(prev, payload.leadDraft ?? null));
      }
      if (assistant === "admin") {
        setPendingAdminAction(payload.adminAction ?? null);
      }
    } catch {
      setError("Erreur reseau. Verifiez votre connexion puis reessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAdminAction = async () => {
    if (assistant !== "admin" || !pendingAdminAction || loading || executingAdminAction) return;

    setExecutingAdminAction(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/admin-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: true,
          action: pendingAdminAction,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string; updatedFields?: string[] }
        | null;

      if (!response.ok) {
        setError(payload?.error || "Execution impossible pour cette action.");
        return;
      }

      const message = payload?.message || "Action admin executee avec succes.";
      const details =
        Array.isArray(payload?.updatedFields) && payload.updatedFields.length > 0
          ? ` Champs mis a jour: ${payload.updatedFields.join(", ")}.`
          : "";

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: `${message}${details}`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingAdminAction(null);
    } catch {
      setError("Erreur reseau lors de l execution de l action admin.");
    } finally {
      setExecutingAdminAction(false);
    }
  };

  const floatingBottomClass =
    assistant === "admin" && scope === "dashboard"
      ? "top-1/2 -translate-y-1/2"
      : scope === "public"
        ? "bottom-[5.5rem] sm:bottom-20"
        : "bottom-6";
  const showFloatingLauncher = !(assistant === "admin" && scope === "dashboard");
  const panelBottomClass = "bottom-2 sm:bottom-6";
  const leadBadges = assistantConfig.showLeadBadges ? buildLeadBadges(leadDraft) : [];
  const voiceInputButtonLabel = isListening
    ? "Arreter l ecoute micro"
    : "Parler au micro (envoi auto)";
  const voicePlaybackButtonLabel = isVoicePlaybackEnabled
    ? "Desactiver la lecture vocale (bouton Lire)"
    : "Activer la lecture vocale (bouton Lire)";
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const matchingMessagesCount =
    normalizedSearchQuery.length === 0
      ? 0
      : messages.filter((message) => message.content.toLowerCase().includes(normalizedSearchQuery)).length;
  const pendingAttachmentCountLabel =
    pendingAttachments.length === 1
      ? "1 piece jointe"
      : `${pendingAttachments.length} pieces jointes`;

  if (isPageMode) {
    return (
      <section
        className="anim-scale-in relative mx-auto h-[min(82dvh,820px)] w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#1d1f24] shadow-[0_36px_90px_rgba(10,12,18,0.55)]"
        aria-label={assistantConfig.panelAriaLabel}
      >
        <div className="grid h-full grid-cols-1 md:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="hidden h-full flex-col overflow-y-auto border-r border-white/10 bg-[#15161a] px-3 py-4 text-gray-300 md:flex">
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Espace IA</p>
              <p className="mt-1 text-sm font-semibold text-white">{assistantConfig.pageSidebarTitle}</p>
            </div>

            <button
              type="button"
              onClick={handleResetConversation}
              className="inline-flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <PencilLine className="h-4 w-4" />
              </span>
              Nouveau chat
            </button>

            <div className="mt-5 space-y-2 text-sm">
              {[
                { key: "search" as const, icon: Search, label: "Rechercher une conversation" },
                {
                  key: "topics" as const,
                  icon: LayoutGrid,
                  label: "Mes sujets immobiliers",
                },
                {
                  key: "guidance" as const,
                  icon: Compass,
                  label: "Conseils et orientation",
                },
              ].map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => activateSidebarTool(entry.key)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200",
                    activeSidebarTool === entry.key && "bg-white/10 text-white"
                  )}
                >
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-gray-300 transition-colors group-hover:bg-white/10 group-hover:text-white">
                    <entry.icon className="h-4 w-4" />
                  </span>
                  <span className="leading-snug">{entry.label}</span>
                </button>
              ))}
            </div>

            {activeSidebarTool === "search" && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Recherche</p>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Mot-clé dans la conversation"
                  className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-[#22252b] px-3 text-xs text-gray-200 outline-none placeholder:text-gray-500 focus:border-white/20"
                />
                <p className="mt-2 text-[11px] text-gray-400">
                  {normalizedSearchQuery.length === 0
                    ? "Saisissez un mot-clé pour filtrer les messages."
                    : `${matchingMessagesCount} message(s) trouvé(s).`}
                </p>
              </div>
            )}

            {activeSidebarTool === "topics" && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Sujets rapides</p>
                <div className="mt-2 space-y-2">
                  {assistantConfig.topicsPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void handleSendMessage(prompt)}
                      disabled={loading}
                      className="w-full rounded-lg border border-white/10 bg-[#22252b] px-2.5 py-2 text-left text-[11px] leading-relaxed text-gray-300 transition-colors hover:bg-[#2c3038] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSidebarTool === "guidance" && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">Guides pratiques</p>
                <div className="mt-2 space-y-2">
                  {assistantConfig.guidancePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void handleSendMessage(prompt)}
                      disabled={loading}
                      className="w-full rounded-lg border border-white/10 bg-[#22252b] px-2.5 py-2 text-left text-[11px] leading-relaxed text-gray-300 transition-colors hover:bg-[#2c3038] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto rounded-xl border border-white/10 bg-white/5 px-3 py-3.5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">KOITALA IA</p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                {assistantConfig.pageFooterHint}
              </p>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col bg-[#1f2127]">
            <header className="border-b border-white/10 px-4 py-3 text-white sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo-koitala.png"
                    alt="KOITALA"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Assistant KOITALA</p>
                    <h2 className="mt-1 text-sm font-semibold sm:text-base">{config.title}</h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseAssistantPage}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
                  aria-label={pageCloseLabel}
                  title={pageCloseLabel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              ref={messageViewportRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-5 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] [touch-action:pan-y] sm:px-6"
              role="log"
              aria-live="polite"
            >
              <div className="mx-auto w-full max-w-3xl space-y-4">
                {messages.length <= 1 && (
                  <div className="py-8 text-center text-gray-300">
                    <p className="text-2xl font-semibold sm:text-3xl">{assistantConfig.pageEmptyTitle}</p>
                    <p className="mt-2 text-sm text-gray-400">{assistantConfig.pageEmptySubtitle}</p>
                  </div>
                )}

                {messages.map((message) => {
                  const isMatch =
                    normalizedSearchQuery.length > 0 &&
                    message.content.toLowerCase().includes(normalizedSearchQuery);
                  const isAssistantMessage = message.role === "assistant";
                  const isCurrentMessageSpeaking = isSpeaking && speakingMessageId === message.id;

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          message.role === "user"
                            ? "rounded-br-md bg-[#2d3444] text-white"
                            : "rounded-bl-md border border-white/10 bg-[#2a2d34] text-gray-100",
                          isMatch && "ring-1 ring-[#e8b86d]/80"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {message.attachments.map((attachment, index) => (
                              <span
                                key={`${message.id}-attachment-${index}`}
                                className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-gray-200"
                              >
                                {attachment.type === "image" ? "Image" : "Fichier"}: {attachment.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {isAssistantMessage && isVoicePlaybackEnabled && voiceOutputSupported && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSpeakAssistantMessage(message)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                                isCurrentMessageSpeaking
                                  ? "border-[#e8b86d]/70 bg-[#e8b86d]/20 text-[#f3cb87]"
                                  : "border-white/20 bg-white/10 text-gray-200 hover:bg-white/15"
                              )}
                              aria-label={isCurrentMessageSpeaking ? "Arreter la lecture" : "Lire la reponse"}
                              title={isCurrentMessageSpeaking ? "Arreter la lecture" : "Lire la reponse"}
                            >
                              {isCurrentMessageSpeaking ? (
                                <VolumeX className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                              {isCurrentMessageSpeaking ? "Arreter" : "Lire"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-[#2a2d34] px-3 py-2 text-xs text-gray-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#e8b86d]" />
                      {assistantConfig.loadingLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {leadBadges.length > 0 && (
              <div className="border-t border-white/10 bg-[#1f2127] px-4 py-2.5 sm:px-6">
                <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-2 text-[11px] text-gray-300">
                  <span className="inline-flex items-center gap-1 uppercase tracking-[0.14em] text-gray-500">
                    <Bot className="h-3.5 w-3.5" />
                    Prospect detecte
                  </span>
                  {leadBadges.map((badge) => (
                    <span
                      key={`${badge.label}-${badge.value}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
                    >
                      {badge.label}: {badge.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assistant === "admin" && pendingAdminAction && (
              <div className="border-t border-white/10 bg-[#1f2127] px-4 py-3 sm:px-6">
                <div className="mx-auto w-full max-w-3xl rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-3 text-xs text-amber-100">
                  <p className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.16em] text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Action admin proposee
                  </p>
                  <p className="mt-2 text-amber-100/90">
                    {pendingAdminAction.confirmationMessage || describeAdminAction(pendingAdminAction)}
                  </p>
                  <p className="mt-1 text-amber-200/80">{describeAdminAction(pendingAdminAction)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleExecuteAdminAction()}
                      disabled={executingAdminAction || loading}
                      className="inline-flex items-center rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-[#2b1d00] transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {executingAdminAction ? "Execution..." : "Confirmer et executer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAdminAction(null)}
                      disabled={executingAdminAction}
                      className="inline-flex items-center rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <footer className="border-t border-white/10 bg-[#1f2127] px-4 py-4 sm:px-6">
              <div className="mx-auto w-full max-w-3xl">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_INPUT_ACCEPT}
                  multiple
                  onChange={handleFileSelection}
                  className="hidden"
                />

                {error && (
                  <p className="mb-2 rounded-lg border border-red-500/35 bg-red-500/15 px-3 py-2 text-xs text-red-200">
                    {error}
                  </p>
                )}

                {pendingAttachments.length > 0 && (
                  <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
                      {pendingAttachmentCountLabel}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pendingAttachments.map((attachment, index) => (
                        <span
                          key={`pending-${attachment.name}-${index}`}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/8 px-2 py-1 text-[11px] text-gray-200"
                        >
                          {attachment.type === "image" ? "Image" : "Fichier"}: {attachment.name}
                          <button
                            type="button"
                            onClick={() => handleRemovePendingAttachment(index)}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/15 hover:text-white"
                            aria-label={`Retirer ${attachment.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#2a2d34] px-3 py-2.5">
                  <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Joindre un fichier ou une image"
                    title="Joindre un fichier ou une image"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder={config.inputPlaceholder}
                    className="h-9 w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-400"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={handleToggleVoiceInput}
                    disabled={loading}
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
                      isListening && "bg-[#e8b86d]/20 text-[#e8b86d]",
                      !voiceInputSupported && "text-gray-500"
                    )}
                    aria-label={voiceInputButtonLabel}
                    title={voiceInputButtonLabel}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleVoicePlayback}
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-white/10 hover:text-white",
                      isVoicePlaybackEnabled && "bg-white/10 text-white",
                      !voiceOutputSupported && "text-gray-500"
                    )}
                    aria-label={voicePlaybackButtonLabel}
                    title={voicePlaybackButtonLabel}
                  >
                    {isVoicePlaybackEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={loading || (inputValue.trim().length === 0 && pendingAttachments.length === 0)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#17191f] transition-colors hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Envoyer le message"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    className="inline-flex items-center gap-1 font-medium text-gray-300 transition-colors hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Nouvelle conversation
                  </button>
                  <div className="flex items-center gap-3">
                    {isListening && <p className="text-[#e8b86d]">Ecoute micro...</p>}
                    {isSpeaking && isVoicePlaybackEnabled && <p className="text-[#e8b86d]">Lecture...</p>}
                    <p>Entree pour envoyer</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <span
        id={AI_CHAT_WIDGET_ANCHOR_ID}
        className="block h-0 scroll-mt-24"
        aria-hidden
      />

      {!isOpen && showFloatingLauncher && (
        scope === "public" ? (
          <Link
            href={PUBLIC_ASSISTANT_PAGE_HREF}
            className={cn(
              "fixed right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c] text-white shadow-[0_14px_35px_rgba(15,37,64,0.35)] ring-[3px] ring-white transition-all hover:scale-105 hover:bg-[#0f2540] hover:shadow-[0_18px_42px_rgba(15,37,64,0.42)]",
              floatingBottomClass
            )}
            aria-label="Aller a la page assistant immobilier"
            title="Assistant IA"
          >
            <span className="relative inline-flex h-7 w-7 animate-pulse items-center justify-center" aria-hidden>
              <Bot className="h-6 w-6" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-[#e8b86d]" />
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c] text-white shadow-[0_14px_35px_rgba(15,37,64,0.35)] ring-[3px] ring-white transition-all hover:scale-105 hover:bg-[#0f2540] hover:shadow-[0_18px_42px_rgba(15,37,64,0.42)]",
              floatingBottomClass
            )}
            aria-label={assistantConfig.openButtonAriaLabel}
            title={assistantConfig.openButtonLabel}
          >
            <span className="relative inline-flex h-7 w-7 animate-pulse items-center justify-center" aria-hidden>
              <Bot className="h-6 w-6" />
              <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-[#e8b86d]" />
            </span>
          </button>
        )
      )}

      {isOpen && (
        <section
          className={cn(
            "anim-scale-in fixed right-4 left-4 z-[80] flex h-[min(64dvh,560px)] max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden rounded-3xl border border-[#1a3a5c]/15 bg-white shadow-[0_24px_70px_rgba(15,23,36,0.28)] sm:left-1/2 sm:right-auto sm:h-[min(66dvh,580px)] sm:max-h-[calc(100dvh-3rem)] sm:w-[320px] sm:-translate-x-1/2",
            panelBottomClass
          )}
          aria-label={assistantConfig.panelAriaLabel}
        >
          <header className="bg-[linear-gradient(135deg,#1a3a5c,#0f2540)] px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo-koitala.png"
                    alt="KOITALA"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    KOITALA
                  </p>
                </div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                  <Sparkles className="h-3 w-3" />
                  IA
                </p>
                <h3 className="mt-2 text-sm font-bold leading-snug">{config.title}</h3>
                <p className="mt-1 text-xs text-white/75">{config.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Fermer l assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            ref={messageViewportRef}
            className="flex-1 min-h-0 space-y-3 overflow-y-scroll bg-[#f7f9fc] px-4 py-4 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
            role="log"
            aria-live="polite"
          >
            {messages.map((message) => {
              const isAssistantMessage = message.role === "assistant";
              const isCurrentMessageSpeaking = isSpeaking && speakingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {isAssistantMessage && (
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a3a5c] text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm",
                      message.role === "user"
                        ? "rounded-br-md bg-[#1a3a5c] text-white"
                        : "rounded-bl-md border border-gray-200 bg-white text-[#0f1724]"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.attachments.map((attachment, index) => (
                          <span
                            key={`${message.id}-attachment-${index}`}
                            className="rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-[#1a3a5c]"
                          >
                            {attachment.type === "image" ? "Image" : "Fichier"}: {attachment.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {isAssistantMessage && isVoicePlaybackEnabled && voiceOutputSupported && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSpeakAssistantMessage(message)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                            isCurrentMessageSpeaking
                              ? "border-[#c89644]/50 bg-[#fff2dd] text-[#8a6423]"
                              : "border-gray-300 bg-gray-100 text-[#1a3a5c] hover:bg-gray-200"
                          )}
                          aria-label={isCurrentMessageSpeaking ? "Arreter la lecture" : "Lire la reponse"}
                          title={isCurrentMessageSpeaking ? "Arreter la lecture" : "Lire la reponse"}
                        >
                          {isCurrentMessageSpeaking ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                          {isCurrentMessageSpeaking ? "Arreter" : "Lire"}
                        </button>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dce3ec] text-[#1a3a5c]">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-end justify-start gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a3a5c] text-white">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#1a3a5c]" />
                  {assistantConfig.loadingLabel}
                </div>
              </div>
            )}
          </div>

          {leadBadges.length > 0 && (
            <div className="border-t border-gray-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                <Bot className="h-3.5 w-3.5 text-[#1a3a5c]" />
                Prospect detecte
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#0f1724]">
                {leadBadges.map((badge) => (
                  <p
                    key={`${badge.label}-${badge.value}`}
                    className="rounded-full bg-[#f4f6f9] px-2.5 py-1"
                  >
                    {badge.label}: {badge.value}
                  </p>
                ))}
              </div>
            </div>
          )}

          {assistant === "admin" && pendingAdminAction && (
            <div className="border-t border-gray-100 bg-white px-4 py-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900">
                <p className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.14em] text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Action admin proposee
                </p>
                <p className="mt-2">
                  {pendingAdminAction.confirmationMessage || describeAdminAction(pendingAdminAction)}
                </p>
                <p className="mt-1 text-amber-700">{describeAdminAction(pendingAdminAction)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExecuteAdminAction()}
                    disabled={executingAdminAction || loading}
                    className="inline-flex items-center rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {executingAdminAction ? "Execution..." : "Confirmer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAdminAction(null)}
                    disabled={executingAdminAction}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 bg-white px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_INPUT_ACCEPT}
              multiple
              onChange={handleFileSelection}
              className="hidden"
            />

            {error && (
              <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            {pendingAttachments.length > 0 && (
              <div className="mb-2 rounded-xl border border-gray-200 bg-[#f8fafc] px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
                  {pendingAttachmentCountLabel}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment, index) => (
                    <span
                      key={`pending-mobile-${attachment.name}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2 py-1 text-[11px] text-[#1a3a5c]"
                    >
                      {attachment.type === "image" ? "Image" : "Fichier"}: {attachment.name}
                      <button
                        type="button"
                        onClick={() => handleRemovePendingAttachment(index)}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                        aria-label={`Retirer ${attachment.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenFilePicker}
                disabled={loading}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-[#f8fafc] text-[#1a3a5c] transition-colors hover:bg-[#eef3fa] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Joindre un fichier ou une image"
                title="Joindre un fichier ou une image"
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="relative flex-1">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder={config.inputPlaceholder}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafc] py-2.5 pl-9 pr-3 text-base text-[#0f1724] outline-none transition-all placeholder:text-gray-400 focus:border-[#1a3a5c] focus:bg-white focus:ring-2 focus:ring-[#1a3a5c]/10 sm:text-sm"
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                onClick={handleToggleVoiceInput}
                disabled={loading}
                className={cn(
                  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-[#f8fafc] text-[#1a3a5c] transition-colors hover:bg-[#eef3fa] disabled:cursor-not-allowed disabled:opacity-50",
                  isListening && "border-[#e8b86d] bg-[#fff6e6] text-[#8a6423]",
                  !voiceInputSupported && "text-gray-400"
                )}
                aria-label={voiceInputButtonLabel}
                title={voiceInputButtonLabel}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleVoicePlayback}
                className={cn(
                  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-[#f8fafc] text-[#1a3a5c] transition-colors hover:bg-[#eef3fa]",
                  isVoicePlaybackEnabled && "border-[#1a3a5c]/25 bg-[#edf2f8]",
                  !voiceOutputSupported && "text-gray-400"
                )}
                aria-label={voicePlaybackButtonLabel}
                title={voicePlaybackButtonLabel}
              >
                {isVoicePlaybackEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={loading || (inputValue.trim().length === 0 && pendingAttachments.length === 0)}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a3a5c] text-white transition-colors hover:bg-[#0f2540] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Envoyer le message"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetConversation}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a3a5c] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nouvelle conversation
              </button>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                {isListening && <p className="text-[#8a6423]">Ecoute...</p>}
                {isSpeaking && isVoicePlaybackEnabled && <p className="text-[#8a6423]">Lecture...</p>}
                <p>Entree pour envoyer</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
