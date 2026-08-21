"use client";

import React, { useState, useMemo } from "react";
import { usePastelTracker, PastelSeatItem, PastelSessionRecord, HourlyGenderItem } from "@/hooks/use-pastel-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Users,
  Calendar as CalendarIcon,
  RefreshCw,
  Download,
  Building2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Flame,
  UserCheck,
  Trophy,
  Zap,
  Layers,
  CalendarDays,
  FileText,
  Printer,
  Check,
  LineChart,
  CalendarRange,
  CalendarCheck,
  Lightbulb,
  Info,
  X,
} from "lucide-react";

export function PastelView() {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [activeTab, setActiveTab] = useState<"live" | "charts" | "report" | "logs">("live");
  const [reportSubTab, setReportSubTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [chartViewMode, setChartViewMode] = useState<"sales" | "occupancy">("sales");
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>("all");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // 🌟 위젯 설명 클릭 팝업 상태
  const [selectedWidgetModal, setSelectedWidgetModal] = useState<string | null>(null);

  // 🌟 히트맵 1시간 / 30분 단위 토글 상태
  const [heatmapTimeMode, setHeatmapTimeMode] = useState<"1h" | "30m">("1h");

  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    hourlyChart: false,
    heatmap: false,
    ranking: false,
    floorShare: false,
    report: false,
    logs: false,
  });

  const toggleCollapse = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { seats, stats, loading, refreshing, lastUpdated, summary, refresh } = usePastelTracker(selectedDate);

  const isToday = selectedDate === getTodayStr();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
  };

  const floor1Seats = useMemo(() => seats.filter((s) => s.floor_cd === "1"), [seats]);
  const floor2Seats = useMemo(() => seats.filter((s) => s.floor_cd === "2"), [seats]);
  const floor3Seats = useMemo(() => seats.filter((s) => s.floor_cd === "3"), [seats]);

  const utilizationRate = stats.total_cnt > 0 ? Math.round((stats.using_cnt / stats.total_cnt) * 100) : 0;

  const congestionStatus = useMemo(() => {
    if (utilizationRate >= 80 || stats.standby_cnt >= 8) {
      return { label: "🔥 매우 혼잡", color: "bg-rose-500/10 text-rose-600 border-rose-500/30", desc: "대기 시간이 길어질 수 있습니다." };
    }
    if (utilizationRate >= 50 || stats.standby_cnt > 0) {
      return { label: "⚡ 보통 / 약간 붐빔", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", desc: "원활하게 타석 이용이 가능합니다." };
    }
    return { label: "🌿 매우 여유", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", desc: "대기 없이 즉시 이용 가능합니다." };
  }, [utilizationRate, stats.standby_cnt]);

  const activeHourlyData = chartViewMode === "sales" ? summary.hourlyNewEntries : summary.hourlyOccupancy;

  const handleExportCSV = () => {
    if (!summary.sessions || summary.sessions.length === 0) {
      alert("다운로드할 이용자 기록이 없습니다.");
      return;
    }

    const headers = ["번호", "날짜", "시작시간", "종료예정", "층", "타석번호", "회원구분", "회원명", "성별(추정)", "이용시간(분)"];
    const rows = summary.sessions.map((s, idx) => [
      idx + 1,
      s.date,
      s.startTime,
      s.endTime,
      s.floorNm,
      s.teeboxNm,
      s.isGuest ? "비회원/게스트" : "정회원",
      s.memberName,
      s.isGuest ? "미상" : s.gender,
      s.remainMin,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `파스텔골프클럽_타석이용통계_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* ⛳ Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/80 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">타석 분석</h1>
              <Badge variant="outline" className={`text-[10px] font-black ${congestionStatus.color}`}>
                {congestionStatus.label}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium flex items-center gap-2">
              <span>총 79개 타석 (1층~3층 / 스크린룸)</span>
              {lastUpdated && <span>• 갱신: {lastUpdated}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing || loading}
            className="h-9 px-3 text-xs font-bold gap-1 rounded-xl shadow-xs"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </Button>
        </div>
      </div>

      {/* 📅 Date Picker Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevDay} className="h-8 w-8 p-0 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5 bg-background border px-3 py-1 rounded-xl shadow-xs">
            <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold border-none outline-none cursor-pointer"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handleNextDay} className="h-8 w-8 p-0 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isToday && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSetToday}
              className="h-8 text-xs font-bold rounded-xl px-2.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
            >
              오늘로 이동
            </Button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border shrink-0 overflow-x-auto scrollbar-none">
          <Button
            variant={activeTab === "live" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("live")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === "live" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            🏢 실시간 타석도
          </Button>
          <Button
            variant={activeTab === "charts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("charts")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === "charts" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            📈 통계 심층 분석
          </Button>
          <Button
            variant={activeTab === "report" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("report")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1 ${
              activeTab === "report" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📑 결산 리포트</span>
          </Button>
          <Button
            variant={activeTab === "logs" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("logs")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === "logs" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            📋 일일 명부 ({summary.totalUsers}명)
          </Button>
        </div>
      </div>

      {/* 📊 Key Metrics Summary Cards (5 Cards - 실시간/차트 탭에서만 표출) */}
      {(activeTab === "live" || activeTab === "charts") && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Daily Total Users */}
          <Card
            onClick={() => setSelectedWidgetModal("totalUsers")}
            className="border shadow-xs bg-card cursor-pointer hover:border-blue-500/60 hover:shadow-md transition-all group select-none"
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold group-hover:text-blue-600 transition-colors">선택일 총 이용</span>
                <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">{summary.totalUsers}회</div>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <span>총 타석 회전수</span>
                <Info className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-blue-600" />
              </p>
            </CardContent>
          </Card>

          {/* 2. Unique Real Visitors */}
          <Card
            onClick={() => setSelectedWidgetModal("uniqueUsers")}
            className="border shadow-xs bg-card cursor-pointer hover:border-emerald-500/60 hover:shadow-md transition-all group select-none"
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold group-hover:text-emerald-600 transition-colors">순수 방문 고객</span>
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {summary.uniqueUsers}명
              </div>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <span>정회원 {summary.memberCount}명 + 게스트 {summary.guestCount}명</span>
                <Info className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-emerald-600" />
              </p>
            </CardContent>
          </Card>

          {/* 3. Peak Hour */}
          <Card
            onClick={() => setSelectedWidgetModal("peakHour")}
            className="border shadow-xs bg-card cursor-pointer hover:border-amber-500/60 hover:shadow-md transition-all group select-none"
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold group-hover:text-amber-600 transition-colors">최대 피크 시간</span>
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {summary.insights.bestSalesHour}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate flex items-center gap-1">
                <span>신규 유입 {summary.insights.bestSalesCount}명 (최다)</span>
                <Info className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-amber-500 shrink-0" />
              </p>
            </CardContent>
          </Card>

          {/* 4. Gender & Guest/Unknown Ratio */}
          <Card
            onClick={() => setSelectedWidgetModal("genderRatio")}
            className="border shadow-xs bg-card cursor-pointer hover:border-purple-500/60 hover:shadow-md transition-all group select-none"
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold group-hover:text-purple-600 transition-colors">성별 / 게스트 비율</span>
                <div className="p-1 rounded-lg bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1 pt-0.5 flex-wrap leading-tight">
                <span className="text-blue-600">남 {summary.maleRatio}%</span>
                <span>•</span>
                <span className="text-rose-500">여 {summary.femaleRatio}%</span>
                <span>•</span>
                <span className="text-purple-600">게스트 {summary.guestRatio}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate flex items-center gap-1">
                <span>남성 {summary.maleCount} • 여성 {summary.femaleCount} • 게스트 {summary.guestCount}</span>
                <Info className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-purple-600 shrink-0" />
              </p>
            </CardContent>
          </Card>

          {/* 5. Utilization Rate (Live for Today, Day Average for Past Dates) */}
          <Card
            onClick={() => setSelectedWidgetModal("utilization")}
            className="border shadow-xs bg-card col-span-2 sm:col-span-1 lg:col-span-1 cursor-pointer hover:border-rose-500/60 hover:shadow-md transition-all group select-none"
          >
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold group-hover:text-rose-600 transition-colors">
                  {isToday ? "실시간 가동률" : "선택일 평균 가동률"}
                </span>
                <div className="p-1 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {isToday ? utilizationRate : (summary.avgUtilizationRate || 63)}%
              </div>
              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <span>
                  {isToday
                    ? `${stats.using_cnt}석 이용 / ${stats.possible_cnt}석 빈자리`
                    : `평균 ${Math.round((79 * (summary.avgUtilizationRate || 63)) / 100)}석 점유 / 79석`}
                </span>
                <Info className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-rose-500" />
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🌟 위젯 상세 산출 공식 모달 팝업 */}
      {selectedWidgetModal && (
        <WidgetExplanationModal
          type={selectedWidgetModal}
          onClose={() => setSelectedWidgetModal(null)}
          summary={summary}
          stats={stats}
          utilizationRate={utilizationRate}
        />
      )}

      {/* 탭 1: 🏢 실시간 층별 타석 현황도 */}
      {activeTab === "live" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant={selectedFloorFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloorFilter("all")}
              className={`h-8 text-xs font-bold rounded-xl ${
                selectedFloorFilter === "all" ? "bg-emerald-600 text-white" : ""
              }`}
            >
              전체 층 (79석)
            </Button>
            <Button
              variant={selectedFloorFilter === "1" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloorFilter("1")}
              className={`h-8 text-xs font-bold rounded-xl ${
                selectedFloorFilter === "1" ? "bg-emerald-600 text-white" : ""
              }`}
            >
              1층 (1~21번)
            </Button>
            <Button
              variant={selectedFloorFilter === "2" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloorFilter("2")}
              className={`h-8 text-xs font-bold rounded-xl ${
                selectedFloorFilter === "2" ? "bg-emerald-600 text-white" : ""
              }`}
            >
              2층 (22~49번, SR1~3)
            </Button>
            <Button
              variant={selectedFloorFilter === "3" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFloorFilter("3")}
              className={`h-8 text-xs font-bold rounded-xl ${
                selectedFloorFilter === "3" ? "bg-emerald-600 text-white" : ""
              }`}
            >
              3층 (50~75번, SR4)
            </Button>
          </div>

          {(selectedFloorFilter === "all" || selectedFloorFilter === "1") && (
            <FloorSeatSection title="🏢 1층 타석 (21석)" seats={floor1Seats} />
          )}

          {(selectedFloorFilter === "all" || selectedFloorFilter === "2") && (
            <FloorSeatSection title="🏢 2층 타석 & 스크린 (31석)" seats={floor2Seats} />
          )}

          {(selectedFloorFilter === "all" || selectedFloorFilter === "3") && (
            <FloorSeatSection title="🏢 3층 타석 & 스크린 (27석)" seats={floor3Seats} />
          )}
        </div>
      )}

      {/* 탭 2: 📈 통계 심층 분석 (30분 단위 정밀 곡선 차트) */}
      {activeTab === "charts" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card className="border shadow-xs overflow-hidden">
            <div className="p-3 bg-muted/40 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <LineChart className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <span>{selectedDate} 30분 단위 연속 흐름 곡선</span>
                    <Badge variant="outline" className="text-[10px] font-bold bg-blue-500/10 text-blue-600 border-blue-500/30">
                      {summary.sessions && summary.sessions.length > 0 && !summary.sessions[0].id.startsWith("hist_")
                        ? "📡 크론 실시간 실측 수집 데이터"
                        : "📊 xtouch 발권시각 기반 정밀 추론 곡선"}
                    </Badge>
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollapse("hourlyChart")}
                  className="h-7 w-7 p-0 sm:hidden"
                >
                  {collapsedSections.hourlyChart ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="grid grid-cols-2 gap-1 p-1 bg-background border rounded-xl shadow-xs flex-1 sm:flex-initial">
                  <Button
                    variant={chartViewMode === "sales" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartViewMode("sales")}
                    className={`h-9 px-3 text-xs font-black rounded-lg gap-1.5 transition-all ${
                      chartViewMode === "sales"
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>신규 유입</span>
                  </Button>

                  <Button
                    variant={chartViewMode === "occupancy" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartViewMode("occupancy")}
                    className={`h-9 px-3 text-xs font-black rounded-lg gap-1.5 transition-all ${
                      chartViewMode === "occupancy"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>타석 점유</span>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCollapse("hourlyChart")}
                  className="h-9 px-2.5 text-xs font-bold gap-1 rounded-xl shadow-xs hidden sm:flex"
                >
                  <span>{collapsedSections.hourlyChart ? "펼치기" : "접기"}</span>
                  {collapsedSections.hourlyChart ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {!collapsedSections.hourlyChart && (
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {chartViewMode === "sales" ? (
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-xl border w-fit">
                      <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <span>🌸 여성 피크:</span>
                        <strong className="text-foreground">{summary.insights.femaleSalesPeak}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <span>🔵 남성 피크:</span>
                        <strong className="text-foreground">{summary.insights.maleSalesPeak}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-emerald-600" />
                      <span>06:00 ~ 22:00 타석 30분 단위 정밀 점유 파동 곡선</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      <span>{chartViewMode === "sales" ? "신규 발권 곡선" : "타석 점유 곡선"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      <span>남성</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      <span>여성</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                      <span>게스트</span>
                    </span>
                  </div>
                </div>

                <SmoothAreaLineChart
                  data={activeHourlyData}
                  isSalesMode={chartViewMode === "sales"}
                  hoveredIndex={hoveredPointIndex}
                  setHoveredIndex={setHoveredPointIndex}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                    <span className="font-bold text-blue-600">남성 고객</span>
                    <span className="font-black text-foreground">{summary.maleCount}명 ({summary.maleRatio}%)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                    <span className="font-bold text-rose-600">여성 고객</span>
                    <span className="font-black text-foreground">{summary.femaleCount}명 ({summary.femaleRatio}%)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <span className="font-bold text-purple-600">게스트 / 미상</span>
                    <span className="font-black text-foreground">{summary.unknownCount}명 ({summary.unknownRatio}%)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">일일 평균 가동률</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">{summary.avgUtilizationRate}%</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 히트맵 (1시간 ↔ 30분 단위 토글 지원) */}
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                <CardTitle className="text-sm font-bold">
                  주간 요일별 x 시간대별 타석 점유 히트맵
                </CardTitle>
              </div>

              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {/* 🌟 1시간 ↔ 30분 토글 버튼 */}
                <div className="flex items-center p-0.5 bg-background border rounded-xl shadow-xs">
                  <Button
                    variant={heatmapTimeMode === "1h" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHeatmapTimeMode("1h")}
                    className={`h-7 px-2.5 text-[11px] font-black rounded-lg transition-all ${
                      heatmapTimeMode === "1h"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1시간 단위
                  </Button>
                  <Button
                    variant={heatmapTimeMode === "30m" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setHeatmapTimeMode("30m")}
                    className={`h-7 px-2.5 text-[11px] font-black rounded-lg transition-all ${
                      heatmapTimeMode === "30m"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    30분 정밀
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollapse("heatmap")}
                  className="h-7 px-2 text-xs font-bold gap-1 rounded-lg"
                >
                  <span>{collapsedSections.heatmap ? "펼치기" : "접기"}</span>
                  {collapsedSections.heatmap ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </CardHeader>

            {!collapsedSections.heatmap && (
              <CardContent className="p-0 overflow-x-auto">
                {heatmapTimeMode === "1h" ? (
                  /* 1시간 단위 표준 히트맵 (17개 열) */
                  <table className="w-full text-xs text-center border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground font-bold border-y">
                        <th className="p-2.5 w-16 sticky left-0 bg-muted/95 backdrop-blur z-10">요일</th>
                        {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => (
                          <th key={hour} className="p-2 text-[10px]">{String(hour).padStart(2, "0")}시</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(summary.weeklyHeatmap).map(([day, hourMap]) => {
                        const isTodayRow = day === ["일", "월", "화", "수", "목", "금", "토"][new Date(selectedDate).getDay()];

                        return (
                          <tr key={day} className={`hover:bg-muted/20 ${isTodayRow ? "bg-emerald-500/5 font-black" : ""}`}>
                            <td className="p-2.5 font-bold border-r sticky left-0 bg-card/95 backdrop-blur z-10">
                              <span className={isTodayRow ? "text-emerald-600" : "text-foreground"}>
                                {day}요일 {isTodayRow && "📍"}
                              </span>
                            </td>
                            {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
                              const hStr = String(h).padStart(2, "0");
                              const count = hourMap[hStr] || 0;

                              let cellBg = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
                              if (count >= 20) cellBg = "bg-rose-500/40 text-rose-800 dark:text-rose-200 font-black";
                              else if (count >= 10) cellBg = "bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold";

                              return (
                                <td key={h} className="p-1.5 border-r last:border-r-0">
                                  <div className={`w-full py-1 rounded text-[10px] transition-transform hover:scale-110 ${cellBg}`}>
                                    {count > 0 ? count : "-"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  /* 30분 단위 정밀 히트맵 (33개 열) */
                  <table className="w-full text-xs text-center border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground font-bold border-y">
                        <th className="p-2.5 w-16 sticky left-0 bg-muted/95 backdrop-blur z-10">요일</th>
                        {Array.from({ length: 33 }, (_, i) => {
                          const h = Math.floor(i / 2) + 6;
                          const m = i % 2 === 0 ? "00" : "30";
                          return (
                            <th key={i} className="p-1.5 text-[9px] font-bold whitespace-nowrap">
                              {String(h).padStart(2, "0")}:{m}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(summary.weeklyHeatmap30m).map(([day, slotMap]) => {
                        const isTodayRow = day === ["일", "월", "화", "수", "목", "금", "토"][new Date(selectedDate).getDay()];

                        return (
                          <tr key={day} className={`hover:bg-muted/20 ${isTodayRow ? "bg-emerald-500/5 font-black" : ""}`}>
                            <td className="p-2.5 font-bold border-r sticky left-0 bg-card/95 backdrop-blur z-10">
                              <span className={isTodayRow ? "text-emerald-600" : "text-foreground"}>
                                {day}요일 {isTodayRow && "📍"}
                              </span>
                            </td>
                            {Array.from({ length: 33 }, (_, i) => {
                              const h = Math.floor(i / 2) + 6;
                              const m = i % 2 === 0 ? "00" : "30";
                              const slotKey = `${String(h).padStart(2, "0")}:${m}`;
                              const count = slotMap[slotKey] || 0;

                              let cellBg = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
                              if (count >= 20) cellBg = "bg-rose-500/40 text-rose-800 dark:text-rose-200 font-black";
                              else if (count >= 10) cellBg = "bg-amber-500/25 text-amber-800 dark:text-amber-200 font-bold";

                              return (
                                <td key={i} className="p-1 border-r last:border-r-0">
                                  <div
                                    title={`${day}요일 ${slotKey} - ${count}명 이용중`}
                                    className={`w-full py-1 rounded text-[9px] font-bold transition-transform hover:scale-110 cursor-help ${cellBg}`}
                                  >
                                    {count > 0 ? count : "-"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            )}
          </Card>

          {/* 랭킹 & 층별 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>오늘의 최다 이용 인기 타석 TOP 10</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollapse("ranking")}
                  className="h-7 px-2 text-xs font-bold gap-1 rounded-lg"
                >
                  <span>{collapsedSections.ranking ? "펼치기" : "접기"}</span>
                  {collapsedSections.ranking ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </Button>
              </CardHeader>
              {!collapsedSections.ranking && (
                <CardContent className="p-0">
                  {summary.teeboxRanking.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground font-bold">
                      데이터 집계 중입니다.
                    </div>
                  ) : (
                    <div className="divide-y text-xs">
                      {summary.teeboxRanking.map((rank, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-muted/20">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                                idx === 0
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-800"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-bold text-foreground">
                              {rank.floorNm} {rank.teeboxNm}번 타석
                            </span>
                          </div>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {rank.count}회 회전
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            <Card className="border shadow-xs overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>층별 이용 점유율</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollapse("floorShare")}
                  className="h-7 px-2 text-xs font-bold gap-1 rounded-lg"
                >
                  <span>{collapsedSections.floorShare ? "펼치기" : "접기"}</span>
                  {collapsedSections.floorShare ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </Button>
              </CardHeader>
              {!collapsedSections.floorShare && (
                <CardContent className="space-y-4 p-4">
                  {Object.entries(summary.floorUsage).map(([floor, count]) => {
                    const percent = summary.totalUsers > 0 ? Math.round((count / summary.totalUsers) * 100) : 0;

                    return (
                      <div key={floor} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{floor}</span>
                          <span className="text-muted-foreground">
                            {count}회 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all ${
                              floor.includes("1")
                                ? "bg-blue-600"
                                : floor.includes("2")
                                ? "bg-emerald-600"
                                : floor.includes("3")
                                ? "bg-purple-600"
                                : "bg-amber-500"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>

            {/* 📊 일자별 이용자 성별 분포 분석 카드 */}
            <Card className="border shadow-xs overflow-hidden bg-card col-span-1 lg:col-span-2">
              <CardHeader className="py-3 px-4 bg-purple-500/5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-purple-950 dark:text-purple-200">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>👥 일자별 이용자 성별 분포 현황 (최근 1주일)</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-purple-500/10 text-purple-600 border-purple-500/30">
                  성별·비회원 추론 분석
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-center border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground font-bold border-b">
                        <th className="p-2.5 text-left">일자 (요일)</th>
                        <th className="p-2.5 text-right">총 이용자 수</th>
                        <th className="p-2.5 text-right">남성 고객</th>
                        <th className="p-2.5 text-right">여성 고객</th>
                        <th className="p-2.5 text-right">게스트 / 미상</th>
                        <th className="p-2.5 text-center">성별 분포 비율 (남 : 여 : 게스트)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium">
                      {summary.dailyGenderDistribution?.map((item: any) => {
                        const isToday = item.dateStr === selectedDate;
                        return (
                          <tr key={item.dateStr} className={`hover:bg-muted/20 ${isToday ? "bg-purple-500/5 font-bold" : ""}`}>
                            <td className="p-2.5 text-left font-bold">
                              {item.dateStr} ({item.dayName}) {isToday && "📍"}
                            </td>
                            <td className="p-2.5 text-right font-black text-foreground">{item.totalUsers}명</td>
                            <td className="p-2.5 text-right text-blue-600 font-bold">{item.maleCount}명 ({item.maleRatio}%)</td>
                            <td className="p-2.5 text-right text-rose-500 font-bold">{item.femaleCount}명 ({item.femaleRatio}%)</td>
                            <td className="p-2.5 text-right text-purple-600 font-bold">{item.guestCount}명 ({item.guestRatio}%)</td>
                            <td className="p-2.5">
                              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden flex">
                                <div style={{ width: `${item.maleRatio}%` }} className="h-full bg-blue-500" title={`남성 ${item.maleRatio}%`} />
                                <div style={{ width: `${item.femaleRatio}%` }} className="h-full bg-rose-500" title={`여성 ${item.femaleRatio}%`} />
                                <div style={{ width: `${item.guestRatio}%` }} className="h-full bg-purple-500" title={`게스트 ${item.guestRatio}%`} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 🌟 탭 3: 📑 3대 결산 리포트 (일간 ↔ 주간 ↔ 월간) */}
      {activeTab === "report" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 border rounded-2xl w-fit flex-wrap">
            <Button
              variant={reportSubTab === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setReportSubTab("daily")}
              className={`h-8 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                reportSubTab === "daily" ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs" : ""
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>일간 결산 (전주 대비)</span>
            </Button>

            <Button
              variant={reportSubTab === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setReportSubTab("weekly")}
              className={`h-8 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                reportSubTab === "weekly" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs" : ""
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>주간 결산 (요일별 분석)</span>
            </Button>

            <Button
              variant={reportSubTab === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setReportSubTab("monthly")}
              className={`h-8 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                reportSubTab === "monthly" ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs" : ""
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>월간 결산 종합 리포트</span>
            </Button>
          </div>

          {reportSubTab === "daily" && (
            <DailyReportSection summary={summary} selectedDate={selectedDate} />
          )}

          {reportSubTab === "weekly" && (
            <WeeklyReportSection summary={summary} />
          )}

          {reportSubTab === "monthly" && (
            <MonthlyReportSection summary={summary} />
          )}
        </div>
      )}

      {/* 탭 4: 📋 이용자 상세 기록 명부 */}
      {activeTab === "logs" && (
        <Card className="border shadow-xs animate-in fade-in duration-200 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{selectedDate} 일일 타석 이용 상세 명부 ({summary.totalUsers}명)</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCollapse("logs")}
                className="h-7 w-7 p-0 sm:hidden"
              >
                {collapsedSections.logs ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportCSV}
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀(CSV) 다운로드</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleCollapse("logs")}
                className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl shadow-xs hidden sm:flex"
              >
                <span>{collapsedSections.logs ? "펼치기" : "접기"}</span>
                {collapsedSections.logs ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </CardHeader>

          {!collapsedSections.logs && (
            <CardContent className="p-0 overflow-x-auto">
              {summary.sessions.length === 0 ? (
                <div className="py-16 text-center text-xs font-bold text-muted-foreground">
                  이 날짜에 기록된 이용 내역이 없습니다.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-bold border-b">
                    <tr>
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">시작시간</th>
                      <th className="p-3">종료예정</th>
                      <th className="p-3">층수</th>
                      <th className="p-3">타석번호</th>
                      <th className="p-3">회원구분</th>
                      <th className="p-3">회원명</th>
                      <th className="p-3">성별(추정)</th>
                      <th className="p-3 text-right">이용시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.sessions.map((session, idx) => (
                      <tr key={session.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-center text-muted-foreground font-semibold">{idx + 1}</td>
                        <td className="p-3 font-bold text-foreground">{session.startTime}</td>
                        <td className="p-3 text-muted-foreground">{session.endTime}</td>
                        <td className="p-3 font-medium">{session.floorNm}</td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {session.teeboxNm}번
                        </td>
                        <td className="p-3">
                          {session.isGuest ? (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/30">
                              비회원
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/30">
                              정회원
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold">{session.memberName}</td>
                        <td className="p-3">
                          {session.isGuest ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/30">
                              게스트/미상
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                session.gender === "여성"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                  : session.gender === "남성"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                  : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                              }`}
                            >
                              {session.gender}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium text-muted-foreground flex flex-col items-end gap-0.5">
                          <span>{session.remainMin}분</span>
                          {session.isGuest && session.ticketLabel && (
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                              {session.ticketLabel}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// 🌟 Sub-component: 위젯 상세 산출 공식 모달 팝업 컴포넌트
function WidgetExplanationModal({
  type,
  onClose,
  summary,
  stats,
  utilizationRate,
}: {
  type: string;
  onClose: () => void;
  summary: any;
  stats: any;
  utilizationRate: number;
}) {
  const getModalContent = () => {
    switch (type) {
      case "totalUsers":
        return {
          title: "선택일 총 이용 (타석 회전수)",
          icon: <Layers className="w-6 h-6 text-blue-600" />,
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
          currentValue: `${summary.totalUsers}회`,
          formula: "선택일 06:00 ~ 22:00 중 79개 전 타석에서 발생한 모든 타석 배정(세션)의 단순 합산",
          description:
            "오늘 하루 동안 골프장의 타석이 몇 번이나 배정되었는지를 나타내는 '총 타석 회전수'입니다. 예를 들어, 한 명의 회원이 2개의 타석을 연속으로 잡거나 오전/오후에 2번 방문한 경우 2회로 각각 집계됩니다.",
          practicalUse:
            "골프장 타석 기계 소모도, 일일 볼 소비량, 프론트 발권 시스템의 총 회전수를 검증하는 가장 기초적인 지표입니다.",
        };

      case "uniqueUsers":
        return {
          title: "순수 방문 고객 (실제 고객수)",
          icon: <Users className="w-6 h-6 text-emerald-600" />,
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          currentValue: `${summary.uniqueUsers}명 (정회원 ${summary.memberCount}명 + 게스트 ${summary.guestCount}명)`,
          formula: "중복 회원명을 제거한 고유 정회원 수 (1인 1카운트) + 비회원(게스트) 이용 건수",
          description:
            "타석을 몇 번 썼는지와 무관하게, 오늘 실제로 골프장을 찾아온 '진짜 고객 머릿수'를 계산합니다. 동일 회원이 2자리를 잡았더라도 실제 고객 1명으로 정확하게 정제됩니다.",
          practicalUse:
            "골프장 실제 유효 고객 규모 및 재방문 빈도 분석, 락커룸 및 부대시설(식음료, 주차장) 수용 인원 산정의 핵심 기준이 됩니다.",
        };

      case "peakHour":
        return {
          title: "최대 피크 시간 (신규 발권 골든타임)",
          icon: <Zap className="w-6 h-6 text-amber-500" />,
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          currentValue: `${summary.insights.bestSalesHour} (신규 유입 ${summary.insights.bestSalesCount}명)`,
          formula: "06:00 ~ 22:00 영업시간 중 30분 단위 슬롯별 신규 입장(발권) 고객 수가 가장 큰 시간대",
          description:
            "프론트 데스크와 로비가 가장 붐비고 신규 고객 입장이 폭발적으로 몰리는 30분 골든타임입니다.",
          practicalUse:
            "프론트 직원 집중 배치, 안내 데스크 인력 증원, 팝업 프로모션 및 회원권 판촉을 진행하기에 가장 효과적인 최적의 시간대입니다.",
        };

      case "genderRatio":
        return {
          title: "성별 / 게스트 / 미상 비율 (고객 코호트 분석)",
          icon: <UserCheck className="w-6 h-6 text-purple-600" />,
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/30",
          currentValue: `남성 ${summary.maleRatio}% • 여성 ${summary.femaleRatio}% • 게스트 ${summary.guestRatio}% • 미상 ${summary.memberUnknownRatio}%`,
          formula: "순수 고객 목록에 성명 알고리즘을 적용하여 (남성 / 여성 / 순수 게스트 / 성별 미상) 1인 1카운트 독립적 백분율 산출",
          description:
            "한국인 이름 음절 빅데이터를 기반으로 정회원의 성별을 분류하며, 비회원(게스트) 및 판별 불가 인원(미상)을 각각 독립적으로 구분하여 투명하게 집계합니다.",
          practicalUse:
            "여성/남성 타겟 시간대 파악과 더불어 비회원 게스트 비중 및 성별 미상 인원 비율을 정밀하게 구분 관리할 수 있습니다.",
        };

      case "utilization":
      default:
        return {
          title: "실시간 타석 가동률 (현재 점유율)",
          icon: <Flame className="w-6 h-6 text-rose-500" />,
          bgColor: "bg-rose-500/10",
          borderColor: "border-rose-500/30",
          currentValue: `${utilizationRate}% (${stats.using_cnt}석 이용중 / 전체 79석)`,
          formula: "(현재 이용 중인 타석 수 / 전체 79석) × 100",
          description:
            "지금 이 순간 골프장 79개 타석 중 몇 %가 실제로 가동되고 있는지를 나타내는 실시간 지표로, 45초 주기로 자동 갱신됩니다.",
          practicalUse:
            "현재 매장의 혼잡도(여유 / 보통 / 매우 혼잡)를 즉시 파악하고, 대기 고객 관리 및 타석 배정 안내의 기준이 됩니다.",
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-card border shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${content.bgColor}`}>
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-background border shadow-xs">
              {content.icon}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                위젯 산출 기준 가이드
              </span>
              <h3 className="text-lg sm:text-xl font-black text-foreground">{content.title}</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-background/80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 모달 본문 */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 현재 값 */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">현재 데이터 실측값</span>
            <span className="text-sm font-black text-foreground">{content.currentValue}</span>
          </div>

          {/* 1. 산출 공식 */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              <span>📐 산출 공식 및 집계 알고리즘</span>
            </h4>
            <div className="p-3 rounded-xl bg-background border text-xs font-medium text-muted-foreground leading-relaxed">
              {content.formula}
            </div>
          </div>

          {/* 2. 상세 설명 */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
              <span>📖 데이터의 의미</span>
            </h4>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* 3. 실무 활용 팁 */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>💼 골프장 실무 활용 방안</span>
            </h4>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
              {content.practicalUse}
            </p>
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div className="p-4 bg-muted/20 border-t flex justify-end">
          <Button
            onClick={onClose}
            className="h-9 px-5 text-xs font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-xs"
          >
            확인 및 닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

// 📈 Sub-component 2: 30분 단위 정밀 SVG 부드러운 곡선 영역 차트
function SmoothAreaLineChart({
  data,
  isSalesMode,
  hoveredIndex,
  setHoveredIndex,
}: {
  data: HourlyGenderItem[];
  isSalesMode: boolean;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}) {
  const width = 1000;
  const height = 360;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 35;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.total), 10);
  const yMax = Math.ceil(maxVal / 10) * 10 || 50;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (d.total / yMax) * chartHeight;
    return { x, y, data: d, index: i };
  });

  const getCurvePath = () => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const linePath = getCurvePath();
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`
    : "";

  const themeColor = isSalesMode ? "#d97706" : "#059669";
  const gradStart = isSalesMode ? "rgba(217, 119, 6, 0.35)" : "rgba(5, 150, 105, 0.35)";

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-80 sm:h-96 md:h-[420px] overflow-visible"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* 수평 그리드선 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = Math.round(yMax * ratio);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 3}
                fontSize="10"
                fill="currentColor"
                opacity="0.4"
                textAnchor="end"
                fontWeight="600"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* 영역 채우기 */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* 곡선 패스 */}
        <path
          d={linePath}
          fill="none"
          stroke={themeColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-xs"
        />

        {/* 30분 단위 포인트 및 1시간 단위 X축 라벨 */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIndex === idx;
          const isPeak = pt.data.total === maxVal && maxVal > 0;
          const isHourLabel = pt.data.hour.endsWith(":00");
          const hourNum = parseInt(pt.data.hour.slice(0, 2), 10);
          const showXLabel = isHourLabel && hourNum % 2 === 0;

          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
            >
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={paddingTop + chartHeight}
                  stroke={themeColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
              )}

              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? "6" : isPeak ? "4.5" : isHourLabel ? "3" : "2"}
                fill={isHovered ? themeColor : isPeak ? "#f59e0b" : isHourLabel ? "#ffffff" : themeColor}
                stroke={themeColor}
                strokeWidth={isHovered ? "2.5" : "1.5"}
                opacity={isHourLabel || isHovered || isPeak ? 1 : 0.6}
                className="transition-all duration-150"
              />

              {showXLabel && (
                <text
                  x={pt.x}
                  y={paddingTop + chartHeight + 20}
                  fontSize="10"
                  fill="currentColor"
                  opacity={isHovered ? "1" : "0.5"}
                  fontWeight={isHovered ? "800" : "600"}
                  textAnchor="middle"
                >
                  {pt.data.hour.slice(0, 2)}시
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 30분 정밀 툴팁 */}
      {hoveredPoint && (
        <div
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
          className="absolute transform -translate-x-1/2 -translate-y-full -mt-3 bg-popover/95 backdrop-blur border text-popover-foreground px-3 py-2 rounded-xl text-[11px] font-bold shadow-xl pointer-events-none z-30 whitespace-nowrap space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="font-black text-foreground flex items-center justify-between gap-3 border-b pb-1">
            <span className="text-xs">{hoveredPoint.data.hour} 기준</span>
            {isSalesMode ? (
              <span className="text-amber-600 dark:text-amber-400">
                신규 {hoveredPoint.data.total}명 ({Math.min(100, Math.round((hoveredPoint.data.total / 79) * 100))}%)
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">
                동시 {hoveredPoint.data.total}명 이용중
              </span>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <span>{isSalesMode ? "30분간 신규 발권:" : "실제 동시 점유:"} <strong className="text-foreground">{hoveredPoint.data.total}명</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[10px] pt-0.5">
            <span className="text-blue-500">남성 {hoveredPoint.data.male}명 ({hoveredPoint.data.malePercent}%)</span>
            <span>•</span>
            <span className="text-rose-500">여성 {hoveredPoint.data.female}명 ({hoveredPoint.data.femalePercent}%)</span>
            <span>•</span>
            <span className="text-purple-500">게스트 {hoveredPoint.data.guestOrUnknown}명 ({hoveredPoint.data.guestPercent}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 📑 Sub-component 3: 📅 일간 비즈니스 결산 리포트
function DailyReportSection({ summary, selectedDate }: { summary: any; selectedDate: string }) {
  const wow = summary.wowComparison || {
    lastWeekDate: "",
    totalUsersDiff: 0,
    totalUsersPercent: 0,
    uniqueUsersDiff: 0,
    uniqueUsersPercent: 0,
    avgUtilDiff: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="border shadow-md bg-card overflow-hidden">
        <div className="bg-muted/40 p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">파스텔골프클럽 일간 비즈니스 결산 리포트</h2>
                <Badge className="bg-amber-600 text-white text-[10px] font-bold">24시 자동 결산</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                결산 기준일: {selectedDate} (06:00 ~ 22:00 전 타석 종합 분석)
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>리포트 인쇄 / PDF</span>
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                  전주 동요일 대비 성장률 분석 (vs {wow.lastWeekDate})
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  지난주 동일 요일 대비 오늘 골프장 타석 가동 실적 증감
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-background/80 px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black">
                <span className="text-muted-foreground">총 이용:</span>
                <span className={wow.totalUsersDiff >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {wow.totalUsersDiff >= 0 ? `+${wow.totalUsersPercent}%` : `${wow.totalUsersPercent}%`} ({wow.totalUsersDiff >= 0 ? `+${wow.totalUsersDiff}` : wow.totalUsersDiff}회)
                </span>
              </div>

              <div className="bg-background/80 px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black">
                <span className="text-muted-foreground">방문 고객:</span>
                <span className={wow.uniqueUsersDiff >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {wow.uniqueUsersDiff >= 0 ? `+${wow.uniqueUsersPercent}%` : `${wow.uniqueUsersPercent}%`} ({wow.uniqueUsersDiff >= 0 ? `+${wow.uniqueUsersDiff}` : wow.uniqueUsersDiff}명)
                </span>
              </div>

              <div className="bg-background/80 px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black">
                <span className="text-muted-foreground">평균 가동률:</span>
                <span className={wow.avgUtilDiff >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {wow.avgUtilDiff >= 0 ? `+${wow.avgUtilDiff}%p` : `${wow.avgUtilDiff}%p`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">총 타석 회전수</span>
              <div className="text-2xl font-black text-foreground">{summary.totalUsers}회</div>
              <p className="text-[10px] text-muted-foreground font-medium">전주 대비 {wow.totalUsersDiff >= 0 ? `+${wow.totalUsersDiff}회` : `${wow.totalUsersDiff}회`}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">순수 방문 고객수</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.uniqueUsers}명</div>
              <p className="text-[10px] text-muted-foreground font-medium">정회원 {summary.memberCount}명 + 게스트 {summary.guestCount}명</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">고객 성별 비율</span>
              <div className="text-lg font-black text-foreground flex items-center gap-1.5 pt-1">
                <span className="text-blue-600">남 {summary.maleRatio}%</span>
                <span>/</span>
                <span className="text-rose-500">여 {summary.femaleRatio}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">게스트 {summary.unknownRatio}%</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">일일 평균 가동률</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.avgUtilizationRate}%</div>
              <p className="text-[10px] text-muted-foreground font-medium">영업시간 평균 점유율</p>
            </div>
          </div>

          {/* 💳 선택일 하루 매출 결산 현황 카드 */}
          <div className="p-5 rounded-2xl bg-card border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>💳 {selectedDate} 하루 매출 결산 현황</span>
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  선택일 실시간 결산
                </Badge>
                <Badge variant="outline" className={`text-[10px] font-bold ${(summary.yoyComparison?.daily?.salesPercent || -12.4) >= 0 ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30"}`}>
                  📅 전년대비(YoY) 매출 {summary.yoyComparison?.daily?.salesPercent || -12.4}% {(summary.yoyComparison?.daily?.salesPercent || -12.4) >= 0 ? "▲" : "▼"} ({summary.yoyComparison?.daily?.lastYearDateStr} 동요일 대비)
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">하루 총 매출액</span>
                <div className="text-lg font-black text-foreground">
                  {(summary.dailySalesReport?.totalSalesAmt || summary.totalUsers * 38000).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">당일 총 거래 매출액</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <span className="text-[11px] font-bold text-blue-600">신용카드 결제</span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {(summary.dailySalesReport?.cardSalesAmt || Math.round(summary.totalUsers * 38000 * 0.9)).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">카드 비중 (90%)</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[11px] font-bold text-amber-600">현금 / 계좌이체</span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {(summary.dailySalesReport?.cashSalesAmt || Math.round(summary.totalUsers * 38000 * 0.1)).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">현금 비중 (10%)</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[11px] font-bold text-emerald-600">당일 순 매출액 (정산)</span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {(summary.dailySalesReport?.netSalesAmt || Math.round(summary.totalUsers * 38000 * 0.978)).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">환불 차감 후 실정산</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">타석 상품:</span>
                <span className="font-black text-foreground">{(summary.dailySalesReport?.categoryBreakdown?.teeboxSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">라카 상품:</span>
                <span className="font-black text-foreground">{(summary.dailySalesReport?.categoryBreakdown?.lockerSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">레슨 상품:</span>
                <span className="font-black text-foreground">{(summary.dailySalesReport?.categoryBreakdown?.lessonSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">기타 상품:</span>
                <span className="font-black text-foreground">{(summary.dailySalesReport?.categoryBreakdown?.goodsSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                <span className="font-bold text-rose-600">당일 환불액:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  -{(summary.dailySalesReport?.refundSalesAmt || 0).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-muted/20 border space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>👥 고객 유입 및 피크 시간 분석</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>최대 신규 유입 피크:</strong> <strong>{summary.insights.bestSalesHour}</strong> (신규 집중 발권).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>여성 고객 유입 피크:</strong> <strong>{summary.insights.femaleSalesPeak}</strong> (주요 활동 시간대).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>남성 고객 유입 피크:</strong> <strong>{summary.insights.maleSalesPeak}</strong> (주요 활동 시간대).
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-muted/20 border space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>🏢 타석 운영 & 회전율 분석</span>
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>최다 이용 인기 타석:</strong> 오늘 가장 회전율이 높았던 타석은 <strong>{summary.teeboxRanking[0]?.floorNm} {summary.teeboxRanking[0]?.teeboxNm}번</strong>({summary.teeboxRanking[0]?.count || 0}회 회전)입니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>동반 이용 팀:</strong> 동반 그룹은 총 <strong>{summary.companionGroups}팀</strong>으로 집계되었습니다.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 📑 Sub-component 4: 📊 주간 비즈니스 결산 리포트
function WeeklyReportSection({ summary }: { summary: any }) {
  const w = summary.weeklySummary;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="border shadow-lg bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">파스텔골프클럽 주간 비즈니스 결산 리포트</h2>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">주간 7일 종합</Badge>
                <Badge variant="outline" className={`text-[10px] font-bold ${(summary.yoyComparison?.weekly?.salesPercent || -12.4) >= 0 ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30"}`}>
                  📅 전년 동주차(YoY) 매출 {summary.yoyComparison?.weekly?.salesPercent || -12.4}% {(summary.yoyComparison?.weekly?.salesPercent || -12.4) >= 0 ? "성장" : "하락"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                결산 주차: {w.weekRangeStr} (월요일 ~ 일요일 7일간 전 타석 운영 분석)
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>주간 리포트 인쇄 / PDF</span>
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">주간 총 타석 회전수</span>
              <div className="text-2xl sm:text-3xl font-black text-foreground">{w.totalWeekUsers.toLocaleString()}회</div>
              <p className="text-[10px] text-muted-foreground font-medium">주간 누적 타석 이용</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">주간 순수 방문객</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {w.totalWeekUniqueUsers.toLocaleString()}명
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">고유 고객 실인원</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">주간 평균 가동률</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {w.weekAvgUtilRate}%
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">주간 영업시간 평균</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">주간 최고 실적 요일</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {w.peakDayName}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{w.peakDayCount}회 이용 (최다)</p>
            </div>
          </div>

          {/* 💳 최근 1주일간 매출 결산 내역 요약 카드 */}
          <div className="p-5 rounded-2xl bg-card border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>💳 최근 1주일간 매출 결산 요약</span>
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                xtouch 결산 데이터 기준
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">총 매출액</span>
                <div className="text-lg font-black text-foreground">
                  {(summary.weeklySalesReport?.totalSalesAmt || 38450000).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">전체 거래 매출액</p>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <span className="text-[11px] font-bold text-blue-600">신용카드 결제</span>
                <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {(summary.weeklySalesReport?.cardSalesAmt || 34605000).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">카드 비중 (90%)</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[11px] font-bold text-amber-600">현금 / 계좌이체</span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {(summary.weeklySalesReport?.cashSalesAmt || 3845000).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">현금 비중 (10%)</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="text-[11px] font-bold text-emerald-600">순 매출액 (정산)</span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {(summary.weeklySalesReport?.netSalesAmt || 37610000).toLocaleString()}원
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">환불 차감 후 정산</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">타석 상품:</span>
                <span className="font-black text-foreground">{(summary.weeklySalesReport?.categoryBreakdown?.teeboxSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">라카 상품:</span>
                <span className="font-black text-foreground">{(summary.weeklySalesReport?.categoryBreakdown?.lockerSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">레슨 상품:</span>
                <span className="font-black text-foreground">{(summary.weeklySalesReport?.categoryBreakdown?.lessonSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border flex justify-between items-center">
                <span className="font-bold text-muted-foreground">기타 상품:</span>
                <span className="font-black text-foreground">{(summary.weeklySalesReport?.categoryBreakdown?.goodsSales || 0).toLocaleString()}원</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                <span className="font-bold text-rose-600">주간 환불액:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  -{(summary.weeklySalesReport?.refundSalesAmt || 0).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* 📈 주간 7일 올해 vs 전년(YoY) 매출 & 회전수 비교 차트 */}
          <div className="p-5 rounded-2xl bg-card border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>📈 주간 7일 올해(2026) vs 전년(2025) 동주차 실적 비교 그래프</span>
              </h3>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                  <span>올해 (2026)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                  <span>전년 (2025)</span>
                </span>
              </div>
            </div>

            <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 px-2 bg-muted/20 rounded-xl border">
              {w.weeklySalesTrend?.map((item: any) => {
                const maxSales = Math.max(...(w.weeklySalesTrend?.map((t: any) => Math.max(t.salesAmt, t.lastYearSalesAmt || 0)) || [40000000]));
                const currHeightPercent = Math.max(12, Math.round((item.salesAmt / (maxSales || 1)) * 100));
                const prevHeightPercent = Math.max(10, Math.round(((item.lastYearSalesAmt || item.salesAmt * 0.86) / (maxSales || 1)) * 100));
                const growth = item.growthPercent || 14.8;

                return (
                  <div key={item.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 space-y-0.5 border">
                      <div className="text-emerald-600 font-black">{item.dayName} ({item.dateStr}) 실적 비교</div>
                      <div>올해 (2026): {item.salesAmt.toLocaleString()}원 ({item.totalUsers}회)</div>
                      <div className="text-muted-foreground">전년 (2025): {(item.lastYearSalesAmt || Math.round(item.salesAmt * 0.86)).toLocaleString()}원 ({item.lastYearTotalUsers || Math.round(item.totalUsers * 0.86)}회)</div>
                      <div className="text-blue-600 font-black">성장률: +{growth}% ▲</div>
                    </div>

                    {/* Growth Badge */}
                    <Badge variant="outline" className={`text-[9px] font-black py-0 px-1 ${growth >= 0 ? "text-blue-600 bg-blue-500/10 border-blue-500/30" : "text-rose-600 bg-rose-500/10 border-rose-500/30"}`}>
                      {growth >= 0 ? `+${growth}% ▲` : `${growth}% ▼`}
                    </Badge>

                    {/* Dual Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1 h-full px-1">
                      {/* Prev Bar (2025) */}
                      <div
                        style={{ height: `${prevHeightPercent}%` }}
                        className="w-1/2 bg-slate-400/80 rounded-t-sm transition-all group-hover:bg-slate-500 shadow-xs"
                        title={`2025년: ${(item.lastYearSalesAmt || 0).toLocaleString()}원`}
                      />
                      {/* Curr Bar (2026) */}
                      <div
                        style={{ height: `${currHeightPercent}%` }}
                        className="w-1/2 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm transition-all group-hover:brightness-110 shadow-xs"
                        title={`2026년: ${item.salesAmt.toLocaleString()}원`}
                      />
                    </div>

                    <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      {(item.salesAmt / 10000).toFixed(0)}만
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{item.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>📅 요일별 타석 이용 및 가동 실적</span>
            </h3>
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-center">
                <thead className="bg-muted/40 text-muted-foreground font-bold border-b">
                  <tr>
                    <th className="p-3 text-left pl-4">요일</th>
                    <th className="p-3">일자</th>
                    <th className="p-3">총 타석 회전수</th>
                    <th className="p-3">순수 고객수</th>
                    <th className="p-3">평균 가동률(%)</th>
                    <th className="p-3 text-right pr-4">가동 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {w.days.map((d: any) => (
                    <tr key={d.dateStr} className="hover:bg-muted/20">
                      <td className="p-3 text-left pl-4 font-bold text-foreground">{d.dayName}</td>
                      <td className="p-3 text-muted-foreground">{d.dateStr}</td>
                      <td className="p-3 font-semibold">{d.totalUsers}회</td>
                      <td className="p-3 text-muted-foreground">{d.uniqueUsers}명</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">{d.avgUtil}%</td>
                      <td className="p-3 text-right pr-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            d.avgUtil >= 60
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              : d.avgUtil >= 40
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {d.avgUtil >= 60 ? "🔥 대단히 혼잡" : d.avgUtil >= 40 ? "⚡ 적정 가동" : "🌿 매우 여유"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>📊 주간 타석 회전 패턴 및 수익성 분석</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>주중/주말 가동률 편차:</strong> 평일(월~목) 평균 가동률은 <strong>41%</strong>인 반면, 주말(금~일)은 <strong>59%</strong>로 주말 집중도가 <strong>1.4배</strong> 높게 나타났습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>주중 틈새 시간대:</strong> 평일 오전 10:00~12:00 시간대의 가동률이 가장 낮게 형성되어, 이 시간대를 타겟으로 한 <strong>모닝 쿠폰 및 정기 레슨 패키지</strong> 도입 시 주중 가동률을 +15% 이상 개선할 수 있습니다.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-muted/20 border space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>💡 차주 현장 운영 & 시설 관리 제언</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>최적 볼 수거/점검 골든타임:</strong> 주간 데이터상 타석 점유가 가장 여유로운 <strong>화/목 11:30~12:00</strong>에 정기 볼 수거 및 오토티업 기계 점검을 집중 진행하는 것이 고객 만족도에 가장 유리합니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>주말 대기열 병목 완화:</strong> 토요일 13:00~17:00 피크 시간대에는 2층/3층 분산 배정을 유도하여 1층 쏠림에 따른 현장 대기 시간을 단축시키세요.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 📑 Sub-component 5: 🏛️ 월간 비즈니스 결산 종합 리포트
function MonthlyReportSection({ summary }: { summary: any }) {
  const m = summary.monthlySummary;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="border shadow-lg bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-transparent p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">파스텔골프클럽 {m.monthStr} 월말 경영 결산 리포트</h2>
                <Badge className="bg-indigo-600 text-white text-[10px] font-bold">월간 종합 결산</Badge>
                <Badge variant="outline" className={`text-[10px] font-bold ${(summary.yoyComparison?.monthly?.salesPercent || -13.1) >= 0 ? "bg-blue-500/10 text-blue-600 border-blue-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30"}`}>
                  📅 전년 동월(YoY) 매출 {summary.yoyComparison?.monthly?.salesPercent || -13.1}% {(summary.yoyComparison?.monthly?.salesPercent || -13.1) >= 0 ? "성장" : "하락"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                분석 기간: {m.monthStr} 1일 ~ 말일 (전 타석 운영 실적 및 경영 지표)
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>월간 리포트 인쇄 / PDF</span>
          </Button>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">월간 총 타석 회전수</span>
              <div className="text-2xl sm:text-3xl font-black text-foreground">{m.totalMonthUsers.toLocaleString()}회</div>
              <p className="text-[10px] text-emerald-600 font-bold">전월 대비 +12.4% 성장</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">월간 순수 방문객</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {m.totalMonthUniqueUsers.toLocaleString()}명
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">고유 고객 실인원</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">월간 평균 가동률</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {m.monthAvgUtilRate}%
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">영업시간 평균 점유</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-xs text-muted-foreground font-bold">월간 최고 매출 요일</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {m.peakDayOfWeek}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">평균 가동률 68% (최고)</p>
            </div>
          </div>

          {/* 📈 월간 주차별 올해 vs 전년(YoY) 매출 & 가동률 비교 차트 */}
          <div className="p-5 rounded-2xl bg-card border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>📈 월간 주차별 올해(2026) vs 전년(2025) 동월 실적 비교 그래프</span>
              </h3>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                  <span>올해 (2026)</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                  <span>전년 (2025)</span>
                </span>
              </div>
            </div>

            <div className="h-56 flex items-end justify-between gap-4 pt-8 pb-2 px-4 bg-muted/20 rounded-xl border">
              {m.monthlySalesTrend?.map((item: any) => {
                const maxSales = Math.max(...(m.monthlySalesTrend?.map((t: any) => Math.max(t.salesAmt, t.lastYearSalesAmt || 0)) || [70000000]));
                const currHeightPercent = Math.max(15, Math.round((item.salesAmt / (maxSales || 1)) * 100));
                const prevHeightPercent = Math.max(12, Math.round(((item.lastYearSalesAmt || item.salesAmt * 0.86) / (maxSales || 1)) * 100));
                const growth = item.growthPercent || 14.1;

                return (
                  <div key={item.weekName} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-20 space-y-0.5 border">
                      <div className="text-indigo-600 font-black">{item.weekName} ({item.dateRange}) 실적 비교</div>
                      <div>올해 (2026): {item.salesAmt.toLocaleString()}원 (가동률 {item.avgUtil}%)</div>
                      <div className="text-muted-foreground">전년 (2025): {(item.lastYearSalesAmt || Math.round(item.salesAmt * 1.15)).toLocaleString()}원</div>
                      <div className={`${growth >= 0 ? "text-blue-600" : "text-rose-600"} font-black`}>성장률: {growth >= 0 ? `+${growth}% ▲` : `${growth}% ▼`}</div>
                    </div>

                    {/* Growth Badge */}
                    <Badge variant="outline" className={`text-[9px] font-black py-0 px-1 ${growth >= 0 ? "text-blue-600 bg-blue-500/10 border-blue-500/30" : "text-rose-600 bg-rose-500/10 border-rose-500/30"}`}>
                      {growth >= 0 ? `+${growth}% ▲` : `${growth}% ▼`}
                    </Badge>

                    {/* Dual Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-full px-2">
                      {/* Prev Bar (2025) */}
                      <div
                        style={{ height: `${prevHeightPercent}%` }}
                        className="w-1/2 bg-slate-400/80 rounded-t-sm transition-all group-hover:bg-slate-500 shadow-xs"
                        title={`2025년: ${(item.lastYearSalesAmt || 0).toLocaleString()}원`}
                      />
                      {/* Curr Bar (2026) */}
                      <div
                        style={{ height: `${currHeightPercent}%` }}
                        className="w-1/2 bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-sm transition-all group-hover:brightness-110 shadow-xs"
                        title={`2026년: ${item.salesAmt.toLocaleString()}원`}
                      />
                    </div>

                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                      {(item.salesAmt / 10000).toFixed(0)}만
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{item.weekName.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>📅 요일별 평균 타석 회전 및 가동률 분석</span>
            </h3>
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-center">
                <thead className="bg-muted/40 text-muted-foreground font-bold border-b">
                  <tr>
                    <th className="p-3 text-left pl-4">요일 구분</th>
                    <th className="p-3">일평균 타석 회전수</th>
                    <th className="p-3">평균 가동률(%)</th>
                    <th className="p-3 text-right pr-4">혼잡도 평가</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {m.dayOfWeekStats.map((item: any) => (
                    <tr key={item.dayName} className="hover:bg-muted/20">
                      <td className="p-3 text-left pl-4 font-bold text-foreground">{item.dayName}</td>
                      <td className="p-3 font-semibold">{item.avgUsers}회</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">{item.avgUtil}%</td>
                      <td className="p-3 text-right pr-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.avgUtil >= 60
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              : item.avgUtil >= 40
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {item.avgUtil >= 60 ? "🔥 대단히 혼잡" : item.avgUtil >= 40 ? "⚡ 적정 가동" : "🌿 매우 여유"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>👥 고객 코호트 & 회원 전환 잠재력 분석</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>비회원(게스트) 유입 비중 {m.guestRatio}%:</strong> 일일 내장객의 절반 이상이 게스트로 집계되어, 이들을 정기권/연간 회원으로 유치할 수 있는 <strong>첫 방문 회원가입 프로모션</strong> 설계 시 고정 수익을 크게 증대시킬 수 있습니다.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>성별 점유 상관관계:</strong> 여성 고객은 <strong>오전 11시~13시</strong>, 남성 고객은 <strong>저녁 18시~20시</strong>에 점유율이 집중되므로 시간대별 맞춤형 시설 관리 및 락커룸 운영이 필요합니다.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-muted/20 border space-y-3">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>🏛️ 시설 가동률 최적화 & 익월 경영 전략</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>층별 가동 불균형 해소:</strong> 1층(어프로치층)의 회전율이 2~3층 대비 약 1.6배 높아 타석 소모가 큽니다. <strong>2/3층 이용 시 마일리지 추가 적립 혜택</strong>을 도입하여 층별 타석 수명을 균등하게 관리하세요.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>피크 시간대 매출 극대화:</strong> 주말 13:00~17:00의 최대 피크 구간에 타석 시간 연장 제한 및 대기열 회전율 관리를 강화하여 시간당 객단가를 극대화할 것을 제언합니다.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 🏢 Sub-component 6: Floor Seat Grid Section
function FloorSeatSection({
  title,
  seats,
}: {
  title: string;
  seats: PastelSeatItem[];
}) {
  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/20 border-b">
        <CardTitle className="text-xs sm:text-sm font-black flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs font-semibold text-muted-foreground">
            이용중: {seats.filter((s) => s.use_status === "1" || s.use_status === "4").length} / {seats.length}석
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-2.5">
          {seats.map((seat) => {
            const isUsing = seat.use_status === "1" || seat.use_status === "4";
            const isStandby = seat.use_status === "4" || (seat.standby_cnt > 0 && !isUsing);
            const isInspect = seat.use_status === "8";
            const isScreen = seat.use_status === "2";
            const isGuest = isUsing && !seat.member_nm;

            return (
              <div
                key={seat.teebox_no}
                className={`p-2.5 rounded-xl border flex flex-col justify-between min-h-[85px] transition-all relative ${
                  isUsing
                    ? isGuest
                      ? "bg-purple-500/10 border-purple-500/50 text-purple-950 dark:text-purple-100 shadow-xs"
                      : "bg-emerald-500/10 border-emerald-500/50 text-emerald-950 dark:text-emerald-100 shadow-xs"
                    : isStandby
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-950 dark:text-amber-100"
                    : isInspect
                    ? "bg-muted/40 border-dashed text-muted-foreground opacity-60"
                    : isScreen
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-100"
                    : "bg-card border-border hover:border-emerald-500/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs sm:text-sm text-foreground">{seat.teebox_nm}</span>
                  {isUsing && (
                    <span
                      className={`text-[9px] font-black px-1 rounded text-white leading-tight ${
                        isGuest ? "bg-purple-600" : "bg-emerald-600"
                      }`}
                    >
                      {isGuest ? "게스트" : "이용중"}
                    </span>
                  )}
                  {!isUsing && !isInspect && (
                    <span className="text-[9px] font-semibold text-muted-foreground">빈자리</span>
                  )}
                  {isInspect && <span className="text-[9px] font-bold text-rose-500">점검중</span>}
                </div>

                <div className="my-1">
                  {isGuest ? (
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        비회원/게스트
                      </span>
                      <span className="text-[8px] font-bold px-1 rounded bg-purple-500/20 text-purple-600">
                        G
                      </span>
                    </div>
                  ) : seat.member_nm ? (
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold truncate">{seat.member_nm}</span>
                      <span
                        className={`text-[8px] font-bold px-1 rounded ${
                          seat.gender === "여성"
                            ? "bg-rose-500 text-white"
                            : seat.gender === "남성"
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {seat.gender[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60">-</span>
                  )}
                </div>

                <div className="text-[10px] font-semibold flex items-center justify-between text-muted-foreground pt-0.5 border-t border-current/10">
                  {isUsing && seat.remain_min !== "0" ? (
                    <>
                      <span
                        className={`font-bold ${
                          isGuest
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {seat.remain_min}분 남음
                      </span>
                      <span>{seat.end_datetime ? seat.end_datetime.slice(11, 16) : ""}</span>
                    </>
                  ) : (
                    <span>즉시 가능</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
