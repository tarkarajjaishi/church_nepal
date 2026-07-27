'use client'

import { Radio, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language";
import { useContentBlock } from "@/lib/hooks";

const DISMISS_KEY = "announcement_dismissed";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const { lang } = useLang();
  const banner = useContentBlock('announcement_bar');

  // Check localStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISS_KEY);
      if (saved !== "true") setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  };

  // Don't render if dismissed, disabled, or no content
  if (dismissed) return null;
  if (!banner || banner.enabled === false) return null;

  const text = banner.title || (lang === "en"
    ? "Sunday service live at 10:00 AM (NPT) — everyone is welcome!"
    : "आइतबार सेवा बिहान १०:०० बजे प्रत्यक्ष — सबैलाई स्वागत छ!");
  const link = banner.items?.[0]?.link || null;

  const content = (
    <span className="text-white/90 text-center">
      {link ? (
        <Link href={link} className="underline underline-offset-2 hover:text-white transition-colors">
          {text}
        </Link>
      ) : text}
    </span>
  );

  return (
    <div className="sticky top-0 z-[60] bg-primary text-primary-foreground shadow-sm" role="region" aria-label="Announcement">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3 text-sm relative">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
        </span>
        <Radio className="size-4 text-gold shrink-0" aria-hidden="true" />
        {content}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="absolute right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
