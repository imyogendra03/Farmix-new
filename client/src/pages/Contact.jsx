import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Leaf, Target, Lightbulb } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-toastify';
import { BrandWordmark } from '../components/BrandAssets';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      const response = await api.post('/contact', formData);
      if (response.data.success) {
        setSubmitStatus('success');
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      setSubmitStatus('error');
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 transition-colors">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 dark:from-green-900 dark:to-green-950 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Get In Touch</h1>
            <p className="text-xl text-green-100">We're here to help and answer any questions you might have about the platform</p>
          </div>
        </div>

        {/* About Farmix Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            
            {/* About Text */}
            <div>
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">About</h2>
                <BrandWordmark className="h-10 md:h-12" alt="Farmix contact page brand name" />
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                Our agricultural technology platform is designed to revolutionize farming practices through data-driven insights, AI-powered recommendations, and real-time monitoring.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                We connect farmers with agricultural experts, provide personalized crop recommendations, disease predictions, yield forecasting, and weather intelligence all in one unified platform.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Our mission is to empower farmers with cutting-edge technology, enabling them to make smarter decisions, increase productivity, and build a sustainable agricultural future.
              </p>
            </div>

            {/* Key Stats */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
                <Leaf className="w-10 h-10 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Supporting Farmers</h3>
                <p className="text-gray-600 dark:text-gray-400">Empowering agricultural communities with smart technology and expert guidance</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
                <Target className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">Advanced machine learning for crop recommendations, disease detection, and yield prediction</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
                <Lightbulb className="w-10 h-10 text-yellow-600 dark:text-yellow-400 mb-3" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Real-Time Solutions</h3>
                <p className="text-gray-600 dark:text-gray-400">Weather monitoring, IoT sensor integration, and live market intelligence</p>
              </div>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-8 rounded-xl border border-blue-200 dark:border-blue-700">
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To transform agriculture through technology and innovation, creating a future where every farmer has access to world-class AI tools, expert knowledge, and real-time market insights to maximize productivity and sustainability.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-8 rounded-xl border border-green-200 dark:border-green-700">
              <Leaf className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Mission</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                To empower farmers with intelligent technology, expert guidance, and actionable insights that drive sustainable agricultural practices, increase crop yields, reduce costs, and build stronger communities through data-driven decision making.
              </p>
            </div>
          </div>

          {/* Purpose & Values */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700 mb-16">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Our Purpose & Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Sustainability</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Promoting eco-friendly farming practices and resource conservation</p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Innovation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leveraging AI, ML, and IoT for smart agriculture</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Empowerment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Supporting farmer autonomy and education</p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 dark:bg-orange-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Excellence</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivering quality solutions and reliable support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-800 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h4>
                      <a href="mailto:info.farmix@gmail.com" className="text-green-600 dark:text-green-400 hover:underline break-all">
                        info.farmix@gmail.com
                      </a>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We'll respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Location</h4>
                      <p className="text-gray-700 dark:text-gray-300">Agriculture Technology Hub<br/>Digital Innovation Center<br/>India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Support Hours</h4>
                      <p className="text-gray-700 dark:text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM<br/>Saturday: 10:00 AM - 2:00 PM<br/>Sunday: Closed</p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Why Contact</h4>
                    <BrandWordmark className="h-6" alt="Farmix contact section brand name" />
                    <span className="font-semibold text-gray-900 dark:text-white">?</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>✓ Expert support for agricultural queries</li>
                    <li>✓ Technical assistance and troubleshooting</li>
                    <li>✓ Partnership and collaboration opportunities</li>
                    <li>✓ Feedback and feature suggestions</li>
                    <li>✓ Training and onboarding support</li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="training">Training Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      placeholder="Tell us more about your inquiry..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                    ></textarea>
                  </div>

                  {submitStatus === 'success' && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Message sent successfully!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Thank you for reaching out. We'll get back to you soon.</p>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">Failed to send message</p>
                        <p className="text-sm text-red-700 dark:text-red-300">Please try again or contact us directly via email.</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default Contact;
