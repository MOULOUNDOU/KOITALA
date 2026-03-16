"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Download,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import ProfilePhotoField from "@/components/dashboard/ProfilePhotoField";
import SettingsToggleList, {
  type SettingsToggleOption,
} from "@/components/dashboard/SettingsToggleList";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  buildContactCard,
  buildUserMetadata,
  downloadFile,
  downloadJsonFile,
  isValidHttpUrl,
  normalizeUserMetadata,
  readAdminNotificationPreferences,
  type AdminNotificationPreferences,
} from "@/lib/accountSettings";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

const ADMIN_NOTIFICATION_OPTIONS: SettingsToggleOption[] = [
  {
    key: "visit_requests",
    label: "Nouvelles demandes de visite",
    description: "Suivre immédiatement l'arrivée de nouvelles demandes clients.",
  },
  {
    key: "contact_messages",
    label: "Messages entrants",
    description: "Être notifié lorsqu'un nouveau message ou contact arrive dans le CRM.",
  },
  {
    key: "listing_digest",
    label: "Résumé des annonces",
    description: "Recevoir un point de contrôle sur la diffusion et le suivi des annonces.",
  },
  {
    key: "weekly_digest",
    label: "Synthèse hebdomadaire",
    description: "Centraliser un récapitulatif des activités admin et des éléments à traiter.",
  },
];

export default function ParametresPage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [authMetadata, setAuthMetadata] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [notificationPreferences, setNotificationPreferences] =
    useState<AdminNotificationPreferences>(readAdminNotificationPreferences(undefined));
  const [password, setPassword] = useState({ new: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      const metadata = normalizeUserMetadata(user.user_metadata);
      const metadataName =
        typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
      const metadataAvatar =
        typeof metadata.avatar_url === "string" ? metadata.avatar_url.trim() : "";
      const emailFallback = user.email ?? "";

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (!mounted) return;

      setAuthMetadata(metadata);
      setNotificationPreferences(readAdminNotificationPreferences(metadata));
      setProfile({
        ...(data ?? {}),
        id: user.id,
        full_name: data?.full_name?.trim() || metadataName || emailFallback.split("@")[0] || "",
        email: data?.email ?? emailFallback,
        phone: data?.phone ?? "",
        avatar_url: data?.avatar_url?.trim() || metadataAvatar || "",
      });
      setLoading(false);
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const handleSaveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    const normalizedName = profile.full_name?.trim() ?? "";
    const normalizedPhone = profile.phone?.toString().trim() ?? "";
    const normalizedAvatar = profile.avatar_url?.toString().trim() ?? "";

    if (!normalizedName) {
      toast.error("Le nom complet est requis.");
      return;
    }

    if (!isValidHttpUrl(normalizedAvatar)) {
      toast.error("L'URL de l'avatar doit commencer par http:// ou https://");
      return;
    }

    setSaving(true);

    const payload = {
      id: user.id,
      email: user.email ?? profile.email ?? "",
      full_name: normalizedName,
      phone: normalizedPhone || null,
      avatar_url: normalizedAvatar || null,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (profileError) {
      setSaving(false);
      toast.error("Erreur lors de la mise à jour du profil.");
      return;
    }

    const nextMetadata = buildUserMetadata(authMetadata, {
      fullName: normalizedName,
      avatarUrl: normalizedAvatar || null,
    });

    const { error: authError } = await supabase.auth.updateUser({
      data: nextMetadata,
    });

    setSaving(false);

    if (authError) {
      toast.error("Profil enregistré, mais la session n'a pas pu être synchronisée.");
      return;
    }

    setAuthMetadata(nextMetadata);
    setProfile((prev) => ({
      ...prev,
      full_name: normalizedName,
      phone: normalizedPhone || null,
      email: payload.email,
      avatar_url: normalizedAvatar || null,
    }));

    window.dispatchEvent(
      new CustomEvent("koitala:profile-updated", {
        detail: {
          full_name: normalizedName,
          avatar_url: normalizedAvatar || null,
        },
      })
    );

    toast.success("Profil administrateur mis à jour.");
  };

  const handleSavePreferences = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    setSavingPreferences(true);

    const nextMetadata = buildUserMetadata(authMetadata, {
      adminNotificationPreferences: notificationPreferences,
    });

    const { error } = await supabase.auth.updateUser({ data: nextMetadata });

    setSavingPreferences(false);

    if (error) {
      toast.error("Impossible d'enregistrer les préférences administrateur.");
      return;
    }

    setAuthMetadata(nextMetadata);
    toast.success("Préférences administrateur enregistrées.");
  };

  const handleExportData = async () => {
    setExportingData(true);

    const [
      { count: totalProperties },
      { count: totalVisits },
      { count: totalMessages },
      { count: totalPosts },
      { count: totalUsers },
      { data: recentProperties },
      { data: recentVisits },
      { data: recentMessages },
    ] = await Promise.all([
      supabase.from("properties").select("*", { count: "exact", head: true }),
      supabase.from("visit_requests").select("*", { count: "exact", head: true }),
      supabase.from("contacts").select("*", { count: "exact", head: true }),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("properties")
        .select("id, title, status, city, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("visit_requests")
        .select("id, full_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("contacts")
        .select("id, full_name, subject, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      notification_preferences: notificationPreferences,
      summary: {
        properties: totalProperties ?? 0,
        visits: totalVisits ?? 0,
        messages: totalMessages ?? 0,
        blog_posts: totalPosts ?? 0,
        users: totalUsers ?? 0,
      },
      recent_activity: {
        properties: recentProperties ?? [],
        visits: recentVisits ?? [],
        messages: recentMessages ?? [],
      },
    };

    downloadJsonFile(
      `koitala-admin-${new Date().toISOString().slice(0, 10)}.json`,
      payload
    );
    setExportingData(false);
    toast.success("Snapshot admin téléchargé.");
  };

  const handleDownloadContactCard = () => {
    const fullName = profile.full_name?.trim() || "Admin KOITALA";
    const email = profile.email?.trim() || "";
    const phone = profile.phone?.toString().trim() || "";

    if (!email) {
      toast.error("Aucun email disponible pour générer la carte contact.");
      return;
    }

    setDownloadingCard(true);
    downloadFile(
      `koitala-admin-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "contact"}.vcf`,
      buildContactCard({ fullName, email, phone }),
      "text/vcard"
    );
    setDownloadingCard(false);
    toast.success("Carte contact téléchargée.");
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.new !== password.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.new.length < 6) {
      toast.error("Mot de passe trop court (6 caractères min.)");
      return;
    }

    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: password.new });
    setChangingPw(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Mot de passe mis à jour !");
    setPassword({ new: "", confirm: "" });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  const userName = profile.full_name?.trim() || "Administrateur";
  const activeNotifications = Object.values(notificationPreferences).filter(Boolean).length;
  const profileCompletion = [profile.full_name, profile.email, profile.phone, profile.avatar_url].filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <section className="rounded-[30px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
              CRM KOITALA
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0f1724] sm:text-3xl">
              Paramètres administrateur
            </h1>
            <p className="mt-1.5 text-sm text-gray-600">
              Gérez votre profil, vos préférences et vos exports depuis un seul écran.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: User, value: `${profileCompletion}/4`, label: "champs complétés" },
              { icon: Bell, value: activeNotifications, label: "notifications actives" },
              {
                icon: ShieldCheck,
                value: profile.created_at ? formatDate(profile.created_at) : "récent",
                label: "compte actif",
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#0f1724]"
              >
                <chip.icon className="h-3.5 w-3.5 text-[#1a3a5c]" />
                <span className="text-[#1a3a5c]">{chip.value}</span>
                <span>{chip.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: User,
            label: "Profil admin",
            value: userName,
            helper: profile.role === "admin" ? "Rôle confirmé" : "Rôle à vérifier",
            bgColor: "#1d4ed8",
          },
          {
            icon: Bell,
            label: "Préférences",
            value: `${activeNotifications} actives`,
            helper: "Alertes CRM",
            bgColor: "#047857",
          },
          {
            icon: Download,
            label: "Exports",
            value: "JSON + VCF",
            helper: "Snapshot et carte contact",
            bgColor: "#6b4226",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-transparent p-4 shadow-sm sm:p-5"
            style={{ backgroundColor: item.bgColor }}
          >
            <div
              className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {item.label}
            </p>
            <p className="font-display mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/90">{item.helper}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <User className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Informations personnelles</h2>
              <p className="text-xs text-gray-500">Profil utilisé comme administrateur KOITALA.</p>
            </div>
          </div>

          <div className="space-y-4">
            <ProfilePhotoField
              userId={profile.id}
              fullName={userName}
              avatarUrl={profile.avatar_url?.toString() ?? ""}
              onAvatarUrlChange={(nextUrl) => setProfile((prev) => ({ ...prev, avatar_url: nextUrl }))}
              previewTitle="Aperçu administrateur"
              previewDescription="Prenez une photo depuis votre appareil ou choisissez une image pour votre signature et votre compte admin."
            />

            <Input
              label="Nom complet"
              value={profile.full_name ?? ""}
              icon={<User className="h-4 w-4" />}
              onChange={(event) => setProfile((prev) => ({ ...prev, full_name: event.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email ?? ""}
              icon={<Mail className="h-4 w-4" />}
              disabled
            />
            <Input
              label="Téléphone"
              type="tel"
              value={profile.phone ?? ""}
              icon={<Phone className="h-4 w-4" />}
              onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <div className="flex justify-end">
              <Button loading={saving} onClick={handleSaveProfile}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <Lock className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Changer le mot de passe</h2>
              <p className="text-xs text-gray-500">Sécurisez l&apos;accès au back-office.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password.new}
                icon={<Lock className="h-4 w-4" />}
                onChange={(event) => setPassword((prev) => ({ ...prev, new: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw((prev) => !prev)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? "Masquer" : "Afficher"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              value={password.confirm}
              icon={<ShieldCheck className="h-4 w-4" />}
              onChange={(event) => setPassword((prev) => ({ ...prev, confirm: event.target.value }))}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={changingPw}>
                <Lock className="h-4 w-4" /> Modifier le mot de passe
              </Button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <Bell className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Préférences de notifications</h2>
              <p className="text-xs text-gray-500">
                Réglez les signaux CRM à suivre dans votre routine d&apos;administration.
              </p>
            </div>
          </div>

          <SettingsToggleList
            options={ADMIN_NOTIFICATION_OPTIONS}
            values={Object.fromEntries(Object.entries(notificationPreferences))}
            onToggle={(key) =>
              setNotificationPreferences((prev) => ({
                ...prev,
                [key]: !prev[key as keyof AdminNotificationPreferences],
              }))
            }
          />

          <div className="mt-5 flex justify-end">
            <Button loading={savingPreferences} onClick={handleSavePreferences}>
              <Bell className="h-4 w-4" /> Enregistrer les préférences
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <Download className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Actions administrateur</h2>
              <p className="text-xs text-gray-500">
                Récupérez un snapshot du CRM ou une carte contact prête à l&apos;usage.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleExportData()}
              disabled={exportingData}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-semibold text-[#0f1724]">
                  Exporter un snapshot admin
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Télécharge un JSON avec les volumes et l&apos;activité récente du CRM.
                </span>
              </span>
              <FileText className="h-4 w-4 shrink-0 text-[#1a3a5c]" />
            </button>

            <button
              type="button"
              onClick={handleDownloadContactCard}
              disabled={downloadingCard}
              className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-semibold text-[#0f1724]">
                  Télécharger la carte contact admin
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Génère un fichier `.vcf` pour votre signature ou vos échanges.
                </span>
              </span>
              <Phone className="h-4 w-4 shrink-0 text-[#1a3a5c]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
