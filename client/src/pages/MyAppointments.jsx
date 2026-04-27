import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Clock, MessageCircle, Phone, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import api, { getApiErrorMessage } from '../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import AppointmentChatModal from '../components/AppointmentChatModal';
import ReviewForm from '../components/ReviewForm';

const CURRENT_APPOINTMENT_STATUSES = ['accepted', 'active', 'confirmed'];

const getConsultationType = (appointment) =>
  appointment?.appointmentDetails?.consultationType || 'chat';

const getQueryDescription = (appointment) =>
  appointment?.appointmentDetails?.queryDescription || '';

const getCropType = (appointment) =>
  appointment?.appointmentDetails?.cropType || '';

const MyAppointments = () => {
  const { user, token } = useContext(AuthContext);
  const authToken = token || user?.token;
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [reviewingAppointment, setReviewingAppointment] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/appointments/');
        if (data.success) {
          setAppointments(data.data || []);
        }
      } catch (requestError) {
        const message = getApiErrorMessage(requestError, 'Failed to load appointments');
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchAppointments();
    }
  }, [authToken]);

  const formatDateTime = (dateValue, time) => {
    const date = new Date(dateValue);
    return {
      date: date.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time
    };
  };

  const isAppointmentNow = (appointment) => {
    if (!CURRENT_APPOINTMENT_STATUSES.includes(appointment.status)) {
      return false;
    }

    const appointmentDate = new Date(appointment.appointmentDetails?.date);
    const startTime = appointment.appointmentDetails?.startTime;
    const duration = appointment.appointmentDetails?.duration || 60;

    if (!startTime) {
      return false;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentStart = new Date(appointmentDate);
    appointmentStart.setHours(hours, minutes, 0, 0);

    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration);

    const now = new Date();
    return now >= appointmentStart && now <= appointmentEnd;
  };

  const getRemainingTime = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDetails?.date);
    const startTime = appointment.appointmentDetails?.startTime;
    const duration = appointment.appointmentDetails?.duration || 60;

    if (!startTime) {
      return {
        status: 'unknown',
        text: 'Schedule unavailable'
      };
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentStart = new Date(appointmentDate);
    appointmentStart.setHours(hours, minutes, 0, 0);

    const appointmentEnd = new Date(appointmentStart);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration);

    const now = new Date();

    if (now < appointmentStart) {
      const diff = appointmentStart - now;
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        status: 'upcoming',
        text: `${hoursLeft}h ${minsLeft}m remaining`
      };
    }

    if (now <= appointmentEnd) {
      const diff = appointmentEnd - now;
      const minsLeft = Math.floor(diff / (1000 * 60));
      return {
        status: 'active',
        text: `${minsLeft}m left`
      };
    }

    return {
      status: 'expired',
      text: 'Scheduled window ended'
    };
  };

  const handleOpenChat = (appointment) => {
    setSelectedAppointment(appointment);
    setShowChatModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancellingId || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      await api.put(`/appointments/${cancellingId}/cancel`, { reason: cancelReason });
      setAppointments((current) => current.filter((appointment) => appointment._id !== cancellingId));
      toast.success('Appointment cancelled');
      setShowCancelModal(false);
      setCancelReason('');
      setCancellingId(null);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to cancel appointment'));
    }
  };

  const handleReviewSuccess = (review) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment._id === reviewingAppointment?._id
          ? {
              ...appointment,
              review: {
                ...(appointment.review || {}),
                reviewed: true,
                reviewId: review._id,
                rating: review.rating,
                feedback: review.feedback
              }
            }
          : appointment
      )
    );
    setReviewingAppointment(null);
  };

  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending');
  const currentAppointments = appointments.filter((appointment) =>
    CURRENT_APPOINTMENT_STATUSES.includes(appointment.status)
  );
  const completedAppointments = appointments.filter((appointment) => appointment.status === 'completed');

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <LoadingState
            title="Loading appointments"
            description="We are preparing your consultation timeline."
            count={3}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track booking status, join consultations, and review completed sessions.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Pending ({pendingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'current'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Current ({currentAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Completed ({completedAppointments.length})
          </button>
        </div>

        <div className="space-y-4">
          {error ? (
            <ErrorState
              title="Unable to load appointments"
              description={error}
              onAction={() => window.location.reload()}
            />
          ) : null}

          {activeTab === 'pending' && (
            <>
              {!error && pendingAppointments.length === 0 ? (
                <EmptyState
                  title="No pending appointments"
                  description="Once you request a consultation, it will appear here until the expert responds."
                  actionLabel="Book New Appointment"
                  onAction={() => {
                    window.location.href = '/farmer-bookings';
                  }}
                />
              ) : (
                pendingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-500"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {appointment.expertId?.name || 'Expert'}
                        </h3>
                        <p className="text-sm text-orange-600 font-semibold mb-4">
                          Waiting for expert response
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatDateTime(
                                  appointment.appointmentDetails?.date,
                                  appointment.appointmentDetails?.startTime
                                ).date}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {appointment.appointmentDetails?.startTime}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {appointment.appointmentDetails?.duration || 60} minutes
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                {getConsultationType(appointment)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {getCropType(appointment) ? (
                          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            Crop:{' '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {getCropType(appointment)}
                            </span>
                          </p>
                        ) : null}

                        {getQueryDescription(appointment) ? (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Query</p>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {getQueryDescription(appointment)}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col justify-center">
                        <button
                          onClick={() => {
                            setCancellingId(appointment._id);
                            setShowCancelModal(true);
                          }}
                          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Cancel Booking
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4">
                          The expert can accept or reject this request from their dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'current' && (
            <>
              {!error && currentAppointments.length === 0 ? (
                <EmptyState
                  title="No current appointments"
                  description="Accepted or active consultations will appear here."
                  actionLabel="Book New Appointment"
                  onAction={() => {
                    window.location.href = '/farmer-bookings';
                  }}
                />
              ) : (
                currentAppointments.map((appointment) => {
                  const remainingTime = getRemainingTime(appointment);
                  const isNow = isAppointmentNow(appointment);
                  const consultationType = getConsultationType(appointment);

                  return (
                    <div
                      key={appointment._id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {appointment.expertId?.name || 'Expert'}
                          </h3>
                          <p
                            className={`text-sm font-semibold mb-4 ${
                              appointment.status === 'active'
                                ? 'text-green-600'
                                : remainingTime.status === 'upcoming'
                                ? 'text-blue-600'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {appointment.status === 'active'
                              ? 'Consultation active'
                              : remainingTime.status === 'upcoming'
                              ? remainingTime.text
                              : remainingTime.text}
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {formatDateTime(
                                    appointment.appointmentDetails?.date,
                                    appointment.appointmentDetails?.startTime
                                  ).date}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {appointment.appointmentDetails?.startTime}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {appointment.appointmentDetails?.duration || 60} minutes
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MessageCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                                  {consultationType}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleOpenChat(appointment)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-5 h-5" />
                            {appointment.status === 'active' || isNow ? 'Open Live Chat' : 'Open Consultation Chat'}
                          </button>

                          {consultationType !== 'chat' && isNow ? (
                            <button
                              onClick={() => toast.info('Call launch is not wired yet. Use consultation chat for now.')}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Phone className="w-5 h-5" />
                              Start {consultationType === 'video' ? 'Video' : 'Audio'} Call
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              setCancellingId(appointment._id);
                              setShowCancelModal(true);
                            }}
                            className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'completed' && (
            <>
              {!error && completedAppointments.length === 0 ? (
                <EmptyState
                  title="No completed appointments"
                  description="Completed consultations will appear here with the expert conclusion and review action."
                />
              ) : (
                completedAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {appointment.expertId?.name || 'Expert'}
                        </h3>
                        <p className="text-sm text-blue-600 font-semibold mb-4">
                          Consultation completed
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Date & Time</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatDateTime(
                                  appointment.appointmentDetails?.date,
                                  appointment.appointmentDetails?.startTime
                                ).date}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {appointment.appointmentDetails?.startTime}
                              </p>
                            </div>
                          </div>

                          {appointment.conclusion?.diagnosis ? (
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                Expert Conclusion
                              </p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                <span className="font-medium">Diagnosis:</span> {appointment.conclusion.diagnosis}
                              </p>
                              <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                                <span className="font-medium">Recommendation:</span>{' '}
                                {appointment.conclusion.recommendation}
                              </p>
                              {appointment.conclusion.notes ? (
                                <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                                  <span className="font-medium">Notes:</span> {appointment.conclusion.notes}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => handleOpenChat(appointment)}
                          className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5" />
                          View Chat History
                        </button>

                        {appointment.review?.reviewed ? (
                          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-300">
                            Review submitted{appointment.review?.rating ? ` (${appointment.review.rating}/5)` : ''}.
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewingAppointment(appointment)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Star className="w-5 h-5" />
                            Leave Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <AppointmentChatModal
        isOpen={showChatModal}
        appointment={selectedAppointment}
        currentUser={user}
        onClose={() => setShowChatModal(false)}
      />

      {reviewingAppointment ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <ReviewForm
            appointmentId={reviewingAppointment._id}
            expertId={reviewingAppointment.expertId?._id}
            expertName={reviewingAppointment.expertId?.name || 'Expert'}
            onSuccess={handleReviewSuccess}
            onCancel={() => setReviewingAppointment(null)}
          />
        </div>
      ) : null}

      {showCancelModal ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Cancel Appointment
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for cancellation.
            </p>

            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Reason for cancellation"
              maxLength="200"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancellingId(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
};

export default MyAppointments;
