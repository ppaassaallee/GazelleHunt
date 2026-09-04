import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  getInsights,
  listExceptions,
  type RecuperaInsights,
} from "@/lib/recupera";

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

type Props = {
  user?: { name?: string; email?: string; companyName?: string | null };
  onOpenPlaybooks?: () => void;
  onOpenRecupera?: () => void;
  onOpenWork?: () => void;
};

export function HomePage({ user, onOpenPlaybooks, onOpenRecupera, onOpenWork }: Props) {
  const [insights, setInsights] = useState<RecuperaInsights | null>(null);
  const [attention, setAttention] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getInsights().catch(() => null), listExceptions().catch(() => null)]).then(
      ([insightData, exceptionData]) => {
        if (cancelled) return;
        setInsights(insightData);
        setAttention(exceptionData?.summary?.total ?? null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const rocioWorking = (insights?.rocio.jobsToday ?? 0) > 0 || (insights?.openObligations ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
          Hoy
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          {user?.name ? `Hola, ${user.name.split(" ")[0]}` : "Buenos días"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Instala. Activa. Sucede.
          {user?.companyName ? ` · ${user.companyName}` : ""}
        </p>
      </header>

      <section className="mb-8 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
          Recuperado
        </p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight md:text-5xl">
          {insights ? formatMoney(insights.recoveredCentsThisMonth) : "—"}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {insights
            ? `${formatMoney(insights.pendingCents)} pendiente · ${insights.openObligations} cuentas`
            : "Sin datos todavía"}
        </p>
      </section>

      <section className="mb-8 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <button
          type="button"
          onClick={onOpenRecupera}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--hover)]"
        >
          <div>
            <p className="text-sm font-medium">Rocío</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {rocioWorking ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden />
                  trabajando
                  {insights ? ` · ${insights.openObligations} cuentas` : ""}
                  {insights && insights.activePromises > 0
                    ? ` · ${insights.activePromises} promesas`
                    : ""}
                </span>
              ) : (
                "lista para activar Recupera"
              )}
            </p>
          </div>
          <ArrowUpRight size={16} className="text-[var(--text-secondary)]" />
        </button>
        <button
          type="button"
          onClick={onOpenWork}
          className="flex w-full items-center justify-between gap-4 border-t border-[var(--border)] px-5 py-4 text-left hover:bg-[var(--hover)]"
        >
          <div>
            <p className="text-sm font-medium">Necesita de ti</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {attention === null ? "—" : attention === 0 ? "Sin excepciones" : `${attention} pendientes`}
            </p>
          </div>
          <span className="text-lg font-semibold tabular-nums">{attention ?? "—"}</span>
        </button>
      </section>

      <section className="flex flex-col divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <button
          type="button"
          onClick={onOpenRecupera}
          className="flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--hover)]"
        >
          <div>
            <p className="text-sm font-medium">Recupera</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              by Meikapen · Haz que te paguen
            </p>
          </div>
          <ArrowUpRight size={16} className="text-[var(--text-secondary)]" />
        </button>
        <a
          href="/gazellehunt"
          className="flex items-center justify-between gap-4 px-5 py-4 text-[var(--text-primary)] no-underline hover:bg-[var(--hover)]"
        >
          <div>
            <p className="text-sm font-medium">Gazelle Hunt</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">by Meikapen · contratación</p>
          </div>
          <ArrowUpRight size={16} className="text-[var(--text-secondary)]" />
        </a>
        <button
          type="button"
          onClick={onOpenPlaybooks}
          className="px-5 py-3 text-left text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Ver todos los playbooks →
        </button>
      </section>
    </div>
  );
}
