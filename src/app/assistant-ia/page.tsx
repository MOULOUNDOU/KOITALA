import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AIChatWidget from "@/components/ai/AIChatWidget";

export const metadata: Metadata = {
  title: "Assistant IA",
  description:
    "Discutez avec l assistant immobilier KOITALA pour trouver un bien, poser vos questions et qualifier votre projet.",
  alternates: {
    canonical: "/assistant-ia",
  },
};

export default function AssistantIAPage() {
  return (
    <>
      <Navbar />
      <section className="min-h-screen bg-[radial-gradient(circle_at_top,_#33445f_0%,_#20293a_48%,_#141a26_100%)] pt-24 pb-10">
        <div className="mx-auto w-full max-w-[1200px] px-3 sm:px-6">
          <AIChatWidget scope="public" mode="page" />
        </div>
      </section>
      <Footer />
    </>
  );
}
