import React, { createContext, useEffect, useState } from 'react';

export const NotificationContext = createContext();

const STORAGE_KEY = 'farmix_notifications';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      isRead: false,
      time: new Date().toISOString(),
      ...notification,
    };
    setNotifications((prev) => [entry, ...prev]);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
  };

  const markOneRead = (id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAllRead,
      markOneRead,
      deleteNotification,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
