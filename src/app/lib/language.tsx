import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "en" | "ne";

type Dict = Record<string, { en: string; ne: string }>;

// Central translation dictionary. Keys used across the app.
export const dict: Dict = {
  churchName: { en: "Grace Nepal Church", ne: "अनुग्रह नेपाल मण्डली" },
  tagline: { en: "Faith • Hope • Love", ne: "विश्वास • आशा • प्रेम" },
  joinLive: { en: "Join Live", ne: "प्रत्यक्ष जोडिनुहोस्" },
  search: { en: "Search", ne: "खोज्नुहोस्" },
  give: { en: "Give", ne: "दान" },

  // Nav
  nav_home: { en: "Home", ne: "गृहपृष्ठ" },
  nav_visit: { en: "I'm New", ne: "म नयाँ हुँ" },
  nav_about: { en: "About", ne: "हाम्रो बारे" },
  nav_pastor: { en: "Our Pastor", ne: "हाम्रा पास्टर" },
  nav_leadership: { en: "Leadership", ne: "नेतृत्व" },
  nav_ministries: { en: "Ministries", ne: "सेवाकार्य" },
  nav_sermons: { en: "Sermons", ne: "प्रवचन" },
  nav_events: { en: "Events", ne: "कार्यक्रम" },
  nav_gallery: { en: "Gallery", ne: "ग्यालरी" },
  nav_prayer: { en: "Prayer Request", ne: "प्रार्थना अनुरोध" },
  nav_contact: { en: "Contact", ne: "सम्पर्क" },

  // Hero
  hero_welcome: { en: "Welcome to God's House", ne: "परमेश्वरको घरमा स्वागत छ" },
  hero_sub: {
    en: "A loving community in the heart of Nepal, worshipping Jesus and serving our neighbours with joy.",
    ne: "नेपालको मुटुमा एक प्रेमपूर्ण समुदाय, येशूको आराधना गर्दै र हाम्रा छिमेकीहरूलाई आनन्दसाथ सेवा गर्दै।",
  },
  hero_join: { en: "Join This Sunday", ne: "यस आइतबार सामेल हुनुहोस्" },
  hero_watch: { en: "Watch Sermons", ne: "प्रवचन हेर्नुहोस्" },
  hero_pray: { en: "Request Prayer", ne: "प्रार्थना अनुरोध" },

  // Sections
  service_times: { en: "Service Times", ne: "सेवा समय" },
  welcome_title: { en: "A Word of Welcome", ne: "स्वागत सन्देश" },
  about_title: { en: "About Our Church", ne: "हाम्रो मण्डलीको बारेमा" },
  featured_sermons: { en: "Featured Sermons", ne: "विशेष प्रवचन" },
  our_ministries: { en: "Our Ministries", ne: "हाम्रा सेवाकार्य" },
  upcoming_events: { en: "Upcoming Events", ne: "आगामी कार्यक्रम" },
  testimonies: { en: "Testimonies", ne: "गवाहीहरू" },
  gallery_title: { en: "Life at Our Church", ne: "मण्डलीको जीवन" },
  verse_of_day: { en: "Verse of the Day", ne: "आजको वचन" },
  support_ministry: { en: "Support Our Ministry", ne: "हाम्रो सेवाकार्यलाई सहयोग" },
  learn_more: { en: "Learn More", ne: "थप जान्नुहोस्" },
  read_more: { en: "Read More", ne: "थप पढ्नुहोस्" },
  watch_now: { en: "Watch Now", ne: "अहिले हेर्नुहोस्" },
  view_all: { en: "View All", ne: "सबै हेर्नुहोस्" },
  register: { en: "Register", ne: "दर्ता गर्नुहोस्" },
  need_prayer: { en: "Need Prayer?", ne: "प्रार्थना चाहिन्छ?" },
  need_prayer_sub: {
    en: "Our prayer team would be honoured to stand with you. Every request is kept confidential.",
    ne: "हाम्रो प्रार्थना समूह तपाईंसँग उभिन पाउँदा सम्मानित हुनेछ। हरेक अनुरोध गोप्य राखिन्छ।",
  },

  // Detail pages
  related_sermons: { en: "Related Sermons", ne: "सम्बन्धित प्रवचन" },
  related_ministries: { en: "Other Ministries", ne: "अन्य सेवाकार्य" },
  related_events: { en: "Other Events", ne: "अन्य कार्यक्रम" },
  sermon_not_found: { en: "Sermon not found", ne: "प्रवचन भेटिएन" },
  event_not_found: { en: "Event not found", ne: "कार्यक्रम भेटिएन" },
  ministry_not_found: { en: "Ministry not found", ne: "सेवाकार्य भेटिएन" },
  back_to_sermons: { en: "Back to Sermons", ne: "प्रवचनमा फर्कनुहोस्" },
  back_to_events: { en: "Back to Events", ne: "कार्यक्रममा फर्कनुहोस्" },
  back_to_ministries: { en: "Back to Ministries", ne: "सेवाकार्यमा फर्कनुहोस्" },
  share: { en: "Share", ne: "साझा गर्नुहोस्" },
  add_to_calendar: { en: "Add to Calendar", ne: "क्यालेन्डरमा थप्नुहोस्" },
  join_ministry: { en: "Join This Ministry", ne: "यो सेवाकार्यमा सामेल हुनुहोस्" },
  privacy_policy: { en: "Privacy Policy", ne: "गोपनीयता नीति" },
  terms_of_service: { en: "Terms of Service", ne: "सेवा सर्तहरू" },
  sermon_info: { en: "Sermon Information", ne: "प्रवचन जानकारी" },
  speaker: { en: "Speaker", ne: "प्रवचनकर्ता" },
  series_label: { en: "Series", ne: "श्रृंखला" },
  topic_label: { en: "Topic", ne: "विषय" },
  duration: { en: "Duration", ne: "अवधि" },
  event_details: { en: "Event Details", ne: "कार्यक्रम विवरण" },
  when: { en: "When", ne: "कहिले" },
  where: { en: "Where", ne: "कहाँ" },
  description: { en: "Description", ne: "विवरण" },
  ministry_info: { en: "About This Ministry", ne: "यो सेवाकार्यको बारे" },
  meeting_schedule: { en: "Meeting Schedule", ne: "बैठक कार्यक्रम" },
  led_by: { en: "Led by", ne: "नेतृत्व" },
};

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => dict[key]?.[lang] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
