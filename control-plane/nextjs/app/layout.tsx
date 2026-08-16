import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import StructuredData from "@/components/landing/structured-data";
import { I18nProvider } from "@/components/i18n-hook";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://churchnepal.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ChurchNepal — Give every church its own website in seconds",
    template: "%s · ChurchNepal",
  },
  description:
    "ChurchNepal spins up a complete website for each church — its own subdomain, database, and storage. One platform, many churches, fully isolated.",
  keywords: [
    "church website", "church CMS", "multi-tenant", "Nepal", "church management",
    "subdomain", "SaaS", "eSewa", "Khalti",
  ],
  applicationName: "ChurchNepal",
  authors: [{ name: "ChurchNepal" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "ChurchNepal",
    title: "ChurchNepal — Give every church its own website in seconds",
    description:
      "Provision a complete, isolated website for any church in seconds — subdomain, database, storage, and an instant admin login.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChurchNepal — a website for every church",
    description:
      "One control panel, many fully-isolated church websites. Provision in under a minute.",
  },
  robots: { index: true, follow: true },
};

// Inline script to prevent flash of wrong theme on load
// Light-only on request. The toggle that let a visitor pick dark has been
// removed from the navbar, so anything still in localStorage from before would
// otherwise pin them to a theme they can no longer change.
const themeScript = `
  (function() {
    try {
      localStorage.removeItem('theme');
    } catch (e) {}
    document.documentElement.setAttribute('data-theme', 'light');
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <StructuredData />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToasterProvider />
            <I18nProvider>
              {children}
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
