import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import type { JourneyChannel } from "@/lib/journeys";
import type { MessageTemplate } from "@/lib/templates";
import {
  CHANNEL_LABELS,
  approvedWhatsappTemplates,
  previewMessage,
  whatsappMissingTemplate,
  type DraftStep,
} from "@/pages/journey-studio/draft";

type Props = {
  step: DraftStep | null;
  index: number | null;
  stepCount: number;
  templates: MessageTemplate[];
  brandName?: string;
  mobileOpen: boolean;
  onClose: () => void;
  onChange: (index: number, patch: Partial<DraftStep>) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRequestDelete: (index: number) => void;
  confirmDeleteIndex: number | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onGoTemplates: () => void;
};

export function FlowInspector({
  step,
  index,
  stepCount,
  templates,
  brandName,
  mobileOpen,
  onClose,
  onChange,
  onMove,
  onRequestDelete,
  confirmDeleteIndex,
  onConfirmDelete,
  onCancelDelete,
  onGoTemplates,
}: Props) {
  const approved = approvedWhatsappTemplates(templates);
  const open = step && index !== null;

  const body = open ? (
    <>
      <div className="mk-inspector-head">
        <div>
          <p className="mk-inspector-kicker">Paso {index + 1}</p>
          <h3>{CHANNEL_LABELS[step.channel]}</h3>
        </div>
        <div className="mk-inspector-tools">
          <IconButton label="Subir" icon={ArrowUp} size="sm" disabled={index === 0} onClick={() => onMove(index, -1)} />
          <IconButton
            label="Bajar"
            icon={ArrowDown}
            size="sm"
            disabled={index >= stepCount - 1}
            onClick={() => onMove(index, 1)}
          />
          <IconButton label="Cerrar" icon={X} size="sm" onClick={onClose} className="md:hidden" />
        </div>
      </div>

      <div className="mk-inspector-body">
        <label className="flow-field">
          <span>Canal</span>
          <select
            className="flow-select"
            value={step.channel}
            onChange={(event) =>
              onChange(index, { channel: event.target.value as JourneyChannel, templateRef: "" })
            }
          >
            <option value="whatsapp">Enviar WhatsApp</option>
            <option value="email">Enviar correo</option>
            <option value="sms">Enviar SMS</option>
            <option value="api">Avisar a tu sistema</option>
          </select>
        </label>

        <label className="flow-field">
          <span>Día hábil</span>
          <input
            className="flow-input"
            type="number"
            min={0}
            max={30}
            value={step.businessDayOffset}
            onChange={(event) =>
              onChange(index, { businessDayOffset: Number(event.target.value) || 0 })
            }
          />
          <small>Fines de semana se omiten.</small>
        </label>

        <label className="flow-field">
          <span>Horas</span>
          <input
            className="flow-input"
            type="number"
            min={0}
            max={720}
            value={step.delayHours}
            onChange={(event) => onChange(index, { delayHours: Number(event.target.value) || 0 })}
          />
        </label>

        {step.channel === "api" ? (
          <>
            <label className="flow-field">
              <span>Método</span>
              <select
                className="flow-select"
                value={step.apiMethod}
                onChange={(event) =>
                  onChange(index, { apiMethod: event.target.value as DraftStep["apiMethod"] })
                }
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </label>
            <label className="flow-field">
              <span>URL</span>
              <input
                className="flow-input"
                type="url"
                placeholder="https://tu-sistema.com/recupera"
                value={step.apiUrl}
                onChange={(event) => onChange(index, { apiUrl: event.target.value })}
              />
              <small>Debe ser HTTPS.</small>
            </label>
            <details className="mk-inspector-advanced">
              <summary>Cabeceras (avanzado)</summary>
              <textarea
                className="flow-textarea"
                maxLength={1000}
                placeholder='{"Authorization":"Bearer token"}'
                value={step.apiHeadersJson}
                onChange={(event) => onChange(index, { apiHeadersJson: event.target.value })}
              />
            </details>
          </>
        ) : step.channel === "whatsapp" ? (
          <label className="flow-field">
            <span>Plantilla aprobada</span>
            <select
              className="flow-select"
              value={step.templateRef}
              onChange={(event) => onChange(index, { templateRef: event.target.value })}
            >
              <option value="">Elegir plantilla</option>
              {approved.map((template) => (
                <option key={template.id} value={template.provider_template_name || template.id}>
                  {template.provider_template_name || template.name} · {template.language}
                </option>
              ))}
            </select>
            {approved.length ? (
              <small>WhatsApp solo envía con plantilla aprobada.</small>
            ) : (
              <small>
                Aún no hay plantillas aprobadas.{" "}
                <button type="button" className="mk-text-link" onClick={onGoTemplates}>
                  Ir a Plantillas
                </button>
              </small>
            )}
            {whatsappMissingTemplate(step) ? (
              <span className="mk-chip-warn">Falta plantilla</span>
            ) : null}
          </label>
        ) : (
          <label className="flow-field">
            <span>Referencia de plantilla</span>
            <input
              className="flow-input"
              maxLength={120}
              placeholder="Opcional"
              value={step.templateRef}
              onChange={(event) => onChange(index, { templateRef: event.target.value })}
            />
          </label>
        )}

        {step.channel === "email" ? (
          <label className="flow-field">
            <span>Asunto</span>
            <input
              className="flow-input"
              maxLength={180}
              value={step.subjectEs}
              onChange={(event) => onChange(index, { subjectEs: event.target.value })}
            />
          </label>
        ) : null}

        {step.channel !== "api" ? (
          <>
            <label className="flow-field">
              <span>Mensaje en español</span>
              <textarea
                className="flow-textarea"
                maxLength={800}
                value={step.messageEs}
                onChange={(event) => onChange(index, { messageEs: event.target.value })}
              />
            </label>
            <label className="flow-field">
              <span>Mensaje en inglés</span>
              <textarea
                className="flow-textarea"
                maxLength={800}
                value={step.messageEn}
                onChange={(event) => onChange(index, { messageEn: event.target.value })}
              />
            </label>
          </>
        ) : null}

        <div className={`mk-preview mk-preview-${step.channel}`}>
          <p className="mk-preview-label">Vista previa</p>
          <div className="mk-preview-bubble">
            {step.channel === "email" && step.subjectEs ? (
              <strong>{previewMessage(step.subjectEs, brandName)}</strong>
            ) : null}
            <p>{previewMessage(step.messageEs || step.apiUrl || "Sin mensaje", brandName)}</p>
          </div>
        </div>

        <div className="mk-inspector-danger">
          {confirmDeleteIndex === index ? (
            <div className="mk-inline-confirm">
              <span>¿Quitar este paso?</span>
              <button type="button" className="mk-text-link" onClick={onConfirmDelete}>
                Sí, quitar
              </button>
              <button type="button" className="mk-text-link" onClick={onCancelDelete}>
                Cancelar
              </button>
            </div>
          ) : (
            <IconButton
              label="Quitar paso"
              icon={Trash2}
              size="sm"
              tone="danger"
              disabled={stepCount <= 1}
              onClick={() => onRequestDelete(index)}
            />
          )}
        </div>
      </div>
    </>
  ) : (
    <div className="mk-inspector-empty">
      <strong>Inspector</strong>
      <span>Selecciona un paso en el canvas para editarlo.</span>
    </div>
  );

  return (
    <>
      <aside className="mk-inspector mk-inspector--desktop">{body}</aside>
      {mobileOpen && open ? (
        <div className="mk-inspector-sheet" role="dialog" aria-modal="true" aria-label="Configurar paso">
          <div className="mk-inspector-sheet-handle" aria-hidden />
          <div className="mk-inspector-sheet-body">{body}</div>
        </div>
      ) : null}
    </>
  );
}
