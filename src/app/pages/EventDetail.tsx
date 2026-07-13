import { useParams, Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Clock, MapPin, CalendarDays, CalendarPlus, Share2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageHero } from "../components/site/PageHero";
import { Reveal } from "../components/site/Reveal";
import { Countdown } from "../components/site/Countdown";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { images } from "../lib/data";
import { useLang } from "../lib/language";
import { toBS } from "../lib/nepaliDate";
import { useEvent } from "../lib/hooks";
import { DetailSkeleton } from "../components/site/LoadingSpinner";
import { ErrorDisplay } from "../components/site/ErrorDisplay";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { data: event, isLoading, error, refetch } = useEvent(id);

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="py-32">
        <ErrorDisplay message="Failed to load event." onRetry={() => refetch()} />
        <div className="text-center mt-4">
          <Button asChild variant="outline"><Link to="/events"><ArrowLeft className="size-4" /> {t("back_to_events")}</Link></Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-2xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
          {t("event_not_found")}
        </h1>
        <Button asChild className="mt-6 bg-church-blue hover:bg-church-blue/90">
          <Link to="/events"><ArrowLeft className="size-4" /> {t("back_to_events")}</Link>
        </Button>
      </div>
    );
  }

  const bs = toBS(event.date, lang);
  const isUpcoming = new Date(event.date).getTime() >= Date.now();

  return (
    <div>
      <PageHero title={event.title} crumb="Events" image={event.image}
        subtitle={`${event.displayDate} · ${event.location}`} />

      <section className="py-12 bg-section">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Reveal>
                <div className="relative aspect-video rounded-2xl overflow-hidden">
                  <ImageWithFallback src={event.image} alt={event.title} className="w-full h-full object-cover" />
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="mt-8 text-3xl text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
                  {event.title}
                </h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">{event.description}</p>
              </Reveal>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Reveal delay={0.15}>
                <Card className="p-6 border-border/60">
                  <h3 className="text-church-blue mb-4" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {t("event_details")}
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Clock className="size-4 text-gold mt-0.5 shrink-0" />
                      <div>
                        <div className="text-muted-foreground">{t("when")}</div>
                        <div className="font-medium">{event.displayDate}{event.time ? ` · ${event.time}` : ""}</div>
                      </div>
                    </div>
                    {bs && (
                      <div className="flex items-start gap-3">
                        <CalendarDays className="size-4 text-gold mt-0.5 shrink-0" />
                        <div>
                          <div className="text-muted-foreground">{lang === "en" ? "Nepali Date" : "नेपाली मिति"}</div>
                          <div className="font-medium">{bs}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <MapPin className="size-4 text-gold mt-0.5 shrink-0" />
                      <div>
                        <div className="text-muted-foreground">{t("where")}</div>
                        <div className="font-medium">{event.location}</div>
                      </div>
                    </div>
                  </div>

                  {isUpcoming && (
                    <div className="mt-6">
                      <Countdown date={event.date} />
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    {isUpcoming && (
                      <Button className="w-full bg-church-blue hover:bg-church-blue/90" onClick={() => toast.success(lang === "en" ? "You're registered!" : "तपाईं दर्ता भइसक्नुभएको छ!", { description: event.title })}>
                        {t("register")}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => toast(lang === "en" ? "Added to calendar" : "क्यालेन्डरमा थपियो")}>
                      <CalendarPlus className="size-4" /> {t("add_to_calendar")}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => toast(lang === "en" ? "Link copied!" : "लिङ्क कपी भयो!")}>
                      <Share2 className="size-4" /> {t("share")}
                    </Button>
                  </div>
                </Card>
              </Reveal>

              <Reveal delay={0.2}>
                <Card className="p-6 border-border/60">
                  <h3 className="text-church-blue mb-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {lang === "en" ? "Location" : "स्थान"}
                  </h3>
                  <div className="rounded-xl overflow-hidden aspect-[4/3]">
                    <iframe
                      title="Event Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=85.335%2C27.695%2C85.345%2C27.705&layer=mapnik&marker=27.700%2C85.340"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{event.location}</p>
                </Card>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
