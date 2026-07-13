import { Link } from "react-router";
import { GraduationCap, BookOpen, Target, Quote, Facebook, Youtube, Instagram, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageHero } from "../components/site/PageHero";
import { SectionHeading } from "../components/site/SectionHeading";
import { Reveal } from "../components/site/Reveal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { images, sermons } from "../lib/data";

const details = [
  { icon: GraduationCap, title: "Education", text: "M.Div, Nepal Theological Seminary. Ordained pastor with 18 years of ministry experience." },
  { icon: Target, title: "The Calling", text: "Called to shepherd God's people and take the gospel to every unreached village of Nepal." },
  { icon: BookOpen, title: "Favourite Verse", text: '"For I know the plans I have for you" — Jeremiah 29:11' },
];

export default function Pastor() {
  return (
    <div>
      <PageHero title="Our Pastor" crumb="Our Pastor" image={images.worship1}
        subtitle="Meet Ps. Bishal Rai — shepherd, teacher and friend." />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-5 gap-12 items-start">
          <Reveal className="lg:col-span-2">
            <div className="relative">
              <ImageWithFallback src={images.pastor} alt="Ps. Bishal Rai" className="rounded-3xl w-full aspect-[4/5] object-cover shadow-xl" />
              <div className="mt-4 flex gap-2">
                {[
                  { Icon: Facebook, label: "Facebook", url: "https://facebook.com/gracenepalchurch" },
                  { Icon: Youtube, label: "YouTube", url: "https://youtube.com/@gracenepalchurch" },
                  { Icon: Instagram, label: "Instagram", url: "https://instagram.com/gracenepalchurch" },
                ].map(({ Icon, label, url }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="grid place-items-center size-10 rounded-full bg-secondary text-church-blue hover:bg-gold transition-colors" aria-label={label}>
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-3">
            <SectionHeading center={false} eyebrow="Biography" title="Ps. Bishal Rai"
              subtitle="Ps. Bishal has faithfully served Grace Nepal Church since its earliest days. His heart beats for discipleship, the local church, and the unreached peoples of the Himalayas. Alongside his wife Anita, he has raised up leaders, planted village fellowships, and shepherded hundreds into a living relationship with Jesus." />
            <Reveal delay={0.1}>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A gifted communicator, Ps. Bishal is known for making Scripture accessible and practical. Whether teaching from the pulpit or sitting with a family in their home, he carries the same warmth and conviction — that no one is beyond the reach of God's grace.
              </p>
              <Card className="mt-6 p-6 bg-church-blue text-white border-0">
                <Quote className="size-8 text-gold" />
                <p className="mt-3 text-lg" style={{ fontFamily: "var(--font-heading)" }}>
                  "My greatest joy is to see ordinary people encounter an extraordinary God."
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-16 bg-section">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-6">
          {details.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.08}>
              <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold"><d.icon className="size-6" /></span>
                <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{d.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.text}</p>
              </Card>
            </Reveal>
          ))}
          </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="From the Pulpit" title="Recent Sermons" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {sermons.filter((s) => s.speaker.includes("Bishal")).slice(0, 3).map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <Card className="overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                  <ImageWithFallback src={s.image} alt={s.title} className="w-full h-40 object-cover" />
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground">{s.date} · {s.duration}</div>
                    <h3 className="mt-1 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                    <Button asChild variant="link" className="px-0 text-gold mt-1"><Link to="/sermons">Watch Now <ArrowRight className="size-4" /></Link></Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
