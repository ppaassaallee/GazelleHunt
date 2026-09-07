import { Archive, Copy, Pause, Play } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import type { Journey } from "@/lib/journeys";
import {
  STATUS_LABELS,
  flowTitle,
  parseRecuperaFlowName,
  statusBadgeClass,
} from "@/pages/journey-studio/draft";

type Props = {
  journeys: Journey[];
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onActivate: (id: string) => void;
  onPause: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (journey: Journey) => void;
  mobileHidden?: boolean;
};

export function FlowList({
  journeys,
  selectedId,
  busy,
  onSelect,
  onActivate,
  onPause,
  onArchive,
  onDuplicate,
  mobileHidden,
}: Props) {
  return (
    <aside className={`mk-flow-list ${mobileHidden ? "mk-flow-list--hidden-mobile" : ""}`}>
      <div className="mk-flow-list-head">
        <strong>Etapas de atraso</strong>
        <span>{journeys.length}</span>
      </div>
      {journeys.length === 0 ? (
        <div className="flow-empty compact">
          <strong>Aún no hay flujos</strong>
          <span>Crea el primero o usa los flujos por etapa.</span>
        </div>
      ) : (
        <ul className="mk-flow-list-items">
          {journeys.map((journey) => {
            const active = journey.id === selectedId;
            const profile = parseRecuperaFlowName(journey.name);
            const rocioLabel =
              profile.rocioMode === "off"
                ? "sin Rocío"
                : profile.rocioMode === "stage"
                  ? "Rocío en esta etapa"
                  : "Rocío si no responden";
            return (
              <li key={journey.id}>
                <button
                  type="button"
                  className={`mk-flow-list-item ${active ? "is-active" : ""}`}
                  onClick={() => onSelect(journey.id)}
                >
                  <span className="mk-flow-list-copy">
                    <strong>{flowTitle(journey.name)}</strong>
                    <small>
                      {profile.strategyKey
                        ? `${profile.strategyKey.toLowerCase()} · ${rocioLabel}`
                        : `${Number(journey.active_enrollment_count || journey.enrollment_count || 0)} en seguimiento`}
                    </small>
                  </span>
                  <span className={statusBadgeClass(journey.status)}>
                    {STATUS_LABELS[journey.status] || journey.status}
                  </span>
                </button>
                {active ? (
                  <div className="mk-flow-list-actions">
                    <IconButton
                      label="Activar"
                      icon={Play}
                      size="sm"
                      tone="accent"
                      disabled={busy || journey.status === "active"}
                      onClick={() => onActivate(journey.id)}
                    />
                    <IconButton
                      label="Pausar"
                      icon={Pause}
                      size="sm"
                      disabled={busy || journey.status !== "active"}
                      onClick={() => onPause(journey.id)}
                    />
                    <IconButton
                      label="Duplicar y editar"
                      icon={Copy}
                      size="sm"
                      disabled={busy}
                      onClick={() => onDuplicate(journey)}
                    />
                    <IconButton
                      label="Archivar"
                      icon={Archive}
                      size="sm"
                      tone="danger"
                      disabled={busy || journey.status === "archived"}
                      onClick={() => onArchive(journey.id)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
