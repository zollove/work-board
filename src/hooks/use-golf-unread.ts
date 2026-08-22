"use client";

import { useState, useEffect, useCallback } from "react";

const GOLF_LAST_VIEWED_KEY = "work_board_golf_last_viewed";

export function useGolfUnread() {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/golf-journal", { cache: "no-store" });
      const data = await res.json();

      if (data && data.articles && data.articles.length > 0) {
        const lastViewed = localStorage.getItem(GOLF_LAST_VIEWED_KEY);
        const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;

        // Check if there is any article published after lastViewedTime or marked as isNew
        const hasNew = data.articles.some((article: { date: string; isNew: boolean }) => {
          if (!lastViewedTime) return article.isNew;
          const articleTime = new Date(article.date).getTime();
          return isNaN(articleTime) ? article.isNew : articleTime > lastViewedTime;
        });

        setHasUnread(hasNew);
      }
    } catch (e) {
      // Ignore network errors
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(GOLF_LAST_VIEWED_KEY, new Date().toISOString());
      setHasUnread(false);
    }
  }, []);

  useEffect(() => {
    checkUnread();
    // Re-check periodically every 10 minutes
    const timer = setInterval(checkUnread, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [checkUnread]);

  return { hasUnread, markAllAsRead, checkUnread };
}
