'use client'

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

export default function Terms() {
  const { lang } = useLang();

  const hero = useContentBlock('terms_hero');
  const sectionsBlock = useContentBlock('terms_sections');
  const sections = sectionsBlock?.items || [];

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={lang === "en" ? (hero?.title || "Terms of Service") : "सेवा सर्तहरू"}
          crumb={hero?.items?.[0]?.crumb || "Terms of Service"}
          image={hero?.image || ''}
          subtitle={lang === "en" ? (hero?.subtitle || "Guidelines for using our website") : "हाम्रो वेबसाइट प्रयोगका लागि मार्गदर्शन"}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <p className="text-muted-foreground mb-8">
              {hero?.body || (lang === "en"
                ? "Last updated: July 2026. These Terms of Service govern your use of the Grace Nepal Church website."
                : "अन्तिम अपडेट: जुलाई २०२६। यी सेवा सर्तहरूले तपाईंले अनुग्रह नेपाल मण्डलीको वेबसाइट कसरी प्रयोग गर्नुहुन्छ भन्ने नियमन गर्छन्।")}
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
