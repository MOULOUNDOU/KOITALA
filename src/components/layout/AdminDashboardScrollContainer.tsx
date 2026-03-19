"use client";

interface AdminDashboardScrollContainerProps {
  children: React.ReactNode;
}

export default function AdminDashboardScrollContainer({
  children,
}: AdminDashboardScrollContainerProps) {
  return (
    <div
      id="dashboard-admin-scroll-root"
      data-dashboard-scroll-root
      className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-[calc(env(safe-area-inset-bottom)+3rem)] md:pt-0 md:pb-0 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] [touch-action:pan-y]"
    >
      {children}
    </div>
  );
}
