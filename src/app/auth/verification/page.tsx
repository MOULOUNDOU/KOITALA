"use client";

import { useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolvePostAuthPath } from "@/lib/auth/redirects";
import toast from "react-hot-toast";

function VerificationForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const supabase = createClient();

  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resolveIsAdmin = async (userId: string, userEmail?: string | null): Promise<boolean> => {
    const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
    if (!rpcError && typeof rpcIsAdmin === "boolean") {
      return rpcIsAdmin;
    }

    const { data: profileById } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileById?.role === "admin") {
      return true;
    }

    if (userEmail) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", userEmail)
        .maybeSingle();

      return profileByEmail?.role === "admin";
    }

    return false;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input after render
    if (value && index < 7) {
      requestAnimationFrame(() => {
        const next = inputRefs.current[index + 1];
        if (next) {
          next.focus();
          next.select();
        }
      });
    }

    // Auto-submit when all 8 digits filled
    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    if (pasted.length === 0) return;
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    const nextIndex = Math.min(pasted.length, 7);
    inputRefs.current[nextIndex]?.focus();

    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleVerify = async (token?: string) => {
    const otp = token || code.join("");
    if (otp.length !== 8) {
      toast.error("Veuillez entrer les 8 chiffres du code.");
      return;
    }
    if (!email) {
      toast.error("Email manquant. Veuillez vous réinscrire.");
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("expired") || msg.includes("expir")) {
          toast.error("Le code a expiré. Demandez un nouveau code.");
        } else if (msg.includes("invalid") || msg.includes("otp")) {
          toast.error("Code invalide. Vérifiez et réessayez.");
        } else {
          toast.error("Erreur de vérification. Réessayez.");
        }
        setCode(["", "", "", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      toast.success("Email vérifié avec succès !", { duration: 3000 });
      setTimeout(() => {
        void (async () => {
          const result = await supabase.auth.getUser();
          const user = result.data.user;
          const isAdmin = user ? await resolveIsAdmin(user.id, user.email) : false;
          window.location.href = resolvePostAuthPath("/", isAdmin);
        })();
      }, 1000);
    } catch {
      toast.error("Une erreur inattendue est survenue.");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email manquant.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        toast.error("Impossible de renvoyer le code. Réessayez plus tard.");
      } else {
      toast.success("Nouveau code envoyé ! Vérifiez votre boîte mail.", { duration: 4000 });
      }
    } catch {
      toast.error("Erreur lors du renvoi.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#1a3a5c] overflow-hidden anim-slide-left">
        <Image
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
          alt="Vérification"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 h-full">
          <Link href="/" className="inline-flex items-center gap-2 w-fit anim-fade-up">
            <Image src="/logo-koitala.png" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-cover bg-white/10 backdrop-blur-sm" />
            <span className="text-2xl font-bold text-white">
              KOI<span className="text-[#e8b86d]">TALA</span>
            </span>
          </Link>
          <div className="space-y-6">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight anim-fade-up anim-delay-2">
              Vérifiez votre<br />adresse email
            </h2>
            <p className="text-white/70 mt-3 text-base leading-relaxed max-w-md anim-fade-up anim-delay-3">
              Nous avons envoyé un code de vérification à votre adresse email. Entrez-le pour activer votre compte.
            </p>
          </div>
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} KOITALA. Tous droits réservés.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 bg-[#fafbfc] anim-slide-right">
        <div className="w-full max-w-[460px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-between mb-8 anim-fade-up">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo-koitala.png" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-cover" />
              <span className="text-2xl font-bold text-[#1a3a5c]">
                KOI<span className="text-[#e8b86d]">TALA</span>
              </span>
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Accueil
            </Link>
          </div>

          <div className="mb-7 text-center">
            <div className="w-16 h-16 bg-[#1a3a5c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 anim-scale-in">
              <Mail className="w-8 h-8 text-[#1a3a5c]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1724] tracking-tight anim-fade-up anim-delay-1">
              Vérification email
            </h1>
            <p className="text-gray-500 mt-2 text-[15px] anim-fade-up anim-delay-2">
              Entrez le code à 8 chiffres envoyé à
            </p>
            {email && (
              <p className="text-[#1a3a5c] font-semibold text-[15px] mt-1 anim-fade-up anim-delay-2">
                {email}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/80 p-6 sm:p-8 anim-scale-in anim-delay-3">
            {/* Code inputs */}
            <div className="flex justify-center gap-2.5 sm:gap-3 mb-6" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 border-gray-200 bg-[#fafbfc] text-[#0f1724] focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 focus:border-[#1a3a5c] transition-all"
                  disabled={verifying}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={verifying || code.some((d) => d === "")}
              className="w-full py-3.5 bg-[#1a3a5c] text-white font-semibold text-[15px] rounded-xl hover:bg-[#0f2540] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {verifying && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Vérifier mon compte
            </button>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-400 mb-2">Vous n&apos;avez pas reçu le code ?</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3a5c] hover:text-[#0f2540] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                Renvoyer le code
              </button>
            </div>
          </div>

          <p className="text-center text-[15px] text-gray-500 mt-6">
            <Link href="/auth/login" className="text-[#1a3a5c] font-semibold hover:underline">
              Retour à la connexion
            </Link>
          </p>

          <p className="hidden lg:block text-center mt-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerificationForm />
    </Suspense>
  );
}
