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
            const inner = (
              <>
                <div>
                  <p className="text-[18px] font-medium tracking-[-0.02em]">{card.title}</p>
                  <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                    {card.body}
                  </p>
                </div>
                {card.href ? (
                  <span className="mt-4 text-[13px] tracking-[0.04em] text-[var(--landing-ink)] md:mt-0">
                    Open →
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={card.title}>
                {card.href ? (
                  <a
                    href={card.href}
                    className="flex flex-col justify-between gap-2 py-8 text-[var(--landing-ink)] no-underline transition-opacity duration-[var(--landing-ease)] hover:opacity-70 md:flex-row md:items-end"
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
