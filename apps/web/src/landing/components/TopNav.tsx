import { BrandMark } from "@/landing/components/BrandMark";
import { Button } from "@/landing/components/Button";
import { MobileNav } from "@/landing/components/MobileNav";
import type { NavLink } from "@/landing/copy";

type AuthLinks = {
  loginLabel: string;
  loginHref: string;
  signupLabel: string;
  signupHref: string;
};

type Props = {
  brandLabel: string;
  brandHomeHref?: string;
  mode?: "solutions" | "platform";
  links?: NavLink[];
  auth?: AuthLinks;
};

export function TopNav({
  brandLabel,
  brandHomeHref = "/",
  mode = "platform",
  links,
  auth,
}: Props) {
  const fallback: NavLink[] =
    mode === "solutions"
      ? [
          { href: "#about", label: "About" },
          { href: "#playbooks", label: "Solutions" },
          { href: "#contact", label: "Contact" },
        ]
      : [
          { href: "#about", label: "About" },
          { href: "#about", label: "Platform" },
          { href: "#contact", label: "Contact" },
        ];
  const items = links ?? fallback;

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-5 py-6 md:px-10 md:py-8">
      <BrandMark label={brandLabel} href={brandHomeHref} />
      <div className="flex items-center gap-3 md:gap-6">
        <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex md:gap-8">
          {items.map((item) => (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-[12px] tracking-[0.04em] text-[var(--landing-fg)] no-underline opacity-90 transition-opacity duration-[var(--landing-ease)] hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {auth ? (
          <div className="hidden items-center gap-3 sm:flex md:gap-4">
            <Button href={auth.loginHref} variant="ghost" tone="dark" className="text-[12px]">
              {auth.loginLabel}
            </Button>
            <Button href={auth.signupHref} variant="primary" tone="dark" size="md">
              {auth.signupLabel}
            </Button>
          </div>
        ) : null}
        <MobileNav links={items} auth={auth} />
      </div>
    </header>
  );
}
