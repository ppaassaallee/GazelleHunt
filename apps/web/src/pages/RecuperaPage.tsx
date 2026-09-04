import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Link2,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { ContextMenu } from "@/components/ContextMenu";
import { IconButton } from "@/components/IconButton";
import { JourneyStudioPage } from "@/pages/JourneyStudioPage";
import { RecuperaOnboarding } from "@/pages/RecuperaOnboarding";
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

export type RecuperaOpenAction = "add" | "import" | "onboarding" | "studio" | null;

type Props = {
  onBack: () => void;
  initialAction?: RecuperaOpenAction;
};

type Panel = "none" | "add" | "csv" | "reply";

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
  if (err?.status === 401) return "Inicia sesión para continuar.";
  if (err?.status === 403) return "Se requiere rol administrador.";
  return err?.message || "No se pudo completar la solicitud.";
}

function stageTone(stageKey: string) {
  if (stageKey === "PAID" || stageKey.includes("PAID")) return "text-[var(--success)]";
  if (stageKey.includes("60") || stageKey.includes("LEGAL")) return "text-[var(--danger)]";
  return "text-[var(--text-secondary)]";
}

export function RecuperaPage({ onBack, initialAction = null }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [installation, setInstallation] = useState<RecuperaInstallation | null>(null);
  const [obligations, setObligations] = useState<RecuperaObligation[]>([]);
  const [playbookDisabled, setPlaybookDisabled] = useState(false);
  const [panel, setPanel] = useState<Panel>("none");
  const [forceOnboarding, setForceOnboarding] = useState(initialAction === "onboarding");
  const [studioOpen, setStudioOpen] = useState(initialAction === "studio");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [reference, setReference] = useState("");
  const [csvText, setCsvText] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyResult, setReplyResult] = useState<RocioClassification | null>(null);

  const pendingCents = useMemo(
    () => obligations.reduce((sum, row) => sum + Number(row.balanceCents || 0), 0),
    [obligations],
  );
  const selected = obligations.find((row) => row.id === selectedId) || null;

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const installed = await getInstallation();
      setInstallation(installed.installation);
      setPlaybookDisabled(false);
      const listed = await listObligations();
      setObligations(listed.obligations || []);
    } catch (err) {
      setInstallation(null);
      setObligations([]);
      const code = (err as { code?: string }).code;
      if (code === "playbook_disabled") {
        setPlaybookDisabled(true);
        setError("");
      } else {
        setPlaybookDisabled(false);
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (initialAction === "add") setPanel("add");
    if (initialAction === "import") setPanel("csv");
    if (initialAction === "onboarding") setForceOnboarding(true);
    if (initialAction === "studio") setStudioOpen(true);
  }, [initialAction]);

  async function onInstallQuick() {
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
      setError("Nombre, monto y fecha son obligatorios.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
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
      setPanel("none");
      setNotice("Obligación agregada.");
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
    setNotice("");
    try {
      const result = await importObligations({ csv: csvText, autoActivate: true });
      const count = result.imported?.length ?? 0;
      const activationErrors = result.activationErrors ?? [];
      setNotice(
        activationErrors.length
          ? `Importadas ${count}. ${activationErrors.length} sin activar.`
          : `Importadas ${count}.`,
      );
      setCsvText("");
      setPanel("none");
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runRowAction(id: string, fn: () => Promise<void>) {
    setActionId(id);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onPortalLink(id: string) {
    await runRowAction(id, async () => {
      const result = await createObligationPortalLink(id);
      setPortalUrl(result.url);
      setNotice("Link de pago listo.");
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(result.url);
    });
  }

  async function onActivate(id: string) {
    await runRowAction(id, async () => {
      await activateObligation(id);
      setNotice("Seguimiento activado.");
      await refresh();
    });
  }

  async function onMarkPaid(id: string) {
    await runRowAction(id, async () => {
      await markObligationPaid(id);
      setNotice("Marcada como pagada.");
      await refresh();
    });
  }

  async function onClassify() {
    if (!replyFor || !replyText.trim()) return;
    setActionId(replyFor);
    setError("");
    try {
      const result = await classifyRocioIntent(replyText, replyFor);
      setReplyResult(result.classification);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  async function onApplyReply() {
    if (!replyFor || !replyText.trim()) return;
    setActionId(replyFor);
    setError("");
    try {
      const result = await simulateInboundMessage(replyFor, replyText);
      setReplyResult(result.classification);
      setNotice("Rocío aplicó la respuesta.");
      setReplyText("");
      setReplyFor(null);
      setPanel("none");
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  function openReply(id: string) {
    setReplyFor(id);
    setReplyResult(null);
    setReplyText("");
    setPanel("reply");
  }

  if (studioOpen) {
    return <JourneyStudioPage onBack={() => setStudioOpen(false)} />;
  }

  if (!loading && forceOnboarding && !playbookDisabled) {
    return (
      <RecuperaOnboarding
        onComplete={(next) => {
          setInstallation(next);
          setForceOnboarding(false);
          void refresh();
        }}
        onSkipToApp={() => setForceOnboarding(false)}
      />
    );
  }

  if (!loading && !installation && !playbookDisabled && !error) {
    return (
      <RecuperaOnboarding
        onComplete={(next) => {
          setInstallation(next);
          void refresh();
        }}
        onSkipToApp={() => void onInstallQuick()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <IconButton label="Volver a playbooks" icon={ArrowLeft} onClick={onBack} tone="ghost" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Recupera · by Meikapen
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Cobranza</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Rocío powered by Meikapen</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Actualizar"
            icon={loading || busy ? Loader2 : RefreshCw}
            onClick={() => void refresh()}
            disabled={loading || busy}
            className={loading || busy ? "[&_svg]:animate-spin" : ""}
          />
          {installation ? (
            <>
              <IconButton
                label="Agregar obligación"
                icon={Plus}
                tone="accent"
                onClick={() => setPanel(panel === "add" ? "none" : "add")}
              />
              <ContextMenu
                label="Más acciones"
                items={[
                  {
                    id: "import",
                    label: "Importar cuentas",
                    onSelect: () => setPanel("csv"),
                  },
                  {
                    id: "studio",
                    label: "Personalizar estrategia",
                    onSelect: () => setStudioOpen(true),
                  },
                  {
                    id: "onboarding",
                    label: "Rehacer onboarding",
                    onSelect: () => setForceOnboarding(true),
                  },
                ]}
              />
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-4 text-sm text-[var(--text-secondary)]" role="status">
          {notice}
        </p>
      ) : null}
      {portalUrl ? (
        <p className="mb-4 truncate rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <a href={portalUrl} className="text-[var(--accent)]" target="_blank" rel="noreferrer">
            {portalUrl}
          </a>
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : !installation ? (
        <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight">Activar Recupera</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Cinco pasos. Excel in, Rocío trabajando.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForceOnboarding(true)}
              className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-sm font-medium text-white"
            >
              Empezar
            </button>
            <IconButton
              label={busy ? "Instalando…" : "Instalar sin guía"}
              icon={busy ? Loader2 : Play}
              disabled={busy}
              onClick={() => void onInstallQuick()}
              className={busy ? "[&_svg]:animate-spin" : ""}
            />
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-6 py-7 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
              Pendiente
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {formatMoney(pendingCents, "GTQ")}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {obligations.length} cuentas · estrategia{" "}
              {installation.config?.strategyKey || "EQUILIBRADA"}
            </p>
          </section>

          {panel === "add" ? (
            <form
              onSubmit={(e) => void onAddObligation(e)}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Nueva obligación</h2>
                <IconButton label="Cerrar" icon={X} size="sm" onClick={() => setPanel("none")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Nombre", payerName, setPayerName, "text", true],
                  ["Monto GTQ", amount, setAmount, "number", true],
                  ["Vence", dueDate, setDueDate, "date", true],
                  ["Referencia", reference, setReference, "text", false],
                ].map(([label, value, setter, type, required]) => (
                  <label key={String(label)} className="flex flex-col gap-1.5 text-sm">
                    <span className="text-xs text-[var(--text-secondary)]">{label as string}</span>
                    <input
                      className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 outline-none transition focus:border-[var(--accent)]"
                      type={type as string}
                      value={value as string}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      required={required as boolean}
                      min={type === "number" ? "1" : undefined}
                      step={type === "number" ? "0.01" : undefined}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <IconButton
                  label={busy ? "Guardando…" : "Guardar"}
                  icon={busy ? Loader2 : Plus}
                  tone="accent"
                  disabled={busy}
                  type="submit"
                  className={busy ? "[&_svg]:animate-spin" : ""}
                />
              </div>
            </form>
          ) : null}

          {panel === "csv" ? (
            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[var(--text-secondary)]" />
                  <h2 className="text-sm font-semibold">Importar CSV</h2>
                </div>
                <IconButton label="Cerrar" icon={X} size="sm" onClick={() => setPanel("none")} />
              </div>
              <textarea
                className="min-h-32 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--accent)]"
                placeholder={"name,email,amount,due_date,reference\nAna,,150,2026-09-01,FAC-1"}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <IconButton
                  label={busy ? "Importando…" : "Importar"}
                  icon={busy ? Loader2 : Upload}
                  tone="accent"
                  disabled={busy}
                  onClick={() => void onImportCsv()}
                  className={busy ? "[&_svg]:animate-spin" : ""}
                />
              </div>
            </section>
          ) : null}

          {panel === "reply" && replyFor ? (
            <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[var(--text-secondary)]" />
                  <h2 className="text-sm font-semibold">Simular respuesta · Rocío</h2>
                </div>
                <IconButton
                  label="Cerrar"
                  icon={X}
                  size="sm"
                  onClick={() => {
                    setPanel("none");
                    setReplyFor(null);
                  }}
                />
              </div>
              <input
                className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="Ej. Prometo pagar el viernes"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="mt-3 flex items-center justify-end gap-1">
                <IconButton
                  label="Clasificar"
                  icon={Sparkles}
                  disabled={busy || actionId === replyFor}
                  onClick={() => void onClassify()}
                />
                <IconButton
                  label="Aplicar"
                  icon={Play}
                  tone="accent"
                  disabled={busy || actionId === replyFor}
                  onClick={() => void onApplyReply()}
                />
              </div>
              {replyResult ? (
                <p className="mt-3 text-xs text-[var(--text-secondary)]">
                  {replyResult.intent}
                  {replyResult.promiseDate ? ` · ${replyResult.promiseDate}` : ""} ·{" "}
                  {Math.round((replyResult.confidence || 0) * 100)}%
                  {replyResult.needsHuman ? " · revisión humana" : ""}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase">
              <span>Cuenta</span>
              <span className="w-24 text-right">Saldo</span>
              <span className="w-10 text-right" />
            </div>
            {obligations.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                Aún no hay obligaciones. Agrega una o importa un CSV.
              </p>
            ) : (
              obligations.slice(0, 80).map((row) => {
                const busyRow = actionId === row.id;
                return (
                  <article
                    key={row.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--hover)]"
                  >
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => setSelectedId(row.id)}
                    >
                      <p className="truncate text-sm font-medium">{row.payerName}</p>
                      <p className={`mt-0.5 truncate text-xs ${stageTone(row.stageKey)}`}>
                        {row.reference || "Sin referencia"} · {row.stageKey}
                        {row.status !== "open" ? ` · ${row.status}` : ""}
                      </p>
                    </button>
                    <p className="w-24 text-right text-sm font-medium tabular-nums">
                      {formatMoney(row.balanceCents, row.currency)}
                    </p>
                    <div className="flex w-10 items-center justify-end">
                      {row.status === "open" ? (
                        <ContextMenu
                          label={`Acciones · ${row.payerName}`}
                          size="sm"
                          items={[
                            {
                              id: "portal",
                              label: "Link de pago",
                              disabled: busy || busyRow,
                              onSelect: () => void onPortalLink(row.id),
                            },
                            {
                              id: "activate",
                              label: "Activar seguimiento",
                              disabled: busy || busyRow,
                              onSelect: () => void onActivate(row.id),
                            },
                            {
                              id: "reply",
                              label: "Simular respuesta",
                              disabled: busy || busyRow,
                              onSelect: () => openReply(row.id),
                            },
                            {
                              id: "paid",
                              label: "Marcar pagado",
                              disabled: busy || busyRow,
                              onSelect: () => void onMarkPaid(row.id),
                            },
                          ]}
                        />
                      ) : (
                        <span className="pr-2 text-xs text-[var(--text-secondary)]">—</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      )}

      {selected ? (
        <aside
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--glass)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl"
          aria-label={`Caso ${selected.payerName}`}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-[var(--text-secondary)] uppercase">
                Caso
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{selected.payerName}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {selected.reference || "Sin referencia"} · {selected.stageKey}
              </p>
            </div>
            <IconButton label="Cerrar caso" icon={X} size="sm" onClick={() => setSelectedId(null)} />
          </div>
          <p className="text-3xl font-semibold tabular-nums">
            {formatMoney(selected.balanceCents, selected.currency)}
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Vence {selected.dueDate}</p>
          <hr className="my-5 border-[var(--border)]" />
          <p className="text-xs font-medium tracking-wide text-[var(--text-secondary)] uppercase">
            Próximo
          </p>
          <p className="mt-2 text-sm">Rocío sigue el caso · {selected.stageKey}</p>
          <div className="mt-6 flex items-center gap-1">
            <IconButton
              label="Link de pago"
              icon={Link2}
              onClick={() => void onPortalLink(selected.id)}
            />
            <IconButton
              label="Marcar pagado"
              icon={CheckCircle2}
              tone="accent"
              onClick={() => void onMarkPaid(selected.id)}
            />
            <ContextMenu
              label="Más del caso"
              items={[
                {
                  id: "activate",
                  label: "Activar seguimiento",
                  onSelect: () => void onActivate(selected.id),
                },
                {
                  id: "reply",
                  label: "Simular respuesta",
                  onSelect: () => openReply(selected.id),
                },
                {
                  id: "studio",
                  label: "Personalizar estrategia",
                  onSelect: () => setStudioOpen(true),
                },
              ]}
            />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
