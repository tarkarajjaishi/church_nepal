'use client'

import { Target, Eye, Heart, Milestone, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { images, faqs } from "@/lib/data";
import { useLang } from "@/lib/language";

const timeline = [
  { year: "2008", title: "Humble Beginnings", text: "The church began as a small prayer group of seven families in a Kathmandu living room." },
  { year: "2012", title: "First Sanctuary", text: "God provided our first dedicated worship space as the congregation grew to over 100." },
  { year: "2017", title: "Mission Expansion", text: "We planted our first village fellowship and launched the Bible school." },
  { year: "2022", title: "A Growing Family", text: "Crossed 800 members with twelve thriving ministries serving the city and beyond." },
  { year: "2026", title: "Reaching Every Village", text: "Today we continue our vision to bring hope to every corner of Nepal." },
];

const values = [
  { icon: Heart, title: "Love", text: "We love God and love people as Christ loved us." },
  { icon: CheckCircle2, title: "Truth", text: "We are grounded in the authority of Scripture." },
  { icon: Target, title: "Mission", text: "We exist to make disciples across Nepal." },
  { icon: Eye, title: "Community", text: "We do life together as one family in Christ." },
];

export default function About() {
  const { lang } = useLang();
  return (
    <div>
      <PageHero title="About Our Church" crumb="About" image={images.crowd}
        subtitle="A Christ-centred family growing in faith, hope and love since 2008." />

      {/* History */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <ImageWithFallback src={images.study2} alt="Our church family" className="rounded-3xl w-full aspect-[4/3] object-cover shadow-xl" />
          </Reveal>
          <div>
            <SectionHeading center={false} eyebrow="Our Story" title="Church History"
              subtitle={lang === "en"
                ? "What began as a handful of families praying together has grown into a vibrant community of hundreds. Through every season, God has been faithful — and our story is still being written."
                : "मुट्ठीभर परिवारहरू सँगै प्रार्थना गर्ने कामबाट सुरु भएको यो अहिले सयौंको जीवन्त समुदायमा परिणत भएको छ।"} />
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="py-16 bg-section">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "Our Mission", text: "To make disciples of Jesus Christ who love God, love one another, and reach Nepal with the gospel." },
            { icon: Eye, title: "Our Vision", text: "A transformed nation where every village has a thriving community of believers." },
            { icon: Heart, title: "Our Values", text: "Faith, love, humility, generosity and unwavering hope in Christ alone." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <Card className="p-7 h-full border-border/60 hover:shadow-xl transition-all">
                <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white"><c.icon className="size-6" /></span>
                <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</h3>
                <p className="mt-2 text-muted-foreground">{c.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="What Drives Us" title="Core Values" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
                <Card className="p-6 text-center h-full border-border/60 hover:border-gold hover:shadow-xl transition-all">
                  <span className="mx-auto grid place-items-center size-12 rounded-full bg-gold-soft text-gold"><v.icon className="size-6" /></span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading eyebrow="Our Journey" title="Milestones" />
          <div className="mt-12 relative pl-8 sm:pl-0">
            <div className="absolute left-2 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
            {timeline.map((item, i) => (
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

      {/* Statement of faith + FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading eyebrow="Questions" title="Frequently Asked" />
          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="mt-10">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-church-blue">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

