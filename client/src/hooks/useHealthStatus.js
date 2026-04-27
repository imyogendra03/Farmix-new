import { useEffect, useState } from 'react';
import api from '../services/api';

let subscribers = new Set();
let pollTimer = null;
let inFlightRequest = null;
let currentStatus = {
  state: 'checking',
  database: 'checking',
  uptime: null,
  latency: null
};

const notifySubscribers = () => {
  subscribers.forEach((setState) => setState(currentStatus));
};

const schedulePolling = () => {
  if (pollTimer || !subscribers.size) {
    return;
  }

  pollTimer = setInterval(() => {
    void fetchHealthStatus();
  }, 30000);
};

const stopPollingIfIdle = () => {
  if (subscribers.size || !pollTimer) {
    return;
  }

  clearInterval(pollTimer);
  pollTimer = null;
};

const fetchHealthStatus = async () => {
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const startedAt = Date.now();

  inFlightRequest = api.get('/health')
    .then((response) => {
      const data = response.data || {};
      currentStatus = {
        state: 'connected',
        database: data.database || 'connected',
        uptime: data.uptime || null,
        latency: `${Date.now() - startedAt}ms`
      };
      notifySubscribers();
      return currentStatus;
    })
    .catch(() => {
      currentStatus = {
        state: 'error',
        database: 'disconnected',
        uptime: null,
        latency: null
      };
      notifySubscribers();
      return currentStatus;
    })
    .finally(() => {
      inFlightRequest = null;
    });

  return inFlightRequest;
};

const useHealthStatus = () => {
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    subscribers.add(setStatus);
    setStatus(currentStatus);
    schedulePolling();
    void fetchHealthStatus();

    return () => {
      subscribers.delete(setStatus);
      stopPollingIfIdle();
    };
  }, []);

  return status;
};

export default useHealthStatus;
