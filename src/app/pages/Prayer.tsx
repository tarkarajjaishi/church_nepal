import { useState } from "react";
import { toast } from "sonner";
import { HandHeart, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { PageHero } from "../components/site/PageHero";
import { Reveal } from "../components/site/Reveal";
import { images } from "../lib/data";
import { useLang } from "../lib/language";

const categories = ["Healing", "Family", "Finances", "Guidance", "Salvation", "Thanksgiving", "Other"];

const wall = [
  { id: "w1", name: "Anonymous", text: "Please pray for my mother's health and recovery.", count: 34 },
  { id: "w2", name: "Ramesh", text: "Thanking God for a new job after months of waiting!", count: 58 },
  { id: "w3", name: "Sita", text: "Pray for peace and unity in my family.", count: 27 },
];

export default function Prayer() {
  const { lang } = useLang();
  const [submitted, setSubmitted] = useState(false);
  const [anon, setAnon] = useState(false);

  return (
    <div>
      <PageHero title="Prayer Request" crumb="Prayer Request" image={images.worship3}
        subtitle="Whatever you're facing, you don't have to face it alone. Let us pray with you." />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <Reveal>
              <Card className="p-7 border-border/60">
                {submitted ? (
                  <div className="text-center py-10">
                    <span className="mx-auto grid place-items-center size-16 rounded-full bg-success/10 text-success"><CheckCircle2 className="size-8" /></span>
                    <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem" }}>Thank You</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      {lang === "en" ? "Your prayer request has been received. Our prayer team will faithfully lift you up before God." : "तपाईंको प्रार्थना अनुरोध प्राप्त भयो। हाम्रो प्रार्थना समूहले तपाईंका लागि प्रार्थना गर्नेछ।"}
                    </p>
                    <Button className="mt-6 bg-church-blue hover:bg-church-blue/90" onClick={() => setSubmitted(false)}>Submit Another</Button>
                  </div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={(e) => { e.preventDefault(); setSubmitted(true); toast.success("Prayer request submitted"); }}
                  >
                    <div className="flex items-center gap-2 text-church-blue">
                      <HandHeart className="size-5 text-gold" />
                      <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Share Your Request</h3>
                    </div>
                    {!anon && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" placeholder="Your name" required={!anon} /></div>
                        <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" placeholder="+977 ..." /></div>
                      </div>
                    )}
                    {!anon && (
                      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@email.com" /></div>
                    )}
                    <div className="space-y-2">
                      <Label>Prayer Category</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="req">Prayer Request</Label>
                      <Textarea id="req" rows={5} placeholder="Share what's on your heart..." required />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="anon" checked={anon} onCheckedChange={(v) => setAnon(!!v)} />
                      <Label htmlFor="anon" className="cursor-pointer">Submit anonymously</Label>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-success"><ShieldCheck className="size-4" /> Every request is kept strictly confidential.</div>
                    <Button type="submit" size="lg" className="w-full bg-gold text-church-blue hover:bg-gold/90">Submit Prayer Request</Button>
                  </form>
                )}
              </Card>
            </Reveal>
          </div>

          <div className="lg:col-span-2">
            <Reveal delay={0.1}>
              <h3 className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>Prayer Wall</h3>
              <p className="text-sm text-muted-foreground mt-1">Stand together with others in prayer.</p>
              <div className="mt-4 space-y-4">
                {wall.map((w) => (
                  <Card key={w.id} className="p-5 border-border/60">
                    <p className="text-foreground/80">"{w.text}"</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">— {w.name}</span>
                      <button onClick={() => toast("🙏 Praying with you")} className="inline-flex items-center gap-1.5 text-gold hover:text-church-blue transition-colors">
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
