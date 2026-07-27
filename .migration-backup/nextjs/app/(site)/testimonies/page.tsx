'use client'

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Quote, Star, CheckCircle2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useEnabledTestimonies } from "@/lib/hooks";
import { useLang } from "@/lib/language";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function TestimoniesPage() {
  const { lang } = useLang();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: testimonies = [], isLoading } = useEnabledTestimonies();

  const heroBlock = useContentBlock('testimonies_hero');

  return (
    <div>
      <EditableBlock block={heroBlock}>
        <PageHero
          title={heroBlock?.title || (lang === "en" ? "Testimonies" : "प्रमाणहरू")}
          crumb={heroBlock?.items?.[0]?.crumb || (lang === "en" ? "Testimonies" : "प्रमाणहरू")}
          image={heroBlock?.image || ''}
          subtitle={heroBlock?.subtitle || (lang === "en" ? "Share how God has moved in your life." : "परमेश्वरले तपाईंको जीवनमा कसरी काम गर्नुभएको छ भन्नुहोस्।")}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Submit Form */}
          <div className="max-w-2xl mx-auto mb-20">
            <Reveal>
              <Card className="p-7 border-border/60">
                {submitted ? (
                  <div className="text-center py-10">
                    <span className="mx-auto grid place-items-center size-16 rounded-full bg-success/10 text-success"><CheckCircle2 className="size-8" /></span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>
                      {lang === "en" ? "Thank You" : "धन्यवाद"}
                    </h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      {lang === "en"
                        ? "Your testimony has been submitted for review. It will appear here once approved by our team."
                        : "तपाईंको प्रमाण समीक्षाको लागि पेश गरिएको छ। एकवटा कबाट अनुमोदित भएपछि यहाँ देखा पर्नेछ।"}
                    </p>
                    <Button className="mt-6 bg-church-blue hover:bg-church-blue/90" onClick={() => { setSubmitted(false); formRef.current?.reset(); }}>
                      {lang === "en" ? "Submit Another" : "अर्को पेश गर्नुहोस्"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-church-blue mb-4">
                      <Quote className="size-5 text-gold" />
                      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                        {lang === "en" ? "Share Your Testimony" : "आफ्नो प्रमाण सुनाउनुहोस्"}
                      </h3>
                    </div>
                    <form
                      ref={formRef}
                      className="space-y-5"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setSubmitting(true);
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/testimonies/submit`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: fd.get('name') as string || '',
                              role: fd.get('role') as string || '',
                              quote: fd.get('quote') as string || '',
                              image: fd.get('image') as string || '',
                              rating: Number(fd.get('rating') || 5),
                            }),
                          });
                          if (res.ok) {
                            setSubmitted(true);
                            toast.success(lang === "en" ? "Testimony submitted for review" : "प्रमाण समीक्षाको लागि पेश गरियो");
                          } else {
                            toast.error(lang === "en" ? "Failed to submit. Please try again." : "पेश गर्न सकिएन। पुनः प्रयास गर्नुहोस्।");
                          }
                        } catch {
                          toast.error(lang === "en" ? "Network error. Please try again." : "नेटवर्क त्रुटि। पुनः प्रयास गर्नुहोस्।");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">{lang === "en" ? "Your Name" : "तपाईंको नाम"}</Label><Input id="name" name="name" required placeholder={lang === "en" ? "Your name" : "तपाईंको नाम"} /></div>
                        <div className="space-y-2"><Label htmlFor="role">{lang === "en" ? "Role / Title" : "पद / शीर्षक"}</Label><Input id="role" name="role" required placeholder={lang === "en" ? "e.g. Member" : "उदाहरण: सदस्य"} /></div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quote">{lang === "en" ? "Your Testimony" : "तपाईंको प्रमाण"}</Label>
                        <Textarea id="quote" name="quote" rows={5} required placeholder={lang === "en" ? "Share how God has impacted your life..." : "परमेश्वरले तपाईंको जीवनमा कसरी प्रभाव पारेको छ भन्नुहोस्..."} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">{lang === "en" ? "Profile Image URL" : "प्रोफाइल तस्बिर URL"}</Label>
                        <Input id="image" name="image" placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rating">{lang === "en" ? "Rating (1-5)" : "रेटिङ (१-५)"}</Label>
                        <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={5} />
                      </div>
                      <Button type="submit" size="lg" disabled={submitting} className="w-full bg-gold text-church-blue hover:bg-gold/90">
                        <Send className="size-4" /> {submitting ? (lang === "en" ? "Submitting..." : "पेश गर्दै...") : (lang === "en" ? "Submit Testimony" : "प्रमाण पेश गर्नुहोस्")}
                      </Button>
                    </form>
                  </>
                )}
              </Card>
            </Reveal>
          </div>

          {/* Approved Testimonies */}
          <div>
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2rem" }}>
                  {lang === "en" ? "Stories of Grace" : "कृपाका कथाहरू"}
                </h2>
                <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
                  {lang === "en"
                    ? "Hear from our community about how God is transforming lives."
                    : "परमेश्वरले जीवनहरू कसरी परिवर्तन गरिरहनुभएको छ हाम्रो समुदायबाट सुन्नुहोस्।"}
                </p>
              </div>
            </Reveal>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 border-border/60 h-full animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-5/6 mb-4"></div>
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-muted"></div>
                      <div className="space-y-1">
                        <div className="h-3 bg-muted rounded w-24"></div>
                        <div className="h-2 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : testimonies.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {lang === "en" ? "No testimonies yet. Be the first to share!" : "अहिलेसम्म कुनै प्रमाण छैन। पहिलो साथी बन्नुहोस्!"}
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonies.map((t: any, i: number) => (
                  <Reveal key={t.id} delay={i * 0.08}>
                    <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                      <Quote className="size-8 text-gold/40" aria-hidden="true" />
                      <p className="mt-3 text-foreground/80 leading-relaxed line-clamp-4">"{t.quote}"</p>
                      <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: t.rating }).map((_: any, k: number) => (
                          <Star key={k} className="size-4 fill-gold text-gold" />
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <ImageWithFallback src={t.image} alt={t.name} loading="lazy" className="size-11 rounded-full object-cover" fallbackClassName="bg-secondary" />
                        <div>
                          <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.role}</div>
                        </div>
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
