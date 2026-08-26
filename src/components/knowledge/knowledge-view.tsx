"use client";

import { useState, useMemo, useEffect } from "react";
import { useMemos, compressImage } from "@/hooks/use-memos";
import { MemoRichEditor } from "@/components/memos/memo-rich-editor";
import { Memo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Library,
  Lightbulb,
  BookOpen,
  Plus, 
  Search, 
  Upload, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Maximize2, 
  Trash2, 
  Edit3, 
  Download, 
  Images, 
  LayoutGrid, 
  ClipboardCheck, 
  X,
  CheckCircle2,
  FileText,
  Camera,
  GripVertical,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Sparkle,
  Link2,
  Clipboard,
  Table as TableIcon,
  Eye,
  EyeOff,
  Save,
  Briefcase
} from "lucide-react";

const CATEGORIES = ["전체", "업무", "아이디어", "노하우", "링크", "체크"];
const KNOWLEDGE_CATEGORIES = ["업무", "아이디어", "노하우", "링크", "체크"];

export function KnowledgeView() {
  const { memos, addMemo, updateMemo, deleteMemo, setMemoList } = useMemos();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(["전체"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "gallery">("card");
  const [isCompactFolded, setIsCompactFolded] = useState(true);
  const [expandedMemoIds, setExpandedMemoIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"custom" | "date_desc" | "date_asc">("custom");
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const toggleExpandMemo = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedMemoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Memo Detail Popup View Modal State
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);

  // Memo Form Dialog State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("아이디어");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  // 📋 Global Clipboard Paste Event Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            setIsCompressing(true);
            setIsFormOpen(true);
            setIsPasted(true);
            try {
              const compressed = await compressImage(file);
              setImageUrl(compressed);
              if (!title) {
                setTitle(`지식 이미지 자료 (${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`);
              }
              if (category === "일반") {
                setCategory("노하우");
              }
            } catch (err) {
              console.error("Paste error:", err);
            } finally {
              setIsCompressing(false);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [title, category]);

  // 📲 Incoming Mobile Native Share Target Handler (Instagram, YouTube, Browser Share)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sharedTitle = params.get("title") || params.get("shared_title") || "";
      const sharedText = params.get("text") || params.get("shared_text") || "";
      const sharedUrl = params.get("url") || params.get("shared_url") || "";

      if (sharedTitle || sharedText || sharedUrl) {
        // Find URL in text if sharedUrl is empty
        let targetUrl = sharedUrl;
        let textWithoutUrl = sharedText;
        if (!targetUrl && sharedText) {
          const urlMatch = sharedText.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            targetUrl = urlMatch[0];
            textWithoutUrl = sharedText.replace(targetUrl, "").trim();
          }
        }

        // Derive initial title candidates
        let initialTitle = sharedTitle.trim();
        if (!initialTitle && textWithoutUrl && !textWithoutUrl.startsWith("http")) {
          // If text has descriptive title (e.g. YouTube video title passed in text param)
          initialTitle = textWithoutUrl.split("\n")[0].trim();
        }

        let contentBody = "";
        if (sharedText) {
          contentBody += `<p>${sharedText}</p>`;
        }

        if (targetUrl) {
          const linkHtml = `<p>📌 <strong>공유 링크:</strong> <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">${targetUrl}</a></p>`;
          if (!contentBody.includes(targetUrl)) {
            contentBody += (contentBody ? "<br/>" : "") + linkHtml;
          }
        }

        setEditingMemo(null);
        setTitle(initialTitle);
        setContent(contentBody);
        setCategory("링크");
        setImageUrl("");
        setIsPasted(false);
        setIsFormOpen(true);

        // If title is missing or generic and we have a target URL, fetch the actual web page / video / post title from API
        if (targetUrl && (!initialTitle || initialTitle.length < 3)) {
          fetch(`/api/link-meta?url=${encodeURIComponent(targetUrl)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.title) {
                setTitle((prev) => (!prev || prev.trim() === "" ? data.title : prev));
              }
            })
            .catch((err) => console.warn("Failed to fetch link title:", err));
        }

        // Clean query parameters from URL bar
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const action = params.get("action");
        if (action === "new") {
          setEditingMemo(null);
          setTitle("");
          setContent("");
          setCategory("아이디어");
          setImageUrl("");
          setIsPasted(false);
          setIsFormOpen(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  const handleCategoryClick = (cat: string) => {
    if (cat === "전체") {
      setSelectedCategories(["전체"]);
      return;
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "전체");
      if (withoutAll.includes(cat)) {
        const next = withoutAll.filter((c) => c !== cat);
        return next.length === 0 ? ["전체"] : next;
      } else {
        return [...withoutAll, cat];
      }
    });
  };

  const knowledgePageMemos = useMemo(() => {
    return memos.filter((m) => KNOWLEDGE_CATEGORIES.includes(m.category));
  }, [memos]);

  const filteredMemos = useMemo(() => {
    let list = [...knowledgePageMemos];

    // Apply Sorting
    if (sortOrder === "date_desc") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sortOrder === "date_asc") {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    return list.filter((memo) => {
      if (!selectedCategories.includes("전체") && selectedCategories.length > 0) {
        if (!selectedCategories.includes(memo.category)) {
          return false;
        }
      }
      if (viewMode === "gallery" && !memo.imageUrl) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          memo.title.toLowerCase().includes(q) ||
          memo.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [knowledgePageMemos, selectedCategories, viewMode, searchQuery, sortOrder]);

  // Memo Count per Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: knowledgePageMemos.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "전체") {
        counts[cat] = knowledgePageMemos.filter((m) => m.category === cat).length;
      }
    });
    return counts;
  }, [knowledgePageMemos]);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const list = [...memos];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(dropIndex, 0, draggedItem);

    setSortOrder("custom"); // Set mode to custom drag order
    setMemoList(list);
    setDraggedIndex(null);
  };

  // 1-Click Sort by Date Handler
  const handleSortByDate = () => {
    if (sortOrder === "date_desc") {
      setSortOrder("date_asc");
    } else {
      setSortOrder("date_desc");
    }

    // Permanently sort the underlying list by date
    const sorted = [...memos].sort((a, b) => {
      return sortOrder === "date_desc"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });
    setMemoList(sorted);
  };

  const handleOpenAdd = () => {
    setEditingMemo(null);
    setTitle("");
    setCategory("업무");
    setContent("");
    setImageUrl("");
    setIsPasted(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (memo: Memo) => {
    setViewingMemo(null);
    setEditingMemo(memo);
    setTitle(memo.title);
    setCategory(memo.category || "업무");
    setContent(memo.content);
    setImageUrl(memo.imageUrl || "");
    setIsPasted(false);
    setIsFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressing(true);
      setIsPasted(false);
      if (!isFormOpen) {
        setEditingMemo(null);
        setTitle(`지식 이미지 자료 (${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`);
        setCategory("노하우");
        setContent("");
        setIsFormOpen(true);
      }
      try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingMemo) {
      await updateMemo(editingMemo.id, {
        title: title.trim(),
        category,
        content: content.trim(),
        imageUrl,
      });
    } else {
      await addMemo({
        title: title.trim(),
        category,
        content: content.trim(),
        imageUrl,
      });
    }

    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 지식 자료를 정말 삭제하시겠습니까?")) {
      await deleteMemo(id);
      setIsFormOpen(false);
      setViewingMemo(null);
    }
  };

  const handleDownloadImage = (memo: Memo) => {
    if (!memo.imageUrl) return;
    const link = document.createElement("a");
    link.href = memo.imageUrl;
    link.download = `${memo.title}_${memo.createdAt.slice(0, 10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>지식창고</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              아이디어, 업무 노하우, 웹 링크 레퍼런스 아카이브
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-1.5 h-10 text-xs font-bold px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            <span>+ 새 지식 등록</span>
          </Button>
        </div>
      </div>

      {/* Control Toolbar: Category Filter, Date Sort Button & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        {/* Category Pills (Supports Multi-Selection) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategories.includes(cat);
            return (
              <Button
                key={cat}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(cat)}
                className={`h-8 text-xs shrink-0 rounded-xl gap-1.5 font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 scale-105"
                    : "hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Right Controls: Date Sort Button, Search & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* 📅 1-Click Sort by Creation Date Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortByDate}
            className="h-8 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 font-bold shrink-0"
            title="생성 날짜순 정렬 (클릭 시 최신순/오래된순 전환)"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>
              {sortOrder === "date_asc"
                ? "날짜 오름차순 ⏳"
                : sortOrder === "date_desc"
                ? "날짜 최신순 📅"
                : "📅 날짜순 정렬"}
            </span>
          </Button>

          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="제목/내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div className="flex items-center bg-background rounded-lg p-0.5 border shrink-0">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="h-7 text-xs px-2 gap-1"
              title="카드 뷰 (드래그 순서 변경 가능)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>카드</span>
            </Button>
            <Button
              variant={viewMode === "gallery" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("gallery")}
              className="h-7 text-xs px-2 gap-1"
              title="사진 갤러리 뷰"
            >
              <Images className="w-3.5 h-3.5 text-amber-500" />
              <span>갤러리</span>
            </Button>
            <Button
              variant={isCompactFolded ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsCompactFolded(!isCompactFolded)}
              className={`h-7 text-xs px-2.5 gap-1 transition-all ${
                isCompactFolded ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-bold" : "text-muted-foreground"
              }`}
              title="메모 내용을 가리고 제목, 날짜, 카테고리만 깔끔하게 접기"
            >
              {isCompactFolded ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isCompactFolded ? "메모 펼치기" : "메모 접기"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      {filteredMemos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold">등록된 지식 자료가 없습니다</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            업무에 필요한 아이디어, 기술 노하우, 유용한 웹 링크를 보관해 보세요.
          </p>
          <Button onClick={handleOpenAdd} size="sm" className="mt-4 gap-1.5 h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4" /> 첫 지식 자료 등록하기
          </Button>
        </div>
      ) : viewMode === "card" ? (
        /* CARD VIEW: 4 items per row on desktop with HTML5 Drag & Drop */
        <div className={isCompactFolded ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
          {filteredMemos.map((memo, idx) => {
            const dateStr = memo.createdAt.slice(0, 10).replace(/-/g, ".");
            const isFoldedThisMemo = isCompactFolded && !expandedMemoIds.has(memo.id);

            return (
              <Card
                key={memo.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onDoubleClick={(e) => toggleExpandMemo(memo.id, e)}
                className={`group border hover:border-amber-500/60 transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden ${
                  draggedIndex === idx ? "opacity-40 ring-2 ring-amber-500 ring-dashed" : "bg-card"
                }`}
                title="한 번 클릭: 상세보기 팝업 | 더블 클릭: 카드 인라인 펼치기/접기"
              >
                {/* Photo Thumbnail if present (hidden when compact folded) */}
                {!isFoldedThisMemo && memo.imageUrl && (
                  <div
                    className="relative aspect-[16/9] bg-muted overflow-hidden cursor-pointer"
                    onClick={() => setViewingMemo(memo)}
                  >
                    <img
                      src={memo.imageUrl}
                      alt={memo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-medium">
                      <Maximize2 className="w-4 h-4" />
                      <span>팝업 열기</span>
                    </div>
                  </div>
                )}

                <CardHeader className={isFoldedThisMemo ? "p-2.5 sm:p-3 space-y-1 cursor-pointer" : "p-3.5 pb-1 space-y-1.5"}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Drag Handle Grip Icon */}
                      <span className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-amber-600 p-0.5" title="드래그해서 위치 이동">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          memo.category === "아이디어"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : memo.category === "노하우"
                            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30"
                            : memo.category === "링크"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                            : memo.category === "체크"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {memo.category === "아이디어" && "💡 "}
                        {memo.category === "노하우" && "📖 "}
                        {memo.category === "링크" && "🔗 "}
                        {memo.category === "체크" && "✅ "}
                        {memo.category}
                      </Badge>

                      {isFoldedThisMemo && memo.content?.includes("<table") && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-0.5 font-bold">
                          <TableIcon className="w-2.5 h-2.5" />
                          <span>표</span>
                        </Badge>
                      )}

                      {isFoldedThisMemo && (memo.imageUrl || memo.content?.includes("<img")) && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-0.5 font-bold">
                          <Camera className="w-2.5 h-2.5 text-emerald-600" />
                          <span>사진</span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mr-0.5">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        {dateStr}
                      </span>

                      {/* ✏️ Quick Edit (Pencil) Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(memo);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="바로 메모 수정 (연필)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>

                      {/* ❌ Quick Delete (X) Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(memo.id);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                        title="바로 메모 삭제 (X)"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-red-600" />
                      </Button>

                      {isCompactFolded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleExpandMemo(memo.id, e)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                          title={expandedMemoIds.has(memo.id) ? "카드 접기" : "카드 펼치기"}
                        >
                          {expandedMemoIds.has(memo.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  <CardTitle
                    className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                    onClick={() => setViewingMemo(memo)}
                  >
                    {memo.title}
                  </CardTitle>
                </CardHeader>

                {/* Content body hidden when isFoldedThisMemo is TRUE */}
                {!isFoldedThisMemo && (
                  <CardContent
                    className="p-3.5 pt-1 flex-1 flex flex-col justify-between space-y-2 cursor-pointer"
                    onClick={() => setViewingMemo(memo)}
                  >
                    <div className="space-y-1">
                      {memo.content?.includes("<table") && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 mb-1">
                          <TableIcon className="w-2.5 h-2.5" />
                          <span>표 포함</span>
                        </Badge>
                      )}
                      <div
                        className="text-xs text-muted-foreground leading-relaxed line-clamp-3 max-h-14 overflow-hidden prose prose-xs dark:prose-invert [&_table]:hidden [&_h1]:text-xs [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_blockquote]:my-0 [&_blockquote]:py-0 [&_blockquote]:border-l-2 [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-900/60 [&_mark]:px-0.5"
                        dangerouslySetInnerHTML={{ __html: memo.content || "(상세 텍스트 없음)" }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[11px] text-primary/80 font-medium mt-auto">
                      <span>자세히 보기</span>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* GALLERY VIEW: 4 items per row on desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMemos.map((memo, idx) => {
            const dateStr = memo.createdAt.slice(0, 10).replace(/-/g, ".");
            return (
              <Card
                key={memo.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => setViewingMemo(memo)}
                className={`group overflow-hidden cursor-pointer border hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  draggedIndex === idx ? "opacity-40 ring-2 ring-primary ring-dashed" : "bg-card"
                }`}
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={memo.imageUrl}
                    alt={memo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="bg-background/80 backdrop-blur p-0.5 rounded text-muted-foreground cursor-grab">
                      <GripVertical className="w-3 h-3" />
                    </span>
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px]">
                      {memo.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-medium text-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>팝업 보기</span>
                  </div>
                </div>

                <CardContent className="p-3 space-y-1">
                  <h3 className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                    {memo.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CalendarIcon className="w-3 h-3 shrink-0" />
                    <span>{dateStr}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 팝업 1: MEMO DETAIL POPUP MODAL */}
      <Dialog open={!!viewingMemo} onOpenChange={(open) => !open && setViewingMemo(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-card border shadow-2xl rounded-2xl box-border max-h-[92vh]">
          {viewingMemo && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 pr-12 sm:pr-14 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        viewingMemo.category === "중요"
                          ? "destructive"
                          : viewingMemo.category === "아이디어"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {viewingMemo.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {viewingMemo.createdAt.slice(0, 10).replace(/-/g, ".")} 작성
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold leading-snug break-all">{viewingMemo.title}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(viewingMemo)}
                    className="h-8 px-3 text-xs font-bold gap-1 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> 수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(viewingMemo.id)}
                    className="h-8 px-3 text-xs font-bold gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 삭제
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-4">
                {viewingMemo.imageUrl && (
                  <div
                    className="relative bg-black/90 rounded-2xl overflow-hidden border p-2 text-center cursor-pointer group"
                    onClick={() => setEnlargedImageUrl(viewingMemo.imageUrl!)}
                  >
                    <img
                      src={viewingMemo.imageUrl}
                      alt={viewingMemo.title}
                      className="max-h-[480px] w-auto mx-auto object-contain rounded-lg group-hover:scale-[1.01] transition-transform"
                    />
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadImage(viewingMemo);
                        }}
                        className="h-7 text-xs gap-1 bg-white/20 text-white hover:bg-white/30"
                      >
                        <Download className="w-3.5 h-3.5" /> 사진 원본 다운로드
                      </Button>
                    </div>
                  </div>
                )}

                <div
                  className="bg-muted/30 p-5 rounded-2xl border leading-relaxed text-xs sm:text-base overflow-x-auto break-all prose prose-sm sm:prose-base dark:prose-invert max-w-full [&_img]:cursor-pointer [&_img]:hover:opacity-90 [&_img]:hover:scale-[1.01] [&_img]:transition-all"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target && target.tagName === "IMG") {
                      const img = target as HTMLImageElement;
                      setEnlargedImageUrl(img.src);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: viewingMemo.content || "(상세 텍스트 내용이 없습니다.)" }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 팝업 2: CREATE / EDIT KNOWLEDGE FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 rounded-2xl border shadow-2xl box-border">
          <DialogHeader className="pr-8 flex flex-row items-center justify-between border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Library className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="truncate">{editingMemo ? "기록 수정" : "새 기록 작성"}</span>
            </DialogTitle>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isCompressing}
              size="sm"
              className="h-8 px-3.5 text-xs font-bold gap-1.5 bg-amber-600 text-white hover:bg-amber-700 shadow-sm shrink-0 mr-4"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isCompressing ? "압축 중..." : editingMemo ? "수정 저장" : "저장하기"}</span>
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 w-full max-w-full box-border overflow-hidden">
            <div className="space-y-1.5 w-full">
              <Label htmlFor="knowledge-title" className="text-xs font-bold">제목</Label>
              <Input
                id="knowledge-title"
                required
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full box-border text-xs sm:text-sm h-10"
              />
            </div>

            <div className="space-y-1.5 w-full box-border">
              <Label htmlFor="knowledge-category" className="text-xs font-bold block">카테고리</Label>
              <div className="relative w-full box-border">
                <select
                  id="knowledge-category"
                  className="w-full box-border h-10 rounded-xl border border-input bg-background pl-3.5 pr-10 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-xs transition-all font-medium"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <optgroup label="📚 지식창고" className="font-bold text-muted-foreground">
                    <option value="아이디어" className="py-2 text-foreground bg-background">💡 아이디어</option>
                    <option value="노하우" className="py-2 text-foreground bg-background">📖 노하우</option>
                    <option value="링크" className="py-2 text-foreground bg-background">🔗 링크</option>
                    <option value="체크" className="py-2 text-foreground bg-background">✅ 체크</option>
                  </optgroup>
                  <optgroup label="📝 메모 보관함으로 이동" className="font-bold text-muted-foreground">
                    <option value="중요" className="py-2 text-foreground bg-background">🚨 중요</option>
                    <option value="일반" className="py-2 text-foreground bg-background">📋 일반</option>
                    <option value="생활" className="py-2 text-foreground bg-background">☕ 생활</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Dynamic Destination Guide Indicator */}
              <div className="pt-1 flex items-center">
                {["중요", "일반", "생활"].includes(category) ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-in fade-in duration-150">
                    📝 <strong>[메모]</strong> 메뉴의 '{category}' 보관함으로 저장됩니다
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-in fade-in duration-150">
                    📚 <strong>[지식창고]</strong> 메뉴의 '{category}' 보관함으로 저장됩니다
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 w-full">
              <Label className="text-xs font-bold">상세 내용 및 서식 (선택)</Label>
              <MemoRichEditor
                value={content}
                onChange={setContent}
                placeholder="아이디어 구상, 업무 노하우, 유용한 사이트 링크나 메모를 작성하세요 (상단 툴바 📷사진 버튼, 복사+붙여넣기(Ctrl+V), 드래그&드롭으로 본문 안에 사진/링크를 자유롭게 넣으실 수 있습니다)"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 w-full box-border">
              <Button type="submit" disabled={isCompressing} className="flex-1 h-10 text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white">
                {isCompressing ? "사진 압축 중..." : editingMemo ? "수정 완료" : "저장하기"}
              </Button>
              {editingMemo && (
                <Button type="button" variant="destructive" onClick={() => handleDelete(editingMemo.id)} className="h-10 text-xs sm:text-sm px-3">
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-10 text-xs sm:text-sm px-4">
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 팝업 3: FULLSCREEN IMAGE LIGHTBOX MODAL */}
      <Dialog open={!!enlargedImageUrl} onOpenChange={(open) => !open && setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl p-3 bg-black/95 border-none shadow-2xl rounded-2xl flex flex-col items-center justify-center">
          {enlargedImageUrl && (
            <div className="relative w-full flex flex-col items-center justify-center p-2 space-y-3">
              <img
                src={enlargedImageUrl}
                alt="확대 사진"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
              <div className="flex items-center justify-between w-full px-4 pt-1 text-white">
                <span className="text-xs font-bold text-white/90">🖼️ 이미지 원본 크게 보기</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = enlargedImageUrl;
                    link.download = `memo_image_${Date.now()}.png`;
                    link.click();
                  }}
                  className="h-8 text-xs font-bold gap-1.5 bg-white/20 text-white hover:bg-white/30"
                >
                  <Download className="w-3.5 h-3.5" /> 원본 다운로드
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
