import DashboardSidebar from "@/components/layout/DashboardSidebar";
import PageTransition from "@/components/layout/PageTransition";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 overflow-auto pt-14 md:pt-0">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
