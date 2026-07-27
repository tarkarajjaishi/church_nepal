import { Radio, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from 'wouter';
import { useLang } from "@/lib/language";
import { useContentBlock } from "@/lib/hooks";

const DISMISS_KEY = "announcement_dismissed";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true);
  const { lang } = useLang();
  const banner = useContentBlock('announcement_bar');

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
    try { localStorage.setItem(DISMISS_KEY, "true"); } catch {}
  };

  if (dismissed) return null;
  if (!banner || banner.enabled === false) return null;

  const text = banner.title || (lang === "en"
    ? "Sunday service at 10:00 AM (NPT) — everyone is welcome!"
    : "आइतबार सेवा बिहान १०:०० बजे — सबैलाई स्वागत छ!");
  const link = banner.items?.[0]?.link || null;

  return (
    <div className="sticky top-0 z-[60] bg-primary text-primary-foreground" role="region" aria-label="Announcement">
      <div className="mx-auto max-w-7xl px-10 h-9 flex items-center justify-center gap-2 text-[13px] relative overflow-hidden">
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
        </span>
        <Radio className="size-3.5 text-gold shrink-0 hidden sm:block" aria-hidden="true" />
        {/* Text — truncated on mobile, full on sm+ */}
        <span className="text-white/90 truncate min-w-0">
          {link ? (
            <Link href={link} className="underline underline-offset-2 hover:text-white transition-colors">
              {text}
            </Link>
          ) : text}
        </span>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
