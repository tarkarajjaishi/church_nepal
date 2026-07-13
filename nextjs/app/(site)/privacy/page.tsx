'use client'

import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { images } from "@/lib/data";
import { useLang } from "@/lib/language";

export default function Privacy() {
  const { lang } = useLang();

  const sections = lang === "en" ? [
    { title: "Information We Collect", content: "When you visit our website, submit a prayer request, register for an event, or subscribe to our newsletter, we may collect personal information such as your name, email address, phone number, and any information you choose to provide in forms." },
    { title: "How We Use Your Information", content: "We use your information to respond to your inquiries, process event registrations, send newsletter updates (if you subscribe), and improve our website and ministry. We do not sell, trade, or rent your personal information to third parties." },
    { title: "Prayer Requests", content: "Prayer requests submitted through our website are treated with the utmost confidentiality. They are shared only with our designated prayer team and are never published without your explicit consent." },
    { title: "Cookies and Analytics", content: "Our website may use cookies to enhance your browsing experience. We may use basic analytics to understand how visitors interact with our site, helping us improve our content and user experience." },
    { title: "Third-Party Links", content: "Our website may contain links to external sites (such as YouTube for sermon recordings). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies." },
    { title: "Data Security", content: "We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security." },
    { title: "Your Rights", content: "You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us using the information below." },
    { title: "Contact Us", content: "If you have any questions about this Privacy Policy, please contact us at hello@gracenepal.org or call +977 1-4000000." },
  ] : [
    { title: "हामीले सङ्कलन गर्ने जानकारी", content: "जब तपाईं हाम्रो वेबसाइट भ्रमण गर्नुहुन्छ, प्रार्थना अनुरोध पेश गर्नुहुन्छ, कार्यक्रममा दर्ता हुनुहुन्छ, वा न्यूजलेटरमा सदस्यता लिनुहुन्छ, हामीले तपाईंको नाम, इमेल ठेगाना, फोन नम्बर, र फर्ममा दिइएको जानकारी सङ्कलन गर्न सक्छौं।" },
    { title: "तपाईंको जानकारी कसरी प्रयोग गर्छौं", content: "हामी तपाईंको जानकारी तपाईंको सोधपुछको जवाफ दिन, कार्यक्रम दर्ता प्रशोधन गर्न, न्यूजलेटर अपडेट पठाउन (यदि तपाईं सदस्यता लिनुहुन्छ), र हाम्रो वेबसाइट र सेवाकार्य सुधार गर्न प्रयोग गर्छौं। हामी तपाईंको व्यक्तिगत जानकारी तेस्रो पक्षलाई बेच्दैनौं, व्यापार गर्दैनौं, वा बाँड्दैनौं।" },
    { title: "प्रार्थना अनुरोध", content: "वेबसाइटमार्फत पेश गरिएका प्रार्थना अनुरोधहरूलाई सर्वोच्च गोप्यताका साथ व्यवहार गरिन्छ। तिनीहरू केवल हाम्रो नियुक्त प्रार्थना टोलीसँग मात्र साझा गरिन्छ र तपाईंको स्पष्ट सहमति बिना कहिल्यै प्रकाशित गरिँदैन।" },
    { title: "कुकीज र विश्लेषण", content: "हाम्रो वेबसाइटले तपाईंको ब्राउजिङ अनुभव सुधार गर्न कुकीज प्रयोग गर्न सक्छ। हामी आगन्तुकहरूले हाम्रो साइटसँग कसरी अन्तरक्रिया गर्छन् भनेर बुझ्न आधारभूत विश्लेषण प्रयोग गर्न सक्छौं।" },
    { title: "तेस्रो पक्ष लिङ्कहरू", content: "हाम्रो वेबसाइटमा बाह्य साइटहरू (जस्तै प्रवचन रेकर्डिङको लागि YouTube) का लिङ्कहरू हुन सक्छन्। हामी यी बाह्य साइटहरूको गोपनीयता अभ्यासको लागि जिम्मेवार छैनौं।" },
    { title: "डेटा सुरक्षा", content: "हामी तपाईंको व्यक्तिगत जानकारी सुरक्षित राख्न उपयुक्त सुरक्षा उपायहरू लागू गर्छौं। तर, इन्टरनेटमार्फत प्रसारणको कुनै पनि विधि 100% सुरक्षित छैन।" },
    { title: "तपाईंका अधिकारहरू", content: "तपाईंले आफ्नो व्यक्तिगत डेटाको पहुँच, सुधार, वा मेटाइको अनुरोध गर्ने अधिकार राख्नुहुन्छ। यी अधिकारहरू प्रयोग गर्न, कृपया तलको जानकारी प्रयोग गरेर हामीलाई सम्पर्क गर्नुहोस्।" },
    { title: "हामीलाई सम्पर्क गर्नुहोस्", content: "यदि तपाईंसँग यस गोपनीयता नीतिबारे कुनै प्रश्न छ भने, कृपया hello@gracenepal.org मा सम्पर्क गर्नुहोस् वा +977 1-4000000 मा फोन गर्नुहोस्।" },
  ];

  return (
    <div>
      <PageHero title={lang === "en" ? "Privacy Policy" : "गोपनीयता नीति"} crumb="Privacy Policy" image={images.cross}
        subtitle={lang === "en" ? "How we handle your information" : "हामी तपाईंको जानकारी कसरी व्यवहार गर्छौं"} />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <p className="text-muted-foreground mb-8">
              {lang === "en"
                ? "Last updated: July 2026. This Privacy Policy describes how Grace Nepal Church collects, uses, and protects your personal information."
                : "अन्तिम अपडेट: जुलाई २०२६। यस गोपनीयता नीतिले अनुग्रह नेपाल मण्डलीले तपाईंको व्यक्तिगत जानकारी कसरी सङ्कलन, प्रयोग र सुरक्षा गर्छ भनेर वर्णन गर्छ।"}
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

