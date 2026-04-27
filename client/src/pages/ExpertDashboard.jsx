import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  UserRound,
  XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import api, { getApiErrorMessage } from '../services/api';
import AppointmentChatModal from '../components/AppointmentChatModal';
import { AuthContext } from '../context/AuthContext';

const ACTIVE_APPOINTMENT_STATUSES = ['accepted', 'active', 'confirmed'];

const emptyConclusion = {
  diagnosis: '',
  recommendation: '',
  notes: ''
};

const emptySlotForm = {
  date: '',
  startTime: '',
  endTime: ''
};

const statusChip = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
};

const getConsultationType = (appointment) =>
  appointment?.appointmentDetails?.consultationType || 'chat';

const getQueryDescription = (appointment) =>
  appointment?.appointmentDetails?.queryDescription || '';

const getCropType = (appointment) =>
  appointment?.appointmentDetails?.cropType || '';

const formatDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Schedule pending';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return 'Time pending';
  return timeValue;
};

const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  if (address.country && address.country !== 'India') parts.push(address.country);
  return parts.join(', ');
};

const ExpertDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const authToken = token || user?.token;
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChatAppointment, setSelectedChatAppointment] = useState(null);
  const [showConclusionModal, setShowConclusionModal] = useState(false);
  const [selectedConclusionAppointment, setSelectedConclusionAppointment] = useState(null);
  const [conclusionForm, setConclusionForm] = useState(emptyConclusion);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState(emptySlotForm);
  const [slotSaving, setSlotSaving] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.get('/experts/me/dashboard'),
          api.get('/appointments/?limit=100'),
          api.get('/experts/me/followers')
        ]);

        const [dashboardResponse, appointmentsResponse, followersResponse] = results;

        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.data.success) {
          setStats(dashboardResponse.value.data.data.stats);
        } else if (dashboardResponse.status === 'rejected') {
          console.error('Dashboard stats failed:', dashboardResponse.reason);
          toast.error('Failed to load dashboard statistics');
        }

        if (appointmentsResponse.status === 'fulfilled' && appointmentsResponse.value.data.success) {
          setAppointments(appointmentsResponse.value.data.data || []);
        } else if (appointmentsResponse.status === 'rejected') {
          console.error('Appointments failed:', appointmentsResponse.reason);
          toast.error('Failed to load appointments');
        }

        if (followersResponse.status === 'fulfilled' && followersResponse.value.data.success) {
          setFollowers(followersResponse.value.data?.data?.followers || []);
          setFollowersCount(followersResponse.value.data?.data?.totalFollowers || 0);
        } else if (followersResponse.status === 'rejected') {
          console.error('Followers failed:', followersResponse.reason);
          toast.error('Failed to load followers data');
        }

        const successCount = results.filter((result) => result.status === 'fulfilled').length;
        if (successCount < results.length) {
          toast.warning('Some expert dashboard sections failed to load. Check console for details.');
        }
      } catch (requestError) {
        toast.error(getApiErrorMessage(requestError, 'Failed to load dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchDashboard();
    }
  }, [authToken]);

  const handleAccept = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      const { data } = await api.put(`/appointments/${appointmentId}/accept`);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, ...(data.data || {}), status: 'accepted' }
            : appointment
        )
      );
      toast.success('Appointment accepted');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to accept appointment'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineSubmit = async () => {
    if (!selectedAppointmentId || !declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    try {
      setProcessingId(selectedAppointmentId);
      await api.put(`/appointments/${selectedAppointmentId}/reject`, { reason: declineReason });
      setAppointments((current) =>
        current.filter((appointment) => appointment._id !== selectedAppointmentId)
      );
      toast.success('Appointment rejected');
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedAppointmentId(null);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to reject appointment'));
    } finally {
      setProcessingId(null);
    }
  };

  const openConclusionModal = (appointment) => {
    setSelectedConclusionAppointment(appointment);
    setConclusionForm({
      diagnosis: appointment.conclusion?.diagnosis || '',
      recommendation: appointment.conclusion?.recommendation || '',
      notes: appointment.conclusion?.notes || ''
    });
    setShowConclusionModal(true);
  };

  const handleSubmitConclusion = async () => {
    if (!selectedConclusionAppointment?._id) {
      return;
    }

    if (!conclusionForm.diagnosis.trim() || !conclusionForm.recommendation.trim()) {
      toast.error('Diagnosis and recommendation are required');
      return;
    }

    try {
      setProcessingId(selectedConclusionAppointment._id);
      const { data } = await api.post('/appointments/conclusion', {
        appointmentId: selectedConclusionAppointment._id,
        diagnosis: conclusionForm.diagnosis.trim(),
        recommendation: conclusionForm.recommendation.trim(),
        notes: conclusionForm.notes.trim()
      });

      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === selectedConclusionAppointment._id
            ? {
                ...appointment,
                conclusion: data.data
              }
            : appointment
        )
      );
      toast.success('Conclusion saved');
      setShowConclusionModal(false);
      setSelectedConclusionAppointment(null);
      setConclusionForm(emptyConclusion);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to save conclusion'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      setProcessingId(appointmentId);
      const { data } = await api.put(`/appointments/${appointmentId}/complete`);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment._id === appointmentId
            ? {
                ...appointment,
                ...(data.data || {}),
                status: 'completed'
              }
            : appointment
        )
      );
      toast.success('Consultation completed');
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to complete consultation'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      toast.error('Date, start time, and end time are required');
      return;
    }

    try {
      setSlotSaving(true);
      await api.post('/experts/slots', slotForm);
      toast.success('Availability slot saved');
      setShowSlotModal(false);
      setSlotForm(emptySlotForm);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, 'Failed to save slot'));
    } finally {
      setSlotSaving(false);
    }
  };

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'pending'),
    [appointments]
  );
  const confirmedAppointments = useMemo(
    () => appointments.filter((appointment) => ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)),
    [appointments]
  );
  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed'),
    [appointments]
  );

  const connectedFarmers = useMemo(() => followers, [followers]);

  const recentAdvice = useMemo(
    () =>
      completedAppointments
        .filter((appointment) => appointment.conclusion?.recommendation)
        .slice(0, 5),
    [completedAppointments]
  );

  const renderPendingCard = (appointment) => (
    <div
      key={appointment._id}
      className="rounded-[30px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                {appointment.farmerId?.name || 'Unknown Farmer'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDateLabel(appointment.appointmentDetails?.date)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusChip.pending}`}>
              Pending
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Date</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {formatDateLabel(appointment.appointmentDetails?.date)}
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Duration</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Clock className="h-4 w-4 text-emerald-600" />
                {appointment.appointmentDetails?.duration || 60} minutes
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Consultation Type</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold capitalize text-gray-900 dark:text-white">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                {getConsultationType(appointment)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Farmer Query</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {getQueryDescription(appointment) || 'No issue details shared yet.'}
            </p>
            {getCropType(appointment) ? (
              <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Crop: <span className="text-gray-800 dark:text-gray-200">{getCropType(appointment)}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
            <h4 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Farmer Contact
            </h4>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {appointment.farmerId?.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  {appointment.farmerId.phone}
                </div>
              ) : null}
              {appointment.farmerId?.email ? (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  {appointment.farmerId.email}
                </div>
              ) : null}
              {appointment.farmerId?.address ? (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
                  {formatAddress(appointment.farmerId.address)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleAccept(appointment._id)}
              disabled={processingId === appointment._id}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {processingId === appointment._id ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {processingId === appointment._id ? 'Accepting...' : 'Accept Booking'}
            </button>
            <button
              onClick={() => {
                setSelectedAppointmentId(appointment._id);
                setShowDeclineModal(true);
              }}
              disabled={processingId === appointment._id}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Decline Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmedCard = (appointment) => {
    const hasConclusion =
      Boolean(appointment.conclusion?.diagnosis) && Boolean(appointment.conclusion?.recommendation);

    return (
      <div
        key={appointment._id}
        className="rounded-[30px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {appointment.farmerId?.name || 'Unknown Farmer'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDateLabel(appointment.appointmentDetails?.date)} at{' '}
                  {formatTimeLabel(appointment.appointmentDetails?.startTime)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  statusChip[appointment.status] || statusChip.accepted
                }`}
              >
                {appointment.status === 'active' ? 'Live' : 'Confirmed'}
              </span>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Farmer Query</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {getQueryDescription(appointment) || 'No issue details shared yet.'}
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">
                Your Solution Summary
              </p>
              <p className="mt-2 text-sm text-indigo-900 dark:text-indigo-200">
                {hasConclusion
                  ? appointment.conclusion.recommendation
                  : 'Add your diagnosis and recommendation before marking this consultation complete.'}
              </p>
            </div>

            {appointment.conclusion?.diagnosis ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Consultation Conclusion
                </p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {appointment.conclusion.diagnosis}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
              <h4 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Farmer Contact
              </h4>
              <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {appointment.farmerId?.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    {appointment.farmerId.phone}
                  </div>
                ) : null}
                {appointment.farmerId?.email ? (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    {appointment.farmerId.email}
                  </div>
                ) : null}
                {appointment.farmerId?.address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
                    {formatAddress(appointment.farmerId.address)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setSelectedChatAppointment(appointment);
                  setShowChatModal(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4" />
                Chat or Reply
              </button>
              <button
                onClick={() => openConclusionModal(appointment)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-900"
              >
                <FileText className="h-4 w-4" />
                {hasConclusion ? 'Update Conclusion' : 'Add Conclusion'}
              </button>
              <button
                onClick={() => handleCompleteAppointment(appointment._id)}
                disabled={processingId === appointment._id || !hasConclusion}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              >
                {processingId === appointment._id ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Complete Consultation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompletedCard = (appointment) => (
    <div
      key={appointment._id}
      className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {appointment.farmerId?.name || 'Unknown Farmer'}
            </h3>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusChip.completed}`}>
              Conclusion Submitted
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {formatDateLabel(appointment.appointmentDetails?.date)} at{' '}
            {formatTimeLabel(appointment.appointmentDetails?.startTime)}
          </p>
        </div>
        <button
          onClick={() => openConclusionModal(appointment)}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-900"
        >
          View or Edit Conclusion
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Farmer Query</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {getQueryDescription(appointment) || 'No issue details shared yet.'}
          </p>
        </div>
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-indigo-500">Your Solution Summary</p>
          <p className="mt-2 text-sm text-indigo-900 dark:text-indigo-200">
            {appointment.conclusion?.recommendation || 'No recommendation recorded.'}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center px-4 py-12">
          <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Expert Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Manage your bookings, active consultations, and completed advice from one workspace.
            </p>
          </div>
          <button
            onClick={() => setShowSlotModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700"
          >
            <PlusCircle className="h-4 w-4" />
            Manage Availability Slots
          </button>
        </div>

        {stats ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Total Consultations</p>
              <p className="mt-4 text-4xl font-black text-gray-900 dark:text-white">{stats.totalConsultations}</p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-500">Completion Rate</p>
              <p className="mt-4 text-4xl font-black text-gray-900 dark:text-white">{stats.completionRate}%</p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">Average Rating</p>
              <p className="mt-4 text-4xl font-black text-gray-900 dark:text-white">
                {Number(stats.averageRating || 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-500">This Month Earnings</p>
              <p className="mt-4 text-4xl font-black text-gray-900 dark:text-white">Rs {stats.earningsThisMonth}</p>
            </div>
          </div>
        ) : null}

        <div className="mb-8 rounded-[30px] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700">
            {[
              { id: 'pending', label: 'Pending', count: pendingAppointments.length },
              { id: 'confirmed', label: 'Confirmed', count: confirmedAppointments.length },
              { id: 'recent', label: 'Recent Activity', count: completedAppointments.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              {activeTab === 'pending' ? (
                pendingAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
                    No pending bookings
                  </div>
                ) : (
                  pendingAppointments.map(renderPendingCard)
                )
              ) : null}

              {activeTab === 'confirmed' ? (
                confirmedAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
                    No confirmed consultations
                  </div>
                ) : (
                  confirmedAppointments.map(renderConfirmedCard)
                )
              ) : null}

              {activeTab === 'recent' ? (
                completedAppointments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400 dark:border-gray-700">
                    No completed consultations
                  </div>
                ) : (
                  completedAppointments.map(renderCompletedCard)
                )
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Connected Farmers</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Farmers following your expert profile.
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  Followers: {followersCount}
                </p>
                <div className="mt-4 space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {connectedFarmers.length === 0 ? (
                    <p className="text-sm text-gray-400">No connected farmers yet.</p>
                  ) : (
                    connectedFarmers.map((farmer) => (
                      <div
                        key={farmer._id}
                        className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-white">{farmer.name}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{farmer.email || 'No email'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Advice Given</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your latest completed recommendations and conclusions.
                </p>
                <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {recentAdvice.length === 0 ? (
                    <p className="text-sm text-gray-400">No recent advice recorded yet.</p>
                  ) : (
                    recentAdvice.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              {appointment.farmerId?.name || 'Farmer'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatDateLabel(appointment.appointmentDetails?.date)}
                            </p>
                          </div>
                          <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            Completed
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {appointment.conclusion?.recommendation}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeclineModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Decline Booking</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add a clear reason so the farmer knows why the booking was not accepted.
            </p>
            <textarea
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              rows="4"
              maxLength="200"
              placeholder="Schedule conflict, missing details, or another reason"
              className="mt-4 w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-2 text-xs text-gray-400">{declineReason.length}/200</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                  setSelectedAppointmentId(null);
                }}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineSubmit}
                disabled={processingId !== null}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {processingId ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showConclusionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Consultation Conclusion</h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">Diagnosis</label>
                <textarea
                  value={conclusionForm.diagnosis}
                  onChange={(event) =>
                    setConclusionForm((current) => ({ ...current, diagnosis: event.target.value }))
                  }
                  rows="3"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">Recommendation</label>
                <textarea
                  value={conclusionForm.recommendation}
                  onChange={(event) =>
                    setConclusionForm((current) => ({
                      ...current,
                      recommendation: event.target.value
                    }))
                  }
                  rows="4"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">Notes</label>
                <textarea
                  value={conclusionForm.notes}
                  onChange={(event) =>
                    setConclusionForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows="3"
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowConclusionModal(false);
                  setSelectedConclusionAppointment(null);
                  setConclusionForm(emptyConclusion);
                }}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConclusion}
                disabled={processingId === selectedConclusionAppointment?._id}
                className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
              >
                {processingId === selectedConclusionAppointment?._id ? 'Saving...' : 'Save Conclusion'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSlotModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Manage Availability Slots</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add a new consulting slot for farmers to book.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={slotForm.date}
                  onChange={(event) => setSlotForm((current) => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">Start</label>
                <input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(event) => setSlotForm((current) => ({ ...current, startTime: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-900 dark:text-white">End</label>
                <input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(event) => setSlotForm((current) => ({ ...current, endTime: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowSlotModal(false);
                  setSlotForm(emptySlotForm);
                }}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={slotSaving}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
              >
                {slotSaving ? 'Saving...' : 'Save Slot'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AppointmentChatModal
        isOpen={showChatModal}
        appointment={selectedChatAppointment}
        currentUser={user}
        onClose={() => {
          setShowChatModal(false);
          setSelectedChatAppointment(null);
        }}
      />
    </PageTransition>
  );
};

export default ExpertDashboard;
