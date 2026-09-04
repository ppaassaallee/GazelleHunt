import { BrandMark } from "@/landing/components/BrandMark";

type Props = {
  brandLabel: string;
  brandHomeHref?: string;
  mode: "solutions" | "platform";
};

export function TopNav({ brandLabel, brandHomeHref = "/", mode }: Props) {
  const mid = mode === "solutions" ? { href: "#playbooks", label: "Solutions" } : { href: "#about", label: "Platform" };

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-6 md:px-10 md:py-8">
      <BrandMark label={brandLabel} href={brandHomeHref} />
      <nav aria-label="Primary" className="flex items-center gap-6 md:gap-8">
        <a
          href="#about"
          className="text-[12px] tracking-[0.08em] text-[var(--landing-fg)] no-underline opacity-90 transition-opacity duration-[var(--landing-ease)] hover:opacity-100"
        >
          About
        </a>
        <a
          href={mid.href}
          className="hidden text-[12px] tracking-[0.08em] text-[var(--landing-fg)] no-underline opacity-90 transition-opacity duration-[var(--landing-ease)] hover:opacity-100 sm:inline"
        >
          {mid.label}
        </a>
        <a
          href="#contact"
          className="text-[12px] tracking-[0.08em] text-[var(--landing-fg)] no-underline opacity-90 transition-opacity duration-[var(--landing-ease)] hover:opacity-100"
        >
          Contact
        </a>
      </nav>
    </header>
  );
}
