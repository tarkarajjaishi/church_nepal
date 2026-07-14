'use client'

import Link from 'next/link';
import { toast } from "sonner";
import { Church, Facebook, Youtube, Instagram, Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useLang } from "@/lib/language";
import { useContentBlock, useContentBlocks } from "@/lib/hooks";

const fallbackSocials = [
  { Icon: Facebook, label: "Facebook", url: "https://facebook.com/gracenepalchurch" },
  { Icon: Youtube, label: "YouTube", url: "https://youtube.com/@gracenepalchurch" },
  { Icon: Instagram, label: "Instagram", url: "https://instagram.com/gracenepalchurch" },
];

export function Footer() {
  const { t, lang } = useLang();
  const footer = useContentBlock('footer');
  const brand = useContentBlock('site_brand');
  const socialBlock = useContentBlock('social_links');

  const iconMap: Record<string, any> = { Facebook, Youtube, Instagram, Mail, MessageCircle, Phone, MapPin };
  const socialItems = (socialBlock?.items || []) as any[];
  const socials = socialItems.length > 0
    ? socialItems.map((s: any) => ({ Icon: iconMap[s.icon] || Facebook, label: s.label, url: s.url }))
    : fallbackSocials;

  const groups = (footer?.items || []) as any[];
  const churchName = brand?.title || footer?.title || t("churchName");
  const churchDesc = footer?.subtitle || brand?.subtitle || (lang === "en"
    ? "A Christ-centred community in Nepal, growing in faith, hope and love — reaching every village with the gospel."
    : "नेपालमा ख्रीष्ट-केन्द्रित समुदाय, विश्वास, आशा र प्रेममा बढ्दै — हरेक गाउँमा सुसमाचार पुर्‍याउँदै।");

  const quickLinksGroup = groups.find((g: any) => g.group === "Quick Links");
  const ministryGroup = groups.find((g: any) => g.group === "Ministries");
  const connectedGroup = groups.find((g: any) => g.group === "Stay Connected");

  return (
    <footer className="bg-church-blue text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Brand + Social */}
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <span className="grid place-items-center size-10 rounded-xl bg-white/10">
              <Church className="size-5 text-gold" />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{churchName}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{churchDesc}</p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ Icon, label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="grid place-items-center size-9 rounded-full bg-white/10 hover:bg-gold hover:text-church-blue transition-colors" aria-label={label}>
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>{quickLinksGroup?.group || "Quick Links"}</h4>
          <ul className="space-y-2.5 text-sm">
            {(quickLinksGroup?.links || []).map((l: any, i: number) => (
              <li key={i}>
                <Link href={l.href || '#'} className="hover:text-gold transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Ministries */}
        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>{ministryGroup?.group || "Ministries"}</h4>
          <ul className="space-y-2.5 text-sm">
            {(ministryGroup?.links || []).map((l: any, i: number) => (
              <li key={i}>
                <Link href={l.href || '/ministries'} className="hover:text-gold transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Stay Connected */}
        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>{connectedGroup?.group || "Stay Connected"}</h4>
          <ul className="space-y-3 text-sm">
            {(connectedGroup?.links || []).map((l: any, i: number) => (
              <li key={i} className="flex items-center gap-2">
                {l.href?.startsWith('tel:') || l.href?.startsWith('mailto:') || l.href?.startsWith('http') || l.href?.startsWith('viber:') ? (
                  <a href={l.href} target={l.href?.startsWith('http') ? '_blank' : undefined} rel={l.href?.startsWith('http') ? 'noopener noreferrer' : undefined} className="hover:text-gold transition-colors">{l.label}</a>
                ) : (
                  <span className="flex items-center gap-2"><MapPin className="size-4 text-gold mt-0.5 shrink-0" /> {l.label}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">{lang === "en" ? "Newsletter" : "न्यूजलेटर"}</p>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); toast.success(lang === "en" ? "Subscribed! Thank you." : "सदस्यता लिनुभयो! धन्यवाद।"); (e.target as HTMLFormElement).reset(); }}>
            <Input type="email" required placeholder={lang === "en" ? "Your email" : "इमेल"} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
            <Button type="submit" size="icon" className="bg-gold text-church-blue hover:bg-gold/90 shrink-0"><Send className="size-4" /></Button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <span>© {new Date().getFullYear()} {churchName}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">{t("privacy_policy")}</Link>
            <Link href="/terms" className="hover:text-gold">{t("terms_of_service")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
