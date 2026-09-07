import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import "@/styles/flow-designer.css";
import type { JourneyChannel } from "@/lib/journeys";
import { FlowCanvas } from "@/pages/journey-studio/FlowCanvas";
import { FlowInspector } from "@/pages/journey-studio/FlowInspector";
import { FlowList } from "@/pages/journey-studio/FlowList";
import { TemplatesPanel } from "@/pages/journey-studio/TemplatesPanel";
import {
  CHANNEL_LABELS,
  canActivateDraft,
  flowTitle,
  journeyStepsToDraft,
  parseRecuperaFlowName,
  toStepInput,
} from "@/pages/journey-studio/draft";
import { persistDraft, useDraftFlow, useStudioData } from "@/pages/journey-studio/useStudioData";
import { layoutLinear } from "@/pages/journey-studio/layout";
import type { StrategyKey } from "@/lib/recupera";

type Props = {
  onBack: () => void;
};

type Tab = "flows" | "templates";

export function JourneyStudioPage({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("flows");
  const [mobileListOpen, setMobileListOpen] = useState(true);
  const [readonlyStepIndex, setReadonlyStepIndex] = useState<number | null>(null);
  const studio = useStudioData();
  const draft = useDraftFlow();

  const selectedStep =
    draft.selectedStepIndex !== null ? draft.draftSteps[draft.selectedStepIndex] || null : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (draft.builderOpen) void saveDraft();
      }
      if (event.key === "Escape") {
        draft.setConfirmDeleteIndex(null);
        if (draft.selectedStepIndex !== null) draft.setSelectedStepIndex(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function saveDraft() {
    try {
      await studio.run("Flujo guardado como borrador.", async () => {
        const created = await persistDraft({
          draftName: draft.draftName,
          draftSteps: draft.draftSteps,
          listId: studio.listId,
          testId: studio.testId,
        });
        draft.markSaved(draft.draftSteps, draft.draftName);
        draft.setBuilderOpen(false);
        studio.setSelectedId(created.journeyId);
        setMobileListOpen(true);
      });
    } catch (err) {
      studio.setError(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  }

  const playbookDisabled = studio.error === "Recupera no está habilitado en este entorno.";

  if (playbookDisabled && !studio.loading) {
    return (
      <div className="mk-studio mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-4 px-5 py-16">
        <IconButton label="Volver" icon={ArrowLeft} onClick={onBack} tone="ghost" />
        <h1 className="text-[28px] font-semibold tracking-tight">Recupera no está habilitado</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Este entorno no tiene el playbook activo. Actívalo en configuración del worker o vuelve al
          inicio.
        </p>
      </div>
    );
  }

  const selectedReadonlySteps = studio.selected
    ? journeyStepsToDraft(studio.selected.steps || [])
    : [];
  const selectedReadonlyStep =
    readonlyStepIndex !== null ? selectedReadonlySteps[readonlyStepIndex] || null : null;
  const selectedProfile = studio.selected
    ? parseRecuperaFlowName(studio.selected.name)
    : null;

  return (
    <div className="mk-studio mk-studio-v2 mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <IconButton label="Volver" icon={ArrowLeft} onClick={onBack} tone="ghost" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--text-secondary)] uppercase">
              Recupera · Estrategia
            </p>
            <h1 className="mt-1 text-[24px] font-semibold tracking-tight md:text-[28px]">
              Estrategia de seguimiento
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--text-secondary)]">
              Elige un tono. Recupera adapta mensajes, frecuencia y canales a cada etapa de atraso.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label="Actualizar"
            icon={studio.loading || studio.busy ? Loader2 : RefreshCw}
            disabled={studio.loading || studio.busy}
            onClick={() => void studio.refresh()}
            className={studio.loading || studio.busy ? "[&_svg]:animate-spin" : ""}
          />
          {tab === "flows" ? (
            <IconButton
              label={draft.builderOpen ? "Cerrar borrador" : "Nuevo flujo"}
              icon={draft.builderOpen ? X : Plus}
              tone="accent"
              disabled={studio.loading}
              onClick={() => (draft.builderOpen ? draft.setBuilderOpen(false) : draft.openNew())}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-1 border-b border-[var(--border)]">
        {(
          [
            ["flows", "Flujos"],
            ["templates", "Plantillas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={[
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none",
              tab === key
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "flows" ? (
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Tono de seguimiento">
          <span className="mr-1 text-xs font-medium text-[var(--text-secondary)]">Tono:</span>
          {(["AMABLE", "EQUILIBRADA", "FIRME"] as StrategyKey[]).map((strategy) => (
            <button
              key={strategy}
              type="button"
              disabled={studio.loading || studio.busy}
              onClick={() => {
                setReadonlyStepIndex(null);
                void studio.refresh(strategy);
              }}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                studio.strategyKey === strategy
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--hover)]",
              ].join(" ")}
              aria-pressed={studio.strategyKey === strategy}
            >
              {strategy === "AMABLE"
                ? "Amable"
                : strategy === "EQUILIBRADA"
                  ? "Equilibrada"
                  : "Firme"}
            </button>
          ))}
          <span className="ml-1 text-xs text-[var(--text-secondary)]">
            Cambia las 7 etapas y sus plantillas.
          </span>
        </div>
      ) : null}

      {studio.error ? (
        <p
          className="mb-4 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]"
          role="alert"
        >
          {studio.error}
        </p>
      ) : null}
      {studio.notice ? (
        <p className="mb-4 text-sm text-[var(--text-secondary)]" role="status">
          {studio.notice}
        </p>
      ) : null}

      {studio.loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : tab === "templates" ? (
        <TemplatesPanel
          templates={studio.templates}
          busy={studio.busy}
          onCreate={async (payload) => {
            if (!payload.name || !payload.messageEs.trim() || !payload.messageEn.trim()) {
              studio.setError("Nombre y los dos mensajes son obligatorios.");
              return;
            }
            if (payload.channel === "whatsapp" && !payload.providerTemplateName) {
              studio.setError("WhatsApp requiere el nombre exacto de la plantilla aprobada.");
              return;
            }
            await studio.saveTemplate({
              channel: payload.channel,
              name: payload.name,
              messageEs: payload.messageEs,
              messageEn: payload.messageEn,
              language: "es",
              providerTemplateName: payload.providerTemplateName,
            });
          }}
          onStatus={(id, status, label) =>
            void studio.setTemplateStatus(id, status, `Plantilla · ${label}.`)
          }
        />
      ) : (
        <div
          className={`mk-studio-grid ${draft.builderOpen || !mobileListOpen ? "mk-studio-grid--canvas" : ""}`}
        >
          <FlowList
            journeys={studio.journeys}
            selectedId={studio.selectedId}
            busy={studio.busy}
            mobileHidden={draft.builderOpen || !mobileListOpen}
            onSelect={(id) => {
              studio.setSelectedId(id);
              setReadonlyStepIndex(null);
              draft.setBuilderOpen(false);
              setMobileListOpen(false);
            }}
            onActivate={(id) => void studio.setJourneyStatus(id, "active", "Flujo activado.")}
            onPause={(id) => void studio.setJourneyStatus(id, "paused", "Flujo en pausa.")}
            onArchive={(id) => {
              const ok =
                typeof globalThis.confirm !== "function" ||
                globalThis.confirm("¿Archivar este flujo? Dejará de enviar mensajes.");
              if (!ok) return;
              void studio.setJourneyStatus(id, "archived", "Flujo archivado.");
            }}
            onDuplicate={(journey) => {
              draft.duplicateFrom(journey);
              setMobileListOpen(false);
            }}
          />

          <section className="mk-studio-main">
            {studio.journeys.length === 0 && !draft.builderOpen ? (
              <div className="flow-empty mk-empty-hero">
                <svg
                  width="120"
                  height="160"
                  viewBox="0 0 120 160"
                  aria-hidden
                  className="opacity-40"
                >
                  <circle cx="60" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect
                    x="30"
                    y="50"
                    width="60"
                    height="28"
                    rx="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="30"
                    y="96"
                    width="60"
                    height="28"
                    rx="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M60 32v18M60 78v18" stroke="currentColor" strokeWidth="2" />
                </svg>
                <strong>Aún no hay flujos</strong>
                <span>Diseña el seguimiento que Rocío ejecuta por etapa.</span>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="mk-primary-btn" onClick={() => draft.openNew()}>
                    Crear el primero
                  </button>
                  <button
                    type="button"
                    className="mk-ghost-btn"
                    onClick={() => void studio.refresh()}
                  >
                    Usar los flujos por etapa
                  </button>
                </div>
              </div>
            ) : draft.builderOpen ? (
              <div className="mk-builder">
                <div className="mk-builder-top">
                  <div>
                    <input
                      className="mk-builder-name"
                      value={draft.draftName}
                      maxLength={140}
                      onChange={(event) => draft.setDraftName(event.target.value)}
                      aria-label="Nombre del flujo"
                    />
                    <div className="mk-builder-meta">
                      <span className="flow-badge flow-badge-off">Borrador</span>
                      {draft.dirty ? <span className="mk-chip-warn">Sin guardar</span> : null}
                      {!canActivateDraft(draft.draftSteps) ? (
                        <span className="mk-chip-warn">WhatsApp sin plantilla</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="mk-ghost-btn md:hidden"
                      onClick={() => {
                        draft.setBuilderOpen(false);
                        setMobileListOpen(true);
                      }}
                    >
                      Flujos
                    </button>
                    <IconButton
                      label={studio.busy ? "Guardando…" : "Guardar borrador"}
                      icon={studio.busy ? Loader2 : Save}
                      tone="accent"
                      disabled={studio.busy}
                      onClick={() => void saveDraft()}
                      className={studio.busy ? "[&_svg]:animate-spin" : ""}
                    />
                  </div>
                </div>

                <div className="mk-builder-workspace">
                  <FlowCanvas
                    steps={draft.draftSteps}
                    selectedStepIndex={draft.selectedStepIndex}
                    onSelectStep={draft.setSelectedStepIndex}
                    onInsertAt={(index, channel) =>
                      draft.insertStep(index, (channel || "whatsapp") as JourneyChannel)
                    }
                  />
                  <FlowInspector
                    step={selectedStep}
                    index={draft.selectedStepIndex}
                    stepCount={draft.draftSteps.length}
                    templates={studio.templates}
                    mobileOpen={draft.selectedStepIndex !== null}
                    confirmDeleteIndex={draft.confirmDeleteIndex}
                    onClose={() => draft.setSelectedStepIndex(null)}
                    onChange={draft.updateStep}
                    onMove={draft.moveStep}
                    onRequestDelete={draft.setConfirmDeleteIndex}
                    onConfirmDelete={() => {
                      if (draft.confirmDeleteIndex !== null) {
                        draft.removeStep(draft.confirmDeleteIndex);
                      }
                    }}
                    onCancelDelete={() => draft.setConfirmDeleteIndex(null)}
                    onGoTemplates={() => setTab("templates")}
                  />
                </div>
              </div>
            ) : studio.selected ? (
              <div className="mk-builder">
                <div className="mk-builder-top">
                  <div>
                    <h2 className="text-lg font-semibold">{flowTitle(studio.selected.name)}</h2>
                    <div className="mk-builder-meta">
                      <span
                        className={`flow-badge ${
                          studio.selected.status === "active" ? "flow-badge-ok" : "flow-badge-off"
                        }`}
                      >
                        {studio.selected.status}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {Number(studio.selected.queued_event_count || 0)} en cola ·{" "}
                        {Number(studio.selected.accepted_event_count || 0)} enviados ·{" "}
                        {Number(studio.selected.skipped_event_count || 0)} detenidos
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="mk-ghost-btn md:hidden"
                      onClick={() => setMobileListOpen(true)}
                    >
                      Flujos
                    </button>
                    <IconButton
                      label="Duplicar y editar"
                      icon={Plus}
                      tone="accent"
                      onClick={() => draft.duplicateFrom(studio.selected!)}
                    />
                  </div>
                </div>
                <div className="mk-readonly-workspace">
                  <FlowCanvas
                    steps={selectedReadonlySteps}
                    selectedStepIndex={readonlyStepIndex}
                    onSelectStep={setReadonlyStepIndex}
                    onInsertAt={() => {}}
                    readOnly
                  />
                  <aside className="mk-readonly-detail" aria-live="polite">
                    {selectedReadonlyStep ? (
                      <>
                        <p className="mk-inspector-kicker">
                          Paso {readonlyStepIndex! + 1} de {selectedReadonlySteps.length}
                        </p>
                        <h3 className="mt-1 text-base font-semibold">
                          {CHANNEL_LABELS[selectedReadonlyStep.channel]}
                        </h3>
                        <p className="mt-2 text-xs text-[var(--text-secondary)]">
                          {selectedReadonlyStep.delayHours
                            ? `${selectedReadonlyStep.delayHours} h después`
                            : selectedReadonlyStep.businessDayOffset
                              ? `${selectedReadonlyStep.businessDayOffset} día(s) hábil(es) después`
                              : "Al entrar en esta etapa"}
                        </p>
                        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-3">
                          <p className="text-sm leading-relaxed">
                            {selectedReadonlyStep.messageEs || "Sin mensaje configurado."}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="mk-primary-btn mt-4 w-full"
                          onClick={() => draft.duplicateFrom(studio.selected!)}
                        >
                          Personalizar esta etapa
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mk-inspector-kicker">Detalle</p>
                        <h3 className="mt-1 text-base font-semibold">
                          Selecciona un paso
                        </h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">
                          Haz clic en cualquier mensaje del diagrama para ver su plantilla y momento.
                        </p>
                        {selectedProfile ? (
                          <div className="mt-5 space-y-2 text-xs text-[var(--text-secondary)]">
                            <p>
                              Tono:{" "}
                              <strong className="text-[var(--text-primary)]">
                                {selectedProfile.strategyKey?.toLowerCase()}
                              </strong>
                            </p>
                            <p>
                              Rocío:{" "}
                              <strong className="text-[var(--text-primary)]">
                                {selectedProfile.rocioMode === "off"
                                  ? "no interviene"
                                  : selectedProfile.rocioMode === "stage"
                                    ? "en esta etapa"
                                    : "si no responden"}
                              </strong>
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </aside>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}

export { layoutLinear, toStepInput };
