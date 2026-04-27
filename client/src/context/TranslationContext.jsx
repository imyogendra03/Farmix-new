import React, { createContext, useContext, useMemo, useState } from 'react';

const TranslationContext = createContext();

const translations = {
  en: {
    welcome: 'Welcome to Farmix',
    heroTitle: "Empowering India's Farming Future",
    heroSub:
      'Farmix connects Farmers, Buyers, and Agronomists through smart ML solutions to revolutionize the agricultural ecosystem with data-driven insights.',
    getStarted: 'Get Started Free',
    exploreTools: 'Explore Tools',
    featuresTitle: 'Powerful Platform Features',
    contactUs: 'Get in Touch',
    name: 'Full Name',
    email: 'Email Address',
    subject: 'Subject',
    message: 'Message',
    send: 'Send Message',
    footerText:
      "Empowering India's Farming Future with innovative technology connecting every stakeholder in the agricultural ecosystem."
  },
  hi: {
    welcome: 'Farmix में आपका स्वागत है',
    heroTitle: 'भारत के खेती के भविष्य को सशक्त बनाना',
    heroSub:
      'Farmix किसानों, खरीदारों और कृषि विशेषज्ञों को स्मार्ट ML समाधानों के माध्यम से जोड़ता है ताकि डेटा-आधारित इनसाइट्स के साथ कृषि पारिस्थितिकी तंत्र में क्रांति लाई जा सके।',
    getStarted: 'मुफ़्त में शुरू करें',
    exploreTools: 'टूल्स देखें',
    featuresTitle: 'प्लेटफ़ॉर्म की प्रमुख विशेषताएँ',
    contactUs: 'संपर्क करें',
    name: 'पूरा नाम',
    email: 'ईमेल पता',
    subject: 'विषय',
    message: 'संदेश',
    send: 'संदेश भेजें',
    footerText:
      'Farmix नवाचार तकनीक के साथ भारत के खेती के भविष्य को सशक्त बनाता है और कृषि पारिस्थितिकी तंत्र के हर हितधारक को जोड़ता है।'
  }
};

export const TranslationProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = useMemo(() => {
    return (key) => translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <TranslationContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

