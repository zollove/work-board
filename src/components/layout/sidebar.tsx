"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Building2, StickyNote, Contact2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Work Calendar", href: "/", icon: Calendar },
  { name: "임대현황", href: "/rentals", icon: Building2 },
  { name: "메모", href: "/memos", icon: StickyNote },
  { name: "업체 연락처 관리", href: "/contacts", icon: Contact2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/30 hidden md:block h-screen sticky top-0">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 font-semibold">
        <Building2 className="mr-2 h-5 w-5" />
        <span>업무 관리 시스템</span>
      </div>
      <div className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
