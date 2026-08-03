"use client";

import { useState } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { MonthCard } from "./month-card";
import { MonthDetailModal } from "./month-detail-modal";

export function WorkCalendar() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const { events, getEventsByMonth, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  // Generate 5 years back and 5 years forward for the dropdown
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label htmlFor="year-select" className="text-sm font-medium">연도 선택:</label>
        <select
          id="year-select"
          className="flex h-10 w-32 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
          <MonthCard
            key={month}
            month={month}
            events={getEventsByMonth(selectedYear, month)}
            onClick={() => setSelectedMonth(month)}
          />
        ))}
      </div>

      {selectedMonth !== null && (
        <MonthDetailModal
          isOpen={true}
          onClose={() => setSelectedMonth(null)}
          year={selectedYear}
          month={selectedMonth}
          events={events}
          addEvent={addEvent}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
          onMonthChange={(y, m) => {
            setSelectedYear(y);
            setSelectedMonth(m);
          }}
        />
      )}
    </div>
  );
}
