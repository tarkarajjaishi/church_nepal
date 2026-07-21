import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "ChurchNepal — Master Control",
  description: "Provision and manage church websites",
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
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
