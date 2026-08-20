import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CalendarEvent } from "@/types";

const LOCAL_STORAGE_KEY = "work_board_calendar_events_v1";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const saveLocal = (data: CalendarEvent[]) => {
    setEvents(data);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("calendar_event")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.warn("Error fetching calendar_event:", error.message);
      return;
    }

    if (data) {
      // Get existing local cache to preserve local-only endDate and color if DB hasn't migrated columns yet
      let currentLocal: CalendarEvent[] = [];
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) currentLocal = JSON.parse(cached);
        } catch (e) {}
      }
      const localMap = new Map(currentLocal.map((item) => [item.id, item]));

      const mapped: CalendarEvent[] = data.map((e: any) => {
        const localItem = localMap.get(e.id);
        return {
          id: e.id,
          date: e.date || "",
          endDate: e.end_date || e.endDate || localItem?.endDate || e.date || "",
          color: e.color || localItem?.color || "blue",
          title: e.title || "",
          description: e.description || "",
          isImportant: e.is_important ?? e.isImportant ?? false,
        };
      });

      // Preserve any locally created events that haven't synced to DB yet
      const dbIds = new Set(data.map((d: any) => d.id));
      const localOnly = currentLocal.filter((item) => !dbIds.has(item.id));
      const merged = [...mapped, ...localOnly];

      saveLocal(merged);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("public:calendar_event")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_event" }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addEvent = async (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    };

    // Instant Optimistic UI Update (0ms)
    saveLocal([...events, newEvent]);

    // Try full payload with end_date & color
    const fullPayload = {
      id: newEvent.id,
      date: event.date,
      end_date: event.endDate || event.date,
      color: event.color || "blue",
      title: event.title,
      description: event.description || "",
      is_important: event.isImportant || false,
    };

    const { error: fullError } = await supabase.from("calendar_event").insert([fullPayload]);
    
    if (fullError) {
      console.warn("Full payload insert error, trying basic payload:", fullError.message);
      // Fallback basic payload if end_date or color columns don't exist yet on Supabase DB
      const basicPayload = {
        id: newEvent.id,
        date: event.date,
        title: event.title,
        description: event.description || "",
        is_important: event.isImportant || false,
      };
      const { error: basicError } = await supabase.from("calendar_event").insert([basicPayload]);
      if (basicError) console.warn("Basic payload insert error:", basicError.message);
    }
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    // Instant Optimistic UI Update (0ms)
    const updated = events.map((e) => (e.id === id ? { ...e, ...data } : e));
    saveLocal(updated);

    const fullPayload: any = {};
    if (data.date !== undefined) fullPayload.date = data.date;
    if (data.endDate !== undefined) fullPayload.end_date = data.endDate;
    if (data.color !== undefined) fullPayload.color = data.color;
    if (data.title !== undefined) fullPayload.title = data.title;
    if (data.description !== undefined) fullPayload.description = data.description;
    if (data.isImportant !== undefined) fullPayload.is_important = data.isImportant;

    const { error: fullError } = await supabase.from("calendar_event").update(fullPayload).eq("id", id);
    if (fullError) {
      console.warn("Full payload update error, trying basic update:", fullError.message);
      const basicPayload: any = {};
      if (data.date !== undefined) basicPayload.date = data.date;
      if (data.title !== undefined) basicPayload.title = data.title;
      if (data.description !== undefined) basicPayload.description = data.description;
      if (data.isImportant !== undefined) basicPayload.is_important = data.isImportant;
      await supabase.from("calendar_event").update(basicPayload).eq("id", id);
    }
  };

  const deleteEvent = async (id: string) => {
    // Instant Optimistic UI Update (0ms)
    saveLocal(events.filter((e) => e.id !== id));

    const { error } = await supabase.from("calendar_event").delete().eq("id", id);
    if (error) console.warn("Error deleting calendar event in DB:", error.message);
  };

  const getEventsByDate = (dateStr: string) => {
    return events.filter((e) => e.date === dateStr);
  };

  const getEventsByMonth = (year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return events.filter((e) => e.date.startsWith(prefix));
  };

  return { events, addEvent, updateEvent, deleteEvent, getEventsByDate, getEventsByMonth };
}
