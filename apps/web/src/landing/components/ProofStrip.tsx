import { Reveal } from "@/landing/components/Reveal";

export type ProofState = {
  label: string;
  hint: string;
};

type Props = {
  heading?: string;
  controlLine?: string;
  reverseLine?: string;
  states: ProofState[];
};

const DEFAULT_STATES: ProofState[] = [
  { label: "Pagó", hint: "Confirmado en el portal o por ti" },
  { label: "Prometió pagar", hint: "Fecha y canal registrados" },
  { label: "Necesita ayuda", hint: "Requiere atención humana" },
  { label: "Escalado", hint: "Sale del flujo automático" },
];

export function ProofStrip({
  heading = "Lo que verás cada día",
  controlLine = "Tú defines el tono, los horarios y cuándo entra una persona.",
  reverseLine = "Sin contrato. Pausa o cancela desde tu cuenta.",
  states = DEFAULT_STATES,
}: Props) {
  return (
    <section className="scroll-mt-24 px-5 py-24 md:px-10 md:py-28" aria-labelledby="proof-heading">
      <Reveal className="mx-auto max-w-6xl">
        <h2
          id="proof-heading"
          className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em]"
        >
          {heading}
        </h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {states.map((state) => (
            <li
              key={state.label}
              className="rounded-2xl border border-[var(--landing-rule)] bg-white px-5 py-6"
            >
              <p className="text-[18px] font-medium tracking-[-0.02em]">{state.label}</p>
              <p className="mt-2 text-[13px] leading-snug text-[var(--landing-ink-muted)]">{state.hint}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-[var(--landing-measure)] text-[14px] text-[var(--landing-ink-muted)]">
          {controlLine}
        </p>
        <p className="mt-3 max-w-[var(--landing-measure)] text-[14px] text-[var(--landing-ink-muted)]">
          {reverseLine}
        </p>
        {/* TODO(owner): add 1 hard metric + 2 real quotes when available. */}
      </Reveal>
    </section>
  );
}
