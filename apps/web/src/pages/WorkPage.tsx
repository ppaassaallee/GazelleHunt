import { useEffect, useState } from "react";
import {
  listExceptions,
  resolveException,
  type RecuperaExceptionItem,
  type RecuperaExceptionType,
} from "@/lib/recupera";

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: currency || "GTQ",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(0)} ${currency}`;
  }
}

function typeLabel(type: RecuperaExceptionType) {
  switch (type) {
    case "broken_promise":
      return "Promesa";
    case "dispute":
      return "Reclamo";
    case "pending_payment":
      return "Pago";
    case "needs_human":
      return "Rocío";
    case "aging":
      return "Vencido";
    default:
      return "Pendiente";
  }
}

function errorMessage(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string };
  if (err?.code === "playbook_disabled" || err?.status === 404) {
    return "Recupera no está habilitado en este entorno.";
  }
  if (err?.status === 401) {
    return "Inicia sesión en Gazelle Hunt (misma sesión / proxy local).";
  }
  if (err?.status === 403) {
    return "Se requiere rol administrador.";
  }
  return err?.message || "No se pudo cargar los pendientes.";
}

export function WorkPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<RecuperaExceptionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const data = await listExceptions();
      setItems(data.items || []);
      setTotal(data.summary?.total ?? data.items?.length ?? 0);
      if (selectedId && !data.items.some((item) => item.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      setItems([]);
      setTotal(0);
      const code = (err as { code?: string }).code;
      if (code !== "playbook_disabled") setError(errorMessage(err));
      else setError("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selected = items.find((item) => item.id === selectedId) || null;

  async function handleResolve(
    item: RecuperaExceptionItem,
    resolution: "dismiss" | "confirm_paid",
  ) {
    setBusyId(item.id);
    setError("");
    try {
      await resolveException(item.type, item.id, resolution);
      setSelectedId(null);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Pendientes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Casos que necesitan tu atención
        </p>
      </header>

      <section
        className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
        aria-label="Total pendientes"
      >
        <p className="text-sm text-[var(--text-secondary)]">Por atender</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
          {loading ? "—" : total}
        </p>
        {!loading && total === 0 && !error && (
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Todo al día
          </p>
        )}
      </section>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>
      ) : items.length === 0 && !error ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Sin pendientes por ahora.
        </p>
      ) : (
        <ul className="space-y-2" aria-label="Lista de pendientes">
          {items.map((item) => {
            const expanded = selectedId === item.id;
            return (
              <li key={`${item.type}-${item.id}`}>
                <button
                  type="button"
                  onClick={() => setSelectedId(expanded ? null : item.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
                    expanded
                      ? "border-[var(--accent)] bg-[var(--surface)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/40"
                  }`}
                  aria-expanded={expanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                        {formatMoney(item.amountCents, item.currency)}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        {typeLabel(item.type)}
                      </p>
                    </div>
                  </div>
                </button>

                {expanded && selected && (
                  <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted,var(--surface))] px-4 py-3 text-sm">
                    <p className="text-[var(--text-secondary)]">
                      Cuenta:{" "}
                      <span className="font-mono text-xs text-[var(--text-primary)]">
                        {selected.obligationId}
                      </span>
                    </p>
                    <p className="mt-1 text-[var(--text-secondary)]">
                      Registrado:{" "}
                      {new Date(selected.createdAt).toLocaleString("es-GT")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.type === "pending_payment" && (
                        <button
                          type="button"
                          disabled={busyId === selected.id}
                          onClick={() => void handleResolve(selected, "confirm_paid")}
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Confirmar pago
                        </button>
                      )}
                      {(selected.type === "broken_promise" ||
                        selected.type === "dispute") && (
                        <button
                          type="button"
                          disabled={busyId === selected.id}
                          onClick={() => void handleResolve(selected, "dismiss")}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-primary)] disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
