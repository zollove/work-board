"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useMemos } from "@/hooks/use-memos";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  HardDrive,
  Folder,
  FolderPlus,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronRight,
  Home,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  StickyNote,
  BookmarkPlus,
  Eye,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  GripVertical,
  ArrowRight,
  Pencil,
} from "lucide-react";

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: number;
  formattedSize: string;
  modifiedTime: string;
  formattedDate: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  parents?: string[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function DriveView() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Navigation / Folder Breadcrumb Stack
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: "root", name: "내 드라이브" }]);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<DriveFileItem | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);

  // Modals state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<DriveFileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const [selectedFileForDetail, setSelectedFileForDetail] = useState<DriveFileItem | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMemo } = useMemos();

  // Check Google Auth Status
  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/auth/google/status?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setIsConnected(data.isConnected);
      setUserEmail(data.email || "");
      if (data.isConnected) {
        fetchFiles(currentFolderId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setIsConnected(false);
      setLoading(false);
    }
  };

  // Fetch Drive Files for current folder
  const fetchFiles = async (folderId: string = "root", isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}&_t=${Date.now()}`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        setIsConnected(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error("Drive files error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Handle Google Login
  const handleConnectGoogle = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      alert("구글 로그인 연결에 실패했습니다.");
    }
  };

  // Open / Enter Folder
  const handleEnterFolder = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    fetchFiles(folder.id);
  };

  // Navigate back to breadcrumb
  const handleJumpToBreadcrumb = (index: number) => {
    const target = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(target.id);
    fetchFiles(target.id);
  };

  // Create New Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const res = await fetch("/api/drive/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      });

      if (!res.ok) throw new Error("폴더 생성 실패");

      setIsNewFolderOpen(false);
      setNewFolderName("");
      setActionToast("📁 새 폴더가 성공적으로 생성되었습니다.");
      setTimeout(() => setActionToast(null), 3000);
      fetchFiles(currentFolderId, true);
    } catch (err) {
      alert("폴더 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Open Rename Dialog
  const handleOpenRename = (item: DriveFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRenameTarget(item);
    setRenameValue(item.name);
  };

  // Submit Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    setRenaming(true);
    const newName = renameValue.trim();

    try {
      const res = await fetch(`/api/drive/files/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error("이름 변경 실패");

      // Optimistic UI update
      setFiles((prev) =>
        prev.map((f) => (f.id === renameTarget.id ? { ...f, name: newName } : f))
      );

      if (selectedFileForDetail?.id === renameTarget.id) {
        setSelectedFileForDetail((prev) => (prev ? { ...prev, name: newName } : null));
      }

      setRenameTarget(null);
      setActionToast(`✏️ '${newName}'(으)로 이름이 변경되었습니다!`);
      setTimeout(() => setActionToast(null), 3000);
    } catch (err) {
      alert("이름 변경 중 오류가 발생했습니다.");
    } finally {
      setRenaming(false);
    }
  };

  // Upload File to specific folder
  const handleFileUpload = async (filesToUpload: FileList | null, targetFolderId: string = currentFolderId) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`(${i + 1}/${filesToUpload.length}) ${file.name} 업로드 중...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("parentId", targetFolderId);

        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            alert("구글 드라이브 권한이 필요합니다. 우측 상단 '연동 해제'를 누른 뒤 다시 구글 연결을 진행해 주세요!");
            return;
          }
          alert(`'${file.name}' 업로드 실패: ${data.error || data.message || "서버 오류"}`);
          return;
        }
      }

      setActionToast(`📤 ${filesToUpload.length}개 파일이 구글 드라이브에 성공적으로 업로드되었습니다!`);
      setTimeout(() => setActionToast(null), 3500);
      fetchFiles(currentFolderId, true);
    } catch (err) {
      console.error(err);
      alert("파일 업로드 중 통신 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Move File into Target Folder via Drag & Drop
  const handleMoveFileToFolder = async (fileToMove: DriveFileItem, targetFolder: DriveFileItem) => {
    if (fileToMove.id === targetFolder.id) return;

    // Optimistically remove from current list
    setFiles((prev) => prev.filter((f) => f.id !== fileToMove.id));

    try {
      const res = await fetch(`/api/drive/files/${fileToMove.id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetFolderId: targetFolder.id,
          currentFolderId: currentFolderId,
        }),
      });

      if (!res.ok) {
        throw new Error("이동 실패");
      }

      setActionToast(`📦 '${fileToMove.name}' 파일이 '${targetFolder.name}' 폴더로 이동되었습니다!`);
      setTimeout(() => setActionToast(null), 3000);
    } catch (e) {
      alert("파일 이동 중 오류가 발생했습니다.");
      fetchFiles(currentFolderId, true);
    } finally {
      setDraggedItem(null);
      setDragOverFolderId(null);
    }
  };

  // Drag Handlers
  const handleItemDragStart = (e: React.DragEvent, item: DriveFileItem) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragOver = (e: React.DragEvent, folder: DriveFileItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem && draggedItem.id === folder.id) return;
    setDragOverFolderId(folder.id);
    e.dataTransfer.dropEffect = "move";
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folder: DriveFileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    // Case 1: External files dropped from desktop/OS
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, folder.id);
      return;
    }

    // Case 2: Internal file dragged into this folder
    if (draggedItem && draggedItem.id !== folder.id) {
      handleMoveFileToFolder(draggedItem, folder);
    }
  };

  // Global Dropzone (Drop to current folder)
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragOver(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragOver(false);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, currentFolderId);
    }
  };

  // Delete File / Folder (Move to Google Drive Trash)
  const handleDeleteItem = async (item: DriveFileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`'${item.name}' 항목을 구글 드라이브 휴지통으로 이동하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/drive/files/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");

      setFiles((prev) => prev.filter((f) => f.id !== item.id));
      if (selectedFileForDetail?.id === item.id) {
        setSelectedFileForDetail(null);
      }

      setActionToast(`🗑️ '${item.name}' 항목이 휴지통으로 이동되었습니다.`);
      setTimeout(() => setActionToast(null), 3000);
    } catch (err) {
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  // Save File Link to Memos
  const handleSaveToMemo = async (file: DriveFileItem) => {
    try {
      const linkHtml = file.webViewLink
        ? `<p>🔗 <a href="${file.webViewLink}" target="_blank" rel="noopener noreferrer">${file.name} (구글 드라이브 열기)</a></p>`
        : `<p>📁 파일명: ${file.name} (${file.formattedSize})</p>`;

      await addMemo({
        title: `[드라이브 파일] ${file.name}`,
        category: "일반",
        content: `<p><strong>파일 크기:</strong> ${file.formattedSize}</p><p><strong>최종 수정:</strong> ${file.formattedDate}</p>${linkHtml}`,
      });
      setActionToast("✅ '메모'의 일반 보관함에 저장되었습니다!");
      setTimeout(() => setActionToast(null), 3000);
    } catch (e) {
      alert("메모 저장 중 오류가 발생했습니다.");
    }
  };

  // Save File Link to Knowledge Vault
  const handleSaveToKnowledge = async (file: DriveFileItem) => {
    try {
      const linkHtml = file.webViewLink
        ? `<p>🔗 <a href="${file.webViewLink}" target="_blank" rel="noopener noreferrer">${file.name} (구글 드라이브 열기)</a></p>`
        : `<p>📁 파일명: ${file.name} (${file.formattedSize})</p>`;

      await addMemo({
        title: `[드라이브 자료] ${file.name}`,
        category: "노하우",
        content: `<p><strong>파일 크기:</strong> ${file.formattedSize}</p><p><strong>최종 수정:</strong> ${file.formattedDate}</p>${linkHtml}`,
      });
      setActionToast("✅ '지식창고'의 노하우 보관함에 저장되었습니다!");
      setTimeout(() => setActionToast(null), 3000);
    } catch (e) {
      alert("지식창고 저장 중 오류가 발생했습니다.");
    }
  };

  // Filtered Files by Search Query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // Render File Icon
  const getFileIcon = (file: DriveFileItem) => {
    if (file.isFolder) {
      return <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20 shrink-0" />;
    }
    const mime = file.mimeType.toLowerCase();
    if (mime.includes("pdf")) {
      return <FileText className="w-8 h-8 text-rose-500 shrink-0" />;
    }
    if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />;
    }
    if (mime.includes("image")) {
      return <FileImage className="w-8 h-8 text-blue-500 shrink-0" />;
    }
    if (mime.includes("zip") || mime.includes("tar") || mime.includes("rar")) {
      return <FileArchive className="w-8 h-8 text-amber-600 shrink-0" />;
    }
    if (mime.includes("document") || mime.includes("word") || mime.includes("text")) {
      return <FileText className="w-8 h-8 text-indigo-500 shrink-0" />;
    }
    return <File className="w-8 h-8 text-muted-foreground shrink-0" />;
  };

  // UNCONNECTED STATE
  if (isConnected === false) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 text-center py-16">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <HardDrive className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">구글 드라이브(Google Drive) 연동</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            내 구글 계정을 연결하여 드라이브 내 폴더/파일을 실시간으로 탐색하고, 파일 이름 수정, 드래그&드롭 파일 이동, 업로드, 다운로드, 삭제 및 메모 연동을 손쉽게 이용하세요.
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card/60 space-y-4 max-w-md mx-auto shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>안전한 Google 공식 OAuth 2.0 보안 인증</span>
          </div>

          <Button
            onClick={handleConnectGoogle}
            className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-sm shadow-md transition-all active:scale-98"
          >
            <HardDrive className="w-4 h-4" />
            <span>내 구글 드라이브 1초 연결하기</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className={`p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12 min-h-screen transition-colors ${
        isGlobalDragOver ? "bg-amber-500/5 ring-4 ring-amber-500/30 ring-inset rounded-2xl" : ""
      }`}
    >
      {/* 📁 Hidden File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files, currentFolderId)}
        className="hidden"
      />

      {/* 📁 Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/70 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>구글 드라이브 (Drive)</span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold">
                연결됨
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5" />
              <span>{userEmail || "Google 계정 연동 중"}</span>
            </p>
          </div>
        </div>

        {/* Top Actions: Upload, New Folder, Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <Upload className={`w-3.5 h-3.5 ${uploading ? "animate-bounce" : ""}`} />
            <span>{uploading ? "업로드 중..." : "파일 업로드"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderOpen(true)}
            className="h-9 px-3.5 text-xs font-bold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>새 폴더</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFiles(currentFolderId, true)}
            disabled={refreshing || loading}
            className="h-9 px-3 text-xs font-bold gap-1 shadow-xs"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Action Toast Alert */}
      {actionToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-in fade-in duration-200 flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Upload Progress Banner */}
      {uploading && uploadProgress && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs font-bold text-amber-600 text-center flex items-center justify-center gap-2 shadow-xs animate-pulse">
          <Upload className="w-4 h-4 text-amber-600 animate-bounce" />
          <span>{uploadProgress}</span>
        </div>
      )}


      {/* 🧭 Breadcrumb & Search & View Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 text-xs sm:text-sm font-semibold">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              <button
                onClick={() => handleJumpToBreadcrumb(idx)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors shrink-0 ${
                  idx === breadcrumbs.length - 1
                    ? "font-black text-foreground bg-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {idx === 0 ? <Home className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                <span>{crumb.name}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <div className="relative flex-1 min-w-0 sm:w-56 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="파일 / 폴더 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs rounded-xl bg-background shadow-xs w-full"
            />
          </div>

          <div className="flex items-center border rounded-xl p-0.5 bg-background shrink-0 shadow-xs">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 p-0"
              title="그리드 뷰"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 w-7 p-0"
              title="목록 뷰"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 📁 Files & Folders List */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">구글 드라이브 파일을 불러오는 중입니다...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl space-y-3 bg-muted/10">
          <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-bold text-muted-foreground">이 폴더에 파일이 없습니다.</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            className="gap-1.5 h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Upload className="w-3.5 h-3.5" /> 첫 파일 업로드하기
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW (with Folder Drag & Drop target and Rename button) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredFiles.map((file) => {
            const isDragTarget = file.isFolder && dragOverFolderId === file.id;

            return (
              <Card
                key={file.id}
                draggable={!file.isFolder}
                onDragStart={(e) => handleItemDragStart(e, file)}
                onDragOver={file.isFolder ? (e) => handleFolderDragOver(e, file) : undefined}
                onDragLeave={file.isFolder ? handleFolderDragLeave : undefined}
                onDrop={file.isFolder ? (e) => handleFolderDrop(e, file) : undefined}
                onClick={() => {
                  if (file.isFolder) handleEnterFolder(file);
                  else setSelectedFileForDetail(file);
                }}
                className={`group overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                  isDragTarget
                    ? "ring-4 ring-amber-500 bg-amber-500/20 scale-105 shadow-xl border-amber-500"
                    : file.isFolder
                    ? "bg-card hover:bg-amber-500/5 hover:border-amber-500/50"
                    : "bg-card hover:bg-muted/30 hover:border-amber-500/50"
                } ${draggedItem?.id === file.id ? "opacity-40 ring-2 ring-dashed ring-amber-500" : ""}`}
              >
                {/* Thumbnail / Icon Area */}
                <div className="p-4 flex flex-col items-center justify-center min-h-[110px] bg-muted/20 relative">
                  {file.thumbnailLink ? (
                    <img
                      src={file.thumbnailLink}
                      alt={file.name}
                      className="max-h-20 w-auto object-contain rounded shadow-xs"
                    />
                  ) : (
                    getFileIcon(file)
                  )}

                  {/* Drag Indicator Overlay for Folder */}
                  {isDragTarget && (
                    <div className="absolute inset-0 bg-amber-500/30 backdrop-blur-xs flex items-center justify-center font-black text-xs text-amber-900 dark:text-amber-100 gap-1 animate-pulse">
                      <ArrowRight className="w-4 h-4" />
                      <span>여기에 놓기</span>
                    </div>
                  )}

                  {/* Quick Action Top Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenRename(file, e)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-md"
                      title="이름 수정"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteItem(file, e)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                      title="휴지통으로 이동"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Info Bottom Area */}
                <div className="p-3 border-t space-y-1">
                  <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2 break-all" title={file.name}>
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-0.5">
                    <span>{file.formattedSize}</span>
                    <span>{file.formattedDate.slice(0, 10)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW (with Folder Drag & Drop target and Rename button) */
        <div className="space-y-1.5">
          {filteredFiles.map((file) => {
            const isDragTarget = file.isFolder && dragOverFolderId === file.id;

            return (
              <div
                key={file.id}
                draggable={!file.isFolder}
                onDragStart={(e) => handleItemDragStart(e, file)}
                onDragOver={file.isFolder ? (e) => handleFolderDragOver(e, file) : undefined}
                onDragLeave={file.isFolder ? handleFolderDragLeave : undefined}
                onDrop={file.isFolder ? (e) => handleFolderDrop(e, file) : undefined}
                onClick={() => {
                  if (file.isFolder) handleEnterFolder(file);
                  else setSelectedFileForDetail(file);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 hover:shadow-xs group ${
                  isDragTarget
                    ? "ring-2 ring-amber-500 bg-amber-500/20 scale-[1.01] border-amber-500 font-bold"
                    : file.isFolder
                    ? "bg-card hover:bg-amber-500/5 hover:border-amber-500/50"
                    : "bg-card hover:bg-muted/30 hover:border-amber-500/50"
                } ${draggedItem?.id === file.id ? "opacity-40 ring-2 ring-dashed ring-amber-500" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {!file.isFolder && (
                    <span className="text-muted-foreground/40 hover:text-amber-600 cursor-grab active:cursor-grabbing p-0.5" title="드래그하여 폴더로 이동">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="shrink-0">{getFileIcon(file)}</div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">{file.name}</h3>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                      <span>{file.formattedSize}</span>
                      <span>•</span>
                      <span>{file.formattedDate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleOpenRename(file, e)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 rounded-lg"
                    title="이름 수정"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>

                  {!file.isFolder && (
                    <a
                      href={`/api/drive/download/${file.id}?filename=${encodeURIComponent(
                        file.name
                      )}&mimeType=${encodeURIComponent(file.mimeType)}`}
                      download={file.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-muted-foreground hover:text-amber-600 rounded-lg hover:bg-muted"
                      title="다운로드"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteItem(file, e)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                    title="휴지통으로 이동"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✏️ MODAL: RENAME FILE/FOLDER */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />
              <span>{renameTarget?.isFolder ? "폴더 이름 수정" : "파일 이름 수정"}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">새 이름 입력</Label>
              <Input
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setRenameTarget(null)} className="text-xs">
                취소
              </Button>
              <Button
                type="submit"
                disabled={renaming}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
              >
                {renaming ? "수정 중..." : "이름 변경 완료"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 📁 MODAL: NEW FOLDER CREATION */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-600" />
              <span>새 폴더 만들기</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateFolder} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">폴더 이름</Label>
              <Input
                required
                placeholder="새 폴더 이름 입력"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-10 text-xs sm:text-sm rounded-xl"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsNewFolderOpen(false)} className="text-xs">
                취소
              </Button>
              <Button
                type="submit"
                disabled={creatingFolder}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
              >
                {creatingFolder ? "생성 중..." : "폴더 만들기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 📄 MODAL: FILE DETAIL & ACTION VIEWER */}
      <Dialog open={!!selectedFileForDetail} onOpenChange={(open) => !open && setSelectedFileForDetail(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl p-0 overflow-hidden rounded-2xl bg-card border shadow-2xl">
          {selectedFileForDetail && (
            <>
              <div className="p-5 border-b bg-muted/20 space-y-2 pr-12">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(selectedFileForDetail)}
                    <h2 className="text-base sm:text-lg font-black leading-snug break-all truncate">
                      {selectedFileForDetail.name}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRename(selectedFileForDetail)}
                    className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10 shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>이름 수정</span>
                  </Button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span>
                    <strong>크기:</strong> {selectedFileForDetail.formattedSize}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>수정일:</strong> {selectedFileForDetail.formattedDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="p-5 space-y-3 bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`/api/drive/download/${selectedFileForDetail.id}?filename=${encodeURIComponent(
                      selectedFileForDetail.name
                    )}&mimeType=${encodeURIComponent(selectedFileForDetail.mimeType)}`}
                    download={selectedFileForDetail.name}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>내 컴퓨터로 다운로드</span>
                  </a>

                  {selectedFileForDetail.webViewLink && (
                    <a
                      href={selectedFileForDetail.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-xs border border-input bg-card hover:bg-muted text-foreground shadow-xs transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <span>구글 드라이브에서 열기</span>
                    </a>
                  )}
                </div>

                {/* Scrap to Memo / Knowledge */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveToMemo(selectedFileForDetail)}
                    className="flex-1 h-9 text-xs font-bold gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 rounded-xl"
                  >
                    <StickyNote className="w-3.5 h-3.5" /> 메모로 저장
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveToKnowledge(selectedFileForDetail)}
                    className="flex-1 h-9 text-xs font-bold gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 rounded-xl"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" /> 지식창고 스크랩
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(selectedFileForDetail)}
                    className="h-9 px-3 text-xs text-rose-600 hover:bg-rose-500/10 font-bold rounded-xl"
                    title="휴지통 이동"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
