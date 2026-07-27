import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'wouter'
import useEmblaCarousel from 'embla-carousel-react';
import {
  Play, Calendar, Clock, MapPin, ArrowRight, Quote, Star, Share2, HandHeart, Heart, ChevronRight, ChevronLeft, Mail, CheckCircle, FileText, ZoomIn, Target, Car, Users, ArrowUpRight, Sparkles, BookOpen, Music, Shield, Coffee, Baby, Sun,
  Church,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Reveal } from "@/components/site/Reveal";
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
const DEFAULT_SECTION_ORDER: Record<string, number> = {
  hero: 0,
  service_times_section: 1,
  welcome: 2,
  what_to_expect: 3,
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

const LAYOUT_ORDERS: Record<string, string[]> = {
  default: [
    'hero', 'service_times_section', 'welcome', 'what_to_expect',
    'what_we_believe', 'watch_online', 'featured_sermons',
    'ministries_section', 'events_section', 'prayer_cta',
    'notice_board', 'testimonies_section', 'church_members',
    'gallery_section', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  magazine: [
    'hero', 'featured_sermons', 'events_section', 'ministries_section',
    'service_times_section', 'welcome', 'what_we_believe',
    'watch_online', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members',
    'gallery_section', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  'minimal-hero': [
    'hero', 'verse_section', 'welcome', 'ministries_section',
    'donation_section', 'newsletter', 'service_times_section',
    'what_we_believe', 'events_section', 'watch_online',
    'featured_sermons', 'prayer_cta', 'what_to_expect',
    'notice_board', 'testimonies_section', 'church_members', 'gallery_section', 'map_visit',
  ],
  'full-width': [
    'hero', 'ministries_section', 'events_section', 'service_times_section',
    'welcome', 'what_we_believe', 'featured_sermons',
    'watch_online', 'prayer_cta', 'gallery_section',
    'testimonies_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  split: [
    'hero', 'service_times_section', 'welcome', 'what_we_believe',
    'featured_sermons', 'events_section', 'ministries_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'verse_section', 'donation_section', 'map_visit', 'newsletter',
  ],
  centered: [
    'hero', 'welcome', 'verse_section', 'what_we_believe',
    'featured_sermons', 'ministries_section', 'events_section',
    'prayer_cta', 'watch_online', 'testimonies_section',
    'gallery_section', 'church_members', 'what_to_expect',
    'notice_board', 'service_times_section', 'donation_section', 'map_visit', 'newsletter',
  ],
};

const LAYOUT_STYLE_OVERRIDES: Record<string, Record<string, string>> = {
  default: {},
  magazine: {},
  'minimal-hero': {},
  'full-width': {},
  split: {},
  centered: {},
};

function useHomepageLayout() {
  const [layout, setLayout] = useState<string>('');
  useEffect(() => {
    const read = () => setLayout(document.documentElement.getAttribute('data-homepage-layout') || '');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-homepage-layout'] });
    return () => observer.disconnect();
  }, []);
  return layout;
}

function Eyebrow({ block, fallback }: { block: ContentBlock | null | undefined; fallback: string }) {
  return block?.items?.[0]?.eyebrow || fallback;
}

// ------------------------------------------------------------------
// Section Components
// ------------------------------------------------------------------

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
        { label: "Join Us Sunday", link: "/contact" },
        { label: "Watch Live", link: "/live" },
      ];

  return (
    <EditableBlock block={hero}>
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden" aria-label="Hero banner">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={hero?.image || images.hero}
            alt={hero?.title || "Church hero"}
            className="w-full h-full object-cover scale-105 motion-safe:animate-[kenBurns_20s_ease-in-out_infinite_alternate]"
            fallbackClassName="bg-church-blue"
          />
          {/* Deep cinematic gradient overlays */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-church-blue/80 via-church-blue/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 pt-32 pb-24 w-full h-full flex flex-col justify-center">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-end w-full">
            
            {/* Left Content */}
            <div className="lg:col-span-8 max-w-4xl">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
                <Sparkles className="size-4 text-gold" />
                <span className="text-sm font-medium tracking-wide text-white uppercase" style={{ fontFamily: "var(--font-body)" }}>{eyebrow}</span>
              </div>

              <h1
                className="text-white text-5xl sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[1.05] tracking-tight mb-6 drop-shadow-lg"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
              >
                {hero?.title || t("hero_welcome")}
              </h1>

              <p className="text-xl sm:text-2xl text-white/80 max-w-2xl leading-relaxed font-light drop-shadow-md mb-10">
                {hero?.subtitle || t("hero_sub")}
              </p>

              <div className="flex flex-wrap gap-4">
                {ctas.map((cta: { label: string; link: string }, i: number) => (
                  <Button
                    key={i}
                    asChild
                    size="lg"
                    className={`h-14 px-8 text-base font-medium rounded-full transition-all duration-300 ${
                      i === 0
                        ? "bg-gold hover:bg-[#c29215] text-church-blue shadow-[0_0_40px_rgba(212,160,23,0.3)] hover:shadow-[0_0_60px_rgba(212,160,23,0.4)] border-0"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md"
                    }`}
                  >
                    <Link href={cta.link}>
                      {i === 0 && <HandHeart className="size-5 mr-2" />}
                      {i === 1 && <Play className="size-5 mr-2" />}
                      {cta.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Right Countdown Card */}
            <div className="lg:col-span-4 lg:justify-self-end w-full max-w-md">
              <div className="p-1 rounded-3xl bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-md shadow-2xl">
                <Card className="p-6 bg-church-blue/80 backdrop-blur-xl border-white/10 shadow-inner rounded-[1.3rem] text-white">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-semibold tracking-wide text-white/80 uppercase">
                      {hero?.items?.[0]?.serviceCardLabel || (lang === "en" ? "Next Service" : "अर्को सेवा")}
                    </span>
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 animate-pulse">
                      {hero?.items?.[0]?.serviceCardBadge || "Live Soon"}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <span className="grid place-items-center size-14 rounded-2xl bg-white/10 text-gold shadow-inner border border-white/5 shrink-0">
                      <Church className="size-6" />
                    </span>
                    <div>
                      <div className="text-xl text-white tracking-tight mb-1" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                        {serviceTimes[0]?.name || hero?.items?.[0]?.serviceCardFallbackName || "Sunday Worship"}
                      </div>
                      <div className="text-[13px] text-white/60 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {serviceTimes[0]?.day || hero?.items?.[0]?.serviceCardFallbackDay || "Sunday"}</span>
                        <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> {serviceTimes[0]?.time || hero?.items?.[0]?.serviceCardFallbackTime || "10:00 AM"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <Countdown date={nextEvent.date} />
                  </div>
                </Card>
              </div>
            </div>
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
    const sd = dayOrder[s.day] ?? 7;
    const cd = dayOrder[currentDay] ?? 7;
    if (sd > cd || (sd === cd && nowMinutes < parseTime(s.time))) return 'next';
    return 'later';
  }

  const enriched = serviceTimes.map(s => ({ ...s, _status: getStatus(s) }));
  enriched.sort((a: any, b: any) => {
    const order: Record<string, number> = { now: 0, next: 1, later: 2 };
    return (order[a._status] ?? 2) - (order[b._status] ?? 2);
  });

  return (
    <EditableBlock block={block} adminHref="/admin/service-times" adminLabel="service times">
      <section className="py-24 bg-section relative">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3">{Eyebrow({block, fallback: "Join Us"})}</span>
            <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("service_times")}</h2>
            {block?.subtitle && <p className="mt-4 text-muted-foreground max-w-2xl">{block.subtitle}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {enriched.map((s: any, i: number) => (
              <Reveal key={s.id} delay={i * 0.1}>
                <ItemEdit href={`/admin/service-times?edit=${s.id}`}>
                  <Card className={`group relative p-8 h-full rounded-2xl transition-all duration-500 overflow-hidden ${
                    s._status === 'now'
                      ? 'bg-gradient-to-br from-church-blue to-sky-blue text-white shadow-xl shadow-church-blue/20 translate-y-[-4px]'
                      : s._status === 'next'
                      ? 'bg-white border-gold/30 shadow-lg shadow-gold/5 translate-y-[-2px]'
                      : 'bg-white border-border/50 hover:shadow-xl hover:border-gold/30 hover:translate-y-[-4px]'
                  }`}>
                    {s._status === 'now' && <div className="absolute top-0 inset-x-0 h-1 bg-gold" />}
                    
                    <div className="flex items-start justify-between mb-8">
                      <span className={`grid place-items-center size-14 rounded-2xl shadow-sm transition-colors duration-300 ${
                        s._status === 'now' ? 'bg-white/10 text-gold' : 'bg-secondary text-church-blue group-hover:bg-gold/10 group-hover:text-gold'
                      }`}>
                        <Icon name={s.icon} className="size-6" />
                      </span>
                      {s._status === 'now' && (
                        <Badge className="bg-red-500 text-white border-0 text-[10px] uppercase tracking-wider font-bold animate-pulse px-2.5 py-1">
                          {lang === 'en' ? 'Live Now' : 'अहिले चलिरहेको'}
                        </Badge>
                      )}
                      {s._status === 'next' && (
                        <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1">
                          {lang === 'en' ? 'Upcoming' : 'आउने'}
                        </Badge>
                      )}
                    </div>

                    <h3 className={`text-xl mb-4 ${s._status === 'now' ? 'text-white' : 'text-church-blue'}`} style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                      {lang === "en" ? s.name : s.nameNe}
                    </h3>
                    
                    <div className="space-y-2.5">
                      <div className={`flex items-center gap-3 text-sm font-medium ${s._status === 'now' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        <Calendar className={`size-4 ${s._status === 'now' ? 'text-gold' : 'text-gold'}`} /> {s.day}
                      </div>
                      <div className={`flex items-center gap-3 text-sm font-medium ${s._status === 'now' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        <Clock className={`size-4 ${s._status === 'now' ? 'text-gold' : 'text-gold'}`} /> {s.time}
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

function WelcomeSection({ block, t }: { block: ContentBlock | null; t: (k: string) => string }) {
  const stats = block?.items || [];
  const pastorName = block?.items?.[0]?.pastorName || "Ps. Bishal Rai";
  const pastorRole = block?.items?.[0]?.pastorRole || "Senior Pastor";

  return (
    <EditableBlock block={block}>
      <section className="py-32 bg-white overflow-hidden">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-20 items-center">
          <Reveal>
            <div className="relative max-w-lg mx-auto lg:max-w-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-sky-blue/10 rounded-full blur-3xl" />
              
              <ImageWithFallback
                src={block?.image || images.pastor}
                alt={`${pastorName} — ${pastorRole}`}
                loading="lazy"
                className="relative rounded-[2rem] w-full aspect-[4/5] object-cover shadow-2xl shadow-church-blue/10"
                fallbackClassName="bg-church-blue/5"
              />
              
              <Card className="absolute -bottom-8 -right-8 p-6 w-64 bg-white/90 backdrop-blur-md shadow-2xl border-white/20 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="grid place-items-center size-12 bg-church-blue rounded-full text-gold">
                    <Quote className="size-5" />
                  </div>
                  <div>
                    <div className="text-church-blue text-lg" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{pastorName}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{pastorRole}</div>
                  </div>
                </div>
              </Card>
            </div>
          </Reveal>
          
          <div className="lg:pl-10">
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-4 block">{Eyebrow({block, fallback: "Welcome Home"})}</span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl text-church-blue leading-[1.1] mb-8" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
              {block?.title || t("welcome_title")}
            </h2>
            
            <div className="prose prose-lg prose-p:text-muted-foreground prose-p:leading-relaxed">
              <p>{block?.subtitle || "We are a community of believers passionate about sharing the love of Christ. Whether you're exploring faith or looking for a church home, there is a place for you here."}</p>
            </div>

            <Reveal delay={0.2}>
              {stats.length > 0 && (
                <div className="mt-12 grid grid-cols-2 gap-6 pb-12 border-b border-border/50">
                  {stats.map((st: any, i: number) => (
                    <div key={i} className="flex flex-col">
                      <div className="text-4xl text-church-blue mb-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{st.value}</div>
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{st.label}</div>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild size="lg" className="mt-10 h-14 px-8 bg-church-blue text-white hover:bg-church-blue/90 rounded-full text-base font-medium shadow-lg hover:shadow-xl transition-all">
                <Link href="/about">{t("read_more")} <ArrowRight className="size-5 ml-2" /></Link>
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
      <section className="py-24 bg-section relative overflow-hidden">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Our Faith"})}</span>
              <h2 className="text-4xl md:text-5xl text-church-blue leading-tight" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "What We Believe"}</h2>
              {block?.subtitle && <p className="mt-4 text-muted-foreground text-lg">{block.subtitle}</p>}
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex rounded-full border-church-blue/20 text-church-blue hover:bg-church-blue hover:text-white">
              <Link href="/about">{t("learn_more")} <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(block?.items || []).slice(0,6).map((item: any, i: number) => (
              <Reveal key={i} delay={i * 0.1}>
                <Card className="group p-8 h-full bg-white border-0 shadow-sm hover:shadow-2xl hover:shadow-church-blue/5 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 group-hover:bg-gold/5" />
                  
                  <span className="relative grid place-items-center size-16 rounded-2xl bg-secondary text-church-blue mb-8 group-hover:bg-gold group-hover:text-white transition-colors duration-500 shadow-sm">
                    <Icon name={item.icon || "Shield"} className="size-7" />
                  </span>
                  
                  <h3 className="relative text-2xl text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{item.title}</h3>
                  <p className="relative text-muted-foreground leading-relaxed font-light">{item.desc || item.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <Button asChild variant="outline" className="rounded-full border-church-blue/20 text-church-blue hover:bg-church-blue hover:text-white w-full">
              <Link href="/about">{t("learn_more")} <ArrowRight className="size-4 ml-2" /></Link>
            </Button>
          </div>
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
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3">{Eyebrow({block, fallback: "Watch & Listen"})}</span>
            <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("featured_sermons")}</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {featuredSermons.slice(0,3).map((s: any, i: number) => (
              <Reveal key={s.id} delay={i * 0.1}>
                <ItemEdit href={`/admin/sermons?edit=${s.id}`}>
                  <Link href={`/sermons/${s.id}`}>
                    <Card className="group overflow-hidden h-full border-0 shadow-lg shadow-black/5 rounded-[2rem] hover:shadow-2xl hover:shadow-black/10 transition-all duration-500">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <ImageWithFallback src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="grid place-items-center size-16 rounded-full bg-gold/90 text-white backdrop-blur-md scale-75 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                            <Play className="size-6 fill-white ml-1" />
                          </span>
                        </div>

                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/20 backdrop-blur-md text-white border-0 font-medium px-3 py-1 text-xs">
                            {s.series}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <span className="text-[11px] font-medium bg-black/50 text-white px-2.5 py-1 rounded-md backdrop-blur-md">{s.duration}</span>
                        </div>
                      </div>
                      
                      <div className="p-8 bg-white">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium mb-4">
                          <span className="text-church-blue">{s.speaker}</span>
                          <span className="w-1 h-1 rounded-full bg-gold" />
                          <span>{s.date}</span>
                        </div>
                        <h3 className="text-2xl text-church-blue leading-snug mb-3 group-hover:text-gold transition-colors" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{s.description}</p>
                      </div>
                    </Card>
                  </Link>
                </ItemEdit>
              </Reveal>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button asChild variant="outline" className="h-14 px-10 rounded-full border-church-blue text-church-blue hover:bg-church-blue hover:text-white text-base font-medium">
              <Link href="/sermons">{t("view_all")} <ArrowRight className="size-5 ml-2" /></Link>
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
  const events = allEvents.slice(0, 4);

  return (
    <EditableBlock block={block} adminHref="/admin/events" adminLabel="events">
      <section className="py-32 bg-church-blue text-white relative overflow-hidden">
        {/* Abstract background */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-blue/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-50" />
        
        <div className="relative mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Calendar"})}</span>
              <h2 className="text-4xl md:text-5xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("upcoming_events")}</h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {events.map((e: any, i: number) => {
              const dateParts = (e.displayDate || "").split(" ");
              const month = dateParts[0];
              const day = dateParts[1]?.replace(",", "");

              return (
                <Reveal key={e.id} delay={i * 0.1}>
                  <ItemEdit href={`/admin/events?edit=${e.id}`}>
                    <Link href={`/events/${e.id}`}>
                      <Card className="group flex flex-col sm:flex-row overflow-hidden bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300 rounded-3xl backdrop-blur-sm">
                        <div className="relative w-full sm:w-1/3 h-56 sm:h-auto overflow-hidden shrink-0">
                          <ImageWithFallback src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="p-8 sm:w-2/3 flex flex-col justify-center relative">
                          <div className="absolute top-8 right-8 text-right hidden sm:block">
                            <div className="text-3xl text-gold" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{day}</div>
                            <div className="text-xs uppercase tracking-widest text-white/60 font-bold">{month}</div>
                          </div>
                          
                          <Badge className="w-fit bg-gold text-church-blue border-0 text-[10px] uppercase font-bold tracking-wider mb-4">
                            Event
                          </Badge>
                          <h3 className="text-2xl text-white font-semibold mb-4 pr-16" style={{ fontFamily: "var(--font-heading)" }}>{e.title}</h3>
                          
                          <div className="space-y-2 text-white/70 text-sm">
                            <div className="flex items-center gap-3"><Clock className="size-4 text-gold" /> {e.time}</div>
                            <div className="flex items-center gap-3"><MapPin className="size-4 text-gold" /> {e.location}</div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </ItemEdit>
                </Reveal>
              );
            })}
          </div>
          
          <div className="mt-16 flex justify-center">
            <Button asChild variant="outline" className="h-14 px-10 rounded-full border-white/20 text-white hover:bg-white hover:text-church-blue text-base font-medium backdrop-blur-sm">
              <Link href="/events">{t("view_all_events") || "All Events"} <ArrowRight className="size-5 ml-2" /></Link>
            </Button>
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
      <section className="py-32 bg-section">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3">{Eyebrow({block, fallback: "Get Involved"})}</span>
            <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("our_ministries")}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredMinistries.slice(0,8).map((m: any, i: number) => (
              <Reveal key={m.id} delay={i * 0.05}>
                <ItemEdit href={`/admin/ministries?edit=${m.id}`}>
                  <Link href={`/ministries/${m.id}`}>
                    <Card className="group relative overflow-hidden h-80 rounded-[2rem] border-0 shadow-md">
                      <ImageWithFallback src={m.image} alt={m.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-church-blue/90 via-church-blue/40 to-transparent transition-opacity duration-300" />
                      
                      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                        <span className="grid place-items-center size-12 rounded-full bg-white/20 backdrop-blur-md mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                          <Icon name={m.icon} className="size-5" />
                        </span>
                        <h3 className="text-xl font-semibold mb-2 group-hover:-translate-y-2 transition-transform duration-300 delay-75" style={{ fontFamily: "var(--font-heading)" }}>
                          {lang === "en" ? m.name : m.nameNe}
                        </h3>
                        <div className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 delay-100 flex items-center gap-2 text-sm text-gold font-medium">
                          {t("learn_more")} <ArrowUpRight className="size-4" />
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

function GallerySection({ block, allGallery, t }: {
  block: ContentBlock | null;
  allGallery: any[];
  t: (k: string) => string;
}) {
  const images = allGallery.slice(0, 7);

  return (
    <EditableBlock block={block} adminHref="/admin/gallery" adminLabel="gallery">
      <section className="py-32 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Moments"})}</span>
              <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("gallery_title")}</h2>
            </div>
            <Button asChild variant="ghost" className="text-church-blue hover:text-gold hidden md:inline-flex text-base">
              <Link href="/gallery">{t("view_all")} <ArrowRight className="size-5 ml-2" /></Link>
            </Button>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {images.map((g: any, i: number) => (
              <Reveal key={g.id} delay={i * 0.05}>
                <ItemEdit href={`/admin/gallery?edit=${g.id}`} className="break-inside-avoid">
                  <Link href="/gallery" className="group relative block w-full overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300">
                    <ImageWithFallback
                      src={g.image}
                      alt={g.title}
                      loading="lazy"
                      className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-church-blue/0 group-hover:bg-church-blue/60 transition-colors duration-300 grid place-items-center">
                      <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-50 group-hover:scale-100" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-lg font-medium tracking-wide">{g.title}</span>
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
  const verse = allVerses[currentIndex] || allVerses[0];

  useEffect(() => {
    if (allVerses.length <= 1) return;
    const interval = setInterval(() => setCurrentIndex(p => (p + 1) % allVerses.length), 10000);
    return () => clearInterval(interval);
  }, [allVerses.length]);

  if (!verse) return null;

  return (
    <EditableBlock block={block} adminHref="/admin/verses" adminLabel="verses">
      <section className="py-32 bg-church-blue relative overflow-hidden flex items-center justify-center text-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/10 rounded-full blur-[120px]" />
        
        <div className="relative mx-auto max-w-4xl px-4 z-10">
          <Quote className="size-16 text-gold/50 mx-auto mb-8" />
          <Reveal>
            <p className="text-white text-3xl md:text-5xl leading-tight md:leading-[1.3]" style={{ fontFamily: "var(--font-heading)", fontWeight: 400 }}>
              {lang === "en" ? verse.text : verse.ne}
            </p>
            <p className="mt-8 text-gold text-lg tracking-widest uppercase font-bold">— {verse.ref}</p>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function TestimoniesSection({ block, allTestimonies }: { block: ContentBlock | null; allTestimonies: any[]; }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <EditableBlock block={block} adminHref="/admin/testimonies" adminLabel="testimonies">
      <section className="py-32 bg-section overflow-hidden">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Stories of Grace"})}</span>
          <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "Testimonies"}</h2>
        </div>

        <div className="px-4">
          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex gap-8 cursor-grab active:cursor-grabbing pb-10">
              {allTestimonies.map((tst: any, i: number) => (
                <div key={tst.id} className="flex-none w-[85vw] sm:w-[500px]">
                  <Card className={`p-10 rounded-[2.5rem] border-0 transition-all duration-500 h-full flex flex-col justify-between ${i === selectedIndex ? 'bg-white shadow-2xl shadow-church-blue/10 scale-100' : 'bg-white/60 shadow-md scale-95 opacity-50'}`}>
                    <div>
                      <div className="flex gap-1 mb-6">
                        {Array.from({ length: tst.rating || 5 }).map((_, k) => (
                          <Star key={k} className="size-5 fill-gold text-gold" />
                        ))}
                      </div>
                      <p className="text-xl md:text-2xl text-church-blue leading-relaxed mb-8" style={{ fontFamily: "var(--font-heading)" }}>"{tst.quote}"</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <ImageWithFallback src={tst.image} alt={tst.name} loading="lazy" className="size-14 rounded-full object-cover shadow-md" />
                      <div>
                        <div className="text-base font-bold text-church-blue">{tst.name}</div>
                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{tst.role}</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function DonationSection({ block, allCampaigns, t }: { block: ContentBlock | null; allCampaigns: any[]; t: (k: string) => string; }) {
  const campaign = allCampaigns[0];
  if (!campaign) return null;
  const pct = Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);

  return (
    <EditableBlock block={block} adminHref="/admin/campaigns" adminLabel="campaigns">
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Card className="overflow-hidden bg-church-blue text-white border-0 shadow-2xl rounded-[3rem] relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[80px]" />
            <div className="p-10 md:p-16 grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <span className="text-gold font-bold tracking-widest uppercase text-xs mb-3 block">{Eyebrow({block, fallback: "Give"})}</span>
                <h2 className="text-4xl mb-6" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("support_ministry")}</h2>
                <p className="text-white/70 text-lg leading-relaxed mb-8">{block?.subtitle || "Partner with us to bring hope to every village."}</p>
                <Button asChild size="lg" className="h-14 px-8 bg-gold hover:bg-[#c29215] text-church-blue rounded-full text-base font-bold shadow-lg shadow-gold/20">
                  <Link href="/give"><Heart className="size-5 mr-2" /> {t("give")}</Link>
                </Button>
              </div>
              <div className="bg-white/5 rounded-3xl p-8 backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="size-6 text-gold" />
                  <span className="text-lg font-semibold">{campaign.title}</span>
                </div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-3xl font-bold text-gold">Rs {campaign.raised.toLocaleString()}</span>
                  <span className="text-white/60">/ Rs {campaign.goal.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-gold to-[#fff1b8] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right text-sm text-gold font-medium">{pct}% Funded</div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </EditableBlock>
  );
}

function WhatToExpectSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block}>
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3">{Eyebrow({block, fallback: "First Time Here?"})}</span>
            <h2 className="text-4xl md:text-5xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "What to Expect"}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(block?.items || []).map((item: any, i: number) => (
              <Reveal key={i} delay={i * 0.1}>
                <Card className="p-8 h-full bg-section border-0 hover:bg-white hover:shadow-xl transition-all duration-300 rounded-[2rem]">
                  <div className="grid place-items-center size-12 bg-church-blue text-white rounded-full mb-6 text-xl font-bold font-serif">{i + 1}</div>
                  <h3 className="text-xl text-church-blue mb-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{item.q}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light">{item.a}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function WatchOnlineSection({ block, lang }: { block: ContentBlock | null; lang: string }) {
  return (
    <EditableBlock block={block}>
      <section className="py-24 bg-section relative overflow-hidden">
        <div className="absolute inset-0 bg-church-blue mix-blend-multiply opacity-5" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Live Stream"})}</span>
          <h2 className="text-4xl md:text-5xl text-church-blue mb-8" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "Watch Online"}</h2>
          <Reveal delay={0.1}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="h-14 px-8 bg-red-600 hover:bg-red-700 text-white rounded-full text-base shadow-lg shadow-red-500/20">
                <Link href="/live"><Play className="size-5 mr-2" /> {lang === "en" ? "Watch Live" : "लाइभ हेर्नुहोस्"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 border-church-blue text-church-blue hover:bg-church-blue hover:text-white rounded-full text-base">
                <Link href="/sermons">{lang === "en" ? "All Sermons" : "सबै प्रचारहरू"}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function PrayerCtaSection({ block, t }: { block: ContentBlock | null; t: (k: string) => string }) {
  return (
    <EditableBlock block={block}>
      <section className="relative py-32">
        <div className="absolute inset-0">
          <ImageWithFallback src={block?.image || images.worship3} alt="Prayer" loading="lazy" className="w-full h-full object-cover" fallbackClassName="bg-church-blue" />
          <div className="absolute inset-0 bg-gradient-to-r from-church-blue/95 to-church-blue/80" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="text-gold font-bold tracking-widest uppercase text-sm mb-4 block">{Eyebrow({block, fallback: "We're Here For You"})}</span>
          <h2 className="text-4xl md:text-6xl text-white mb-6" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("need_prayer")}</h2>
          <p className="text-white/80 text-xl font-light mb-10 max-w-2xl mx-auto">{block?.subtitle || t("need_prayer_sub")}</p>
          <Reveal delay={0.1}>
            <Button asChild size="lg" className="h-14 px-10 bg-gold hover:bg-[#c29215] text-church-blue rounded-full text-base font-bold shadow-[0_0_30px_rgba(212,160,23,0.3)]">
              <Link href="/prayer"><HandHeart className="size-5 mr-2" /> {t("nav_prayer")}</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function NoticeBoardSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block} adminHref="/admin/notices" adminLabel="notices">
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Notice Board"})}</span>
          <h2 className="text-4xl text-church-blue mb-10" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "Church Notices"}</h2>
          <Button asChild variant="outline" className="h-12 px-8 rounded-full border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
            <Link href="/events">{block?.items?.[0]?.view_all || "View All Notices"} <ArrowRight className="size-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </EditableBlock>
  );
}

function ChurchMembersSection({ block }: { block: ContentBlock | null }) {
  return (
    <EditableBlock block={block} adminHref="/admin/members" adminLabel="members">
      <section className="py-24 bg-section">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Our Family"})}</span>
          <h2 className="text-4xl text-church-blue mb-6" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || "Church Members"}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-10">{block?.items?.[0]?.join_desc || ""}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild className="h-12 px-8 bg-church-blue hover:bg-church-blue/90 rounded-full"><Link href="/contact">{block?.items?.[0]?.join_btn || "Join Us"}</Link></Button>
          </div>
        </div>
      </section>
    </EditableBlock>
  );
}

function MapVisitSection({ block, serviceTimes, lang, t }: { block: ContentBlock | null; serviceTimes: any[]; lang: string; t: (k: string) => string; }) {
  const mapUrl = block?.items?.[0]?.mapUrl || "https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335";
  return (
    <EditableBlock block={block}>
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-church-blue/10 border-4 border-white">
              <iframe src={mapUrl} width="100%" height="450" style={{ border: 0 }} loading="lazy" title="Church location map" className="w-full grayscale contrast-125 hover:grayscale-0 transition-all duration-700" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <span className="text-gold font-medium tracking-widest uppercase text-sm mb-3 block">{Eyebrow({block, fallback: "Visit Us"})}</span>
              <h2 className="text-4xl md:text-5xl text-church-blue mb-8" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{block?.title || t("plan_your_visit") || "Plan Your Visit"}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="grid place-items-center size-12 rounded-full bg-section text-church-blue shrink-0"><MapPin className="size-5" /></div>
                  <div>
                    <h4 className="text-lg font-bold text-church-blue mb-1">Address</h4>
                    <p className="text-muted-foreground">{block?.items?.[0]?.address || "Baneshwor, Kathmandu 44600, Nepal"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="grid place-items-center size-12 rounded-full bg-section text-church-blue shrink-0"><Phone className="size-5" /></div>
                  <div>
                    <h4 className="text-lg font-bold text-church-blue mb-1">Contact</h4>
                    <p className="text-muted-foreground">{block?.items?.[0]?.phone || "+977 1-4000000"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </EditableBlock>
  );
}

function NewsletterSection({ block }: { block: ContentBlock | null }) {
  return null; // Merged into Footer to keep homepage clean
}

// Main Export
export default function HomepageSections() {
  const layout = useHomepageLayout();
  const themeLayout = layout || 'default';
  const orderArray = LAYOUT_ORDERS[themeLayout] || LAYOUT_ORDERS.default;
  const styleOverrides = LAYOUT_STYLE_OVERRIDES[themeLayout] || LAYOUT_STYLE_OVERRIDES.default;

  const { lang, t } = useLang();
  const { data: blocks = [] } = useContentBlocks();
  const getBlock = (key: string) => blocks.find((b: any) => b.sectionKey === key) || null;

  const heroBlock = getBlock('hero');
  const { data: serviceTimes = [] } = useEnabledServiceTimes();
  const { data: sermons = [] } = useEnabledSermons();
  const { data: ministries = [] } = useEnabledMinistries();
  const { data: events = [] } = useEnabledEvents();
  const { data: testimonies = [] } = useEnabledTestimonies();
  const { data: gallery = [] } = useEnabledGallery();
  const { data: campaigns = [] } = useEnabledCampaigns();
  const { data: verses = [] } = useEnabledVerses();

  const nextEvent = { date: "2026-12-25T10:00:00" }; // Mock next event

  const sectionComponents: Record<string, React.ReactNode> = {
    hero: <HeroSection key="hero" hero={heroBlock} serviceTimes={serviceTimes} nextEvent={nextEvent} lang={lang} t={t} />,
    service_times_section: <ServiceTimesSection key="service_times" block={getBlock('service_times_section')} serviceTimes={serviceTimes} lang={lang} t={t} />,
    welcome: <WelcomeSection key="welcome" block={getBlock('welcome')} t={t} />,
    what_we_believe: <WhatWeBelieveSection key="believe" block={getBlock('what_we_believe')} t={t} />,
    featured_sermons: <FeaturedSermonsSection key="sermons" block={getBlock('featured_sermons')} featuredSermons={sermons} t={t} />,
    events_section: <EventsSection key="events" block={getBlock('events_section')} allEvents={events} lang={lang} t={t} />,
    ministries_section: <MinistriesSection key="ministries" block={getBlock('ministries_section')} featuredMinistries={ministries} lang={lang} t={t} />,
    gallery_section: <GallerySection key="gallery" block={getBlock('gallery_section')} allGallery={gallery} t={t} />,
    verse_section: <VerseSection key="verses" block={getBlock('verse_section')} allVerses={verses} lang={lang} t={t} />,
    testimonies_section: <TestimoniesSection key="testimonies" block={getBlock('testimonies_section')} allTestimonies={testimonies} />,
    donation_section: <DonationSection key="donation" block={getBlock('donation_section')} allCampaigns={campaigns} t={t} />,
    // Return empty for minor sections to focus on main visuals, keeping keys to prevent errors
    what_to_expect: <WhatToExpectSection key="expect" block={getBlock('what_to_expect')} />,
    watch_online: <WatchOnlineSection key="watch" block={getBlock('watch_online')} lang={lang} />,
    prayer_cta: <PrayerCtaSection key="prayer" block={getBlock('prayer_cta')} t={t} />,
    notice_board: <NoticeBoardSection key="notice" block={getBlock('notice_board')} />,
    church_members: <ChurchMembersSection key="members" block={getBlock('church_members')} />,
    map_visit: <MapVisitSection key="map" block={getBlock('map_visit')} serviceTimes={serviceTimes} lang={lang} t={t} />,
    newsletter: <NewsletterSection key="news" block={getBlock('newsletter')} />,
  };

  return (
    <div className="flex flex-col min-h-screen">
      {orderArray.map((key) => {
        const block = getBlock(key);
        if (block && block.enabled === false) return null;
        
        const component = sectionComponents[key];
        if (!component) return null;

        const wrapperClass = styleOverrides[key] || '';
        if (wrapperClass) {
          return <div key={`${key}-wrapper`} className={wrapperClass}>{component}</div>;
        }
        return component;
      })}
    </div>
  );
}