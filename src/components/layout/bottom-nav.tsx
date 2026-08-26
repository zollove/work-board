"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Building2, StickyNote, BookOpen,
  Calculator, Contact2, Library, Compass, Mail, HardDrive, Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGolfUnread } from "@/hooks/use-golf-unread";
import { useMailUnread } from "@/hooks/use-mail-unread";
import { useEffect, useRef } from "react";

const navItems = [
  { name: "메일", href: "/mail", icon: Mail, isMail: true },
  { name: "캘린더", href: "/", icon: Calendar },
  { name: "메모", href: "/memos", icon: StickyNote },
  { name: "지식창고", href: "/knowledge", icon: Library },
  { name: "업무일지", href: "/worklog", icon: BookOpen },
  { name: "임대현황", href: "/rentals", icon: Building2 },
  { name: "연락처", href: "/contacts", icon: Contact2 },
  { name: "계산기", href: "/calculators", icon: Calculator },
  { name: "타석 분석", href: "/pastel", icon: Compass },
  { name: "골프저널", href: "/golf", icon: Newspaper, isGolf: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hasUnread } = useGolfUnread();
  const { unreadCount: mailUnreadCount } = useMailUnread();
  const navRef = useRef<HTMLElement>(null);

  // Auto scroll active item into view
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t rounded-t-2xl bg-background/95 backdrop-blur-md shadow-lg md:hidden overflow-hidden">
      <nav
        ref={navRef}
        className="flex items-center h-16 px-2 gap-1 overflow-x-auto scrollbar-none touch-pan-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const showRedDot = item.isGolf && hasUnread;
          const hasMailUnread = item.isMail && mailUnreadCount > 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              data-active={isActive ? "true" : "false"}
              className={cn(
                "flex flex-col items-center justify-center min-w-[62px] px-1.5 h-13 rounded-xl text-[11px] gap-1 transition-all shrink-0 relative",
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-xs scale-102"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-4.5 w-4.5", isActive ? "stroke-[2.5]" : "stroke-[1.8]")} />
                {showRedDot && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-background animate-pulse" />
                )}
                {hasMailUnread && (
                  <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-600 text-[8px] font-black text-white flex items-center justify-center ring-1.5 ring-background shadow-xs">
                    {mailUnreadCount > 99 ? "99+" : mailUnreadCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[58px] leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
