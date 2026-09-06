import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { Button } from "@/landing/components/Button";
import { Reveal } from "@/landing/components/Reveal";

export type TimelineStage = {
  label: string;
  title: string;
  bubble: string;
};

type Props = {
  heading: string;
  body: string;
  stages: TimelineStage[];
  goalLabel?: string;
};

export function StageTimeline({
  heading,
  body,
  stages,
  goalLabel = "Pago recibido",
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [active, setActive] = useState(reduce ? stages.length - 1 : -1);
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState(0);

  const done = active >= stages.length - 1 && active >= 0;

  useEffect(() => {
    if (reduce || !inView || paused) return;
    if (active < 0) {
      setActive(0);
      return;
    }
    if (active >= stages.length - 1) return;
    const timer = window.setTimeout(() => setActive((n) => n + 1), 900);
    return () => window.clearTimeout(timer);
  }, [active, inView, paused, reduce, stages.length, runId]);

  const progress = useMemo(() => {
    if (active < 0) return 0;
    return Math.min(1, active / Math.max(1, stages.length - 1));
  }, [active, stages.length]);

  function replay() {
    setPaused(false);
    setActive(reduce ? stages.length - 1 : -1);
    setRunId((n) => n + 1);
  }

  return (
    <section id="etapas" className="scroll-mt-24 border-y border-[var(--landing-rule)] px-5 py-24 md:px-10 md:py-32">
      <Reveal className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="mt-5 max-w-[var(--landing-measure)] text-[15px] leading-relaxed text-[var(--landing-ink-muted)]">
          {body}
        </p>

        <div ref={ref} className="mt-16">
          <div className="relative">
            <div className="absolute top-4 right-0 left-0 hidden h-px bg-[var(--landing-rule)] md:block" aria-hidden />
            <div
              className="absolute top-4 left-0 hidden h-px origin-left md:block"
              style={{
                width: "100%",
                transform: `scaleX(${progress})`,
                background: done ? "var(--brand-accent)" : "var(--landing-ink)",
                transition: reduce ? undefined : "transform 0.42s cubic-bezier(0.25,1,0.5,1), background 0.42s",
              }}
              aria-hidden
            />
            <ol className="grid gap-10 md:grid-cols-5 md:gap-4">
              {stages.map((stage, index) => {
                const isActive = index === active || (reduce && true);
                const lit = index <= active || reduce;
                return (
                  <li key={stage.label} className="relative">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        setPaused(true);
                        setActive(index);
                      }}
                      aria-pressed={index === active}
                    >
                      <span
                        className={`relative z-10 mb-4 inline-flex h-3 w-3 rounded-full border-2 ${
                          lit
                            ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]"
                            : "border-[var(--landing-rule)] bg-white"
                        }`}
                        aria-hidden
                      />
                      <p className="text-[11px] tracking-[0.08em] text-[var(--landing-ink-muted)]">
                        {stage.label}
                      </p>
                      <p className="mt-2 text-[16px] font-medium tracking-[-0.02em]">{stage.title}</p>
                    </button>
                    <AnimatePresence mode="wait">
                      {(isActive || reduce) && stage.bubble ? (
                        <motion.div
                          key={`${stage.label}-${runId}`}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                          className="mt-4 rounded-2xl border border-[var(--landing-rule)] bg-white px-3 py-3 text-[13px] leading-snug text-[var(--landing-ink-muted)] shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                        >
                          {stage.bubble}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <p
              className={`text-[14px] font-medium ${
                done || reduce ? "text-[var(--brand-accent)]" : "text-[var(--landing-ink-muted)]"
              }`}
            >
              ✓ {goalLabel}
            </p>
            <Button type="button" variant="ghost" tone="light" onClick={replay}>
              Repetir
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
