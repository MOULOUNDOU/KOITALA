"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Shield, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();

        if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
          // Check if the user exists by trying to find the account
          const { data: signUpCheck } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: { data: { full_name: "" } },
          });

          // If identities array is empty, the user exists but password is wrong
          // If identities array has items, account was just created (doesn't exist yet)
          if (signUpCheck?.user?.identities && signUpCheck.user.identities.length > 0) {
            // Account didn't exist — clean up by informing user and redirecting to register
            toast.error("Aucun compte trouvé avec cet email. Redirection vers l'inscription...", { duration: 3000 });
            setTimeout(() => {
              router.push(`/auth/register?email=${encodeURIComponent(data.email)}`);
            }, 1500);
            return;
          }

          toast.error("Mot de passe incorrect. Vérifiez vos identifiants ou réinitialisez votre mot de passe.");
          return;
        }

        if (msg.includes("email not confirmed")) {
          toast.error("Votre email n'est pas encore confirmé. Redirection vers la vérification...", { duration: 3000 });
          setTimeout(() => {
            router.push(`/auth/verification?email=${encodeURIComponent(data.email)}`);
          }, 1500);
          return;
        }

        if (msg.includes("too many requests") || msg.includes("rate limit")) {
          toast.error("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.");
          return;
        }

        if (msg.includes("network") || msg.includes("fetch")) {
          toast.error("Erreur de connexion réseau. Vérifiez votre connexion internet.");
          return;
        }

        toast.error("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      toast.success("Connexion réussie !");

      // Redirect based on role if no specific redirectTo
      if (redirectTo === "/") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "admin") {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/dashboard-client";
          }
        } else {
          window.location.href = "/";
        }
      } else {
        window.location.href = redirectTo;
      }
    } catch {
      toast.error("Une erreur inattendue est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left: visual panel (hidden on mobile) ─── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#1a3a5c] overflow-hidden anim-slide-left">
        <Image
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80"
          alt="Villa moderne"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 h-full">
          <Link href="/" className="inline-flex items-center gap-2 w-fit anim-fade-up">
            <Image src="/logo-koitala.jpeg" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-contain bg-white/10 backdrop-blur-sm" />
            <span className="text-2xl font-bold text-white">
              KOI<span className="text-[#e8b86d]">TALA</span>
            </span>
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight anim-fade-up anim-delay-2">
                Bon retour<br />parmi nous
              </h2>
              <p className="text-white/70 mt-3 text-base leading-relaxed max-w-md anim-fade-up anim-delay-3">
                Connectez-vous pour accéder à vos favoris, alertes et suivre vos transactions.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: "Sécurisé", val: "100%" },
                { icon: Users, label: "Utilisateurs", val: "500+" },
                { icon: Star, label: "Avis", val: "4.9/5" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center">
                  <s.icon className="w-5 h-5 text-[#e8b86d] mx-auto mb-1.5" />
                  <p className="text-white font-bold text-sm">{s.val}</p>
                  <p className="text-white/50 text-[11px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© {new Date().getFullYear()} KOITALA. Tous droits réservés.</p>
        </div>
      </div>

      {/* ─── Right: form ─── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10 bg-[#fafbfc] anim-slide-right">
        <div className="w-full max-w-[460px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-between mb-8 anim-fade-up">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo-koitala.jpeg" alt="KOITALA" width={44} height={44} className="w-11 h-11 rounded-xl object-contain" />
              <span className="text-2xl font-bold text-[#1a3a5c]">
                KOI<span className="text-[#e8b86d]">TALA</span>
              </span>
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Accueil
            </Link>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1724] tracking-tight anim-fade-up anim-delay-1">Connexion</h1>
            <p className="text-gray-500 mt-1.5 text-[15px] anim-fade-up anim-delay-2">Accédez à votre espace personnel</p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/80 p-6 sm:p-8 anim-scale-in anim-delay-3">
            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-[#fafbfc] text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                  <Link href="/auth/mot-de-passe-oublie" className="text-xs text-[#1a3a5c] font-medium hover:underline">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-[#fafbfc] text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#1a3a5c] text-white font-semibold text-[15px] rounded-xl hover:bg-[#0f2540] active:scale-[.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Se connecter
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">ou continuer avec</span>
              </div>
            </div>

            {/* Social login */}
            <SocialAuthButtons redirectTo={redirectTo} mode="login" />
          </div>

          <p className="text-center text-[15px] text-gray-500 mt-6 anim-fade-up anim-delay-5">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="text-[#1a3a5c] font-semibold hover:underline">
              S&apos;inscrire
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

