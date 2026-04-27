import React from 'react';
import PageTransition from '../components/PageTransition';
import { BrandWordmark } from '../components/BrandAssets';

const sections = [
  {
    title: 'Information We Collect',
    body:
      'Farmix may collect account details, farm profile data, uploaded crop images, booking details, and messages you send through the platform. Technical data such as browser type, device information, and page interactions may also be collected to keep the product stable and improve performance.'
  },
  {
    title: 'How We Use Data',
    body:
      'We use your information to provide crop recommendations, weather insights, expert consultations, account security, support, and analytics that help us improve the platform. We do not use your farm data for unrelated marketing without your consent.'
  },
  {
    title: 'Data Sharing',
    body:
      'Farmix only shares information with service providers or agricultural experts when needed to deliver the product, process support requests, or comply with legal obligations. Access is limited to the minimum data required for the task.'
  },
  {
    title: 'Security and Retention',
    body:
      'We apply reasonable administrative and technical safeguards to protect account and farm data. Information is retained only as long as necessary for platform operation, legal requirements, or support history.'
  },
  {
    title: 'Your Choices',
    body:
      'You can request updates to your account data, ask for deletion where applicable, and contact Farmix about privacy questions or support needs through the contact page.'
  }
];

const PrivacyPolicy = () => (
  <PageTransition>
    <div className="bg-gray-50 dark:bg-gray-900 transition-colors">
      <section className="bg-gradient-to-br from-nature-700 to-nature-900 py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-nature-100/80">Legal</p>
          <div className="mt-4 flex flex-col gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Privacy Policy</h1>
            <BrandWordmark className="h-10 md:h-12" alt="Farmix privacy policy brand name" />
          </div>
          <p className="mt-6 max-w-3xl text-lg text-nature-100">
            This policy explains how Farmix handles account, platform, and farm-related information.
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

export default PrivacyPolicy;
