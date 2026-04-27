import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import { Search, Filter, Star, User, MessageCircle, Calendar, Clock, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { getApiErrorMessage } from '../services/api';
import OptimizedImage from '../components/OptimizedImage';

const Experts = () => {
  const { user } = useContext(AuthContext);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expertise, setExpertise] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedExpertId, setSelectedExpertId] = useState(null);
  const [bookingType, setBookingType] = useState('call');
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    queryDescription: '',
    cropType: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/experts?search=${search}&expertise=${expertise}`);
      if (res.data.success) {
        setExperts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch experts');
      setError(getApiErrorMessage(error, 'Failed to load experts right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertise]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExperts();
  };

  const handleOpenBooking = (expertId) => {
    if (!user) {
      toast.error('Please login to book an appointment');
      return;
    }
    if (user.role !== 'farmer') {
      toast.error('Only farmers can book appointments with experts');
      return;
    }
    setSelectedExpertId(expertId);
    setBookingType('call');
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
        expertId: selectedExpertId,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        consultationType: bookingType,
        queryDescription: bookingData.queryDescription,
        cropType: bookingData.cropType
      });

      if (response.data.success) {
        toast.success('Appointment booked successfully! Expert will confirm soon.');
        setShowBookingModal(false);
        setBookingData({ date: '', timeSlot: '', queryDescription: '', cropType: '' });
        setSelectedExpertId(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error?.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const expertiseOptions = ['General Agriculture', 'Soil Science', 'Pest Control', 'Crop Management', 'Irrigation', 'Organic Farming', 'Fisheries'];

  if (user?.role === 'farmer') {
    return <Navigate to="/farmer-bookings" replace />;
  }

  return (
    <PageTransition>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Connect with Our Experts</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get professional advice from verified agronomists and industry experts to scale your farming success.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <form onSubmit={handleSearch} className="flex-grow flex gap-2">
              <input 
                type="text" 
                placeholder="Search experts by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field grow"
              />
              <button type="submit" className="btn-primary flex items-center gap-2 px-6">
                <Search className="w-4 h-4" /> Search
              </button>
            </form>
            <div className="flex items-center gap-2">
               <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Filter className="w-5 h-5 text-gray-400" />
               </div>
               <select 
                 value={expertise}
                 onChange={(e) => setExpertise(e.target.value)}
                 className="input-field min-w-[200px]"
               >
                 <option value="">All Specializations</option>
                 {expertiseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
            </div>
          </div>

          {loading ? (
            <LoadingState
              title="Loading experts"
              description="We are fetching verified agriculture experts for you."
              count={6}
            />
          ) : error ? (
            <ErrorState
              title="Unable to load experts"
              description={error}
              onAction={fetchExperts}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {experts.map((expert) => (
                <div key={expert._id} className="card p-6 flex flex-col items-center text-center group hover:border-nature-300 transition-all">
                  <div className="relative mb-6">
                    <OptimizedImage
                      src={expert.userId?.profilePhoto || `https://ui-avatars.com/api/?name=${expert.userId?.name}&background=random`} 
                      alt={expert.userId?.name}
                      sizes="96px"
                      imgClassName="w-24 h-24 rounded-full object-cover border-4 border-nature-50 shadow-md group-hover:scale-110 transition-transform"
                    />
                    {expert.verification?.verificationLevel === 'top_expert' && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                        <span className="text-sm">🏆</span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-nature-600 text-white p-1.5 rounded-full shadow-lg">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  {expert.verification?.verificationLevel === 'top_expert' && (
                    <div className="mb-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-200 dark:border-yellow-700">
                      Top Rated Expert
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{expert.userId?.name}</h3>
                  <p className="text-sm font-bold text-nature-600 dark:text-nature-400 mb-3 uppercase tracking-widest">{expert.professionalInfo?.expertiseAreas?.[0] || 'Agriculture Expert'}</p>
                  
                  <div className="flex items-center justify-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-orange-400 fill-current" />
                      <span className="font-bold text-gray-700 dark:text-gray-200">{expert.ratings?.averageRating || 0}</span>
                      <span>({expert.ratings?.totalRatings || 0})</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <div className="flex items-center gap-1">
                       <User className="w-4 h-4" />
                       <span>{expert.professionalInfo?.experienceYears}+ yrs</span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 line-clamp-3 italic">
                    {expert.userId?.bio || "Expert in modern agricultural techniques and sustainable farming practices."}
                  </p>

                  <div className="mt-auto w-full grid grid-cols-2 gap-3">
                    <Link to={`/expert/${expert._id}`} className="btn-outline flex items-center justify-center gap-2 py-3 text-sm">
                       View Profile
                    </Link>
                    <button 
                      onClick={() => handleOpenBooking(expert._id)}
                      className="btn-primary flex items-center justify-center gap-2 py-3 text-sm">
                       <MessageCircle className="w-4 h-4" /> Book Now
                    </button>
                  </div>
                </div>
              ))}
              {!experts.length && (
                <div className="col-span-full">
                  <EmptyState
                    title="No experts found"
                    description="Try a different search term or specialization to discover more experts."
                    actionLabel="Clear filters"
                    onAction={() => {
                      setSearch('');
                      setExpertise('');
                      fetchExperts();
                    }}
                  />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in scale-95">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Book Expert Consultation
                </h3>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedExpertId(null);
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
                      setSelectedExpertId(null);
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

export default Experts;
