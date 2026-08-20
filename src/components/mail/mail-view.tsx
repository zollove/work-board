"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMemos } from "@/hooks/use-memos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Mail,
  Search,
  RefreshCw,
  ExternalLink,
  BookmarkPlus,
  StickyNote,
  Paperclip,
  CheckCircle,
  LogOut,
  Sparkles,
  Inbox,
  Clock,
  User,
  Star,
  ShieldCheck,
  AlertCircle,
  Download,
  Trash2,
  Reply,
  Send,
  CornerUpLeft,
} from "lucide-react";

interface MailItem {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  timeAgo: string;
  snippet: string;
  isUnread: boolean;
  hasAttachment: boolean;
  labels: string[];
}

interface MailDetail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  htmlBody: string;
  textBody: string;
  snippet: string;
  attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[];
}

export function MailView() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"inbox" | "sent" | "unread" | "all">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMailDetail, setActiveMailDetail] = useState<MailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Reply Form State
  const [isReplying, setIsReplying] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);

  const { addMemo } = useMemos();

  // Check Connection Status
  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/auth/google/status?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setIsConnected(data.isConnected);
      setUserEmail(data.email || "");
      if (data.isConnected) {
        fetchMails();
      } else {
        setLoading(false);
      }
    } catch (e) {
      setIsConnected(false);
      setLoading(false);
    }
  };

  // Fetch Mails from Gmail API
  const fetchMails = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/mail?_t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401) {
        setIsConnected(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const data = await res.json();
      if (data.mails) {
        setMails(data.mails);
        const unreadCount = data.mails.filter((m: MailItem) => m.isUnread).length;
        window.dispatchEvent(new CustomEvent("mail-count-set", { detail: { count: unreadCount } }));
      }
    } catch (e) {
      console.error("Mail fetch error:", e);
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

  // Handle Logout
  const handleDisconnect = async () => {
    if (!confirm("구글 메일 연동을 해제하시겠습니까?")) return;
    try {
      await fetch("/api/auth/google/logout", { method: "POST" });
      setIsConnected(false);
      setUserEmail("");
      setMails([]);
    } catch (e) {}
  };

  // Open Mail Detail & Mark as Read
  const handleOpenDetail = async (mail: MailItem) => {
    setIsReplying(false);
    // Optimistically mark as read in local UI (0.001s instant reaction)
    if (mail.isUnread) {
      setMails((prev) =>
        prev.map((m) =>
          m.id === mail.id
            ? { ...m, isUnread: false, labels: m.labels.filter((l) => l !== "UNREAD") }
            : m
        )
      );
      // Instant optimistic local badge decrement
      window.dispatchEvent(new Event("mail-count-decrement"));

      // Notify Gmail API in background
      fetch(`/api/mail/${mail.id}`, { method: "POST" }).catch(() => {});
    }

    setDetailLoading(true);
    setActiveMailDetail(null);
    try {
      const res = await fetch(`/api/mail/${mail.id}`);
      const data = await res.json();
      setActiveMailDetail(data);
    } catch (e) {
      console.error("Detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Reply Box
  const handleStartReply = () => {
    if (!activeMailDetail) return;
    const fromMatch = activeMailDetail.from.match(/<([^>]+)>/) || [null, activeMailDetail.from];
    const targetEmail = fromMatch[1] ? fromMatch[1].trim() : activeMailDetail.from;

    setReplyTo(targetEmail);
    setReplySubject(
      activeMailDetail.subject.startsWith("Re:") ? activeMailDetail.subject : `Re: ${activeMailDetail.subject}`
    );
    setReplyBody("");
    setIsReplying(true);
  };

  // Send Reply
  const handleSendReply = async () => {
    if (!replyBody.trim()) {
      alert("답장 내용을 입력해주세요.");
      return;
    }

    setReplySending(true);
    try {
      const res = await fetch("/api/mail/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          body: replyBody,
          threadId: activeMailDetail?.threadId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          alert("구글 메일 발송 권한이 필요합니다. 우측 상단에서 '연동 해제' 후 다시 구글 연결을 진행해 주세요!");
        } else {
          alert(`메일 전송 실패: ${data.message || data.error || "알 수 없는 오류"}`);
        }
        return;
      }

      setActionToast("✈️ 답장 메일이 성공적으로 전송되었습니다!");
      setIsReplying(false);
      setReplyBody("");
      setTimeout(() => setActionToast(null), 3500);
    } catch (e) {
      alert("메일 전송 중 통신 오류가 발생했습니다.");
    } finally {
      setReplySending(false);
    }
  };

  // Trash Mail (Move to Trash)
  const handleTrashMail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("이 메일을 구글 메일 휴지통으로 이동하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/mail/${id}/trash`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          alert("구글 메일 수정 권한이 필요합니다. 우측 상단에서 '연동 해제' 후 다시 구글 연결을 진행해 주세요!");
        } else {
          alert(`휴지통 이동 실패: ${data.message || data.error || "알 수 없는 오류"}`);
        }
        return;
      }

      const trashedMail = mails.find((m) => m.id === id);
      // Successfully trashed in Gmail -> Remove from UI list
      setMails((prev) => prev.filter((m) => m.id !== id));
      if (activeMailDetail?.id === id) {
        setActiveMailDetail(null);
      }

      if (trashedMail?.isUnread) {
        window.dispatchEvent(new Event("mail-count-decrement"));
      } else {
        window.dispatchEvent(new Event("mail-count-updated"));
      }
      setActionToast("🗑️ 메일이 구글 계정 휴지통으로 이동되었습니다.");
      setTimeout(() => setActionToast(null), 3000);
    } catch (err) {
      console.error("Trash error:", err);
      alert("휴지통 이동 중 통신 오류가 발생했습니다.");
    }
  };

  // Save Mail to Memos
  const handleSaveToMemo = async () => {
    if (!activeMailDetail) return;
    try {
      const cleanContent = activeMailDetail.textBody || activeMailDetail.snippet;
      await addMemo({
        title: `[메일] ${activeMailDetail.subject}`,
        category: "일반",
        content: `<p><strong>보낸사람:</strong> ${activeMailDetail.from}</p><p><strong>일시:</strong> ${activeMailDetail.date}</p><hr/><p>${cleanContent}</p>`,
      });
      setActionToast("✅ '메모'의 일반 보관함에 저장되었습니다!");
      setTimeout(() => setActionToast(null), 3000);
    } catch (e) {
      alert("메모 저장 중 오류가 발생했습니다.");
    }
  };

  // Save Mail to Knowledge Vault
  const handleSaveToKnowledge = async () => {
    if (!activeMailDetail) return;
    try {
      const cleanContent = activeMailDetail.textBody || activeMailDetail.snippet;
      await addMemo({
        title: `[메일 스크랩] ${activeMailDetail.subject}`,
        category: "노하우",
        content: `<p><strong>보낸사람:</strong> ${activeMailDetail.from}</p><p><strong>일시:</strong> ${activeMailDetail.date}</p><hr/><p>${cleanContent}</p>`,
      });
      setActionToast("✅ '지식창고'의 노하우 보관함에 저장되었습니다!");
      setTimeout(() => setActionToast(null), 3000);
    } catch (e) {
      alert("지식창고 저장 중 오류가 발생했습니다.");
    }
  };

  // Filtered Mails
  const filteredMails = useMemo(() => {
    return mails.filter((m) => {
      if (selectedFilter === "unread" && !m.isUnread) return false;
      if (selectedFilter === "sent" && !m.labels.includes("SENT")) return false;
      if (selectedFilter === "inbox" && m.labels.length > 0 && !m.labels.includes("INBOX")) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.subject.toLowerCase().includes(q) ||
        m.fromName.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
      );
    });
  }, [mails, selectedFilter, searchQuery]);

  // UNCONNECTED STATE: Connect Button
  if (isConnected === false) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 text-center py-16">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
          <Mail className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">구글 메일(Gmail) 연동</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            내 구글 계정을 연결하여 수신 메일을 실시간으로 확인하고, 답장 작성 및 메모/지식창고 1초 스크랩을 편리하게 이용하세요.
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card/60 space-y-4 max-w-md mx-auto shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>안전한 Google 공식 OAuth 2.0 보안 인증</span>
          </div>

          <Button
            onClick={handleConnectGoogle}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-sm shadow-md transition-all active:scale-98"
          >
            <Mail className="w-4 h-4" />
            <span>내 구글 메일(Gmail) 1초 연결하기</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-full pb-24 md:pb-12">
      {/* 📬 Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/70 backdrop-blur border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>구글 메일 (Gmail)</span>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30 font-bold">
                연결됨
              </Badge>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5" />
              <span>{userEmail || "Google 계정 연동 중"}</span>
            </p>
          </div>
        </div>

        {/* Sync & Logout Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMails(true)}
            disabled={refreshing || loading}
            className="gap-1.5 h-9 text-xs font-bold px-3.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "동기화 중..." : "메일 새로고침"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
            title="구글 메일 연동 해제"
          >
            <LogOut className="w-4 h-4" />
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

      {/* 🧭 Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={selectedFilter === "inbox" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("inbox")}
            className={`h-8 text-xs rounded-xl font-bold ${
              selectedFilter === "inbox" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs" : "hover:bg-muted"
            }`}
          >
            받은편지함 ({mails.filter((m) => m.labels.includes("INBOX")).length || mails.length})
          </Button>
          <Button
            variant={selectedFilter === "sent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("sent")}
            className={`h-8 text-xs rounded-xl font-bold ${
              selectedFilter === "sent" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs" : "hover:bg-muted"
            }`}
          >
            보낸편지함 ({mails.filter((m) => m.labels.includes("SENT")).length})
          </Button>
          <Button
            variant={selectedFilter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("unread")}
            className={`h-8 text-xs rounded-xl font-bold ${
              selectedFilter === "unread" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs" : "hover:bg-muted"
            }`}
          >
            안 읽은 메일 ({mails.filter((m) => m.isUnread).length})
          </Button>
          <Button
            variant={selectedFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter("all")}
            className={`h-8 text-xs rounded-xl font-bold ${
              selectedFilter === "all" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs" : "hover:bg-muted"
            }`}
          >
            전체 ({mails.length})
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="메일 검색 (보낸 사람, 제목...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl bg-background shadow-xs"
          />
        </div>
      </div>

      {/* 📬 Mail List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">구글 메일을 불러오는 중입니다...</p>
        </div>
      ) : filteredMails.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl space-y-2 bg-muted/10">
          <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-bold text-muted-foreground">표시할 메일이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMails.map((mail) => (
            <div
              key={mail.id}
              onClick={() => handleOpenDetail(mail)}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 hover:border-blue-500/50 hover:shadow-xs group ${
                mail.isUnread ? "bg-blue-500/5 border-blue-500/20 font-semibold" : "bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Unread Blue Dot */}
                <div className="pt-1 shrink-0">
                  {mail.isUnread ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20 inline-block" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-foreground truncate max-w-[180px] sm:max-w-xs">
                      {mail.fromName}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                      &lt;{mail.fromEmail}&gt;
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-1">
                    {mail.subject}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-1 font-normal leading-relaxed">
                    {mail.snippet}
                  </p>
                </div>
              </div>

              {/* Right Metadata & Action Buttons */}
              <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mail.timeAgo || mail.date}
                  </span>

                  {/* Quick Trash Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleTrashMail(mail.id, e)}
                    className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="휴지통으로 이동"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {mail.hasAttachment && (
                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 text-muted-foreground">
                    <Paperclip className="w-2.5 h-2.5" /> 첨부
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📖 MAIL DETAIL READER & REPLY MODAL */}
      <Dialog
        open={!!activeMailDetail || detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMailDetail(null);
            setIsReplying(false);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden bg-card border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
          {detailLoading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">메일 본문을 불러오는 중입니다...</p>
            </div>
          ) : activeMailDetail ? (
            <>
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b bg-muted/20 space-y-3 pr-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-base sm:text-xl font-black leading-snug break-all">{activeMailDetail.subject}</h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-2.5">
                  <div className="space-y-0.5">
                    <p>
                      <strong className="text-foreground">보낸사람:</strong> {activeMailDetail.from}
                    </p>
                    <p>
                      <strong className="text-foreground">받는사람:</strong> {activeMailDetail.to}
                    </p>
                  </div>
                  <span className="font-medium shrink-0">{activeMailDetail.date}</span>
                </div>

                {/* Quick Action Buttons: Reply / Trash / Save to Memo / Scrap */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <Button
                    variant={isReplying ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isReplying) setIsReplying(false);
                      else handleStartReply();
                    }}
                    className="h-8 px-3 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{isReplying ? "답장 닫기" : "답장 쓰기"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToMemo}
                    className="h-8 px-3 text-xs font-bold gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                  >
                    <StickyNote className="w-3.5 h-3.5" /> 메모로 저장
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveToKnowledge}
                    className="h-8 px-3 text-xs font-bold gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" /> 지식창고 스크랩
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTrashMail(activeMailDetail.id)}
                    className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-500/10 font-bold gap-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 휴지통 이동
                  </Button>
                </div>
              </div>

              {/* ✍️ REPLY FORM BOX */}
              {isReplying && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-b space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1.5">
                      <CornerUpLeft className="w-4 h-4" /> 답장 작성 ({replyTo})
                    </span>
                  </div>

                  <Input
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="제목"
                    className="h-8 text-xs font-semibold bg-background"
                  />

                  <Textarea
                    rows={4}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="답장 내용을 입력하세요..."
                    className="text-xs sm:text-sm bg-background resize-none"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReplying(false)}
                      className="h-8 text-xs"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={replySending}
                      className="h-8 px-4 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Send className={`w-3.5 h-3.5 ${replySending ? "animate-pulse" : ""}`} />
                      <span>{replySending ? "전송 중..." : "답장 보내기"}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Attachments list with download buttons */}
              {activeMailDetail.attachments && activeMailDetail.attachments.length > 0 && (
                <div className="px-4 sm:px-6 py-2.5 bg-muted/30 border-b flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="font-bold shrink-0 flex items-center gap-1 text-muted-foreground">
                    <Paperclip className="w-3.5 h-3.5" /> 첨부파일 ({activeMailDetail.attachments.length}):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeMailDetail.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={`/api/mail/${activeMailDetail.id}/attachment/${att.attachmentId}?filename=${encodeURIComponent(
                          att.filename
                        )}&mimeType=${encodeURIComponent(att.mimeType)}`}
                        download={att.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-background hover:bg-muted text-xs text-foreground font-medium transition-colors shadow-xs group"
                        title={`${att.filename} 다운로드`}
                      >
                        <span className="underline decoration-muted-foreground/30 underline-offset-2 max-w-[200px] truncate">
                          {att.filename}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({Math.round(att.size / 1024)}KB)</span>
                        <Download className="w-3 h-3 text-primary ml-0.5 group-hover:scale-110 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[55vh] bg-background">
                {activeMailDetail.htmlBody ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: activeMailDetail.htmlBody }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground font-normal">
                    {activeMailDetail.textBody}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
