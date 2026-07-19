import type { Metadata } from "next";
import "./globals.css";
import { ToasterProvider } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "ChurchNepal — Master Control",
  description: "Provision and manage church websites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ToasterProvider />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
