import { useEffect, useState } from "react";
import { getInsights } from "@/lib/recupera";

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

export function HomePage() {
  const [pendingCents, setPendingCents] = useState<number | null>(null);
  const [recoveredCents, setRecoveredCents] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getInsights()
      .then((data) => {
        if (!cancelled) {
          setPendingCents(data.pendingCents);
          setRecoveredCents(data.recoveredCentsThisMonth);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPendingCents(null);
          setRecoveredCents(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Buenos días</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Resumen de hoy
        </p>
      </header>

      <section
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
        aria-label="Métrica principal"
      >
        <p className="text-sm text-[var(--text-secondary)]">Pendiente</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
          {pendingCents === null ? "—" : formatMoney(pendingCents)}
        </p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {pendingCents === null
            ? "Sin datos todavía"
            : pendingCents === 0
              ? "Todo al día"
              : recoveredCents !== null && recoveredCents > 0
                ? `${formatMoney(recoveredCents)} recuperado este mes`
                : "Saldo por cobrar"}
        </p>
      </section>
    </div>
  );
}
