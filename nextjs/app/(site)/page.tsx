'use client'

import Link from 'next/link';
import { motion } from "motion/react";
import {
  Play, Calendar, Clock, MapPin, ArrowRight, Quote, Star, Share2, HandHeart, ChevronRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { CountUp } from "@/components/site/CountUp";
import { Countdown } from "@/components/site/Countdown";
import { Icon } from "@/components/site/Icon";
import { NoticeBoard } from "@/components/site/NoticeBoard";
import { ChurchMembers } from "@/components/site/ChurchMembers";
import { WhatToExpect } from "@/components/site/WhatToExpect";
import { WhatWeBelieve } from "@/components/site/WhatWeBelieve";
import { WatchOnline } from "@/components/site/WatchOnline";

import { useLang } from "@/lib/language";
import { toBS } from "@/lib/nepaliDate";
import { images, stats } from "@/lib/data";
import {
  useServiceTimes, useSermons, useMinistries, useEvents,
  useTestimonies, useGallery, useCampaigns, useVerses,
} from "@/lib/hooks";

export default function Home() {
  const { t, lang } = useLang();
  const { data: allServiceTimes = [] } = useServiceTimes();
  const { data: allSermons = [] } = useSermons();
  const { data: allMinistries = [] } = useMinistries();
  const { data: allEvents = [] } = useEvents();
  const { data: allTestimonies = [] } = useTestimonies();
  const { data: allGallery = [] } = useGallery();
  const { data: allCampaigns = [] } = useCampaigns();
  const { data: allVerses = [] } = useVerses();
  const serviceTimes = allServiceTimes;
  const featuredSermons = allSermons.slice(0, 3);
  const featuredMinistries = allMinistries.slice(0, 6);
  const verse = allVerses[0] ?? { text: "", ref: "", ne: "" };
  const nextEvent = allEvents[0] ?? { date: "", title: "" };

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback src={images.hero} alt="Worshippers with hands raised" className="w-full h-full object-cover" />
          <div className="absolute inset-0 gradient-hero-br" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-5">{t("tagline")}</Badge>
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 800, lineHeight: 1.05 }}>
              {t("hero_welcome")}
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90">
                <Link href="/visit"><Sparkles className="size-4" /> {t("nav_visit")} · {lang === "en" ? "Plan Your Visit" : "भ्रमण योजना"} <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white">
                <Link href="/sermons"><Play className="size-4" /> {t("hero_watch")}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/prayer"><HandHeart className="size-4" /> {t("hero_pray")}</Link>
              </Button>
            </div>
          </motion.div>

          {/* Floating next-service card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-14 max-w-md"
          >
            <Card className="p-5 bg-white/95 backdrop-blur border-0 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{lang === "en" ? "Next Service" : "अर्को सेवा"}</span>
                <Badge className="bg-success/10 text-success border-0">Live Soon</Badge>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center size-11 rounded-xl bg-church-blue text-white"><Icon name="Church" className="size-5" /></span>
                <div>
                  <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Sunday Worship</div>
                  <div className="text-sm text-muted-foreground">Sunday · 10:00 AM · Kathmandu</div>
                </div>
              </div>
              <Countdown date={nextEvent.date} />
            </Card>
          </motion.div>
        </div>
      </section>


      {/* ---------- Service Times ---------- */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Join Us" title={t("service_times")} subtitle={lang === "en" ? "There's a place for everyone in the family of God. Come as you are." : "परमेश्वरको परिवारमा सबैका लागि ठाउँ छ। जस्तो हुनुहुन्छ, त्यस्तै आउनुहोस्।"} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {serviceTimes.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <Card className="group p-6 h-full border-border/60 hover:border-gold hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <span className="grid place-items-center size-12 rounded-xl bg-secondary text-church-blue group-hover:bg-gold group-hover:text-church-blue transition-colors">
                    <Icon name={s.icon} className="size-6" />
                  </span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {lang === "en" ? s.name : s.nameNe}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="size-4 text-gold" /> {s.day}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4 text-gold" /> {s.time}</div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- What to Expect (first-time visitors) ---------- */}
      <WhatToExpect />

      {/* ---------- Welcome / Pastor ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <ImageWithFallback src={images.pastor} alt="Senior Pastor" loading="lazy" className="rounded-3xl w-full aspect-[4/5] object-cover shadow-xl" />
              <Card className="absolute -bottom-6 -right-2 sm:right-6 p-4 max-w-[220px] shadow-xl border-0">
                <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Ps. Bishal Rai</div>
                <div className="text-sm text-muted-foreground">Senior Pastor</div>
              </Card>
            </div>
          </Reveal>
          <div>
            <SectionHeading center={false} eyebrow="Welcome" title={t("welcome_title")}
              subtitle={lang === "en"
                ? "Dear friend, whether you are exploring faith for the first time or looking for a church home, you are so welcome here. Our prayer is that you would encounter the love of Jesus and find a family that walks with you."
                : "प्रिय मित्र, तपाईं पहिलो पटक विश्वास खोज्दै हुनुहुन्छ वा मण्डली खोज्दै, तपाईंलाई यहाँ स्वागत छ। हाम्रो प्रार्थना छ कि तपाईंले येशूको प्रेम अनुभव गर्नुहुनेछ।"} />
            <Reveal delay={0.1}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((st) => (
                  <div key={st.id} className="text-center rounded-2xl bg-section p-4">
                    <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem" }}>
                      <CountUp value={st.value} suffix={st.suffix} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{st.label}</div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-8 bg-church-blue hover:bg-church-blue/90">
                <Link href="/pastor">{t("read_more")} <ArrowRight className="size-4" /></Link>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- What We Believe ---------- */}
      <WhatWeBelieve />

      {/* ---------- Watch Online / Live ---------- */}
      <WatchOnline />

      {/* ---------- Featured Sermons ---------- */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <SectionHeading center={false} eyebrow="Watch & Listen" title={t("featured_sermons")} />
            <Button asChild variant="ghost" className="text-church-blue hover:text-gold hidden sm:inline-flex">
              <Link href="/sermons">{t("view_all")} <ChevronRight className="size-4" /></Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredSermons.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <Link href={`/sermons/${s.id}`}>
                  <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                    <div className="relative aspect-video overflow-hidden">
                      <ImageWithFallback src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                        <span className="grid place-items-center size-14 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform">
                          <Play className="size-6 fill-church-blue" />
                        </span>
                      </div>
                      <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{s.series}</Badge>
                      <span className="absolute bottom-3 right-3 text-xs bg-church-blue/90 text-white px-2 py-1 rounded-md">{s.duration}</span>
                    </div>
                    <div className="p-5">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">{s.speaker} · {s.date}</div>
                      <h3 className="mt-2 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-gold text-sm font-medium">
                        {t("watch_now")} <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Ministries ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Get Involved" title={t("our_ministries")} subtitle={lang === "en" ? "Discover a ministry where you can grow, serve and belong." : "बढ्न, सेवा गर्न र सम्बन्धित हुन सक्ने सेवाकार्य पत्ता लगाउनुहोस्।"} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredMinistries.map((m, i) => (
              <Reveal key={m.id} delay={i * 0.06}>
                <Link href={`/ministries/${m.id}`}>
                  <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all duration-300 gap-0">
                    <div className="relative h-44 overflow-hidden">
                      <ImageWithFallback src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute top-3 left-3 grid place-items-center size-10 rounded-xl bg-white/90 text-church-blue"><Icon name={m.icon} className="size-5" /></span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? m.name : m.nameNe}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-gold text-sm font-medium">
                        {t("learn_more")} <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
              <Link href="/ministries">{t("view_all")} <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Upcoming Events ---------- */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Mark Your Calendar" title={t("upcoming_events")} />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {allEvents.slice(0, 2).map((e, i) => (
              <Reveal key={e.id} delay={i * 0.08}>
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
                        <div className="flex items-center gap-2"><Calendar className="size-4 text-gold" /> {toBS(e.date, lang)}</div>
                        <div className="flex items-center gap-2"><MapPin className="size-4 text-gold" /> {e.location}</div>
                      </div>
                      <div className="mt-4"><Countdown date={e.date} /></div>
                      <span className="mt-4 inline-flex items-center gap-1 text-gold text-sm font-medium">
                        {t("register")} <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Prayer CTA ---------- */}
      <section className="relative py-24">
        <div className="absolute inset-0">
          <ImageWithFallback src={images.worship3} alt="Prayer" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-church-blue/85" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <SectionHeading light eyebrow="We're Here For You" title={t("need_prayer")} subtitle={t("need_prayer_sub")} />
          <Reveal delay={0.1}>
            <Button asChild size="lg" className="mt-8 bg-gold text-church-blue hover:bg-gold/90">
              <Link href="/prayer"><HandHeart className="size-5" /> {t("nav_prayer")}</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---------- Notice Board ---------- */}
      <NoticeBoard />

      {/* ---------- Testimonies ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Stories of Grace" title={t("testimonies")} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {allTestimonies.map((tst, i) => (
              <Reveal key={tst.id} delay={i * 0.08}>
                <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                  <Quote className="size-8 text-gold/40" />
                  <p className="mt-3 text-foreground/80 leading-relaxed">"{tst.quote}"</p>
                  <div className="mt-4 flex gap-0.5">
                    {Array.from({ length: tst.rating }).map((_, k) => (
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Church Members ---------- */}
      <ChurchMembers />

      {/* ---------- Gallery preview ---------- */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="Moments" title={t("gallery_title")} />
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {allGallery.slice(0, 8).map((g, i) => (
              <Reveal key={g.id} delay={i * 0.04}>
                <Link href="/gallery" className={`group relative block overflow-hidden rounded-2xl ${i % 5 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}>
                  <ImageWithFallback src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-church-blue/0 group-hover:bg-church-blue/50 transition-colors grid place-items-end p-3">
                    <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">{g.title}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Verse of the day ---------- */}
      <section className="py-20 bg-church-blue">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="uppercase tracking-[0.25em] text-xs text-gold">{t("verse_of_day")}</span>
            <p className="mt-6 text-white text-2xl md:text-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 600, lineHeight: 1.4 }}>
              "{lang === "en" ? verse.text : verse.ne}"
            </p>
            <p className="mt-4 text-gold">— {verse.ref}</p>
            <Button variant="outline" className="mt-6 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Share2 className="size-4" /> Share
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---------- Donation ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeading center={false} eyebrow="Give" title={t("support_ministry")}
              subtitle={lang === "en" ? "Your generosity fuels the mission — reaching villages, discipling believers, and serving the community." : "तपाईंको उदारताले मिसनलाई अघि बढाउँछ — गाउँहरूमा पुग्दै, विश्वासीहरूलाई चेला बनाउँदै।"} />
            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap gap-3">
                {["eSewa", "Khalti", "Bank Transfer", "QR Code"].map((m) => (
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
                  <Card key={c.id} className="p-5 border-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</span>
                      <span className="text-sm text-gold">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-3" />
                    <div className="mt-2 text-sm text-muted-foreground">Rs {c.raised.toLocaleString()} raised of Rs {c.goal.toLocaleString()}</div>
                  </Card>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
