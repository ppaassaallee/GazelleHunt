import { Search } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/components/nav";

interface NavRailProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  onOpenCommand?: () => void;
}

export function NavRail({ active, onNavigate, onOpenCommand }: NavRailProps) {
  return (
    <nav
      className="fixed inset-y-0 left-0 z-20 hidden w-[60px] flex-col items-center border-r border-[var(--border)] bg-[var(--rail)] py-3 backdrop-blur-xl md:flex"
      aria-label="Navegación principal"
    >
      <div
        className="group relative mb-5 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[11px] font-semibold text-[var(--background)]"
        title="Meikapen"
        aria-label="Meikapen"
      >
        M
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--tooltip-bg)] px-2 py-1 text-[11px] font-medium text-[var(--tooltip-fg)] opacity-0 shadow-sm transition-opacity duration-[var(--motion)] group-hover:opacity-100">
          Meikapen
        </span>
      </div>
      <ul className="flex flex-1 flex-col items-center gap-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                title={label}
                className={[
                  "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-[var(--motion)] motion-reduce:transition-none",
                  isActive
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--tooltip-bg)] px-2 py-1 text-[11px] font-medium text-[var(--tooltip-fg)] opacity-0 shadow-sm transition-opacity duration-[var(--motion)] group-hover:opacity-100 group-focus-visible:opacity-100">
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {onOpenCommand ? (
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Buscar"
          title="Buscar (⌘K)"
          className="group relative mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors duration-[var(--motion)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]"
        >
          <Search size={18} strokeWidth={1.75} aria-hidden />
          <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--tooltip-bg)] px-2 py-1 text-[11px] font-medium text-[var(--tooltip-fg)] opacity-0 shadow-sm transition-opacity duration-[var(--motion)] group-hover:opacity-100 group-focus-visible:opacity-100">
            Buscar ⌘K
          </span>
        </button>
      ) : null}
    </nav>
  );
}
