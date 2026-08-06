"use client";

import { useState, useMemo, useEffect } from "react";
import { useMemos, compressImage } from "@/hooks/use-memos";
import { Memo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  StickyNote, 
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
  CalendarDays
} from "lucide-react";

const CATEGORIES = ["전체", "중요", "건물 외관", "하자 보수", "임대 현장", "설비/기계실", "일반", "아이디어", "긴급"];

export function MemoView() {
  const { memos, addMemo, updateMemo, deleteMemo, setMemoList } = useMemos();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "gallery">("card");
  const [sortOrder, setSortOrder] = useState<"custom" | "date_desc" | "date_asc">("custom");

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Memo Detail Popup View Modal State
  const [viewingMemo, setViewingMemo] = useState<Memo | null>(null);

  // Memo Form Dialog State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("일반");
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
                setTitle(`현장 사진 메모 (${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`);
              }
              if (category === "일반") {
                setCategory("건물 외관");
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

  const filteredMemos = useMemo(() => {
    let list = [...memos];

    // Apply Sorting
    if (sortOrder === "date_desc") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sortOrder === "date_asc") {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    // "custom" preserves the order as in `memos` array!

    return list.filter((memo) => {
      if (selectedCategory !== "전체" && memo.category !== selectedCategory) {
        return false;
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
  }, [memos, selectedCategory, viewMode, searchQuery, sortOrder]);

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
    setCategory("일반");
    setContent("");
    setImageUrl("");
    setIsPasted(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (memo: Memo) => {
    setViewingMemo(null);
    setEditingMemo(memo);
    setTitle(memo.title);
    setCategory(memo.category || "일반");
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
        setTitle(`현장 사진 메모 (${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`);
        setCategory("건물 외관");
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
    if (confirm("이 메모를 정말 삭제하시겠습니까?")) {
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>메모</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>업무 메모 및 현장 사진 보관함</span>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30">
                🖐️ 드래그로 순서 변경 가능 · 📋 Ctrl + V 이미지 붙여넣기
              </Badge>
            </p>
          </div>
        </div>

        {/* Top Action Buttons (Including Direct Photo Picker Button) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="top-photo-input"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 h-10 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold cursor-pointer transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span>📷 갤러리 사진 올리기</span>
          </label>
          <input
            id="top-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button onClick={handleOpenAdd} className="flex-1 sm:flex-none gap-1.5 h-10 text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>+ 새 메모 작성</span>
          </Button>
        </div>
      </div>

      {/* Control Toolbar: Category Filter, Date Sort Button & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-8 text-xs shrink-0 rounded-lg"
            >
              {cat}
            </Button>
          ))}
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
          </div>
        </div>
      </div>

      {/* MEMO ITEMS DISPLAY (Drag and Drop Supported) */}
      {filteredMemos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl space-y-3 bg-muted/10">
          <StickyNote className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            {viewMode === "gallery" ? "사진이 포함된 메모가 없습니다." : "등록된 메모가 없습니다."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenAdd}>
              + 새 메모 작성하기
            </Button>
            <span className="text-xs text-muted-foreground">또는 **Ctrl + V** 복사 붙여넣기</span>
          </div>
        </div>
      ) : viewMode === "card" ? (
        /* CARD VIEW: 4 items per row on desktop with HTML5 Drag & Drop */
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
                className={`group border hover:border-primary/60 transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden ${
                  draggedIndex === idx ? "opacity-40 ring-2 ring-primary ring-dashed" : "bg-card"
                }`}
              >
                {/* Photo Thumbnail if present */}
                {memo.imageUrl && (
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

                <CardHeader className="p-3.5 pb-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {/* Drag Handle Grip Icon */}
                      <span className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary p-0.5" title="드래그해서 위치 이동">
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <Badge
                        variant={
                          memo.category === "중요" || memo.category === "긴급"
                            ? "destructive"
                            : memo.category === "하자 보수"
                            ? "default"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {memo.category}
                      </Badge>
                    </div>

                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <CardTitle
                    className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                    onClick={() => setViewingMemo(memo)}
                  >
                    {memo.title}
                  </CardTitle>
                </CardHeader>

                <CardContent
                  className="p-3.5 pt-1 flex-1 flex flex-col justify-between space-y-2 cursor-pointer"
                  onClick={() => setViewingMemo(memo)}
                >
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">
                    {memo.content || "(상세 텍스트 없음)"}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-primary/80 font-medium mt-auto">
                    <span>자세히 보기</span>
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
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
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border shadow-xl">
          {viewingMemo && (
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 bg-muted/20">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        viewingMemo.category === "중요" || viewingMemo.category === "긴급"
                          ? "destructive"
                          : viewingMemo.category === "하자 보수"
                          ? "default"
                          : "secondary"
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
                  <h2 className="text-lg sm:text-xl font-bold leading-snug">{viewingMemo.title}</h2>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(viewingMemo)}
                    className="h-8 text-xs gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> 수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(viewingMemo.id)}
                    className="h-8 text-xs gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 삭제
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {viewingMemo.imageUrl && (
                  <div className="relative bg-black/90 rounded-2xl overflow-hidden border p-2 text-center">
                    <img
                      src={viewingMemo.imageUrl}
                      alt={viewingMemo.title}
                      className="max-h-[400px] w-auto mx-auto object-contain rounded-lg"
                    />
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadImage(viewingMemo)}
                        className="h-7 text-xs gap-1 bg-white/20 text-white hover:bg-white/30"
                      >
                        <Download className="w-3.5 h-3.5" /> 사진 원본 다운로드
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 p-4 rounded-xl border leading-relaxed text-sm whitespace-pre-wrap">
                  {viewingMemo.content || "(상세 텍스트 내용이 없습니다.)"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 팝업 2: CREATE / EDIT MEMO FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              <span>{editingMemo ? "메모 수정" : "새 메모 작성"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="memo-title">제목 / 현장명</Label>
              <Input
                id="memo-title"
                required
                placeholder="예: 101호 누수 점검, 옥상 방수 공사 메모"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo-category">카테고리</Label>
              <select
                id="memo-category"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo-content">상세 내용 (선택)</Label>
              <Textarea
                id="memo-content"
                rows={4}
                placeholder="세부 특이사항, 수리업체 연락처, 점검 메모를 작성하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Photo Attachment Box */}
            <div className="space-y-2">
              <Label>현장 사진 첨부 (선택)</Label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/20 transition-colors">
                {imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img src={imageUrl} alt="Preview" className="max-h-40 rounded-lg mx-auto object-contain border" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow hover:scale-110 transition-transform"
                        title="사진 첨부 취소"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold">
                      {isPasted ? (
                        <>
                          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                          <span className="text-indigo-600">클립보드 사진 (Ctrl+V) 첨부 완료!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>사진 자동 최적화 압축 완료 (~300KB)</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <label htmlFor="modal-photo-input" className="w-full py-3.5 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer text-primary font-bold transition-all shadow-sm">
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-sm font-extrabold">📷 핸드폰 갤러리 사진 선택 / 촬영하기</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      (터치하면 스마트폰 갤러리 및 카메라가 즉시 열립니다)
                    </span>
                  </label>
                )}
                <input
                  id="modal-photo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isCompressing} className="flex-1">
                {isCompressing ? "사진 압축 중..." : editingMemo ? "수정 저장" : "메모 저장"}
              </Button>
              {editingMemo && (
                <Button type="button" variant="destructive" onClick={() => handleDelete(editingMemo.id)}>
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
