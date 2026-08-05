"use client";

import { useState } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Star, 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  GitFork,
  CheckCircle2,
  Filter
} from "lucide-react";

export function MindmapView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true,
    6: true, 7: true, 8: true, 9: true, 10: true, 11: true,
  });

  // Event modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState<string>("");
  const [formData, setFormData] = useState({ title: "", description: "", isImportant: false });

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Filter events for the selected year
  const yearEvents = events.filter((e) => {
    const year = Number(e.date.split("-")[0]);
    if (year !== selectedYear) return false;
    if (importantOnly && !e.isImportant) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalImportantCount = yearEvents.filter((e) => e.isImportant).length;

  const toggleMonth = (m: number) => {
    setExpandedMonths((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    for (let i = 0; i < 12; i++) allExpanded[i] = true;
    setExpandedMonths(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<number, boolean> = {};
    for (let i = 0; i < 12; i++) allCollapsed[i] = false;
    setExpandedMonths(allCollapsed);
  };

  const handleOpenAdd = (monthIdx: number) => {
    const monthStr = String(monthIdx + 1).padStart(2, "0");
    const defaultDate = `${selectedYear}-${monthStr}-01`;
    setTargetDateStr(defaultDate);
    setSelectedEvent(null);
    setFormData({ title: "", description: "", isImportant: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: CalendarEvent) => {
    setTargetDateStr(event.date);
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      isImportant: !!event.isImportant,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent) {
      updateEvent(selectedEvent.id, {
        date: targetDateStr,
        title: formData.title,
        description: formData.description,
        isImportant: formData.isImportant,
      });
    } else {
      addEvent({
        date: targetDateStr,
        title: formData.title,
        description: formData.description,
        isImportant: formData.isImportant,
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">연간 일정 마인드맵</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            1월부터 12월까지 한 해 동안의 모든 일정을 계층형 마인드맵으로 시각화합니다.
          </p>
        </div>

        {/* Year Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <select
            className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년 마인드맵
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter and Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="일정 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          <Button
            variant={importantOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => setImportantOnly(!importantOnly)}
            className="h-9 text-xs gap-1.5 shrink-0"
          >
            <Star className={`h-3.5 w-3.5 ${importantOnly ? "fill-current" : ""}`} />
            중요 일정만 보기
          </Button>

          <Button variant="ghost" size="sm" onClick={expandAll} className="h-9 text-xs gap-1">
            <ChevronDown className="h-3.5 w-3.5" />
            모두 펼치기
          </Button>

          <Button variant="ghost" size="sm" onClick={collapseAll} className="h-9 text-xs gap-1">
            <ChevronUp className="h-3.5 w-3.5" />
            모두 접기
          </Button>
        </div>
      </div>

      {/* CENTRAL MINDMAP TREE */}
      <div className="relative space-y-8 py-4">
        {/* Central Root Node Card */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-indigo-500 to-sky-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative bg-card border-2 border-primary/40 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-xl flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-primary font-extrabold text-lg sm:text-2xl">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>{selectedYear}년 업무 로드맵</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="px-2.5 py-0.5">
                  총 {yearEvents.length}개 일정
                </Badge>
                {totalImportantCount > 0 && (
                  <Badge variant="destructive" className="px-2.5 py-0.5 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    중요 {totalImportantCount}개
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Connector Line from Root */}
        <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-border mx-auto" />

        {/* 12 Months Grid Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const monthNumber = monthIdx + 1;
            const monthPrefix = `${selectedYear}-${String(monthNumber).padStart(2, "0")}`;
            const monthEvents = yearEvents
              .filter((e) => e.date.startsWith(monthPrefix))
              .sort((a, b) => a.date.localeCompare(b.date));

            const isExpanded = expandedMonths[monthIdx];
            const hasEvents = monthEvents.length > 0;
            const monthImportantCount = monthEvents.filter((e) => e.isImportant).length;

            return (
              <Card
                key={monthIdx}
                className={`transition-all duration-300 border-2 ${
                  hasEvents
                    ? monthImportantCount > 0
                      ? "border-red-500/30 shadow-red-500/5 bg-gradient-to-b from-red-500/5 to-card"
                      : "border-primary/20 shadow-sm hover:border-primary/40"
                    : "border-border/40 opacity-80"
                }`}
              >
                {/* Month Branch Header */}
                <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {monthNumber}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-1.5">
                        {monthNumber}월 가지
                        {monthImportantCount > 0 && (
                          <span className="text-xs text-red-500 flex items-center gap-0.5">
                            ★ {monthImportantCount}
                          </span>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">일정 {monthEvents.length}건</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      onClick={() => handleOpenAdd(monthIdx)}
                      title="이 달에 일정 추가"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleMonth(monthIdx)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {/* Event Sub-Nodes List */}
                {isExpanded && (
                  <CardContent className="p-3 space-y-2.5">
                    {monthEvents.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground/60 border border-dashed rounded-lg">
                        등록된 일정이 없습니다.
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs block mx-auto mt-1"
                          onClick={() => handleOpenAdd(monthIdx)}
                        >
                          + 일정 추가하기
                        </Button>
                      </div>
                    ) : (
                      monthEvents.map((event) => {
                        const dayStr = event.date.split("-")[2];
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleOpenEdit(event)}
                            className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                              event.isImportant
                                ? "bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-800 hover:border-red-400"
                                : "bg-card hover:border-primary/50 border-border"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Date Node Badge */}
                              <div
                                className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md text-center ${
                                  event.isImportant
                                    ? "bg-red-500 text-white"
                                    : "bg-primary/15 text-primary"
                                }`}
                              >
                                {dayStr}일
                              </div>

                              {/* Title & Description */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {event.isImportant && (
                                    <span className="text-red-500 text-xs shrink-0">★</span>
                                  )}
                                  <h4
                                    className={`font-semibold text-xs sm:text-sm truncate ${
                                      event.isImportant
                                        ? "text-red-700 dark:text-red-300 font-bold"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {event.title}
                                  </h4>
                                </div>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* EVENT ADD / EDIT DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "마인드맵 일정 수정" : "새 마인드맵 일정 추가"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="event-date">날짜</Label>
              <Input
                id="event-date"
                type="date"
                required
                value={targetDateStr}
                onChange={(e) => setTargetDateStr(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-title">일정 제목</Label>
              <Input
                id="event-title"
                required
                placeholder="일정 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">상세 내용 (선택)</Label>
              <Textarea
                id="event-desc"
                rows={3}
                placeholder="세부 메모나 진행 상태를 적어주세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="mindmap-isImportant"
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                checked={formData.isImportant}
                onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
              />
              <Label htmlFor="mindmap-isImportant" className="cursor-pointer font-medium text-xs sm:text-sm text-red-600 flex items-center gap-1">
                ★ 중요한 일정으로 강조하기
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {selectedEvent ? "수정 저장" : "일정 추가"}
              </Button>
              {selectedEvent && (
                <Button type="button" variant="destructive" onClick={handleDeleteEvent}>
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
