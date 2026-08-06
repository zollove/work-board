"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Building2, StickyNote, Contact2, GitFork, Calculator, Wrench, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "메모 & 사진 보관함", href: "/memos", icon: StickyNote },
  { name: "Work Calendar", href: "/", icon: Calendar },
  { name: "연간 마인드맵", href: "/mindmap", icon: GitFork },
  { name: "임대현황", href: "/rentals", icon: Building2 },
  { name: "업무 유틸리티", href: "/utilities", icon: Wrench },
  { name: "업체 연락처 관리", href: "/contacts", icon: Contact2 },
  { name: "계산기", href: "/calculators", icon: Calculator },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "border-r bg-muted/30 hidden md:block h-screen sticky top-0 transition-all duration-300 z-40 shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header Bar with Toggle Button */}
      <div className="flex h-14 items-center justify-between border-b px-3 lg:h-[60px] font-semibold">
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          title={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
