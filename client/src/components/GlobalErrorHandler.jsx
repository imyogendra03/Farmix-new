import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

const normalizeErrorMessage = (value) => {
  if (!value || typeof value !== 'string') {
    return DEFAULT_MESSAGE;
  }

  return value.trim() || DEFAULT_MESSAGE;
};

const GlobalErrorHandler = () => {
  const shownMessagesRef = useRef(new Map());

  useEffect(() => {
    const showToast = (message) => {
      const normalized = normalizeErrorMessage(message);
      const now = Date.now();
      const lastShownAt = shownMessagesRef.current.get(normalized) || 0;

      if (now - lastShownAt < 3000) {
        return;
      }

      shownMessagesRef.current.set(normalized, now);
      toast.error(normalized);
    };

    const handleApiError = (event) => {
      showToast(event?.detail?.message);
    };

    const handleRuntimeError = (event) => {
      showToast(event?.message || event?.reason?.message);
    };

    const handlePromiseRejection = (event) => {
      const reason = event?.reason;
      showToast(reason?.apiMessage || reason?.message || reason);
    };

    const handleAppError = (event) => {
      showToast(event?.detail?.message);
    };

    window.addEventListener('api:error', handleApiError);
    window.addEventListener('error', handleRuntimeError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    window.addEventListener('app:error', handleAppError);

    return () => {
      window.removeEventListener('api:error', handleApiError);
      window.removeEventListener('error', handleRuntimeError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      window.removeEventListener('app:error', handleAppError);
    };
  }, []);

  return null;
};

export default GlobalErrorHandler;
