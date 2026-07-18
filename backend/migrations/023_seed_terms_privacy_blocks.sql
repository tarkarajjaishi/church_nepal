-- Terms and Privacy page content blocks
-- Migrates hardcoded legal content into CMS-editable content_blocks.

INSERT INTO content_blocks (section_key, title, subtitle, body, image, items, enabled, sort_order)
VALUES
  -- Terms hero
  ('terms_hero',
   'Terms of Service',
   'Guidelines for using our website',
   'Last updated: July 2026. These Terms of Service govern your use of the Grace Nepal Church website.',
   NULL,
   '[{"crumb":"Terms of Service"}]'::jsonb,
   TRUE,
   0),
  -- Terms sections
  ('terms_sections',
   'Terms Sections',
   NULL,
   NULL,
   NULL,
   '[
    {"title":"Acceptance of Terms","title_ne":"सर्तहरूको स्वीकृति","content":"By accessing and using the Grace Nepal Church website (gracenepal.org), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.","content_ne":"अनुग्रह नेपाल मण्डलीको वेबसाइट (gracenepal.org) पहुँच र प्रयोग गरेर, तपाईं यी सेवा सर्तहरूबाट बाध्य हुन सहमत हुनुहुन्छ। यदि तपाईं यी सर्तहरूको कुनै भागसँग सहमत हुनुहुन्न भने, कृपया हाम्रो वेबसाइट प्रयोग नगर्नुहोस्।"},
    {"title":"Use of Website","title_ne":"वेबसाइटको प्रयोग","content":"This website is provided for informational purposes — to share about our church, ministries, events, and to provide ways to connect with us. You may browse, read content, and use the contact and registration forms for their intended purposes.","content_ne":"यो वेबसाइट सूचनात्मक उद्देश्यका लागि प्रदान गरिएको हो — हाम्रो मण्डली, सेवाकार्य, कार्यक्रमहरू बारे साझा गर्न र हामीसँग जोडिने तरिका प्रदान गर्न। तपाईं ब्राउज गर्न, सामग्री पढ्न र सम्पर्क तथा दर्ता फर्महरू प्रयोग गर्न सक्नुहुन्छ।"},
    {"title":"Event Registration","title_ne":"कार्यक्रम दर्ता","content":"When you register for an event through our website, we collect only the information needed to facilitate your attendance. Registration does not guarantee admission; some events may have limited capacity.","content_ne":"जब तपाईं हाम्रो वेबसाइटमार्फत कार्यक्रममा दर्ता हुनुहुन्छ, हामीले तपाईंको उपस्थिति सहज बनाउन आवश्यक जानकारी मात्र सङ्कलन गर्छौं। दर्ताले प्रवेशको ग्यारेन्टी दिँदैन।"},
    {"title":"Prayer Requests","title_ne":"प्रार्थना अनुरोध","content":"Prayer requests submitted through our website are voluntary and confidential. By submitting a request, you consent to our prayer team reviewing and praying over your request.","content_ne":"वेबसाइटमार्फत पेश गरिएका प्रार्थना अनुरोधहरू स्वैच्छिक र गोप्य हुन्। अनुरोध पेश गरेर, तपाईंले हाम्रो प्रार्थना टोलीले तपाईंको अनुरोध समीक्षा गर्न र प्रार्थना गर्न सहमति दिनुहुन्छ।"},
    {"title":"Intellectual Property","title_ne":"बौद्धिक सम्पत्ति","content":"All content on this website — including text, images, sermon recordings, graphics, and logos — is the property of Grace Nepal Church or its content providers and is protected by copyright law. You may share links to our content but may not reproduce or distribute it without permission.","content_ne":"यस वेबसाइटमा रहेको सबै सामग्री — पाठ, तस्बिरहरू, प्रवचन रेकर्डिङ, ग्राफिक्स र लोगोहरू सहित — अनुग्रह नेपाल मण्डली वा यसका सामग्री प्रदायकहरूको सम्पत्ति हो र बौद्धिक सम्पत्ति कानुनद्वारा सुरक्षित छ।"},
    {"title":"External Links","title_ne":"बाह्य लिङ्कहरू","content":"Our website may contain links to third-party platforms (YouTube, social media, maps). We are not responsible for the content, policies, or practices of these external sites.","content_ne":"हाम्रो वेबसाइटमा तेस्रो पक्ष प्लेटफर्महरू (YouTube, सामाजिक सञ्जाल, नक्साहरू) का लिङ्कहरू हुन सक्छन्। हामी यी बाह्य साइटहरूको सामग्री, नीतिहरू वा अभ्यासहरूको लागि जिम्मेवार छैनौं।"},
    {"title":"Disclaimer of Warranties","title_ne":"वारेन्टीको अस्वीकरण","content":"This website is provided ''as is'' without any warranties. While we strive to keep information accurate and up to date, we make no guarantees about the completeness or reliability of any content.","content_ne":"यो वेबसाइट ''जस्तो छ'' कुनै वारेन्टी बिना प्रदान गरिएको हो। हामी जानकारी सही र अद्यावधिक राख्न प्रयास गर्छौं, तर कुनै पनि सामग्रीको पूर्णता वा विश्वसनीयताको कुनै ग्यारेन्टी छैन।"},
    {"title":"Limitation of Liability","title_ne":"दायित्वको सीमा","content":"Grace Nepal Church shall not be liable for any damages arising from the use of this website, including but not limited to direct, indirect, incidental, or consequential damages.","content_ne":"अनुग्रह नेपाल मण्डली यो वेबसाइटको प्रयोगबाट उत्पन्न हुने कुनै पनि क्षतिको लागि जिम्मेवार हुनेछैन।"},
    {"title":"Modifications","title_ne":"संशोधनहरू","content":"We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Continued use of the website after changes constitutes acceptance of the new terms.","content_ne":"हामीलाई यी सेवा सर्तहरू कुनै पनि समय अपडेट गर्ने अधिकार छ। परिवर्तनहरू यस पृष्ठमा अद्यावधिक मितिसहित पोस्ट गरिनेछन्।"},
    {"title":"Contact","title_ne":"सम्पर्क","content":"For any questions about these Terms of Service, please contact us at hello@gracenepal.org or call +977 1-4000000.","content_ne":"यी सेवा सर्तहरूबारे कुनै पनि प्रश्नका लागि, कृपया hello@gracenepal.org मा सम्पर्क गर्नुहोस् वा +977 1-4000000 मा फोन गर्नुहोस्।"}
   ]'::jsonb,
   TRUE,
   1),
  -- Privacy hero
  ('privacy_hero',
   'Privacy Policy',
   'How we handle your information',
   'Last updated: July 2026. This Privacy Policy describes how Grace Nepal Church collects, uses, and protects your personal information.',
   NULL,
   '[{"crumb":"Privacy Policy"}]'::jsonb,
   TRUE,
   0),
  -- Privacy sections
  ('privacy_sections',
   'Privacy Sections',
   NULL,
   NULL,
   NULL,
   '[
    {"title":"Information We Collect","title_ne":"हामीले सङ्कलन गर्ने जानकारी","content":"When you visit our website, submit a prayer request, register for an event, or subscribe to our newsletter, we may collect personal information such as your name, email address, phone number, and any information you choose to provide in forms.","content_ne":"जब तपाईं हाम्रो वेबसाइट भ्रमण गर्नुहुन्छ, प्रार्थना अनुरोध पेश गर्नुहुन्छ, कार्यक्रममा दर्ता हुनुहुन्छ, वा न्यूजलेटरमा सदस्यता लिनुहुन्छ, हामीले तपाईंको नाम, इमेल ठेगाना, फोन नम्बर, र फर्ममा दिइएको जानकारी सङ्कलन गर्न सक्छौं।"},
    {"title":"How We Use Your Information","title_ne":"तपाईंको जानकारी कसरी प्रयोग गर्छौं","content":"We use your information to respond to your inquiries, process event registrations, send newsletter updates (if you subscribe), and improve our website and ministry. We do not sell, trade, or rent your personal information to third parties.","content_ne":"हामी तपाईंको जानकारी तपाईंको सोधपुछको जवाफ दिन, कार्यक्रम दर्ता प्रशोधन गर्न, न्यूजलेटर अपडेट पठाउन (यदि तपाईं सदस्यता लिनुहुन्छ), र हाम्रो वेबसाइट र सेवाकार्य सुधार गर्न प्रयोग गर्छौं। हामी तपाईंको व्यक्तिगत जानकारी तेस्रो पक्षलाई बेच्दैनौं, व्यापार गर्दैनौं, वा बाँड्दैनौं।"},
    {"title":"Prayer Requests","title_ne":"प्रार्थना अनुरोध","content":"Prayer requests submitted through our website are treated with the utmost confidentiality. They are shared only with our designated prayer team and are never published without your explicit consent.","content_ne":"वेबसाइटमार्फत पेश गरिएका प्रार्थना अनुरोधहरूलाई सर्वोच्च गोप्यताका साथ व्यवहार गरिन्छ। तिनीहरू केवल हाम्रो नियुक्त प्रार्थना टोलीसँग मात्र साझा गरिन्छ र तपाईंको स्पष्ट सहमति बिना कहिल्यै प्रकाशित गरिँदैन।"},
    {"title":"Cookies and Analytics","title_ne":"कुकीज र विश्लेषण","content":"Our website may use cookies to enhance your browsing experience. We may use basic analytics to understand how visitors interact with our site, helping us improve our content and user experience.","content_ne":"हाम्रो वेबसाइटले तपाईंको ब्राउजिङ अनुभव सुधार गर्न कुकीज प्रयोग गर्न सक्छ। हामी आगन्तुकहरूले हाम्रो साइटसँग कसरी अन्तरक्रिया गर्छन् भनेर बुझ्न आधारभूत विश्लेषण प्रयोग गर्न सक्छौं।"},
    {"title":"Third-Party Links","title_ne":"तेस्रो पक्ष लिङ्कहरू","content":"Our website may contain links to external sites (such as YouTube for sermon recordings). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.","content_ne":"हाम्रो वेबसाइटमा बाह्य साइटहरू (जस्तै प्रवचन रेकर्डिङको लागि YouTube) का लिङ्कहरू हुन सक्छन्। हामी यी बाह्य साइटहरूको गोपनीयता अभ्यासको लागि जिम्मेवार छैनौं।"},
    {"title":"Data Security","title_ne":"डेटा सुरक्षा","content":"We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.","content_ne":"हामी तपाईंको व्यक्तिगत जानकारी सुरक्षित राख्न उपयुक्त सुरक्षा उपायहरू लागू गर्छौं। तर, इन्टरनेटमार्फत प्रसारणको कुनै पनि विधि 100% सुरक्षित छैन।"},
    {"title":"Your Rights","title_ne":"तपाईंका अधिकारहरू","content":"You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us using the information below.","content_ne":"तपाईंले आफ्नो व्यक्तिगत डेटाको पहुँच, सुधार, वा मेटाइको अनुरोध गर्ने अधिकार राख्नुहुन्छ। यी अधिकारहरू प्रयोग गर्न, कृपया तलको जानकारी प्रयोग गरेर हामीलाई सम्पर्क गर्नुहोस्।"},
    {"title":"Contact Us","title_ne":"हामीलाई सम्पर्क गर्नुहोस्","content":"If you have any questions about this Privacy Policy, please contact us at hello@gracenepal.org or call +977 1-4000000.","content_ne":"यदि तपाईंसँग यस गोपनीयता नीतिबारे कुनै प्रश्न छ भने, कृपया hello@gracenepal.org मा सम्पर्क गर्नुहोस् वा +977 1-4000000 मा फोन गर्नुहोस्।"}
   ]'::jsonb,
   TRUE,
   1)
ON CONFLICT (section_key) DO NOTHING;
