import { useEffect, useState } from "react";
import { getInsights, type RecuperaInsights } from "@/lib/recupera";

const STAGE_LABELS: Record<string, string> = {
  PRE_DUE: "Pre-vencimiento",
  DUE: "Vencido hoy",
  DPD_1_7: "1–7 días vencido",
  DPD_8_15: "8–15 días vencido",
  DPD_16_30: "16–30 días vencido",
  DPD_31_60: "31–60 días vencido",
  DPD_60_PLUS: "Más de 60 días",
};

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

export function InsightsPage() {
  const [insights, setInsights] = useState<RecuperaInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getInsights()
      .then((data) => {
        if (!cancelled) {
          setInsights(data);
          setError("");
        }
      })
      .catch((err: { code?: string; status?: number }) => {
        if (!cancelled) {
          setInsights(null);
          if (err?.code === "playbook_disabled" || err?.status === 404) {
            setError("");
          } else {
            setError("No se pudieron cargar los insights.");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agingWithBalance = insights?.aging.filter((row) => row.count > 0) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Tendencias y rendimiento
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
      ) : !insights ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Recupera no está habilitado en este entorno.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          <section aria-label="Saldo pendiente">
            <p className="text-sm text-[var(--text-secondary)]">Pendiente</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
              {formatMoney(insights.pendingCents)}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {insights.openObligations} cuentas abiertas ·{" "}
              {formatMoney(insights.recoveredCentsThisMonth)} recuperado este mes
            </p>
          </section>

          {agingWithBalance.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium text-[var(--text-secondary)]">
                Antigüedad
              </h2>
              <ul className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                {agingWithBalance.map((row) => (
                  <li
                    key={row.stageKey}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span>{STAGE_LABELS[row.stageKey] ?? row.stageKey}</span>
                    <span className="tabular-nums text-[var(--text-secondary)]">
                      {row.count} · {formatMoney(row.cents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-sm text-[var(--text-secondary)]">
            Rocío: {insights.rocio.jobsToday} gestiones hoy
            {insights.rocio.needsHuman > 0
              ? ` · ${insights.rocio.needsHuman} necesitan tu ayuda`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}
