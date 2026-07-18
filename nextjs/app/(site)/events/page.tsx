'use client'

import { toast } from "sonner";
import Link from 'next/link';
import { Clock, MapPin, CalendarPlus, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Countdown } from "@/components/site/Countdown";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { EditableBlock } from "@/components/site/EditableBlock";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { toBS } from "@/lib/nepaliDate";
import { useEvents, useContentBlock } from "@/lib/hooks";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

function EventCard({ e, upcoming }: { e: any; upcoming?: boolean }) {
  const { lang } = useLang();
  const bs = e.date ? toBS(e.date, lang) : "";
  return (
    <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0 flex flex-col">
      <Link href={`/events/${e.id}`} className="relative h-48 overflow-hidden block">
        <ImageWithFallback src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/events/${e.id}`}>
          <h3 className="text-church-blue hover:underline" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{e.title}</h3>
        </Link>
        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2"><Clock className="size-4 text-gold" /> {e.displayDate}{e.time ? ` · ${e.time}` : ""}</div>
          {bs && <div className="flex items-center gap-2"><CalendarDays className="size-4 text-gold" /> {bs}</div>}
          <div className="flex items-center gap-2"><MapPin className="size-4 text-gold" /> {e.location}</div>
        </div>
        {upcoming && (
          <>
            <div className="mt-4"><Countdown date={e.date} /></div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="bg-church-blue hover:bg-church-blue/90" onClick={() => toast.success("You're registered!", { description: e.title })}>Register</Button>
              <Button size="sm" variant="outline" onClick={() => toast("Added to calendar")}><CalendarPlus className="size-4" /> Add</Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

export default function Events() {
  const { data: events = [], isLoading, error, refetch } = useEvents();
  const now = Date.now();
  const upcomingEvents = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const pastEvents = events
    .filter((e) => new Date(e.date).getTime() < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hero = useContentBlock('events_hero');
  const heading = useContentBlock('events_heading');
  const errorBlock = useContentBlock('events_error');
  const emptyState = useContentBlock('events_empty_state');

  const heroTitle = hero?.title || "Events";
  const heroSubtitle = hero?.subtitle || "Gather, grow and celebrate together. There's always something happening at Grace.";
  const heroCrumb = hero?.items?.[0]?.crumb || "Events";
  const heroImage = hero?.image || images.worship2;
  const headingTitle = heading?.title || "Events";
  const errorMsg = errorBlock?.title || "Failed to load events.";
  const emptyMsg = emptyState?.title || "No upcoming events right now — check back soon!";

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero title={heroTitle} crumb={heroCrumb} image={heroImage}
          subtitle={heroSubtitle} />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Tabs defaultValue="upcoming">
            <TabsList className="mx-auto">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-10">
              {isLoading ? (
                <CardSkeleton count={3} />
              ) : error ? (
                <ErrorDisplay message={errorMsg} onRetry={() => refetch()} />
              ) : upcomingEvents.length ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((e, i) => (
                    <Reveal key={e.id} delay={(i % 3) * 0.08}><EventCard e={e} upcoming /></Reveal>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">{emptyMsg}</p>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-10">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((e, i) => (
                  <Reveal key={e.id} delay={(i % 3) * 0.08}><EventCard e={e} /></Reveal>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
