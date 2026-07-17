-- Seed content blocks for the /visit page

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('visit_hero', 'Plan Your Visit', 'We can''t wait to meet you. Here''s everything you need for a relaxed, welcoming first visit.', '[{"image":"https://images.unsplash.com/photo-1528828085966-aff4e01c5f2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080","crumb":"I''m New"}]', true, 0)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('visit_facts', '', '', '[
  {"icon":"Clock","label":"Sunday, 10:00 AM","labelNe":"आइतबार, बिहान १०:००","sub":"Arrive by 9:45 AM","subNe":"९:४५ सम्म आइपुग्नुहोस्"},
  {"icon":"MapPin","label":"Baneshwor, Kathmandu","labelNe":"बानेश्वर, काठमाडौं","sub":"Free parking on site","subNe":"निःशुल्क पार्किङ"},
  {"icon":"Clock","label":"~90 minutes","labelNe":"~९० मिनेट","sub":"Tea & fellowship after","subNe":"पछि चिया र सङ्गति"},
  {"icon":"Baby","label":"Kids welcome","labelNe":"बच्चाहरूलाई स्वागत","sub":"Safe children''s ministry","subNe":"सुरक्षित बाल सेवा"}
]', true, 1)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('visit_steps', 'Your First Sunday, Step by Step', '', '[
  {"step":"1","title":"Arrive a little early","titleNe":"केही चाँडो आइपुग्नुहोस्","text":"Come around 9:45 AM. A friendly welcome team will greet you at the door and help you find a seat.","textNe":"बिहान ९:४५ तिर आउनुहोस्। स्वागत टोलीले तपाईंलाई ढोकामा भेट्नेछ।"},
  {"step":"2","title":"Check in your kids","titleNe":"बच्चाहरू चेक-इन गर्नुहोस्","text":"Drop your children at the safe, fun children''s ministry — they''ll love it, and you can worship at ease.","textNe":"बच्चाहरूलाई सुरक्षित बाल सेवामा छोड्नुहोस्।"},
  {"step":"3","title":"Enjoy the service","titleNe":"सेवाको आनन्द लिनुहोस्","text":"Worship, hear an encouraging message from the Bible, and simply be — no pressure, no expectations.","textNe":"आराधना गर्नुहोस्, बाइबलबाट उत्साहजनक सन्देश सुन्नुहोस्।"},
  {"step":"4","title":"Stay for tea","titleNe":"चियाको लागि बस्नुहोस्","text":"Grab a cup of tea afterwards and meet the family. We''d love to say hello and answer any questions.","textNe":"पछि एक कप चिया लिनुहोस् र परिवारलाई भेट्नुहोस्।"}
]', true, 2)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, items, enabled, sort_order) VALUES
('visit_expect', 'What to Expect', '', '[
  {"icon":"Clock","title":"How long is the service?","titleNe":"सेवा कति लामो हुन्छ?","text":"Around 90 minutes — worship, a practical Bible message, and time to connect over tea afterwards.","textNe":"लगभग ९० मिनेट — आराधना, व्यावहारिक बाइबल सन्देश, र पछि चिया खाँदै भेटघाट।"},
  {"icon":"Shirt","title":"What should I wear?","titleNe":"मैले के लगाउने?","text":"Come as you are. You''ll see everything from traditional kurta to jeans — there''s no dress code here.","textNe":"जस्तो हुनुहुन्छ त्यस्तै आउनुहोस्। कुर्ता देखि जिन्स सम्म — यहाँ कुनै पोशाक नियम छैन।"},
  {"icon":"Baby","title":"What about my kids?","titleNe":"मेरा बच्चाहरूको के हुन्छ?","text":"Safe, fun children''s ministry runs during the service, with trained volunteers and easy check-in.","textNe":"सेवाको समयमा सुरक्षित, रमाइलो बाल सेवा चल्छ, तालिम प्राप्त स्वयंसेवकहरूसँग।"},
  {"icon":"Music","title":"What is worship like?","titleNe":"आराधना कस्तो हुन्छ?","text":"Heartfelt, joyful singing in Nepali and English, led by our worship team — clap, sing, or simply soak it in.","textNe":"नेपाली र अङ्ग्रेजीमा हृदयस्पर्शी, आनन्दमय गायन, हाम्रो आराधना समूहद्वारा नेतृत्व।"},
  {"icon":"Car","title":"Where do I park?","titleNe":"गाडी कहाँ राख्ने?","text":"Free parking is available beside the church, and we''re a short walk from the Baneshwor bus stop.","textNe":"मण्डली छेउमा निःशुल्क पार्किङ उपलब्ध छ, र बानेश्वर बस स्टपबाट छोटो पैदल दूरीमा।"},
  {"icon":"Coffee","title":"Will I be singled out?","titleNe":"मलाई अलग गरिन्छ?","text":"Never. There''s no pressure to give or stand up. Come, relax, and experience God''s family at your own pace.","textNe":"कहिल्यै होइन। दान वा उठ्ने कुनै दबाब छैन। आउनुहोस्, आराम गर्नुहोस्।"}
]', true, 3)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO content_blocks (section_key, title, subtitle, body, items, enabled, sort_order) VALUES
('visit_cta', 'Let us know you''re coming', 'It''s completely optional — but if you tell us you''re visiting, someone will be ready to welcome you personally and show you around.', '', '[
  {"nameLabel":"Name","nameLabelNe":"नाम","namePlaceholder":"Your name","namePlaceholderNe":"तपाईंको नाम","phoneLabel":"Phone / Viber","phoneLabelNe":"फोन / भाइबर","dateLabel":"Which Sunday?","dateLabelNe":"कुन आइतबार?","submitLabel":"I''m Planning to Visit","submitLabelNe":"म भ्रमण गर्ने योजनामा छु","successMessage":"Thank you! We look forward to meeting you.","successMessageNe":"धन्यवाद! हामी तपाईंलाई भेट्न उत्सुक छौं।","whatsappLabel":"Or message us on WhatsApp / Viber","whatsappLabelNe":"वा WhatsApp / Viber मा सन्देश पठाउनुहोस्","whatsappUrl":"https://wa.me/9771400000","mapUrl":"https://www.openstreetmap.org/export/embed.html?bbox=85.32%2C27.69%2C85.35%2C27.71&layer=mapnik&marker=27.70%2C85.335","directionsTitle":"Getting here","directionsTitleNe":"यहाँ आउने बाटो","directionsText":"Free on-site parking. A 5-minute walk from Baneshwor Chowk bus stop.","directionsTextNe":"निःशुल्क पार्किङ। बानेश्वर चोक बस स्टपबाट ५ मिनेट पैदल।","contactLabel":"Still have questions? Contact us","contactLabelNe":"अझै प्रश्न छ? सम्पर्क गर्नुहोस्"}
]', true, 4)
ON CONFLICT (section_key) DO NOTHING;
