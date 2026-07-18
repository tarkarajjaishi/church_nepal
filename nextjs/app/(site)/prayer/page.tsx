'use client'

import { useRef, useState } from "react";
import { toast } from "sonner";
import { HandHeart, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useContentBlock } from "@/lib/hooks";
import { useLang } from "@/lib/language";

export default function Prayer() {
  const { lang } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anon, setAnon] = useState(false);
  const [category, setCategory] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // CMS content blocks — NO hardcoded content
  const hero = useContentBlock('prayer_hero');
  const formBlock = useContentBlock('prayer_form');
  const wallBlock = useContentBlock('prayer_wall');

  const formData = formBlock?.items?.[0] || {};
  const categories = formData.categories?.length
    ? formData.categories
    : ["Health", "Family", "Financial", "Spiritual", "Other"];
  const wallItems = wallBlock?.items?.length ? wallBlock.items : [];

  return (
    <div>
      {/* Hero — fully from CMS */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Prayer Request"}
          crumb={hero?.items?.[0]?.crumb || "Prayer Request"}
          image={hero?.image || ''}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-5 gap-10">
          {/* Prayer form — editable heading from CMS */}
          <div className="lg:col-span-3">
            <Reveal>
              <Card className="p-7 border-border/60">
                {submitted ? (
                  <div className="text-center py-10">
                    <span className="mx-auto grid place-items-center size-16 rounded-full bg-success/10 text-success"><CheckCircle2 className="size-8" /></span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>Thank You</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      {lang === "en"
                        ? (formBlock?.body || "Your prayer request has been received. Our prayer team will faithfully lift you up before God.")
                        : "तपाईंको प्रार्थना अनुरोध प्राप्त भयो। हाम्रो प्रार्थना समूहले तपाईंका लागि प्रार्थना गर्नेछ।"}
                    </p>
                    {category && (
                      <p className="mt-2 text-sm text-muted-foreground">Category: <span className="font-medium text-church-blue">{category}</span></p>
                    )}
                    <Button className="mt-6 bg-church-blue hover:bg-church-blue/90" onClick={() => { setSubmitted(false); setCategory(''); formRef.current?.reset(); }}>Submit Another</Button>
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
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/contact-messages`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message_type: 'prayer',
                              name: anon ? '' : (fd.get('name') as string || ''),
                              email: anon ? '' : (fd.get('email') as string || ''),
                              phone: anon ? '' : (fd.get('phone') as string || ''),
                              message: fd.get('req') as string || '',
                              category,
                              anonymous: anon,
                            }),
                          });
                          if (res.ok) {
                            setSubmitted(true);
                            toast.success("Prayer request submitted");
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
                        <HandHeart className="size-5 text-gold" />
                        <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{formBlock?.title || "Share Your Request"}</h3>
                      </div>
                      {!anon && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" placeholder="Your name" required={!anon} /></div>
                          <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" placeholder="+977 ..." /></div>
                        </div>
                      )}
                      {!anon && (
                        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="you@email.com" /></div>
                      )}
                      <div className="space-y-2">
                        <Label>Prayer Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                          <SelectContent>{categories.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="req">Prayer Request</Label>
                        <Textarea id="req" name="req" rows={5} placeholder="Share what's on your heart..." required />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="anon" checked={anon} onCheckedChange={(v) => setAnon(!!v)} />
                        <Label htmlFor="anon" className="cursor-pointer">Submit anonymously</Label>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-success"><ShieldCheck className="size-4" /> {formBlock?.body || "Every request is kept strictly confidential."}</div>
                      <Button type="submit" size="lg" disabled={loading} className="w-full bg-gold text-church-blue hover:bg-gold/90">{loading ? "Submitting..." : "Submit Prayer Request"}</Button>
                    </form>
                  </EditableBlock>
                )}
              </Card>
            </Reveal>
          </div>

          {/* Prayer wall — fully from CMS */}
          <div className="lg:col-span-2">
            <Reveal delay={0.1}>
              <EditableBlock block={wallBlock}>
                <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{wallBlock?.title || "Prayer Wall"}</h3>
                <p className="text-sm text-muted-foreground mt-1">{wallBlock?.subtitle || "Stand together with others in prayer."}</p>
              </EditableBlock>
              <div className="mt-4 space-y-4">
                {wallItems.map((w: any, i: number) => (
                  <Card key={i} className="p-5 border-border/60">
                    <p className="text-foreground/80">"{w.text}"</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">— {w.name}</span>
                      <button onClick={() => toast("Praying with you")} className="inline-flex items-center gap-1.5 text-gold hover:text-church-blue transition-colors">
                        <HandHeart className="size-4" /> {w.count} praying
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
