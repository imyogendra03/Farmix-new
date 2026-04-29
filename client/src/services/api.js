import axios from 'axios';

const normalizeBaseUrl = (url) => (url || 'http://localhost:5000/api').replace(/\/+$/, '');
const AUTH_FREE_PATHS = ['/api/auth/login', '/api/auth/farmer/login', '/api/auth/expert/login', '/api/auth/admin/login', '/api/auth/refresh-token', '/api/auth/logout'];

const getStoredSession = () => {
  try {
    const storedUser = localStorage.getItem('farmix_user') || localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem('farmix_user');
    localStorage.removeItem('user');
    return null;
  }
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const clearStoredSession = () => {
  localStorage.removeItem('farmix_user');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

const persistSessionTokens = ({ token, refreshToken }) => {
  const session = getStoredSession();
  if (!session) return;

  const updatedSession = { ...session };
  if (token) {
    updatedSession.token = token;
    localStorage.setItem('token', token);
  }
  if (refreshToken) {
    updatedSession.refreshToken = refreshToken;
    localStorage.setItem('refreshToken', refreshToken);
  }

  localStorage.setItem('farmix_user', JSON.stringify(updatedSession));
  localStorage.setItem('user', JSON.stringify(updatedSession));
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const isAuthFreePath = (url = '') => AUTH_FREE_PATHS.some((path) => url.includes(path));

const api = axios.create({
  baseURL: normalizeBaseUrl(process.env.REACT_APP_API_URL),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

const requestAccessTokenRefresh = async () => {
  const session = getStoredSession();
  const refreshToken =
    localStorage.getItem('refreshToken') ||
    session?.refreshToken ||
    session?.data?.refreshToken ||
    '';

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await axios.post(
    `${api.defaults.baseURL}/api/auth/refresh-token`,
    { refreshToken },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const nextToken = data?.data?.token;
  const nextRefreshToken = data?.data?.refreshToken;

  if (!nextToken || !nextRefreshToken) {
    throw new Error('Invalid refresh token response');
  }

  persistSessionTokens({
    token: nextToken,
    refreshToken: nextRefreshToken
  });

  return nextToken;
};

const refreshAccessTokenOnce = async () => {
  if (!refreshPromise) {
    refreshPromise = requestAccessTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

// Request interceptor to add JWT token if available
api.interceptors.request.use(
  (config) => {
    const user = getStoredSession();
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const message = getApiErrorMessage(error);
    const originalRequest = error.config || {};

    error.apiMessage = message;
    error.isApiError = true;

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isAuthFreePath(originalRequest.url)
    ) {
      try {
        originalRequest._retry = true;
        const nextToken = await refreshAccessTokenOnce();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch {
        clearStoredSession();
        redirectToLogin();
      }
    } else if (status === 401) {
      clearStoredSession();
      redirectToLogin();
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:error', {
        detail: {
          status,
          message,
          url: error.config?.url || ''
        }
      }));
    }

    return Promise.reject(error);
  }
);

export default api;
