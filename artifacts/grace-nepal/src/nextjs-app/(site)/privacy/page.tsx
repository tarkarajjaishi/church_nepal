

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

const FALLBACK_PRIVACY_SECTIONS = [
  { title: 'Information We Collect', content: 'We collect only the information you voluntarily provide — such as your name and contact details when you fill out a form, register for an event, or make a donation. We do not sell or share your personal information with third parties.' },
  { title: 'How We Use Your Information', content: 'We use your information solely to communicate with you about church events, sermons, and ministry opportunities; to process donations; and to improve our services. We may send you newsletters or updates, from which you can unsubscribe at any time.' },
  { title: 'Data Security', content: 'We take reasonable measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. All sensitive data is transmitted via secure, encrypted connections.' },
  { title: 'Cookies', content: 'Our website may use cookies to enhance your browsing experience. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. However, some features may not function properly without cookies.' },
  { title: 'Children\'s Privacy', content: 'We do not knowingly collect personal information from children under 13 without parental consent. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.' },
  { title: 'Contact Us', content: 'If you have any questions about this Privacy Policy or our data practices, please contact us at info@gracenepal.org or by visiting our church office in Baneshwor, Kathmandu.' },
];

export default function Privacy() {
  const { lang } = useLang();

  const hero = useContentBlock('privacy_hero');
  const sectionsBlock = useContentBlock('privacy_sections');
  const sections = sectionsBlock?.items?.length ? sectionsBlock.items : FALLBACK_PRIVACY_SECTIONS;

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={lang === "en" ? (hero?.title || "Privacy Policy") : "गोपनीयता नीति"}
          crumb={hero?.items?.[0]?.crumb || "Privacy Policy"}
          image={hero?.image || ''}
          subtitle={lang === "en" ? (hero?.subtitle || "How we handle your information") : "हामी तपाईंको जानकारी कसरी व्यवहार गर्छौं"}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <p className="text-muted-foreground mb-8">
              {hero?.body || (lang === "en"
                ? "Last updated: July 2026. This Privacy Policy describes how Grace Nepal Church collects, uses, and protects your personal information."
                : "अन्तिम अपडेट: जुलाई २०२६। यस गोपनीयता नीतिले अनुग्रह नेपाल मण्डलीले तपाईंको व्यक्तिगत जानकारी कसरी सङ्कलन, प्रयोग र सुरक्षा गर्छ भनेर वर्णन गर्छ।")}
            </p>
          </Reveal>

          <EditableBlock block={sectionsBlock}>
            <div className="space-y-6">
              {sections.map((s: any, i: number) => (
                <Reveal key={i} delay={i * 0.05}>
                  <Card className="p-6 border-border/60">
                    <h2 className="text-lg text-church-blue mb-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      {lang === "en" ? s.title : (s.title_ne || s.title)}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {lang === "en" ? s.content : (s.content_ne || s.content)}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </EditableBlock>
        </div>
      </section>
    </div>
  );
}
