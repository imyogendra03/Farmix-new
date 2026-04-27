import React, { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart2,
  Bell,
  CalendarRange,
  CheckSquare,
  Leaf,
  MessageSquare,
  Shield,
  Sprout,
  Users,
  Wind
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageTransition from '../components/PageTransition';
import SkeletonLoader from '../components/SkeletonLoader';
import WeatherWidget from '../components/WeatherWidget';

const quickTools = [
  { to: '/crop-recommendation', icon: Sprout, label: 'Crop Analysis' },
  { to: '/disease-prediction', icon: Activity, label: 'Disease Scan' },
  { to: '/yield-prediction', icon: Wind, label: 'Yield Forecast' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/farm-map', icon: Leaf, label: 'Farm Map' },
  { to: '/market-prediction', icon: BarChart2, label: 'Market Prices' },
  { to: '/farmer-bookings', icon: Shield, label: 'Expert Connect' },
  { to: '/history', icon: CalendarRange, label: 'Activity Log' }
];

const getPredictionLabel = (item) => {
  if (item.type === 'Crop-Recommendation') {
    return item.predictionResult?.recommendedCrop || 'Crop insight';
  }
  if (item.type === 'Disease-Prediction') {
    return item.predictionResult?.disease || item.predictionResult?.diseaseName || 'Disease insight';
  }
  if (item.type === 'Yield-Prediction') {
    return item.predictionResult?.estimatedYield
      ? `${item.predictionResult.estimatedYield} t/ha`
      : 'Yield insight';
  }
  return 'Analyzed';
};

const QuickTool = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/30 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
  >
    <span className="inline-flex items-center gap-3">
      <Icon className="w-4 h-4 text-emerald-600" />
      {label}
    </span>
    <ArrowRight className="w-4 h-4 text-gray-400" />
  </Link>
);

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [experts, setExperts] = useState([]);
  const [followedExperts, setFollowedExperts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (!user || user.role === 'admin') {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.get('/predictions/history'),
          api.get('/messages/my'),
          api.get('/experts/available'),
          api.get('/appointments/?limit=10'),
          api.get('/experts/following'),
          api.get('/history/chat?mode=conversations&limit=5')
        ]);

        const [historyRes, messagesRes, expertsRes, appointmentsRes, followedExpertsRes, chatHistoryRes] = results;

        if (historyRes.status === 'fulfilled' && historyRes.value.data.success) {
          setHistory(historyRes.value.data.data.slice(0, 5));
        }
        if (messagesRes.status === 'fulfilled' && messagesRes.value.data.success) {
          setMessages(messagesRes.value.data.data || []);
        }
        if (expertsRes.status === 'fulfilled' && expertsRes.value.data.success) {
          setExperts(expertsRes.value.data.data || []);
        }
        if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value.data.success) {
          setAppointments(appointmentsRes.value.data.data || []);
        }
        if (followedExpertsRes.status === 'fulfilled' && followedExpertsRes.value.data.success) {
          setFollowedExperts(followedExpertsRes.value.data.data || []);
        }
        if (chatHistoryRes.status === 'fulfilled' && chatHistoryRes.value.data.success) {
          setChatHistory(chatHistoryRes.value.data.data || []);
        }

        const successCount = results.filter((result) => result.status === 'fulfilled').length;
        if (successCount < results.length) {
          toast.warning('Some dashboard sections failed to load. Showing available data.');
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;

  const pendingAppointments = appointments.filter((appointment) => appointment.status === 'pending');
  const activeAppointments = appointments.filter((appointment) =>
    ['accepted', 'active'].includes(appointment.status)
  );
  const featuredExperts = experts.slice(0, 2);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Welcome back, <span className="text-emerald-700 dark:text-emerald-400">{user.name}</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Here is what is happening on your farm today.
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            {[
              { label: 'Total Predictions', value: history.length, icon: BarChart2, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Recent Messages', value: messages.length, icon: MessageSquare, tone: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Unread Replies', value: messages.filter((message) => !message.isRead).length, icon: Bell, tone: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
              { label: 'Active Tasks', value: activeAppointments.length || '5+', icon: CheckSquare, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' }
            ].map((card) => (
              <div key={card.label} className="rounded-3xl bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className={`inline-flex rounded-2xl p-3 ${card.tone}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="mt-4 text-3xl font-black text-gray-900 dark:text-white">{card.value}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-8">
            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Slot Booking Pending</p>
              <p className="mt-3 text-5xl font-black text-gray-900 dark:text-white">{pendingAppointments.length}</p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No pending slot requests right now.
              </p>
              <Link to="/farmer-bookings" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-500">
                Open Expert Connect
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">Recent Activity</p>
              <p className="mt-3 text-5xl font-black text-gray-900 dark:text-white">{history.length}</p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Review your latest predictions and expert updates.
              </p>
              <Link to="/history" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-500">
                Open Full Recent Activity
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr] mb-10">
            <div className="space-y-8">
              <WeatherWidget />

              <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm lg:min-h-[420px]">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Quick Tools</h2>
                <div className="space-y-3">
                  {quickTools.map((tool) => (
                    <QuickTool key={tool.to} {...tool} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track your recent farming insights.</p>
                  </div>
                  <Link to="/analytics" className="text-sm font-bold text-indigo-500 hover:text-indigo-600">
                    View Analytics
                  </Link>
                </div>

                {loading ? (
                  <SkeletonLoader type="card" count={3} />
                ) : history.length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
                    <p className="text-sm font-medium text-gray-400">No predictions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                    {history.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-emerald-50/70 dark:bg-emerald-900/10 px-5 py-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-sm">
                            <Sprout className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900 dark:text-white">
                              {item.type.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{getPredictionLabel(item)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm lg:min-h-[420px]">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Available Experts</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Follow experts in Expert Connect, then book directly from your connected list.
                    </p>
                  </div>
                  <Link to="/farmer-bookings" className="text-sm font-bold text-indigo-500 hover:text-indigo-600">
                    Open Expert Connect
                  </Link>
                </div>

                {featuredExperts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 py-10 text-center text-sm text-gray-400">
                    No experts available right now.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {featuredExperts.map((expert) => (
                      <div key={expert.id} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
                        <p className="text-lg font-black text-gray-900 dark:text-white">{expert.name}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {expert.expertise?.[0] || 'General Agriculture'}
                        </p>
                        <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {followedExperts.some((item) => String(item.id) === String(expert.id))
                            ? 'Followed expert'
                            : 'Follow to unlock booking'}
                        </p>
                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Experience: {expert.experienceYears || 0} years
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Rating: {expert.rating || 0}
                        </p>
                        <div className="mt-4 flex gap-3">
                          <Link
                            to="/farmer-bookings"
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Book Appointment
                          </Link>
                          <Link
                            to={`/expert/${expert.id}`}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Support Workspace</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Direct dialogue with management.
                </p>
              </div>
              {messages.some((message) => !message.isRead) ? (
                <span className="rounded-full bg-red-100 px-4 py-1.5 text-xs font-black text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  Action required
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[380px]">
              <div className="border-r border-gray-100 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/20">
                {loading ? (
                  <div className="p-6">
                    <SkeletonLoader type="text" count={4} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-400">No history found</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className="border-b border-gray-100 dark:border-gray-700 px-5 py-4"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-600">
                        {message.subject}
                      </p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-center bg-[#ece2d7] dark:bg-gray-900/40 p-10 text-center">
                <div>
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">Workspace Inactive</h3>
                  <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                    Need help? Send a message via the home page contact form to start a dialogue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Chat History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recent expert conversations from your consultation timeline.
                </p>
              </div>
              <Link to="/history" className="text-sm font-bold text-indigo-500 hover:text-indigo-600">
                Open History
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {chatHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 py-10 text-center text-sm text-gray-400 md:col-span-2">
                  No consultation chats yet.
                </div>
              ) : (
                chatHistory.map((conversation) => (
                  <div
                    key={conversation.appointmentId || conversation._id}
                    className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4"
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
      </div>
    </PageTransition>
  );
};

export default UserDashboard;
