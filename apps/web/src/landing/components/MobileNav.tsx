import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/landing/components/Button";
import type { NavLink } from "@/landing/copy";

type AuthLinks = {
  loginLabel: string;
  loginHref: string;
  signupLabel: string;
  signupHref: string;
};

type Props = {
  links: NavLink[];
  auth?: AuthLinks;
};

export function MobileNav({ links, auth }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      openRef.current?.focus();
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        ref={openRef}
        type="button"
        className="landing-btn landing-btn--ghost landing-btn--dark landing-btn--md"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen(true)}
      >
        Menú
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación"
          className="fixed inset-0 z-50 flex flex-col bg-[var(--landing-surface)] px-5 py-6 text-[var(--landing-fg)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] tracking-[0.14em] uppercase">Menú</p>
            <button
              ref={closeRef}
              type="button"
              className="landing-btn landing-btn--ghost landing-btn--dark landing-btn--md"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>
          <nav className="mt-10 flex flex-1 flex-col gap-6" aria-label="Mobile">
            {links.map((item) => (
              <a
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="text-[1.5rem] font-medium tracking-[-0.02em] no-underline"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          {auth ? (
            <div className="mt-auto flex flex-col gap-3 pb-4">
              <Button href={auth.loginHref} variant="ghost" tone="dark" onClick={() => setOpen(false)}>
                {auth.loginLabel}
              </Button>
              <Button href={auth.signupHref} variant="primary" tone="dark" size="lg" onClick={() => setOpen(false)}>
                {auth.signupLabel}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
