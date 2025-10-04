import { useState } from "react";

export const useNotifications = (systemPreferences) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info") => {
    if (!systemPreferences?.showNotifications) return;

    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, (systemPreferences?.autoSaveDelay || 2000) * 3);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return {
    notifications,
    showNotification,
    removeNotification,
  };
};
