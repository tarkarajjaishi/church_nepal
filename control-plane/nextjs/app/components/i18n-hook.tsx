'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

type Locale = 'en' | 'ne';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    
    // Hero section
    heroTitle: 'Manage Your Church Online',
    heroSubtitle: 'All-in-one platform for churches in Nepal',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    
    // Features section
    featuresTitle: 'Powerful Features',
    featuresSubtitle: 'Everything you need to manage your church',
    feature1: 'Online Donations',
    feature1Desc: 'Accept donations securely online',
    feature2: 'Event Management',
    feature2Desc: 'Plan and promote your events',
    feature3: 'Member Directory',
    feature3Desc: 'Connect with your congregation',
    feature4: 'Sermon Upload',
    feature4Desc: 'Share messages with your community',
    
    // Pricing section
    pricingTitle: 'Simple Pricing',
    pricingSubtitle: 'Choose the plan that fits your church',
    freePlan: 'Free',
    proPlan: 'Pro',
    enterprisePlan: 'Enterprise',
    freePrice: 'Free forever',
    proPrice: '$29/month',
    enterprisePrice: 'Custom',
    freeFeature1: 'Up to 100 members',
    freeFeature2: 'Basic features',
    proFeature1: 'Unlimited members',
    proFeature2: 'Advanced features',
    proFeature3: 'Priority support',
    enterpriseFeature1: 'Custom integrations',
    enterpriseFeature2: 'Dedicated support',
    enterpriseFeature3: 'Training included',
    choosePlan: 'Choose Plan',
    
    // About section
    aboutTitle: 'About Us',
    aboutSubtitle: 'Serving churches across Nepal',
    aboutContent: 'We believe technology can help strengthen the spiritual community. Our platform enables churches to reach more people and better serve their congregations.',
    
    // Footer
    footerText: '© 2026 Church Nepal. All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    
    // Contact
    contactTitle: 'Contact Us',
    contactSubtitle: 'Have questions? Reach out to us.',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send Message',
    
    // CTA Section
    ctaTitle: 'Ready to grow your church?',
    ctaSubtitle: 'Join hundreds of churches using our platform',
    ctaButton: 'Start Free Trial'
  },
  ne: {
    // Navigation
    home: 'गृह',
    features: 'विशेषताहरू',
    pricing: 'मूल्य निर्धारण',
    about: 'हाम्रो बारे',
    contact: 'सम्पर्क',
    login: 'लगइन',
    signup: 'साइन अप',
    logout: 'लगआउट',
    
    // Hero section
    heroTitle: 'तपाईंको चर्च अनलाइन व्यवस्थापन गर्नुहोस्',
    heroSubtitle: 'नेपालका चर्चहरूका लागि एकै प्लेटफर्म',
    getStarted: 'सुरु गर्नुहोस्',
    learnMore: 'थप जान्नुहोस्',
    
    // Features section
    featuresTitle: 'शक्तिशाली विशेषताहरू',
    featuresSubtitle: 'तपाईंको चर्च व्यवस्थापन गर्न आवश्यक सबै कुरा',
    feature1: 'अनलाइन दान',
    feature1Desc: 'अनलाइन सुरक्षित रूपमा दान स्वीकार गर्नुहोस्',
    feature2: 'इभेन्ट व्यवस्थापन',
    feature2Desc: 'तपाईंको इभेन्टहरू योजना बनाउनुहोस् र प्रचार गर्नुहोस्',
    feature3: 'सदस्य डाइरेक्टरी',
    feature3Desc: 'तपाईंको समुदायसँग जडान गर्नुहोस्',
    feature4: 'प्रवचन अपलोड',
    feature4Desc: 'तपाईंको समुदायसँग सन्देश साझा गर्नुहोस्',
    
    // Pricing section
    pricingTitle: 'सरल मूल्य निर्धारण',
    pricingSubtitle: 'तपाईंको चर्चमा फिट हुने प्लान छान्नुहोस्',
    freePlan: 'निःशुल्क',
    proPlan: 'प्रो',
    enterprisePlan: 'एन्टरप्राइज',
    freePrice: 'सधैँ निःशुल्क',
    proPrice: 'महिनामा २९$',
    enterprisePrice: 'अनुकूलन गरिएको',
    freeFeature1: '१०० सदस्यहरू सम्म',
    freeFeature2: 'मौलिक विशेषताहरू',
    proFeature1: 'असीमित सदस्यहरू',
    proFeature2: 'उन्नत विशेषताहरू',
    proFeature3: 'प्राथमिकता सहयोग',
    enterpriseFeature1: 'अनुकूलन एकीकरण',
    enterpriseFeature2: 'समर्पित सहयोग',
    enterpriseFeature3: 'तालिम समावेश गरिएको',
    choosePlan: 'प्लान छान्नुहोस्',
    
    // About section
    aboutTitle: 'हाम्रो बारे',
    aboutSubtitle: 'नेपालभरका चर्चहरूलाई सेवा गर्दै',
    aboutContent: 'हामी विश्वास गर्छौं कि प्रविधि आध्यात्मिक समुदायलाई मजबूत बनाउन मद्दत गर्न सक्छ। हाम्रो प्लेटफर्मले चर्चहरूलाई धेरै मानिसहरूलाई पुग्न र तिनीहरूको समुदायलाई राम्रो तरिकाले सेवा गर्न अनुमति दिन्छ।',
    
    // Footer
    footerText: '© २०२६ चर्च नेपाल। सबै अधिकार सुरक्षित।',
    privacy: 'गोपनीयता नीति',
    terms: 'सेवा शर्तहरू',
    
    // Contact
    contactTitle: 'हामीलाई सम्पर्क गर्नुहोस्',
    contactSubtitle: 'प्रश्नहरू छन्? हामीलाई सम्पर्क गर्नुहोस्।',
    name: 'नाम',
    email: 'इमेल',
    message: 'सन्देश',
    send: 'सन्देश पठाउनुहोस्',
    
    // CTA Section
    ctaTitle: 'तपाईंको चर्च बढाउन तयार हुनुहुन्छ?',
    ctaSubtitle: 'हाम्रो प्लेटफर्म प्रयोग गर्दै गरेका सयौं चर्चहरूमा सामेल होनुहोस्',
    ctaButton: 'निःशुल्क परीक्षण सुरु गर्नुहोस्'
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['en', 'ne'].includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      // Detect browser language
      const browserLang = navigator.language.startsWith('ne') ? 'ne' : 'en';
      setLocale(browserLang as Locale);
    }
  }, []);

  const setLocaleAndSave = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    return translations[locale][key as keyof typeof translations.en] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleAndSave, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
