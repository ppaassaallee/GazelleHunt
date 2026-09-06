import type { PlaybookCard } from "@/landing/copy";

type Props = {
  heading: string;
  cards: PlaybookCard[];
};

export function PlaybookCards({ heading, cards }: Props) {
  return (
    <section id="playbooks" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ul className="mt-14 divide-y divide-[var(--landing-rule)] border-y border-[var(--landing-rule)]">
          {cards.map((card) => {
            const statusLabel =
              card.status === "available" ? "Disponible" : card.status === "soon" ? "Próximamente" : null;
            const inner = (
              <>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[18px] font-medium tracking-[-0.02em]">{card.title}</p>
                    {statusLabel ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] tracking-[0.08em] uppercase ${
                          card.status === "available"
                            ? "bg-[var(--brand-accent)] text-white"
                            : "bg-[var(--landing-rule)] text-[var(--landing-ink-muted)]"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                    {card.body}
                  </p>
                </div>
                {card.href ? (
                  <span className="mt-4 text-[13px] tracking-[0.04em] text-[var(--landing-ink)] md:mt-0">
                    Abrir →
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={card.title}>
                {card.href ? (
                  <a
                    href={card.href}
                    className="flex flex-col justify-between gap-2 py-8 text-[var(--landing-ink)] no-underline transition-[transform,opacity] duration-[var(--landing-ease)] hover:-translate-y-0.5 hover:opacity-70 md:flex-row md:items-end"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex flex-col justify-between gap-2 py-8 md:flex-row md:items-end">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
