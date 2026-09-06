type Stage = {
  label: string;
  title: string;
};

type Props = {
  heading: string;
  body: string;
  stages: Stage[];
};

export function JourneyStages({ heading, body, stages }: Props) {
  return (
    <section id="etapas" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
          {body}
        </p>
        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {stages.map((stage) => (
            <li key={stage.label}>
              <p className="text-[11px] tracking-[0.16em] text-[var(--landing-ink-muted)] uppercase">
                {stage.label}
              </p>
              <p className="mt-3 text-[18px] font-medium tracking-[-0.02em]">{stage.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
