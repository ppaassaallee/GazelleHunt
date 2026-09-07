import type { StrategyKey } from "@/lib/recupera";

export type RocioMode = "off" | "if_no_reply" | "stage";

export type SeguimientoDraft = {
  strategyKey: StrategyKey;
  rocioMode: RocioMode;
  includePreventive: boolean;
};

type Props = {
  draft: SeguimientoDraft;
  onChange: (draft: SeguimientoDraft) => void;
  preview: string[];
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenStudio?: () => void;
};

const STRATEGIES: Array<{ id: StrategyKey; label: string; body: string }> = [
  {
    id: "AMABLE",
    label: "Amable",
    body: "Recordatorios con más espacio. Ideal si la relación importa.",
  },
  {
    id: "EQUILIBRADA",
    label: "Equilibrada",
    body: "Cadencia media. Empieza suave y se vuelve más directa con el atraso.",
  },
  {
    id: "FIRME",
    label: "Firme",
    body: "Más frecuente. Rocío entra antes. Para cuentas de mayor riesgo.",
  },
];

const ROCIO: Array<{ id: RocioMode; label: string; body: string }> = [
  { id: "off", label: "No interviene", body: "Solo mensajes. Sin llamadas." },
  {
    id: "if_no_reply",
    label: "Solo si no responden",
    body: "Rocío llama al final de la secuencia de esta etapa.",
  },
  {
    id: "stage",
    label: "En esta etapa",
    body: "Rocío forma parte del seguimiento de la etapa actual.",
  },
];

export function SeguimientoWizard({
  draft,
  onChange,
  preview,
  busy,
  onConfirm,
  onCancel,
  onOpenStudio,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase">
        Cómo cobrar
      </p>
      <h3 className="mt-1 text-lg font-semibold tracking-tight">Elige el seguimiento</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        El tono y Rocío. Los mensajes se vuelven más incisivos según el atraso — tú no dibujas el
        flujo.
      </p>

      <p className="mt-6 text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
        Tono
      </p>
      <ul className="mt-2 space-y-2">
        {STRATEGIES.map((item) => {
          const selected = draft.strategyKey === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange({ ...draft, strategyKey: item.id })}
                className={[
                  "w-full rounded-[var(--radius-card)] border px-3.5 py-3 text-left transition-colors",
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
                ].join(" ")}
                aria-pressed={selected}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.body}</p>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
        Rocío
      </p>
      <ul className="mt-2 space-y-2">
        {ROCIO.map((item) => {
          const selected = draft.rocioMode === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange({ ...draft, rocioMode: item.id })}
                className={[
                  "w-full rounded-[var(--radius-card)] border px-3.5 py-3 text-left transition-colors",
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
                ].join(" ")}
                aria-pressed={selected}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.body}</p>
              </button>
            </li>
          );
        })}
      </ul>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={draft.includePreventive}
          onChange={(event) =>
            onChange({ ...draft, includePreventive: event.target.checked })
          }
        />
        <span>
          <span className="block text-sm font-medium">Incluir recordatorios antes de vencer</span>
          <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
            Si está apagado y la cuenta aún no vence, el seguimiento arranca el día de vencimiento.
          </span>
        </span>
      </label>

      <p className="mt-6 text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
        Así va a trabajar
      </p>
      <ol className="mt-2 space-y-1.5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-secondary)] px-3.5 py-3">
        {preview.length ? (
          preview.map((line) => (
            <li key={line} className="text-sm text-[var(--text-primary)]">
              {line}
            </li>
          ))
        ) : (
          <li className="text-sm text-[var(--text-secondary)]">Elige tono y Rocío para ver la vista previa.</li>
        )}
      </ol>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Activando…" : "Activar seguimiento"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius-control)] px-4 text-sm text-[var(--text-secondary)] hover:bg-[var(--hover)]"
        >
          Cancelar
        </button>
        {onOpenStudio ? (
          <button
            type="button"
            onClick={onOpenStudio}
            className="text-left text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
          >
            Ver pasos avanzados (flujos y plantillas)
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Client-side preview mirror of stage-playbooks (keep in sync with band rules). */
export function previewSeguimiento(
  strategyKey: StrategyKey,
  stageKey: string,
  rocioMode: RocioMode,
  includePreventive: boolean,
): string[] {
  const stage = !includePreventive && stageKey === "PRE_DUE" ? "DUE" : stageKey;
  const scale = strategyKey === "AMABLE" ? 1.5 : strategyKey === "FIRME" ? 0.55 : 1;
  const band =
    stage === "PRE_DUE" || stage === "DUE"
      ? "preventivo"
      : stage === "DPD_31_60"
        ? "medio"
        : stage.includes("60") || stage === "LEGAL" || stage === "DISPUTE"
          ? "avanzado"
          : "temprano";

  const lines: string[] = [];
  const push = (hours: number, channel: string) => {
    const h = Math.max(0, Math.round(hours * scale));
    const when = h <= 0 ? "Hoy" : h < 24 ? `+${h} h` : `+${Math.round(h / 24)} d`;
    lines.push(`${when} · ${channel}`);
  };

  if (band === "preventivo") {
    push(0, "WhatsApp");
    push(24, "Email");
  } else if (band === "temprano") {
    push(0, "WhatsApp");
    push(24, "Email");
    push(72, "SMS");
  } else if (band === "medio") {
    push(0, "WhatsApp");
    push(12, "Email");
    push(36, "SMS");
  } else {
    push(0, "Email");
    push(6, "WhatsApp");
  }

  const wantsRocio =
    rocioMode !== "off" &&
    (rocioMode === "stage" ||
      band !== "preventivo" ||
      strategyKey === "FIRME");
  if (wantsRocio) {
    const voiceHours =
      rocioMode === "stage" || strategyKey === "FIRME" || band === "avanzado" || band === "medio"
        ? band === "avanzado"
          ? 12
          : 48
        : 96;
    push(voiceHours, "Rocío (llamada)");
  }
  return lines;
}
