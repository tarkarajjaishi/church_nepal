'use client'

import { useState, useRef } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/site/PageHero";
import { EditableBlock } from "@/components/site/EditableBlock";
import { Reveal } from "@/components/site/Reveal";
import { images } from "@/lib/data";
import { useContactInfo, useContentBlock } from "@/lib/hooks";
import type { ContactInfo } from "@/lib/hooks";

const FALLBACK: ContactInfo = {
  id: "",
  address: "123 Faith Street\nSpringfield",
  phone: "(555) 123-4567",
  email: "info@gracechurch.org",
  hours: "Mon–Fri: 9 AM – 5 PM\nSat–Sun: Closed",
  mapUrl: "https://www.openstreetmap.org/export/embed.html?bbox=-89.66%2C39.78%2C-89.62%2C39.80&layer=mapnik&marker=39.79%2C-89.64",
};

const DEFAULT_WHATSAPP = "5551234567";
const DEFAULT_VIBER = "5551234567";

function parseLines(raw: string): string[] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { data: contactList } = useContactInfo();
  const heroBlock = useContentBlock("contact_hero");
  const formBlock = useContentBlock("contact_form");
  const infoBlock = useContentBlock("contact_info");

  const contact = contactList?.[0] ?? FALLBACK;

  const info = [
    { icon: MapPin, title: "Address", lines: parseLines(contact.address || FALLBACK.address) },
    { icon: Phone, title: "Phone", lines: [contact.phone || FALLBACK.phone] },
    { icon: Mail, title: "Email", lines: [contact.email || FALLBACK.email] },
    { icon: Clock, title: "Office Hours", lines: parseLines(contact.hours || FALLBACK.hours) },
  ];

  const heroTitle = heroBlock?.title ?? "Contact Us";
  const heroSubtitle = heroBlock?.subtitle ?? "We'd love to hear from you. Reach out, drop by, or send us a message.";
  const heroImage = heroBlock?.image ?? images.village;

  const formHeading = formBlock?.title ?? "Send a Message";
  const formSubmitLabel = (formBlock?.items as Record<string, string> | null)?.submitLabel ?? "Send Message";

  const whatsapp = (formBlock?.items as Record<string, string> | null)?.whatsapp ?? DEFAULT_WHATSAPP;
  const viber = (formBlock?.items as Record<string, string> | null)?.viber ?? DEFAULT_VIBER;

  const mapSrc = contact.mapUrl || FALLBACK.mapUrl;

  return (
    <div>
      <EditableBlock block={heroBlock}>
        <PageHero title={heroTitle} crumb="Contact" image={heroImage} subtitle={heroSubtitle} />
      </EditableBlock>

      <EditableBlock block={infoBlock}>
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
      </EditableBlock>

      <EditableBlock block={formBlock}>
        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-stretch">
            <Reveal>
              <Card className="p-7 border-border/60 h-full">
                {submitted ? (
                  <div className="text-center py-10">
                    <span className="mx-auto grid place-items-center size-16 rounded-full bg-success/10 text-success">
                      <CheckCircle2 className="size-8" />
                    </span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>Message Sent!</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button className="mt-6 bg-church-blue hover:bg-church-blue/90" onClick={() => { setSubmitted(false); formRef.current?.reset(); }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{formHeading}</h3>
                    <form
                      ref={formRef}
                      className="mt-6 space-y-5"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const fd = new FormData(e.currentTarget)
                        setSubmitting(true)
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/contact-messages`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message_type: 'contact',
                              name: fd.get('name') as string || '',
                              email: fd.get('email') as string || '',
                              phone: fd.get('phone') as string || '',
                              message: fd.get('message') as string || '',
                              category: fd.get('subject') as string || '',
                              honeypot: fd.get('website') as string || '',
                            }),
                          })
                          if (res.ok) {
                            setSubmitted(true)
                            toast.success("Message sent! We'll be in touch soon.")
                            formRef.current?.reset()
                          } else {
                            toast.error("Failed to send message. Please try again.")
                          }
                        } catch {
                          toast.error("Network error. Please try again.")
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                    >
                      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required placeholder="Your name" /></div>
                        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required placeholder="you@email.com" /></div>
                      </div>
                      <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" placeholder="+977 ..." /></div>
                      <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" placeholder="How can we help?" /></div>
                      <div className="space-y-2"><Label htmlFor="message">Message</Label><Textarea id="message" name="message" rows={5} required placeholder="Your message..." /></div>
                      <Button type="submit" size="lg" disabled={submitting} className="bg-church-blue hover:bg-church-blue/90">
                        <Send className="size-4" /> {submitting ? 'Sending...' : formSubmitLabel}
                      </Button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-success hover:underline"><MessageCircle className="size-4" /> WhatsApp</a>
                      <a href={`viber://chat?number=${viber}`} className="inline-flex items-center gap-2 text-[#7360f2] hover:underline"><Phone className="size-4" /> Viber</a>
                    </div>
                  </>
                )}
              </Card>
            </Reveal>

            <Reveal delay={0.1}>
              <Card className="overflow-hidden border-border/60 h-full min-h-[400px]">
                <iframe
                  title="Church location"
                  className="w-full h-full min-h-[400px]"
                  src={mapSrc}
                  loading="lazy"
                />
              </Card>
            </Reveal>
          </div>
        </section>
      </EditableBlock>
    </div>
  );
}
