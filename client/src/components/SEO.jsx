import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'Farmix | Smart Agriculture Platform';
const DEFAULT_DESCRIPTION =
  'Farmix is an agriculture platform for crop recommendations, disease prediction, expert consultations, market intelligence, and farm monitoring.';
const DEFAULT_IMAGE = '/Farmixlogo.png';
const SITE_NAME = 'Farmix';

const routeSeo = [
  {
    match: (pathname) => pathname === '/',
    title: 'Farmix | AI Farming, Experts, Weather and Market Intelligence',
    description:
      'Improve farm decisions with crop recommendations, disease detection, yield forecasting, expert support, and real-time agriculture insights on Farmix.',
    keywords:
      'Farmix, smart farming, agriculture platform, crop recommendation, disease prediction, yield forecasting, farm analytics',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/about-us',
    title: 'About Farmix | Smart Agriculture Platform',
    description:
      'Learn how Farmix helps farmers with AI insights, expert guidance, weather intelligence, and data-driven farm planning.',
    keywords: 'about Farmix, agri technology, farming platform, smart agriculture',
    type: 'article'
  },
  {
    match: (pathname) => pathname === '/contact',
    title: 'Contact Farmix | Agriculture Support and Platform Help',
    description:
      'Get in touch with Farmix for agriculture platform support, product questions, and farmer assistance.',
    keywords: 'contact Farmix, agriculture support, farmer help',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/experts',
    title: 'Agriculture Experts | Book Farming Consultations on Farmix',
    description:
      'Browse verified agricultural experts, compare expertise, and book consultations for crop, soil, and farm management guidance.',
    keywords: 'agriculture experts, farming consultation, agronomist booking, Farmix experts',
    type: 'website'
  },
  {
    match: (pathname) => pathname.startsWith('/expert/'),
    title: 'Expert Profile | Farmix Agriculture Consultation',
    description:
      'View expert agriculture consultation details, expertise, and reviews on Farmix.',
    keywords: 'expert profile, agriculture consultant, farm expert, Farmix',
    type: 'profile'
  },
  {
    match: (pathname) => pathname === '/crop-recommendation',
    title: 'Crop Recommendation | Farmix Smart Farming Tools',
    description:
      'Get crop recommendations based on soil, rainfall, temperature, and humidity with Farmix agriculture tools.',
    keywords: 'crop recommendation, soil analysis, farming AI, agriculture planning',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/disease-prediction',
    title: 'Disease Prediction | Farmix Crop Health AI',
    description:
      'Detect crop disease risks early using Farmix AI-powered disease prediction and farm health support.',
    keywords: 'crop disease detection, agriculture AI, plant disease prediction, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/yield-prediction',
    title: 'Yield Prediction | Farmix Farm Forecasting',
    description:
      'Estimate crop yield using weather and farm inputs to support smarter production planning with Farmix.',
    keywords: 'yield prediction, farm forecasting, crop analytics, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/weather-monitor',
    title: 'Weather Monitor | Farmix Farm Weather Intelligence',
    description:
      'Track farm weather conditions, temperature, rainfall, wind, and monitoring insights with Farmix.',
    keywords: 'farm weather, agriculture weather monitor, rainfall forecast, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/market-prediction',
    title: 'Market Intelligence | Farmix Agricultural Market Insights',
    description:
      'Review agricultural pricing and market intelligence data to improve crop selling decisions with Farmix.',
    keywords: 'agriculture market intelligence, crop prices, farm market insights, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/farm-map',
    title: 'Farm Map | Farmix Location and Monitoring Tools',
    description:
      'Visualize and manage farm locations with Farmix mapping and monitoring tools.',
    keywords: 'farm map, agriculture mapping, location monitoring, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/farm-calendar',
    title: 'Farm Calendar | Farmix Planning and Task Scheduling',
    description:
      'Plan farming activities, seasonal tasks, and reminders using the Farmix farm calendar.',
    keywords: 'farm calendar, agriculture planning, crop schedule, Farmix',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/community',
    title: 'Community | Farmix Farmers and Expert Network',
    description:
      'Join the Farmix community to connect with farmers, experts, and agriculture discussions.',
    keywords: 'farmer community, agriculture forum, Farmix community',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/reviews',
    title: 'Reviews | Farmix Farmer and Expert Feedback',
    description:
      'Read reviews and feedback about Farmix experts and agriculture consultation experiences.',
    keywords: 'Farmix reviews, agriculture feedback, expert reviews',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/history',
    title: 'Consultation History | Farmix',
    description:
      'Review expert appointment history, consultation chat logs, and review records on Farmix.',
    keywords: 'Farmix history, consultation records, appointment history, chat history',
    type: 'website'
  },
  {
    match: (pathname) => pathname === '/privacy-policy',
    title: 'Privacy Policy | Farmix',
    description: 'Review how Farmix handles account, platform, and farm-related information.',
    keywords: 'Farmix privacy policy, agriculture platform privacy',
    type: 'article'
  },
  {
    match: (pathname) => pathname === '/terms-of-service',
    title: 'Terms of Service | Farmix',
    description: 'Read the terms that apply to using the Farmix smart agriculture platform.',
    keywords: 'Farmix terms of service, agriculture platform terms',
    type: 'article'
  }
];

const noIndexRoutes = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/dashboard',
  '/user-dashboard',
  '/expert-dashboard',
  '/admin',
  '/admin-dashboard',
  '/analytics',
  '/farmer-bookings',
  '/my-appointments',
  '/history'
]);

const getBaseUrl = () => {
  if (process.env.REACT_APP_SITE_URL) {
    return process.env.REACT_APP_SITE_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
};

const getSeoConfig = (pathname) => {
  const matched = routeSeo.find((entry) => entry.match(pathname));
  return matched || {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: 'Farmix, agriculture platform, smart farming',
    type: 'website'
  };
};

const upsertMetaTag = (attribute, key, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const upsertLinkTag = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

const SEO = () => {
  const { pathname } = useLocation();
  const seo = getSeoConfig(pathname);
  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}${pathname === '/' ? '' : pathname}`;
  const imageUrl = `${baseUrl}${DEFAULT_IMAGE}`;
  const robotsContent = noIndexRoutes.has(pathname) ? 'noindex, nofollow' : 'index, follow';

  useEffect(() => {
    document.documentElement.lang = 'en';
    document.title = seo.title;

    upsertMetaTag('name', 'description', seo.description);
    upsertMetaTag('name', 'keywords', seo.keywords);
    upsertMetaTag('name', 'robots', robotsContent);
    upsertMetaTag('name', 'author', SITE_NAME);
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:type', seo.type);
    upsertMetaTag('property', 'og:title', seo.title);
    upsertMetaTag('property', 'og:description', seo.description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', imageUrl);
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', seo.title);
    upsertMetaTag('name', 'twitter:description', seo.description);
    upsertMetaTag('name', 'twitter:image', imageUrl);
    upsertLinkTag('canonical', canonicalUrl);
  }, [canonicalUrl, imageUrl, robotsContent, seo.description, seo.keywords, seo.title, seo.type]);

  return null;
};

export default SEO;
