import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ContextMenu } from "@/components/ContextMenu";
import { IconButton } from "@/components/IconButton";
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
  if (err?.status === 401) return "Inicia sesión para continuar.";
  if (err?.status === 403) return "Se requiere rol administrador.";
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
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight">Pendientes</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Casos que necesitan tu atención
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
          Por atender
        </p>
        <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight">
          {loading ? "—" : total}
        </p>
      </section>

      {error ? (
        <p className="mb-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>
      ) : items.length === 0 && !error ? (
        <p className="text-sm text-[var(--text-secondary)]">Sin pendientes por ahora.</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
          {items.map((item) => {
            const expanded = selectedId === item.id;
            return (
              <li key={`${item.type}-${item.id}`} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(expanded ? null : item.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-[var(--hover)]"
                  aria-expanded={expanded}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatMoney(item.amountCents, item.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                      {typeLabel(item.type)}
                    </p>
                  </div>
                </button>

                {expanded && selected ? (
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(selected.createdAt).toLocaleString("es-GT")}
                    </p>
                    <div className="flex items-center gap-1">
                      {selected.type === "pending_payment" ? (
                        <IconButton
                          label="Confirmar pago"
                          icon={busyId === selected.id ? Loader2 : Check}
                          tone="accent"
                          size="sm"
                          disabled={busyId === selected.id}
                          onClick={() => void handleResolve(selected, "confirm_paid")}
                          className={busyId === selected.id ? "[&_svg]:animate-spin" : ""}
                        />
                      ) : null}
                      <ContextMenu
                        label="Más del pendiente"
                        size="sm"
                        items={[
                          ...(selected.type === "broken_promise" || selected.type === "dispute"
                            ? [
                                {
                                  id: "dismiss",
                                  label: "Descartar",
                                  disabled: busyId === selected.id,
                                  onSelect: () => void handleResolve(selected, "dismiss"),
                                },
                              ]
                            : []),
                          {
                            id: "open",
                            label: "Ver en Recupera",
                            onSelect: () => {
                              window.location.href = "/ryvo/";
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
