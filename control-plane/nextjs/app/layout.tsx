import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChurchNepal — Master Control",
  description: "Provision and manage church websites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
