import { Button } from "@/landing/components/Button";

type Column = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  body: string;
  columns: Column[];
  ctaLabel: string;
  ctaHref: string;
};

export function PortfolioBlock({ heading, body, columns, ctaLabel, ctaHref }: Props) {
  return (
    <section id="cartera" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
          {body}
        </p>
        <ul className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {columns.map((column) => (
            <li key={column.title}>
              <h3 className="text-[18px] font-medium tracking-[-0.02em]">{column.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {column.body}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-14">
          <Button href={ctaHref} variant="secondary" tone="light">
            {ctaLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
