'use client'

import { useMemo, useState } from "react";
import Link from 'next/link';
import { Clock, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { useMinistries } from "@/lib/hooks";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

const filters = [
  { key: "all", label: "All" },
  { key: "children", label: "Children & Youth", ids: ["children", "youth"] },
  { key: "fellowship", label: "Fellowship", ids: ["women", "men"] },
  { key: "worship", label: "Worship & Media", ids: ["worship", "media"] },
  { key: "outreach", label: "Outreach & Mission", ids: ["outreach", "mission"] },
  { key: "teaching", label: "Prayer & Teaching", ids: ["prayer", "bibleschool"] },
];

export default function Ministries() {
  const { lang } = useLang();
  const { data: ministries = [], isLoading, error, refetch } = useMinistries();
  const [active, setActive] = useState("all");

  const shown = useMemo(() => {
    if (active === "all") return ministries;
    const ids = filters.find((f) => f.key === active)?.ids ?? [];
    return ministries.filter((m) => ids.includes(m.id));
  }, [active, ministries]);

  return (
    <div>
      <PageHero title="Our Ministries" crumb="Ministries" image={images.band}
        subtitle="However God has gifted you, there is a place to serve, grow and belong." />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Get Involved" title="Find Your Place" />

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${active === f.key ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {isLoading ? (
              <CardSkeleton count={6} />
            ) : error ? (
              <ErrorDisplay message="Failed to load ministries." onRetry={() => refetch()} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.05}>
                <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0 flex flex-col">
                  <Link href={`/ministries/${m.id}`} className="relative h-44 overflow-hidden block">
                    <ImageWithFallback src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 grid place-items-center size-10 rounded-xl bg-white/90 text-church-blue"><Icon name={m.icon} className="size-5" /></span>
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <Link href={`/ministries/${m.id}`}>
                      <h3 className="text-church-blue hover:underline" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? m.name : m.nameNe}</h3>
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground flex-1">{m.description}</p>
                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><User className="size-4 text-gold" /> {m.leader}</div>
                      <div className="flex items-center gap-2"><Clock className="size-4 text-gold" /> {m.meeting}</div>
                    </div>
                    <Button asChild size="sm" className="mt-4 bg-church-blue hover:bg-church-blue/90"><Link href="/contact">Join Ministry <ArrowRight className="size-4" /></Link></Button>
                  </div>
                </Card>
              </Reveal>
            ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

