import { useEffect, useState } from "react";
import {
  activateObligation,
  classifyRocioIntent,
  createObligationPortalLink,
  getInstallation,
  importObligations,
  installRecupera,
  listObligations,
  markObligationPaid,
  simulateInboundMessage,
  type RecuperaInstallation,
  type RecuperaObligation,
  type RocioClassification,
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
  const [csvText, setCsvText] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyResult, setReplyResult] = useState<Record<string, RocioClassification | null>>({});

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
    setImportNotice("");
    try {
      await importObligations(
        [
          {
            payerName: payerName.trim(),
            amountCents,
            balanceCents: amountCents,
            dueDate,
            reference: reference.trim() || undefined,
            currency: "GTQ",
          },
        ],
        { autoActivate: true },
      );
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

  async function onImportCsv() {
    if (!csvText.trim()) {
      setError("Pega un CSV con encabezados.");
      return;
    }
    setBusy(true);
    setError("");
    setImportNotice("");
    try {
      const result = await importObligations({ csv: csvText, autoActivate: true });
      const count = result.imported?.length ?? 0;
      const activationErrors = result.activationErrors ?? [];
      if (activationErrors.length) {
        setImportNotice(
          `Importadas ${count}. ${activationErrors.length} no se activaron (${activationErrors.map((row) => row.code).join(", ")}).`,
        );
      } else {
        setImportNotice(`Importadas ${count} obligaciones.`);
      }
      setCsvText("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onActivate(obligationId: string) {
    setActionId(obligationId);
    setError("");
    try {
      await activateObligation(obligationId);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onPortalLink(obligationId: string) {
    setActionId(obligationId);
    setPortalUrl(null);
    setError("");
    try {
      const result = await createObligationPortalLink(obligationId);
      setPortalUrl(result.url);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.url);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onMarkPaid(obligationId: string) {
    setActionId(obligationId);
    setError("");
    try {
      await markObligationPaid(obligationId);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onClassifyReply(obligationId: string) {
    const text = replyText[obligationId]?.trim();
    if (!text) return;
    setActionId(obligationId);
    setError("");
    try {
      const result = await classifyRocioIntent(text, obligationId);
      setReplyResult((prev) => ({ ...prev, [obligationId]: result.classification }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onSimulateReply(obligationId: string) {
    const text = replyText[obligationId]?.trim();
    if (!text) return;
    setActionId(obligationId);
    setError("");
    try {
      const result = await simulateInboundMessage(obligationId, text);
      setReplyResult((prev) => ({ ...prev, [obligationId]: result.classification }));
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
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

      {importNotice ? (
        <p className="mb-6 text-sm text-[var(--text-secondary)]" role="status">
          {importNotice}
        </p>
      ) : null}

      {portalUrl ? (
        <p className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm">
          Link de pago copiado:{" "}
          <a href={portalUrl} className="break-all text-[var(--accent)]" target="_blank" rel="noreferrer">
            {portalUrl}
          </a>
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

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="font-medium">Importar CSV</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Primera fila: encabezados. Montos en quetzales (ej. 4500).
            </p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs"
              placeholder={
                "payerName,payerEmail,payerPhone,reference,amount,dueDate\nAna,,502555,FAC-1,4500,2026-09-01"
              }
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void onImportCsv()}
              className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Importando…" : "Importar CSV"}
            </button>
          </section>

          <section className="flex flex-col gap-2">
            {obligations.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                Aún no hay obligaciones.
              </p>
            ) : (
              obligations.slice(0, 50).map((row) => (
                <article
                  key={row.id}
                  className="flex flex-col gap-3 border-b border-[var(--border)] py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.payerName}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {row.reference || "Sin referencia"} · {row.stageKey}
                      {row.status !== "open" ? ` · ${row.status}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">
                      {formatMoney(row.balanceCents, row.currency)}
                    </p>
                    {row.status === "open" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || actionId === row.id}
                          onClick={() => void onPortalLink(row.id)}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          {actionId === row.id ? "…" : "Link de pago"}
                        </button>
                        <button
                          type="button"
                          disabled={busy || actionId === row.id}
                          onClick={() => void onActivate(row.id)}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          {actionId === row.id ? "…" : "Activar seguimiento"}
                        </button>
                        <button
                          type="button"
                          disabled={busy || actionId === row.id}
                          onClick={() => void onMarkPaid(row.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                        >
                          Marcar pagado
                        </button>
                      </div>
                    ) : null}
                  </div>
                  </div>
                  {row.status === "open" ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] p-3">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">Simular respuesta</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                          placeholder="Ej. Prometo pagar el viernes"
                          value={replyText[row.id] || ""}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy || actionId === row.id}
                            onClick={() => void onClassifyReply(row.id)}
                            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium disabled:opacity-50"
                          >
                            Clasificar
                          </button>
                          <button
                            type="button"
                            disabled={busy || actionId === row.id}
                            onClick={() => void onSimulateReply(row.id)}
                            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                      {replyResult[row.id] ? (
                        <p className="mt-2 text-xs text-[var(--text-secondary)]">
                          {replyResult[row.id]?.intent}
                          {replyResult[row.id]?.promiseDate ? ` · ${replyResult[row.id]?.promiseDate}` : ""}
                          {" · "}
                          {Math.round((replyResult[row.id]?.confidence || 0) * 100)}%
                          {replyResult[row.id]?.needsHuman ? " · revisión humana" : ""}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
