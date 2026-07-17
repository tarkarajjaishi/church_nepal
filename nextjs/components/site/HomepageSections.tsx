'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from "motion/react";
import {
  Play, Calendar, Clock, MapPin, ArrowRight, Quote, Star, Share2, HandHeart, ChevronRight, Mail, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Countdown } from "@/components/site/Countdown";
import { Icon } from "@/components/site/Icon";
import { useLang } from "@/lib/language";
import { toBS } from "@/lib/nepaliDate";
import { images } from "@/lib/data";
import {
  useEnabledServiceTimes, useEnabledSermons, useEnabledMinistries, useEnabledEvents,
  useEnabledTestimonies, useEnabledGallery, useEnabledCampaigns, useEnabledVerses,
  useContentBlocks, ContentBlock,
} from "@/lib/hooks";
import { EditableBlock } from "@/components/site/EditableBlock";
import { ItemEdit } from "@/components/site/ItemEdit";

// Default order when no sort_order has been set in the DB.
// Keys match content_blocks.sectionKey values.
const DEFAULT_SECTION_ORDER: Record<string, number> = {
  hero: 0,
  service_times_section: 1,
  what_to_expect: 2,
  welcome: 3,
  what_we_believe: 4,
  watch_online: 5,
  featured_sermons: 6,
  ministries_section: 7,
  events_section: 8,
  prayer_cta: 9,
  notice_board: 10,
  testimonies_section: 11,
  church_members: 12,
  gallery_section: 13,
  verse_section: 14,
  donation_section: 15,
  newsletter: 16,
};

const ALL_SECTION_KEYS = Object.keys(DEFAULT_SECTION_ORDER);

// Layout variant section orderings — each rearranges the same sections
// to create a distinct homepage feel per theme preset.
const LAYOUT_ORDERS: Record<string, string[]> = {
  // Default: unchanged classic ordering
  default: [
    'hero', 'service_times_section', 'what_to_expect', 'welcome',
    'what_we_believe', 'watch_online', 'featured_sermons',
    'ministries_section', 'events_section', 'prayer_cta',
    'notice_board', 'testimonies_section', 'church_members',
    'gallery_section', 'verse_section', 'donation_section', 'newsletter',
  ],
  // Magazine: masonry-style, lead with content
  magazine: [
    'hero', 'featured_sermons', 'events_section', 'ministries_section',
    'service_times_section', 'welcome', 'what_we_believe',
    'watch_online', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members',
    'gallery_section', 'verse_section', 'donation_section', 'newsletter',
  ],
  // Minimal Hero: spacious, editorial
  'minimal-hero': [
    'hero', 'verse_section', 'welcome', 'ministries_section',
    'donation_section', 'newsletter', 'service_times_section',
    'what_we_believe', 'events_section', 'watch_online',
    'featured_sermons', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members', 'gallery_section',
  ],
  // Full Width: full-bleed, edge-to-edge
  'full-width': [
    'hero', 'ministries_section', 'events_section', 'service_times_section',
    'welcome', 'what_we_believe', 'featured_sermons',
    'watch_online', 'prayer_cta', 'gallery_section',
    'testimonies_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'newsletter',
  ],
  // Split: alternating sections
  split: [
    'hero', 'service_times_section', 'welcome', 'what_we_believe',
    'featured_sermons', 'events_section', 'ministries_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'newsletter',
  ],
  // Centered: narrow, editorial feel
  centered: [
    'hero', 'welcome', 'verse_section', 'what_we_believe',
    'featured_sermons', 'ministries_section', 'events_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'service_times_section', 'donation_section', 'newsletter',
  ],
};

// Spacing/background overrides per layout variant.
// Each entry maps a section key to Tailwind classes applied to the wrapper.
const LAYOUT_STYLE_OVERRIDES: Record<string, Record<string, string>> = {
  default: {},
  // Magazine: tighter spacing, compact grid feel
  magazine: {
    service_times_section: 'py-12',
    what_to_expect: 'py-12',
    what_we_believe: 'py-12',
    featured_sermons: 'py-12',
    events_section: 'py-12',
    ministries_section: 'py-12',
    testimonies_section: 'py-12',
    notice_board: 'py-12',
    church_members: 'py-12',
    gallery_section: 'py-12',
    verse_section: 'py-14',
    donation_section: 'py-12',
    newsletter: 'py-14',
  },
  // Minimal Hero: generous whitespace, larger typography
  'minimal-hero': {
    service_times_section: 'py-28',
    what_we_believe: 'py-28',
    featured_sermons: 'py-28',
    events_section: 'py-28',
    ministries_section: 'py-28',
    testimonies_section: 'py-28',
    notice_board: 'py-28',
    church_members: 'py-28',
    gallery_section: 'py-28',
    verse_section: 'py-32',
    donation_section: 'py-32',
    newsletter: 'py-32',
    welcome: 'py-28',
    watch_online: 'py-28',
    prayer_cta: 'py-32',
    what_to_expect: 'py-28',
  },
  // Full Width: full-bleed images, edge-to-edge
  'full-width': {
    service_times_section: 'py-16',
    what_to_expect: 'py-14',
    what_we_believe: 'py-16',
    featured_sermons: 'py-16',
    events_section: 'py-16',
    ministries_section: 'py-16',
    testimonies_section: 'py-16',
    gallery_section: 'py-16',
    verse_section: 'py-20',
    donation_section: 'py-16',
    newsletter: 'py-20',
  },
  // Split: alternating background colors
  split: {
    service_times_section: 'py-20 bg-section',
    what_we_believe: 'py-20',
    featured_sermons: 'py-20 bg-section',
    events_section: 'py-20',
    ministries_section: 'py-20 bg-section',
    testimonies_section: 'py-20',
    notice_board: 'py-20 bg-section',
    church_members: 'py-20',
    gallery_section: 'py-20 bg-section',
    verse_section: 'py-24',
    donation_section: 'py-20 bg-section',
    newsletter: 'py-24',
    watch_online: 'py-20 bg-section',
  },
  // Centered: generous spacing for editorial feel
  centered: {
    service_times_section: 'py-24',
    what_we_believe: 'py-24',
    featured_sermons: 'py-24',
    events_section: 'py-24',
    ministries_section: 'py-24',
    testimonies_section: 'py-24',
    notice_board: 'py-24',
    church_members: 'py-24',
    gallery_section: 'py-24',
    verse_section: 'py-28',
    donation_section: 'py-28',
    newsletter: 'py-28',
    welcome: 'py-24',
    watch_online: 'py-24',
    prayer_cta: 'py-28',
    what_to_expect: 'py-24',
  },
};

function useHomepageLayout() {
  const [layout, setLayout] = useState<string>('');

  useEffect(() => {
    const read = () => {
      const val = document.documentElement.getAttribute('data-homepage-layout') || '';
      setLayout(val);
    };
    read();
    // Re-read when the attribute changes (e.g. after ThemeCustomizer saves)
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-homepage-layout'],
    });
    return () => observer.disconnect();
  }, []);

  return layout;
}

/* ------------------------------------------------------------------ */
/*  Tiny helpers carried over from the original page.tsx               */
/* ------------------------------------------------------------------ */

function Eyebrow({ block, fallback }: { block: ContentBlock | null | undefined; fallback: string }) {
  return block?.items?.[0]?.eyebrow || fallback;
}

/* ------------------------------------------------------------------ */
/*  Individual section components (extracted from original page.tsx)   */
/*  Each receives only the data it needs. All JSX is preserved.        */
/* ------------------------------------------------------------------ */

function HeroSection({ hero, serviceTimes, nextEvent, lang, t }: {
  hero: ContentBlock | null;
  serviceTimes: any[];
  nextEvent: any;
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={hero}>
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback src={hero?.image || images.hero} alt={hero?.title || "Church"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-hero-br" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl">
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-5">{hero?.items?.[0]?.eyebrow || t("tagline")}</Badge>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, lineHeight: 1.05 }}>{hero?.title || t("hero_welcome")}</h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">{hero?.subtitle || t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {(hero?.items?.[0]?.ctaButtons?.length ? hero.items[0].ctaButtons : [
                { label: t("hero_watch"), link: "/sermons" },
                { label: t("hero_pray"), link: "/prayer" },
              ]).map((cta: { label: string; link: string }, i: number) => (
                <Button key={i} asChild size="lg" className={i === 0 ? "bg-gold text-church-blue hover:bg-gold/90" : "text-white hover:bg-white/10 hover:text-white"} variant={i === 0 ? "default" : "ghost"}>
                  <Link href={cta.link}>
                    {i === 0 ? <Play className="size-4" /> : <HandHeart className="size-4" />}
                    {cta.label}
                  </Link>
                </Button>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-14 max-w-md">
            <Card className="p-5 bg-white/95 backdrop-blur border-0 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{hero?.items?.[0]?.serviceCardLabel || (lang === "en" ? "Next Service" : "अर्को सेवा")}</span>
                <Badge className="bg-success/10 text-success border-0">{hero?.items?.[0]?.serviceCardBadge || "Live Soon"}</Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center size-11 rounded-xl bg-church-blue text-white"><Icon name="Church" className="size-5" /></span>
                <div>
                  <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{serviceTimes[0]?.name || hero?.items?.[0]?.serviceCardFallbackName || "Sunday Worship"}</div>
                  <div className="text-sm text-muted-foreground">{serviceTimes[0]?.day || hero?.items?.[0]?.serviceCardFallbackDay || "Sunday"} · {serviceTimes[0]?.time || hero?.items?.[0]?.serviceCardFallbackTime || "10:00 AM"} · {hero?.items?.[0]?.serviceCardFallbackLocation || "Kathmandu"}</div>
                </div>
              </div>
              <Countdown date={nextEvent.date} />
            </Card>
          </motion.div>
        </div>
      </section>
    </EditableBlock>
  );
}

function ServiceTimesSection({ block, serviceTimes, lang, t }: {
  block: ContentBlock | null;
  serviceTimes: any[];
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/service-times" adminLabel="service times">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Join Us" />} title={block?.title || t("service_times")} subtitle={block?.subtitle || ""} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTimes.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <ItemEdit href={`/admin/service-times?edit=${s.id}`}>
                  <Card className="group p-6 h-full border-border/60 hover:border-gold hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <span className="grid place-items-center size-12 rounded-xl bg-secondary text-church-blue group-hover:bg-gold group-hover:text-church-blue transition-colors"><Icon name={s.icon} className="size-6" /></span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? s.name : s.nameNe}</h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="size-4 text-gold" /> {s.day}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 text-gold" /> {s.time}</div>
                  </Card>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function WhatToExpectSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block}>
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="First Time Here?" />} title={block?.title || "What to Expect"} subtitle={block?.subtitle || ""} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(block?.items || []).map((item: any, i: number) => (
              <Reveal key={i} delay={i * 0.05}>
                <Card className="p-6 h-full border-border/60 hover:shadow-lg transition-all">
                  <h3 className="text-church-blue font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{item.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function WelcomeSection({ block, t }: { block: ContentBlock | null; t: (k: string) => string }) {
  return (
    <EditableBlock block={block}>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <ImageWithFallback src={block?.image || images.pastor} alt="Senior Pastor" loading="lazy" className="rounded-3xl w-full aspect-[4/5] object-cover shadow-xl" />
              <Card className="absolute -bottom-6 -right-2 sm:right-6 p-4 max-w-[220px] shadow-xl border-0">
                <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Ps. Bishal Rai</div>
                <div className="text-sm text-muted-foreground">Senior Pastor</div>
              </Card>
            </div>
          </Reveal>
          <div>
            <SectionHeading center={false} eyebrow={<Eyebrow block={block} fallback="Welcome" />} title={block?.title || t("welcome_title")} subtitle={block?.subtitle || ""} />
            <Reveal delay={0.1}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(block?.items || []).map((st: any, i: number) => (
                  <div key={i} className="text-center rounded-2xl bg-section p-4">
                    <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem" }}>{st.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{st.label}</div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-8 bg-church-blue hover:bg-church-blue/90"><Link href="/about">{t("read_more")} <ArrowRight className="size-4" /></Link></Button>
            </Reveal>
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function WhatWeBelieveSection({ block, t }: { block: ContentBlock | null; t: (k: string) => string }) {
  return (
    <EditableBlock block={block}>
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Our Faith" />} title={block?.title || "What We Believe"} subtitle={block?.subtitle || ""} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(block?.items || []).map((item: any, i: number) => (
              <Reveal key={i} delay={i * 0.05}>
                <Card className="p-6 h-full border-border/60 hover:shadow-lg transition-all">
                  <span className="grid place-items-center size-10 rounded-xl bg-church-blue/10 text-church-blue mb-3"><Icon name={block?.icon || "BookOpen"} className="size-5" /></span>
                  <h3 className="text-church-blue font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center"><Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white"><Link href="/about">{t("learn_more")} <ArrowRight className="size-4" /></Link></Button></div>
        </div>
      </section>
    </EditableBlock>
  );
}

function WatchOnlineSection({ block, lang }: { block: ContentBlock | null; lang: string }) {
  return (
    <EditableBlock block={block}>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Live Stream" />} title={block?.title || "Watch Online"} subtitle={block?.subtitle || ""} />
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              {(block?.items?.[0]?.ctaButtons?.length ? block.items[0].ctaButtons : [
                { label: lang === "en" ? "Watch Live" : "लाइभ हेर्नुहोस्", link: "/sermons", style: "primary" },
                { label: lang === "en" ? "All Sermons" : "सबै प्रचारहरू", link: "/sermons", style: "outline" },
              ]).map((cta: { label: string; link: string; style?: string }, i: number) => (
                <Button key={i} asChild size="lg" className={cta.style === 'outline' ? "border-church-blue text-church-blue hover:bg-church-blue hover:text-white" : "bg-red-600 hover:bg-red-700 text-white"} variant={cta.style === 'outline' ? "outline" : "default"}>
                  <Link href={cta.link}>
                    {i === 0 ? <Play className="size-5" /> : null}
                    {cta.label}
                    {i !== 0 ? <ArrowRight className="size-4" /> : null}
                  </Link>
                </Button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function FeaturedSermonsSection({ block, featuredSermons, t }: {
  block: ContentBlock | null;
  featuredSermons: any[];
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/sermons" adminLabel="sermons">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeading center={false} eyebrow={<Eyebrow block={block} fallback="Watch & Listen" />} title={block?.title || t("featured_sermons")} />
            <Button asChild variant="ghost" className="text-church-blue hover:text-gold hidden sm:inline-flex"><Link href="/sermons">{t("view_all")} <ChevronRight className="size-4" /></Link></Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredSermons.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <ItemEdit href={`/admin/sermons?edit=${s.id}`}>
                  <Link href={`/sermons/${s.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                      <div className="relative aspect-video overflow-hidden">
                        <ImageWithFallback src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                          <span className="grid place-items-center size-14 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform"><Play className="size-6 fill-church-blue" /></span>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{s.series}</Badge>
                        <span className="absolute bottom-3 right-3 text-xs bg-church-blue/90 text-white px-2 py-1 rounded-md">{s.duration}</span>
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">{s.speaker} · {s.date}</div>
                        <h3 className="mt-2 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-gold text-sm font-medium">{t("watch_now")} <ArrowRight className="size-4" /></span>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function MinistriesSection({ block, featuredMinistries, lang, t }: {
  block: ContentBlock | null;
  featuredMinistries: any[];
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/ministries" adminLabel="ministries">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Get Involved" />} title={block?.title || t("our_ministries")} subtitle={block?.subtitle || ""} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredMinistries.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.06}>
                <ItemEdit href={`/admin/ministries?edit=${m.id}`}>
                  <Link href={`/ministries/${m.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-3 left-3 grid place-items-center size-10 rounded-xl bg-white/90 text-church-blue"><Icon name={m.icon} className="size-5" /></span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? m.name : m.nameNe}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-gold text-sm font-medium">{t("learn_more")} <ArrowRight className="size-4" /></span>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center"><Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white"><Link href="/ministries">{t("view_all")} <ArrowRight className="size-4" /></Link></Button></div>
        </div>
      </section>
    </EditableBlock>
  );
}

function EventsSection({ block, allEvents, lang, t }: {
  block: ContentBlock | null;
  allEvents: any[];
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/events" adminLabel="events">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Mark Your Calendar" />} title={block?.title || t("upcoming_events")} />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {allEvents.slice(0, 2).map((e, i) => (
              <Reveal key={e.id} delay={i * 0.08}>
                <ItemEdit href={`/admin/events?edit=${e.id}`}>
                  <Link href={`/events/${e.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all sm:flex gap-0">
                      <div className="relative sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                        <ImageWithFallback src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 bg-white rounded-lg px-3 py-1.5 text-center shadow">
                          <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{(e.displayDate || "").split(" ")[1]?.replace(",", "") ?? ""}</div>
                          <div className="text-[10px] uppercase text-gold">{(e.displayDate || "").split(" ")[0]}</div>
                        </div>
                      </div>
                      <div className="p-5 sm:w-3/5">
                        <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{e.title}</h3>
                        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><Clock className="size-4 text-gold" /> {(e.displayDate || "")} · {e.time}</div>
                          <div className="flex items-center gap-2"><Calendar className="size-4 text-gold" /> {toBS(e.date, lang as "en" | "ne")}</div>
                          <div className="flex items-center gap-2"><MapPin className="size-4 text-gold" /> {e.location}</div>
                        </div>
                        <div className="mt-4"><Countdown date={e.date} /></div>
                        <span className="mt-4 inline-flex items-center gap-1 text-gold text-sm font-medium">{t("register")} <ArrowRight className="size-4" /></span>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function PrayerCtaSection({ block, t }: { block: ContentBlock | null; t: (k: string) => string }) {
  return (
    <EditableBlock block={block}>
      <section className="relative py-24">
        <div className="absolute inset-0">
          <ImageWithFallback src={block?.image || images.worship3} alt="Prayer" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-church-blue/85" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <SectionHeading light eyebrow={<Eyebrow block={block} fallback="We're Here For You" />} title={block?.title || t("need_prayer")} subtitle={block?.subtitle || t("need_prayer_sub")} />
          <Reveal delay={0.1}><Button asChild size="lg" className="mt-8 bg-gold text-church-blue hover:bg-gold/90"><Link href="/prayer"><HandHeart className="size-5" /> {t("nav_prayer")}</Link></Button></Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function NoticeBoardSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block} adminHref="/admin/notices" adminLabel="notices">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Notice Board" />} title={block?.title || "Church Notices"} subtitle={block?.subtitle || ""} />
          <div className="mt-8 text-center"><Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white"><Link href="/events">{block?.items?.[0]?.view_all || "View All Events"} <ArrowRight className="size-4" /></Link></Button></div>
        </div>
      </section>
    </EditableBlock>
  );
}

function TestimoniesSection({ block, allTestimonies }: {
  block: ContentBlock | null;
  allTestimonies: any[];
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/testimonies" adminLabel="testimonies">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Stories of Grace" />} title={block?.title || "Testimonies"} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {allTestimonies.map((tst, i) => (
              <Reveal key={tst.id} delay={i * 0.08}>
                <ItemEdit href={`/admin/testimonies?edit=${tst.id}`}>
                  <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                    <Quote className="size-8 text-gold/40" />
                    <p className="mt-3 text-foreground/80 leading-relaxed">"{tst.quote}"</p>
                    <div className="mt-4 flex gap-0.5">{Array.from({ length: tst.rating }).map((_, k) => <Star key={k} className="size-4 fill-gold text-gold" />)}</div>
                    <div className="mt-4 flex items-center gap-3">
                      <ImageWithFallback src={tst.image} alt={tst.name} loading="lazy" className="size-11 rounded-full object-cover" />
                      <div>
                        <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{tst.name}</div>
                        <div className="text-xs text-muted-foreground">{tst.role}</div>
                      </div>
                    </div>
                  </Card>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function ChurchMembersSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block} adminHref="/admin/members" adminLabel="members">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Our Family" />} title={block?.title || "Church Members"} subtitle={block?.subtitle || ""} />
          <div className="mt-10 text-center">
            <p className="text-muted-foreground max-w-xl mx-auto">{block?.items?.[0]?.join_desc || ""}</p>
            <div className="mt-6 flex gap-4 justify-center">
              <Button asChild className="bg-church-blue hover:bg-church-blue/90"><Link href="/contact">{block?.items?.[0]?.join_btn || "Join Us"}</Link></Button>
              <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white"><Link href="/about">{block?.items?.[0]?.connected_btn || "Get Connected"}</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function GallerySection({ block, allGallery, t }: {
  block: ContentBlock | null;
  allGallery: any[];
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/gallery" adminLabel="gallery">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Moments" />} title={block?.title || t("gallery_title")} />
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {allGallery.slice(0, 8).map((g, i) => (
              <Reveal key={g.id} delay={i * 0.04}>
                <ItemEdit href={`/admin/gallery?edit=${g.id}`} className={i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}>
                  <Link href="/gallery" className="group relative block h-full w-full overflow-hidden rounded-2xl">
                    <ImageWithFallback src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-church-blue/0 group-hover:bg-church-blue/50 transition-colors grid place-items-end p-3"><span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">{g.title}</span></div>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function VerseSection({ block, verse, lang, t }: {
  block: ContentBlock | null;
  verse: { text: string; ref: string; ne: string };
  lang: string;
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/verses" adminLabel="verses">
      <section className="py-20 bg-church-blue">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="uppercase tracking-[0.25em] text-xs text-gold">{block?.title || t("verse_of_day")}</span>
            <p className="mt-6 text-white text-2xl md:text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, lineHeight: 1.4 }}>"{lang === "en" ? verse.text : verse.ne}"</p>
            <p className="mt-4 text-gold">— {verse.ref}</p>
            <Button variant="outline" className="mt-6 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white"><Share2 className="size-4" /> {t("share")}</Button>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function DonationSection({ block, allCampaigns, t }: {
  block: ContentBlock | null;
  allCampaigns: any[];
  t: (k: string) => string;
}) {
  return (
    <EditableBlock block={block} adminHref="/admin/campaigns" adminLabel="campaigns">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading center={false} eyebrow={<Eyebrow block={block} fallback="Give" />} title={block?.title || t("support_ministry")} subtitle={block?.subtitle || ""} />
            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                {(block?.items?.[0]?.payment_methods || ["eSewa", "Khalti", "Bank Transfer", "QR Code"]).map((m: string) => (
                  <span key={m} className="px-4 py-2 rounded-full bg-secondary text-church-blue text-sm">{m}</span>
                ))}
              </div>
              <Button asChild size="lg" className="mt-6 bg-gold text-church-blue hover:bg-gold/90"><Link href="/give">{t("give")} <ArrowRight className="size-4" /></Link></Button>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="space-y-4">
              {allCampaigns.map((c) => {
                const pct = Math.round((c.raised / c.goal) * 100);
                return (
                  <ItemEdit key={c.id} href={`/admin/campaigns?edit=${c.id}`}>
                    <Card className="p-5 border-border/60">
                      <div className="flex justify-between items-center">
                        <span className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</span>
                        <span className="text-sm text-gold">{pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-3" />
                      <div className="mt-2 text-sm text-muted-foreground">Rs {c.raised.toLocaleString()} raised of Rs {c.goal.toLocaleString()}</div>
                    </Card>
                  </ItemEdit>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

/* ------------------------------------------------------------------ */
/*  Newsletter section (has its own client-side state)                 */
/* ------------------------------------------------------------------ */

function NewsletterSignup({ block }: { block: ContentBlock | null | undefined }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { lang } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage(block?.items?.[0]?.successMessage || (lang === 'en' ? 'Thank you for subscribing!' : 'सदस्यता लिनुभएकोमा धन्यवाद!'));
        setEmail('');
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.detail || (block?.items?.[0]?.errorMessage || 'Already subscribed or invalid email'));
      }
    } catch {
      setStatus('error');
      setMessage(block?.items?.[0]?.errorMessage || 'Something went wrong. Please try again.');
    }
    setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000);
  };

  return (
    <section className="py-20 bg-church-blue">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Reveal>
          <Mail className="size-10 text-gold mx-auto" />
          <h2 className="mt-4 text-white text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
            {block?.title || (lang === 'en' ? 'Stay Connected' : 'जोडिएर रहनुहोस्')}
          </h2>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            {block?.subtitle || (lang === 'en'
              ? 'Subscribe to our newsletter for updates, events, and encouragement delivered to your inbox.'
              : 'हाम्रो न्यूजलेटरका लागि सदस्यता लिनुहोस् — अपडेट, कार्यक्रम र प्रोत्साहन तपाईंको इनबक्समा।')}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={block?.items?.[0]?.emailPlaceholder || (lang === 'en' ? 'Enter your email' : 'तपाईंको इमेल राख्नुहोस्')}
              required
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
            <Button type="submit" disabled={status === 'loading'} size="lg" className="bg-gold text-church-blue hover:bg-gold/90 shrink-0">
              {status === 'loading'
                ? (block?.items?.[0]?.loadingLabel || (lang === 'en' ? 'Subscribing...' : 'सदस्यता लिइँदै...'))
                : (block?.items?.[0]?.buttonLabel || (lang === 'en' ? 'Subscribe' : 'सदस्यता लिनुहोस्'))}
            </Button>
          </form>
          {status === 'success' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-300 text-sm">
              <CheckCircle className="size-4" /> {message}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 text-red-300 text-sm">{message}</div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function NewsletterSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block}>
      <NewsletterSignup block={block} />
    </EditableBlock>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */

export function HomepageSections() {
  const { t, lang } = useLang();
  const homepageLayout = useHomepageLayout();

  const { data: allServiceTimes = [] } = useEnabledServiceTimes();
  const { data: allSermons = [] } = useEnabledSermons();
  const { data: allMinistries = [] } = useEnabledMinistries();
  const { data: allEvents = [] } = useEnabledEvents();
  const { data: allTestimonies = [] } = useEnabledTestimonies();
  const { data: allGallery = [] } = useEnabledGallery();
  const { data: allCampaigns = [] } = useEnabledCampaigns();
  const { data: allVerses = [] } = useEnabledVerses();
  const { data: contentBlocks = [] } = useContentBlocks();

  const serviceTimes = allServiceTimes;
  const featuredSermons = allSermons.slice(0, 3);
  const featuredMinistries = allMinistries.slice(0, 6);
  const verse = allVerses[0] ?? { text: "", ref: "", ne: "" };
  const nextEvent = allEvents[0] ?? { date: "", title: "" };

  // Lookup a content block by sectionKey
  const cb = (key: string): ContentBlock | null =>
    contentBlocks.find((b: ContentBlock) => b.sectionKey === key) ?? null;

  // Sort all known section keys by their content block's sortOrder,
  // falling back to DEFAULT_SECTION_ORDER when sortOrder is null.
  // When a layout variant is active, use its ordering instead.
  const layoutOrder = homepageLayout ? LAYOUT_ORDERS[homepageLayout] : null;
  const sortedKeys = layoutOrder
    ? [...ALL_SECTION_KEYS].sort((a, b) => {
        const ia = layoutOrder.indexOf(a);
        const ib = layoutOrder.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : [...ALL_SECTION_KEYS].sort((a, b) => {
        const blockA = cb(a);
        const blockB = cb(b);
        const oa = blockA?.sortOrder ?? DEFAULT_SECTION_ORDER[a];
        const ob = blockB?.sortOrder ?? DEFAULT_SECTION_ORDER[b];
        return oa - ob;
      });

  const styleOverrides = homepageLayout ? LAYOUT_STYLE_OVERRIDES[homepageLayout] ?? {} : {};

  return (
    <div>
      {sortedKeys.map((key) => {
        const wrapClass = styleOverrides[key] || '';
        let content: React.ReactNode = null;

        switch (key) {

          /* ---------- Hero ---------- */
          case 'hero':
            if (cb('hero')?.enabled === false) return null;
            content = (
              <HeroSection
                key={key}
                hero={cb('hero')}
                serviceTimes={serviceTimes}
                nextEvent={nextEvent}
                lang={lang}
                t={t}
              />
            );
            break;

          /* ---------- Service Times ---------- */
          case 'service_times_section':
            if (cb('service_times_section')?.enabled === false) return null;
            content = (
              <ServiceTimesSection
                key={key}
                block={cb('service_times_section')}
                serviceTimes={serviceTimes}
                lang={lang}
                t={t}
              />
            );
            break;

          /* ---------- What to Expect ---------- */
          case 'what_to_expect':
            if (cb('what_to_expect')?.enabled === false) return null;
            content = (
              <WhatToExpectSection
                key={key}
                block={cb('what_to_expect')}
              />
            );
            break;

          /* ---------- Welcome / Pastor ---------- */
          case 'welcome':
            if (cb('welcome')?.enabled === false) return null;
            content = (
              <WelcomeSection
                key={key}
                block={cb('welcome')}
                t={t}
              />
            );
            break;

          /* ---------- What We Believe ---------- */
          case 'what_we_believe':
            if (cb('what_we_believe')?.enabled === false) return null;
            content = (
              <WhatWeBelieveSection
                key={key}
                block={cb('what_we_believe')}
                t={t}
              />
            );
            break;

          /* ---------- Watch Online ---------- */
          case 'watch_online':
            if (cb('watch_online')?.enabled === false) return null;
            content = (
              <WatchOnlineSection
                key={key}
                block={cb('watch_online')}
                lang={lang}
              />
            );
            break;

          /* ---------- Featured Sermons ---------- */
          case 'featured_sermons':
            if (cb('featured_sermons')?.enabled === false || allSermons.length === 0) return null;
            content = (
              <FeaturedSermonsSection
                key={key}
                block={cb('featured_sermons')}
                featuredSermons={featuredSermons}
                t={t}
              />
            );
            break;

          /* ---------- Ministries ---------- */
          case 'ministries_section':
            if (cb('ministries_section')?.enabled === false) return null;
            content = (
              <MinistriesSection
                key={key}
                block={cb('ministries_section')}
                featuredMinistries={featuredMinistries}
                lang={lang}
                t={t}
              />
            );
            break;

          /* ---------- Upcoming Events ---------- */
          case 'events_section':
            if (cb('events_section')?.enabled === false) return null;
            content = (
              <EventsSection
                key={key}
                block={cb('events_section')}
                allEvents={allEvents}
                lang={lang}
                t={t}
              />
            );
            break;

          /* ---------- Prayer CTA ---------- */
          case 'prayer_cta':
            if (cb('prayer_cta')?.enabled === false) return null;
            content = (
              <PrayerCtaSection
                key={key}
                block={cb('prayer_cta')}
                t={t}
              />
            );
            break;

          /* ---------- Notice Board ---------- */
          case 'notice_board':
            if (cb('notice_board')?.enabled === false) return null;
            content = (
              <NoticeBoardSection
                key={key}
                block={cb('notice_board')}
              />
            );
            break;

          /* ---------- Testimonies ---------- */
          case 'testimonies_section':
            if (cb('testimonies_section')?.enabled === false) return null;
            content = (
              <TestimoniesSection
                key={key}
                block={cb('testimonies_section')}
                allTestimonies={allTestimonies}
              />
            );
            break;

          /* ---------- Church Members ---------- */
          case 'church_members':
            if (cb('church_members')?.enabled === false) return null;
            content = (
              <ChurchMembersSection
                key={key}
                block={cb('church_members')}
              />
            );
            break;

          /* ---------- Gallery preview ---------- */
          case 'gallery_section':
            if (cb('gallery_section')?.enabled === false) return null;
            content = (
              <GallerySection
                key={key}
                block={cb('gallery_section')}
                allGallery={allGallery}
                t={t}
              />
            );
            break;

          /* ---------- Verse of the day ---------- */
          case 'verse_section':
            if (cb('verse_section')?.enabled === false) return null;
            content = (
              <VerseSection
                key={key}
                block={cb('verse_section')}
                verse={verse}
                lang={lang}
                t={t}
              />
            );
            break;

          /* ---------- Donation ---------- */
          case 'donation_section':
            if (cb('donation_section')?.enabled === false) return null;
            content = (
              <DonationSection
                key={key}
                block={cb('donation_section')}
                allCampaigns={allCampaigns}
                t={t}
              />
            );
            break;

          /* ---------- Newsletter Signup ---------- */
          case 'newsletter':
            if (cb('newsletter')?.enabled === false) return null;
            content = (
              <NewsletterSection
                key={key}
                block={cb('newsletter')}
              />
            );
            break;

          default:
            return null;
        }

        return wrapClass ? (
          <div key={`wrap-${key}`} className={wrapClass}>{content}</div>
        ) : content;
      })}
    </div>
  );
}
