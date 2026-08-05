"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useCalendarEvents } from "@/hooks/use-calendar";
import { CalendarEvent } from "@/types";
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
  Plus, 
  Sparkles,
  GitFork,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calendar as CalendarIcon,
  Maximize2
} from "lucide-react";

export function MindmapView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);

  // Canvas Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Event Edit/Add Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState<string>("");
  const [formData, setFormData] = useState({ title: "", description: "", isImportant: false });

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Filter events for selected year
  const yearEvents = useMemo(() => {
    return events.filter((e) => {
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
  }, [events, selectedYear, importantOnly, searchQuery]);

  // Center coordinate of our virtual canvas
  const canvasWidth = 1400;
  const canvasHeight = 1100;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Calculate 360-degree radial positions for 12 months & their events
  const monthRadius = 260; // Distance from center to month node
  const eventRadiusStep = 130; // Distance from month to event nodes

  const radialData = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIdx) => {
      const monthNumber = monthIdx + 1;
      // 1월 is at top (-90 deg), spreading clockwise every 30 deg
      const angleDeg = monthIdx * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;

      const monthX = centerX + monthRadius * Math.cos(angleRad);
      const monthY = centerY + monthRadius * Math.sin(angleRad);

      const monthPrefix = `${selectedYear}-${String(monthNumber).padStart(2, "0")}`;
      const monthEvents = yearEvents
        .filter((e) => e.date.startsWith(monthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate positions for each event in this month branch
      const eventCount = monthEvents.length;
      const fanSpreadDeg = Math.min(45, Math.max(18, eventCount * 8)); // fan arc angle

      const eventNodes = monthEvents.map((evt, idx) => {
        let eventAngleDeg = angleDeg;
        if (eventCount > 1) {
          const step = fanSpreadDeg / (eventCount - 1);
          eventAngleDeg = angleDeg - fanSpreadDeg / 2 + idx * step;
        }
        const eventAngleRad = (eventAngleDeg * Math.PI) / 180;
        const dist = monthRadius + eventRadiusStep + (idx % 2 === 0 ? 0 : 35); // stagger alternating

        const eventX = centerX + dist * Math.cos(eventAngleRad);
        const eventY = centerY + dist * Math.sin(eventAngleRad);

        return {
          event: evt,
          x: eventX,
          y: eventY,
          angleDeg: eventAngleDeg,
        };
      });

      return {
        monthIdx,
        monthNumber,
        x: monthX,
        y: monthY,
        angleDeg,
        events: eventNodes,
        totalEventsCount: monthEvents.length,
        importantCount: monthEvents.filter((e) => e.isImportant).length,
      };
    });
  }, [selectedYear, yearEvents, centerX, centerY]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "BUTTON" || (e.target as HTMLElement).closest(".node-interactive")) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.5), 2.2));
  };

  const resetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Open Add Dialog for a specific month
  const handleOpenAddForMonth = (monthNumber: number) => {
    const mStr = String(monthNumber).padStart(2, "0");
    setTargetDateStr(`${selectedYear}-${mStr}-01`);
    setSelectedEvent(null);
    setFormData({ title: "", description: "", isImportant: false });
    setIsModalOpen(true);
  };

  // Open Edit Dialog for an event
  const handleOpenEditEvent = (evt: CalendarEvent) => {
    setTargetDateStr(evt.date);
    setSelectedEvent(evt);
    setFormData({
      title: evt.title,
      description: evt.description || "",
      isImportant: !!evt.isImportant,
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
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-1rem)] overflow-hidden bg-[#090d16] text-slate-100 select-none">
      {/* Top Header & Control Toolbar */}
      <div className="z-10 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GitFork className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-2 text-white">
              <span>{selectedYear}년 옵시디안 방사형 마인드맵</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs text-slate-400">
              중앙 연도 노드에서 12개월 가지와 모든 일정 노드가 360도로 연결됩니다. (드래그 & 줌 지원)
            </p>
          </div>
        </div>

        {/* Filters & Year Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select
              className="h-8 bg-transparent text-sm font-bold text-white px-2 focus:outline-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}년
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative w-36 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="일정 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Important Only Toggle */}
          <Button
            variant={importantOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => setImportantOnly(!importantOnly)}
            className={`h-8 text-xs gap-1 border-slate-700 ${
              importantOnly ? "bg-red-600 text-white" : "bg-slate-800/80 text-slate-300 hover:text-white"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${importantOnly ? "fill-current" : ""}`} />
            중요만
          </Button>

          {/* Canvas Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.min(z * 1.15, 2.2))}
              className="h-8 w-8 text-slate-300 hover:text-white"
              title="확대"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((z) => Math.max(z * 0.85, 0.5))}
              className="h-8 w-8 text-slate-300 hover:text-white"
              title="축소"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTransform}
              className="h-8 w-8 text-slate-300 hover:text-white"
              title="초기화"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* OBSIDIAN GRAPH RADIAL CANVAS CONTAINER */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            left: `calc(50% - ${canvasWidth / 2}px)`,
            top: `calc(50% - ${canvasHeight / 2}px)`,
          }}
        >
          {/* SVG EDGES / CONNECTOR LINES LAYER */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="centerToMonthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="importantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f87171" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {radialData.map((m) => {
              // Curved path from Center to Month Node
              const dx = m.x - centerX;
              const dy = m.y - centerY;
              const ctrlX = centerX + dx * 0.5;
              const ctrlY = centerY + dy * 0.5;

              return (
                <g key={`month-branch-${m.monthIdx}`}>
                  {/* Line from Center -> Month */}
                  <path
                    d={`M ${centerX} ${centerY} Q ${ctrlX} ${ctrlY} ${m.x} ${m.y}`}
                    stroke="url(#centerToMonthGrad)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={m.totalEventsCount === 0 ? "4,4" : "none"}
                    className="opacity-70 group-hover:opacity-100 transition-all duration-300"
                  />

                  {/* Lines from Month -> Event Sub-Nodes */}
                  {m.events.map((evtNode) => {
                    const isHovered = hoveredNodeId === evtNode.event.id;
                    const isImp = evtNode.event.isImportant;
                    const eCtrlX = m.x + (evtNode.x - m.x) * 0.5;
                    const eCtrlY = m.y + (evtNode.y - m.y) * 0.5;

                    return (
                      <path
                        key={`edge-${evtNode.event.id}`}
                        d={`M ${m.x} ${m.y} Q ${eCtrlX} ${eCtrlY} ${evtNode.x} ${evtNode.y}`}
                        stroke={isImp ? "url(#importantGrad)" : isHovered ? "#38bdf8" : "#475569"}
                        strokeWidth={isHovered ? "2.5" : isImp ? "2" : "1.2"}
                        strokeOpacity={isHovered ? "1" : isImp ? "0.9" : "0.5"}
                        fill="none"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* CENTER ROOT NODE: [YEAR] */}
          <div
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${centerX}px`, top: `${centerY}px` }}
          >
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
              <div className="relative bg-slate-900 border-2 border-indigo-400/80 px-8 py-5 rounded-full shadow-2xl flex flex-col items-center justify-center text-center ring-4 ring-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xl sm:text-2xl tracking-wider">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{selectedYear}년</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">업무 마인드맵</span>
                <Badge variant="secondary" className="mt-1 bg-indigo-950 text-indigo-200 border border-indigo-800 text-[10px]">
                  총 {yearEvents.length}개 일정
                </Badge>
              </div>
            </div>
          </div>

          {/* 12 MONTH NODES (RADIAL 360 DEGREES) */}
          {radialData.map((m) => {
            const hasEvents = m.totalEventsCount > 0;
            return (
              <div
                key={`month-node-${m.monthIdx}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 node-interactive"
                style={{ left: `${m.x}px`, top: `${m.y}px` }}
              >
                <div className="relative group">
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl border-2 backdrop-blur-md shadow-xl flex items-center gap-2 transition-all duration-300 ${
                      m.importantCount > 0
                        ? "bg-slate-900/90 border-red-500/80 text-white ring-2 ring-red-500/30"
                        : hasEvents
                        ? "bg-slate-900/90 border-sky-400/80 text-white ring-2 ring-sky-500/20"
                        : "bg-slate-900/60 border-slate-700 text-slate-400"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-inner ${
                        m.importantCount > 0
                          ? "bg-red-500 text-white"
                          : hasEvents
                          ? "bg-sky-500 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {m.monthNumber}
                    </div>
                    <span className="font-bold text-sm tracking-wide">{m.monthNumber}월</span>

                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        m.importantCount > 0
                          ? "border-red-400 text-red-300"
                          : "border-slate-600 text-slate-300"
                      }`}
                    >
                      {m.totalEventsCount}건
                    </Badge>

                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddForMonth(m.monthNumber);
                      }}
                      className="ml-1 w-6 h-6 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                      title={`${m.monthNumber}월에 일정 추가`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* EVENT SUB-NODES (BRANCHED FROM MONTHS) */}
          {radialData.map((m) =>
            m.events.map((evtNode) => {
              const isImp = evtNode.event.isImportant;
              const dayStr = evtNode.event.date.split("-")[2];

              return (
                <div
                  key={`event-node-${evtNode.event.id}`}
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 node-interactive"
                  style={{ left: `${evtNode.x}px`, top: `${evtNode.y}px` }}
                  onMouseEnter={() => setHoveredNodeId(evtNode.event.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditEvent(evtNode.event);
                  }}
                >
                  <div
                    className={`group max-w-[160px] sm:max-w-[190px] p-2.5 rounded-xl border backdrop-blur-md shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isImp
                        ? "bg-slate-900/95 border-red-500 text-red-100 ring-2 ring-red-500/40 shadow-red-500/10"
                        : "bg-slate-900/90 border-slate-700 hover:border-sky-400 text-slate-100 shadow-sky-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          isImp ? "bg-red-500 text-white" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {dayStr}일
                      </span>
                      {isImp && <Star className="w-3 h-3 text-red-400 fill-current shrink-0" />}
                      <span className="font-semibold text-xs truncate flex-1">{evtNode.event.title}</span>
                    </div>

                    {evtNode.event.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                        {evtNode.event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EVENT ADD / EDIT DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <span>{selectedEvent ? "마인드맵 일정 수정" : "새 마인드맵 일정 추가"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="event-date" className="text-slate-300">
                날짜
              </Label>
              <Input
                id="event-date"
                type="date"
                required
                value={targetDateStr}
                onChange={(e) => setTargetDateStr(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-title" className="text-slate-300">
                일정 제목
              </Label>
              <Input
                id="event-title"
                required
                placeholder="일정 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc" className="text-slate-300">
                상세 내용 (선택)
              </Label>
              <Textarea
                id="event-desc"
                rows={3}
                placeholder="세부 메모나 특이사항을 작성하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="mindmap-isImportant"
                className="w-4 h-4 rounded border-slate-600 text-red-600 focus:ring-red-500 bg-slate-800"
                checked={formData.isImportant}
                onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
              />
              <Label
                htmlFor="mindmap-isImportant"
                className="cursor-pointer font-medium text-xs sm:text-sm text-red-400 flex items-center gap-1"
              >
                ★ 중요한 일정으로 강조하기
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
                {selectedEvent ? "수정 저장" : "일정 추가"}
              </Button>
              {selectedEvent && (
                <Button type="button" variant="destructive" onClick={handleDeleteEvent}>
                  삭제
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
