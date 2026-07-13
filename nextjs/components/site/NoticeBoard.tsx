import Link from 'next/link';
import { Bell, ArrowRight, CalendarDays } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { useNotices } from "@/lib/hooks";
import { CardSkeleton } from "./LoadingSpinner";

export function NoticeBoard() {
  const { data: notices = [], isLoading } = useNotices();
  return (
    <section className="py-20 bg-section">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow="Notice Board" title="Church Notices & Announcements"
          subtitle="Stay up to date with the latest news, events and announcements from Grace Nepal Church." />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {isLoading ? (
            <CardSkeleton count={4} />
          ) : notices.map((n, i) => (
            <Reveal key={n.id} delay={(i % 2) * 0.08}>
              <Card className={`p-6 h-full border-border/60 hover:shadow-xl transition-all ${n.urgent ? "border-l-4 border-l-gold" : ""}`}>
                <div className="flex items-start gap-4">
                  <span className={`grid place-items-center size-12 shrink-0 rounded-xl ${n.urgent ? "bg-gold-soft text-gold" : "bg-secondary text-church-blue"}`}>
                    <Bell className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-church-blue text-white border-0">{n.category}</Badge>
                      {n.urgent && <Badge className="bg-gold text-church-blue border-0">Important</Badge>}
                    </div>
                    <h3 className="mt-3 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{n.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" /> {n.date}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{n.text}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
            <Link href="/events">View All Events <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
