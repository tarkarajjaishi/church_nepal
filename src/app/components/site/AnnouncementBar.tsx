import { Radio, X } from "lucide-react";
import { useState } from "react";
import { useLang } from "../../lib/language";

export function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  const { lang } = useLang();
  if (!open) return null;
  return (
    <div className="bg-church-blue text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3 text-sm relative">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
        </span>
        <Radio className="size-4 text-gold" />
        <span className="text-white/90 text-center">
          {lang === "en"
            ? "Sunday service live at 10:00 AM (NPT) — everyone is welcome!"
            : "आइतबार सेवा बिहान १०:०० बजे प्रत्यक्ष — सबैलाई स्वागत छ!"}
        </span>
        <button
          onClick={() => setOpen(false)}
          aria-label="Dismiss announcement"
          className="absolute right-4 text-white/70 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
