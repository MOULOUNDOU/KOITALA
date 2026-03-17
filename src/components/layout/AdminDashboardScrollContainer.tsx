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
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-14 md:pt-0 [-webkit-overflow-scrolling:touch] [overscroll-behavior-y:contain] [touch-action:pan-y]"
    >
      {children}
    </div>
  );
}
