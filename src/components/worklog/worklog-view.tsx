"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useWorkLogs } from "@/hooks/use-work-logs";
import { compressImage } from "@/hooks/use-memos";
import { MemoRichEditor } from "@/components/memos/memo-rich-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Save,
  Share2,
  Trash2,
  Sparkles,
  Search,
  FileText,
  UploadCloud,
  Check,
} from "lucide-react";

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function WorkLogView() {
  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  // Month navigation for the embedded Calendar widget above search bar
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1); // 1~12

  // Year options for direct selection (2020 ~ currentYear + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const start = 2020;
    const end = Math.max(currentYear + 5, 2030);
    const list: number[] = [];
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Collapsible toggle for embedded calendar (default true = collapsed)
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true);

  // Drag & Drop Photo Upload State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const { logs, getLogByDate, saveLog, deleteLog } = useWorkLogs();

  // Unified Form Fields for the current selected date
  const [todayWork, setTodayWork] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // 🌟 Auto-Save State & Timer Ref
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "typing" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const isInitialLoad = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set of dates that have saved work logs
  const logDatesSet = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const clean = l.todayWork.replace(/<[^>]+>/g, " ").trim();
      if (clean.length > 0 || l.imageUrl) {
        set.add(l.date);
      }
    });
    return set;
  }, [logs]);

  // Prior-year same-date detection (1yr ago, 2yrs ago)
  const prevYear1Date = useMemo(() => {
    const [y, m, d] = selectedDate.split("-");
    return `${Number(y) - 1}-${m}-${d}`;
  }, [selectedDate]);

  const prevYear2Date = useMemo(() => {
    const [y, m, d] = selectedDate.split("-");
    return `${Number(y) - 2}-${m}-${d}`;
  }, [selectedDate]);

  const hasPrevYear1 = useMemo(() => logDatesSet.has(prevYear1Date), [logDatesSet, prevYear1Date]);
  const hasPrevYear2 = useMemo(() => logDatesSet.has(prevYear2Date), [logDatesSet, prevYear2Date]);

  // Sync form fields when selectedDate changes or logs update
  useEffect(() => {
    isInitialLoad.current = true;
    const existing = getLogByDate(selectedDate);
    if (existing) {
      let combined = existing.todayWork || "";
      if (existing.issues && !combined.includes(existing.issues)) {
        combined += `<p><strong>🚨 현장 특이사항 및 이슈:</strong></p><p>${existing.issues}</p>`;
      }
      if (existing.pendingWork && !combined.includes(existing.pendingWork)) {
        combined += `<p><strong>⌛ 미결 및 내일 추진 업무:</strong></p><p>${existing.pendingWork}</p>`;
      }
      setTodayWork(combined);
      setImageUrl(existing.imageUrl || "");
    } else {
      setTodayWork("");
      setImageUrl("");
    }

    setAutoSaveStatus("idle");

    // Sync calendar view month to selectedDate
    const [y, m] = selectedDate.split("-").map(Number);
    if (y && m) {
      setCalendarYear(y);
      setCalendarMonth(m);
    }
  }, [selectedDate, logs]);

  // ✍️ 텍스트 감지 실시간 자동 저장 (1.5초 디바운스)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    setAutoSaveStatus("typing");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await saveLog({
        date: selectedDate,
        todayWork,
        pendingWork: "",
        issues: "",
        imageUrl,
      });
      const timeStr = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedTime(timeStr);
      setAutoSaveStatus("saved");
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [todayWork, imageUrl, selectedDate]);

  const handleDateChange = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateString(current));
  };

  const handleSave = async () => {
    await saveLog({
      date: selectedDate,
      todayWork,
      pendingWork: "",
      issues: "",
      imageUrl,
    });
    setSaveStatus("✅ 일일 업무일지가 정상 저장되었습니다!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDelete = async () => {
    if (confirm(`${selectedDate} 업무일지를 삭제하시겠습니까?`)) {
      await deleteLog(selectedDate);
      setTodayWork("");
      setImageUrl("");
    }
  };

  // Photo Upload Handler via Input File
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processPhotoFile(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processPhotoFile(file);
    }
  };

  const processPhotoFile = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleShareKakao = () => {
    const cleanToday = todayWork.replace(/<[^>]+>/g, " ").trim();
    const reportText = `📖 [일일 업무일지] ${selectedDate}\n\n📝 업무 내역:\n${cleanToday || "내용 없음"}`;

    if (navigator.share) {
      navigator.share({ title: `업무일지 ${selectedDate}`, text: reportText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(reportText);
      alert("오늘 업무일지 내용이 클립보드에 복사되었습니다. 카카오톡이나 문자에 붙여넣어 보고하세요!");
    }
  };

  // Filter logs for Search Input
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return logs.filter((l) => {
      const cleanContent = (l.todayWork + " " + l.issues + " " + l.pendingWork).replace(/<[^>]+>/g, " ").toLowerCase();
      return l.date.includes(q) || cleanContent.includes(q);
    });
  }, [logs, searchQuery]);

  // Calendar Grid Calculator for calendarYear & calendarMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
    const lastDay = new Date(calendarYear, calendarMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{ day: number; dateStr: string } | null> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calendarMonth).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({ day: d, dateStr: `${calendarYear}-${mStr}-${dStr}` });
    }

    return days;
  }, [calendarYear, calendarMonth]);

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarYear((prev) => prev - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarYear((prev) => prev + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const dateObj = new Date(selectedDate);
  const formattedDayOfWeek = dateObj.toLocaleDateString("ko-KR", {
    weekday: "short",
  });

  const formattedDateKo = new Date(selectedDate).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12 print:p-0 print:space-y-4">
      {/* 📖 Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>일일 업무일지</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
          </div>
        </div>
      </div>

      {/* 📅 Monthly Calendar Widget (Red Checkmark for Saved Log Dates) */}
      <Card className="border rounded-2xl bg-card/60 backdrop-blur shadow-sm p-4 print:hidden space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            
            {/* Year Dropdown */}
            <select
              value={calendarYear}
              onChange={(e) => setCalendarYear(Number(e.target.value))}
              className="h-8 px-2 py-0.5 rounded-lg border text-xs font-extrabold bg-background text-foreground cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-xs"
              title="연도 선택"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>

            {/* Month Dropdown */}
            <select
              value={calendarMonth}
              onChange={(e) => setCalendarMonth(Number(e.target.value))}
              className="h-8 px-2 py-0.5 rounded-lg border text-xs font-extrabold bg-background text-foreground cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-xs"
              title="월 선택"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>

            {/* Prev / Next 1-Month Step Arrow Buttons */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="이전 달로 이동"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="다음 달로 이동"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Today Jump Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const now = new Date();
                setCalendarYear(now.getFullYear());
                setCalendarMonth(now.getMonth() + 1);
                setSelectedDate(todayStr);
              }}
              className="h-8 px-2.5 text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
              title="오늘 날짜 및 달력으로 바로 이동"
            >
              오늘
            </Button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="h-8 text-xs font-bold gap-1 shrink-0"
            >
              <span>{isCalendarCollapsed ? "캘린더 펼치기 🔽" : "캘린더 접기 🔼"}</span>
            </Button>
          </div>
        </div>

        {/* 7-column Calendar Grid (Collapsible) */}
        {!isCalendarCollapsed && (
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs pt-1">
            {["일", "월", "화", "수", "목", "금", "토"].map((dayName, idx) => (
              <div key={dayName} className={`py-1 font-bold text-[11px] ${idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                {dayName}
              </div>
            ))}

            {calendarDays.map((item, idx) => {
              if (!item) return <div key={`empty-${idx}`} className="h-11" />;

              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;
              const hasLog = logDatesSet.has(item.dateStr);

              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black shadow-lg ring-2 ring-indigo-400 scale-105"
                      : isToday
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40"
                      : "hover:bg-muted/60 text-foreground/80"
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{item.day}</span>
                  {hasLog && (
                    <span className="mt-0.5 text-red-500 dark:text-red-400 font-extrabold flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* 🔍 Search Input Bar */}
      <div className="space-y-3 print:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="업무일지 날짜 또는 텍스트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card/60 text-xs sm:text-sm rounded-xl border shadow-sm"
          />
        </div>

        {/* Search Results Dropdown Panel */}
        {searchQuery.trim() && (
          <Card className="border p-4 rounded-2xl bg-card shadow-lg space-y-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center justify-between border-b pb-2">
              <span>🔍 업무일지 검색 결과 ({filteredLogs.length}건)</span>
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-6 text-[11px]">
                닫기
              </Button>
            </div>
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">검색 결과가 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredLogs.map((log) => {
                  const cleanText = log.todayWork.replace(/<[^>]+>/g, " ").trim();
                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        setSelectedDate(log.date);
                        setSearchQuery("");
                      }}
                      className="p-3 rounded-xl border bg-muted/20 hover:bg-indigo-500/10 hover:border-indigo-500/30 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-bold">
                          {log.date}
                        </Badge>
                        <p className="text-xs text-foreground/80 line-clamp-1 font-medium mt-1">
                          {cleanText || "(상세 내용 없음)"}
                        </p>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-bold shrink-0">이동 ➔</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Save Notification Alert */}
      {saveStatus && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-in fade-in duration-200">
          {saveStatus}
        </div>
      )}

      {/* 📖 Integrated Work Log & Photo Container */}
      <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
        {/* Unified Card Header with integrated Date Navigation & Actions */}
        <CardHeader className="p-3.5 sm:p-4 border-b bg-muted/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
          {/* Left: Prev day, Date input picker, Next day */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(-1)}
              className="h-9 px-2.5 text-xs gap-1 font-semibold bg-background"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>어제 일지</span>
            </Button>

            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (err) {}
              }}
              className="h-9 text-xs sm:text-sm font-bold w-32 text-center bg-background cursor-pointer hover:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:hidden shadow-xs"
              title="클릭하여 원하는 날짜를 직접 선택"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(1)}
              className="h-9 px-2.5 text-xs gap-1 font-semibold bg-background"
            >
              <span>내일 일지</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Date badge, Prior Year Badges, Today Jump, Delete, Save */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            {/* 🌟 Auto-Save Status Badge Indicator */}
            {autoSaveStatus === "typing" && (
              <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[11px] font-extrabold px-2.5 py-0.5 animate-pulse">
                ✍️ 텍스트 감지 중... (1.5초 후 자동 저장)
              </Badge>
            )}
            {autoSaveStatus === "saving" && (
              <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/30 text-[11px] font-extrabold px-2.5 py-0.5 animate-pulse">
                💾 자동 저장 중...
              </Badge>
            )}
            {autoSaveStatus === "saved" && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[11px] font-extrabold px-2.5 py-0.5">
                ✅ {lastSavedTime}에 자동 저장 완료
              </Badge>
            )}

            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs px-3 py-1 font-bold">
              {formattedDateKo}
            </Badge>

            {/* Prior-year same-date badges */}
            {hasPrevYear2 && (
              <button
                type="button"
                onClick={() => setSelectedDate(prevYear2Date)}
                title={`${prevYear2Date} 업무일지 보기`}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                📅 2년 전 기록
              </button>
            )}
            {hasPrevYear1 && (
              <button
                type="button"
                onClick={() => setSelectedDate(prevYear1Date)}
                title={`${prevYear1Date} 업무일지 보기`}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
              >
                📅 1년 전 기록
              </button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(todayStr)}
              className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              오늘로 이동
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 일지 삭제
            </Button>

            {/* 일지 저장 Button */}
            <Button
              onClick={handleSave}
              className="h-9 px-4 text-xs font-extrabold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>일지 저장</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <MemoRichEditor
            value={todayWork}
            onChange={setTodayWork}
            placeholder="오늘의 업무일지를 자유롭게 작성하세요..."
          />

          {/* Integrated Photo Preview & Drag and Drop Zone inside Main Card */}
          <div className="pt-2">
            {imageUrl ? (
              <div className="relative group bg-black/90 rounded-2xl overflow-hidden p-2 text-center border">
                <img src={imageUrl} alt="첨부 사진" className="max-h-[420px] w-auto mx-auto object-contain rounded-lg" />
                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="destructive" size="sm" onClick={() => setImageUrl("")} className="h-7 text-xs gap-1">
                    <Trash2 className="w-3 h-3" /> 사진 삭제
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="drag-integrated-photo-input"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer space-y-1.5 ${
                  isDraggingOver
                    ? "border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/20 scale-[1.01]"
                    : "bg-muted/10 hover:bg-muted/30 border-muted-foreground/20"
                }`}
              >
                <UploadCloud className={`w-7 h-7 transition-colors ${isDraggingOver ? "text-indigo-600 animate-bounce" : "text-muted-foreground/50"}`} />
                <span className="text-xs font-bold text-muted-foreground">
                  {isDraggingOver ? "여기에 사진을 놓으세요!" : "클릭하거나 현장 사진을 여기에 끌어다 놓으세요 (Drag & Drop)"}
                </span>
              </label>
            )}
            <input id="drag-integrated-photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
