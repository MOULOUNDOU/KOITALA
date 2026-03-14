"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, User, Lock, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

export default function ParametresPage() {
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

      setProfile({
        ...(data ?? {}),
        id: user.id,
        full_name: data?.full_name?.trim() || metadataName || emailFallback.split("@")[0] || "",
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
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    const normalizedName = profile.full_name?.trim() ?? "";
    const normalizedPhone = profile.phone?.toString().trim() ?? "";

    if (!normalizedName) {
      setSaving(false);
      toast.error("Le nom complet est requis.");
      return;
    }

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
      toast.error("Erreur lors de la mise à jour du profil.");
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
      return;
    }

    setProfile((prev) => ({
      ...prev,
      full_name: normalizedName,
      phone: normalizedPhone || null,
      email: payload.email,
    }));
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
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#0f1724]">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez votre profil administrateur</p>
      </div>

      {/* Profile */}
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
          <Input
            label="Email"
            type="email"
            value={profile.email ?? ""}
            className="bg-[#1a3a5c] text-white disabled:bg-[#1a3a5c] disabled:text-white disabled:opacity-100"
            disabled
          />
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

      {/* Password */}
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
              placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
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
            placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
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
