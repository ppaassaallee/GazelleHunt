import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "accent" | "danger" | "ghost";
  size?: "sm" | "md";
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  default:
    "text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text-primary)]",
  accent: "text-[var(--accent)] hover:bg-[var(--accent-soft)]",
  danger: "text-[var(--danger)] hover:bg-[var(--danger-soft)]",
  ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
};

export function IconButton({
  label,
  icon: Icon,
  tone = "default",
  size = "md",
  className = "",
  disabled,
  ...rest
}: Props) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? 16 : 18;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={[
        "group relative inline-flex shrink-0 items-center justify-center rounded-lg transition-[background-color,color,opacity] duration-150 ease-out motion-reduce:transition-none",
        dim,
        toneClass[tone],
        "disabled:pointer-events-none disabled:opacity-35",
        className,
      ].join(" ")}
      {...rest}
    >
      <Icon size={iconSize} strokeWidth={1.75} aria-hidden />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--tooltip-bg)] px-2 py-1 text-[11px] font-medium tracking-wide text-[var(--tooltip-fg)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        {label}
      </span>
    </button>
  );
}
