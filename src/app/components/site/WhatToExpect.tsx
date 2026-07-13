import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { Icon } from "./Icon";
import { useLang } from "../../lib/language";
import { whatToExpect } from "../../lib/data";

export function WhatToExpect() {
  const { lang, t } = useLang();
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow={lang === "en" ? "First Time Here?" : "पहिलो पटक?"}
          title={lang === "en" ? "What to Expect" : "के अपेक्षा गर्ने"}
          subtitle={lang === "en"
            ? "Thinking about visiting? Here are answers to the questions most people have before their first Sunday."
            : "आउने सोच्दै हुनुहुन्छ? पहिलो आइतबार अघि धेरैका प्रश्नहरूको जवाफ यहाँ छ।"}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whatToExpect.map((x, i) => (
            <Reveal key={x.id} delay={i * 0.06}>
              <Card className="p-6 h-full border-border/60 hover:border-gold hover:shadow-xl transition-all duration-300">
                <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold">
                  <Icon name={x.icon} className="size-6" />
                </span>
                <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {lang === "en" ? x.title : x.titleNe}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {lang === "en" ? x.text : x.textNe}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-church-blue hover:bg-church-blue/90">
            <Link to="/visit">{lang === "en" ? "Plan Your Visit" : "आफ्नो भ्रमण योजना बनाउनुहोस्"} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
