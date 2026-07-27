
import { Link } from 'wouter';
import { Target, Eye, Heart, Milestone, CheckCircle2, Users, BookOpen, Shield, Coffee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { EditableBlock } from "@/components/site/EditableBlock";
import { useLang } from "@/lib/language";
import { useContentBlock } from "@/lib/hooks";
import { images } from "@/lib/data";

const iconMap: Record<string, any> = { Target, Eye, Heart, CheckCircle2, Milestone, Users, BookOpen, Shield, Coffee };

const FALLBACK_MISSION_ITEMS = [
  { icon: 'Target', title: 'Our Mission', desc: 'To make disciples of Jesus Christ in every village and city of Nepal, building a Christ-centred community rooted in the Word.' },
  { icon: 'Eye', title: 'Our Vision', desc: 'A Nepal where every person has heard the gospel and experienced the transforming love of God through a local church family.' },
  { icon: 'Heart', title: 'Our Values', desc: 'Faith, hope, and love — expressed through worship, fellowship, discipleship, ministry, and evangelism in all we do.' },
]

const FALLBACK_VALUES_ITEMS = [
  { icon: 'BookOpen', title: 'Word-Centred', desc: 'Every decision, sermon, and ministry is anchored in the living Word of God.' },
  { icon: 'Users', title: 'Community First', desc: "We believe no one should walk alone. Belonging matters as much as believing." },
  { icon: 'Shield', title: 'Integrity', desc: 'We do what we say. Transparency, accountability, and faithfulness in every area.' },
  { icon: 'Coffee', title: 'Radical Hospitality', desc: 'Every person who walks through our doors is made to feel seen, known, and loved.' },
]

const FALLBACK_FAQ_ITEMS = [
  { q: 'Do I need to be a Christian to attend?', a: 'Absolutely not! Grace Nepal Church is a welcoming community. Whether you are exploring faith for the first time or returning after years away, you are warmly invited.' },
  { q: 'What should I wear?', a: 'Come as you are. There is no dress code. People attend in everything from traditional Nepali attire to jeans. What matters is that you come.' },
  { q: 'What language are the services in?', a: 'Our main Sunday service is conducted in both Nepali and English. Translations and bilingual materials are available for all ages.' },
  { q: 'Is there a programme for children?', a: 'Yes! We have an age-appropriate Children\'s Ministry running every Sunday morning so parents can worship freely. Trained volunteers care for children from age 2 through 12.' },
  { q: 'How can I get more involved?', a: 'Start by attending a Sunday service and one of our mid-week small groups. From there, our Growth Track will help you find your place in the church family.' },
]

const FALLBACK_TIMELINE = [
  { year: '2005', title: 'Founded in Kathmandu', text: 'Grace Nepal Church was planted with 12 believers meeting in a small home in Baneshwor.' },
  { year: '2009', title: 'First Permanent Building', text: 'The congregation moved into its first dedicated worship space, seating 150.' },
  { year: '2013', title: 'Mission Expansion', text: 'Launched partnerships with 5 church plants across rural Nepal.' },
  { year: '2018', title: 'New Auditorium', text: 'The current main auditorium was opened, seating over 600 worshippers.' },
  { year: '2023', title: 'Reaching Every Village', text: 'Active support of church planters in 20+ districts including Humla, Bajhang, and Mustang.' },
]

export default function About() {
  const { lang } = useLang();
  const hero = useContentBlock('about_hero');
  const history = useContentBlock('about_history');
  const mission = useContentBlock('about_mission');
  const values = useContentBlock('about_values');
  const faq = useContentBlock('about_faq');
  const cta = useContentBlock('about_cta');

  const missionItems = mission?.items?.length ? mission.items : FALLBACK_MISSION_ITEMS;
  const valuesItems = values?.items?.length ? values.items : FALLBACK_VALUES_ITEMS;
  const faqItems = faq?.items?.length ? faq.items : FALLBACK_FAQ_ITEMS;
  const timeline = history?.items?.[0]?.timeline?.length ? history.items[0].timeline : FALLBACK_TIMELINE;

  return (
    <div>
      {/* Hero */}
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || (lang === 'en' ? 'About Grace Nepal' : 'हाम्रो बारेमा')}
          crumb={hero?.items?.[0]?.crumb || 'About'}
          image={hero?.items?.[0]?.image || images.praise}
          subtitle={hero?.subtitle || (lang === 'en' ? 'A Christ-centred community growing in faith, hope and love' : 'विश्वास, आशा र प्रेममा बढ्दै गइरहेको ख्रीष्ट-केन्द्रित समुदाय')}
        />
      </EditableBlock>

      {/* History */}
      <EditableBlock block={history}>
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <ImageWithFallback
                src={history?.items?.[0]?.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'}
                alt={history?.title || 'Grace Nepal Church history'}
                className="rounded-3xl w-full aspect-[4/3] object-cover shadow-xl"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <SectionHeading
                center={false}
                eyebrow={history?.items?.[0]?.eyebrow || (lang === 'en' ? 'Our Story' : 'हाम्रो कथा')}
                title={history?.title || (lang === 'en' ? 'Rooted in Faith Since 2005' : '२००५ देखि विश्वासमा जरा गाडिएको')}
                subtitle={history?.subtitle || (lang === 'en'
                  ? 'Grace Nepal Church began as a small home gathering of 12 believers with a single prayer: that Nepal would know the love of Christ. From those humble beginnings in Kathmandu, God has grown this community into a family of hundreds — with church plants reaching across the country.'
                  : 'ग्रेस नेपाल चर्च १२ विश्वासीहरूको एउटा सानो घर-सभाबाट सुरु भयो। त्यो विनम्र सुरुवातबाट परमेश्वरले यो समुदायलाई सयौंको परिवारमा बढाउनुभयो।'
                )}
              />
            </Reveal>
          </div>
        </section>
      </EditableBlock>

      {/* Mission / Vision / Values */}
      <section className="py-16 bg-section">
        <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-6">
          {missionItems.map((c: any, i: number) => {
            const Icon = iconMap[c.icon] || Target;
            return (
              <Reveal key={c.title} delay={i * 0.08}>
                <Card className="p-7 h-full border-border/60 hover:shadow-xl transition-all">
                  <span className="grid place-items-center size-12 rounded-xl bg-church-blue text-white">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-church-blue dark:text-foreground" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{c.title}</h3>
                  <p className="mt-2 text-muted-foreground">{c.desc}</p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow={values?.items?.[0]?.eyebrow || (lang === 'en' ? 'What Drives Us' : 'हाम्रो प्रेरणा')}
            title={values?.title || (lang === 'en' ? 'Our Core Values' : 'हाम्रा मूल मूल्यहरू')}
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valuesItems.map((v: any, i: number) => {
              const Icon = iconMap[v.icon] || Heart;
              return (
                <Reveal key={v.title} delay={i * 0.06}>
                  <Card className="p-6 text-center h-full border-border/60 hover:border-gold hover:shadow-xl transition-all">
                    <span className="mx-auto grid place-items-center size-12 rounded-full bg-gold-soft text-gold">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-church-blue dark:text-foreground" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-section">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading
            eyebrow={lang === 'en' ? 'Our Journey' : 'हाम्रो यात्रा'}
            title={lang === 'en' ? 'Milestones of Grace' : 'अनुग्रहका मील-पत्थरहरू'}
          />
          <div className="mt-12 relative pl-8 sm:pl-0">
            <div className="absolute left-2 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
            {timeline.map((item: any, i: number) => (
              <Reveal key={item.year} delay={i * 0.05}>
                <div className={`relative mb-10 sm:w-1/2 ${i % 2 ? 'sm:ml-auto sm:pl-10' : 'sm:pr-10 sm:text-right'}`}>
                  <span className={`absolute top-1 size-4 rounded-full bg-gold ring-4 ring-section ${i % 2 ? '-left-[1.6rem] sm:-left-2' : '-left-[1.6rem] sm:-right-2 sm:left-auto'}`} />
                  <Milestone className="size-4 text-gold inline-block mb-1" />
                  <div className="text-gold" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{item.year}</div>
                  <h3 className="text-church-blue dark:text-foreground" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading
            eyebrow={faq?.items?.[0]?.eyebrow || (lang === 'en' ? 'Questions & Answers' : 'प्रश्न र उत्तरहरू')}
            title={faq?.title || (lang === 'en' ? 'Frequently Asked Questions' : 'बारम्बार सोधिने प्रश्नहरू')}
          />
          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="mt-10">
              {faqItems.map((f: any, i: number) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-church-blue dark:text-foreground hover:text-gold transition-colors">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-church-blue">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <SectionHeading
              light
              eyebrow={cta?.items?.[0]?.eyebrow || (lang === 'en' ? 'You Belong Here' : 'तपाईं यहाँ स्वागतयोग्य हुनुहुन्छ')}
              title={cta?.title || (lang === 'en' ? 'Come As You Are' : 'जस्तो हुनुहुन्छ, त्यस्तै आउनुहोस्')}
              subtitle={cta?.subtitle || (lang === 'en' ? 'Whether you are new to faith or coming home after years away — there is a seat for you at Grace Nepal.' : 'विश्वासमा नयाँ हुनुहोस् वा वर्षौंपछि फर्किंदै हुनुहोस् — यहाँ तपाईंको लागि ठाउँ छ।')}
            />
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90 font-bold shadow-lg">
                <Link href="/visit">{lang === 'en' ? 'Plan Your Visit' : 'भ्रमण योजना बनाउनुहोस्'}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10">
                <Link href="/contact">{lang === 'en' ? 'Get In Touch' : 'सम्पर्क गर्नुहोस्'}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
