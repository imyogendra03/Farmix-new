import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Check,
  HeartPulse,
  MessageCircle,
  Search,
  UserRound,
  Users
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import api, { getApiErrorMessage } from '../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';

const consultationOptions = [
  { value: 'chat', label: 'Chat' },
  { value: 'call', label: 'Audio Call' },
  { value: 'video', label: 'Video Call' }
];

const timeSlotOptions = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00'
];

const statusClasses = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const FarmerBookings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [followingId, setFollowingId] = useState('');
  const [experts, setExperts] = useState([]);
  const [followedExperts, setFollowedExperts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('');
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    consultationType: 'chat',
    queryDescription: '',
    cropType: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [
          expertsResponse,
          appointmentsResponse,
          followedExpertsResponse,
          chatHistoryResponse
        ] = await Promise.all([
          api.get('/experts/available'),
          api.get('/appointments/?limit=20'),
          api.get('/experts/following'),
          api.get('/history/chat?mode=conversations&limit=6')
        ]);

        const availableExperts = expertsResponse.data.success ? (expertsResponse.data.data || []) : [];
        const followed = followedExpertsResponse.data.success ? (followedExpertsResponse.data.data || []) : [];

        setExperts(availableExperts);
        setFollowedExperts(followed);
        setAppointments(appointmentsResponse.data.success ? (appointmentsResponse.data.data || []) : []);
        setChatHistory(chatHistoryResponse.data.success ? (chatHistoryResponse.data.data || []) : []);

        if (followed.length > 0) {
          setSelectedExpert((current) => current || String(followed[0].userId || followed[0].id));
        } else {
          setSelectedExpert('');
        }
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, 'Failed to load expert booking options');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const followedExpertIds = useMemo(
    () => new Set(followedExperts.map((expert) => String(expert.userId || expert.id))),
    [followedExperts]
  );

  const filteredExperts = experts.filter((expert) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      expert.name?.toLowerCase().includes(query) ||
      expert.expertise?.some((item) => item.toLowerCase().includes(query))
    );
  });

  const selectedExpertCard = experts.find(
    (expert) => String(expert.userId || expert.id) === String(selectedExpert)
  );

  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending');
  const recentAppointments = appointments.slice(0, 6);
  const currentAppointments = appointments.filter((appointment) =>
    ['accepted', 'active', 'completed'].includes(appointment.status)
  );

  const formatDateTime = (dateValue, timeSlot) => {
    const date = new Date(dateValue);
    const dateLabel = Number.isNaN(date.getTime())
      ? 'Schedule pending'
      : date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

    return `${dateLabel}${timeSlot ? ` at ${timeSlot}` : ''}`;
  };

  const syncFollowedExperts = (expert, followed) => {
    const mappedExpert = {
      ...expert,
      isFollowed: followed
    };

    setExperts((current) =>
      current.map((item) =>
        String(item.userId || item.id) === String(expert.userId || expert.id)
          ? { ...item, isFollowed: followed }
          : item
      )
    );

    setFollowedExperts((current) => {
      if (followed) {
        const exists = current.some(
          (item) => String(item.userId || item.id) === String(mappedExpert.userId || mappedExpert.id)
        );
        if (exists) {
          return current;
        }
        return [...current, mappedExpert];
      }

      return current.filter(
        (item) => String(item.userId || item.id) !== String(mappedExpert.userId || mappedExpert.id)
      );
    });

    if (!followed && String(selectedExpert) === String(expert.userId || expert.id)) {
      setSelectedExpert('');
    }

    if (followed && !selectedExpert) {
      setSelectedExpert(String(expert.userId || expert.id));
    }
  };

  const handleFollowToggle = async (expert) => {
    const expertUserId = String(expert.userId || expert.id);
    const isFollowed = followedExpertIds.has(expertUserId);

    try {
      setFollowingId(expertUserId);

      if (isFollowed) {
        await api.delete(`/experts/${expert.id}/follow`);
        syncFollowedExperts(expert, false);
        toast.success('Expert removed from following');
      } else {
        await api.post(`/experts/${expert.id}/follow`);
        syncFollowedExperts(expert, true);
        toast.success('Expert followed successfully');
      }
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to update following status'));
    } finally {
      setFollowingId('');
    }
  };

  const handleSubmitBooking = async (event) => {
    event.preventDefault();

    if (!selectedExpert || !bookingData.date || !bookingData.timeSlot) {
      toast.error('Select followed expert, date, and time slot');
      return;
    }

    if (!followedExpertIds.has(String(selectedExpert))) {
      toast.error('Follow an expert before booking');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post('/appointments/book', {
        expertId: selectedExpert,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        consultationType: bookingData.consultationType,
        queryDescription: bookingData.queryDescription,
        cropType: bookingData.cropType
      });

      setAppointments((current) => [
        {
          _id: data.data.appointmentId,
          expertId: {
            _id: selectedExpert,
            name: selectedExpertCard?.name || 'Expert'
          },
          appointmentDetails: {
            date: bookingData.date,
            startTime: data.data.slot,
            consultationType: bookingData.consultationType,
            queryDescription: bookingData.queryDescription,
            cropType: bookingData.cropType
          },
          status: data.data.status
        },
        ...current
      ]);

      setBookingData({
        date: '',
        timeSlot: '',
        consultationType: 'chat',
        queryDescription: '',
        cropType: ''
      });

      toast.success('Appointment booked successfully');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to book appointment'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <LoadingState
            title="Loading Expert Connect Hub"
            description="Preparing experts, follows, pending requests, and consultation history."
            count={4}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Expert Connect Hub
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Follow experts first, then book slots and track your consultation pipeline.
            </p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="rounded-[28px] bg-gradient-to-r from-orange-500 to-amber-500 p-7 text-white shadow-lg mb-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-3xl font-black tracking-tight">Community Section</p>
              <p className="mt-2 text-sm text-orange-50">
                Share posts, ask doubts, and learn from the wider Farmix community.
              </p>
            </div>
            <Link
              to="/community"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50 transition-colors"
            >
              Join Community
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Pending Slot Requests</p>
            <p className="mt-4 text-5xl font-black text-gray-900 dark:text-white">{pendingAppointments.length}</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Tap to open full booking status page.</p>
          </div>
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Recent Activity</p>
            <p className="mt-4 text-5xl font-black text-gray-900 dark:text-white">{currentAppointments.length}</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Open complete activity timeline and consultation logs.</p>
          </div>
          <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Following Experts</p>
            <p className="mt-4 text-5xl font-black text-gray-900 dark:text-white">{followedExperts.length}</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Only followed experts appear in booking dropdowns.</p>
          </div>
        </div>

        {error ? (
          <ErrorState
            title="Unable to load expert booking hub"
            description={error}
            onAction={() => window.location.reload()}
          />
        ) : (
          <>
            <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Expert Advice</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Build a followed list first, then book directly and track pending requests.
                  </p>
                </div>
                <p className="text-xs font-semibold text-gray-400">
                  Connected Experts: {followedExperts.length}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
                <form onSubmit={handleSubmitBooking} className="rounded-[28px] border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Appointment Booking</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.16em] text-gray-400 mb-2">
                        Select Followed Expert
                      </label>
                      <select
                        value={selectedExpert}
                        onChange={(event) => setSelectedExpert(event.target.value)}
                        disabled={followedExperts.length === 0}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white disabled:opacity-60"
                      >
                        <option value="">
                          {followedExperts.length === 0 ? 'Follow an expert first' : 'Select followed expert'}
                        </option>
                        {followedExperts.map((expert) => (
                          <option key={expert.id} value={expert.userId || expert.id}>
                            {expert.name} | {expert.expertise?.[0] || 'Agriculture'}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-400">
                        Booking stays locked until the expert is in your following list.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-gray-400 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={bookingData.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(event) =>
                            setBookingData((current) => ({ ...current, date: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-[0.16em] text-gray-400 mb-2">
                          Mode
                        </label>
                        <select
                          value={bookingData.consultationType}
                          onChange={(event) =>
                            setBookingData((current) => ({ ...current, consultationType: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white"
                        >
                          {consultationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.16em] text-gray-400 mb-2">
                        Select Available Time Slot
                      </label>
                      <select
                        value={bookingData.timeSlot}
                        onChange={(event) =>
                          setBookingData((current) => ({ ...current, timeSlot: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">Select available time slot</option>
                        {timeSlotOptions.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-400">Slot duration: 30 min</p>
                    </div>

                    <input
                      type="text"
                      placeholder="Crop type (optional)"
                      value={bookingData.cropType}
                      onChange={(event) =>
                        setBookingData((current) => ({ ...current, cropType: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white"
                    />

                    <textarea
                      rows="4"
                      placeholder="Describe your problem"
                      value={bookingData.queryDescription}
                      onChange={(event) =>
                        setBookingData((current) => ({ ...current, queryDescription: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white"
                    />

                    <button
                      type="submit"
                      disabled={submitting || followedExperts.length === 0}
                      className="w-full rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Booking appointment...' : 'Book Appointment'}
                    </button>
                  </div>
                </form>

                <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      Requested and Pending Appointments
                    </h3>
                    <Link
                      to="/my-appointments"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Open full page
                    </Link>
                  </div>

                  <div className="space-y-4 max-h-[470px] overflow-y-auto pr-1">
                    {appointments.length === 0 ? (
                      <EmptyState
                        title="No requests yet"
                        description="Your new expert bookings will appear here."
                      />
                    ) : (
                      appointments.slice(0, 6).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">
                                {appointment.expertId?.name || 'Expert'}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(
                                  appointment.appointmentDetails?.date,
                                  appointment.appointmentDetails?.startTime
                                )}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                statusClasses[appointment.status] || statusClasses.pending
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" />
                              {appointment.status === 'pending' ? 'Status: started' : `Status: ${appointment.status}`}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <HeartPulse className="w-3.5 h-3.5" />
                              {appointment.appointmentDetails?.consultationType || 'chat'}
                            </span>
                          </div>

                          {appointment.appointmentDetails?.queryDescription ? (
                            <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                              Issue: {appointment.appointmentDetails.queryDescription}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr] mb-8">
              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm min-h-[540px]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <UserRound className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">All Available Experts</h2>
                  </div>
                  <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by name or expertise"
                      className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {filteredExperts.length === 0 ? (
                  <EmptyState
                    title="No experts match your search"
                    description="Try another keyword or clear the search field."
                    actionLabel="Clear search"
                    onAction={() => setSearchTerm('')}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {filteredExperts.map((expert) => {
                      const expertUserId = String(expert.userId || expert.id);
                      const isFollowed = followedExpertIds.has(expertUserId);

                      return (
                        <div
                          key={expert.id}
                          className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-gray-900 dark:text-white">{expert.name}</p>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {expert.expertise?.[0] || 'General Agriculture'}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                                isFollowed
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {isFollowed ? 'Followed' : 'Not Followed'}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                            <p>Experience: {expert.experienceYears || 0} years</p>
                            <p>Rating: {expert.rating || 0}</p>
                            <p>Consultation fee: {expert.consultationFee || 0}</p>
                          </div>

                          <div className="mt-5 grid grid-cols-3 gap-3">
                            <button
                              onClick={() => handleFollowToggle(expert)}
                              disabled={followingId === expertUserId}
                              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                                isFollowed
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300'
                                  : 'bg-orange-500 text-white hover:bg-orange-600'
                              } disabled:opacity-60`}
                            >
                              {followingId === expertUserId ? 'Saving...' : isFollowed ? 'Following' : 'Follow'}
                            </button>
                            <button
                              onClick={() => {
                                if (!isFollowed) {
                                  toast.info('Follow this expert first');
                                  return;
                                }
                                setSelectedExpert(expertUserId);
                                window.scrollTo({ top: 420, behavior: 'smooth' });
                              }}
                              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                            >
                              Book
                            </button>
                            <button
                              onClick={() => navigate(`/expert/${expert.id}`)}
                              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm min-h-[540px]">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Following Experts</h2>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{followedExperts.length} connected</span>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {followedExperts.length === 0 ? (
                    <EmptyState
                      title="No followed experts yet"
                      description="Use the Follow button on any expert card to unlock booking."
                    />
                  ) : (
                    followedExperts.map((expert) => (
                      <div
                        key={expert.id}
                        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{expert.name}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {expert.expertise?.[0] || 'General Agriculture'}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Check className="w-3.5 h-3.5" />
                            Connected
                          </span>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedExpert(String(expert.userId || expert.id));
                              window.scrollTo({ top: 420, behavior: 'smooth' });
                            }}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Book Appointment
                          </button>
                          <button
                            onClick={() => navigate(`/expert/${expert.id}`)}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
                  <Link to="/history" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    Open Full Page
                  </Link>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {recentAppointments.length === 0 ? (
                    <EmptyState
                      title="No recent activity"
                      description="New bookings and consultation updates will appear here."
                    />
                  ) : (
                    recentAppointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              {appointment.expertId?.name || 'Expert'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(
                                appointment.appointmentDetails?.date,
                                appointment.appointmentDetails?.startTime
                              )}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                              statusClasses[appointment.status] || statusClasses.pending
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Chat History</h2>
                  <Link to="/history" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                    View Full Log
                  </Link>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {chatHistory.length === 0 ? (
                    <EmptyState
                      title="No chat history"
                      description="Expert conversations will appear after consultations begin."
                    />
                  ) : (
                    chatHistory.map((conversation) => (
                      <div
                        key={conversation.appointmentId || conversation._id}
                        className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              {conversation.appointment?.expertId?.name || 'Expert consultation'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {conversation.lastMessageAt
                                ? new Date(conversation.lastMessageAt).toLocaleString()
                                : 'No timestamp'}
                            </p>
                          </div>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {conversation.messageCount || 0} msgs
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {conversation.lastMessage?.message || 'Conversation created'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default FarmerBookings;
