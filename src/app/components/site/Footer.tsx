import { Link } from "react-router";
import { toast } from "sonner";
import { Church, Facebook, Youtube, Instagram, Mail, MapPin, Phone, Send, MessageCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useLang } from "../../lib/language";

const socials = [
  { Icon: Facebook, label: "Facebook", url: "https://facebook.com/gracenepalchurch" },
  { Icon: Youtube, label: "YouTube", url: "https://youtube.com/@gracenepalchurch" },
  { Icon: Instagram, label: "Instagram", url: "https://instagram.com/gracenepalchurch" },
];

const quickLinks = [
  { to: "/about", key: "nav_about" },
  { to: "/sermons", key: "nav_sermons" },
  { to: "/events", key: "nav_events" },
  { to: "/gallery", key: "nav_gallery" },
  { to: "/give", key: "give" },
];

const ministryLinks = [
  { to: "/ministries/children", label: "Children Ministry" },
  { to: "/ministries/youth", label: "Youth Ministry" },
  { to: "/ministries/worship", label: "Worship Team" },
  { to: "/ministries/prayer", label: "Prayer Ministry" },
  { to: "/ministries/mission", label: "Mission Ministry" },
];

export function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="bg-church-blue text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <span className="grid place-items-center size-10 rounded-xl bg-white/10">
              <Church className="size-5 text-gold" />
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{t("churchName")}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            {lang === "en"
              ? "A Christ-centred community in Nepal, growing in faith, hope and love — reaching every village with the gospel."
              : "नेपालमा ख्रीष्ट-केन्द्रित समुदाय, विश्वास, आशा र प्रेममा बढ्दै — हरेक गाउँमा सुसमाचार पुर्‍याउँदै।"}
          </p>
          <div className="mt-5 flex gap-2">
            {socials.map(({ Icon, label, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid place-items-center size-9 rounded-full bg-white/10 hover:bg-gold hover:text-church-blue transition-colors"
                aria-label={label}
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((l) => (
              <li key={l.key}>
                <Link to={l.to} className="hover:text-gold transition-colors">{t(l.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>Ministries</h4>
          <ul className="space-y-2.5 text-sm">
            {ministryLinks.map((l, i) => (
              <li key={i}>
                <Link to={l.to} className="hover:text-gold transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>Stay Connected</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin className="size-4 text-gold mt-0.5 shrink-0" /> Baneshwor, Kathmandu 44600, Nepal</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-gold shrink-0" /> +977 1-4000000</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-gold shrink-0" /> hello@gracenepal.org</li>
            <li className="flex items-center gap-4 pt-1">
              <a href="https://wa.me/9771400000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"><MessageCircle className="size-4 text-gold" /> WhatsApp</a>
              <a href="viber://chat?number=%2B9771400000" className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"><MessageCircle className="size-4 text-gold" /> Viber</a>
            </li>
          </ul>
          <p className="mt-4 text-sm">{lang === "en" ? "Newsletter" : "न्यूजलेटर"}</p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success(lang === "en" ? "Subscribed! Thank you." : "सदस्यता लिनुभयो! धन्यवाद।");
              (e.target as HTMLFormElement).reset();
            }}
          >
            <Input type="email" required placeholder={lang === "en" ? "Your email" : "इमेल"} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" />
            <Button type="submit" size="icon" className="bg-gold text-church-blue hover:bg-gold/90 shrink-0"><Send className="size-4" /></Button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <span>© {new Date().getFullYear()} {t("churchName")}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-gold">{t("privacy_policy")}</Link>
            <Link to="/terms" className="hover:text-gold">{t("terms_of_service")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
