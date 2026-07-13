import { toast } from "sonner";
import { Link } from "react-router";
import { Clock, MapPin, Calendar, Car, Baby, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHero } from "../components/site/PageHero";
import { SectionHeading } from "../components/site/SectionHeading";
import { Reveal } from "../components/site/Reveal";
import { Icon } from "../components/site/Icon";
import { useLang } from "../lib/language";
import { images, whatToExpect, visitSteps } from "../lib/data";

export default function PlanVisit() {
  const { lang } = useLang();

  const quickFacts = [
    { icon: Clock, label: lang === "en" ? "Sunday, 10:00 AM" : "आइतबार, बिहान १०:००", sub: lang === "en" ? "Arrive by 9:45 AM" : "९:४५ सम्म आइपुग्नुहोस्" },
    { icon: MapPin, label: "Baneshwor, Kathmandu", sub: lang === "en" ? "Free parking on site" : "निःशुल्क पार्किङ" },
    { icon: Clock, label: lang === "en" ? "~90 minutes" : "~९० मिनेट", sub: lang === "en" ? "Tea & fellowship after" : "पछि चिया र सङ्गति" },
    { icon: Baby, label: lang === "en" ? "Kids welcome" : "बच्चाहरूलाई स्वागत", sub: lang === "en" ? "Safe children's ministry" : "सुरक्षित बाल सेवा" },
  ];

  return (
    <div>
      <PageHero
        title={lang === "en" ? "Plan Your Visit" : "आफ्नो भ्रमण योजना"}
        crumb={lang === "en" ? "I'm New" : "म नयाँ हुँ"}
        image={images.crowd}
        subtitle={lang === "en"
          ? "We can't wait to meet you. Here's everything you need for a relaxed, welcoming first visit."
          : "हामी तपाईंलाई भेट्न आतुर छौं। तपाईंको पहिलो भ्रमणको लागि सबै जानकारी यहाँ छ।"}
      />

      {/* Quick facts */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickFacts.map((f, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white"><f.icon className="size-6" /></span>
                <div className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{f.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.sub}</div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={lang === "en" ? "How It Works" : "कसरी काम गर्छ"} title={lang === "en" ? "Your First Sunday, Step by Step" : "तपाईंको पहिलो आइतबार, चरण-चरणमा"} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {visitSteps.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.08}>
                <Card className="p-6 h-full border-border/60 relative">
                  <span className="grid place-items-center size-11 rounded-full bg-gold text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>{s.step}</span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? s.title : s.titleNe}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lang === "en" ? s.text : s.textNe}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* What to expect grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow={lang === "en" ? "Good to Know" : "जान्न राम्रो"} title={lang === "en" ? "What to Expect" : "के अपेक्षा गर्ने"} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whatToExpect.map((x, i) => (
              <Reveal key={x.id} delay={i * 0.05}>
                <Card className="p-6 h-full border-border/60 hover:shadow-xl transition-all">
                  <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold"><Icon name={x.icon} className="size-6" /></span>
                  <h3 className="mt-4 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? x.title : x.titleNe}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{lang === "en" ? x.text : x.textNe}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Let us know + map */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-10 items-stretch">
          <Reveal>
            <Card className="p-7 border-border/60 h-full bg-church-blue text-white">
              <Heart className="size-8 text-gold" />
              <h3 className="mt-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                {lang === "en" ? "Let us know you're coming" : "तपाईं आउँदै हुनुहुन्छ भनी हामीलाई बताउनुहोस्"}
              </h3>
              <p className="mt-2 text-white/80 text-sm">
                {lang === "en"
                  ? "It's completely optional — but if you tell us you're visiting, someone will be ready to welcome you personally and show you around."
                  : "यो पूर्ण रूपमा वैकल्पिक हो — तर तपाईं आउँदै हुनुहुन्छ भन्नुभयो भने, कसैले तपाईंलाई व्यक्तिगत रूपमा स्वागत गर्नेछ।"}
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(lang === "en" ? "Thank you! We look forward to meeting you." : "धन्यवाद! हामी तपाईंलाई भेट्न उत्सुक छौं।");
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="vn" className="text-white/90">{lang === "en" ? "Name" : "नाम"}</Label><Input id="vn" required placeholder={lang === "en" ? "Your name" : "तपाईंको नाम"} className="bg-white/10 border-white/20 text-white placeholder:text-white/50" /></div>
                  <div className="space-y-2"><Label htmlFor="vp" className="text-white/90">{lang === "en" ? "Phone / Viber" : "फोन / भाइबर"}</Label><Input id="vp" required placeholder="+977 ..." className="bg-white/10 border-white/20 text-white placeholder:text-white/50" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="vd" className="text-white/90">{lang === "en" ? "Which Sunday?" : "कुन आइतबार?"}</Label><Input id="vd" type="date" className="bg-white/10 border-white/20 text-white [color-scheme:dark]" /></div>
                <Button type="submit" size="lg" className="bg-gold text-church-blue hover:bg-gold/90"><Calendar className="size-4" /> {lang === "en" ? "I'm Planning to Visit" : "म भ्रमण गर्ने योजनामा छु"}</Button>
              </form>
              <a href="https://wa.me/9771400000" className="mt-4 inline-flex items-center gap-2 text-gold hover:underline"><MessageCircle className="size-4" /> {lang === "en" ? "Or message us on WhatsApp / Viber" : "वा WhatsApp / Viber मा सन्देश पठाउनुहोस्"}</a>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="h-full flex flex-col gap-6">
              <Card className="overflow-hidden border-border/60 flex-1 min-h-[280px]">
                <iframe
                  title="Church location"
                  className="w-full h-full min-h-[280px]"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335"
                  loading="lazy"
                />
              </Card>
              <Card className="p-6 border-border/60 flex items-center gap-4">
                <span className="grid place-items-center size-12 rounded-xl bg-gold-soft text-gold shrink-0"><Car className="size-6" /></span>
                <div>
                  <div className="text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{lang === "en" ? "Getting here" : "यहाँ आउने बाटो"}</div>
                  <p className="text-sm text-muted-foreground mt-1">{lang === "en" ? "Free on-site parking. A 5-minute walk from Baneshwor Chowk bus stop." : "निःशुल्क पार्किङ। बानेश्वर चोक बस स्टपबाट ५ मिनेट पैदल।"}</p>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
            <Link to="/contact">{lang === "en" ? "Still have questions? Contact us" : "अझै प्रश्न छ? सम्पर्क गर्नुहोस्"} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
