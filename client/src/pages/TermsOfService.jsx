import React from 'react';
import PageTransition from '../components/PageTransition';
import { BrandWordmark } from '../components/BrandAssets';

const sections = [
  {
    title: 'Use of the Platform',
    body:
      'Farmix provides agriculture-related software tools, information, and expert connection features. You are responsible for the accuracy of the information you submit and for how you apply recommendations on your farm.'
  },
  {
    title: 'Accounts and Access',
    body:
      'Users must protect their login credentials and use the platform lawfully. Farmix may suspend access for misuse, abuse, fraudulent activity, or actions that threaten platform security or other users.'
  },
  {
    title: 'Advisory Nature of Content',
    body:
      'Predictions, recommendations, weather insights, and expert content are decision-support tools. They do not replace independent judgment, local agronomic advice, or compliance with applicable regulations.'
  },
  {
    title: 'Bookings and Communications',
    body:
      'When using consultations, contact forms, or expert booking features, you agree to provide respectful and accurate communication. Availability, response times, and outcomes may vary by expert and region.'
  },
  {
    title: 'Changes to the Service',
    body:
      'Farmix may update features, APIs, and policies to improve security, reliability, and product quality. Continued use of the platform after changes means you accept the updated terms.'
  }
];

const TermsOfService = () => (
  <PageTransition>
    <div className="bg-gray-50 dark:bg-gray-900 transition-colors">
      <section className="bg-gradient-to-br from-gray-900 to-nature-900 py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-300">Legal</p>
          <div className="mt-4 flex flex-col gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Terms of Service</h1>
            <BrandWordmark className="h-10 md:h-12" alt="Farmix terms of service brand name" />
          </div>
          <p className="mt-6 max-w-3xl text-lg text-gray-200">
            These terms describe the conditions for using Farmix and its agriculture support tools.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="space-y-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  </PageTransition>
);

export default TermsOfService;
