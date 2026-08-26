"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Building2, StickyNote, Contact2, BookOpen,
  Calculator, PanelLeftClose, PanelLeftOpen,
  Lock, Unlock, Settings, ChevronDown, ChevronUp,
  Library, Compass, Mail, HardDrive, Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScreenLockContext } from "@/components/layout/lock-provider";
import { useGolfUnread } from "@/hooks/use-golf-unread";
import { useMailUnread } from "@/hooks/use-mail-unread";

const navItems = [
  { name: "메일", href: "/mail", icon: Mail, isMail: true },
  { name: "캘린더", href: "/", icon: Calendar },
  { name: "메모", href: "/memos", icon: StickyNote },
  { name: "지식창고", href: "/knowledge", icon: Library },
  { name: "업무일지", href: "/worklog", icon: BookOpen },
  { name: "임대현황", href: "/rentals", icon: Building2 },
  { name: "업체 연락처 관리", href: "/contacts", icon: Contact2 },
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
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const showRedDot = item.isGolf && hasUnread;
            const hasMailUnread = item.isMail && mailUnreadCount > 0;

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
                  {hasMailUnread && isCollapsed && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center ring-2 ring-background shadow-xs">
                      {mailUnreadCount > 99 ? "99+" : mailUnreadCount}
                    </span>
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
                    {hasMailUnread && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs shrink-0 animate-in fade-in duration-200">
                        {mailUnreadCount > 99 ? "99+" : mailUnreadCount}
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
