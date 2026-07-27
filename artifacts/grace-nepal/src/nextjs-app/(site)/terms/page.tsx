

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

const FALLBACK_TERMS_SECTIONS = [
  { title: 'Acceptance of Terms', content: 'By accessing or using the Grace Nepal Church website, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the site.' },
  { title: 'Use of the Website', content: 'This website is provided for informational and ministry purposes. You may not use it for any unlawful purpose or in a way that damages, disables, or impairs the site. Unauthorized access or misuse is strictly prohibited.' },
  { title: 'Intellectual Property', content: 'All content on this site — including text, images, sermons, music, and design — is the property of Grace Nepal Church or its respective creators. You may not reproduce, distribute, or use our content commercially without explicit written permission.' },
  { title: 'Donations', content: 'Donations made through this site are voluntary gifts to Grace Nepal Church. All donations are used for ministry activities as directed by church leadership. Donation records are kept confidential per our Privacy Policy.' },
  { title: 'Disclaimer of Warranties', content: 'This website is provided "as is" without warranties of any kind. Grace Nepal Church does not guarantee the accuracy, completeness, or timeliness of the information on this site.' },
  { title: 'Changes to Terms', content: 'We reserve the right to modify these Terms of Service at any time. Changes become effective when posted to this page. Continued use of the site after changes are posted constitutes your acceptance of the revised terms.' },
];

export default function Terms() {
  const { lang } = useLang();

  const hero = useContentBlock('terms_hero');
  const sectionsBlock = useContentBlock('terms_sections');
  const sections = sectionsBlock?.items?.length ? sectionsBlock.items : FALLBACK_TERMS_SECTIONS;

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
