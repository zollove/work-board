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
  CheckCircle2
} from "lucide-react";

const CATEGORIES = ["전체", "중요", "건물 외관", "하자 보수", "임대 현장", "설비/기계실", "일반", "아이디어", "긴급"];

export function MemoView() {
  const { memos, addMemo, updateMemo, deleteMemo } = useMemos();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "gallery">("card");

  // Memo Dialog State (Create / Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("일반");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  // Lightbox Modal State
  const [lightboxMemo, setLightboxMemo] = useState<Memo | null>(null);

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
            setIsDialogOpen(true);
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
    return memos.filter((memo) => {
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
  }, [memos, selectedCategory, viewMode, searchQuery]);

  const handleOpenAdd = () => {
    setEditingMemo(null);
    setTitle("");
    setCategory("일반");
    setContent("");
    setImageUrl("");
    setIsPasted(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (memo: Memo) => {
    setEditingMemo(memo);
    setTitle(memo.title);
    setCategory(memo.category || "일반");
    setContent(memo.content);
    setImageUrl(memo.imageUrl || "");
    setIsPasted(false);
    setIsDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsCompressing(true);
      setIsPasted(false);
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

    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 메모를 정말 삭제하시겠습니까?")) {
      await deleteMemo(id);
      setIsDialogOpen(false);
      setLightboxMemo(null);
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
              <span>스마트 메모 & 사진 보관함</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>업무 메모 작성 및 현장 사진 통합 보관함</span>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30">
                📋 Ctrl + V (복사 붙여넣기) 이미지 첨부 가능
              </Badge>
            </p>
          </div>
        </div>

        <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          새 메모 / 사진 작성
        </Button>
      </div>

      {/* Control Toolbar: Category Filter & View Mode Switcher */}
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

        {/* Right Controls: Search & View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="메모 제목 또는 내용 검색..."
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
              title="카드 뷰"
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

      {/* MEMO ITEMS DISPLAY */}
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
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMemos.map((memo) => {
            const dateStr = memo.createdAt.slice(0, 10).replace(/-/g, ".");
            return (
              <Card
                key={memo.id}
                className="group border hover:border-primary/50 transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden"
              >
                {/* Photo Thumbnail if present */}
                {memo.imageUrl && (
                  <div
                    className="relative aspect-[16/9] bg-muted overflow-hidden cursor-pointer"
                    onClick={() => setLightboxMemo(memo)}
                  >
                    <img
                      src={memo.imageUrl}
                      alt={memo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-medium">
                      <Maximize2 className="w-4 h-4" />
                      <span>사진 원본 보기</span>
                    </div>
                  </div>
                )}

                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between">
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

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {dateStr}
                    </span>
                  </div>

                  <CardTitle
                    className="text-base font-bold cursor-pointer hover:text-primary transition-colors line-clamp-1"
                    onClick={() => handleOpenEdit(memo)}
                  >
                    {memo.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
                    {memo.content || "(상세 텍스트 내용 없음)"}
                  </p>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(memo)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(memo.id)}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* GALLERY VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredMemos.map((memo) => {
            const dateStr = memo.createdAt.slice(0, 10).replace(/-/g, ".");
            return (
              <Card
                key={memo.id}
                onClick={() => setLightboxMemo(memo)}
                className="group overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={memo.imageUrl}
                    alt={memo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px]">
                      {memo.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-medium text-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>크게 보기</span>
                  </div>
                </div>

                <CardContent className="p-3.5 space-y-1">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {memo.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="w-3 h-3 shrink-0" />
                    <span>{dateStr}</span>
                  </div>
                  {memo.content && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-1">
                      {memo.content}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MEMO DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-primary" />
              <span>{editingMemo ? "메모 수정" : "새 메모 / 현장 사진 작성"}</span>
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
              <Label>현장 사진 첨부 (선택 / Ctrl + V 가능)</Label>
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
                  <label className="cursor-pointer block py-4 space-y-1.5">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                    <span className="text-xs font-semibold text-primary block">
                      사진 파일 선택 또는 **Ctrl + V** 복사 붙여넣기!
                    </span>
                  </label>
                )}
                <input
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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX / FULLSCREEN PHOTO MODAL */}
      <Dialog open={!!lightboxMemo} onOpenChange={(open) => !open && setLightboxMemo(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-slate-950 text-slate-100 border-slate-800">
          {lightboxMemo && (
            <div className="flex flex-col md:flex-row">
              {/* Full Image */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px] md:min-h-[450px]">
                <img
                  src={lightboxMemo.imageUrl}
                  alt={lightboxMemo.title}
                  className="max-h-[70vh] w-auto object-contain rounded"
                />
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-80 p-5 space-y-4 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {lightboxMemo.category}
                  </Badge>
                  <h2 className="text-lg font-bold text-white leading-tight">{lightboxMemo.title}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{lightboxMemo.createdAt.slice(0, 10).replace(/-/g, ".")} 작성</span>
                  </p>
                </div>

                {lightboxMemo.content && (
                  <div className="space-y-1.5 flex-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400">상세 메모 내용</h4>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {lightboxMemo.content}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadImage(lightboxMemo)}
                    className="flex-1 gap-1.5 border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(lightboxMemo.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
