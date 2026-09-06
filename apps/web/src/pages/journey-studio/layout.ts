import type { Edge, Node } from "@xyflow/react";

export type LinearDraftStep = {
  channel: "whatsapp" | "email" | "sms" | "api";
  delayHours: number;
  businessDayOffset: number;
  templateRef: string;
  subjectEs: string;
  messageEs: string;
  messageEn: string;
  apiUrl: string;
  apiMethod: "POST" | "PUT" | "PATCH";
  apiHeadersJson: string;
};

const CHANNEL_TITLE: Record<LinearDraftStep["channel"], string> = {
  whatsapp: "Enviar WhatsApp",
  email: "Enviar correo",
  sms: "Enviar SMS",
  api: "Avisar a tu sistema",
};

export function waitEdgeLabel(businessDayOffset: number, delayHours: number): string {
  const day = Number(businessDayOffset) || 0;
  const hours = Number(delayHours) || 0;
  if (day <= 0 && hours <= 0) return "mismo día hábil";
  if (day > 0 && hours > 0) return `día hábil ${day} · +${hours} h`;
  if (day > 0) return `día hábil ${day}`;
  return `+${hours} h`;
}

/** Pure layout: vertical spine, fixed positions. Source of truth remains DraftStep[]. */
export function layoutLinear(steps: LinearDraftStep[]): { nodes: Node[]; edges: Edge[] } {
  const x = 200;
  const gap = 140;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "trigger",
    type: "trigger",
    position: { x, y: 0 },
    data: {
      title: "Cuenta en cobranza",
      subtitle: "Empieza al activar la cuenta",
    },
    draggable: false,
  });

  steps.forEach((step, index) => {
    const id = `step-${index}`;
    const y = (index + 1) * gap;
    nodes.push({
      id,
      type: step.channel === "api" ? "webhook" : "send",
      position: { x, y },
      data: {
        index,
        channel: step.channel,
        title: CHANNEL_TITLE[step.channel],
        preview: (step.messageEs || step.subjectEs || step.apiUrl || "").slice(0, 72),
        templateRef: step.templateRef,
        missingTemplate: step.channel === "whatsapp" && !step.templateRef,
      },
      draggable: false,
    });

    const source = index === 0 ? "trigger" : `step-${index - 1}`;
    edges.push({
      id: `e-${source}-${id}`,
      source,
      target: id,
      type: "smoothstep",
      label: waitEdgeLabel(step.businessDayOffset, step.delayHours),
      data: { index, businessDayOffset: step.businessDayOffset, delayHours: step.delayHours },
    });
  });

  const goalY = (steps.length + 1) * gap;
  nodes.push({
    id: "goal",
    type: "goal",
    position: { x, y: goalY },
    data: {
      title: "Pago recibido",
      subtitle: "Se detienen los mensajes. También si el pagador responde.",
    },
    draggable: false,
  });

  const lastSource = steps.length ? `step-${steps.length - 1}` : "trigger";
  edges.push({
    id: `e-${lastSource}-goal`,
    source: lastSource,
    target: "goal",
    type: "smoothstep",
    label: "pago recibido",
    data: { index: steps.length },
  });

  return { nodes, edges };
}
