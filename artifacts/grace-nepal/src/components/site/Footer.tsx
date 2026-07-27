import { useState } from 'react';
import { Link } from 'wouter';
import { toast } from "sonner";
import { Church, Facebook, Youtube, Instagram, Mail, MapPin, Phone, Send, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useLang } from "@/lib/language";
import { useContentBlock, useServiceTimes } from "@/lib/hooks";

const fallbackSocials = [
  { Icon: Facebook, label: "Facebook", url: "https://facebook.com/gracenepalchurch" },
  { Icon: Youtube, label: "YouTube", url: "https://youtube.com/@gracenepalchurch" },
  { Icon: Instagram, label: "Instagram", url: "https://instagram.com/gracenepalchurch" },
];

export function Footer() {
  const { t, lang } = useLang();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const footer = useContentBlock('footer');
  const brand = useContentBlock('site_brand');
  const socialBlock = useContentBlock('social_links');
  const { data: serviceTimes = [] } = useServiceTimes();

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
  const services = serviceTimes.slice(0, 3);

  return (
    <footer className="relative bg-church-blue text-white overflow-hidden" role="contentinfo" aria-label="Site footer">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="grid gap-16 lg:gap-12 xl:gap-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
          
          {/* Column 1: Brand & About (Span 4) */}
          <div className="lg:col-span-4 flex flex-col">
            <Link href="/" className="flex items-center gap-3.5 group inline-flex w-fit">
              <span className="grid place-items-center size-12 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 text-gold shadow-lg group-hover:scale-105 transition-transform duration-500">
                <Church className="size-6" />
              </span>
              <span className="text-2xl tracking-tight transition-colors" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                {churchName}
              </span>
            </Link>
            <p className="mt-6 text-[15px] leading-relaxed text-white/70 max-w-sm font-light">
              {churchDesc}
            </p>
            <div className="mt-8 flex gap-3">
              {socials.map(({ Icon, label, url }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" 
                   className="grid place-items-center size-10 rounded-full bg-white/5 border border-white/10 hover:bg-gold hover:border-gold hover:text-church-blue text-white/80 transition-all duration-300 hover:-translate-y-1 shadow-sm" 
                   aria-label={label}>
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <span className="w-4 h-px bg-gold rounded-full" />
              {quickLinksGroup?.group || "Quick Links"}
            </h4>
            <ul className="space-y-3.5">
              {(quickLinksGroup?.links || []).map((l: any, i: number) => (
                <li key={i}>
                  <Link href={l.href || '#'} className="text-[14px] text-white/70 hover:text-gold hover:translate-x-1 inline-flex items-center transition-all duration-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Ministries (Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
              <span className="w-4 h-px bg-gold rounded-full" />
              {ministryGroup?.group || "Ministries"}
            </h4>
            <ul className="space-y-3.5">
              {(ministryGroup?.links || []).map((l: any, i: number) => (
                <li key={i}>
                  <Link href={l.href || '/ministries'} className="text-[14px] text-white/70 hover:text-gold hover:translate-x-1 inline-flex items-center transition-all duration-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter & Contact (Span 4) */}
          <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-xl">
            <h4 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              {lang === "en" ? "Join our Newsletter" : "न्यूजलेटर"}
            </h4>
            <p className="text-sm text-white/60 mb-6 font-light">
              {lang === "en" ? "Get the latest updates, sermons, and news sent to your inbox." : "पछिल्लो जानकारी र प्रवचनहरू इमेलमा पाउनुहोस्।"}
            </p>
            
            <form
              className="flex gap-2 relative"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newsletterEmail || !newsletterEmail.includes('@')) return;
                setNewsletterLoading(true);
                try {
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/newsletter/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: newsletterEmail }),
                  });
                  if (res.ok) {
                    toast.success(lang === "en" ? "Subscribed! Check your email." : "सदस्यता लिनुभयो! इमेल जाँच गर्नुहोस्।");
                    setNewsletterEmail('');
                  } else {
                    toast.error(lang === "en" ? "Already subscribed or invalid email." : "पहिले नै सदस्यता लिइसकेको वा मान्य इमेल होइन।");
                  }
                } catch {
                  toast.error(lang === "en" ? "Network error. Please try again." : "नेटवर्क त्रुटि।");
                } finally {
                  setNewsletterLoading(false);
                }
              }}
            >
              <Input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={lang === "en" ? "Email address" : "इमेल ठेगाना"}
                aria-label={lang === "en" ? "Email for newsletter" : "न्यूजलेटरका लागि इमेल"}
                className="bg-white/10 border-transparent focus:border-gold/50 focus:bg-white/15 text-white placeholder:text-white/40 h-12 rounded-xl pl-5 pr-14 transition-all"
              />
              <Button type="submit" size="icon" disabled={newsletterLoading} className="absolute right-1.5 top-1.5 bottom-1.5 h-9 w-9 rounded-lg bg-gold hover:bg-[#c29215] text-church-blue shadow-md transition-colors" aria-label="Subscribe">
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              {(connectedGroup?.links || []).slice(0, 2).map((l: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                  <MapPin className="size-5 text-gold shrink-0 mt-0.5" />
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors leading-relaxed">
                    {l.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-white/50 font-light">
          <p>&copy; {new Date().getFullYear()} {churchName}. {lang === "en" ? "All rights reserved." : "सबै अधिकार सुरक्षित।"}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gold transition-colors">{t("privacy_policy")}</Link>
            <Link href="/terms" className="hover:text-gold transition-colors">{t("terms_of_service")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}