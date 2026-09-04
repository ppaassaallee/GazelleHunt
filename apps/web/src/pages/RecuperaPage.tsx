import { useEffect, useState } from "react";
import {
  getInstallation,
  importObligations,
  installRecupera,
  listObligations,
  type RecuperaInstallation,
  type RecuperaObligation,
} from "@/lib/recupera";

type Props = {
  onBack: () => void;
};

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
  return err?.message || "No se pudo completar la solicitud.";
}

export function RecuperaPage({ onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [installation, setInstallation] = useState<RecuperaInstallation | null>(
    null,
  );
  const [obligations, setObligations] = useState<RecuperaObligation[]>([]);
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reference, setReference] = useState("");

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const installed = await getInstallation();
      setInstallation(installed.installation);
      const listed = await listObligations();
      setObligations(listed.obligations || []);
    } catch (err) {
      setInstallation(null);
      setObligations([]);
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

  async function onInstall() {
    setBusy(true);
    setError("");
    try {
      const result = await installRecupera();
      setInstallation(result.installation);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onAddObligation(event: React.FormEvent) {
    event.preventDefault();
    const amountCents = Math.round(Number(amount) * 100);
    if (!payerName.trim() || !dueDate || !Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Nombre, monto y fecha de vencimiento son obligatorios.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await importObligations([
        {
          payerName: payerName.trim(),
          amountCents,
          balanceCents: amountCents,
          dueDate,
          reference: reference.trim() || undefined,
          currency: "GTQ",
        },
      ]);
      setPayerName("");
      setAmount("");
      setDueDate("");
      setReference("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const pendingCents = obligations.reduce(
    (sum, row) => sum + Number(row.balanceCents || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Playbooks
      </button>

      <header className="mb-8">
        <p className="text-sm text-[var(--text-secondary)]">Playbook</p>
        <h1 className="text-2xl font-semibold tracking-tight">Recupera</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Recupera más. Persigue menos.
        </p>
      </header>

      {error ? (
        <p className="mb-6 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>
      ) : !installation ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-medium">Instalar Recupera</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Activa el playbook de cobranza para esta organización.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onInstall()}
            className="mt-6 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Instalando…" : "Instalar Recupera"}
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <p className="text-sm text-[var(--text-secondary)]">Pendiente</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">
              {formatMoney(pendingCents, "GTQ")}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {obligations.length} obligaciones · v{installation.playbookVersion}
            </p>
          </section>

          <form
            onSubmit={(event) => void onAddObligation(event)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 className="font-medium">Agregar obligación</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Nombre</span>
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Monto (GTQ)</span>
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Vence</span>
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--text-secondary)]">Referencia</span>
                <input
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Agregar"}
            </button>
          </form>

          <section className="flex flex-col gap-2">
            {obligations.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Aún no hay obligaciones.
              </p>
            ) : (
              obligations.slice(0, 50).map((row) => (
                <article
                  key={row.id}
                  className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] py-3"
                >
                  <div>
                    <p className="font-medium">{row.payerName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {row.reference || "Sin referencia"} · {row.stageKey}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {formatMoney(row.balanceCents, row.currency)}
                  </p>
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
