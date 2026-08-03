import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CalendarEvent } from "@/types";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("calendar_event")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching calendar_event:", error);
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
      setEvents(mapped);
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
    const payload = {
      date: event.date,
      title: event.title,
      description: event.description || "",
      is_important: event.isImportant || false,
    };

    const { error } = await supabase.from("calendar_event").insert([payload]);
    if (error) console.error("Error adding event:", error);
    else fetchEvents();
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    const payload: any = {};
    if (data.date !== undefined) payload.date = data.date;
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.isImportant !== undefined) payload.is_important = data.isImportant;

    const { error } = await supabase.from("calendar_event").update(payload).eq("id", id);
    if (error) console.error("Error updating event:", error);
    else fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("calendar_event").delete().eq("id", id);
    if (error) console.error("Error deleting event:", error);
    else fetchEvents();
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
