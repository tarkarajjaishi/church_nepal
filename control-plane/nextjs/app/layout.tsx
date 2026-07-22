import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import StructuredData from "@/components/landing/structured-data";

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
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Default to dark, only override if user explicitly set theme
      var resolvedTheme = theme || 'dark';
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <StructuredData />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToasterProvider />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
