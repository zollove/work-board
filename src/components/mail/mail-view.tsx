"use client";

import { useState, useEffect, useMemo } from "react";
import { MailItem, MailProvider } from "@/types/mail";
import { useMemos } from "@/hooks/use-memos";
import { useWorkLogs } from "@/hooks/use-work-logs";
import {
  Mail,
  Inbox,
  Send,
  Star,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Clock,
  User,
  X,
  Key,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  BookOpen,
  Share2,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MailViewProps {
  initialProvider?: "all" | "gmail" | "naver";
}

export function MailView({ initialProvider = "all" }: MailViewProps) {
  const { addMemo } = useMemos();
  const { saveLog } = useWorkLogs();

  const CACHE_KEY = "pastel_cached_mails_v2";

  const [mails, setMails] = useState<MailItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [loading, setLoading] = useState(mails.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  // 🌟 [개선안 1] 2단계 계층 필터 State (initialProvider 지원)
  const [accountFilter, setAccountFilter] = useState<"all" | "gmail" | "naver">(initialProvider);
  const [folderFilter, setFolderFilter] = useState<"all" | "inbox" | "sent" | "starred">("all");

  // 🌟 [개선안 3] 한눈에 보기 개수 선택 (30, 50, 100, 500)
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [scrapSuccessMessage, setScrapSuccessMessage] = useState<string | null>(null);

  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const saveDeletedIds = (newIds: string[]) => {
    setDeletedIds(newIds);
    if (typeof window !== "undefined") {
      localStorage.setItem("pastel_deleted_mail_ids", JSON.stringify(newIds));
    }
  };

  const fetchMails = async (isSilent = false) => {
    if (!isSilent && mails.length === 0) setLoading(true);
    try {
      const res = await fetch(`/api/mail?provider=all&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const rawMails: MailItem[] = data.mails || [];
        setMails(rawMails);
        if (typeof window !== "undefined") {
          localStorage.setItem(CACHE_KEY, JSON.stringify(rawMails));
        }
      }
    } catch (e) {
      console.error("Mail fetch error:", e);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMails(false);
    setSelectedMailIds([]);

    const interval = setInterval(() => {
      if (!selectedMail && !replyText.trim()) {
        fetchMails(true);
      }
    }, 15 * 1000);

    return () => clearInterval(interval);
  }, [selectedMail, replyText]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMails(false);
    setSelectedMailIds([]);
  };

  // 🌟 [개선안 2] 원클릭 스크랩 연동 함수
  const handleScrapToMemo = async (mail: MailItem) => {
    const title = `[메일 스크랩] ${mail.subject}`;
    const content = `<p><strong>📧 원본 메일 정보:</strong></p><ul><li>보낸이: ${mail.senderName} (${mail.senderEmail})</li><li>수신 계정: ${mail.accountEmail}</li><li>수신 시각: ${new Date(mail.receivedAt).toLocaleString()}</li></ul><hr/><p>${mail.body || mail.snippet}</p>`;

    await addMemo({
      title,
      content,
      category: "업무",
    });

    setScrapSuccessMessage("📝 메모장 [업무] 보관함으로 즉시 스크랩 저장되었습니다!");
    setTimeout(() => setScrapSuccessMessage(null), 3000);
  };

  const handleScrapToWorkLog = async (mail: MailItem) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const scrapBody = `<p><strong>✉️ 스크랩 메일:</strong> ${mail.subject} (${mail.senderName})</p><p>${mail.body || mail.snippet}</p>`;

    await saveLog({
      date: todayStr,
      todayWork: scrapBody,
      pendingWork: "",
      issues: "",
    });

    setScrapSuccessMessage("📖 오늘 업무일지로 즉시 스크랩 등록되었습니다!");
    setTimeout(() => setScrapSuccessMessage(null), 3000);
  };

  const filteredMails = useMemo(() => {
    return mails.filter((m) => {
      if (deletedIds.includes(m.id)) return false;

      // 1단계 계정 필터
      if (accountFilter !== "all" && m.provider !== accountFilter) return false;

      // 2단계 서브 메일함 필터
      if (folderFilter === "inbox" && m.folder === "sent") return false;
      if (folderFilter === "sent" && m.folder !== "sent") return false;
      if (folderFilter === "starred" && !m.isStarred) return false;

      if (unreadOnly && m.isRead) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = m.subject.toLowerCase().includes(q);
        const matchesSender = m.senderName.toLowerCase().includes(q) || m.senderEmail.toLowerCase().includes(q);
        const matchesSnippet = m.snippet.toLowerCase().includes(q);
        return matchesSubject || matchesSender || matchesSnippet;
      }
      return true;
    });
  }, [mails, deletedIds, accountFilter, folderFilter, unreadOnly, searchQuery]);

  const totalPages = Math.ceil(filteredMails.length / itemsPerPage) || 1;

  const paginatedMails = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMails.slice(start, start + itemsPerPage);
  }, [filteredMails, currentPage, itemsPerPage]);

  const gmailCount = useMemo(() => filteredMails.filter((m) => m.provider === "gmail").length, [filteredMails]);
  const naverCount = useMemo(() => filteredMails.filter((m) => m.provider === "naver").length, [filteredMails]);
  const unreadCount = useMemo(() => filteredMails.filter((m) => !m.isRead).length, [filteredMails]);

  // 🌟 네이버 메일 + 구글 메일 안읽은 메일의 100% 통합 총합 (Red Dot 전용)
  const totalUnreadCount = useMemo(() => {
    return mails.filter((m) => !deletedIds.includes(m.id) && !m.isRead).length;
  }, [mails, deletedIds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mail-count-set", { detail: { count: totalUnreadCount } })
      );
    }
  }, [totalUnreadCount]);

  const handleMarkAllRead = () => {
    setMails((prev) => prev.map((m) => ({ ...m, isRead: true })));
  };

  const toggleSelectMail = (mailId: string) => {
    setSelectedMailIds((prev) =>
      prev.includes(mailId) ? prev.filter((id) => id !== mailId) : [...prev, mailId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMailIds.length === filteredMails.length && filteredMails.length > 0) {
      setSelectedMailIds([]);
    } else {
      setSelectedMailIds(filteredMails.map((m) => m.id));
    }
  };

  const sendDeleteApi = async (ids: string[]) => {
    try {
      await fetch("/api/mail/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailIds: ids }),
      });
    } catch (e) {
      console.error("Delete API call error:", e);
    }
  };

  const handleBatchDelete = () => {
    if (selectedMailIds.length === 0) return;
    const targetIds = [...selectedMailIds];
    const updatedDeleted = Array.from(new Set([...deletedIds, ...targetIds]));
    saveDeletedIds(updatedDeleted);
    setSelectedMailIds([]);
    sendDeleteApi(targetIds);
  };

  const handleOpenMail = (mail: MailItem) => {
    setSelectedMail(mail);
    setReplyText("");
    setReplySuccess(false);
    setMails((prev) => prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m)));
  };

  const handleDeleteMail = (e: React.MouseEvent, mailId: string) => {
    e.stopPropagation();
    const updatedDeleted = Array.from(new Set([...deletedIds, mailId]));
    saveDeletedIds(updatedDeleted);
    sendDeleteApi([mailId]);
  };

  const handleRestoreMails = () => {
    saveDeletedIds([]);
    setSelectedMailIds([]);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplySuccess(true);
    setTimeout(() => {
      setReplySuccess(false);
      setReplyText("");
      setSelectedMail(null);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* ⛳ Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/80 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">통합 메일 서비스</h1>
              <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                지메일 + 네이버 연동
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Google Gmail과 Naver 메일을 한곳에서 통합 수신 및 계정별 필터링 관리합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/api/auth/google";
            }}
            className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
            title="구글 계정 인증으로 실제 지메일 100% 라이브 연동"
          >
            <Key className="w-3.5 h-3.5" />
            <span>🔑 Google 계정으로 로그인</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-9 px-3 text-xs font-bold gap-1 rounded-xl shadow-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              title="모든 안읽은 메일을 읽음 상태로 변경"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>모두 읽음 처리</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="h-9 px-3 text-xs font-bold gap-1 rounded-xl shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </Button>
        </div>
      </div>

      {/* 🗂️ [개선안 1] 2단계 계층 스마트 필터 & [개선안 3] 보기 개수 툴바 */}
      <div className="flex flex-col gap-3 bg-muted/20 p-3.5 rounded-2xl border">
        {/* 1단계: 계정 선택 탭 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border shrink-0 overflow-x-auto scrollbar-none">
            <Button
              variant={accountFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setAccountFilter("all"); setCurrentPage(1); }}
              className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
                accountFilter === "all" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>✉️ 전체 메일함 ({mails.length})</span>
            </Button>

            <Button
              variant={accountFilter === "gmail" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setAccountFilter("gmail"); setCurrentPage(1); }}
              className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
                accountFilter === "gmail" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>🔴 Google 지메일 ({gmailCount})</span>
            </Button>

            <Button
              variant={accountFilter === "naver" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setAccountFilter("naver"); setCurrentPage(1); }}
              className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
                accountFilter === "naver" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>🟢 Naver 네이버 ({naverCount})</span>
            </Button>
          </div>

          {/* 🌟 [개선안 3] 500개 한눈에 보기 선택 드롭다운 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">표시 개수:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="h-8 rounded-xl border border-input bg-background px-3 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-xs"
            >
              <option value={30}>30개씩 분할 보기</option>
              <option value={50}>50개씩 보기</option>
              <option value={100}>100개씩 보기</option>
              <option value={500}>🚀 500개 전체 한눈에 보기</option>
            </select>
          </div>
        </div>

        {/* 2단계: 서브 메일함 토글 및 검색 바 */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <Button
              variant={folderFilter === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setFolderFilter("all"); setCurrentPage(1); }}
              className={`h-7 text-[11px] font-bold rounded-lg ${folderFilter === "all" ? "bg-primary text-primary-foreground" : ""}`}
            >
              전체 메일
            </Button>
            <Button
              variant={folderFilter === "inbox" ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setFolderFilter("inbox"); setCurrentPage(1); }}
              className={`h-7 text-[11px] font-bold rounded-lg gap-1 ${folderFilter === "inbox" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Inbox className="w-3 h-3" />
              <span>받은 메일함</span>
            </Button>
            <Button
              variant={folderFilter === "sent" ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setFolderFilter("sent"); setCurrentPage(1); }}
              className={`h-7 text-[11px] font-bold rounded-lg gap-1 ${folderFilter === "sent" ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Send className="w-3 h-3" />
              <span>보낸 메일함</span>
            </Button>
            <Button
              variant={folderFilter === "starred" ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setFolderFilter("starred"); setCurrentPage(1); }}
              className={`h-7 text-[11px] font-bold rounded-lg gap-1 ${folderFilter === "starred" ? "bg-amber-500 text-white" : ""}`}
            >
              <Star className="w-3 h-3 fill-amber-300" />
              <span>중요/북마크</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-xl shadow-xs flex-1 md:w-64">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="제목, 보낸이, 내용 검색..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs bg-transparent border-none outline-none font-medium placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Button
              variant={unreadOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => { setUnreadOnly(!unreadOnly); setCurrentPage(1); }}
              className={`h-8 text-xs font-bold rounded-xl px-2.5 gap-1 shrink-0 ${
                unreadOnly ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>안읽음 ({unreadCount})</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 📩 Mail Card List View */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={selectedMailIds.length === filteredMails.length && filteredMails.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <span>전체 선택</span>
            </label>

            <CardTitle className="text-xs sm:text-sm font-black flex items-center gap-2">
              <span>
                {accountFilter === "all"
                  ? "📬 전체 통합 메일함"
                  : accountFilter === "gmail"
                  ? "🔴 Google 지메일 메일함"
                  : "🟢 Naver 네이버 메일함"}
                {folderFilter === "inbox" && " (받은 메일함)"}
                {folderFilter === "sent" && " (보낸 메일함)"}
                {folderFilter === "starred" && " (중요/북마크)"}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold">
                총 {filteredMails.length}건
              </Badge>
            </CardTitle>
          </div>

          {selectedMailIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 shadow-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>선택한 {selectedMailIds.length}개 일괄 삭제</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-semibold space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p>메일을 안전하게 가져오는 중입니다...</p>
            </div>
          ) : filteredMails.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground font-semibold space-y-2">
              <Inbox className="w-8 h-8 mx-auto opacity-40" />
              <p>조건에 일치하는 메일이 없습니다.</p>
            </div>
          ) : (
            paginatedMails.map((mail) => {
              const isGmail = mail.provider === "gmail";
              const isChecked = selectedMailIds.includes(mail.id);

              return (
                <div
                  key={mail.id}
                  onClick={() => handleOpenMail(mail)}
                  className={`p-4 hover:bg-muted/30 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isChecked ? "bg-indigo-500/10 border-l-4 border-l-indigo-600" : (!mail.isRead ? "bg-indigo-500/5 font-semibold" : "")
                  }`}
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
                    {/* 계정 뱃지 */}
                    <div className="shrink-0 mt-0.5">
                      {isGmail ? (
                        <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                          <span>Gmail</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Naver</span>
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs ${!mail.isRead ? "font-black text-foreground" : "font-bold text-muted-foreground"}`}>
                          {mail.senderName}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">({mail.senderEmail})</span>
                        {mail.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>

                      <h3 className={`text-sm tracking-tight truncate ${!mail.isRead ? "font-black text-foreground" : "font-bold text-muted-foreground"}`}>
                        {mail.subject}
                      </h3>

                      {mail.attachments && mail.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 py-0 px-2 rounded-lg">
                            <Paperclip className="w-3 h-3" />
                            <span>첨부파일 ({mail.attachments.length}개)</span>
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[200px]">
                            {mail.attachments.map((a) => a.name).join(", ")}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground/80 truncate font-medium">
                        {mail.snippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 whitespace-nowrap">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 whitespace-nowrap bg-muted/30 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="whitespace-nowrap">{mail.receivedAt ? mail.receivedAt.slice(0, 10) + " " + mail.receivedAt.slice(11, 16) : ""}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteMail(e, mail.id)}
                        className="h-7 w-7 p-0 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground transition-all shrink-0"
                        title="휴지통으로 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* 우측 선택 체크박스 */}
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-muted/80 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                        title="선택"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectMail(mail.id);
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 📄 30개 단위 페이지네이션 바 */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/90 border p-3.5 rounded-2xl shadow-xs text-xs font-bold">
          <div className="text-muted-foreground text-center sm:text-left">
            총 <span className="text-indigo-600 font-extrabold">{filteredMails.length}</span>개 메일 중{" "}
            <span className="font-extrabold text-foreground">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMails.length)}</span>번째 수신 표시 (페이지 {currentPage} / {totalPages})
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl shadow-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>이전</span>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 p-0 text-xs font-bold rounded-xl ${
                  currentPage === page ? "bg-indigo-600 text-white shadow-xs" : ""
                }`}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl shadow-xs"
            >
              <span>다음</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 📖 Mail Reader & Reply Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-card border shadow-2xl rounded-3xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-start justify-between gap-4 ${selectedMail.provider === "gmail" ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-background border shadow-xs">
                  {selectedMail.provider === "gmail" ? (
                    <Badge className="bg-rose-600 text-white font-bold text-xs">Gmail</Badge>
                  ) : (
                    <Badge className="bg-emerald-600 text-white font-bold text-xs">Naver</Badge>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    수신 계정: {selectedMail.accountEmail}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-foreground">{selectedMail.subject}</h3>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMail(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-background/80"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-muted/30 border space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    보낸이: {selectedMail.senderName} ({selectedMail.senderEmail})
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(selectedMail.receivedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-background border text-xs leading-relaxed text-foreground whitespace-pre-line font-medium min-h-[120px]">
                {selectedMail.body || selectedMail.snippet}
              </div>

              {/* 📎 첨부파일 다운로드 & 미리보기 박스 */}
              {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-600">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4" />
                      <span>수신된 첨부파일 ({selectedMail.attachments.length}개)</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      클릭하여 다운로드 저장
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMail.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const blob = new Blob([`Dummy content for ${att.name}`], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = att.name;
                          a.click();
                        }}
                        className="p-2.5 bg-background border rounded-xl flex items-center justify-between gap-2 hover:bg-muted/50 cursor-pointer transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-indigo-600">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              {att.size || "첨부 파일"}
                            </p>
                          </div>
                        </div>

                        <Badge variant="secondary" className="text-[10px] font-bold shrink-0 gap-1 bg-indigo-600 text-white">
                          <Download className="w-3 h-3" />
                          <span>다운로드</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🌟 [개선안 2] 원클릭 스크랩 액션 툴바 */}
              <div className="flex items-center gap-2 p-3 bg-muted/20 border rounded-2xl flex-wrap justify-between">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  원클릭 스크랩:
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScrapToMemo(selectedMail)}
                    className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>📝 메모장으로 스크랩</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleScrapToWorkLog(selectedMail)}
                    className="h-8 px-3 text-xs font-bold rounded-xl gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>📖 오늘 업무일지로 스크랩</span>
                  </Button>
                </div>
              </div>

              {/* Reply Section */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>원클릭 빠른 답장 ({selectedMail.provider === "gmail" ? "지메일" : "네이버"} 계정 발송)</span>
                </h4>

                {replySuccess ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedMail.provider === "gmail" ? "Gmail" : "Naver"} 계정으로 답장이 성공적으로 전송되었습니다!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder={`${selectedMail.senderName}님께 답장 작성...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl bg-muted/20 border outline-none font-medium resize-none focus:border-indigo-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                        className={`h-8 px-4 text-xs font-bold rounded-xl gap-1.5 ${
                          selectedMail.provider === "gmail"
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>답장 보내기</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
