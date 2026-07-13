import Link from 'next/link';
import { Play, Radio, ArrowRight, Calendar, User } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Reveal } from "./Reveal";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useLang } from "@/lib/language";
import { useSermons } from "@/lib/hooks";
import { LoadingSpinner } from "./LoadingSpinner";

export function WatchOnline() {
  const { lang } = useLang();
  const { data: sermons = [], isLoading } = useSermons();
  if (isLoading) return <section className="py-20 bg-church-blue"><LoadingSpinner className="text-white" /></section>;

  const latest = sermons[0];
  if (!latest) return null;

  return (
    <section className="py-20 bg-church-blue">
      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <Link href="/sermons" className="group relative block overflow-hidden rounded-3xl shadow-2xl">
            <ImageWithFallback src={latest.image} alt={latest.title} loading="lazy" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-church-blue/30 group-hover:bg-church-blue/45 transition-colors grid place-items-center">
              <span className="grid place-items-center size-20 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform">
                <Play className="size-8 fill-church-blue" />
              </span>
            </div>
            <Badge className="absolute top-4 left-4 bg-gold text-church-blue border-0">{latest.series}</Badge>
          </Link>
        </Reveal>

        <div className="text-white">
          <span className="inline-flex items-center gap-2 uppercase tracking-[0.25em] text-xs text-gold">
            <Radio className="size-4" /> {lang === "en" ? "Watch Online" : "अनलाइन हेर्नुहोस्"}
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, lineHeight: 1.1 }}>
            {lang === "en" ? "Can't make it in person? Worship with us online." : "व्यक्तिगत रूपमा आउन सक्नुहुन्न? हामीसँग अनलाइन आराधना गर्नुहोस्।"}
          </h2>
          <p className="mt-4 text-white/80 max-w-lg">
            {lang === "en"
              ? "Watch our latest message or join the live service every Sunday at 10:00 AM — wherever you are."
              : "हाम्रो नवीनतम सन्देश हेर्नुहोस् वा हरेक आइतबार बिहान १०:०० बजे प्रत्यक्ष सेवामा सामेल हुनुहोस्।"}
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="text-gold text-xs uppercase tracking-wide">{lang === "en" ? "Latest Message" : "नवीनतम सन्देश"}</div>
            <div className="mt-1 text-white" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{latest.title}</div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><User className="size-4 text-gold" /> {latest.speaker}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-4 text-gold" /> {latest.date}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90">
              <Link href="/live"><Radio className="size-4" /> {lang === "en" ? "Watch Live" : "प्रत्यक्ष हेर्नुहोस्"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white">
              <Link href="/sermons"><Play className="size-4" /> {lang === "en" ? "All Sermons" : "सबै प्रवचन"} <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
