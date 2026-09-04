import { NAV_ITEMS, type NavItem } from "@/components/nav";

interface NavRailProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
}

export function NavRail({ active, onNavigate }: NavRailProps) {
  return (
    <nav
      className="fixed inset-y-0 left-0 z-20 hidden w-[60px] flex-col items-center border-r border-[var(--border)] bg-[var(--surface)] py-4 md:flex"
      aria-label="Navegación principal"
    >
      <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-semibold text-white">
        R
      </div>
      <ul className="flex flex-1 flex-col items-center gap-1">
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
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 motion-reduce:transition-none",
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
