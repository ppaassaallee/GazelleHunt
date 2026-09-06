import { useState } from "react";
import { Mic, Plus, X } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import type { MessageTemplate, TemplateChannel, TemplateStatus } from "@/lib/templates";
import {
  statusBadgeClass,
  templateTransitions,
} from "@/pages/journey-studio/draft";

const CHANNEL_LABELS: Record<TemplateChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Correo",
  sms: "SMS",
};

const STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  active: "Activa",
  paused: "En pausa",
  rejected: "Rechazada",
  archived: "Archivada",
};

type Props = {
  templates: MessageTemplate[];
  busy: boolean;
  onCreate: (payload: {
    channel: TemplateChannel;
    name: string;
    providerTemplateName?: string;
    messageEs: string;
    messageEn: string;
  }) => Promise<void>;
  onStatus: (id: string, status: TemplateStatus, label: string) => void;
};

export function TemplatesPanel({ templates, busy, onCreate, onStatus }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [channel, setChannel] = useState<TemplateChannel>("whatsapp");
  const [name, setName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [messageEs, setMessageEs] = useState(
    "Hola {{name}}, le escribimos de {{brand}} por su cuenta {{role}}. Responda a este mensaje y le enviamos su enlace de pago.",
  );
  const [messageEn, setMessageEn] = useState(
    "Hi {{name}}, {{brand}} here about your account {{role}}. Reply to this message and we will send your payment link.",
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await onCreate({
      channel,
      name: name.trim(),
      providerTemplateName: providerName.trim() || undefined,
      messageEs,
      messageEn,
    });
    setName("");
    setProviderName("");
    setDrawerOpen(false);
  }

  return (
    <div className="mk-templates">
      <div className="mk-templates-toolbar">
        <div>
          <h2>Plantillas</h2>
          <p>Contenido reutilizable para WhatsApp, correo y SMS.</p>
        </div>
        <IconButton
          label="Nueva plantilla"
          icon={Plus}
          tone="accent"
          onClick={() => setDrawerOpen(true)}
        />
      </div>

      <aside className="mk-rocio-note">
        <Mic size={18} strokeWidth={1.75} aria-hidden />
        <div>
          <p className="text-sm font-medium">Script · Rocío</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Todavía no hay canal de voz. Rocío usa estas mismas plantillas como guion.
          </p>
        </div>
      </aside>

      {templates.length === 0 ? (
        <div className="flow-empty">
          <strong>Aún no hay plantillas</strong>
          <span>Crea el contenido reutilizable de WhatsApp, correo y SMS.</span>
        </div>
      ) : (
        <>
          <div className="mk-templates-table-wrap">
            <table className="mk-templates-table">
              <thead>
                <tr>
                  <th>Canal</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Nombre en WhatsApp Business</th>
                  <th>Idioma</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => {
                  const next = templateTransitions(template.status);
                  return (
                    <tr key={template.id}>
                      <td>
                        <span className={`channel-pill ${template.channel}`}>
                          {CHANNEL_LABELS[template.channel]}
                        </span>
                      </td>
                      <td>
                        <strong>{template.name}</strong>
                      </td>
                      <td>
                        <span className={statusBadgeClass(template.status)}>
                          {STATUS_LABELS[template.status]}
                        </span>
                      </td>
                      <td>{template.provider_template_name || "—"}</td>
                      <td>{template.language}</td>
                      <td>
                        <label className="mk-status-select">
                          <span className="sr-only">Cambiar estado</span>
                          <select
                            disabled={busy || !next.length}
                            value=""
                            onChange={(event) => {
                              const status = event.target.value as TemplateStatus;
                              if (!status) return;
                              onStatus(template.id, status, STATUS_LABELS[status]);
                              event.target.value = "";
                            }}
                          >
                            <option value="">Cambiar estado</option>
                            {next.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mk-templates-cards">
            {templates.map((template) => {
              const next = templateTransitions(template.status);
              return (
                <li key={template.id} className="template-card">
                  <div className="template-card-head">
                    <span className={`channel-pill ${template.channel}`}>
                      {CHANNEL_LABELS[template.channel]}
                    </span>
                    <span className={statusBadgeClass(template.status)}>
                      {STATUS_LABELS[template.status]}
                    </span>
                  </div>
                  <strong>{template.name}</strong>
                  <p>{template.message_es || template.message_en}</p>
                  <small>
                    {template.provider_template_name || "Sin nombre de proveedor"} · {template.language}
                  </small>
                  <label className="mk-status-select">
                    <select
                      disabled={busy || !next.length}
                      value=""
                      onChange={(event) => {
                        const status = event.target.value as TemplateStatus;
                        if (!status) return;
                        onStatus(template.id, status, STATUS_LABELS[status]);
                        event.target.value = "";
                      }}
                    >
                      <option value="">Cambiar estado</option>
                      {next.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {drawerOpen ? (
        <div className="mk-drawer" role="dialog" aria-modal="true" aria-label="Nueva plantilla">
          <div className="mk-drawer-panel">
            <div className="mk-drawer-head">
              <strong>Nueva plantilla</strong>
              <IconButton label="Cerrar" icon={X} size="sm" onClick={() => setDrawerOpen(false)} />
            </div>
            <form className="mk-drawer-body" onSubmit={(event) => void submit(event)}>
              <label className="flow-field">
                <span>Canal</span>
                <select
                  className="flow-select"
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as TemplateChannel)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Correo</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label className="flow-field">
                <span>Nombre</span>
                <input
                  className="flow-input"
                  required
                  maxLength={140}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="flow-field">
                <span>Nombre en WhatsApp Business</span>
                <input
                  className="flow-input"
                  maxLength={140}
                  value={providerName}
                  onChange={(event) => setProviderName(event.target.value)}
                  required={channel === "whatsapp"}
                />
                <small>
                  {channel === "whatsapp"
                    ? "Obligatorio: usa el nombre exacto aprobado."
                    : "Opcional."}
                </small>
              </label>
              <label className="flow-field">
                <span>Mensaje en español</span>
                <textarea
                  className="flow-textarea"
                  required
                  maxLength={1200}
                  value={messageEs}
                  onChange={(event) => setMessageEs(event.target.value)}
                />
              </label>
              <label className="flow-field">
                <span>Mensaje en inglés</span>
                <textarea
                  className="flow-textarea"
                  required
                  maxLength={1200}
                  value={messageEn}
                  onChange={(event) => setMessageEn(event.target.value)}
                />
              </label>
              <button className="mk-primary-btn" type="submit" disabled={busy}>
                {busy ? "Creando…" : "Crear plantilla"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
