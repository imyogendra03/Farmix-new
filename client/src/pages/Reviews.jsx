import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { Star, Quote, CheckCircle, Award } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import OptimizedImage from '../components/OptimizedImage';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/reviews/approved');
        if (res.data.success) {
          setReviews(res.data.data || []);
        } else {
          throw new Error('Failed to fetch reviews');
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviews([
          {
            _id: 1,
            farmerId: { name: 'Rajesh Kumar', profilePhoto: '' },
            expertId: { name: 'Dr. Amit Singh' },
            rating: 5,
            feedback: 'The crop recommendation tool saved my harvest! The suggestion for wheat variety was spot on for my soil type.',
            createdAt: new Date().toISOString()
          },
          {
            _id: 2,
            farmerId: { name: 'Sunita Devi', profilePhoto: '' },
            expertId: { name: 'Ms. Priya Patel' },
            rating: 5,
            feedback: 'Expert consultation was very helpful. She explained the organic pest control methods very clearly.',
            createdAt: new Date().toISOString()
          },
          {
            _id: 3,
            farmerId: { name: 'Mohit Sharma', profilePhoto: '' },
            expertId: { name: 'Dr. Amit Singh' },
            rating: 4,
            feedback: 'Great platform. The market price predictions are quite accurate and help us plan our sales better.',
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <PageTransition>
      <div className="bg-white dark:bg-gray-900 min-h-screen py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">What Farmers Say</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Trusted by thousands of farmers across India. Read about their experiences with our AI tools and expert consultants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
             <div className="p-8 bg-nature-50 dark:bg-nature-900/20 rounded-3xl border border-nature-100 dark:border-nature-800 text-center">
                <p className="text-4xl font-black text-nature-700 dark:text-nature-400 mb-2">50,000+</p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Happy Farmers</p>
             </div>
             <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 text-center">
                <p className="text-4xl font-black text-blue-700 dark:text-blue-400 mb-2">4.9/5</p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Average Rating</p>
             </div>
             <div className="p-8 bg-orange-50 dark:bg-orange-900/20 rounded-3xl border border-orange-100 dark:border-orange-800 text-center">
                <p className="text-4xl font-black text-orange-700 dark:text-orange-400 mb-2">200+</p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verified Experts</p>
             </div>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={6} />
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {reviews.map((review) => (
                <div key={review._id} className="break-inside-avoid bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-gray-700 hover:-translate-y-2 transition-transform relative group">
                  <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Quote className="w-12 h-12 text-nature-600" />
                  </div>
                  
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-orange-400 fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed font-medium">
                    "{review.feedback}"
                  </p>

                  <div className="flex items-center gap-4 pt-6 border-t border-gray-50 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden">
                      {review.farmerId?.profilePhoto ? (
                        <OptimizedImage
                          src={review.farmerId.profilePhoto}
                          alt={review.farmerId.name}
                          sizes="48px"
                          imgClassName="w-full h-full object-cover"
                        />
                      ) : (
                        review.farmerId?.name?.[0] || 'F'
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {review.farmerId?.name}
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                      </h4>
                      <p className="text-xs text-gray-500 font-medium tracking-tight">Consulted {review.expertId?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 p-12 bg-gradient-to-br from-green-700 to-green-900 rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl">
             <div className="absolute -top-12 -left-12 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
             
             <div className="relative z-10">
                <Award className="w-16 h-16 text-green-300 mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-black mb-6">Join Our Success Story</h2>
                <p className="text-lg text-green-100/80 mb-10 max-w-xl mx-auto">
                  Experience the future of farming today. Our smart platform is designed to help you increase productivity and ensure sustainable growth.
                </p>
                <Link to="/community" className="inline-block bg-white text-green-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-green-50 transition-all active:scale-95 shadow-xl">
                   Join Community
                </Link>
             </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default Reviews;
