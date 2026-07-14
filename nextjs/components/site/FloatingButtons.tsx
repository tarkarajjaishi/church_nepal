'use client'

import Link from 'next/link';
import { MessageCircle, Phone, HandHeart } from "lucide-react";
import { useContentBlock } from "@/lib/hooks";

export function FloatingButtons() {
  const fb = useContentBlock('floating_buttons');
  const items = fb?.items?.[0] || {};

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col gap-3">
      <Link href="/prayer"
        className="group grid place-items-center size-12 rounded-full bg-gold text-church-blue shadow-lg hover:scale-105 transition-transform"
        aria-label={items.prayer_label || "Request prayer"}
        title={items.prayer_label || "Request Prayer"}
      >
        <HandHeart className="size-5" />
      </Link>
      {items.whatsapp && (
      <a
        href={items.whatsapp}
        className="grid place-items-center size-12 rounded-full bg-success text-white shadow-lg hover:scale-105 transition-transform"
        aria-label={items.whatsapp_label || "WhatsApp"}
        title={items.whatsapp_label || "WhatsApp"}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="size-5" />
      </a>
      )}
      {items.phone && (
      <a
        href={items.phone}
        className="grid place-items-center size-12 rounded-full bg-church-blue text-white shadow-lg hover:scale-105 transition-transform"
        aria-label={items.call_label || "Call us"}
        title={items.call_label || "Call"}
      >
        <Phone className="size-5" />
      </a>
      )}
    </div>
  );
}
