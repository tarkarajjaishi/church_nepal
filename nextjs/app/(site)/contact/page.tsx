'use client'

import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { images } from "@/lib/data";

const info = [
  { icon: MapPin, title: "Address", lines: ["Baneshwor, Kathmandu 44600", "Nepal"] },
  { icon: Phone, title: "Phone", lines: ["+977 1-4000000", "+977 98-00000000"] },
  { icon: Mail, title: "Email", lines: ["hello@gracenepal.org", "prayer@gracenepal.org"] },
  { icon: Clock, title: "Office Hours", lines: ["Sun–Fri: 9 AM – 5 PM", "Sat: Closed"] },
];

export default function Contact() {
  return (
    <div>
      <PageHero title="Contact Us" crumb="Contact" image={images.village}
        subtitle="We'd love to hear from you. Reach out, drop by, or send us a message." />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {info.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.06}>
              <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold"><c.icon className="size-6" /></span>
                <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{c.title}</h3>
                {c.lines.map((l) => <p key={l} className="text-sm text-muted-foreground mt-1">{l}</p>)}
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-stretch">
          <Reveal>
            <Card className="p-7 border-border/60 h-full">
              <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Send a Message</h3>
              <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent! We'll be in touch soon."); (e.target as HTMLFormElement).reset(); }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="n">Name</Label><Input id="n" required placeholder="Your name" /></div>
                  <div className="space-y-2"><Label htmlFor="e">Email</Label><Input id="e" type="email" required placeholder="you@email.com" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="s">Subject</Label><Input id="s" placeholder="How can we help?" /></div>
                <div className="space-y-2"><Label htmlFor="m">Message</Label><Textarea id="m" rows={5} required placeholder="Your message..." /></div>
                <Button type="submit" size="lg" className="bg-church-blue hover:bg-church-blue/90"><Send className="size-4" /> Send Message</Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-4">
                <a href="https://wa.me/9771400000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-success hover:underline"><MessageCircle className="size-4" /> WhatsApp</a>
                <a href="viber://chat?number=%2B9771400000" className="inline-flex items-center gap-2 text-[#7360f2] hover:underline"><Phone className="size-4" /> Viber</a>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="overflow-hidden border-border/60 h-full min-h-[400px]">
              <iframe
                title="Church location"
                className="w-full h-full min-h-[400px]"
                src="https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335"
                loading="lazy"
              />
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

