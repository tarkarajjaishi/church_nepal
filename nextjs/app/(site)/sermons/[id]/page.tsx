'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link';
import { Play, Video, Headphones, FileText, ArrowLeft, User, Calendar, Clock, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { useSermon, useSermons } from "@/lib/hooks";
import { DetailSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

export default function SermonDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { data: sermon, isLoading, error, refetch } = useSermon(id);
  const { data: allSermons = [] } = useSermons();

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="py-32">
        <ErrorDisplay message="Failed to load sermon. Please try again." onRetry={() => refetch()} />
        <div className="text-center mt-4">
          <Button asChild variant="outline"><Link href="/sermons"><ArrowLeft className="size-4" /> {t("back_to_sermons")}</Link></Button>
        </div>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-2xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {t("sermon_not_found")}
        </h1>
        <Button asChild className="mt-6 bg-church-blue hover:bg-church-blue/90">
          <Link href="/sermons"><ArrowLeft className="size-4" /> {t("back_to_sermons")}</Link>
        </Button>
      </div>
    );
  }

  const related = sermon ? allSermons
    .filter((s) => s.id !== sermon.id && (s.series === sermon.series || s.speaker === sermon.speaker))
    .slice(0, 3) : [];

  return (
    <div>
      <PageHero title={sermon.title} crumb="Sermons" image={sermon.image}
        subtitle={`${sermon.speaker} · ${sermon.series}`} />

      <section className="py-12 bg-section">
        <div className="mx-auto max-w-5xl px-4">
          <Reveal>
            <div className="relative aspect-video rounded-2xl overflow-hidden group">
              <ImageWithFallback src={sermon.image} alt={sermon.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-church-blue/30 grid place-items-center">
                <span className="grid place-items-center size-20 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform cursor-pointer">
                  <Play className="size-8 fill-church-blue" />
                </span>
              </div>
              <Badge className="absolute top-4 left-4 bg-gold text-church-blue border-0 text-sm px-3 py-1">{sermon.series}</Badge>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <Reveal>
                <h1 className="text-3xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                  {sermon.title}
                </h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">{sermon.description}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button className="bg-church-blue hover:bg-church-blue/90"><Video className="size-4" /> Video</Button>
                  <Button variant="outline"><Headphones className="size-4" /> Audio</Button>
                  <Button variant="outline"><FileText className="size-4" /> Notes</Button>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <Card className="p-6 border-border/60 h-fit">
                <h3 className="text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {t("sermon_info")}
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <User className="size-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">{t("speaker")}</div>
                      <div className="font-medium">{sermon.speaker}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="size-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">{lang === "en" ? "Date" : "मिति"}</div>
                      <div className="font-medium">{sermon.date}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="size-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">{t("duration")}</div>
                      <div className="font-medium">{sermon.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="size-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">{t("series_label")}</div>
                      <div className="font-medium">{sermon.series}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="size-4 text-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="text-muted-foreground">{t("topic_label")}</div>
                      <div className="font-medium">{sermon.topic}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <Reveal>
              <h2 className="text-2xl text-church-blue text-center" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                {t("related_sermons")}
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.08}>
                  <Link href={`/sermons/${s.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                      <div className="relative aspect-video overflow-hidden">
                        <ImageWithFallback src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                          <span className="grid place-items-center size-12 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform"><Play className="size-5 fill-church-blue" /></span>
                        </div>
                        <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{s.series}</Badge>
                      </div>
                      <div className="p-5">
                        <div className="text-xs text-muted-foreground">{s.speaker} · {s.date}</div>
                        <h3 className="mt-1 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
