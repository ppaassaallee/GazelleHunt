import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FileSpreadsheet, Loader2, Plus } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import {
  importObligations,
  installRecupera,
  type RecuperaInstallation,
} from "@/lib/recupera";

export type DebtType = "rentas" | "facturas" | "contratos" | "cuotas" | "otro";
export type StrategyKey = "AMABLE" | "EQUILIBRADA" | "FIRME";

export type OnboardingDraft = {
  debtType: DebtType | null;
  strategyKey: StrategyKey;
  csvText: string;
  channels: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
    rocio: boolean;
    payments: boolean;
  };
};

const DEBT_OPTIONS: Array<{ id: DebtType; label: string }> = [
  { id: "rentas", label: "Rentas" },
  { id: "facturas", label: "Facturas" },
  { id: "contratos", label: "Contratos" },
  { id: "cuotas", label: "Cuotas" },
  { id: "otro", label: "Otro" },
];

const STRATEGIES: Array<{
  id: StrategyKey;
  label: string;
  body: string;
  recommended?: boolean;
}> = [
  {
    id: "AMABLE",
    label: "Amable",
    body: "Recordatorios cordiales, más espacio entre contactos.",
  },
  {
    id: "EQUILIBRADA",
    label: "Equilibrada",
    body: "Cadencia estándar con escalamiento gradual.",
    recommended: true,
  },
  {
    id: "FIRME",
    label: "Firme",
    body: "Seguimiento frecuente y voz más temprana.",
  },
];

type Props = {
  onComplete: (installation: RecuperaInstallation) => void;
  onSkipToApp?: () => void;
};

function parseCsvPreview(csv: string) {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return { count: 0, cents: 0 };
  const header = lines[0].toLowerCase();
  const amountIdx = header.split(",").findIndex((col) =>
    ["amount", "amount_cents", "monto", "saldo", "balance"].some((key) => col.includes(key)),
  );
  let cents = 0;
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const raw = amountIdx >= 0 ? cols[amountIdx] : cols[2];
    const n = Number(String(raw || "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(n) || n <= 0) continue;
    cents += n >= 1000 && Number.isInteger(n) ? n : Math.round(n * 100);
  }
  return { count: lines.length - 1, cents };
}

function formatMoney(cents: number) {
  try {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `Q${(cents / 100).toFixed(0)}`;
  }
}

export function RecuperaOnboarding({ onComplete, onSkipToApp }: Props) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"csv" | "manual" | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft>({
    debtType: null,
    strategyKey: "EQUILIBRADA",
    csvText: "",
    channels: {
      whatsapp: true,
      email: true,
      sms: false,
      rocio: false,
      payments: true,
    },
  });

  const preview = useMemo(() => parseCsvPreview(draft.csvText), [draft.csvText]);
  const estimatedJourneys = preview.count || (mode === "manual" ? 1 : 0);
  const excluded = 0;

  async function activate() {
    setBusy(true);
    setError("");
    try {
      const installed = await installRecupera({
        strategyKey: draft.strategyKey,
        debtType: draft.debtType,
        channels: draft.channels,
      });
      if (draft.csvText.trim()) {
        await importObligations({
          csv: draft.csvText,
          autoActivate: true,
          strategyKey: draft.strategyKey,
        });
      }
      onComplete(installed.installation);
    } catch (err) {
      const message = (err as { message?: string }).message || "No se pudo activar Recupera.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col px-5 py-10 md:px-8">
      <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
        Recupera · paso {step} de 5
      </p>

      {step === 1 ? (
        <>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">¿Qué quieres recuperar?</h1>
          <ul className="mt-8 space-y-2">
            {DEBT_OPTIONS.map((option) => {
              const selected = draft.debtType === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => setDraft((value) => ({ ...value, debtType: option.id }))}
                    className={[
                      "flex w-full items-center gap-3 rounded-[var(--radius-card)] border px-4 py-3.5 text-left transition-[border-color,background-color,transform] duration-[var(--motion)]",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-[1]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <span
                      className={[
                        "flex h-4 w-4 items-center justify-center rounded-full border",
                        selected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]",
                      ].join(" ")}
                      aria-hidden
                    >
                      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Agrega tus cuentas</h1>
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => setMode("csv")}
              className={[
                "rounded-[var(--radius-card)] border px-5 py-5 text-left transition-colors duration-[var(--motion)]",
                mode === "csv"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileSpreadsheet size={16} /> Importar Excel / CSV
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Pega el archivo exportado. Detectamos montos y fechas.
              </p>
            </button>
            <p className="text-center text-xs text-[var(--text-secondary)]">o</p>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={[
                "rounded-[var(--radius-card)] border px-5 py-5 text-left transition-colors duration-[var(--motion)]",
                mode === "manual"
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus size={16} /> Agregar manualmente
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Empieza con una cuenta y completa el resto después.
              </p>
            </button>
          </div>
          {mode === "csv" ? (
            <div className="mt-5">
              <textarea
                className="min-h-36 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
                placeholder={"name,amount,due_date,reference\nAna,1500,2026-09-01,FAC-1"}
                value={draft.csvText}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, csvText: event.target.value }))
                }
              />
              {preview.count > 0 ? (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Encontramos <strong className="text-[var(--text-primary)]">{preview.count} obligaciones</strong> por{" "}
                  <strong className="text-[var(--text-primary)]">{formatMoney(preview.cents)}</strong>.
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Elige tu estrategia</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Sin workflows. Solo el tono con el que Rocío trabaja.
          </p>
          <ul className="mt-8 space-y-3">
            {STRATEGIES.map((strategy) => {
              const selected = draft.strategyKey === strategy.id;
              return (
                <li key={strategy.id}>
                  <button
                    type="button"
                    onClick={() => setDraft((value) => ({ ...value, strategyKey: strategy.id }))}
                    className={[
                      "w-full rounded-[var(--radius-card)] border px-5 py-4 text-left transition-colors duration-[var(--motion)]",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover)]",
                    ].join(" ")}
                    aria-pressed={selected}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{strategy.label}</p>
                      {strategy.recommended ? (
                        <span className="text-[11px] font-medium text-[var(--accent)]">Recomendada</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{strategy.body}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Conecta</h1>
          <ul className="mt-8 divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
            {(
              [
                ["whatsapp", "WhatsApp"],
                ["email", "Email"],
                ["sms", "SMS"],
                ["rocio", "Rocío"],
                ["payments", "Pagos"],
              ] as const
            ).map(([key, label]) => {
              const on = draft.channels[key];
              return (
                <li key={key} className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-sm">{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((value) => ({
                        ...value,
                        channels: { ...value.channels, [key]: !value.channels[key] },
                      }))
                    }
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-[var(--motion)]",
                      on
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
                    ].join(" ")}
                    aria-pressed={on}
                  >
                    {on ? "✓" : "+"}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight">Todo listo.</h1>
          <p className="mt-6 text-lg font-medium tracking-tight">
            {estimatedJourneys} seguimientos iniciarán hoy.
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {excluded} quedan excluidos.
          </p>
        </>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-10">
        <div className="flex items-center gap-1">
          {step > 1 ? (
            <IconButton label="Atrás" icon={ArrowLeft} onClick={() => setStep((value) => value - 1)} />
          ) : onSkipToApp ? (
            <button
              type="button"
              onClick={onSkipToApp}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Revisar configuración
            </button>
          ) : null}
        </div>
        {step < 5 ? (
          <button
            type="button"
            disabled={
              (step === 1 && !draft.debtType) ||
              (step === 2 && !mode) ||
              (step === 2 && mode === "csv" && !draft.csvText.trim())
            }
            onClick={() => setStep((value) => value + 1)}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-medium text-white transition-opacity duration-[var(--motion)] disabled:opacity-40"
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void activate()}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-medium text-white transition-opacity duration-[var(--motion)] disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Activar Recupera
          </button>
        )}
      </div>
      {step === 5 ? (
        <button
          type="button"
          onClick={() => setStep(3)}
          className="mt-3 self-end text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Revisar configuración
        </button>
      ) : null}
    </div>
  );
}
