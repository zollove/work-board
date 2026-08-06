"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarEvent } from "@/types";
import { WeatherWidget } from "./weather-widget";
import { UtilitiesView } from "@/components/utilities/utilities-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Plus, Trash2, Edit3, Check } from "lucide-react";

export function WorkCalendar() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
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
    setSelectedDate(day);
    setEditEvent(null);
    setFormData({ title: "", description: "", isImportant: false });
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent, day: Date) => {
    e.stopPropagation();
    setSelectedDate(day);
    setEditEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      isImportant: event.isImportant || false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.title.trim()) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (editEvent) {
      updateEvent(editEvent.id, { ...formData, date: dateStr });
    } else {
      addEvent({ ...formData, date: dateStr });
    }

    setEditEvent(null);
    setFormData({ title: "", description: "", isImportant: false });
  };

  const handleDelete = () => {
    if (editEvent) {
      deleteEvent(editEvent.id);
      setEditEvent(null);
      setFormData({ title: "", description: "", isImportant: false });
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
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* 1. 🌤️ 7-Day Weather & Building Hazard Warning Bar */}
      <WeatherWidget />

      {/* 2. 🛠️ 건물 관리 업무 유틸리티 Hub (날씨 위젯 바로 아래 배치!) */}
      <div className="border rounded-2xl p-1 sm:p-2 bg-card shadow-sm">
        <UtilitiesView />
      </div>

      {/* 3. 📅 단일 월 중심 캘린더 타일 & 일정 관리 */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Calendar Control Header Bar */}
        <CardHeader className="p-4 sm:p-6 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <span>{selectedYear}년 {selectedMonth + 1}월 캘린더</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                날짜를 클릭하여 월별 업무 및 주요 일정을 바로 작성하세요.
              </p>
            </div>
          </div>

          {/* Year & Month Dropdown Controls */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-9 px-2.5">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">이전달</span>
            </Button>

            {/* Year Dropdown */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm font-semibold"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>

            {/* Month Dropdown */}
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs sm:text-sm font-semibold"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-9 px-2.5">
              <span className="hidden sm:inline">다음달</span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="secondary" size="sm" onClick={handleGoToday} className="h-9 text-xs font-bold">
              오늘
            </Button>
          </div>
        </CardHeader>

        {/* Main Calendar View Body: 7-Column Grid + Day Detail Sidebar */}
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left/Main: 7-Column Calendar Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r">
              {/* Day Headers (Sun ~ Sat) */}
              <div className="grid grid-cols-7 border-b bg-muted/40 font-bold text-xs text-center py-2.5">
                <span className="text-red-500">일</span>
                <span>월</span>
                <span>화</span>
                <span>수</span>
                <span>목</span>
                <span>금</span>
                <span className="text-blue-500">토</span>
              </div>

              {/* Date Cells Grid */}
              <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)] flex-1 bg-background">
                {emptyDays.map((i) => (
                  <div key={`empty-${i}`} className="border-b border-r bg-muted/5 p-1" />
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayCell = isSameDay(day, today);
                  const dayOfWeek = day.getDay();

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateClick(day)}
                      className={`p-1.5 border-b border-r cursor-pointer transition-all hover:bg-muted/40 flex flex-col ${
                        isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isTodayCell
                              ? "bg-primary text-white"
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
                          <span className="text-[10px] font-extrabold text-muted-foreground px-1 bg-muted rounded">
                            {dayEvents.length}건
                          </span>
                        )}
                      </div>

                      {/* Event Badges */}
                      <div className="flex-1 space-y-1 overflow-y-auto">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event, day)}
                            className={`text-[11px] px-1.5 py-0.5 rounded truncate cursor-pointer flex items-center gap-1 font-medium ${
                              event.isImportant
                                ? "bg-red-500/10 text-red-600 border border-red-300 dark:border-red-900"
                                : "bg-primary/10 text-primary hover:bg-primary/20"
                            }`}
                          >
                            {event.isImportant && <span className="text-red-500 text-[10px]">★</span>}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Date Event Management Panel */}
            <div className="w-full lg:w-80 bg-muted/10 flex flex-col shrink-0 border-t lg:border-t-0 p-4 space-y-4">
              {selectedDate ? (
                <>
                  <div className="p-3 bg-card border rounded-xl font-bold text-sm flex items-center justify-between shadow-sm">
                    <span>{format(selectedDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko })}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {dayEvents.length}개 일정
                    </Badge>
                  </div>

                  {/* Add / Edit Form */}
                  <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                    <h3 className="text-xs font-extrabold text-muted-foreground flex items-center justify-between">
                      <span>{editEvent ? "일정 수정" : "+ 새 일정 추가"}</span>
                    </h3>

                    <div className="space-y-1">
                      <Label htmlFor="evt-title" className="text-xs">제목</Label>
                      <Input
                        id="evt-title"
                        required
                        placeholder="예: 임대료 수납, 소방점검"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="evt-desc" className="text-xs">상세 메모</Label>
                      <Textarea
                        id="evt-desc"
                        rows={3}
                        placeholder="세부 특이사항 작성"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="text-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id="evt-important"
                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.isImportant}
                        onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                      />
                      <Label htmlFor="evt-important" className="text-xs cursor-pointer">
                        중요 일정 (빨간 강조 표시)
                      </Label>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Button type="submit" size="sm" className="flex-1 text-xs h-8">
                        {editEvent ? "수정" : "저장"}
                      </Button>
                      {editEvent && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="h-8 text-xs">
                          삭제
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* Day Events List */}
                  {dayEvents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground">이날의 등록된 일정</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => handleEventClick(e, evt, selectedDate)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              editEvent?.id === evt.id ? "ring-2 ring-primary bg-primary/5" : "bg-card hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs flex items-center gap-1">
                                {evt.isImportant && <span className="text-red-500 text-[10px]">★</span>}
                                {evt.title}
                              </h5>
                              <Edit3 className="w-3 h-3 text-muted-foreground" />
                            </div>
                            {evt.description && (
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  달력에서 날짜를 선택하세요.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Banner: Last Year's Events for same month */}
          <div className="border-t bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground">
                작년 이맘때 ({selectedYear - 1}년 {selectedMonth + 1}월) 주요 기록
              </h3>
              <Badge variant="outline" className="text-[10px]">
                총 {lastYearMonthEvents.length}건
              </Badge>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {lastYearMonthEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">작년 이달 기록된 일정이 없습니다.</p>
              ) : (
                lastYearMonthEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="w-56 shrink-0 bg-card p-3 rounded-xl border shadow-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate flex items-center gap-1">
                        {evt.isImportant && <span className="text-red-500 text-[10px]">★</span>}
                        {evt.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {evt.date.split("-")[2]}일
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
