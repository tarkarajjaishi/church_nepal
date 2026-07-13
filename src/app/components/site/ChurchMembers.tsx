import { Link } from "react-router";
import { Users, ArrowRight, HeartHandshake } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useMembers } from "../../lib/hooks";
import { CardSkeleton } from "./LoadingSpinner";

export function ChurchMembers() {
  const { data: members = [], isLoading } = useMembers();
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeading eyebrow="Our Family" title="Church Members"
          subtitle="We are one family in Christ — over 450 members from every walk of life, growing together in faith." />

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <CardSkeleton count={8} />
          ) : members.map((m, i) => (
            <Reveal key={m.id} delay={(i % 4) * 0.06}>
              <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0 text-center">
                <div className="relative aspect-square overflow-hidden">
                  <ImageWithFallback src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{m.name}</h3>
                  <p className="text-sm text-gold">{m.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Member since {m.since}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <Card className="mt-12 p-8 md:p-10 bg-church-blue text-white border-0 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <span className="grid place-items-center size-14 shrink-0 rounded-2xl bg-white/10 text-gold"><Users className="size-7" /></span>
              <div>
                <h3 className="text-white" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>Become a Member</h3>
                <p className="mt-1 text-white/80 max-w-xl">Join our church family and grow in community, service and worship. Our next New Members Class begins soon.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90">
                <Link to="/contact">Join Us <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-church-blue">
                <Link to="/prayer"><HeartHandshake className="size-4" /> Get Connected</Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
