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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#22080d]/80 p-4 backdrop-blur-[3px] animate-fade-in"
      onClick={() => {
        if (!loading) onCancel();
      }}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#7c2631] bg-[#5a1720] shadow-[0_30px_80px_rgba(24,4,8,0.48)] anim-scale-in"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#b73041]" />

        <div className="flex items-start justify-between gap-3 border-b border-[#7d2b36] bg-[#6a1d28] px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#b55a67] bg-[#8b2d3a] text-[#fff1f3]">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <h3 id="logout-dialog-title" className="text-[17px] font-semibold leading-6 text-white">
                Voulez-vous vraiment vous déconnecter ?
              </h3>
              <p id="logout-dialog-description" className="mt-1 text-sm leading-relaxed text-[#f0d0d5]">
                Vous allez quitter votre session Koitala. Vous pourrez vous reconnecter à tout moment.
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

        <div className="mx-5 mt-4 rounded-2xl border border-[#8f3744] bg-[#6d222d] px-3.5 py-3 text-xs text-[#f7dde1] shadow-[inset_0_1px_0_#8f3744]">
          Cette action ferme uniquement la session en cours sur cet appareil. Vos données restent enregistrées.
        </div>

        <div className="bg-[#5a1720] px-5 pb-5 pt-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-[#1f4f8f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173f72] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rester connecté
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-[#6b4226] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#55331d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Déconnexion..." : "Oui, me déconnecter"}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] font-medium tracking-[0.08em] text-[#ddb0b7] uppercase">
            Session Koitala
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
