import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, MessageCircle, Star, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import api, { getApiErrorMessage } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AppointmentChatModal from '../components/AppointmentChatModal';

const appointmentStatusClasses = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

const History = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'appointments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [chatConversations, setChatConversations] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [appointmentPagination, setAppointmentPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [chatPagination, setChatPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [reviewPagination, setReviewPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const [appointmentFilters, setAppointmentFilters] = useState(() => ({
    status: searchParams.get('status') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: Number(searchParams.get('apPage') || 1),
    limit: Number(searchParams.get('apLimit') || 20)
  }));

  const [chatFilters, setChatFilters] = useState(() => ({
    appointmentId: searchParams.get('chatAppointmentId') || '',
    from: searchParams.get('chatFrom') || '',
    to: searchParams.get('chatTo') || '',
    page: Number(searchParams.get('chatPage') || 1),
    limit: Number(searchParams.get('chatLimit') || 20)
  }));

  const [reviewFilters, setReviewFilters] = useState(() => ({
    moderationStatus: searchParams.get('reviewStatus') || '',
    ratingMin: searchParams.get('ratingMin') || '',
    ratingMax: searchParams.get('ratingMax') || '',
    from: searchParams.get('reviewFrom') || '',
    to: searchParams.get('reviewTo') || '',
    page: Number(searchParams.get('revPage') || 1),
    limit: Number(searchParams.get('revLimit') || 20)
  }));

  const syncUrl = useCallback(() => {
    const next = new URLSearchParams();
    next.set('tab', activeTab);

    const setOrDelete = (key, value) => {
      if (value === undefined || value === null || String(value).trim() === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    };

    setOrDelete('status', appointmentFilters.status);
    setOrDelete('dateFrom', appointmentFilters.dateFrom);
    setOrDelete('dateTo', appointmentFilters.dateTo);
    setOrDelete('apPage', appointmentFilters.page);
    setOrDelete('apLimit', appointmentFilters.limit);

    setOrDelete('chatAppointmentId', chatFilters.appointmentId);
    setOrDelete('chatFrom', chatFilters.from);
    setOrDelete('chatTo', chatFilters.to);
    setOrDelete('chatPage', chatFilters.page);
    setOrDelete('chatLimit', chatFilters.limit);

    setOrDelete('reviewStatus', reviewFilters.moderationStatus);
    setOrDelete('ratingMin', reviewFilters.ratingMin);
    setOrDelete('ratingMax', reviewFilters.ratingMax);
    setOrDelete('reviewFrom', reviewFilters.from);
    setOrDelete('reviewTo', reviewFilters.to);
    setOrDelete('revPage', reviewFilters.page);
    setOrDelete('revLimit', reviewFilters.limit);

    setSearchParams(next, { replace: true });
  }, [activeTab, appointmentFilters, chatFilters, reviewFilters, setSearchParams]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [appointmentsResponse, chatResponse, reviewsResponse] = await Promise.all([
        api.get('/history/appointments', {
          params: {
            page: appointmentFilters.page,
            limit: appointmentFilters.limit,
            status: appointmentFilters.status || undefined,
            dateFrom: appointmentFilters.dateFrom || undefined,
            dateTo: appointmentFilters.dateTo || undefined
          }
        }),
        api.get('/history/chat', {
          params: {
            mode: 'conversations',
            page: chatFilters.page,
            limit: chatFilters.limit,
            appointmentId: chatFilters.appointmentId || undefined,
            from: chatFilters.from || undefined,
            to: chatFilters.to || undefined
          }
        }),
        api.get('/history/reviews', {
          params: {
            page: reviewFilters.page,
            limit: reviewFilters.limit,
            moderationStatus: reviewFilters.moderationStatus || undefined,
            ratingMin: reviewFilters.ratingMin || undefined,
            ratingMax: reviewFilters.ratingMax || undefined,
            from: reviewFilters.from || undefined,
            to: reviewFilters.to || undefined
          }
        })
      ]);

      setAppointmentHistory(appointmentsResponse.data?.data || []);
      setAppointmentPagination(appointmentsResponse.data?.pagination || { total: 0, page: 1, pages: 1 });

      setChatConversations(chatResponse.data?.data || []);
      setChatPagination(chatResponse.data?.pagination || { total: 0, page: 1, pages: 1 });

      setReviewHistory(reviewsResponse.data?.data || []);
      setReviewPagination(reviewsResponse.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load consultation history'));
    } finally {
      setLoading(false);
    }
  }, [appointmentFilters, chatFilters, reviewFilters]);

  useEffect(() => {
    syncUrl();
    loadHistory();
  }, [loadHistory, syncUrl]);

  const openChatHistory = (appointment) => {
    if (!appointment?._id) {
      return;
    }

    setSelectedAppointment(appointment);
    setShowChatModal(true);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown time';
    }

    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCounterpartyLabel = (appointment) => {
    if (user?.role === 'expert') {
      return appointment?.farmerId?.name || 'Farmer';
    }

    return appointment?.expertId?.name || 'Expert';
  };

  const appointmentOptions = useMemo(() => {
    const unique = new Map();
    appointmentHistory.forEach((appointment) => {
      if (appointment?._id) {
        unique.set(String(appointment._id), appointment);
      }
    });
    return Array.from(unique.values());
  }, [appointmentHistory]);

  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  const PaginationControls = ({ pagination, onPageChange }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Page {pagination.page} of {pagination.pages} ({pagination.total} items)
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page <= 1}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
          disabled={pagination.page >= pagination.pages}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const FilterBar = ({ children, onReset }) => (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Filter className="w-4 h-4 text-nature-600" />
          Filters
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <LoadingState
            title="Loading history"
            description="We are collecting appointment, chat, and review records."
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Consultation History</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review past appointments, conversation logs, and submitted feedback.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => changeTab('appointments')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'appointments'
                ? 'text-nature-600 border-b-2 border-nature-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Appointments ({appointmentPagination.total})
          </button>
          <button
            onClick={() => changeTab('chat')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-nature-600 border-b-2 border-nature-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Chat ({chatPagination.total})
          </button>
          <button
            onClick={() => changeTab('reviews')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-nature-600 border-b-2 border-nature-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Reviews ({reviewPagination.total})
          </button>
        </div>

        {error ? (
          <ErrorState
            title="Unable to load history"
            description={error}
            onAction={loadHistory}
          />
        ) : null}

        {!error && activeTab === 'appointments' ? (
          <>
            <FilterBar
              onReset={() =>
                setAppointmentFilters((current) => ({
                  ...current,
                  status: '',
                  dateFrom: '',
                  dateTo: '',
                  page: 1,
                  limit: 20
                }))
              }
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={appointmentFilters.status}
                  onChange={(event) =>
                    setAppointmentFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="pending">pending</option>
                  <option value="accepted">accepted</option>
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="rejected">rejected</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Per page</label>
                <select
                  value={appointmentFilters.limit}
                  onChange={(event) =>
                    setAppointmentFilters((current) => ({
                      ...current,
                      limit: Number(event.target.value),
                      page: 1
                    }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={appointmentFilters.dateFrom}
                  onChange={(event) =>
                    setAppointmentFilters((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={appointmentFilters.dateTo}
                  onChange={(event) =>
                    setAppointmentFilters((current) => ({ ...current, dateTo: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </FilterBar>

            {appointmentHistory.length === 0 ? (
            <EmptyState
              title="No appointment history"
              description="Booked consultations will appear here once you start using the expert booking system."
            />
          ) : (
            <div className="space-y-4">
              {appointmentHistory.map((appointment) => (
                <div
                  key={appointment._id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {getCounterpartyLabel(appointment)}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            appointmentStatusClasses[appointment.status] || appointmentStatusClasses.cancelled
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mt-0.5 text-nature-600" />
                        <div>
                          <p>{formatDate(appointment.appointmentDetails?.date)}</p>
                          <p>{appointment.appointmentDetails?.startTime || 'No start time'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mt-0.5 text-nature-600" />
                        <div>
                          <p className="capitalize">
                            {appointment.appointmentDetails?.consultationType || 'chat'}
                          </p>
                          <p>{appointment.appointmentDetails?.duration || 30} minutes</p>
                        </div>
                      </div>

                      {appointment.appointmentDetails?.queryDescription ? (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
                          {appointment.appointmentDetails.queryDescription}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-3 md:w-56">
                      <button
                        onClick={() => openChatHistory(appointment)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                        View Chat
                      </button>
                      {appointment.review?.reviewed ? (
                        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
                          Review recorded
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              <PaginationControls
                pagination={appointmentPagination}
                onPageChange={(nextPage) =>
                  setAppointmentFilters((current) => ({ ...current, page: nextPage }))
                }
              />
            </div>
          )
            }
          </>
        ) : null}

        {!error && activeTab === 'chat' ? (
          <>
            <FilterBar
              onReset={() =>
                setChatFilters((current) => ({
                  ...current,
                  appointmentId: '',
                  from: '',
                  to: '',
                  page: 1,
                  limit: 20
                }))
              }
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Appointment</label>
                <select
                  value={chatFilters.appointmentId}
                  onChange={(event) =>
                    setChatFilters((current) => ({ ...current, appointmentId: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  {appointmentOptions.map((appointment) => (
                    <option key={appointment._id} value={appointment._id}>
                      {getCounterpartyLabel(appointment)} ({formatDate(appointment.appointmentDetails?.date)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Per page</label>
                <select
                  value={chatFilters.limit}
                  onChange={(event) =>
                    setChatFilters((current) => ({
                      ...current,
                      limit: Number(event.target.value),
                      page: 1
                    }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={chatFilters.from}
                  onChange={(event) =>
                    setChatFilters((current) => ({ ...current, from: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={chatFilters.to}
                  onChange={(event) =>
                    setChatFilters((current) => ({ ...current, to: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
            </FilterBar>

            {chatConversations.length === 0 ? (
            <EmptyState
              title="No chat history"
              description="Chat messages from expert consultations will appear here."
            />
          ) : (
            <div className="space-y-4">
              {chatConversations.map((entry) => (
                <div
                  key={entry.appointmentId}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {getCounterpartyLabel(entry.appointment)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.count} message{entry.count === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last activity: {formatDateTime(entry.lastMessage?.createdAt)}
                      </p>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
                        {entry.lastMessage?.message || 'No preview available'}
                      </div>
                    </div>

                    <button
                      onClick={() => openChatHistory(entry.appointment)}
                      disabled={!entry.appointment}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 md:w-48"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Chat Log
                    </button>
                  </div>
                </div>
              ))}
              <PaginationControls
                pagination={chatPagination}
                onPageChange={(nextPage) =>
                  setChatFilters((current) => ({ ...current, page: nextPage }))
                }
              />
            </div>
          )
            }
          </>
        ) : null}

        {!error && activeTab === 'reviews' ? (
          <>
            <FilterBar
              onReset={() =>
                setReviewFilters((current) => ({
                  ...current,
                  moderationStatus: '',
                  ratingMin: '',
                  ratingMax: '',
                  from: '',
                  to: '',
                  page: 1,
                  limit: 20
                }))
              }
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Moderation</label>
                <select
                  value={reviewFilters.moderationStatus}
                  onChange={(event) =>
                    setReviewFilters((current) => ({ ...current, moderationStatus: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">All</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Per page</label>
                <select
                  value={reviewFilters.limit}
                  onChange={(event) =>
                    setReviewFilters((current) => ({
                      ...current,
                      limit: Number(event.target.value),
                      page: 1
                    }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rating min</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={reviewFilters.ratingMin}
                  onChange={(event) =>
                    setReviewFilters((current) => ({ ...current, ratingMin: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Rating max</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={reviewFilters.ratingMax}
                  onChange={(event) =>
                    setReviewFilters((current) => ({ ...current, ratingMax: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={reviewFilters.from}
                  onChange={(event) =>
                    setReviewFilters((current) => ({ ...current, from: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={reviewFilters.to}
                  onChange={(event) =>
                    setReviewFilters((current) => ({ ...current, to: event.target.value, page: 1 }))
                  }
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="hidden md:block" />
            </FilterBar>

            {reviewHistory.length === 0 ? (
            <EmptyState
              title="No review history"
              description="Submitted consultation reviews will appear here."
            />
          ) : (
            <div className="space-y-4">
              {reviewHistory.map((review) => (
                <div
                  key={review._id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {user?.role === 'expert'
                            ? review.farmerId?.name || 'Farmer'
                            : review.expertId?.name || 'Expert'}
                        </h3>
                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {review.rating}/5
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitted {formatDateTime(review.createdAt)}
                      </p>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
                        {review.feedback}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 md:w-52">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Moderation</p>
                      <p className="capitalize">{review.moderation?.status || 'pending'}</p>
                      <p className="mt-2">
                        {review.wouldRecommend ? 'Would recommend' : 'Would not recommend'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <PaginationControls
                pagination={reviewPagination}
                onPageChange={(nextPage) =>
                  setReviewFilters((current) => ({ ...current, page: nextPage }))
                }
              />
            </div>
          )
            }
          </>
        ) : null}
      </div>

      <AppointmentChatModal
        isOpen={showChatModal}
        appointment={selectedAppointment}
        currentUser={user}
        onClose={() => setShowChatModal(false)}
      />
    </PageTransition>
  );
};

export default History;
