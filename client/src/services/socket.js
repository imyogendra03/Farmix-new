import { io } from 'socket.io-client';

const PRODUCTION_API_URL = 'https://farmix-0e93.onrender.com';

const isLocalBrowser = () => {
  if (typeof window === 'undefined') return true;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
};

const normalizeSocketUrl = (apiUrl) => {
  const providedUrl = (apiUrl || '').trim();
  const shouldUseProductionApi =
    !isLocalBrowser() &&
    (!providedUrl || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(providedUrl));

  const normalized = (shouldUseProductionApi ? PRODUCTION_API_URL : providedUrl || 'http://localhost:5000/api').replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

let socketInstance;

const getStoredToken = () => {
  try {
    const storedUser = localStorage.getItem('farmix_user') || localStorage.getItem('user');
    if (!storedUser) {
      return localStorage.getItem('token') || '';
    }

    const parsedUser = JSON.parse(storedUser);
    return parsedUser?.token || localStorage.getItem('token') || '';
  } catch {
    return localStorage.getItem('token') || '';
  }
};

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(normalizeSocketUrl(process.env.REACT_APP_API_URL), {
      autoConnect: false,
      transports: ['websocket'],
      auth: {
        token: getStoredToken()
      }
    });
  } else {
    socketInstance.auth = { token: getStoredToken() };
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};
