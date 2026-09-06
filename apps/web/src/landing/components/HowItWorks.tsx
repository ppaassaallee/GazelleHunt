type Step = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  steps: Step[];
};

export function HowItWorks({ heading, steps }: Props) {
  return (
    <section id="como" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <li key={step.title}>
              <p className="text-[11px] tracking-[0.18em] text-[var(--landing-ink-muted)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-[20px] leading-snug font-medium tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
