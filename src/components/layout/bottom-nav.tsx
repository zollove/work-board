"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Building2, StickyNote, Contact2, GitFork, Images, Calculator, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "달력", href: "/", icon: Calendar },
  { name: "마인드맵", href: "/mindmap", icon: GitFork },
  { name: "유틸리티", href: "/utilities", icon: Wrench },
  { name: "계산기", href: "/calculators", icon: Calculator },
  { name: "갤러리", href: "/gallery", icon: Images },
  { name: "임대현황", href: "/rentals", icon: Building2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <nav className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full text-[10px] gap-1 transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
