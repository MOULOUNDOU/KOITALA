"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

interface SignOutConfirmDialogProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SignOutConfirmDialog({
  open,
  loading = false,
  onCancel,
  onConfirm,
}: SignOutConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    document.body.classList.add("signout-dialog-open");
    return () => {
      document.body.classList.remove("signout-dialog-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, loading, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-signout-dialog="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#22080d]/70 p-4 animate-fade-in"
      onClick={() => {
        if (!loading) onCancel();
      }}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#8f3744] bg-[#5a1720] shadow-[0_28px_80px_rgba(24,4,8,0.34)] anim-scale-in"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[#ff5b6d]" />

        <div className="flex items-start justify-between gap-4 border-b border-[#7d2b36] bg-[#6a1d28] px-5 pb-5 pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#b55a67] bg-[#8b2d3a] text-[#fff1f3]">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 id="logout-dialog-title" className="text-lg font-bold leading-6 text-white">
                Confirmer la déconnexion
              </h3>
              <p id="logout-dialog-description" className="mt-2 text-sm leading-6 text-[#f0d0d5]">
                Vous allez quitter votre session KOITALA sur cet appareil.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg bg-[#7d2b36] p-1.5 text-[#ffe8ec] transition-colors hover:bg-[#97424e] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Fermer la popup de déconnexion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 mt-5 rounded-xl border border-[#8f3744] bg-[#6d222d] px-4 py-3 text-sm leading-6 text-[#f7dde1] shadow-[inset_0_1px_0_#8f3744]">
          Vos données restent enregistrées. Vous pourrez vous reconnecter à tout moment avec votre compte.
        </div>

        <div className="px-5 pb-5 pt-5">
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-11 flex-1 rounded-xl border border-[#9b4652] bg-[#6a1d28] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7d2b36] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-[#f2d06b] px-4 text-sm font-semibold text-[#3a1017] transition-colors hover:bg-[#e4bf58] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Déconnexion..." : "Se déconnecter"}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ddb0b7]">
            Session KOITALA
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
