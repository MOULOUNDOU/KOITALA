"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      toast.success("Inscription réussie ! Merci.");
      setEmail("");
      setLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre adresse email"
        required
        className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8b86d]/40 focus:border-[#e8b86d]/50 transition-all"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3.5 bg-[#e8b86d] text-[#1a3a5c] font-semibold rounded-xl hover:bg-[#d9a45a] active:scale-95 disabled:opacity-70 transition-all duration-200 whitespace-nowrap"
      >
        {loading ? "..." : "S'inscrire"}
      </button>
    </form>
  );
}
