"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Building2, StickyNote, Contact2, BookOpen,
  Calculator, PanelLeftClose, PanelLeftOpen,
  Lock, Unlock, Settings, ChevronDown, ChevronUp,
  Library, Compass, Mail, Newspaper, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScreenLockContext } from "@/components/layout/lock-provider";
import { useGolfUnread } from "@/hooks/use-golf-unread";
import { useMailUnread } from "@/hooks/use-mail-unread";

const navItems = [
  { name: "캘린더", href: "/", icon: Calendar },
  { name: "메모", href: "/memos", icon: StickyNote },
  { name: "지식창고", href: "/knowledge", icon: Library },
  { name: "계산기", href: "/calculators", icon: Calculator },
  { name: "타석 분석", href: "/pastel", icon: Compass },
  { name: "골프저널", href: "/golf", icon: Newspaper, isGolf: true },
];

const AUTO_LOCK_OPTIONS = [
  { label: "꺼짐", value: 0 },
  { label: "1분", value: 1 },
  { label: "5분", value: 5 },
  { label: "10분", value: 10 },
  { label: "30분", value: 30 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { hasUnread } = useGolfUnread();
  const { unreadCount: mailUnreadCount } = useMailUnread();

  const {
    hasPIN,
    autoLockMin,
    lock,
    resetPIN,
    updateAutoLockMin,
    openSetup,
    openChange,
  } = useScreenLockContext();

  const handleLockClick = () => {
    if (hasPIN) {
      lock();
    } else {
      openSetup();
    }
  };

  return (
    <aside
      className={cn(
        "border-r bg-muted/30 hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 z-40 shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header Bar */}
      <div className="flex h-14 items-center justify-between border-b px-3 lg:h-[60px] font-semibold shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">업무 관리 시스템</span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Lock Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLockClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={hasPIN ? "화면 잠금" : "PIN 설정"}
          >
            {hasPIN ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 opacity-50" />}
          </Button>

          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium gap-1">
          {/* ✉️ 메일 계층 그룹 (통합 제외, 들여쓰기 서브메뉴) */}
          <div className="space-y-1 pb-1 mb-1 border-b">
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              {!isCollapsed && <span>메일</span>}
            </div>

            {/* Submenu 1: Google 지메일 (Indent pl-7 / ml-1) */}
            <Link
              href="/mail/gmail"
              title={isCollapsed ? "Google 지메일" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 transition-all hover:text-primary relative group",
                pathname === "/mail/gmail" || pathname === "/mail"
                  ? "bg-rose-500/10 text-rose-600 font-extrabold border-l-2 border-l-rose-500"
                  : "text-muted-foreground hover:bg-muted font-semibold",
                isCollapsed ? "justify-center px-0" : "pl-7 ml-1 text-xs"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full min-w-0 pr-2">
                  <span className="truncate">Google 지메일</span>
                </div>
              )}
            </Link>

            {/* Submenu 2: Naver 메일 (Indent pl-7 / ml-1) */}
            <Link
              href="/mail/naver"
              title={isCollapsed ? "Naver 메일" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 transition-all hover:text-primary relative group",
                pathname === "/mail/naver"
                  ? "bg-emerald-500/10 text-emerald-600 font-extrabold border-l-2 border-l-emerald-500"
                  : "text-muted-foreground hover:bg-muted font-semibold",
                isCollapsed ? "justify-center px-0" : "pl-7 ml-1 text-xs"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full min-w-0 pr-2">
                  <span className="truncate">Naver 메일</span>
                </div>
              )}
            </Link>
          </div>

          {/* 💼 업무 계층 그룹 (하위 서브메뉴: 업무일지, 임대현황, 업체 연락처 관리) */}
          <div className="space-y-1 pt-1 pb-1 mt-1 mb-1 border-t border-b">
            <div className="flex items-center gap-2.5 px-3 py-2 text-xs font-black text-muted-foreground uppercase tracking-wider">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              {!isCollapsed && <span>업무</span>}
            </div>

            {/* Submenu 1: 📖 업무일지 (/worklog) */}
            <Link
              href="/worklog"
              title={isCollapsed ? "업무일지" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 transition-all hover:text-primary relative group",
                pathname === "/worklog"
                  ? "bg-primary/10 text-primary font-extrabold border-l-2 border-l-primary"
                  : "text-muted-foreground hover:bg-muted font-semibold",
                isCollapsed ? "justify-center px-0" : "pl-7 ml-1 text-xs"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate">업무일지</span>}
            </Link>

            {/* Submenu 2: 🏢 임대현황 (/rentals) */}
            <Link
              href="/rentals"
              title={isCollapsed ? "임대현황" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 transition-all hover:text-primary relative group",
                pathname === "/rentals"
                  ? "bg-primary/10 text-primary font-extrabold border-l-2 border-l-primary"
                  : "text-muted-foreground hover:bg-muted font-semibold",
                isCollapsed ? "justify-center px-0" : "pl-7 ml-1 text-xs"
              )}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate">임대현황</span>}
            </Link>

            {/* Submenu 3: 📇 업체 연락처 관리 (/contacts) */}
            <Link
              href="/contacts"
              title={isCollapsed ? "업체 연락처 관리" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 transition-all hover:text-primary relative group",
                pathname === "/contacts"
                  ? "bg-primary/10 text-primary font-extrabold border-l-2 border-l-primary"
                  : "text-muted-foreground hover:bg-muted font-semibold",
                isCollapsed ? "justify-center px-0" : "pl-7 ml-1 text-xs"
              )}
            >
              <Contact2 className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span className="truncate">업체 연락처 관리</span>}
            </Link>
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const showRedDot = item.isGolf && hasUnread;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary relative group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {showRedDot && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.name}</span>
                    {showRedDot && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Lock Settings Panel */}
      {!isCollapsed && (
        <div className="border-t shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between px-3 py-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              화면 잠금 설정
            </span>
            {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showSettings && (
            <div className="px-3 pb-4 space-y-3 text-xs">
              {/* Auto-lock timer */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-muted-foreground">자동 잠금 시간</p>
                <div className="flex flex-wrap gap-1">
                  {AUTO_LOCK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateAutoLockMin(opt.value)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[11px] font-bold border transition-all",
                        autoLockMin === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Actions */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-muted-foreground">PIN 관리</p>
                <div className="flex flex-col gap-1">
                  {!hasPIN ? (
                    <button
                      type="button"
                      onClick={openSetup}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 text-primary text-[11px] font-bold hover:bg-primary/5 transition-colors"
                    >
                      🔐 PIN 설정하기
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={openChange}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        🔄 PIN 변경
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("PIN을 초기화하면 화면 잠금이 해제됩니다. 계속하시겠습니까?")) {
                            resetPIN();
                          }
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-bold text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                      >
                        🗑️ PIN 초기화
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed: just a lock icon at bottom */}
      {isCollapsed && (
        <div className="border-t py-2 flex justify-center shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLockClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={hasPIN ? "화면 잠금" : "PIN 설정"}
          >
            {hasPIN ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 opacity-40" />}
          </Button>
        </div>
      )}
    </aside>
  );
}
