import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Button } from "@/landing/components/Button";
import { Reveal } from "@/landing/components/Reveal";

export type TimelineStage = {
  label: string;
  title: string;
  bubble: string;
  channel?: "whatsapp" | "email" | "call" | "system";
};

type Props = {
  heading: string;
  body: string;
  stages: TimelineStage[];
  goalLabel?: string;
};

function inferChannel(stage: TimelineStage): NonNullable<TimelineStage["channel"]> {
  if (stage.channel) return stage.channel;
  const bubble = stage.bubble || "";
  if (/^WA:/i.test(bubble) || /whatsapp/i.test(bubble)) return "whatsapp";
  if (/^Email:/i.test(bubble) || /^e-?mail:/i.test(bubble)) return "email";
  if (/^☎|^Tel:/i.test(bubble) || /llama/i.test(bubble)) return "call";
  return "system";
}

function stripChannelPrefix(bubble: string) {
  return bubble.replace(/^(WA|Email|E-mail|☎|Tel|Aviso)\s*:\s*/i, "").trim();
}

function channelLabel(channel: NonNullable<TimelineStage["channel"]>) {
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "email") return "Email";
  if (channel === "call") return "Llamada";
  return "Sistema";
}

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
  const cols = Math.min(5, Math.max(3, stages.length));

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
          <div className="relative hidden md:block">
            <div className="absolute top-4 right-0 left-0 h-px bg-[var(--landing-rule)]" aria-hidden />
            <div
              className="absolute top-4 left-0 h-px origin-left"
              style={{
                width: "100%",
                transform: `scaleX(${progress})`,
                background: done ? "var(--brand-accent)" : "var(--landing-ink)",
                transition: reduce
                  ? undefined
                  : "transform 0.42s cubic-bezier(0.25,1,0.5,1), background 0.42s",
              }}
              aria-hidden
            />
            <ol
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {stages.map((stage, index) => {
                const channel = inferChannel(stage);
                const isActive = index === active || reduce;
                const lit = index <= active || reduce;
                const dim = !reduce && active >= 0 && index !== active && index === active - 1;
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
                      {(isActive || dim || reduce) && stage.bubble ? (
                        <motion.div
                          key={`${stage.label}-${runId}`}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: dim && !isActive ? 0.45 : 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
                          className="mt-4 rounded-xl border border-[var(--landing-rule)] bg-white px-3 py-3 text-[13px] leading-snug text-[var(--landing-ink-muted)] shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                        >
                          <span className="mb-2 inline-flex rounded-md bg-[rgba(18,18,18,0.06)] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[var(--landing-ink)] uppercase">
                            {channelLabel(channel)}
                          </span>
                          <span className="block">{stripChannelPrefix(stage.bubble)}</span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="landing-timeline-scroll md:hidden">
            <ol className="flex gap-4">
              {stages.map((stage, index) => {
                const channel = inferChannel(stage);
                const lit = index <= active || reduce;
                return (
                  <li key={stage.label} className="landing-timeline-snap">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-[var(--landing-rule)] bg-white p-4 text-left"
                      onClick={() => {
                        setPaused(true);
                        setActive(index);
                      }}
                      aria-pressed={index === active}
                    >
                      <span
                        className={`mb-3 inline-flex h-2.5 w-2.5 rounded-full ${
                          lit ? "bg-[var(--brand-accent)]" : "bg-[var(--landing-rule)]"
                        }`}
                        aria-hidden
                      />
                      <p className="text-[11px] tracking-[0.08em] text-[var(--landing-ink-muted)]">
                        {stage.label}
                      </p>
                      <p className="mt-2 text-[17px] font-medium tracking-[-0.02em]">{stage.title}</p>
                      {stage.bubble ? (
                        <div className="mt-4 border-t border-[var(--landing-rule)] pt-3 text-[13px] leading-snug text-[var(--landing-ink-muted)]">
                          <span className="mb-2 inline-flex rounded-md bg-[rgba(18,18,18,0.06)] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[var(--landing-ink)] uppercase">
                            {channelLabel(channel)}
                          </span>
                          <span className="block">{stripChannelPrefix(stage.bubble)}</span>
                        </div>
                      ) : null}
                    </button>
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
