"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

export default function ProfilPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user.email ?? "";

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const safeName = data?.full_name?.trim() || metadataName || emailFallback.split("@")[0] || "Client";

      setProfile({
        ...(data ?? {}),
        id: user.id,
        full_name: safeName,
        email: data?.email ?? emailFallback,
        phone: data?.phone ?? "",
      });
      setLoading(false);
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    const normalizedName = profile.full_name?.trim() ?? "";
    const normalizedPhone = profile.phone?.toString().trim() ?? "";

    if (!normalizedName) {
      toast.error("Le nom complet est requis.");
      return;
    }

    setSaving(true);

    const payload = {
      id: user.id,
      email: user.email ?? profile.email ?? "",
      full_name: normalizedName,
      phone: normalizedPhone || null,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (profileError) {
      setSaving(false);
      toast.error("Impossible d'enregistrer votre profil.");
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: normalizedName,
      },
    });

    setSaving(false);

    if (authError) {
      toast.error("Profil enregistré, mais le nom de session n'a pas pu être synchronisé.");
    } else {
      toast.success("Profil mis à jour avec succès.");
    }

    setProfile((prev) => ({
      ...prev,
      full_name: normalizedName,
      phone: normalizedPhone || null,
      email: payload.email,
    }));

    window.dispatchEvent(
      new CustomEvent("koitala:profile-updated", {
        detail: { full_name: normalizedName },
      })
    );
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.new !== password.confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.new.length < 6) {
      toast.error("Mot de passe trop court (6 caractères minimum).");
      return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: password.new });
    setChangingPw(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Mot de passe mis à jour.");
    setPassword({ new: "", confirm: "" });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userName = profile.full_name?.trim() || "Client";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <section className="rounded-3xl border border-[#1a3a5c]/30 bg-[#1a3a5c] shadow-sm">
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-[#1a3a5c]">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{userName}</h1>
            <p className="text-white/80 text-sm truncate mt-1">{profile.email ?? "Email non renseigné"}</p>
            <p className="text-white/60 text-xs mt-1">
              Membre depuis {profile.created_at ? formatDate(profile.created_at) : "récemment"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Informations personnelles</h2>
              <p className="text-xs text-gray-500">Ces données seront utilisées sur votre espace client.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nom complet"
              value={profile.full_name ?? ""}
              icon={<User className="w-4 h-4" />}
              onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
            />

            <Input
              label="Email"
              type="email"
              value={profile.email ?? ""}
              icon={<Mail className="w-4 h-4" />}
              disabled
            />

            <Input
              label="Téléphone"
              type="tel"
              value={profile.phone ?? ""}
              icon={<Phone className="w-4 h-4" />}
              placeholder="Ex: +221 77 000 00 00"
              onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
            />

            <div className="pt-2 flex justify-end">
              <Button loading={saving} onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> Enregistrer les modifications
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Sécurité du compte</h2>
              <p className="text-xs text-gray-500">Mettez à jour votre mot de passe à tout moment.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                value={password.new}
                onChange={(e) => setPassword((prev) => ({ ...prev, new: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw((prev) => !prev)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? "Masquer" : "Afficher"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<ShieldCheck className="w-4 h-4" />}
              value={password.confirm}
              onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={changingPw}>
                <Lock className="w-4 h-4" /> Modifier le mot de passe
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
