import type { Viewport } from "next";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import MobileDashboardViewportLock from "@/components/layout/MobileDashboardViewportLock";

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
    <div className="flex h-[100svh] md:h-screen bg-[#f4f6f9] overflow-hidden">
      <MobileDashboardViewportLock containerId="dashboard-admin-scroll-root" />
      <DashboardSidebar />
      <div
        id="dashboard-admin-scroll-root"
        data-dashboard-scroll-root
        className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto overflow-x-hidden pt-14 md:pt-0 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] [touch-action:pan-y]"
      >
        {children}
      </div>
    </div>
  );
}
