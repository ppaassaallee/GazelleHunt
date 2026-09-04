import { MoreHorizontal } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export type ContextMenuItem = {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

type Props = {
  label?: string;
  items: ContextMenuItem[];
  size?: "sm" | "md";
  align?: "start" | "end";
  triggerClassName?: string;
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  children?: ReactNode;
};

export function ContextMenu({
  label = "Más acciones",
  items,
  size = "md",
  align = "end",
  triggerClassName = "",
  triggerProps,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] transition-[background-color,color,opacity] duration-[var(--motion)] ease-out hover:bg-[var(--hover)] hover:text-[var(--text-primary)]",
          dim,
          triggerClassName,
        ].join(" ")}
        {...triggerProps}
        onClick={(event) => {
          triggerProps?.onClick?.(event);
          setOpen((value) => !value);
        }}
      >
        {children ?? <MoreHorizontal size={size === "sm" ? 16 : 18} strokeWidth={1.75} />}
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={label}
          className={[
            "absolute top-[calc(100%+4px)] z-40 min-w-[11.5rem] overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-elevated)] py-1 shadow-[var(--shadow-soft)]",
            "animate-[menu-in_var(--motion)_ease-out]",
            align === "end" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={[
                  "flex w-full px-3 py-2 text-left text-sm transition-colors duration-[var(--motion)] disabled:opacity-40",
                  item.danger
                    ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--hover)]",
                ].join(" ")}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <style>{`
        @keyframes menu-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes menu-in {
            from { opacity: 1; transform: none; }
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </div>
  );
}
