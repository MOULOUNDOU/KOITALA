"use client";

import { useEffect, useState } from "react";
import { User, Save, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

export default function ProfilPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user.email ?? "";

      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        const safeName = data?.full_name?.trim() || metadataName || emailFallback.split("@")[0] || "";
        setProfile({
          ...(data ?? {}),
          full_name: safeName,
          email: data?.email ?? emailFallback,
        });
        setLoading(false);
      });
    });
  }, [supabase]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Erreur lors de la mise à jour"); return; }
    toast.success("Profil mis à jour !");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (password.new.length < 6) { toast.error("Mot de passe trop court (6 caractères min.)"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: password.new });
    setChangingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe mis à jour !");
    setPassword({ new: "", confirm: "" });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0f1724]">Mon profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-[#1a3a5c]" />
          </div>
          <h2 className="font-semibold text-[#0f1724]">Informations personnelles</h2>
        </div>
        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={profile.full_name ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
          />
          <Input label="Email" type="email" value={profile.email ?? ""} disabled />
          <Input
            label="Téléphone"
            type="tel"
            value={profile.phone ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button loading={saving} onClick={handleSaveProfile}>
              <Save className="w-4 h-4" /> Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#1a3a5c]/10 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#1a3a5c]" />
          </div>
          <h2 className="font-semibold text-[#0f1724]">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password.new}
              onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={password.confirm}
            onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={changingPw}>
              <Lock className="w-4 h-4" /> Modifier le mot de passe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
