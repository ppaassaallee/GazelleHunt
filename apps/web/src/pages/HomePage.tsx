import { useEffect, useState } from "react";
import { listExceptions } from "@/lib/recupera";

export function HomePage() {
  const [pendientes, setPendientes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listExceptions()
      .then((data) => {
        if (!cancelled) setPendientes(data.summary?.total ?? data.items?.length ?? 0);
      })
      .catch(() => {
        if (!cancelled) setPendientes(null);
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
        <p className="text-sm text-[var(--text-secondary)]">Pendientes</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
          {pendientes === null ? "—" : pendientes}
        </p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {pendientes === null
            ? "Sin datos todavía"
            : pendientes === 0
              ? "Todo al día"
              : "Casos que necesitan atención"}
        </p>
      </section>
    </div>
  );
}
