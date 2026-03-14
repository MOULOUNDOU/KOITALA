"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ClientSidebar from "@/components/layout/ClientSidebar";
import MobileDashboardViewportLock from "@/components/layout/MobileDashboardViewportLock";

interface ProfileUpdatedEventDetail {
  full_name?: string;
}

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userName, setUserName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!mounted) return;
        setReady(false);
        router.push("/auth/login?redirectTo=/dashboard-client");
        return;
      }

      const metadataName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";
      const emailFallback = user.email?.split("@")[0] ?? "Client";

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      setUserName(profile?.full_name?.trim() || metadataName || emailFallback);
      setReady(true);
    };

    void syncUserName();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session?.user) {
        setUserName(null);
        setReady(false);
        router.push("/auth/login?redirectTo=/dashboard-client");
        return;
      }
      void syncUserName();
    });

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileUpdatedEventDetail>;
      const updatedName = customEvent.detail?.full_name?.trim();
      if (updatedName) {
        setUserName(updatedName);
      }
    };

    window.addEventListener("koitala:profile-updated", handleProfileUpdated as EventListener);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("koitala:profile-updated", handleProfileUpdated as EventListener);
    };
  }, [router, supabase]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
        <div className="w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dashboard-client-scope flex h-[100svh] md:h-screen bg-[#f4f6f9] overflow-hidden">
      <MobileDashboardViewportLock containerId="dashboard-client-scroll-root" />
      <ClientSidebar userName={userName} />
      <div
        id="dashboard-client-scroll-root"
        data-dashboard-scroll-root
        className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden pt-14 md:pt-0 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] [touch-action:pan-y]"
      >
        {children}
      </div>
    </div>
  );
}
