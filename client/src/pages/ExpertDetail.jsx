import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageCircle, Phone, Video, Award, Users, Clock, DollarSign, ArrowLeft, AlertCircle, Calendar, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import ReviewForm from '../components/ReviewForm';
import SkeletonLoader from '../components/SkeletonLoader';
import { toast } from 'react-toastify';
import OptimizedImage from '../components/OptimizedImage';

const ExpertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [expert, setExpert] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    queryDescription: '',
    cropType: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch expert details
        const expertRes = await api.get(`/experts/${id}`);
        if (expertRes.data.success) {
          setExpert(expertRes.data.data);
        }

        // Fetch reviews for this expert
        const reviewsRes = await api.get(`/reviews/approved?expertId=${id}&limit=10`);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data);
        }

        // Check if user has completed appointments with this expert
        try {
          const apptRes = await api.get(`/appointments/my?expertId=${id}&status=completed`);
          if (apptRes.data.success) {
            setAppointments(apptRes.data.data);
          }
        } catch (err) {
          console.log('Could not fetch appointments');
        }

        // Get user role
        try {
          const userRes = await api.get('/auth/me');
          if (userRes.data.success) {
            setUserRole(userRes.data.data.role);
          }
        } catch (err) {
          console.log('Not authenticated');
        }
      } catch (error) {
        console.error('Failed to fetch expert details:', error);
        toast.error('Failed to load expert details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
          <div className="max-w-4xl mx-auto px-4">
            <SkeletonLoader type="card" count={3} />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!expert) {
    return (
      <PageTransition>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Expert Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">We couldn't find the expert you're looking for.</p>
              <button
                onClick={() => navigate('/experts')}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                <ArrowLeft size={18} /> Back to Experts
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleOpenBooking = (type) => {
    if (!user) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }
    if (user.role !== 'farmer') {
      toast.error('Only farmers can book appointments with experts');
      return;
    }
    setBookingType(type);
    setShowBookingModal(true);
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingData.date || !bookingData.timeSlot) {
      toast.error('Please select date and time slot');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post('/appointments/book', {
        expertId: id,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        consultationType: bookingType || 'call',
        queryDescription: bookingData.queryDescription,
        cropType: bookingData.cropType
      });

      if (response.data.success) {
        toast.success('Appointment booked successfully! Expert will confirm soon.');
        setShowBookingModal(false);
        setBookingData({ date: '', timeSlot: '', queryDescription: '', cropType: '' });
        setBookingType(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const canReview = userRole === 'farmer' && appointments.length > 0;
  const hasReviewed = appointments.some(appt => appt.review?.reviewed);

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <button
            onClick={() => navigate('/experts')}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-8"
          >
            <ArrowLeft size={18} /> Back to Experts
          </button>

          {/* Expert Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="h-48 bg-gradient-to-r from-green-600 to-green-700"></div>
            
            <div className="px-8 py-8 -mt-24 relative">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative">
                  <OptimizedImage
                    src={expert.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${expert.userId?.name}&size=200&background=random`}
                    alt={expert.userId?.name}
                    loading="eager"
                    sizes="160px"
                    imgClassName="w-40 h-40 rounded-full object-cover border-8 border-white dark:border-gray-800 shadow-lg"
                  />
                  {expert.verification?.verificationLevel === 'top_expert' && (
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-gray-800">
                      <span className="text-xl">🏆</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow mt-12">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                      {expert.userId?.name}
                    </h1>
                    {expert.verification?.verificationLevel === 'top_expert' && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold uppercase">
                        Top Expert
                      </span>
                    )}
                  </div>

                  <p className="text-xl text-green-600 dark:text-green-400 font-bold mb-4">
                    {expert.professionalInfo?.expertiseAreas?.[0] || 'Agriculture Expert'}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-orange-400 fill-current" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {expert.ratings?.averageRating?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Reviews</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {expert.ratings?.totalRatings || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Experience</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {expert.professionalInfo?.experienceYears}+ years
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Consultation</p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          ₹{expert.consultation?.fee || 'Contact'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    {expert.userId?.bio || 'Expert in modern agricultural techniques and sustainable farming practices.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleOpenBooking('chat')}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all active:scale-95">
                      <MessageCircle size={18} /> Chat Now
                    </button>
                    <button 
                      onClick={() => handleOpenBooking('call')}
                      className="flex items-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold py-3 px-6 rounded-lg transition-all active:scale-95">
                      <Phone size={18} /> Book Call
                    </button>
                    <button 
                      onClick={() => handleOpenBooking('video')}
                      className="flex items-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold py-3 px-6 rounded-lg transition-all active:scale-95">
                      <Video size={18} /> Book Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expertise Areas */}
          {expert.professionalInfo?.expertiseAreas?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-3">
                {expert.professionalInfo.expertiseAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {expert.professionalInfo?.qualifications?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Qualifications</h2>
              <ul className="space-y-3">
                {expert.professionalInfo.qualifications.map((qual, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Review Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reviews ({reviews.length})
              </h2>
              {canReview && !hasReviewed && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                >
                  {showReviewForm ? 'Cancel' : 'Write Review'}
                </button>
              )}
            </div>

            {showReviewForm && canReview && (
              <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                <ReviewForm
                  expertId={expert._id}
                  expertName={expert.userId?.name}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    // Optionally refetch reviews
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            {canReview && hasReviewed && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300 font-semibold">
                  ✓ You've already reviewed this expert
                </p>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-grow">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {review.farmerId?.name || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${
                              i < review.rating
                                ? 'text-orange-400 fill-orange-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{review.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                No reviews yet. Be the first to review this expert!
              </p>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in scale-95">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {bookingType === 'call' && 'Book a Call'}
                  {bookingType === 'video' && 'Book a Video Call'}
                  {bookingType === 'chat' && 'Start Chat'}
                </h3>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingType(null);
                    setBookingData({ date: '', timeSlot: '', queryDescription: '', cropType: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Preferred Date
                    </div>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleBookingChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Slot
                    </div>
                  </label>
                  <select
                    name="timeSlot"
                    value={bookingData.timeSlot}
                    onChange={handleBookingChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a time slot</option>
                    <option value="09:00-10:00">9:00 AM - 10:00 AM</option>
                    <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                    <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                    <option value="12:00-13:00">12:00 PM - 1:00 PM</option>
                    <option value="14:00-15:00">2:00 PM - 3:00 PM</option>
                    <option value="15:00-16:00">3:00 PM - 4:00 PM</option>
                    <option value="16:00-17:00">4:00 PM - 5:00 PM</option>
                    <option value="17:00-18:00">5:00 PM - 6:00 PM</option>
                  </select>
                </div>

                {/* Crop Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crop Type (Optional)
                  </label>
                  <input
                    type="text"
                    name="cropType"
                    value={bookingData.cropType}
                    onChange={handleBookingChange}
                    placeholder="e.g., Wheat, Rice, Corn"
                    maxLength="80"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Query Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Query (Optional)
                  </label>
                  <textarea
                    name="queryDescription"
                    value={bookingData.queryDescription}
                    onChange={handleBookingChange}
                    placeholder="Describe your issue or question..."
                    maxLength="1000"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{bookingData.queryDescription.length}/1000</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setBookingType(null);
                      setBookingData({ date: '', timeSlot: '', queryDescription: '', cropType: '' });
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default ExpertDetail;
