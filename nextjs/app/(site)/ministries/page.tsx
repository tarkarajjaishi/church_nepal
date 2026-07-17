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
import { EditableBlock } from "@/components/site/EditableBlock";
import { useLang } from "@/lib/language";
import { useMinistries, useContentBlock } from "@/lib/hooks";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

const filterKeys = [
  { key: "all", ids: [] },
  { key: "children", ids: ["children", "youth"] },
  { key: "fellowship", ids: ["women", "men"] },
  { key: "worship", ids: ["worship", "media"] },
  { key: "outreach", ids: ["outreach", "mission"] },
  { key: "teaching", ids: ["prayer", "bibleschool"] },
];

const fallbackLabels = ["All", "Children & Youth", "Fellowship", "Worship & Media", "Outreach & Mission", "Prayer & Teaching"];

export default function Ministries() {
  const { lang } = useLang();
  const { data: ministries = [], isLoading, error, refetch } = useMinistries();
  const [active, setActive] = useState("all");
  const hero = useContentBlock('ministries_hero');
  const heading = useContentBlock('ministries_heading');
  const errorBlock = useContentBlock('ministries_error');
  const ctaBlock = useContentBlock('ministries_cta');

  const filterLabels = heading?.items?.[0]?.filters ?? fallbackLabels;

  const filters = useMemo(() => filterKeys.map((fk, i) => ({
    ...fk,
    label: filterLabels[i] ?? fallbackLabels[i] ?? fk.key,
  })), [filterLabels]);

  const shown = useMemo(() => {
    if (active === "all") return ministries;
    const ids = filters.find((f) => f.key === active)?.ids ?? [];
    return ministries.filter((m) => ids.includes(m.id));
  }, [active, ministries, filters]);

  const errorMessage = errorBlock?.title || "Failed to load ministries.";
  const ctaLabel = ctaBlock?.title || "Join Ministry";

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Our Ministries"}
          crumb={hero?.items?.[0]?.crumb || "Ministries"}
          image={hero?.image || ''}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <EditableBlock block={heading}>
            <SectionHeading
              eyebrow={heading?.items?.[0]?.eyebrow || "Get Involved"}
              title={heading?.title || "Find Your Place"}
            />
          </EditableBlock>

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
              <ErrorDisplay message={errorMessage} onRetry={() => refetch()} />
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
                    <Button asChild size="sm" className="mt-4 bg-church-blue hover:bg-church-blue/90"><Link href="/contact">{ctaLabel} <ArrowRight className="size-4" /></Link></Button>
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
