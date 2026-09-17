"use client";

import { useState, useEffect, useMemo } from "react";
import { Competitor, CompetitorNewsItem } from "@/types/competitor";
import { useMemos } from "@/hooks/use-memos";
import { useWorkLogs } from "@/hooks/use-work-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  StickyNote,
  BookOpen,
  Calendar,
  Building2,
  Newspaper,
  CheckCircle2,
  Sparkles,
  Trash2,
  Globe,
  Clock,
} from "lucide-react";

const DEFAULT_COMPETITORS: Competitor[] = [
  { id: "comp-1", name: "골프존", keyword: "골프존", category: "스크린골프", createdAt: "2026-01-01" },
  { id: "comp-2", name: "카카오 VX", keyword: "카카오 VX", category: "스크린골프", createdAt: "2026-01-01" },
  { id: "comp-3", name: "SG골프", keyword: "SG골프", category: "스크린골프", createdAt: "2026-01-01" },
  { id: "comp-4", name: "QED", keyword: "QED 타석", category: "타석센서", createdAt: "2026-01-01" },
  { id: "comp-5", name: "프렌즈아카데미", keyword: "프렌즈아카데미", category: "연습장", createdAt: "2026-01-01" },
];

const LOCAL_STORAGE_KEY = "work_board_competitors_v1";

export function CompetitorView() {
  const { addMemo } = useMemos();
  const { saveLog } = useWorkLogs();

  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_COMPETITORS;
      } catch (e) {
        return DEFAULT_COMPETITORS;
      }
    }
    return DEFAULT_COMPETITORS;
  });

  const [activeCompetitor, setActiveCompetitor] = useState<string>(DEFAULT_COMPETITORS[0].name);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [newsItems, setNewsItems] = useState<CompetitorNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrapSuccessMessage, setScrapSuccessMessage] = useState<string | null>(null);

  // LocalStorage Save
  const saveCompetitors = (newList: Competitor[]) => {
    setCompetitors(newList);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
      } catch (e) {}
    }
  };

  // Fetch News for Active Competitor
  const fetchNews = async (keyword: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitors/news?query=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setNewsItems(data.items);
      } else {
        setNewsItems([]);
      }
    } catch (e) {
      console.error(e);
      setNewsItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCompetitor) {
      fetchNews(activeCompetitor);
    }
  }, [activeCompetitor]);

  // Add Custom Competitor
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitorName.trim()) return;
    const trimmed = newCompetitorName.trim();
    if (competitors.some((c) => c.name === trimmed)) {
      setActiveCompetitor(trimmed);
      setNewCompetitorName("");
      return;
    }
    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: trimmed,
      keyword: trimmed,
      category: "경쟁사",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const updated = [...competitors, newComp];
    saveCompetitors(updated);
    setActiveCompetitor(trimmed);
    setNewCompetitorName("");
  };

  // Delete Custom Competitor
  const handleDeleteCompetitor = (id: string, name: string) => {
    const updated = competitors.filter((c) => c.id !== id);
    saveCompetitors(updated);
    if (activeCompetitor === name && updated.length > 0) {
      setActiveCompetitor(updated[0].name);
    }
  };

  // Filtered News Items
  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return newsItems;
    const q = searchQuery.toLowerCase();
    return newsItems.filter(
      (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.origin.toLowerCase().includes(q)
    );
  }, [newsItems, searchQuery]);

  // Group News by Publication Date (YYYY-MM-DD)
  const groupedNews = useMemo(() => {
    const map: Record<string, CompetitorNewsItem[]> = {};
    filteredNews.forEach((item) => {
      const dateKey = item.pubDate || "기타";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    });
    // Sort dates in descending order
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        items: map[date],
      }));
  }, [filteredNews]);

  // Scrap to Memo Handler
  const handleScrapToMemo = async (item: CompetitorNewsItem) => {
    await addMemo({
      title: `[경쟁사 동향] ${item.competitorName} - ${item.title}`,
      category: "업무",
      content: `📌 경쟁사 동향 모니터링 수집\n\n- 경쟁사: ${item.competitorName}\n- 언론사: ${item.origin}\n- 게재일자: ${item.pubDate}\n- 기사 제목: ${item.title}\n- 기사 요약: ${item.description}\n- 원본 기사 링크: ${item.link}`,
    });
    setScrapSuccessMessage(`'${item.title.slice(0, 18)}...' 메모장으로 스크랩 완료!`);
    setTimeout(() => setScrapSuccessMessage(null), 3000);
  };

  // Scrap to WorkLog Handler
  const handleScrapToWorkLog = async (item: CompetitorNewsItem) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    await saveLog({
      date: todayStr,
      todayWork: `📌 [경쟁사 동향] ${item.competitorName} - ${item.title}\n\n- 출처: ${item.origin} (${item.pubDate})\n- 상세 내용: ${item.description}\n- 원문 주소: ${item.link}`,
      pendingWork: "",
      issues: "",
    });
    setScrapSuccessMessage(`'${item.title.slice(0, 18)}...' 업무일지로 스크랩 완료!`);
    setTimeout(() => setScrapSuccessMessage(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>경쟁사 동향 모니터링</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              온라인 기사, 언론 보도, 경쟁사 소식을 날짜별 타임라인으로 실시간 자동 수집합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNews(activeCompetitor)}
            disabled={loading}
            className="h-10 text-xs font-bold gap-1.5 px-4 rounded-xl border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "뉴스 수집 중..." : "실시간 최신 뉴스 수집"}</span>
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {scrapSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {scrapSuccessMessage}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setScrapSuccessMessage(null)} className="h-6 w-6 p-0">
            ✕
          </Button>
        </div>
      )}

      {/* Competitor Selector & Keyword Registration */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-2xl border">
        {/* Competitor Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {competitors.map((comp) => {
            const isSelected = activeCompetitor === comp.name;
            return (
              <div key={comp.id} className="relative group shrink-0">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCompetitor(comp.name)}
                  className={`h-9 text-xs rounded-xl gap-1.5 font-extrabold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/40 scale-105"
                      : "hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{comp.name}</span>
                </Button>
                {!DEFAULT_COMPETITORS.some((d) => d.id === comp.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCompetitor(comp.id, comp.name);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="경쟁사 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Competitor Input Form */}
        <form onSubmit={handleAddCompetitor} className="flex gap-1.5 shrink-0">
          <Input
            placeholder="+ 모니터링할 경쟁사명 입력..."
            value={newCompetitorName}
            onChange={(e) => setNewCompetitorName(e.target.value)}
            className="h-9 text-xs w-48 bg-background"
          />
          <Button type="submit" size="sm" className="h-9 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-3.5 h-3.5" /> 등록
          </Button>
        </form>
      </div>

      {/* Control Bar: Search Input & Summary Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
            📢 {activeCompetitor} 수집 뉴스 ({filteredNews.length}건)
          </Badge>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            날짜별 타임라인으로 자동 정리된 소식입니다.
          </span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="기사 제목/내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Timeline Display of Competitor News Grouped by Date */}
      {loading ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl space-y-3 bg-muted/10">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-foreground">
            online에서 '{activeCompetitor}' 최신 뉴스기사 및 업데이트 내용을 가져오고 있습니다...
          </p>
        </div>
      ) : groupedNews.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl space-y-3 bg-muted/10">
          <Newspaper className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            수집된 뉴스 기사가 없거나 검색 결과가 없습니다.
          </p>
          <Button variant="outline" size="sm" onClick={() => fetchNews(activeCompetitor)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> 다시 수집하기
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedNews.map(({ date, items }) => (
            <div key={date} className="space-y-3">
              {/* Date Header Badge */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center gap-1 shadow-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{date}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">({items.length}건 소식)</span>
                <div className="flex-1 h-px bg-border ml-2" />
              </div>

              {/* News Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="group border rounded-2xl bg-card hover:border-indigo-500/60 transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden"
                  >
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 border-indigo-500/20 shrink-0">
                          <Globe className="w-3 h-3 mr-1" />
                          {item.origin}
                        </Badge>

                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {item.pubDate}
                        </span>
                      </div>

                      <CardTitle className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {item.title}
                        </a>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-medium">
                        {item.description}
                      </p>

                      {/* Action Buttons Toolbar */}
                      <div className="pt-3 border-t flex items-center justify-between gap-1.5 flex-wrap">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> 원본 기사 읽기
                        </a>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleScrapToMemo(item)}
                            className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-indigo-600 hover:bg-indigo-500/10 gap-1 rounded-lg"
                            title="메모장으로 스크랩"
                          >
                            <StickyNote className="w-3 h-3" /> 메모
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleScrapToWorkLog(item)}
                            className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 gap-1 rounded-lg"
                            title="업무일지로 스크랩"
                          >
                            <BookOpen className="w-3 h-3" /> 일지
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
