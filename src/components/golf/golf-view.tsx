"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMemos } from "@/hooks/use-memos";
import { useGolfUnread } from "@/hooks/use-golf-unread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Compass,
  Search,
  RefreshCw,
  ExternalLink,
  BookmarkPlus,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle,
  Share2,
} from "lucide-react";

interface GolfArticle {
  id: string;
  title: string;
  link: string;
  date: string;
  timeAgo?: string;
  category: string;
  thumbnail: string;
  summary: string[];
  description: string;
  isNew: boolean;
  isAiSummary?: boolean;
}

const CATEGORIES = [
  "전체",
  "GJ RADAR",
  "GOLF TALK",
  "PEOPLE",
  "PLACE",
  "GOLF&ISSUE",
  "EQUIPMENT",
  "INSTRUCTION",
  "STYLE",
  "PARK GOLF",
  "LIFE",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  "GJ RADAR": "💡",
  "GOLF TALK": "⚖️",
  "PEOPLE": "👥",
  "PLACE": "⛳",
  "GOLF&ISSUE": "📰",
  "EQUIPMENT": "🛠️",
  "INSTRUCTION": "🏌️",
  "STYLE": "👕",
  "PARK GOLF": "🏑",
  "LIFE": "☕",
};

export function GolfView() {
  const [articles, setArticles] = useState<GolfArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState<GolfArticle | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [scrapToast, setScrapToast] = useState<string | null>(null);

  const { addMemo } = useMemos();
  const { markAllAsRead } = useGolfUnread();

  const fetchArticles = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/golf-journal", { cache: "no-store" });
      const data = await res.json();
      if (data && data.articles) {
        setArticles(data.articles);
        setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch (err) {
      console.error("Golf Journal load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    markAllAsRead();
  }, [markAllAsRead]);

  // Filter articles by Category & Search Query
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      const matchCat = selectedCategory === "전체" || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchSum = item.summary.some((s) => s.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchSum;
    });
  }, [articles, selectedCategory, searchQuery]);

  // Handle 1-Click Scrap to Knowledge Vault
  const handleScrapToKnowledge = async (article: GolfArticle) => {
    try {
      const summaryHtml = article.summary.map((s) => `<li>${s}</li>`).join("");
      const content = `
<p><strong>⛳ [골프저널] ${article.category} 기사 브리핑</strong></p>
<p>⚡ <strong>핵심 요약:</strong></p>
<ul>${summaryHtml}</ul>
<br/>
<p>${article.description}</p>
<br/>
<p>📌 <strong>원문 보기:</strong> <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">${article.link}</a></p>
      `.trim();

      await addMemo({
        title: `[골프] ${article.title}`,
        category: "노하우",
        content,
        imageUrl: article.thumbnail || "",
      });

      setScrapToast(`✅ '${article.title.slice(0, 20)}...' 기사가 지식창고(노하우)에 저장되었습니다!`);
      setTimeout(() => setScrapToast(null), 3000);
    } catch (err) {
      console.error("Scrap error:", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* ⛳ Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/70 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>골프저널 (Golf Journal)</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              전체 10대 섹션 실시간 기사 수집 & 3줄 스마트 핵심 요약
            </p>
          </div>
        </div>

        {/* Sync & Refresh Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {lastUpdated && (
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block">
              최근 갱신: {lastUpdated}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchArticles(true)}
            disabled={refreshing || loading}
            className="gap-1.5 h-9 text-xs font-bold px-3.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "동기화 중..." : "최신 글 새로고침"}</span>
          </Button>
        </div>
      </div>

      {/* Scrap Toast Alert */}
      {scrapToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-in fade-in duration-200 flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{scrapToast}</span>
        </div>
      )}

      {/* 🧭 Section Filter Bar (Scrollable on mobile) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const emoji = CATEGORY_EMOJIS[cat] || "⛳";
            return (
              <Button
                key={cat}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 text-xs shrink-0 rounded-xl gap-1 font-bold transition-all ${
                  isSelected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/30 scale-105"
                    : "hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                <span>{cat === "전체" ? "전체 보기" : `${emoji} ${cat}`}</span>
              </Button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="골프 기사 / 요약 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl bg-background shadow-xs"
          />
        </div>
      </div>

      {/* 📰 Articles Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">
            골프저널 최신 기사 및 핵심 요약을 불러오는 중입니다...
          </p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl space-y-2 bg-muted/10">
          <Compass className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-bold text-muted-foreground">조건에 맞는 기사가 없습니다.</p>
          <Button variant="outline" size="sm" onClick={() => { setSelectedCategory("전체"); setSearchQuery(""); }}>
            전체 기사 보기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => {
            const emoji = CATEGORY_EMOJIS[article.category] || "⛳";

            return (
              <Card
                key={article.id}
                className="group border hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden bg-card"
              >
                <div className="p-4 space-y-3">
                  {/* Top Metadata: Category Tag, Date & NEW Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        {emoji} {article.category}
                      </Badge>
                      {article.isNew && (
                        <Badge className="text-[10px] font-black bg-rose-500 text-white gap-0.5 px-1.5 py-0 animate-pulse">
                          <Flame className="w-2.5 h-2.5" /> NEW
                        </Badge>
                      )}
                    </div>
                    <span
                      className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 shrink-0"
                      title={article.date}
                    >
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      <span>{article.timeAgo ? `${article.timeAgo} (${article.date.slice(5)})` : article.date}</span>
                    </span>
                  </div>

                  {/* Article Title */}
                  <h3
                    onClick={() => setActiveArticle(article)}
                    className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2 cursor-pointer group-hover:text-emerald-600 transition-colors"
                  >
                    {article.title}
                  </h3>

                  {/* ⚡ 3-Bullet Smart Summary Box */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
                    <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>3줄 핵심 브리핑</span>
                      </div>
                      {article.isAiSummary && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-0.5">
                          ✨ Gemini AI
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                      {article.summary.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-black text-[10px] mt-0.5">•</span>
                          <span className="line-clamp-2">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveArticle(article)}
                    className="h-8 px-2.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 gap-1"
                  >
                    <span>본문 읽기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScrapToKnowledge(article)}
                      title="지식창고에 요약 저장"
                      className="h-8 px-2 text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 gap-1"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">스크랩</span>
                    </Button>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="골프저널 원문 페이지 열기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 📖 ARTICLE READER MODAL */}
      <Dialog open={!!activeArticle} onOpenChange={(open) => !open && setActiveArticle(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-card border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
          {activeArticle && (
            <>
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-12">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      {CATEGORY_EMOJIS[activeArticle.category] || "⛳"} {activeArticle.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {activeArticle.timeAgo ? `${activeArticle.timeAgo} • ${activeArticle.date}` : activeArticle.date}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black leading-snug break-all">{activeArticle.title}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScrapToKnowledge(activeArticle)}
                    className="h-8 px-3 text-xs font-bold gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" /> 지식창고 저장
                  </Button>
                  <a
                    href={activeArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-3 text-xs font-bold rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> 원문 사이트
                  </a>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                {/* 3-Bullet Summary Highlight Box */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>핵심 인사이트 3줄 요약</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90 font-medium">
                    {activeArticle.summary.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Article Full Preview Text */}
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-foreground/90 space-y-3 pt-2">
                  <p className="whitespace-pre-line leading-relaxed font-normal">{activeArticle.description}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
