import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, Wind, Users, ShieldCheck, Banknote, 
  Mail, Phone, MapPin, Send, MessageCircle 
} from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import FeatureCard from '../components/FeatureCard';
import PageTransition from '../components/PageTransition';
import api from '../services/api';
import { toast } from 'react-toastify';
import OptimizedImage from '../components/OptimizedImage';

const Home = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/messages', formData);
      if (res.data.success) {
        toast.success('Message sent successfully! Our team will contact you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Sprout,
      title: 'Smart Crop Monitoring',
      description: 'Real-time monitoring and data-driven recommendations for optimal crop selection and growth strategies.',
      linkTo: '/crop-recommendation',
    },
    {
      icon: Wind,
      title: 'Weather Forecast',
      description: 'Accurate weather predictions to help you plan your farming activities and protect your crops.',
      linkTo: '/weather-monitor',
    },
    {
      icon: Users,
      title: 'Expert Network',
      description: 'Connect with agricultural experts for personalized advice and guidance on crop management.',
      linkTo: '/experts',
      highlight: true,
    },
    {
      icon: ShieldCheck,
      title: 'Disease Detection',
      description: 'AI-powered disease identification to detect and prevent crop diseases early.',
      linkTo: '/disease-prediction',
    },
    {
      icon: Banknote,
      title: 'Market Analysis',
      description: 'Real-time market prices and trends to help you make better selling decisions.',
      linkTo: '/market-prediction',
    },
    {
      icon: MessageCircle,
      title: 'Community Support',
      description: 'Share experiences and learn from thousands of farmers in our community.',
      linkTo: '/community',
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
           <OptimizedImage
             src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
             alt="Agriculture farm landscape"
             loading="eager"
             fetchPriority="high"
             sizes="100vw"
             imgClassName="w-full h-full object-cover opacity-30 transform scale-105 transition-transform duration-[20s] ease-out hover:scale-100"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-nature-900/50 to-transparent mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8 animate-fade-in-down">
            <span className="inline-block py-1.5 px-4 rounded-full bg-nature-500/20 backdrop-blur-sm border border-nature-400/30 text-nature-300 text-sm font-bold tracking-widest mb-8 shadow-[0_0_15px_rgba(100,162,128,0.2)]">
              REVOLUTIONIZING AGRICULTURE
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-fade-in-up animation-delay-100 drop-shadow-lg">
            {t('heroTitle')}
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-300 mb-12 max-w-3xl leading-relaxed animate-fade-in-up animation-delay-200">
            {t('heroSub')}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-300">
            <Link to="/register" className="inline-block bg-nature-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-nature-700 transition-all duration-300 shadow-[0_0_30px_rgba(67,134,99,0.4)] hover:shadow-[0_0_40px_rgba(67,134,99,0.6)] hover:-translate-y-1">
              {t('getStarted')}
            </Link>
            <Link to="/crop-recommendation" className="inline-block bg-white/10 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-white/20 border border-white/20 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
              {t('exploreTools')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
              {t('featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools and features designed to empower every aspect of your farming journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden bg-white dark:bg-gray-900">
        <div className="absolute inset-0 z-0">
           <svg className="w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0,100 C20,0 50,0 100,100 Z" fill="currentColor"/>
           </svg>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">Ready to transform your harvest?</h2>
          <p className="text-xl text-nature-100/90 mb-12 leading-relaxed">
            Join thousands of successful farmers utilizing machine learning to predict yields, diseases, and optimal crops. Start your smart farming journey today.
          </p>
          <Link to="/register" className="inline-block bg-white text-nature-800 px-10 py-5 rounded-xl font-bold text-xl hover:bg-gray-50 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
                {t('contactUs')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-nature-600 mr-4" />
                  <span className="text-gray-700 dark:text-gray-300">support@farmix.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-6 h-6 text-nature-600 mr-4" />
                  <span className="text-gray-700 dark:text-gray-300">+91 XXXX XXX XXX</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-nature-600 mr-4" />
                  <span className="text-gray-700 dark:text-gray-300">India</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('name')}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-nature-500"
                        required
                      />
                </div>
                <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('email')}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-nature-500"
                        required
                      />
                </div>
              </div>
              <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('subject')}</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Subject"
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-nature-500"
                      required
                    />
              </div>
              <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('message')}</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message"
                      rows="4"
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-nature-500 resize-none"
                      required
                    ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : <><Send className="w-5 h-5" /> {t('send')}</>}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
};

export default Home;
