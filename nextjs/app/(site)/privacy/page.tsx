'use client'

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

export default function Privacy() {
  const { lang } = useLang();

  const hero = useContentBlock('privacy_hero');
  const sectionsBlock = useContentBlock('privacy_sections');
  const sections = sectionsBlock?.items || [];

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
