import type { Metadata } from "next";
import AIChatWidget from "@/components/ai/AIChatWidget";

export const metadata: Metadata = {
  title: "Assistant IA Admin",
  description:
    "Assistant IA admin KOITALA pour piloter les annonces, qualifier les prospects et accelerer les actions.",
};

export default function DashboardAdminAssistantPage() {
  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top,_#33445f_0%,_#20293a_48%,_#141a26_100%)] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <AIChatWidget scope="dashboard" assistant="admin" mode="page" />
      </div>
    </section>
  );
}
