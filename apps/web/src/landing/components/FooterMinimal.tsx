import type { NavLink } from "@/landing/copy";

type Props = {
  brand?: string;
  tagline?: string;
  links?: NavLink[];
  accountId?: string;
  accountHref?: string;
  accountLabel?: string;
};

export function FooterMinimal({
  brand = "Meikapen",
  tagline = "Instala. Activa. Sucede.",
  links,
  accountId,
  accountHref,
  accountLabel,
}: Props) {
  return (
    <footer className="flex flex-col gap-6 px-5 py-10 text-[11px] tracking-[0.08em] text-[var(--landing-ink-muted)] md:flex-row md:items-center md:justify-between md:px-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="uppercase tracking-[0.12em]">{brand}</span>
        <span className="tracking-[0.04em]">{tagline}</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-5 uppercase tracking-[0.12em]">
        {accountId ? (
          <span id={accountId} className="scroll-mt-24">
            {accountHref ? (
              <a
                href={accountHref}
                className="text-[var(--landing-ink-muted)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
              >
                {accountLabel || "Cuenta"}
              </a>
            ) : (
              accountLabel || "Cuenta"
            )}
          </span>
        ) : null}
        {links?.map((link) => (
          <a
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="text-[var(--landing-ink-muted)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
