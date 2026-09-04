import { MOBILE_NAV_ITEMS, type NavItem } from "@/components/nav";

interface MobileTabBarProps {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
}

export function MobileTabBar({ active, onNavigate }: MobileTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación móvil"
    >
      {MOBILE_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            title={label}
            className={[
              "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors duration-200 motion-reduce:transition-none",
              isActive
                ? "text-[var(--accent)]"
                : "text-[var(--text-secondary)]",
            ].join(" ")}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.75} aria-hidden />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
