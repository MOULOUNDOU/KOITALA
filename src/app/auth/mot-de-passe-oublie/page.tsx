"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#e8b86d]" />
            </div>
            <span className="text-2xl font-bold text-[#1a3a5c]">
              KOI<span className="text-[#e8b86d]">TALA</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0f1724] mt-6 mb-1">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="font-semibold text-[#0f1724] mb-2">Email envoyé !</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Consultez votre boîte mail et cliquez sur le lien de réinitialisation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Envoyer le lien
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-[#1a3a5c] font-medium hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
