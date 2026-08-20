"use client";

import { useState, useMemo, useEffect } from "react";
import { useGallery, compressImage } from "@/hooks/use-gallery";
import { GalleryItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Images, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Upload, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Maximize2,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  FileText
} from "lucide-react";

const CATEGORIES = ["전체", "건물 외관", "하자 보수", "임대 현장", "설비/기계실", "기타"];

export function GalleryView() {
  const { items, loading, addItem, deleteItem } = useGallery();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("건물 외관");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPasted, setIsPasted] = useState(false);

  // Lightbox Modal State
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  // 📋 Global Clipboard Paste Event Listener (Ctrl + V / Cmd + V)
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
            setIsUploadOpen(true);
            setIsPasted(true);
            try {
              const compressed = await compressImage(file);
              setPreviewUrl(compressed);
              setSelectedFile(file);
              if (!uploadTitle) {
                setUploadTitle(`복사한 사진 (${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`);
              }
            } catch (err) {
              console.error("Paste image compression error:", err);
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
  }, [uploadTitle]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== "전체" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsCompressing(true);
      setIsPasted(false);
      try {
        const compressed = await compressImage(file);
        setPreviewUrl(compressed);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    await addItem({
      title: uploadTitle.trim() || "건물 현장 사진",
      category: uploadCategory,
      imageUrl: previewUrl,
      notes: uploadNotes.trim(),
    });

    setIsUploadOpen(false);
    setUploadTitle("");
    setUploadNotes("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPasted(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 사진을 정말 삭제하시겠습니까?")) {
      await deleteItem(id);
      setActiveItem(null);
    }
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement("a");
    link.href = item.imageUrl;
    link.download = `${item.title}_${item.createdAt.slice(0, 10)}.jpg`;
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
            <Images className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>건물 관리 사진 갤러리</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>건물 현장 사진 보관</span>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/30">
                📋 Ctrl + V (복사 붙여넣기)로 바로 업로드 가능!
              </Badge>
            </p>
          </div>
        </div>

        <Button onClick={() => setIsUploadOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          사진 업로드
        </Button>
      </div>

      {/* Filter & Search Bar */}
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

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="사진 제목 또는 메모 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
      </div>

      {/* Photo Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          사진 갤러리를 불러오는 중입니다...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl space-y-3 bg-muted/10">
          <Images className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">등록된 현장 사진이 없습니다.</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
              + 사진 파일 직접 업로드
            </Button>
            <span className="text-xs text-muted-foreground">또는 **Ctrl + V** 복사 붙여넣기</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => {
            const dateStr = item.createdAt.slice(0, 10).replace(/-/g, ".");
            return (
              <Card
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group overflow-hidden cursor-pointer border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Image Aspect Box */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px]">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-medium text-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>크게 보기</span>
                  </div>
                </div>

                {/* Card Meta */}
                <CardContent className="p-3.5 space-y-1">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="w-3 h-3 shrink-0" />
                    <span>{dateStr}</span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-1">
                      {item.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* UPLOAD PHOTO MODAL */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span>현장 사진 업로드</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            {/* Image File Selector & Preview */}
            <div className="space-y-2">
              <Label>사진 선택 (파일 선택 또는 Ctrl + V 붙여넣기)</Label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/20 transition-colors">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto object-contain border" />
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold">
                      {isPasted ? (
                        <>
                          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                          <span className="text-indigo-600">클립보드 복사한 사진(Ctrl+V) 자동 첨부 완료!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>이미지 최적화 압축 완료 (~300KB)</span>
                        </>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setIsPasted(false);
                      }}
                    >
                      다른 사진 선택
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-6 space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <span className="text-xs font-semibold text-primary block">
                      사진 파일 선택 또는 캡처 사진 Ctrl + V 붙여넣기!
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      (화면 캡처/복사한 이미지를 <b>Ctrl + V</b>로 누르면 자동으로 첨부됩니다)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-title">사진 제목 / 현장명</Label>
              <Input
                id="upload-title"
                required
                placeholder="예: 101호 외벽 창틀 점검, 옥상 방수 공사"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-category">카테고리 분류</Label>
              <div className="relative w-full">
                <select
                  id="upload-category"
                  className="w-full h-10 rounded-xl border border-input bg-background pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer shadow-xs transition-all font-medium"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                >
                  {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
                    <option key={cat} value={cat} className="py-2 text-foreground bg-background">
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-notes">현장 메모 / 특이사항 (선택)</Label>
              <Textarea
                id="upload-notes"
                rows={3}
                placeholder="시공업체명, 특이사항, 작업 상태 등을 메모해두세요"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={!previewUrl || isCompressing} className="flex-1">
                {isCompressing ? "이미지 압축 중..." : "갤러리에 저장하기"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* LIGHTBOX / FULLSCREEN PHOTO MODAL */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-slate-950 text-slate-100 border-slate-800">
          {activeItem && (
            <div className="flex flex-col md:flex-row">
              {/* Full Image */}
              <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px] md:min-h-[450px]">
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  className="max-h-[70vh] w-auto object-contain rounded"
                />
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-80 p-5 space-y-4 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900">
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {activeItem.category}
                  </Badge>
                  <h2 className="text-lg font-bold text-white leading-tight">{activeItem.title}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{activeItem.createdAt.slice(0, 10).replace(/-/g, ".")} 등록</span>
                  </p>
                </div>

                {activeItem.notes && (
                  <div className="space-y-1.5 flex-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      현장 메모
                    </h4>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {activeItem.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(activeItem)}
                    className="flex-1 gap-1.5 border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(activeItem.id)}
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
