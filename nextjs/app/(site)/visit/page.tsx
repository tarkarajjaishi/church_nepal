'use client'

import { toast } from "sonner";
import Link from 'next/link';
import { Clock, MapPin, Baby, Heart, Calendar, Car, MessageCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

const factIconMap: Record<string, any> = { Clock, MapPin, Baby };

export default function PlanVisit() {
  const { lang } = useLang();
  const hero = useContentBlock('visit_hero');
  const facts = useContentBlock('visit_facts');
  const steps = useContentBlock('visit_steps');
  const expect = useContentBlock('visit_expect');
  const cta = useContentBlock('visit_cta');

  const ctaData = cta?.items?.[0] || {};

  return (
    <div>
      {/* Hero */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Plan Your Visit"}
          crumb={hero?.items?.[0]?.crumb || (lang === "en" ? "I'm New" : "म नयाँ हुँ")}
          image={hero?.items?.[0]?.image || ''}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      {/* Quick facts */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(facts?.items || []).map((f: any, i: number) => {
            const FactIcon = factIconMap[f.icon] || Clock;
            return (
              <Reveal key={i} delay={i * 0.06}>
                <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                  <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white"><FactIcon className="size-6" /></span>
                  <div className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? f.label : (f.labelNe || f.label)}</div>
                  <div className="text-sm text-muted-foreground mt-1">{lang === "en" ? f.sub : (f.subNe || f.sub)}</div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow={lang === "en" ? "How It Works" : "कसरी काम गर्छ"}
            title={steps?.title || (lang === "en" ? "Your First Sunday, Step by Step" : "तपाईंको पहिलो आइतबार, चरण-चरणमा")}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(steps?.items || []).map((s: any, i: number) => (
              <Reveal key={i} delay={i * 0.08}>
                <Card className="p-6 h-full border-border/60 relative">
                  <span className="grid place-items-center size-11 rounded-full bg-gold text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{s.step}</span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? s.title : (s.titleNe || s.title)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lang === "en" ? s.text : (s.textNe || s.text)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What to expect grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow={lang === "en" ? "Good to Know" : "जान्न राम्रो"}
            title={expect?.title || (lang === "en" ? "What to Expect" : "के अपेक्षा गर्ने")}
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(expect?.items || []).map((x: any, i: number) => (
              <Reveal key={i} delay={i * 0.05}>
                <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                  <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold"><Icon name={x.icon} className="size-6" /></span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? x.title : (x.titleNe || x.title)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lang === "en" ? x.text : (x.textNe || x.text)}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Let us know + map */}
      <EditableBlock block={cta}>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-stretch">
            <Reveal>
              <Card className="p-7 border-border/60 h-full bg-church-blue text-white">
                <Heart className="size-8 text-gold" />
                <h3 className="mt-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {lang === "en" ? (cta?.title || "Let us know you're coming") : (cta?.title || "तपाईं आउँदै हुनुहुन्छ भनी हामीलाई बताउनुहोस्")}
                </h3>
                <p className="mt-2 text-white/80 text-sm">
                  {lang === "en" ? (cta?.subtitle || "") : (cta?.subtitle || "")}
                </p>
                <form
                  className="mt-6 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success(lang === "en" ? (ctaData.successMessage || "Thank you! We look forward to meeting you.") : (ctaData.successMessageNe || ctaData.successMessage || "धन्यवाद! हामी तपाईंलाई भेट्न उत्सुक छौं।"));
                    (e.target as HTMLFormElement).reset();
                  }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="vn" className="text-white/90">{lang === "en" ? (ctaData.nameLabel || "Name") : (ctaData.nameLabelNe || ctaData.nameLabel || "नाम")}</Label><Input id="vn" required placeholder={lang === "en" ? (ctaData.namePlaceholder || "Your name") : (ctaData.namePlaceholderNe || ctaData.namePlaceholder || "तपाईंको नाम")} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" /></div>
                    <div className="space-y-2"><Label htmlFor="vp" className="text-white/90">{lang === "en" ? (ctaData.phoneLabel || "Phone / Viber") : (ctaData.phoneLabelNe || ctaData.phoneLabel || "फोन / भाइबर")}</Label><Input id="vp" required placeholder="+977 ..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50" /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="vd" className="text-white/90">{lang === "en" ? (ctaData.dateLabel || "Which Sunday?") : (ctaData.dateLabelNe || ctaData.dateLabel || "कुन आइतबार?")}</Label><Input id="vd" type="date" className="bg-white/10 border-white/20 text-white [color-scheme:dark]" /></div>
                  <Button type="submit" size="lg" className="bg-gold text-church-blue hover:bg-gold/90"><Calendar className="size-4" /> {lang === "en" ? (ctaData.submitLabel || "I'm Planning to Visit") : (ctaData.submitLabelNe || ctaData.submitLabel || "म भ्रमण गर्ने योजनामा छु")}</Button>
                </form>
                <a href={ctaData.whatsappUrl || "https://wa.me/9771400000"} className="mt-4 inline-flex items-center gap-2 text-gold hover:underline"><MessageCircle className="size-4" /> {lang === "en" ? (ctaData.whatsappLabel || "Or message us on WhatsApp / Viber") : (ctaData.whatsappLabelNe || ctaData.whatsappLabel || "वा WhatsApp / Viber मा सन्देश पठाउनुहोस्")}</a>
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="h-full flex flex-col gap-6">
                <Card className="overflow-hidden border-border/60 flex-1 min-h-[280px]">
                  <iframe
                    title="Church location"
                    className="w-full h-full min-h-[280px]"
                    src={ctaData.mapUrl || "https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335"}
                    loading="lazy"
                  />
                </Card>
                <Card className="p-6 border-border/60 flex items-center gap-4">
                  <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold shrink-0"><Car className="size-6" /></span>
                  <div>
                    <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? (ctaData.directionsTitle || "Getting here") : (ctaData.directionsTitleNe || ctaData.directionsTitle || "यहाँ आउने बाटो")}</div>
                    <p className="text-sm text-muted-foreground mt-1">{lang === "en" ? (ctaData.directionsText || "Free on-site parking. A 5-minute walk from Baneshwor Chowk bus stop.") : (ctaData.directionsTextNe || ctaData.directionsText || "निःशुल्क पार्किङ। बानेश्वर चोक बस स्टपबाट ५ मिनेट पैदल।")}</p>
                  </div>
                </Card>
              </div>
            </Reveal>
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
              <Link href="/contact">{lang === "en" ? (ctaData.contactLabel || "Still have questions? Contact us") : (ctaData.contactLabelNe || ctaData.contactLabel || "अझै प्रश्न छ? सम्पर्क गर्नुहोस्")} <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </section>
      </EditableBlock>
    </div>
  );
}
