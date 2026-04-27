import React, { useState } from 'react';
import { ChevronDown, Leaf, Zap, BarChart3, Cloud, Users, Brain, MapPin, TrendingUp, Shield, Award, Lightbulb } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { BrandWordmark } from '../components/BrandAssets';

const AboutUs = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How does the crop recommendation system work?",
      answer: "Farmix analyzes your farm's soil data, weather patterns, location, and historical yields to recommend the most suitable crops. Using machine learning algorithms, it evaluates multiple factors including climate zones, water availability, market demand, and your farming expertise to provide personalized recommendations with confidence scores."
    },
    {
      id: 2,
      question: "What is the disease prediction feature?",
      answer: "Our AI-powered disease prediction system uses real-time weather data and crop images captured via smartphone cameras to detect early signs of crop diseases. It provides early warnings and preventive measures before diseases spread, potentially saving your entire harvest."
    },
    {
      id: 3,
      question: "How accurate is the yield prediction?",
      answer: "Yield prediction accuracy typically ranges from 85-92% based on historical data, weather patterns, soil conditions, and crop management practices. The accuracy improves over time as we collect more data from your farm. Factors like pest outbreaks or extreme weather may require manual adjustments."
    },
    {
      id: 4,
      question: "Can I use Farmix on my basic smartphone?",
      answer: "Yes! Farmix is designed to work on basic smartphones with minimal data requirements. The app has an offline mode so you can access critical information without internet. High-resolution image uploads are optimized for slower connections."
    },
    {
      id: 5,
      question: "How does Farmix help me maximize crop yield?",
      answer: "Farmix combines historical farm data, current weather patterns, soil conditions, and proven farming practices to provide yield prediction with 85-92% accuracy. The system learns from your farm's specific conditions over time and provides recommendations for optimal planting density, fertilizer timing, and water management to maximize your crop yields."
    },
    {
      id: 6,
      question: "What is the Weather Intelligence feature?",
      answer: "Real-time weather monitoring with hourly forecasts, rainfall predictions, wind alerts, and UV index warnings. Our agricultural advisories automatically alert you about optimal planting/harvesting times and weather-related crop threats."
    },
    {
      id: 7,
      question: "How can I connect with agricultural experts?",
      answer: "Farmix's expert marketplace lets you book consultations with verified agricultural experts. You can share your farm data, crop images, and specific challenges. Experts provide personalized solutions based on your farm's unique conditions."
    },
    {
      id: 8,
      question: "Is my farm data secure?",
      answer: "Absolutely. All farm data is encrypted end-to-end, stored on secure servers, and compliant with international data protection standards. You have full control over data sharing and can revoke access anytime."
    },
    {
      id: 9,
      question: "Does Farmix have a market intelligence feature?",
      answer: "Yes! Real-time market prices for major crops, demand trends, weather-adjusted price predictions, and direct buyer connections. You can make informed selling decisions and avoid price fluctuations."
    },
    {
      id: 10,
      question: "What is the farm calendar feature?",
      answer: "An intelligent farming calendar that auto-generates seasonal tasks based on your crops, weather, and local agricultural best practices. It sends timely reminders for planting, fertilizing, pest management, and harvesting activities."
    }
  ];

  const workflowSteps = [
    {
      number: 1,
      title: "Farm Registration & Profiling",
      description: "Register your farm with location, size, soil type, and crops. Farmix maps your farm and collects baseline data.",
      features: ["GPS coordinates", "Soil analysis", "Crop history", "Weather data"]
    },
    {
      number: 2,
      title: "Data Collection & Monitoring",
      description: "Real-time data from weather stations, satellite imagery, smartphone captures, and user inputs.",
      features: ["Weather patterns", "Rainfall data", "Crop images", "Market prices", "Soil information"]
    },
    {
      number: 3,
      title: "AI Analysis & Predictions",
      description: "Advanced ML models process all data to generate actionable insights and predictions.",
      features: ["Disease detection", "Yield prediction", "Crop recommendations", "Pest alerts"]
    },
    {
      number: 4,
      title: "Smart Recommendations",
      description: "Personalized recommendations for planting, irrigation, fertilization, and pest management.",
      features: ["Optimal planting times", "Irrigation schedules", "Fertilizer dosage", "Pest prevention"]
    },
    {
      number: 5,
      title: "Expert Consultation",
      description: "Connect with verified agricultural experts for specific challenges or second opinions.",
      features: ["Video consultations", "Farm visits", "Personalized guidance", "Certification assistance"]
    },
    {
      number: 6,
      title: "Performance Tracking",
      description: "Monitor your farm's performance with detailed analytics and historical comparisons.",
      features: ["Yield tracking", "ROI analysis", "Sustainability metrics", "Growth trends"]
    }
  ];

  const coreFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Crop Recommendations",
      description: "Get scientifically-backed crop suggestions tailored to your farm's unique conditions"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Weather Intelligence",
      description: "Real-time weather monitoring with agricultural advisories and optimal farming alerts"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Yield Prediction",
      description: "Forecast crop yields with 85%+ accuracy using ML and historical farm data"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Disease Detection",
      description: "Early disease identification using crop image analysis and weather pattern correlation"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Market Intelligence",
      description: "Live market prices, demand trends, and buyer connections for better selling decisions"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Expert Network",
      description: "Connect with verified agricultural experts for personalized guidance and consultations"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Performance Analytics",
      description: "Track farm performance, ROI, and growth with comprehensive dashboards"
    }
  ];

  const systemArchitecture = [
    {
      layer: "Data Collection Layer",
      components: ["Weather APIs", "Satellite Data", "Mobile App", "User Input"],
      color: "from-blue-500 to-blue-600"
    },
    {
      layer: "Processing & Analytics Layer",
      components: ["Data Pipeline", "ML Models", "Data Warehouse", "Real-time Processing"],
      color: "from-purple-500 to-purple-600"
    },
    {
      layer: "Intelligence & Insights Layer",
      components: ["Recommendations Engine", "Predictive Models", "Decision Support System"],
      color: "from-green-500 to-green-600"
    },
    {
      layer: "User Interface Layer",
      components: ["Mobile App", "Web Dashboard", "Expert Portal", "Admin Console"],
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 transition-colors">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 dark:from-green-900 dark:via-green-800 dark:to-green-950 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-4 mb-6">
                <span className="text-5xl md:text-6xl font-extrabold text-white">About</span>
                <BrandWordmark className="h-12 md:h-14" alt="Farmix about page brand name" />
              </div>
              <p className="text-xl md:text-2xl text-green-100 mb-8">
                Revolutionary Agricultural Technology Platform Empowering Farmers with AI, Real-time Monitoring, and Expert Guidance
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-green-50">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>AI-Powered Intelligence</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Data Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  <span>Sustainable Farming</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-l-4 border-green-600">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-green-600" />
                Our Vision
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To transform agriculture globally through cutting-edge technology and innovation, creating a future where every farmer—regardless of size or location—has access to enterprise-grade AI tools, expert knowledge, real-time monitoring systems, and market intelligence.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border-l-4 border-green-500">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Leaf className="w-6 h-6 text-green-500" />
                Our Mission
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To empower farmers with intelligent technology, expert guidance, actionable insights, and community support that drive sustainable agricultural practices, increase crop yields, reduce costs, build climate resilience, and create economic opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-white dark:bg-gray-800 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6">
                <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Sustainability</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Promoting eco-friendly, sustainable farming practices</p>
              </div>

              <div className="text-center p-6">
                <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Innovation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leveraging AI, ML, IoT for smart agriculture</p>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Empowerment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Supporting farmer autonomy and digital literacy</p>
              </div>

              <div className="text-center p-6">
                <div className="bg-orange-100 dark:bg-orange-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Excellence</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivering quality solutions with 24/7 support</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">How</h2>
            <BrandWordmark className="h-10 md:h-12" alt="Farmix workflow brand name" />
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">Works</h2>
          </div>
          
          <div className="space-y-8">
            {workflowSteps.map((step, index) => (
              <div key={step.number} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-gradient-to-br from-green-500 to-green-600 p-8 text-white flex flex-col justify-center">
                    <div className="text-5xl font-extrabold mb-2 opacity-80">{String(step.number).padStart(2, '0')}</div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                  </div>
                  <div className="md:w-3/4 p-8">
                    <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">{step.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {step.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Zap className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center md:justify-end pr-8 pb-4">
                    <ChevronDown className="w-6 h-6 text-green-600 dark:text-green-400 animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Core Features */}
        <div className="bg-white dark:bg-gray-800 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-600">
                  <div className="text-green-600 dark:text-green-400 mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Architecture */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">System Architecture</h2>
          
          <div className="space-y-4">
            {systemArchitecture.map((item, index) => (
              <div key={index} className={`bg-gradient-to-r ${item.color} rounded-lg p-6 text-white`}>
                <h3 className="text-xl font-bold mb-4">{item.layer}</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {item.components.map((component, i) => (
                    <div key={i} className="bg-white/20 backdrop-blur rounded-lg p-4 text-center">
                      <p className="font-semibold text-sm">{component}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Architecture Diagram Text */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Architecture Flow</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Data flows from multiple sources (IoT sensors, weather APIs, satellite imagery) → Real-time processing in our cloud infrastructure → ML models analyze patterns and generate insights → Intelligent recommendations delivered to farmers via mobile app and web dashboard → Farmers act on recommendations → System learns and improves accuracy → Performance tracked and analyzed.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white text-left">{faq.question}</h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-green-600 dark:text-green-400 transition-transform flex-shrink-0 ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedFaq === faq.id && (
                    <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-900 dark:to-green-800 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-6">Ready to Transform Your Farming?</h2>
            <p className="text-xl text-green-100 mb-8">Join thousands of farmers who are already using the platform to increase yields, reduce costs, and build sustainable farms.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors">
                Get Started Free
              </a>
              <a href="/contact" className="border-2 border-white text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition-colors">
                Schedule Demo
              </a>
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default AboutUs;
