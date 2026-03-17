"use client";

import { Bot } from "lucide-react";
import { AI_CHAT_OPEN_EVENT } from "@/lib/ai/widget";

export default function AdminAssistantHeaderButton() {
  const handleOpenAssistant = () => {
    window.dispatchEvent(new Event(AI_CHAT_OPEN_EVENT));
  };

  return (
    <button
      type="button"
      onClick={handleOpenAssistant}
      className="inline-flex items-center gap-2 rounded-full border border-[#1a3a5c]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] shadow-sm transition-colors hover:bg-[#f4f6f9]"
      aria-label="Ouvrir l assistant IA admin"
    >
      <Bot className="h-4 w-4" />
      Assistant IA
    </button>
  );
}
