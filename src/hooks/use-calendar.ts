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
      const mapped: CalendarEvent[] = data.map((e: any) => ({
        id: e.id,
        date: e.date || "",
        title: e.title || "",
        description: e.description || "",
        isImportant: e.is_important ?? e.isImportant ?? false,
      }));
      saveLocal(mapped);
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

    const payload = {
      id: newEvent.id,
      date: event.date,
      title: event.title,
      description: event.description || "",
      is_important: event.isImportant || false,
    };

    const { error } = await supabase.from("calendar_event").insert([payload]);
    if (error) console.warn("Error adding calendar event to DB:", error.message);
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    // Instant Optimistic UI Update (0ms)
    const updated = events.map((e) => (e.id === id ? { ...e, ...data } : e));
    saveLocal(updated);

    const payload: any = {};
    if (data.date !== undefined) payload.date = data.date;
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isImportant !== undefined) payload.is_important = data.isImportant;

    const { error } = await supabase.from("calendar_event").update(payload).eq("id", id);
    if (error) console.warn("Error updating calendar event in DB:", error.message);
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
