import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createJourney,
  listJourneys,
  updateJourneyStatus,
  type Journey,
  type JourneyStatus,
} from "@/lib/journeys";
import {
  createTemplate,
  listTemplates,
  updateTemplateStatus,
  type CreateTemplatePayload,
  type MessageTemplate,
  type TemplateStatus,
} from "@/lib/templates";
import { getRecuperaStudio, type StrategyKey } from "@/lib/recupera";
import {
  RECUPERA_FLOW_PREFIX,
  defaultDraftSteps,
  errorMessage,
  filterRecuperaJourneys,
  journeyStepsToDraft,
  newDraftStep,
  toStepInput,
  type DraftStep,
} from "@/pages/journey-studio/draft";
import type { JourneyChannel } from "@/lib/journeys";

export function useStudioData() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [listId, setListId] = useState("");
  const [testId, setTestId] = useState("");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strategyKey, setStrategyKey] = useState<StrategyKey>("EQUILIBRADA");

  const applyJourneys = useCallback((all: Journey[]) => {
    const visible = filterRecuperaJourneys(all);
    setJourneys(visible);
    setSelectedId((current) =>
      current && visible.some((journey) => journey.id === current) ? current : visible[0]?.id ?? null,
    );
    return visible;
  }, []);

  const refresh = useCallback(async (nextStrategy?: StrategyKey) => {
    setError("");
    setLoading(true);
    try {
      const studio = await getRecuperaStudio(nextStrategy);
      setListId(studio.listId);
      setTestId(studio.testId);
      setStrategyKey(studio.strategyKey || nextStrategy || "EQUILIBRADA");
      applyJourneys(studio.journeys || []);
      setTemplates(studio.templates || []);
    } catch (studioError) {
      try {
        const [journeyResult, templateResult] = await Promise.all([listJourneys(), listTemplates()]);
        const visible = applyJourneys(journeyResult.journeys || []);
        setTemplates(templateResult.templates || []);
        setListId(visible[0]?.list_id || "");
        setTestId(visible[0]?.test_id || "");
      } catch {
        setError(errorMessage(studioError));
      }
    } finally {
      setLoading(false);
    }
  }, [applyJourneys]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(async (label: string, action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(label);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const selected = useMemo(
    () => journeys.find((journey) => journey.id === selectedId) || null,
    [journeys, selectedId],
  );

  async function setJourneyStatus(id: string, status: JourneyStatus, label: string) {
    await run(label, async () => {
      await updateJourneyStatus(id, status);
    });
  }

  async function setTemplateStatus(id: string, status: TemplateStatus, label: string) {
    await run(label, async () => {
      await updateTemplateStatus(id, status);
    });
  }

  async function saveTemplate(payload: CreateTemplatePayload) {
    await run("Plantilla creada.", async () => {
      await createTemplate(payload);
    });
  }

  return {
    loading,
    busy,
    error,
    setError,
    notice,
    setNotice,
    listId,
    testId,
    journeys,
    templates,
    selectedId,
    setSelectedId,
    selected,
    strategyKey,
    refresh,
    run,
    setJourneyStatus,
    setTemplateStatus,
    saveTemplate,
  };
}

export function useDraftFlow() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [draftName, setDraftName] = useState("Recordatorio propio");
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>(defaultDraftSteps);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(0);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ name: "Recordatorio propio", steps: defaultDraftSteps() }),
  );
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  const dirty =
    JSON.stringify({ name: draftName, steps: draftSteps }) !== savedSnapshot;

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setDraftSteps((steps) =>
      steps.map((step, position) => (position === index ? { ...step, ...patch } : step)),
    );
  }

  function moveStep(index: number, direction: -1 | 1) {
    setDraftSteps((steps) => {
      const target = index + direction;
      if (target < 0 || target >= steps.length) return steps;
      const next = steps.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSelectedStepIndex((current) => {
      if (current === null) return current;
      if (current === index) return index + direction;
      if (current === index + direction) return index;
      return current;
    });
  }

  function insertStep(index: number, channel: JourneyChannel = "whatsapp") {
    setDraftSteps((steps) => {
      const next = [...steps];
      next.splice(index, 0, newDraftStep(channel));
      return next;
    });
    setSelectedStepIndex(index);
  }

  function removeStep(index: number) {
    setDraftSteps((steps) => {
      if (steps.length <= 1) return steps;
      return steps.filter((_, position) => position !== index);
    });
    setSelectedStepIndex((current) => {
      if (current === null) return 0;
      if (current >= index) return Math.max(0, current - 1);
      return current;
    });
    setConfirmDeleteIndex(null);
  }

  function openNew() {
    const steps = defaultDraftSteps();
    const name = "Recordatorio propio";
    setDraftName(name);
    setDraftSteps(steps);
    setSavedSnapshot(JSON.stringify({ name, steps }));
    setSelectedStepIndex(0);
    setBuilderOpen(true);
  }

  function duplicateFrom(journey: Journey) {
    const steps = journeyStepsToDraft(journey.steps || []);
    const name = `${flowTitleSafe(journey.name)} (copia)`;
    setDraftName(name);
    setDraftSteps(steps);
    setSavedSnapshot("");
    setSelectedStepIndex(0);
    setBuilderOpen(true);
  }

  function markSaved(steps: DraftStep[], name?: string) {
    setSavedSnapshot(JSON.stringify({ name: name ?? draftName, steps }));
  }

  return {
    builderOpen,
    setBuilderOpen,
    draftName,
    setDraftName,
    draftSteps,
    setDraftSteps,
    selectedStepIndex,
    setSelectedStepIndex,
    dirty,
    confirmDeleteIndex,
    setConfirmDeleteIndex,
    updateStep,
    moveStep,
    insertStep,
    removeStep,
    openNew,
    duplicateFrom,
    markSaved,
    toStepInput,
    RECUPERA_FLOW_PREFIX,
  };
}

function flowTitleSafe(name: string) {
  return name.replace(/^Recupera\s*·\s*/, "").trim() || name;
}

export async function persistDraft(opts: {
  draftName: string;
  draftSteps: DraftStep[];
  listId: string;
  testId: string;
}) {
  const trimmed = opts.draftName.trim();
  if (!trimmed || !opts.draftSteps.length) {
    throw new Error("Ponle nombre al flujo y agrega al menos un paso.");
  }
  if (!opts.listId || !opts.testId) {
    throw new Error("El estudio aún no terminó de cargar.");
  }
  return createJourney({
    name: trimmed.startsWith(RECUPERA_FLOW_PREFIX) ? trimmed : `${RECUPERA_FLOW_PREFIX} · ${trimmed}`,
    listId: opts.listId,
    testId: opts.testId,
    locale: "es",
    status: "draft",
    steps: opts.draftSteps.map(toStepInput),
  });
}
