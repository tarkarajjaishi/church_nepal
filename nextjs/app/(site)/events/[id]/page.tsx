'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link';
import { toast } from "sonner";
import { ArrowLeft, Clock, MapPin, CalendarDays, CalendarPlus, Share2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Countdown } from "@/components/site/Countdown";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";
import { toBS } from "@/lib/nepaliDate";
import { useEvent } from "@/lib/hooks";
import { DetailSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";

function downloadICalendar(event: {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  id: string;
}) {
  const [datePart, timePart] = event.date.split('T')
  const cleanTime = (timePart || '00:00').split('.')[0].replace(/:/g, '')
  const dtstart = `${datePart.replace(/-/g, '')}T${cleanTime}`
  const [hStr, mStr, sStr] = cleanTime.match(/.{1,2}/g) || ['00', '00', '00']
  const h = (parseInt(hStr || '00', 10) + 2) % 24
  const dtend = `${datePart.replace(/-/g, '')}T${String(h).padStart(2, '0')}${mStr}${sStr}`
  const safeDesc = (event.description || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grace Nepal Church//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${safeDesc}`,
    `UID:${event.id}@gracenepal.org`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ical], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { data: event, isLoading, error, refetch } = useEvent(id);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [guests, setGuests] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="py-32">
        <ErrorDisplay message="Failed to load event." onRetry={() => refetch()} />
        <div className="text-center mt-4">
          <Button asChild variant="outline"><Link href="/events"><ArrowLeft className="size-4" /> {t("back_to_events")}</Link></Button>
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
          <Link href="/events"><ArrowLeft className="size-4" /> {t("back_to_events")}</Link>
        </Button>
      </div>
    );
  }

  const bs = toBS(event.date, lang);
  const isUpcoming = new Date(event.date).getTime() >= Date.now();

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        event_id: id,
        name,
        email,
        phone: '',
        guests: Number(guests),
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/events/${encodeURIComponent(id!)}/rsvps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit RSVP');
      }
      setSubmitted(true);
      toast.success(lang === "en" ? "You're registered!" : "तपाईं दर्ता भइसक्नुभएको छ!", { description: event.title });
    } catch (err: any) {
      toast.error(err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                      <div>
                        {submitted ? (
                          <div className="text-center py-3">
                            <span className="inline-flex items-center justify-center size-10 rounded-full bg-green-50 text-green-600 mb-2">
                              <CheckCircle2 className="size-5" />
                            </span>
                            <p className="text-sm font-medium text-church-blue">
                              {lang === "en" ? "You're registered!" : "तपाईं दर्ता भइसक्नुभएको छ!"}
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleRsvp} className="space-y-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="rsvp-name">Name</Label>
                              <Input id="rsvp-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="rsvp-email">Email</Label>
                              <Input id="rsvp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="rsvp-guests">Number of Guests</Label>
                              <Select value={guests} onValueChange={setGuests}>
                                <SelectTrigger id="rsvp-guests">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5,6,7,8].map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full bg-church-blue hover:bg-church-blue/90">
                              {loading ? (lang === "en" ? "Registering..." : "दर्ता गर्दै...") : t("register")}
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => { downloadICalendar(event); toast.success(lang === "en" ? "Added to calendar" : "क्यालेन्डरमा थपियो"); }}>
                      <CalendarPlus className="size-4" /> {t("add_to_calendar")}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(lang === "en" ? "Link copied!" : "लिङ्क कपी भयो!"); }}>
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
