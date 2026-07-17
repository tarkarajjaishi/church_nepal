'use client'

import { Target, Eye, Heart, Milestone, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useLang } from "@/lib/language";
import { useContentBlock } from "@/lib/hooks";

const iconMap: Record<string, any> = { Target, Eye, Heart, CheckCircle2, Milestone };

export default function About() {
  const { lang } = useLang();
  const hero = useContentBlock('about_hero');
  const history = useContentBlock('about_history');
  const mission = useContentBlock('about_mission');
  const values = useContentBlock('about_values');
  const faq = useContentBlock('about_faq');

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero title={hero?.title || "About Our Church"} crumb="About" image={hero?.items?.[0]?.image || ''}
          subtitle={hero?.subtitle || ""} />
      </EditableBlock>

      {/* History */}
      {history && (
      <EditableBlock block={history}>
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <ImageWithFallback src={history.items?.[0]?.image || ''} alt="Our church family" className="rounded-3xl w-full aspect-[4/3] object-cover shadow-xl" />
            </Reveal>
            <div>
              <SectionHeading center={false} eyebrow={history.items?.[0]?.eyebrow || "Our Story"} title={history.title || "Church History"} subtitle={history.subtitle || ""} />
            </div>
          </div>
        </section>
      </EditableBlock>
      )}

      {/* Mission / Vision */}
      {mission && (
      <EditableBlock block={mission}>
        <section className="py-16 bg-section">
          <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-6">
            {(mission.items || []).map((c: any, i: number) => {
              const Icon = iconMap[c.icon] || Target;
              return (
                <Reveal key={c.title} delay={i * 0.08}>
                  <Card className="p-7 h-full border-border/60 hover:shadow-xl transition-all">
                    <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white"><Icon className="size-6" /></span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</h3>
                    <p className="mt-2 text-muted-foreground">{c.desc}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </section>
      </EditableBlock>
      )}

      {/* Core Values */}
      {values && (
      <EditableBlock block={values}>
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHeading eyebrow={values.items?.[0]?.eyebrow || "What Drives Us"} title={values.title || "Core Values"} />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(values.items || []).map((v: any, i: number) => {
                const Icon = iconMap[v.icon] || Heart;
                return (
                  <Reveal key={v.title} delay={i * 0.06}>
                    <Card className="p-6 text-center h-full border-border/60 hover:border-gold hover:shadow-xl transition-all">
                      <span className="mx-auto grid place-items-center size-12 rounded-full bg-gold-soft text-gold"><Icon className="size-6" /></span>
                      <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{v.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      </EditableBlock>
      )}

      {/* Timeline */}
      {history && history.items?.[0]?.timeline && (
      <EditableBlock block={history}>
        <section className="py-20 bg-section">
          <div className="mx-auto max-w-4xl px-4">
            <SectionHeading eyebrow="Our Journey" title="Milestones" />
            <div className="mt-12 relative pl-8 sm:pl-0">
              <div className="absolute left-2 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
              {history.items[0].timeline.map((item: any, i: number) => (
                <Reveal key={item.year} delay={i * 0.05}>
                  <div className={`relative mb-10 sm:w-1/2 ${i % 2 ? "sm:ml-auto sm:pl-10" : "sm:pr-10 sm:text-right"}`}>
                    <span className={`absolute top-1 size-4 rounded-full bg-gold ring-4 ring-section ${i % 2 ? "-left-[1.6rem] sm:-left-2" : "-left-[1.6rem] sm:-right-2 sm:left-auto"}`} />
                    <Milestone className="size-4 text-gold inline-block mb-1" />
                    <div className="text-gold" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{item.year}</div>
                    <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </EditableBlock>
      )}

      {/* FAQ */}
      {faq && (
      <EditableBlock block={faq}>
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4">
            <SectionHeading eyebrow={faq.items?.[0]?.eyebrow || "Questions"} title={faq.title || "Frequently Asked"} />
            <Reveal delay={0.1}>
              <Accordion type="single" collapsible className="mt-10">
                {(faq.items || []).map((f: any, i: number) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-church-blue">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>
      </EditableBlock>
      )}
    </div>
  );
}
