"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarEvent } from "@/types";
import { WeatherWidget } from "./weather-widget";
import { UtilitiesView } from "@/components/utilities/utilities-view";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Edit3, ChevronDown, ChevronUp, Wrench } from "lucide-react";

const COLOR_OPTIONS = [
  { id: "blue", bg: "bg-blue-500", ring: "ring-blue-500" },
  { id: "red", bg: "bg-red-500", ring: "ring-red-500" },
  { id: "green", bg: "bg-emerald-500", ring: "ring-emerald-500" },
  { id: "amber", bg: "bg-amber-500", ring: "ring-amber-500" },
  { id: "purple", bg: "bg-purple-500", ring: "ring-purple-500" },
  { id: "pink", bg: "bg-pink-500", ring: "ring-pink-500" },
];

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-600 dark:bg-blue-500", text: "text-white" },
  red: { bg: "bg-red-600 dark:bg-red-500", text: "text-white" },
  green: { bg: "bg-emerald-600 dark:bg-emerald-500", text: "text-white" },
  amber: { bg: "bg-amber-500 dark:bg-amber-500", text: "text-white" },
  purple: { bg: "bg-purple-600 dark:bg-purple-500", text: "text-white" },
  pink: { bg: "bg-pink-600 dark:bg-pink-500", text: "text-white" },
};

export function WorkCalendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  // Collapsible toggle for Building Management Utilities section
  const [isUtilitiesCollapsed, setIsUtilitiesCollapsed] = useState(true);

  const todayStr = format(today, "yyyy-MM-dd");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    endDate: todayStr,
    color: "blue",
    isImportant: false,
  });

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  // Dropdown options
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  // Calendar Calculation for single month
  const activeDate = new Date(selectedYear, selectedMonth, 1);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(activeDate),
    end: endOfMonth(activeDate),
  });
  const startDay = startOfMonth(activeDate).getDay();
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);

  // Handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDate(today);
  };

  const handleDateClick = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd");
    setSelectedDate(day);
    setEditEvent(null);
    setFormData({ title: "", description: "", endDate: dStr, color: "blue", isImportant: false });
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent, day: Date) => {
    e.stopPropagation();
    setSelectedDate(day);
    setEditEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      endDate: event.endDate || event.date,
      color: event.color || "blue",
      isImportant: event.isImportant || false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.title.trim()) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const finalEndDate = formData.endDate && formData.endDate >= dateStr ? formData.endDate : dateStr;

    if (editEvent) {
      updateEvent(editEvent.id, {
        ...formData,
        date: dateStr,
        endDate: finalEndDate,
      });
    } else {
      addEvent({
        ...formData,
        date: dateStr,
        endDate: finalEndDate,
      });
    }

    setEditEvent(null);
    setFormData({ title: "", description: "", endDate: dateStr, color: "blue", isImportant: false });
  };

  const handleDelete = () => {
    if (editEvent) {
      deleteEvent(editEvent.id);
      setEditEvent(null);
      const dStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : todayStr;
      setFormData({ title: "", description: "", endDate: dStr, color: "blue", isImportant: false });
    }
  };

  // Selected date events
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const dayEvents = selectedDateStr ? events.filter((e) => e.date === selectedDateStr) : [];

  // Last year's events for the same month
  const lastYearMonthEvents = events.filter((e) => {
    const [y, m] = e.date.split("-");
    return Number(y) === selectedYear - 1 && Number(m) === selectedMonth + 1;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full pb-24 md:pb-12 px-1 sm:px-4">
      {/* 1. 🌤️ 7-Day Weather & Building Hazard Warning Bar */}
      <WeatherWidget />



      {/* 3. 📅 모바일 스마트 최적화 단일 월 캘린더 타일 */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Calendar Control Header Bar */}
        <CardHeader className="p-3 sm:p-6 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <span>{selectedYear}년 {selectedMonth + 1}월 캘린더</span>
                <Sparkles className="w-4 h-4 text-amber-500 hidden sm:inline" />
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                날짜를 터치하여 월별 업무 및 일정을 바로 작성하세요.
              </p>
            </div>
          </div>

          {/* Year & Month Dropdown Controls - Optimized for Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 px-2 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">이전달</span>
              </Button>

              {/* Year Dropdown */}
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>

              {/* Month Dropdown */}
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 px-2 text-xs">
                <span className="hidden sm:inline">다음달</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={handleGoToday} className="h-8 text-xs font-bold px-2.5">
              오늘
            </Button>
          </div>
        </CardHeader>

        {/* Main Calendar View Body: Mobile Screen Optimized 7-Column Grid */}
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Left/Main: 7-Column Calendar Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              {/* Day Headers (Sun ~ Sat) */}
              <div className="grid grid-cols-7 border-b bg-muted/40 font-bold text-[11px] sm:text-xs text-center py-2">
                <span className="text-red-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-blue-500">토</span>
              </div>

              {/* Date Cells Grid - Optimized height for mobile screens (minmax 60px on mobile, 110px on desktop) */}
              <div className="grid grid-cols-7 auto-rows-[minmax(64px,auto)] sm:auto-rows-[minmax(110px,1fr)] bg-background">
                {emptyDays.map((i) => (
                  <div key={`empty-${i}`} className="border-b border-r bg-muted/5 p-0.5 sm:p-1" />
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  
                  // Find all events touching dateStr (single day OR multi-day range)
                  const dayEvents = events.filter((e) => {
                    const start = e.date;
                    const end = e.endDate || e.date;
                    return start <= dateStr && end >= dateStr;
                  });

                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayCell = isSameDay(day, today);
                  const dayOfWeek = day.getDay();

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateClick(day)}
                      className={`p-1 sm:p-1.5 border-b border-r cursor-pointer transition-all hover:bg-muted/40 flex flex-col justify-between select-none relative overflow-hidden ${
                        isSelected ? "ring-2 ring-primary ring-inset bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between z-10">
                        <span
                          className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                            isTodayCell
                              ? "bg-primary text-white shadow-sm"
                              : dayOfWeek === 0
                              ? "text-red-500"
                              : dayOfWeek === 6
                              ? "text-blue-500"
                              : "text-foreground"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-primary px-1 bg-primary/10 rounded">
                            {dayEvents.length}건
                          </span>
                        )}
                      </div>

                      {/* Multi-Day Span Event Bar & Single Event Badges */}
                      <div className="flex-1 space-y-0.5 sm:space-y-1 overflow-hidden mt-1 z-10">
                        {dayEvents.slice(0, 3).map((event) => {
                          const start = event.date;
                          const end = event.endDate || event.date;
                          const isMultiDay = start !== end;
                          const isStart = dateStr === start;
                          const isEnd = dateStr === end;

                          const colorTheme = COLOR_CLASSES[event.color || "blue"] || COLOR_CLASSES.blue;

                          // Span Bar Shape & Margins (Explicit height h-5 sm:h-5.5 for uniform thickness across all range days)
                          let shapeClasses = "rounded-md px-1.5";
                          if (isMultiDay) {
                            if (isStart) {
                              shapeClasses = "rounded-l-md rounded-r-none -mr-2.5 pl-1.5 pr-0.5";
                            } else if (isEnd) {
                              shapeClasses = "rounded-r-md rounded-l-none -ml-2.5 pl-3.5 pr-1.5";
                            } else {
                              shapeClasses = "rounded-none -mx-2.5 pl-3.5 pr-0.5";
                            }
                          }

                          return (
                            <div
                              key={`${event.id}-${dateStr}`}
                              onClick={(e) => handleEventClick(e, event, day)}
                              className={`h-5 sm:h-5.5 transition-all cursor-pointer flex items-center gap-0.5 font-medium leading-none shadow-xs text-white ${shapeClasses} ${
                                event.isImportant ? "bg-red-600" : `${colorTheme.bg}`
                              }`}
                              title={`${event.title} (${event.date} ~ ${event.endDate || event.date})`}
                            >
                              {event.isImportant && isStart && <span className="text-amber-300 text-[9px] shrink-0">★</span>}
                              <span className="truncate w-full text-[9px] sm:text-[10px] font-bold leading-none">{event.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[8px] sm:text-[10px] text-muted-foreground text-center font-semibold">
                            +{dayEvents.length - 3}개 더보기
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right/Bottom: Selected Date Event Management Panel */}
            <div className="w-full lg:w-80 bg-muted/10 flex flex-col shrink-0 border-t lg:border-t-0 p-3 sm:p-4 space-y-3 sm:space-y-4">
              {selectedDate ? (
                <>
                  <div className="p-2.5 sm:p-3 bg-card border rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-sm">
                    <span className="text-primary">{format(selectedDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko })}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {events.filter((e) => e.date <= (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "") && (e.endDate || e.date) >= (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "")).length}개 일정
                    </Badge>
                  </div>

                  {/* Day Events List (Mobile Order 1: Appears FIRST below calendar on mobile!) */}
                  {dayEvents.length > 0 && (
                    <div className="order-1 lg:order-2 space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground">이날의 등록된 일정</h4>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {dayEvents.map((evt) => {
                          const isSelectedEvt = editEvent?.id === evt.id;
                          const colorTheme = COLOR_CLASSES[evt.color || "blue"] || COLOR_CLASSES.blue;
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => handleEventClick(e, evt, selectedDate)}
                              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-stretch gap-2.5 ${
                                isSelectedEvt
                                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                                  : "bg-card hover:border-primary/40 hover:bg-muted/20"
                              }`}
                            >
                              <div className={`w-1.5 rounded-full shrink-0 ${evt.isImportant ? "bg-red-500" : colorTheme.bg}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className="font-bold text-xs truncate flex items-center gap-1">
                                    {evt.isImportant && <span className="text-red-500 text-[10px]">★</span>}
                                    <span className="truncate">{evt.title}</span>
                                  </h5>
                                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </div>
                                {evt.description && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                    {evt.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add / Edit Form (Mobile Order 2: Appears SECOND below day events on mobile!) */}
                  <form onSubmit={handleSubmit} className="order-2 lg:order-1 bg-card border rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 shadow-sm">
                    <h3 className="text-xs font-extrabold text-foreground flex items-center justify-between">
                      <span>{editEvent ? "일정 수정" : "+ 새 일정 작성"}</span>
                    </h3>

                    <div className="space-y-1">
                      <Label htmlFor="evt-title" className="text-[11px] sm:text-xs font-bold">제목</Label>
                      <Input
                        id="evt-title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="evt-start" className="text-[11px] sm:text-xs font-bold">시작일</Label>
                        <Input
                          id="evt-start"
                          type="date"
                          value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              const [y, m, d] = e.target.value.split("-").map(Number);
                              setSelectedDate(new Date(y, m - 1, d));
                            }
                          }}
                          className="h-8 text-xs px-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="evt-end" className="text-[11px] sm:text-xs font-bold">종료일 (연속 바)</Label>
                        <Input
                          id="evt-end"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="h-8 text-xs px-2"
                        />
                      </div>
                    </div>

                    {/* Color Picker Palette */}
                    <div className="space-y-1">
                      <Label className="text-[11px] sm:text-xs font-bold block">바 색상 지정</Label>
                      <div className="flex items-center gap-2 pt-0.5">
                        {COLOR_OPTIONS.map((c) => {
                          const isSelected = (formData.color || "blue") === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, color: c.id })}
                              className={`w-6 h-6 rounded-full ${c.bg} transition-all duration-200 cursor-pointer ${
                                isSelected ? `ring-2 ${c.ring} ring-offset-2 scale-110 shadow-md` : "opacity-70 hover:opacity-100"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="evt-desc" className="text-[11px] sm:text-xs font-bold">상세 메모</Label>
                      <Textarea
                        id="evt-desc"
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-0.5">
                      <input
                        type="checkbox"
                        id="evt-important"
                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.isImportant}
                        onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                      />
                      <Label htmlFor="evt-important" className="text-xs cursor-pointer">
                        중요 일정 (강조 표시)
                      </Label>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Button type="submit" size="sm" className="flex-1 text-xs h-8">
                        {editEvent ? "수정 저장" : "일정 저장"}
                      </Button>
                      {editEvent && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="h-8 text-xs">
                          삭제
                        </Button>
                      )}
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  달력에서 날짜를 선택하세요.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Banner: Last Year's Events for same month */}
          <div className="border-t bg-muted/20 p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground">
                작년 ({selectedYear - 1}년 {selectedMonth + 1}월) 주요 기록
              </h3>
              <Badge variant="outline" className="text-[10px]">
                총 {lastYearMonthEvents.length}건
              </Badge>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {lastYearMonthEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">작년 이달 기록된 일정이 없습니다.</p>
              ) : (
                lastYearMonthEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="w-48 sm:w-56 shrink-0 bg-card p-2.5 rounded-xl border shadow-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate flex items-center gap-1">
                        {evt.isImportant && <span className="text-red-500 text-[10px]">★</span>}
                        {evt.title}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {(() => {
                          const sDay = evt.date.split("-")[2];
                          const eDay = (evt.endDate || evt.date).split("-")[2];
                          return sDay === eDay ? `${sDay}일` : `${sDay}~${eDay}일`;
                        })()}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{evt.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
