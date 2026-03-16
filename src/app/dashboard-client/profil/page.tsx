"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Download,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import ClientPageHero from "@/components/dashboard/ClientPageHero";
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
  readClientNotificationPreferences,
  type ClientNotificationPreferences,
} from "@/lib/accountSettings";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

const CLIENT_NOTIFICATION_OPTIONS: SettingsToggleOption[] = [
  {
    key: "visit_updates",
    label: "Mises à jour de visites",
    description: "Être notifié lorsque le statut d'une visite évolue ou qu'un rendez-vous est confirmé.",
  },
  {
    key: "message_updates",
    label: "Réponses de l'agence",
    description: "Recevoir des alertes sur les nouveaux échanges et réponses à vos demandes.",
  },
  {
    key: "property_recommendations",
    label: "Nouvelles annonces recommandées",
    description: "Être averti quand de nouveaux biens cohérents avec votre recherche sont disponibles.",
  },
  {
    key: "weekly_digest",
    label: "Résumé hebdomadaire",
    description: "Recevoir un récapitulatif de votre activité client et des actions à reprendre.",
  },
];

interface FavoriteExportRow {
  id: string;
  created_at: string;
  property: { id: string; title: string; slug: string; city: string; price: number }[] | null;
}

export default function ProfilPage() {
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
    useState<ClientNotificationPreferences>(readClientNotificationPreferences(undefined));
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

      const safeName =
        data?.full_name?.trim() || metadataName || emailFallback.split("@")[0] || "Client";

      setAuthMetadata(metadata);
      setNotificationPreferences(readClientNotificationPreferences(metadata));
      setProfile({
        ...(data ?? {}),
        id: user.id,
        full_name: safeName,
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
      toast.error("Impossible d'enregistrer votre profil.");
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

    toast.success("Profil mis à jour avec succès.");
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
      clientNotificationPreferences: notificationPreferences,
    });

    const { error } = await supabase.auth.updateUser({ data: nextMetadata });

    setSavingPreferences(false);

    if (error) {
      toast.error("Impossible d'enregistrer vos préférences.");
      return;
    }

    setAuthMetadata(nextMetadata);
    toast.success("Préférences enregistrées.");
  };

  const handleExportData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Session expirée. Reconnectez-vous.");
      return;
    }

    setExportingData(true);

    const [{ data: visits }, { data: messages }, { data: favorites }] = await Promise.all([
      supabase
        .from("visit_requests")
        .select("id, status, preferred_date, full_name, email, phone, message, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contacts")
        .select("id, subject, message, status, created_at, updated_at")
        .eq("email", user.email ?? "")
        .order("created_at", { ascending: false }),
      supabase
        .from("favorites")
        .select("id, created_at, property:properties(id, title, slug, city, price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      notification_preferences: notificationPreferences,
      visits: visits ?? [],
      messages: messages ?? [],
      favorites:
        (favorites as FavoriteExportRow[] | null)?.map((favorite) => ({
          id: favorite.id,
          created_at: favorite.created_at,
          property: favorite.property?.[0] ?? null,
        })) ?? [],
    };

    downloadJsonFile(
      `koitala-client-${new Date().toISOString().slice(0, 10)}.json`,
      payload
    );
    setExportingData(false);
    toast.success("Export JSON téléchargé.");
  };

  const handleDownloadContactCard = () => {
    const fullName = profile.full_name?.trim() || "Client KOITALA";
    const email = profile.email?.trim() || "";
    const phone = profile.phone?.toString().trim() || "";

    if (!email) {
      toast.error("Aucun email disponible pour générer la carte contact.");
      return;
    }

    setDownloadingCard(true);
    downloadFile(
      `koitala-contact-${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "client"}.vcf`,
      buildContactCard({ fullName, email, phone }),
      "text/vcard"
    );
    setDownloadingCard(false);
    toast.success("Carte contact téléchargée.");
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

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
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-transparent" />
      </div>
    );
  }

  const userName = profile.full_name?.trim() || "Client";
  const completedProfileFields = [profile.full_name, profile.email, profile.phone, profile.avatar_url].filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length;
  const profileCompletion = Math.round((completedProfileFields / 4) * 100);
  const membershipLabel = profile.created_at ? formatDate(profile.created_at) : "récemment";
  const activeNotifications = Object.values(notificationPreferences).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[1450px] space-y-6 p-4 pb-8 sm:p-6 sm:pb-10 lg:p-8">
      <ClientPageHero
        title={userName}
        description="Gérez vos coordonnées, vos préférences et les actions liées à votre compte client."
        chips={[
          { icon: User, value: `${profileCompletion}%`, label: "profil complété" },
          { icon: Bell, value: activeNotifications, label: "notifications actives" },
          { icon: ShieldCheck, value: membershipLabel, label: "membre depuis" },
        ]}
        actions={
          <>
            <Link
              href="/dashboard-client"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#1a3a5c] transition-colors hover:bg-gray-50 sm:text-sm"
            >
              Retour dashboard
            </Link>
            <Link
              href="/dashboard-client/visites"
              className="inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0f2540] sm:text-sm"
            >
              Voir mes visites
            </Link>
          </>
        }
      />

      <section className="grid grid-flow-col auto-cols-[minmax(240px,86%)] gap-4 overflow-x-auto pb-2 pr-1 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {[
          {
            icon: User,
            label: "Complétion profil",
            value: `${profileCompletion}%`,
            helper: "Nom, contact et avatar",
            bgColor: "#1d4ed8",
          },
          {
            icon: Bell,
            label: "Préférences actives",
            value: activeNotifications,
            helper: "Alertes personnelles",
            bgColor: "#047857",
          },
          {
            icon: Download,
            label: "Exports",
            value: "JSON + VCF",
            helper: "Données et carte contact",
            bgColor: "#6b4226",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="min-h-[184px] rounded-3xl border border-transparent p-4 shadow-sm sm:min-h-0 sm:p-5"
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

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <User className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Informations personnelles</h2>
              <p className="text-xs text-gray-500">
                Votre fiche de compte utilisée dans l&apos;espace client.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ProfilePhotoField
              userId={profile.id}
              fullName={userName}
              avatarUrl={profile.avatar_url?.toString() ?? ""}
              onAvatarUrlChange={(nextUrl) => setProfile((prev) => ({ ...prev, avatar_url: nextUrl }))}
              previewTitle="Aperçu du profil"
              previewDescription="Prenez une photo depuis votre appareil ou choisissez une image pour personnaliser votre compte KOITALA."
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
              placeholder="Ex: +221 77 000 00 00"
              onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
            />

            <div className="flex justify-end pt-2">
              <Button loading={saving} onClick={handleSaveProfile}>
                <Save className="h-4 w-4" /> Enregistrer les modifications
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
              <h2 className="font-semibold text-[#0f1724]">Sécurité du compte</h2>
              <p className="text-xs text-gray-500">
                Mettez à jour votre mot de passe à tout moment.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={password.new}
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
              icon={<ShieldCheck className="h-4 w-4" />}
              value={password.confirm}
              onChange={(event) => setPassword((prev) => ({ ...prev, confirm: event.target.value }))}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={changingPw}>
                <Lock className="h-4 w-4" /> Modifier le mot de passe
              </Button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
              <Bell className="h-5 w-5 text-[#1a3a5c]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0f1724]">Préférences de notifications</h2>
              <p className="text-xs text-gray-500">
                Choisissez les alertes qui comptent vraiment pour vous.
              </p>
            </div>
          </div>

          <SettingsToggleList
            options={CLIENT_NOTIFICATION_OPTIONS}
            values={Object.fromEntries(Object.entries(notificationPreferences))}
            onToggle={(key) =>
              setNotificationPreferences((prev) => ({
                ...prev,
                [key]: !prev[key as keyof ClientNotificationPreferences],
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
              <h2 className="font-semibold text-[#0f1724]">Actions du compte</h2>
              <p className="text-xs text-gray-500">
                Exportez vos données ou récupérez une carte contact exploitable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleExportData()}
              disabled={exportingData}
              className="flex h-full min-h-[116px] w-full flex-col items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] disabled:opacity-60 min-[430px]:min-h-[132px] sm:justify-between"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
                <Download className="h-4 w-4 shrink-0" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0f1724]">
                  Exporter mes données en JSON
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Télécharge visites, messages, favoris et informations de compte.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadContactCard}
              disabled={downloadingCard}
              className="flex h-full min-h-[116px] w-full flex-col items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc] disabled:opacity-60 min-[430px]:min-h-[132px] sm:justify-between"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a5c]/10 text-[#1a3a5c]">
                <Phone className="h-4 w-4 shrink-0" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0f1724]">
                  Télécharger ma carte contact
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Génère un fichier `.vcf` avec vos coordonnées principales.
                </span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
