import Link from 'next/link';
import { ArrowRight } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { Icon } from "./Icon";
import { useLang } from "@/lib/language";
import { beliefs } from "@/lib/data";

export function WhatWeBelieve() {
  const { lang } = useLang();
  return (
    <section className="py-20 bg-section">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading
          eyebrow={lang === "en" ? "Our Faith" : "हाम्रो विश्वास"}
          title={lang === "en" ? "What We Believe" : "हामी के विश्वास गर्छौं"}
          subtitle={lang === "en"
            ? "No complicated words — just the heart of our faith, in plain language."
            : "जटिल शब्दहरू छैनन् — सरल भाषामा हाम्रो विश्वासको मर्म।"}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {beliefs.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.06}>
              <Card className="p-6 h-full border-border/60 hover:border-gold hover:shadow-xl transition-all duration-300">
                <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white">
                  <Icon name={b.icon} className="size-6" />
                </span>
                <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {lang === "en" ? b.title : b.titleNe}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {lang === "en" ? b.text : b.textNe}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
            <Link href="/about">{lang === "en" ? "Learn More About Us" : "हाम्रो बारे थप जान्नुहोस्"} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
