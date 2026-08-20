"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarEvent } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

export function MonthDetailModal({ 
  isOpen, onClose, year, month, 
  events, addEvent, updateEvent, deleteEvent, onMonthChange 
}: MonthDetailModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [showLastYear, setShowLastYear] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isImportant: false,
  });

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      if (today.getFullYear() === year && today.getMonth() === month) {
        setSelectedDate(today);
      } else {
        setSelectedDate(null);
      }
      setEditEvent(null);
      setFormData({ title: "", description: "", isImportant: false });
    }
  }, [isOpen, year, month]);

  const date = new Date(year, month);
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

  const startDay = startOfMonth(date).getDay();
  const emptyDays = Array.from({ length: startDay }, (_, i) => i);

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setEditEvent(null);
    setFormData({ title: "", description: "", isImportant: false });
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent, day: Date) => {
    e.stopPropagation();
    setSelectedDate(day);
    setShowLastYear(false);
    setEditEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      isImportant: event.isImportant || false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

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

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const dayEvents = selectedDateStr ? events.filter(e => e.date === selectedDateStr) : [];

  const lastYearMonthEvents = events.filter((e) => {
    const [y, m] = e.date.split("-");
    return Number(y) === year - 1 && Number(m) === month + 1;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const handlePrevMonth = () => {
    if (onMonthChange) {
      if (month === 0) onMonthChange(year - 1, 11);
      else onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (onMonthChange) {
      if (month === 11) onMonthChange(year + 1, 0);
      else onMonthChange(year, month + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-full sm:max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-xl sm:text-2xl m-0">
              {year}년 {month + 1}월
            </DialogTitle>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1 border-r flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-muted/50 shrink-0">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)] h-full">
                {emptyDays.map((i) => (
                  <div key={`empty-${i}`} className="p-2 border-b border-r bg-muted/10" />
                ))}
                {daysInMonth.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px] flex flex-col
                        ${isSelected ? "ring-2 ring-primary ring-inset bg-muted/20" : ""}
                      `}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${isToday ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center" : ""}`}>
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1.5 py-1 rounded truncate cursor-pointer flex items-center gap-1
                              ${event.isImportant 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                                : 'bg-primary/10 text-primary hover:bg-primary/20'}
                            `}
                            onClick={(e) => handleEventClick(e, event, day)}
                          >
                            {event.isImportant && <span className="text-[10px]">★</span>}
                            <span className="truncate">{event.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar for Day Details & Form */}
          <div className="w-full md:w-80 border-t md:border-t-0 bg-muted/10 flex flex-col shrink-0 h-64 md:h-auto overflow-y-auto">
            {selectedDate ? (
              <>
                <div className="p-4 border-b font-medium bg-muted/30">
                  {format(selectedDate, "yyyy년 MM월 dd일 (EEEE)", { locale: ko })}
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {/* Event Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 bg-background p-4 rounded-lg border shadow-sm">
                      <h4 className="font-medium text-sm">
                        {editEvent ? "일정 수정" : "새 일정 추가"}
                      </h4>
                      <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input
                          id="title"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">내용</Label>
                        <Textarea
                          id="description"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          id="isImportant"
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={formData.isImportant}
                          onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                        />
                        <Label htmlFor="isImportant" className="cursor-pointer">중요한 일정 (강조 표기)</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          {editEvent ? "수정" : "저장"}
                        </Button>
                        {editEvent && (
                          <Button type="button" variant="destructive" onClick={handleDelete}>
                            삭제
                          </Button>
                        )}
                        {(formData.title || formData.description) && (
                          <Button type="button" variant="outline" onClick={() => {
                            setEditEvent(null);
                            setFormData({ title: "", description: "", isImportant: false });
                          }}>
                            취소
                          </Button>
                        )}
                      </div>
                    </form>

                    {/* Today's Events List */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">등록된 일정</h4>
                        {dayEvents.map(event => (
                          <div 
                            key={event.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors 
                              ${editEvent?.id === event.id ? 'border-primary ring-1 ring-primary' : 'bg-background hover:border-primary/50'}
                              ${event.isImportant ? 'border-red-200 bg-red-50/50' : ''}
                            `}
                            onClick={() => handleEventClick({ stopPropagation: () => {} } as any, event, selectedDate)}
                          >
                            <h5 className={`font-medium text-sm break-words flex items-center gap-1.5 ${event.isImportant ? 'text-red-700' : ''}`}>
                              {event.isImportant && <span className="text-red-500 text-xs">★</span>}
                              {event.title}
                            </h5>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
                달력에서 날짜를 클릭하여<br/>일정을 추가하거나 확인하세요.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Last Year's Events */}
        <div className="h-44 border-t bg-muted/5 flex flex-col shrink-0">
          <div className="px-6 py-2 border-b bg-muted/10 flex items-center justify-between shrink-0">
            <h4 className="font-medium text-sm text-muted-foreground">
              작년 이맘때 ({year - 1}년 {month + 1}월) 주요 일정
            </h4>
            <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-full border">
              총 {lastYearMonthEvents.length}건
            </span>
          </div>
          <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden flex items-start gap-4">
            {lastYearMonthEvents.length === 0 ? (
              <div className="flex-1 h-full flex items-center justify-center text-sm text-muted-foreground">
                작년 이달에는 등록된 일정이 없습니다.
              </div>
            ) : (
              lastYearMonthEvents.map(event => (
                <div key={event.id} className={`w-64 shrink-0 h-full p-3 rounded-lg border shadow-sm flex flex-col ${event.isImportant ? 'bg-red-50/50 border-red-200' : 'bg-background'}`}>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h5 className={`font-medium text-sm flex-1 truncate flex items-center gap-1 ${event.isImportant ? 'text-red-700' : ''}`} title={event.title}>
                      {event.isImportant && <span className="text-red-500 text-xs">★</span>}
                      {event.title}
                    </h5>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                      {event.date.split("-")[2]}일
                    </span>
                  </div>
                  {event.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-3 flex-1 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic flex-1">내용 없음</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
