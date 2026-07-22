import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ScrollProgress from "@/components/landing/scroll-progress";
import BackToTop from "@/components/landing/back-to-top";
import CookieConsent from "@/components/landing/cookie-consent";
import DemoModal from "@/components/landing/demo-modal";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Floating "Book a demo" trigger (bottom-left, clear of Back-to-Top) */}
      <div className="fixed bottom-6 left-6 z-40">
        <DemoModal />
      </div>
      <BackToTop />
      <CookieConsent />
    </div>
  );
}