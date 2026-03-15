import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-motion-scope min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="min-h-screen overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
