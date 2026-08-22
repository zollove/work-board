"use client";

import { useState, useEffect, useCallback } from "react";

export function useMailUnread() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`/api/mail/unread-count?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
        setIsConnected(!!data.isConnected);
      }
    } catch (e) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Poll every 60 seconds (1 minute) for real-time background detection
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60 * 1000);

    // Instant optimistic decrement event (0.001s response time)
    const handleDecrement = () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    // Explicit count setter event
    const handleSetCount = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (customEvent.detail && typeof customEvent.detail.count === "number") {
        setUnreadCount(customEvent.detail.count);
      } else {
        fetchUnreadCount();
      }
    };

    // Refresh immediately when user returns to window / tab
    const handleFocus = () => {
      fetchUnreadCount();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    });

    window.addEventListener("mail-count-updated", handleFocus);
    window.addEventListener("mail-count-decrement", handleDecrement);
    window.addEventListener("mail-count-set", handleSetCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("mail-count-updated", handleFocus);
      window.removeEventListener("mail-count-decrement", handleDecrement);
      window.removeEventListener("mail-count-set", handleSetCount);
    };
  }, [fetchUnreadCount]);

  return { unreadCount, isConnected, refreshUnreadCount: fetchUnreadCount };
}
