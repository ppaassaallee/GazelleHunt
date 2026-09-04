import type { ReactNode } from "react";
import { NavRail } from "@/components/NavRail";
import { MobileTabBar } from "@/components/MobileTabBar";
import type { NavItem } from "@/components/nav";

interface ShellProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  children: ReactNode;
}

export function Shell({ active, onNavigate, children }: ShellProps) {
  return (
    <div className="flex min-h-dvh bg-[var(--background)] text-[var(--text-primary)]">
      <NavRail active={active} onNavigate={onNavigate} />
      <div className="flex min-h-dvh flex-1 flex-col md:pl-[60px]">
        <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileTabBar active={active} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
