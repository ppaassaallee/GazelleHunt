type Props = {
  label: string;
  href?: string;
};

export function BrandMark({ label, href = "/" }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center border border-[var(--landing-border)] px-3 py-2 text-[11px] font-medium tracking-[0.22em] text-[var(--landing-fg)] uppercase no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-80"
    >
      {label}
    </a>
  );
}
