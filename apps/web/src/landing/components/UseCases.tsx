type UseCase = {
  title: string;
  body: string;
};

type Props = {
  heading: string;
  supporting: string;
  cases: UseCase[];
};

export function UseCases({ heading, supporting, cases }: Props) {
  return (
    <section id="casos" className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {cases.map((item) => (
            <li key={item.title}>
              <h3 className="text-[18px] font-medium tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-16 max-w-2xl text-[14px] leading-relaxed text-[var(--landing-ink-muted)]">
          {supporting}
        </p>
      </div>
    </section>
  );
}
