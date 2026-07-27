'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import { motion } from "motion/react";
import useEmblaCarousel from 'embla-carousel-react';
import {
  Play, Calendar, Clock, MapPin, ArrowRight, Quote, Star, Share2, HandHeart, Heart, ChevronRight, ChevronLeft, Mail, CheckCircle, FileText, ZoomIn, Target, Car,
} from "lucide-react";
import { toast } from "sonner";
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
  map_visit: 16,
  newsletter: 17,
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
    'gallery_section', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  // Magazine: masonry-style, lead with content
  magazine: [
    'hero', 'featured_sermons', 'events_section', 'ministries_section',
    'service_times_section', 'welcome', 'what_we_believe',
    'watch_online', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members',
    'gallery_section', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  // Minimal Hero: spacious, editorial
  'minimal-hero': [
    'hero', 'verse_section', 'welcome', 'ministries_section',
    'donation_section', 'newsletter', 'service_times_section',
    'what_we_believe', 'events_section', 'watch_online',
    'featured_sermons', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members', 'gallery_section', 'map_visit',
  ],
  // Full Width: full-bleed, edge-to-edge
  'full-width': [
    'hero', 'ministries_section', 'events_section', 'service_times_section',
    'welcome', 'what_we_believe', 'featured_sermons',
    'watch_online', 'prayer_cta', 'gallery_section',
    'testimonies_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  // Split: alternating sections
  split: [
    'hero', 'service_times_section', 'welcome', 'what_we_believe',
    'featured_sermons', 'events_section', 'ministries_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  // Centered: narrow, editorial feel
  centered: [
    'hero', 'welcome', 'verse_section', 'what_we_believe',
    'featured_sermons', 'ministries_section', 'events_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'service_times_section', 'donation_section', 'map_visit', 'newsletter',
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
  const eyebrow = hero?.items?.[0]?.eyebrow || t("tagline");
  const ctas = hero?.items?.[0]?.ctaButtons?.length
    ? hero.items[0].ctaButtons
    : [
        { label: t("hero_watch"), link: "/sermons" },
        { label: t("hero_pray"), link: "/prayer" },
      ];

  return (
    <EditableBlock block={hero}>
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" aria-label="Hero banner">
        {/* Background image with Ken Burns effect */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={hero?.image || ''}
            alt={hero?.title || "Church hero"}
            className="w-full h-full object-cover scale-105 motion-safe:animate-[kenBurns_20s_ease-in-out_infinite_alternate]"
            fallbackClassName="bg-church-blue"
          />
          {/* Gradient overlay: dark bottom-left for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-center">
            {/* Left: headline + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm mb-6 px-4 py-1.5 text-sm">
                {eyebrow}
              </Badge>

              <h1
                className="text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}
              >
                {hero?.title || t("hero_welcome")}
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed">
                {hero?.subtitle || t("hero_sub")}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                {ctas.map((cta: { label: string; link: string }, i: number) => (
                  <Button
                    key={i}
                    asChild
                    size="lg"
                    className={
                      i === 0
                        ? "bg-gold text-church-blue hover:bg-gold/90 shadow-lg shadow-gold/20 px-8"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm px-8"
                    }
                    variant={i === 0 ? "default" : "outline"}
                  >
                    <Link href={cta.link}>
                      {i === 0 ? <Play className="size-4" /> : <HandHeart className="size-4" />}
                      {cta.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Right: Next Service countdown card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="p-6 bg-white/95 backdrop-blur-xl border-0 shadow-2xl shadow-black/10 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {hero?.items?.[0]?.serviceCardLabel || (lang === "en" ? "Next Service" : "अर्को सेवा")}
                  </span>
                  <Badge className="bg-success/10 text-success border-0 font-medium">
                    {hero?.items?.[0]?.serviceCardBadge || "Live Soon"}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white shadow-lg shadow-church-blue/20">
                    <Icon name="Church" className="size-6" />
                  </span>
                  <div>
                    <div className="text-church-blue font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                      {serviceTimes[0]?.name || hero?.items?.[0]?.serviceCardFallbackName || "Sunday Worship"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {serviceTimes[0]?.day || hero?.items?.[0]?.serviceCardFallbackDay || "Sunday"}
                      {" · "}
                      {serviceTimes[0]?.time || hero?.items?.[0]?.serviceCardFallbackTime || "10:00 AM"}
                      {" · "}
                      {hero?.items?.[0]?.serviceCardFallbackLocation || "Kathmandu"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <Countdown date={nextEvent.date} />
                </div>
              </Card>
            </motion.div>
          </div>
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
  // "Happening now / next" logic
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const nowMinutes = currentHour * 60 + currentMinute;

  const dayOrder: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Daily: -1 };

  function parseTime(timeStr: string): number {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  function getStatus(s: any): 'now' | 'next' | 'later' {
    if (s.day === 'Daily') {
      const st = parseTime(s.time);
      if (nowMinutes >= st && nowMinutes < st + 60) return 'now';
      if (nowMinutes < st) return 'next';
      return 'later';
    }
    if (s.day === currentDay) {
      const st = parseTime(s.time);
      if (nowMinutes >= st && nowMinutes < st + 90) return 'now';
      if (nowMinutes < st) return 'next';
    }
    // Find next upcoming day
    const sd = dayOrder[s.day] ?? 7;
    const cd = dayOrder[currentDay] ?? 7;
    if (sd > cd || (sd === cd && nowMinutes < parseTime(s.time))) return 'next';
    return 'later';
  }

  const enriched = serviceTimes.map(s => ({ ...s, _status: getStatus(s) }));
  // Sort: now first, then next, then later
  enriched.sort((a: any, b: any) => {
    const order: Record<string, number> = { now: 0, next: 1, later: 2 };
    return (order[a._status] ?? 2) - (order[b._status] ?? 2);
  });

  return (
    <EditableBlock block={block} adminHref="/admin/service-times" adminLabel="service times">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Join Us" />} title={block?.title || t("service_times")} subtitle={block?.subtitle || ""} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {enriched.map((s: any, i: number) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <ItemEdit href={`/admin/service-times?edit=${s.id}`}>
                  <Card className={`group p-6 h-full border transition-all duration-300 hover:-translate-y-1 ${
                    s._status === 'now'
                      ? 'border-success bg-success/5 shadow-lg shadow-success/10 hover:border-success'
                      : s._status === 'next'
                      ? 'border-gold bg-gold/5 shadow-lg shadow-gold/10 hover:border-gold'
                      : 'border-border/60 hover:border-gold hover:shadow-xl'
                  }`}>
                    <div className="flex items-start justify-between">
                      <span className="grid place-items-center size-12 rounded-xl bg-secondary text-church-blue group-hover:bg-gold group-hover:text-church-blue transition-colors">
                        <Icon name={s.icon} className="size-6" />
                      </span>
                      {s._status === 'now' && (
                        <Badge className="bg-success/15 text-success border-0 text-xs font-medium animate-pulse">
                          {lang === 'en' ? 'Happening Now' : 'अहिले चलिरहेको'}
                        </Badge>
                      )}
                      {s._status === 'next' && (
                        <Badge className="bg-gold/15 text-gold border-0 text-xs font-medium">
                          {lang === 'en' ? 'Upcoming' : 'आउने'}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      {lang === "en" ? s.name : s.nameNe}
                    </h3>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-4 text-gold shrink-0" /> {s.day}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4 text-gold shrink-0" /> {s.time}
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
  const stats = block?.items || [];
  const pastorName = block?.items?.[0]?.pastorName || "Ps. Bishal Rai";
  const pastorRole = block?.items?.[0]?.pastorRole || "Senior Pastor";

  return (
    <EditableBlock block={block}>
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <ImageWithFallback
                src={block?.image || ''}
                alt={`${pastorName} — ${pastorRole}`}
                loading="lazy"
                className="rounded-3xl w-full aspect-[4/5] object-cover shadow-xl"
                fallbackClassName="bg-church-blue/10"
              />
              <Card className="absolute -bottom-6 -right-2 sm:right-6 p-4 max-w-[220px] shadow-xl border-0">
                <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{pastorName}</div>
                <div className="text-sm text-muted-foreground">{pastorRole}</div>
              </Card>
            </div>
          </Reveal>
          <div>
            <SectionHeading center={false} eyebrow={<Eyebrow block={block} fallback="Welcome" />} title={block?.title || t("welcome_title")} subtitle={block?.subtitle || ""} />
            <Reveal delay={0.1}>
              {stats.length > 0 && (
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((st: any, i: number) => (
                    <div key={i} className="text-center rounded-2xl bg-section p-4">
                      <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem" }}>{st.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{st.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild className="mt-8 bg-church-blue hover:bg-church-blue/90">
                <Link href="/about">{t("read_more")} <ArrowRight className="size-4" /></Link>
              </Button>
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
            {featuredSermons.map((s: any, i: number) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <ItemEdit href={`/admin/sermons?edit=${s.id}`}>
                  <Link href={`/sermons/${s.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                      <div className="relative aspect-video overflow-hidden">
                        <ImageWithFallback src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                          <span className="grid place-items-center size-14 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform shadow-lg">
                            <Play className="size-6 fill-church-blue" />
                          </span>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0 font-medium">{s.series}</Badge>
                        <span className="absolute bottom-3 right-3 text-xs bg-church-blue/90 text-white px-2 py-1 rounded-md backdrop-blur-sm">{s.duration}</span>
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{s.speaker}</span>
                          <span className="text-gold">·</span>
                          <span>{s.date}</span>
                        </div>
                        <h3 className="mt-2 text-church-blue line-clamp-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                        <div className="mt-3 flex items-center gap-4">
                          <span className="inline-flex items-center gap-1 text-gold text-sm font-medium">
                            <Play className="size-3.5" /> {t("watch_now")}
                          </span>
                          {s.videoUrl && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-church-blue transition-colors">
                              <FileText className="size-3.5" /> Notes
                            </span>
                          )}
                        </div>
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
  const [activeFilter, setActiveFilter] = useState('all');

  // Derive categories from the content_block items, or build from ministries
  const filterCategories = block?.items?.[0]?.filters?.length
    ? block.items[0].filters
    : ['All', ...new Set(featuredMinistries.map((m: any) => m.category || 'General'))];

  const filtered = activeFilter === 'all'
    ? featuredMinistries
    : featuredMinistries.filter((m: any) => (m.category || 'General') === activeFilter);

  return (
    <EditableBlock block={block} adminHref="/admin/ministries" adminLabel="ministries">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Get Involved" />} title={block?.title || t("our_ministries")} subtitle={block?.subtitle || ""} />

          {/* Filter chips */}
          {filterCategories.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2 justify-center" role="group" aria-label="Filter ministries by category">
              {filterCategories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilter === cat
                      ? 'bg-church-blue text-white shadow-md shadow-church-blue/20'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  }`}
                  aria-pressed={activeFilter === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m: any, i: number) => (
              <Reveal key={m.id} delay={i * 0.06}>
                <ItemEdit href={`/admin/ministries?edit=${m.id}`}>
                  <Link href={`/ministries/${m.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-3 left-3 grid place-items-center size-10 rounded-xl bg-white/90 text-church-blue shadow"><Icon name={m.icon} className="size-5" /></span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? m.name : m.nameNe}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-gold text-sm font-medium">{t("learn_more")} <ArrowRight className="size-4" /></span>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">No ministries in this category yet.</p>
          )}

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
              <Link href="/ministries">{t("view_all")} <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
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
  const maxEvents = block?.items?.[0]?.maxEvents || 4;
  const events = allEvents.slice(0, maxEvents);

  return (
    <EditableBlock block={block} adminHref="/admin/events" adminLabel="events">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={<Eyebrow block={block} fallback="Mark Your Calendar" />} title={block?.title || t("upcoming_events")} />

          {/* Desktop: grid layout */}
          <div className="mt-12 hidden md:grid gap-6 lg:grid-cols-2">
            {events.map((e: any, i: number) => (
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
                          <div className="flex items-center gap-2"><Clock className="size-4 text-gold shrink-0" /> {(e.displayDate || "")} · {e.time}</div>
                          <div className="flex items-center gap-2"><MapPin className="size-4 text-gold shrink-0" /> {e.location}</div>
                        </div>
                        <div className="mt-4"><Countdown date={e.date} /></div>
                        <span className="mt-3 inline-flex items-center gap-1 text-gold text-sm font-medium">{t("register")} <ArrowRight className="size-4" /></span>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>

          {/* Mobile: horizontal scroll */}
          <div className="mt-12 md:hidden flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
            {events.map((e: any, i: number) => (
              <Reveal key={e.id} delay={i * 0.08}>
                <ItemEdit href={`/admin/events?edit=${e.id}`}>
                  <Link href={`/events/${e.id}`} className="block w-72 shrink-0 snap-start">
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                      <div className="relative h-40 overflow-hidden">
                        <ImageWithFallback src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 bg-white rounded-lg px-3 py-1.5 text-center shadow">
                          <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{(e.displayDate || "").split(" ")[1]?.replace(",", "") ?? ""}</div>
                          <div className="text-[10px] uppercase text-gold">{(e.displayDate || "").split(" ")[0]}</div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-church-blue text-sm" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{e.title}</h3>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="size-3 text-gold shrink-0" /> {e.location}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
              <Link href="/events">{t("view_all_events") || "View All Events"} <ArrowRight className="size-4" /></Link>
            </Button>
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
          <ImageWithFallback src={block?.image || ''} alt="Prayer" loading="lazy" className="w-full h-full object-cover" fallbackClassName="bg-church-blue/20" />
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => { emblaApi.scrollNext(); }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <EditableBlock block={block} adminHref="/admin/testimonies" adminLabel="testimonies">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeading eyebrow={<Eyebrow block={block} fallback="Stories of Grace" />} title={block?.title || "Testimonies"} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-9" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev} aria-label="Previous testimony">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-9" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext} aria-label="Next testimony">
                <ChevronRight className="size-4" />
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-church-blue hover:text-gold">
                <Link href="/testimonies">View All <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 overflow-hidden" ref={emblaRef} role="region" aria-label="Testimonies carousel">
            <div className="flex gap-6">
              {allTestimonies.map((tst: any) => (
                <div key={tst.id} className="flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-0">
                  <ItemEdit href={`/admin/testimonies?edit=${tst.id}`}>
                    <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                      <Quote className="size-8 text-gold/40" aria-hidden="true" />
                      <p className="mt-3 text-foreground/80 leading-relaxed line-clamp-4">"{tst.quote}"</p>
                      <div className="mt-3 flex gap-0.5" aria-label={`${tst.rating} out of 5 stars`}>
                        {Array.from({ length: tst.rating }).map((_: any, k: number) => (
                          <Star key={k} className="size-4 fill-gold text-gold" />
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <ImageWithFallback src={tst.image} alt={tst.name} loading="lazy" className="size-11 rounded-full object-cover" />
                        <div>
                          <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{tst.name}</div>
                          <div className="text-xs text-muted-foreground">{tst.role}</div>
                        </div>
                      </div>
                    </Card>
                  </ItemEdit>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          {allTestimonies.length > 1 && (
            <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Testimony navigation">
              {allTestimonies.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`size-2.5 rounded-full transition-all ${i === selectedIndex ? 'bg-church-blue w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                  role="tab"
                  aria-selected={i === selectedIndex}
                  aria-label={`Go to testimony ${i + 1}`}
                />
              ))}
            </div>
          )}
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
  const images = allGallery.slice(0, 8);

  return (
    <EditableBlock block={block} adminHref="/admin/gallery" adminLabel="gallery">
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeading eyebrow={<Eyebrow block={block} fallback="Moments" />} title={block?.title || t("gallery_title")} />
            <Button asChild variant="ghost" className="text-church-blue hover:text-gold hidden sm:inline-flex">
              <Link href="/gallery">{t("view_all")} <ChevronRight className="size-4" /></Link>
            </Button>
          </div>

          {/* Masonry-like grid using CSS columns */}
          <div className="mt-10 columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {images.map((g: any, i: number) => (
              <Reveal key={g.id} delay={i * 0.04}>
                <ItemEdit href={`/admin/gallery?edit=${g.id}`} className="mb-3 break-inside-avoid">
                  <Link href="/gallery" className="group relative block w-full overflow-hidden rounded-2xl">
                    <ImageWithFallback
                      src={g.image}
                      alt={g.title}
                      loading="lazy"
                      className="w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-church-blue/0 group-hover:bg-church-blue/50 transition-colors grid place-items-center">
                      <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-church-blue/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm">{g.title}</span>
                    </div>
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

function VerseSection({ block, allVerses, lang, t }: {
  block: ContentBlock | null;
  allVerses: any[];
  lang: string;
  t: (k: string) => string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort verses: pinned first, then by sort_order
  const sortedVerses = useMemo(() => {
    const verses = [...allVerses];
    verses.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    return verses;
  }, [allVerses]);

  // Find pinned verse index or default to 0
  const pinnedIndex = useMemo(() => {
    const idx = sortedVerses.findIndex(v => v.isPinned);
    return idx >= 0 ? idx : 0;
  }, [sortedVerses]);

  // Start at pinned verse
  useEffect(() => {
    setCurrentIndex(pinnedIndex);
  }, [pinnedIndex]);

  // Rotate through verses every 20 seconds
  useEffect(() => {
    if (sortedVerses.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % sortedVerses.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [sortedVerses.length]);

  const verse = sortedVerses[currentIndex] ?? { text: "", ref_text: "", ne: "" };

  return (
    <EditableBlock block={block} adminHref="/admin/verses" adminLabel="verses">
      <section className="py-20 bg-church-blue relative overflow-hidden">
        {/* Decorative quote marks */}
        <div className="absolute top-8 left-8 text-white/5 text-[120px] leading-none select-none" aria-hidden="true">"</div>
        <div className="absolute bottom-8 right-8 text-white/5 text-[120px] leading-none select-none" aria-hidden="true">"</div>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="uppercase tracking-[0.25em] text-xs text-gold">{block?.title || t("verse_of_day")}</span>
            <p className="mt-6 text-white text-2xl md:text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, lineHeight: 1.4 }}>
              "{lang === "en" ? verse.text : verse.ne}"
            </p>
            <p className="mt-4 text-gold font-medium">— {verse.ref_text || verse.ref}</p>
            <Button variant="outline" className="mt-6 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Share2 className="size-4" /> {t("share")}
            </Button>
          </Reveal>

          {/* Verse navigation dots */}
          {sortedVerses.length > 1 && (
            <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="Verse navigation">
              {sortedVerses.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`size-2 rounded-full transition-all ${i === currentIndex ? 'bg-gold w-6' : 'bg-white/30 hover:bg-white/50'}`}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Verse ${i + 1}`}
                />
              ))}
            </div>
          )}
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
  // Show only enabled campaigns, or first 2 if none marked
  const campaigns = (allCampaigns.length > 0 ? allCampaigns : []).slice(0, 2);
  const featured = campaigns[0];
  const featuredPct = featured ? Math.round((featured.raised / featured.goal) * 100) : 0;

  return (
    <EditableBlock block={block} adminHref="/admin/campaigns" adminLabel="campaigns">
      <section className="py-20 bg-church-blue text-white relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-church-blue via-church-blue to-sky-blue/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: headline + CTA */}
          <div>
            <SectionHeading
              light
              center={false}
              eyebrow={<span className="text-gold">{block?.items?.[0]?.eyebrow || "Give"}</span>}
              title={block?.title || t("support_ministry")}
              subtitle={block?.subtitle || ""}
            />
            <Reveal delay={0.1}>
              <div className="mt-6 flex flex-wrap gap-3">
                {(block?.items?.[0]?.payment_methods || ["eSewa", "Khalti", "Bank Transfer", "QR Code"]).map((m: string) => (
                  <span key={m} className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm backdrop-blur-sm border border-white/10">
                    {m}
                  </span>
                ))}
              </div>
              <Button asChild size="lg" className="mt-8 bg-gold text-church-blue hover:bg-gold/90 shadow-lg shadow-gold/20 px-8">
                <Link href="/give">
                  <Heart className="size-4" /> {t("give")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
          </div>

          {/* Right: featured campaign progress */}
          {featured && (
            <Reveal delay={0.2}>
              <Card className="p-6 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="size-5 text-gold" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {block?.items?.[0]?.campaignLabel || "Active Campaign"}
                  </span>
                </div>
                <h3 className="text-church-blue text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {featured.title}
                </h3>
                <div className="mt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-2xl font-bold text-church-blue">Rs {featured.raised.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">of Rs {featured.goal.toLocaleString()}</span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-gold/80 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(featuredPct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{featuredPct}% funded</span>
                    <span className="text-gold font-medium">Rs {(featured.goal - featured.raised).toLocaleString()} to go</span>
                  </div>
                </div>
                {campaigns.length > 1 && campaigns[1] && (
                  <div className="mt-5 pt-5 border-t border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-church-blue">{campaigns[1].title}</span>
                      <span className="text-xs text-muted-foreground">{Math.round((campaigns[1].raised / campaigns[1].goal) * 100)}%</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-church-blue/60 rounded-full"
                        style={{ width: `${Math.min(Math.round((campaigns[1].raised / campaigns[1].goal) * 100), 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Rs {campaigns[1].raised.toLocaleString()} / Rs {campaigns[1].goal.toLocaleString()}</div>
                  </div>
                )}
              </Card>
            </Reveal>
          )}
        </div>
      </section>
    </EditableBlock>
  );
}

function MapVisitSection({ block, serviceTimes, lang, t }: {
  block: ContentBlock | null;
  serviceTimes: any[];
  lang: string;
  t: (k: string) => string;
}) {
  const address = block?.items?.[0]?.address || "Baneshwor, Kathmandu 44600, Nepal";
  const mapUrl = block?.items?.[0]?.mapUrl || "https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335";
  const phone = block?.items?.[0]?.phone || "+977 1-4000000";
  const services = serviceTimes.slice(0, 3);

  return (
    <EditableBlock block={block}>
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: Map */}
          <Reveal>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50">
              <iframe
                src={mapUrl}
                width="100%"
                height="360"
                style={{ border: 0 }}
                loading="lazy"
                title="Church location map"
                className="w-full"
              />
            </div>
          </Reveal>

          {/* Right: Visit info */}
          <Reveal delay={0.1}>
            <div>
              <SectionHeading
                center={false}
                eyebrow={<Eyebrow block={block} fallback="Visit Us" />}
                title={block?.title || t("plan_your_visit") || "Plan Your Visit"}
                subtitle={block?.subtitle || ""}
              />

              <div className="mt-6 space-y-4">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-10 rounded-xl bg-church-blue/10 text-church-blue shrink-0">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{address}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{phone}</div>
                  </div>
                </div>

                {/* Service times */}
                {services.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center size-10 rounded-xl bg-church-blue/10 text-church-blue shrink-0">
                      <Clock className="size-5" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {lang === "en" ? "Service Times" : "सेवा समय"}
                      </div>
                      <div className="mt-1 space-y-1">
                        {services.map((s: any) => (
                          <div key={s.id} className="text-xs text-muted-foreground">
                            {s.day} · {s.time} — {lang === "en" ? s.name : s.nameNe}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Parking */}
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center size-10 rounded-xl bg-church-blue/10 text-church-blue shrink-0">
                    <Car className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {lang === "en" ? "Free Parking" : "निःशुल्क पार्किङ"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {lang === "en" ? "Available beside the church" : "मण्डली छेउमा उपलब्ध"}
                    </div>
                  </div>
                </div>
              </div>

              <Button asChild size="lg" className="mt-8 bg-church-blue hover:bg-church-blue/90">
                <Link href="/visit">
                  <Calendar className="size-4" /> {t("plan_your_visit") || "Plan Your Visit"} <ArrowRight className="size-4" />
                </Link>
              </Button>
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
    if (!email || !email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        const successMsg = block?.items?.[0]?.successMessage || (lang === 'en'
          ? 'Thank you for subscribing! Check your email to confirm.'
          : 'सदस्यता लिनुभएकोमा धन्यवाद! पुष्टिका लागि इमेल जाँच गर्नुहोस्।');
        setMessage(successMsg);
        setEmail('');
        toast.success(successMsg);
      } else {
        const data = await res.json();
        setStatus('error');
        const errMsg = data.detail || (block?.items?.[0]?.errorMessage || 'Already subscribed or invalid email');
        setMessage(errMsg);
        toast.error(errMsg);
      }
    } catch {
      setStatus('error');
      const errMsg = block?.items?.[0]?.errorMessage || 'Something went wrong. Please try again.';
      setMessage(errMsg);
      toast.error(errMsg);
    }
    setTimeout(() => { setStatus('idle'); setMessage(''); }, 6000);
  };

  return (
    <section className="py-20 bg-church-blue">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Reveal>
          <Mail className="size-10 text-gold mx-auto" aria-hidden="true" />
          <h2 className="mt-4 text-white text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
            {block?.title || (lang === 'en' ? 'Stay Connected' : 'जोडिएर रहनुहोस्')}
          </h2>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            {block?.subtitle || (lang === 'en'
              ? 'Subscribe to our newsletter for updates, events, and encouragement delivered to your inbox.'
              : 'हाम्रो न्यूजलेटरका लागि सदस्यता लिनुहोस् — अपडेट, कार्यक्रम र प्रोत्साहन तपाईंको इनबक्समा।')}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" noValidate>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={block?.items?.[0]?.emailPlaceholder || (lang === 'en' ? 'Enter your email' : 'तपाईंको इमेल राख्नुहोस्')}
              required
              aria-label={lang === 'en' ? 'Email address for newsletter' : 'न्यूजलेटरका लागि इमेल ठेगाना'}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            />
            <Button type="submit" disabled={status === 'loading' || !email} size="lg" className="bg-gold text-church-blue hover:bg-gold/90 shrink-0">
              {status === 'loading'
                ? (block?.items?.[0]?.loadingLabel || (lang === 'en' ? 'Subscribing...' : 'सदस्यता लिइँदै...'))
                : (block?.items?.[0]?.buttonLabel || (lang === 'en' ? 'Subscribe' : 'सदस्यता लिनुहोस्'))}
            </Button>
          </form>
          {status === 'success' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-300 text-sm" role="status">
              <CheckCircle className="size-4" /> {message}
            </div>
          )}
          {status === 'error' && (
            <div className="mt-4 text-red-300 text-sm" role="alert">{message}</div>
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
                allVerses={allVerses}
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

          /* ---------- Map + Visit ---------- */
          case 'map_visit':
            if (cb('map_visit')?.enabled === false) return null;
            content = (
              <MapVisitSection
                key={key}
                block={cb('map_visit')}
                serviceTimes={serviceTimes}
                lang={lang}
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
