'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link';
import { ArrowLeft, Clock, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { useMinistry, useMinistries } from "@/lib/hooks";
import { DetailSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

export default function MinistryDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { data: ministry, isLoading, error, refetch } = useMinistry(id);
  const { data: allMinistries = [] } = useMinistries();

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="py-32">
        <ErrorDisplay message="Failed to load ministry." onRetry={() => refetch()} />
        <div className="text-center mt-4">
          <Button asChild variant="outline"><Link href="/ministries"><ArrowLeft className="size-4" /> {t("back_to_ministries")}</Link></Button>
        </div>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-2xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {t("ministry_not_found")}
        </h1>
        <Button asChild className="mt-6 bg-church-blue hover:bg-church-blue/90">
          <Link href="/ministries"><ArrowLeft className="size-4" /> {t("back_to_ministries")}</Link>
        </Button>
      </div>
    );
  }

  const related = ministry ? allMinistries.filter((m) => m.id !== ministry.id).slice(0, 3) : [];

  return (
    <div>
      <PageHero title={lang === "en" ? ministry.name : ministry.nameNe} crumb="Ministries" image={ministry.image}
        subtitle={ministry.description} />

      <section className="py-12 bg-section">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Reveal>
                <div className="flex items-center gap-4 mb-6">
                  <span className="grid place-items-center size-14 rounded-xl bg-church-blue/10 text-church-blue">
                    <Icon name={ministry.icon} className="size-7" />
                  </span>
                  <div>
                    <h1 className="text-3xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                      {lang === "en" ? ministry.name : ministry.nameNe}
                    </h1>
                    {lang === "ne" && <p className="text-muted-foreground">{ministry.name}</p>}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
                  <ImageWithFallback src={ministry.image} alt={ministry.name} className="w-full h-full object-cover" />
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <h2 className="text-xl text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                  {t("ministry_info")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{ministry.description}</p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {lang === "en"
                    ? `The ${ministry.name} meets regularly to grow in faith, build community, and serve others. Whether you're new to church or have been following Jesus for years, there's a place for you here.`
                    : `${ministry.nameNe} नियमित रूपमा विश्वासमा बढ्न, समुदाय बनाउन र अरूलाई सेवा गर्न भेट हुन्छ। तपाईं चर्चमा नयाँ हुनुहुन्छ वा वर्षौंदेखि येशूको अनुसरण गर्दै हुनुहुन्छ, तपाईंको लागि यहाँ ठाउँ छ।`}
                </p>
              </Reveal>
            </div>

            <div className="space-y-6">
              <Reveal delay={0.2}>
                <Card className="p-6 border-border/60">
                  <h3 className="text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {t("ministry_info")}
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <User className="size-4 text-gold mt-0.5 shrink-0" />
                      <div>
                        <div className="text-muted-foreground">{t("led_by")}</div>
                        <div className="font-medium">{ministry.leader}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="size-4 text-gold mt-0.5 shrink-0" />
                      <div>
                        <div className="text-muted-foreground">{t("meeting_schedule")}</div>
                        <div className="font-medium">{ministry.meeting}</div>
                      </div>
                    </div>
                  </div>

                  <Button asChild className="mt-6 w-full bg-church-blue hover:bg-church-blue/90">
                    <Link href="/contact">{t("join_ministry")} <ArrowRight className="size-4" /></Link>
                  </Button>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <Reveal>
              <h2 className="text-2xl text-church-blue text-center" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                {t("related_ministries")}
              </h2>
            </Reveal>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.08}>
                  <Link href={`/ministries/${m.id}`}>
                    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-3 left-3 grid place-items-center size-10 rounded-xl bg-white/90 text-church-blue"><Icon name={m.icon} className="size-5" /></span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                          {lang === "en" ? m.name : m.nameNe}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
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
