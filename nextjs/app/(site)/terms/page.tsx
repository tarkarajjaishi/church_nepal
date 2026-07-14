'use client'

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";

export default function Terms() {
  const { lang } = useLang();

  const sections = lang === "en" ? [
    { title: "Acceptance of Terms", content: "By accessing and using the Grace Nepal Church website (gracenepal.org), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website." },
    { title: "Use of Website", content: "This website is provided for informational purposes — to share about our church, ministries, events, and to provide ways to connect with us. You may browse, read content, and use the contact and registration forms for their intended purposes." },
    { title: "Event Registration", content: "When you register for an event through our website, we collect only the information needed to facilitate your attendance. Registration does not guarantee admission; some events may have limited capacity." },
    { title: "Prayer Requests", content: "Prayer requests submitted through our website are voluntary and confidential. By submitting a request, you consent to our prayer team reviewing and praying over your request." },
    { title: "Intellectual Property", content: "All content on this website — including text, images, sermon recordings, graphics, and logos — is the property of Grace Nepal Church or its content providers and is protected by copyright law. You may share links to our content but may not reproduce or distribute it without permission." },
    { title: "External Links", content: "Our website may contain links to third-party platforms (YouTube, social media, maps). We are not responsible for the content, policies, or practices of these external sites." },
    { title: "Disclaimer of Warranties", content: "This website is provided 'as is' without any warranties. While we strive to keep information accurate and up to date, we make no guarantees about the completeness or reliability of any content." },
    { title: "Limitation of Liability", content: "Grace Nepal Church shall not be liable for any damages arising from the use of this website, including but not limited to direct, indirect, incidental, or consequential damages." },
    { title: "Modifications", content: "We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Continued use of the website after changes constitutes acceptance of the new terms." },
    { title: "Contact", content: "For any questions about these Terms of Service, please contact us at hello@gracenepal.org or call +977 1-4000000." },
  ] : [
    { title: "सर्तहरूको स्वीकृति", content: "अनुग्रह नेपाल मण्डलीको वेबसाइट (gracenepal.org) पहुँच र प्रयोग गरेर, तपाईं यी सेवा सर्तहरूबाट बाध्य हुन सहमत हुनुहुन्छ। यदि तपाईं यी सर्तहरूको कुनै भागसँग सहमत हुनुहुन्न भने, कृपया हाम्रो वेबसाइट प्रयोग नगर्नुहोस्।" },
    { title: "वेबसाइटको प्रयोग", content: "यो वेबसाइट सूचनात्मक उद्देश्यका लागि प्रदान गरिएको हो — हाम्रो मण्डली, सेवाकार्य, कार्यक्रमहरू बारे साझा गर्न र हामीसँग जोडिने तरिका प्रदान गर्न। तपाईं ब्राउज गर्न, सामग्री पढ्न र सम्पर्क तथा दर्ता फर्महरू प्रयोग गर्न सक्नुहुन्छ।" },
    { title: "कार्यक्रम दर्ता", content: "जब तपाईं हाम्रो वेबसाइटमार्फत कार्यक्रममा दर्ता हुनुहुन्छ, हामीले तपाईंको उपस्थिति सहज बनाउन आवश्यक जानकारी मात्र सङ्कलन गर्छौं। दर्ताले प्रवेशको ग्यारेन्टी दिँदैन।" },
    { title: "प्रार्थना अनुरोध", content: "वेबसाइटमार्फत पेश गरिएका प्रार्थना अनुरोधहरू स्वैच्छिक र गोप्य हुन्। अनुरोध पेश गरेर, तपाईंले हाम्रो प्रार्थना टोलीले तपाईंको अनुरोध समीक्षा गर्न र प्रार्थना गर्न सहमति दिनुहुन्छ।" },
    { title: "बौद्धिक सम्पत्ति", content: "यस वेबसाइटमा रहेको सबै सामग्री — पाठ, तस्बिरहरू, प्रवचन रेकर्डिङ, ग्राफिक्स र लोगोहरू सहित — अनुग्रह नेपाल मण्डली वा यसका सामग्री प्रदायकहरूको सम्पत्ति हो र बौद्धिक सम्पत्ति कानुनद्वारा सुरक्षित छ।" },
    { title: "बाह्य लिङ्कहरू", content: "हाम्रो वेबसाइटमा तेस्रो पक्ष प्लेटफर्महरू (YouTube, सामाजिक सञ्जाल, नक्साहरू) का लिङ्कहरू हुन सक्छन्। हामी यी बाह्य साइटहरूको सामग्री, नीतिहरू वा अभ्यासहरूको लागि जिम्मेवार छैनौं।" },
    { title: "वारेन्टीको अस्वीकरण", content: "यो वेबसाइट 'जस्तो छ' कुनै वारेन्टी बिना प्रदान गरिएको हो। हामी जानकारी सही र अद्यावधिक राख्न प्रयास गर्छौं, तर कुनै पनि सामग्रीको पूर्णता वा विश्वसनीयताको कुनै ग्यारेन्टी छैन।" },
    { title: "दायित्वको सीमा", content: "अनुग्रह नेपाल मण्डली यो वेबसाइटको प्रयोगबाट उत्पन्न हुने कुनै पनि क्षतिको लागि जिम्मेवार हुनेछैन।" },
    { title: "संशोधनहरू", content: "हामीलाई यी सेवा सर्तहरू कुनै पनि समय अपडेट गर्ने अधिकार छ। परिवर्तनहरू यस पृष्ठमा अद्यावधिक मितिसहित पोस्ट गरिनेछन्।" },
    { title: "सम्पर्क", content: "यी सेवा सर्तहरूबारे कुनै पनि प्रश्नका लागि, कृपया hello@gracenepal.org मा सम्पर्क गर्नुहोस् वा +977 1-4000000 मा फोन गर्नुहोस्।" },
  ];

  return (
    <div>
      <PageHero title={lang === "en" ? "Terms of Service" : "सेवा सर्तहरू"} crumb="Terms of Service" image={images.cross}
        subtitle={lang === "en" ? "Guidelines for using our website" : "हाम्रो वेबसाइट प्रयोगका लागि मार्गदर्शन"} />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <p className="text-muted-foreground mb-8">
              {lang === "en"
                ? "Last updated: July 2026. These Terms of Service govern your use of the Grace Nepal Church website."
                : "अन्तिम अपडेट: जुलाई २०२६। यी सेवा सर्तहरूले तपाईंले अनुग्रह नेपाल मण्डलीको वेबसाइट कसरी प्रयोग गर्नुहुन्छ भन्ने नियमन गर्छन्।"}
            </p>
          </Reveal>

          <div className="space-y-6">
            {sections.map((s, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <Card className="p-6 border-border/60">
                  <h2 className="text-lg text-church-blue mb-3" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
                    {s.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">{s.content}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

