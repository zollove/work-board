"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/hooks/use-memos";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Table as TableIcon,
  Highlighter,
  Palette,
  Quote,
  Code,
  Link as LinkIcon,
  RemoveFormatting,
  Image as ImageIcon,
} from "lucide-react";

interface MemoRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function MemoRichEditor({ value, onChange, placeholder }: MemoRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize internal contentEditable HTML with external value prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command: string, valueArg: string = "") => {
    document.execCommand(command, false, valueArg);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertTable = () => {
    const tableHTML = `
      <div style="overflow-x: auto; margin: 8px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">구분</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">항목</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">내용 1</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">세부사항 1</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">-</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">내용 2</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">세부사항 2</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">-</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    exec("insertHTML", tableHTML);
  };

  const insertLink = () => {
    const url = prompt("링크 주소(URL)를 입력하세요 (예: https://...)", "https://");
    if (url && url !== "https://") {
      exec("createLink", url);
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary/40 transition-all">
      {/* 🛠️ Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-muted/40 text-muted-foreground select-none">
        {/* Text Style Group */}
        <div className="flex items-center gap-0.5 border-r pr-1 mr-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("bold")}
            className="h-7 w-7 p-0"
            title="볼드 (굵게)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("italic")}
            className="h-7 w-7 p-0"
            title="이탈릭 (기울임)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("underline")}
            className="h-7 w-7 p-0"
            title="밑줄"
          >
            <Underline className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("strikeThrough")}
            className="h-7 w-7 p-0"
            title="취소선"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Headings Group */}
        <div className="flex items-center gap-0.5 border-r pr-1 mr-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("formatBlock", "<h1>")}
            className="h-7 w-7 p-0 font-extrabold text-xs"
            title="대제목 (H1)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("formatBlock", "<h2>")}
            className="h-7 w-7 p-0 font-bold text-xs"
            title="소제목 (H2)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Colors & Highlight */}
        <div className="flex items-center gap-0.5 border-r pr-1 mr-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("hiliteColor", "#fef08a")}
            className="h-7 w-7 p-0 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950"
            title="노란색 형광펜 하이라이트"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("foreColor", "#ef4444")}
            className="h-7 w-7 p-0 text-red-500"
            title="빨간색 글자"
          >
            <Palette className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("foreColor", "#2563eb")}
            className="h-7 w-7 p-0 text-blue-500"
            title="파란색 글자"
          >
            <Palette className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* List Group */}
        <div className="flex items-center gap-0.5 border-r pr-1 mr-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("insertUnorderedList")}
            className="h-7 w-7 p-0"
            title="점 목록"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("insertOrderedList")}
            className="h-7 w-7 p-0"
            title="번호 목록"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Special Insertions: Table, Quote, Code, Link */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertTable}
            className="h-7 px-1.5 text-xs font-bold gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
            title="표(Table) 작성 삽입"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>표 삽입</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("formatBlock", "<blockquote>")}
            className="h-7 w-7 p-0"
            title="인용구 박스"
          >
            <Quote className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-7 w-7 p-0"
            title="링크 삽입"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>

          {/* 📷 Inline Photo Insertion Button */}
          <label
            htmlFor="inline-editor-photo-input"
            className="h-7 px-1.5 text-xs font-bold gap-1 inline-flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded cursor-pointer transition-colors"
            title="본문에 사진 삽입"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>사진</span>
          </label>
          <input
            id="inline-editor-photo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const compressed = await compressImage(file);
                exec("insertHTML", `<img src="${compressed}" style="max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; border: 1px solid rgba(0,0,0,0.1); display: block;" alt="메모 사진" />`);
              } catch (err) {
                console.error("Inline photo insert error:", err);
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => exec("removeFormat")}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="서식 초기화"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ✍️ ContentEditable Rich Text Area with Image Paste & Drag/Drop */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={async (e) => {
          const items = e.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                  try {
                    const compressed = await compressImage(file);
                    exec("insertHTML", `<img src="${compressed}" style="max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; border: 1px solid rgba(0,0,0,0.1); display: block;" alt="붙여넣은 사진" />`);
                  } catch (err) {
                    console.error("Paste image error:", err);
                  }
                }
              }
            }
          }
        }}
        onDrop={async (e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            try {
              const compressed = await compressImage(file);
              exec("insertHTML", `<img src="${compressed}" style="max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; border: 1px solid rgba(0,0,0,0.1); display: block;" alt="드롭 사진" />`);
            } catch (err) {
              console.error("Drop image error:", err);
            }
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        className="p-3.5 sm:p-5 min-h-[180px] sm:min-h-[280px] md:min-h-[360px] max-h-[520px] overflow-y-auto text-xs sm:text-sm focus:outline-none leading-relaxed prose prose-sm dark:prose-invert max-w-full break-all"
        style={{ minHeight: "220px" }}
      />
    </div>
  );
}
