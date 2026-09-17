"use client";

import { useEffect, useState, useCallback } from "react";

export interface NotificationData {
  id: string;
  message: string;
  type: string;
  lu: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e: any) {
      // Silently ignore network interruptions (ERR_INTERNET_DISCONNECTED, ERR_NETWORK_CHANGED)
      if (e?.name !== "TypeError") {
        console.warn("Notifications fetch error:", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);

    const handleOnline = () => {
      fetchNotifs();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchNotifs]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/lu`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return { notifications, unreadCount, loading, fetchNotifs, markAsRead, markAllRead };
}
