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
    // Leads with what people search for — "Church Nepal" and churches in Nepal
    // — rather than with the product pitch. The old title described the SaaS to
    // someone who already knew it existed.
    default: "Church Nepal | Churches, Christian Community & Resources in Nepal",
    template: "%s · Church Nepal",
  },
  description:
    "Church Nepal is a platform to discover churches, Christian communities, worship services, events, Bible studies, prayer meetings and Christian resources across Nepal.",
  // A short, honest set. Search engines ignore this tag entirely; it is kept
  // brief on purpose because a hundred keywords here would only be a signal to
  // a human reviewer that the page is stuffed.
  keywords: [
    "Church Nepal", "churches in Nepal", "church directory Nepal",
    "find a church Nepal", "Christian church Nepal", "Nepali church",
    "Sunday worship Nepal", "Bible study Nepal", "Christian community Nepal",
  ],
  applicationName: "Church Nepal",
  authors: [{ name: "ChurchNepal" }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Church Nepal",
    locale: "en_US",
    alternateLocale: ["ne_NP"],
    title: "Church Nepal | Churches, Christian Community & Resources in Nepal",
    description:
      "Discover churches, Christian communities, worship services, events, Bible studies and prayer meetings across Nepal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Church Nepal | Churches & Christian Community in Nepal",
    description:
      "Find churches in Nepal — service times, worship, Bible study, prayer meetings and events.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
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
