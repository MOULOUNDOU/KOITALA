import type { Metadata } from "next";
import type { Viewport } from "next";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import MobileDashboardViewportLock from "@/components/layout/MobileDashboardViewportLock";
import AdminDashboardScrollContainer from "@/components/layout/AdminDashboardScrollContainer";
import AdminAssistantHeaderButton from "@/components/ai/AdminAssistantHeaderButton";
import AIChatWidget from "@/components/ai/AIChatWidget";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100svh] md:h-screen overflow-hidden overscroll-none bg-[#f4f6f9]">
      <MobileDashboardViewportLock containerId="dashboard-admin-scroll-root" />
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 hidden shrink-0 border-b border-[#1a3a5c]/10 bg-[#f4f6f9]/95 px-6 py-3 backdrop-blur md:block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1a3a5c]/60">
                Dashboard Admin
              </p>
              <h1 className="text-base font-semibold text-[#1a3a5c]">Espace administration</h1>
            </div>
            <AdminAssistantHeaderButton />
          </div>
        </header>
        <AdminDashboardScrollContainer>
          {children}
        </AdminDashboardScrollContainer>
      </div>
      <AIChatWidget scope="dashboard" assistant="admin" />
    </div>
  );
}
