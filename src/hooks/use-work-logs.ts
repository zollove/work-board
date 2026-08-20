"use client";

import { useState, useEffect } from "react";
import { WorkLog } from "@/types";
import { supabase } from "@/lib/supabaseClient";

const LOCAL_KEY = "work_board_work_logs_v1";

export function useWorkLogs() {
  const [logs, setLogs] = useState<WorkLog[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_KEY);
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("work_logs")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.warn("Supabase fetch work_logs error, fallback to local:", error.message);
        return;
      }

      if (data) {
        const formatted: WorkLog[] = data.map((item: any) => ({
          id: item.id,
          date: item.date,
          todayWork: item.today_work || item.todayWork || "",
          pendingWork: item.pending_work || item.pendingWork || "",
          issues: item.issues || "",
          imageUrl: item.image_url || item.imageUrl || "",
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));
        setLogs(formatted);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(formatted));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Supabase fetch work_logs error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // ⚡ 1. Supabase Realtime Subscription for Instant Web-to-Mobile Sync
    const channel = supabase
      .channel("public:work_logs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_logs" },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    // 📱 2. Auto-refresh when tab or browser regains focus
    const handleFocus = () => {
      fetchLogs();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const saveToLocal = (newLogs: WorkLog[]) => {
    setLogs(newLogs);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(newLogs));
      } catch (e) {}
    }
  };

  const getLogByDate = (targetDate: string): WorkLog | undefined => {
    return logs.find((l) => l.date === targetDate);
  };

  const saveLog = async (logData: Omit<WorkLog, "id" | "createdAt" | "updatedAt">) => {
    const existing = logs.find((l) => l.date === logData.date);
    const now = new Date().toISOString();

    let targetLog: WorkLog;
    let updatedList: WorkLog[];

    if (existing) {
      targetLog = {
        ...existing,
        ...logData,
        updatedAt: now,
      };
      updatedList = logs.map((l) => (l.id === existing.id ? targetLog : l));
    } else {
      targetLog = {
        ...logData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [targetLog, ...logs];
    }

    saveToLocal(updatedList);

    try {
      const { error } = await supabase.from("work_logs").upsert([
        {
          id: targetLog.id,
          date: targetLog.date,
          today_work: targetLog.todayWork,
          pending_work: targetLog.pendingWork,
          issues: targetLog.issues,
          image_url: targetLog.imageUrl,
          created_at: targetLog.createdAt,
          updated_at: targetLog.updatedAt,
        },
      ]);
      if (error) {
        console.error("Supabase upsert work_log error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase upsert work_log error:", err);
    }

    return targetLog;
  };

  const deleteLog = async (dateStr: string) => {
    const target = logs.find((l) => l.date === dateStr);
    const updatedList = logs.filter((l) => l.date !== dateStr);
    saveToLocal(updatedList);

    if (target) {
      try {
        const { error } = await supabase.from("work_logs").delete().eq("id", target.id);
        if (error) {
          console.error("Supabase delete work_log error:", error.message);
        }
      } catch (err) {
        console.warn("Supabase delete work_log error:", err);
      }
    }
  };

  return {
    logs,
    isLoading,
    getLogByDate,
    saveLog,
    deleteLog,
    fetchLogs,
  };
}
