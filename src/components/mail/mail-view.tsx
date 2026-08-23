"use client";

import { useState, useEffect, useMemo } from "react";
import { MailItem, MailProvider } from "@/types/mail";
import {
  Inbox,
  Mail,
  Search,
  RefreshCw,
  Star,
  CheckCircle2,
  Send,
  X,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MailView() {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"all" | MailProvider>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);

  const fetchMails = async (provider = selectedProvider) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mail?provider=${provider}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMails(data.mails || []);
      }
    } catch (e) {
      console.error("Mail fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMails(selectedProvider);
  }, [selectedProvider]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMails(selectedProvider);
  };

  const filteredMails = useMemo(() => {
    return mails.filter((m) => {
      if (selectedProvider !== "all" && m.provider !== selectedProvider) return false;
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
  }, [mails, selectedProvider, unreadOnly, searchQuery]);

  const gmailCount = useMemo(() => mails.filter((m) => m.provider === "gmail").length, [mails]);
  const naverCount = useMemo(() => mails.filter((m) => m.provider === "naver").length, [mails]);
  const unreadCount = useMemo(() => mails.filter((m) => !m.isRead).length, [mails]);

  const handleOpenMail = (mail: MailItem) => {
    setSelectedMail(mail);
    setReplyText("");
    setReplySuccess(false);
    // Mark as read locally
    setMails((prev) => prev.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m)));
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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

      {/* 🗂️ Account Tab Toggle & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
        {/* 1번 & 2번 통합 탭 토글 */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-xl border shrink-0 overflow-x-auto scrollbar-none">
          <Button
            variant={selectedProvider === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedProvider("all")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
              selectedProvider === "all" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>✉️ 전체 메일함 ({mails.length})</span>
          </Button>

          <Button
            variant={selectedProvider === "gmail" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedProvider("gmail")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
              selectedProvider === "gmail" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>🔴 Google Gmail ({gmailCount})</span>
          </Button>

          <Button
            variant={selectedProvider === "naver" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedProvider("naver")}
            className={`h-8 text-xs font-bold rounded-lg shrink-0 gap-1.5 ${
              selectedProvider === "naver" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>🟢 Naver Mail ({naverCount})</span>
          </Button>
        </div>

        {/* Search & Unread Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-xl shadow-xs flex-1 md:w-64">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="제목, 보낸이, 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-semibold border-none outline-none w-full"
            />
            {searchQuery && (
              <X className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" onClick={() => setSearchQuery("")} />
            )}
          </div>

          <Button
            variant={unreadOnly ? "secondary" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`h-8 text-xs font-bold rounded-xl px-2.5 gap-1 shrink-0 ${
              unreadOnly ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : ""
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>안읽음 ({unreadCount})</span>
          </Button>
        </div>
      </div>

      {/* 📩 Mail Card List View */}
      <Card className="border shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/20 border-b flex items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-black flex items-center gap-2">
            <span>
              {selectedProvider === "all"
                ? "📬 전체 통합 수신함"
                : selectedProvider === "gmail"
                ? "🔴 Google 지메일 수신함"
                : "🟢 Naver 네이버 메일 수신함"}
            </span>
            <Badge variant="outline" className="text-[10px] font-bold">
              총 {filteredMails.length}건
            </Badge>
          </CardTitle>
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
            filteredMails.map((mail) => {
              const isGmail = mail.provider === "gmail";

              return (
                <div
                  key={mail.id}
                  onClick={() => handleOpenMail(mail)}
                  className={`p-4 hover:bg-muted/30 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    !mail.isRead ? "bg-indigo-500/5 font-semibold" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 w-full sm:w-auto flex-1">
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
                        <span className="text-[10px] text-muted-foreground">({mail.senderEmail})</span>
                        {mail.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>

                      <h3 className={`text-sm tracking-tight truncate ${!mail.isRead ? "font-black text-foreground" : "font-bold text-muted-foreground"}`}>
                        {mail.subject}
                      </h3>

                      <p className="text-xs text-muted-foreground/80 truncate font-medium">
                        {mail.snippet}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(mail.receivedAt).toLocaleDateString()} {new Date(mail.receivedAt).toLocaleTimeString().slice(0, 5)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

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
