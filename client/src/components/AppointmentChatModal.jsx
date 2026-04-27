import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, ImagePlus, Send, TriangleAlert, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { getApiErrorMessage } from '../services/api';
import { getSocket } from '../services/socket';
import { NotificationContext } from '../context/NotificationContext';

const toDisplayTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const normalizeMessages = (messages = []) =>
  messages.map((message) => ({
    ...message,
    id: message._id || message.id
  }));

const AppointmentChatModal = ({ isOpen, appointment, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const { addNotification } = useContext(NotificationContext);
  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => {
    if (!isOpen || !appointment?._id) {
      return undefined;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/chat/${appointment._id}`);
        if (isMounted) {
          setMessages(normalizeMessages(data.data || []));
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load chat messages'));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join:appointment', { appointmentId: appointment._id });

    const handleIncomingMessage = (incomingMessage) => {
      if (String(incomingMessage.appointmentId) !== String(appointment._id)) {
        return;
      }

      setMessages((current) => {
        const normalized = normalizeMessages(current);
        if (normalized.some((message) => String(message.id) === String(incomingMessage._id))) {
          return normalized;
        }

        const nextMessages = [...normalized, { ...incomingMessage, id: incomingMessage._id }];

        if (String(incomingMessage.senderId) !== String(currentUserId)) {
          addNotification({
            message: incomingMessage.message || 'New consultation message received.',
            type: 'chat',
          });
        }

        return nextMessages;
      });
    };

    socket.on('chat:message', handleIncomingMessage);

    return () => {
      isMounted = false;
      socket.emit('leave:appointment', { appointmentId: appointment._id });
      socket.off('chat:message', handleIncomingMessage);
    };
  }, [addNotification, appointment?._id, currentUserId, isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const elapsedLabel = useMemo(() => {
    if (!appointment?.appointmentDetails?.date) {
      return '0m elapsed';
    }

    const start = new Date(appointment.appointmentDetails.date);
    const time = appointment.appointmentDetails.startTime || '00:00';
    const [hours, minutes] = time.split(':').map(Number);
    start.setHours(hours || 0, minutes || 0, 0, 0);

    const diffMinutes = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
    return `${diffMinutes}m elapsed`;
  }, [appointment?.appointmentDetails?.date, appointment?.appointmentDetails?.startTime]);

  if (!isOpen || !appointment) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);
      await api.post('/chat/send', {
        appointmentId: appointment._id,
        message: messageInput.trim()
      });
      setMessageInput('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send message'));
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl dark:bg-gray-900">
        <div className="rounded-b-[30px] bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-3xl font-black tracking-tight">Live Consultation</h3>
              <p className="mt-1 text-sm font-semibold text-emerald-100">
                Appointment ID: {appointment._id}
              </p>
              <p className="mt-2 text-xs text-emerald-100">
                {loading ? 'Loading conversation...' : 'Typing...'}
              </p>
              <p className="mt-1 text-xs text-emerald-100">Unread: 0</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                <Clock3 className="h-3.5 w-3.5" />
                {elapsedLabel}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/30 px-3 py-1.5 text-xs font-bold text-orange-50">
                <TriangleAlert className="h-3.5 w-3.5" />
                Consultation will timeout soon
              </div>
              <button
                onClick={onClose}
                className="mt-1 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-5 dark:bg-gray-950">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading chat...</p>
          ) : messages.length === 0 ? (
            <div className="rounded-[24px] border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              No messages yet. Start the consultation chat.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const mine = String(message.senderId) === String(currentUser?.id || currentUser?._id);
                const senderLabel = message.senderRole === 'expert'
                  ? 'Expert'
                  : message.senderRole === 'farmer'
                    ? 'Farmer'
                    : 'Admin';

                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-[20px] px-4 py-3 shadow-sm ${
                        mine
                          ? 'rounded-br-md bg-emerald-600 text-white'
                          : 'rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                      }`}
                    >
                      <p className={`mb-1 text-xs font-black uppercase tracking-[0.14em] ${mine ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {senderLabel}
                      </p>
                      <p className="text-sm leading-6">{message.message}</p>
                      <p className={`mt-2 text-[11px] ${mine ? 'text-emerald-100' : 'text-gray-400'}`}>
                        {toDisplayTime(message.createdAt || message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-gray-100 p-3 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Attachments coming next"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sendingMessage ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChatModal;
