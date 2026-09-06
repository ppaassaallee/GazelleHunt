import { Button } from "@/landing/components/Button";

type Props = {
  heading: string;
  body: string[];
  points: string[];
  ctaLabel: string;
  ctaHref: string;
};

export function RocioBlock({ heading, body, points, ctaLabel, ctaHref }: Props) {
  return (
    <section id="rocio" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-20">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
            {heading}
          </h2>
          <div className="mt-8 space-y-5">
            {body.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-ink-muted)] md:text-[16px]"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-10">
            <Button href={ctaHref} variant="primary" tone="light">
              {ctaLabel}
            </Button>
          </div>
        </div>
        <ul className="flex flex-col justify-end gap-6 border-t border-[var(--landing-rule)] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
          {points.map((point) => (
            <li key={point} className="text-[22px] font-medium tracking-[-0.02em]">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
