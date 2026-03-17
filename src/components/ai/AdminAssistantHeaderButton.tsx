import Link from "next/link";
import { Bot } from "lucide-react";

export default function AdminAssistantHeaderButton() {
  return (
    <Link
      href="/dashboard/assistant-ia"
      className="inline-flex items-center gap-2 rounded-full border border-[#1a3a5c]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] shadow-sm transition-colors hover:bg-[#f4f6f9]"
      aria-label="Ouvrir la page assistant IA admin"
    >
      <Bot className="h-4 w-4" />
      Assistant IA
    </Link>
  );
}
