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
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { toBS } from "@/lib/nepaliDate";
import { useEvents } from "@/lib/hooks";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

const pastEvents = [
  { id: "p1", title: "Christmas Celebration 2025", displayDate: "Dec 25, 2025", location: "Main Sanctuary", image: images.crowd },
  { id: "p2", title: "Easter Sunrise Service", displayDate: "Apr 20, 2025", location: "Nagarkot Hill", image: images.praise },
  { id: "p3", title: "Village Outreach", displayDate: "Mar 8, 2025", location: "Sindhupalchok", image: images.village },
];

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

  return (
    <div>
      <PageHero title="Events" crumb="Events" image={images.worship2}
        subtitle="Gather, grow and celebrate together. There's always something happening at Grace." />

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
                <ErrorDisplay message="Failed to load events." onRetry={() => refetch()} />
              ) : upcomingEvents.length ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((e, i) => (
                    <Reveal key={e.id} delay={(i % 3) * 0.08}><EventCard e={e} upcoming /></Reveal>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No upcoming events right now — check back soon!</p>
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

