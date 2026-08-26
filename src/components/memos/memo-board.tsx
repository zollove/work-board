"use client";

import { useState } from "react";
import { useMemos } from "@/hooks/use-memos";
import { Memo, MemoCategory } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const categories: MemoCategory[] = ["업무", "중요", "일반", "생활", "아이디어", "노하우", "링크"];

export function MemoBoard() {
  const { memos, addMemo, updateMemo, deleteMemo } = useMemos();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MemoCategory | "전체">("전체");
  const [isOpen, setIsOpen] = useState(false);
  const [editMemo, setEditMemo] = useState<Memo | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "일반" as MemoCategory,
  });

  const filteredMemos = memos.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "전체" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMemo) {
      updateMemo(editMemo.id, formData);
    } else {
      addMemo(formData);
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", category: "일반" });
    setEditMemo(null);
  };

  const openEdit = (memo: Memo) => {
    setEditMemo(memo);
    setFormData({
      title: memo.title,
      content: memo.content,
      category: (memo.category as MemoCategory) || "일반",
    });
    setIsOpen(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "긴급": return "destructive";
      case "중요": return "default";
      case "아이디어": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full">
          <Input
            placeholder="메모 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-[120px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
          >
            <option value="전체">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Button onClick={() => { resetForm(); setIsOpen(true); }}>+ 새 메모</Button>
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMemo ? "메모 수정" : "새 메모 작성"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MemoCategory })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editMemo ? "수정하기" : "저장하기"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMemos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            표시할 메모가 없습니다.
          </div>
        ) : (
          filteredMemos.map((memo) => (
            <Card key={memo.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={getCategoryColor(memo.category)}>{memo.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(memo.createdAt), "yy.MM.dd", { locale: ko })}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2 line-clamp-1">{memo.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {memo.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2 border-t mt-auto">
                <Button variant="ghost" size="sm" onClick={() => openEdit(memo)}>수정</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteMemo(memo.id)}>삭제</Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
