'use client'

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Users, CheckCircle2, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";

const INTEREST_AREAS = [
  "Worship & Music",
  "Children's Ministry",
  "Youth Ministry",
  "Hospitality & Welcome",
  "Outreach & Missions",
  "Prayer Ministry",
  "Technical & Media",
  "Teaching & Discipleship",
  "Community Service",
  "Other",
];

export default function VolunteerPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interest, setInterest] = useState("");

  const hero = useContentBlock('volunteer_hero');
  const formBlock = useContentBlock('volunteer_form');

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Volunteer With Us"}
          crumb="Volunteer"
          image={hero?.image || ''}
          subtitle={hero?.subtitle || "Use your gifts to make a difference. Join our volunteer family and serve the community."}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <Card className="p-7 border-border/60">
              {submitted ? (
                <div className="text-center py-10">
                  <span className="mx-auto grid place-items-center size-16 rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="size-8" />
                  </span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>
                    Thank You for Volunteering!
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                    {formBlock?.body || "We've received your volunteer application. Our team will reach out to you soon to discuss how you can serve."}
                  </p>
                  <Button className="mt-6 bg-church-blue hover:bg-church-blue/90" onClick={() => { setSubmitted(false); setInterest(''); formRef.current?.reset(); }}>
                    Submit Another
                  </Button>
                </div>
              ) : (
                <EditableBlock block={formBlock}>
                  <form
                    ref={formRef}
                    className="space-y-5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      setLoading(true);
                      const availability = (fd.get('availability') as string || '').trim();
                      const msg = (fd.get('message') as string || '').trim();
                      const fullMessage = [availability ? `Availability: ${availability}` : '', msg].filter(Boolean).join('\n\n');
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/contact-messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            message_type: 'volunteer',
                            name: fd.get('name') as string || '',
                            email: fd.get('email') as string || '',
                            phone: fd.get('phone') as string || '',
                            category: interest,
                            message: fullMessage,
                          }),
                        });
                        if (res.ok) {
                          setSubmitted(true);
                          toast.success("Volunteer application submitted!");
                        } else {
                          toast.error("Failed to submit. Please try again.");
                        }
                      } catch {
                        toast.error("Network error. Please try again.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 text-church-blue">
                      <Heart className="size-5 text-gold" />
                      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                        {formBlock?.title || "Volunteer Sign-Up"}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formBlock?.subtitle || "Tell us about yourself and how you'd like to serve."}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" name="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" placeholder="+977 ..." />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" placeholder="you@email.com" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interest">Area of Interest *</Label>
                      <Select value={interest} onValueChange={setInterest}>
                        <SelectTrigger id="interest">
                          <SelectValue placeholder="Select an area" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTEREST_AREAS.map((area) => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <Input id="availability" name="availability" placeholder="e.g. Sunday mornings, weekday evenings" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" name="message" rows={4} placeholder="Tell us about yourself, your skills, or why you'd like to volunteer..." />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading || !interest}
                      className="w-full bg-gold text-church-blue hover:bg-gold/90"
                    >
                      <Users className="size-4 mr-2" />
                      {loading ? "Submitting..." : "Submit Volunteer Application"}
                    </Button>
                  </form>
                </EditableBlock>
              )}
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
