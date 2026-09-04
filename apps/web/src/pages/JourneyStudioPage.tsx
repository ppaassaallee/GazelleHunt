import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { IconButton } from "@/components/IconButton";

export type JourneyStage = {
  id: string;
  title: string;
  timing: string;
  channels: string[];
  startLabel: string;
  endLabel: string;
};

const STAGES: JourneyStage[] = [
  {
    id: "preventivo",
    title: "Preventivo",
    timing: "5 días antes",
    channels: ["WhatsApp", "Email"],
    startLabel: "5 días antes del vencimiento",
    endLabel: "Día del vencimiento",
  },
  {
    id: "vencimiento",
    title: "Vencimiento",
    timing: "Día 0",
    channels: ["WhatsApp", "Link de pago"],
    startLabel: "Día del vencimiento",
    endLabel: "Fin del día",
  },
  {
    id: "dpd_1_7",
    title: "1–7 días",
    timing: "Después del vencimiento",
    channels: ["Rocío", "WhatsApp"],
    startLabel: "1 día después del vencimiento",
    endLabel: "7 días",
  },
  {
    id: "dpd_8_15",
    title: "8–15 días",
    timing: "Escalamiento",
    channels: ["WhatsApp", "Email", "SMS"],
    startLabel: "8 días",
    endLabel: "15 días",
  },
  {
    id: "dpd_16_30",
    title: "16–30 días",
    timing: "Seguimiento firme",
    channels: ["Rocío", "WhatsApp"],
    startLabel: "16 días",
    endLabel: "30 días",
  },
];

type Props = {
  onBack: () => void;
};

export function JourneyStudioPage({ onBack }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(STAGES[2]?.id ?? null);
  const selected = STAGES.find((stage) => stage.id === selectedId) || null;
  const [channels, setChannels] = useState({
    whatsapp: true,
    rocio: true,
    sms: false,
  });

  return (
    <div className="mx-auto flex max-w-5xl gap-0 px-5 py-8 md:px-8 md:py-10">
      <div className={`min-w-0 flex-1 ${selected ? "md:pr-6" : ""}`}>
        <div className="mb-8 flex items-start gap-2">
          <IconButton label="Volver" icon={ArrowLeft} onClick={onBack} tone="ghost" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Recupera
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Estrategia</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Etapas verticales. Sin spaghetti.
            </p>
          </div>
        </div>

        <ol className="mx-auto flex max-w-md flex-col items-stretch">
          {STAGES.map((stage, index) => {
            const active = stage.id === selectedId;
            return (
              <li key={stage.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setSelectedId(stage.id)}
                  className={[
                    "w-full rounded-[var(--radius-card)] border px-5 py-4 text-left transition-[border-color,background-color,transform] duration-[var(--motion)]",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <p className="text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase">
                    {stage.title}
                  </p>
                  <p className="mt-1 text-sm font-medium">{stage.timing}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {stage.channels.join(" · ")}
                  </p>
                </button>
                {index < STAGES.length - 1 ? (
                  <span className="my-2 text-[var(--text-secondary)]" aria-hidden>
                    ↓
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {selected ? (
        <aside
          className="fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-[var(--border)] bg-[var(--glass)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl md:static md:z-0 md:max-w-xs md:rounded-[var(--radius-card)] md:border md:self-start"
          aria-label={`Personalizar ${selected.title}`}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{selected.title}</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{selected.timing}</p>
            </div>
            <IconButton label="Cerrar panel" icon={X} size="sm" onClick={() => setSelectedId(null)} />
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Inicio</dt>
              <dd className="mt-1">{selected.startLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Fin</dt>
              <dd className="mt-1">{selected.endLabel}</dd>
            </div>
          </dl>

          <hr className="my-5 border-[var(--border)]" />

          <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
            Acciones
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {(
              [
                ["whatsapp", "WhatsApp"],
                ["rocio", "Rocío"],
                ["sms", "SMS"],
              ] as const
            ).map(([key, label]) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={channels[key]}
                    onChange={() =>
                      setChannels((value) => ({ ...value, [key]: !value[key] }))
                    }
                    className="accent-[var(--accent)]"
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>

          <hr className="my-5 border-[var(--border)]" />

          <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
            Autonomía
          </p>
          <p className="mt-2 text-sm">Rocío</p>
          <p className="mt-1 rounded-[var(--radius-control)] bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            Ejecuta automáticamente
          </p>

          <hr className="my-5 border-[var(--border)]" />

          <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
            Plantilla
          </p>
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-[var(--hover)]"
          >
            Recordatorio estándar
            <span aria-hidden>›</span>
          </button>

          <hr className="my-5 border-[var(--border)]" />

          <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
            Condiciones
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">2 reglas</p>
        </aside>
      ) : null}
    </div>
  );
}
