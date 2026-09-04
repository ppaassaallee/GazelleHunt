type Props = {
  id?: string;
  heading: string;
  body: string[];
};

export function SectionIntro({ id, heading, body }: Props) {
  return (
    <section id={id} className="scroll-mt-24 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-16">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em] text-[var(--landing-ink)]">
          {heading}
        </h2>
        <div className="space-y-5">
          {body.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-[var(--landing-ink-muted)] md:text-[16px]">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
