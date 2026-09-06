import type { Journey, JourneyChannel, JourneyStep, JourneyStepInput, JourneyStatus } from "@/lib/journeys";
import type { MessageTemplate, TemplateStatus } from "@/lib/templates";

export type DraftStep = {
  channel: JourneyChannel;
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

export const RECUPERA_FLOW_PREFIX = "Recupera";

export const STAGE_LABELS: Record<string, string> = {
  PRE_DUE: "Antes de vencer",
  DUE: "Día de vencimiento",
  DPD_1_7: "1 a 7 días de atraso",
  DPD_8_15: "8 a 15 días de atraso",
  DPD_16_30: "16 a 30 días de atraso",
  DPD_31_60: "31 a 60 días de atraso",
  DPD_60_PLUS: "Más de 60 días de atraso",
};

export const CHANNEL_LABELS: Record<JourneyChannel, string> = {
  whatsapp: "Enviar WhatsApp",
  email: "Enviar correo",
  sms: "Enviar SMS",
  api: "Avisar a tu sistema",
};

export const STATUS_LABELS: Record<JourneyStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "En pausa",
  archived: "Archivado",
};

export function flowTitle(name: string) {
  const stageKey = name.replace(/^Recupera\s*·\s*/, "").trim();
  return STAGE_LABELS[stageKey] || name;
}

export function statusBadgeClass(status: string) {
  if (status === "active" || status === "approved") return "flow-badge flow-badge-ok";
  if (status === "paused" || status === "draft") return "flow-badge flow-badge-warn";
  if (status === "rejected") return "flow-badge flow-badge-bad";
  return "flow-badge flow-badge-off";
}

export function defaultDraftSteps(): DraftStep[] {
  const base = {
    templateRef: "",
    subjectEs: "Su cuenta con {{brand}}",
    apiUrl: "",
    apiMethod: "POST" as const,
    apiHeadersJson: "",
  };
  return [
    {
      ...base,
      channel: "whatsapp",
      delayHours: 0,
      businessDayOffset: 0,
      messageEs:
        "Hola {{name}}, le escribimos de {{brand}} por su cuenta {{role}}. Responda a este mensaje y le enviamos su enlace de pago.",
      messageEn:
        "Hi {{name}}, {{brand}} here about your account {{role}}. Reply to this message and we will send your payment link.",
    },
    {
      ...base,
      channel: "email",
      delayHours: 0,
      businessDayOffset: 1,
      messageEs:
        "Hola {{name}}, su cuenta {{role}} con {{brand}} sigue pendiente. Responda a este mensaje y le enviamos su enlace de pago.",
      messageEn:
        "Hi {{name}}, your account {{role}} with {{brand}} is still pending. Reply and we will send your payment link.",
    },
    {
      ...base,
      channel: "whatsapp",
      delayHours: 0,
      businessDayOffset: 3,
      messageEs:
        "Hola {{name}}, ¿podemos ayudarle a resolver su cuenta {{role}}? Responda a este mensaje y buscamos una solución.",
      messageEn:
        "Hi {{name}}, can we help you resolve your account {{role}}? Reply and we will find a solution.",
    },
  ];
}

export function newDraftStep(channel: JourneyChannel = "whatsapp"): DraftStep {
  return {
    channel,
    delayHours: 0,
    businessDayOffset: 1,
    templateRef: "",
    subjectEs: "Su cuenta con {{brand}}",
    messageEs:
      "Hola {{name}}, le recordamos su cuenta {{role}} con {{brand}}. Responda a este mensaje si necesita ayuda.",
    messageEn: "Hi {{name}}, a reminder about your account {{role}} with {{brand}}. Reply if you need help.",
    apiUrl: "",
    apiMethod: "POST",
    apiHeadersJson: "",
  };
}

/** Same payload shape the legacy builder produced — do not change without a snapshot test. */
export function toStepInput(step: DraftStep): JourneyStepInput {
  if (step.channel === "api") {
    return {
      channel: "api",
      delayHours: step.delayHours,
      businessDayOffset: step.businessDayOffset,
      apiUrl: step.apiUrl,
      apiMethod: step.apiMethod,
      apiHeadersJson: step.apiHeadersJson || undefined,
      messageEs: step.messageEs,
      messageEn: step.messageEn,
    };
  }
  return {
    channel: step.channel,
    delayHours: step.delayHours,
    businessDayOffset: step.businessDayOffset,
    templateName: step.templateRef || undefined,
    brevoTemplateId: step.channel === "whatsapp" ? step.templateRef || undefined : undefined,
    subjectEs: step.subjectEs || undefined,
    subjectEn: step.subjectEs || undefined,
    messageEs: step.messageEs,
    messageEn: step.messageEn,
  };
}

export function journeyStepsToDraft(steps: JourneyStep[]): DraftStep[] {
  if (!steps.length) return defaultDraftSteps();
  return steps.map((step) => ({
    channel: step.channel,
    delayHours: Math.round((Number(step.delay_minutes) || 0) / 60),
    businessDayOffset: Number(step.business_day_offset ?? 0),
    templateRef: step.brevo_template_id || step.template_name || "",
    subjectEs: step.subject_es || step.subject_en || "Su cuenta con {{brand}}",
    messageEs: step.message_es || "",
    messageEn: step.message_en || "",
    apiUrl: step.api_url || "",
    apiMethod: ((step.api_method as DraftStep["apiMethod"]) || "POST"),
    apiHeadersJson: step.api_headers_json || "",
  }));
}

export function previewMessage(text: string, brand = "Tu empresa") {
  return text
    .replaceAll("{{name}}", "María")
    .replaceAll("{{brand}}", brand)
    .replaceAll("{{role}}", "Renta agosto");
}

export function whatsappMissingTemplate(step: DraftStep) {
  return step.channel === "whatsapp" && !step.templateRef.trim();
}

export function canActivateDraft(steps: DraftStep[]) {
  return steps.length > 0 && !steps.some(whatsappMissingTemplate);
}

export function templateTransitions(status: TemplateStatus): TemplateStatus[] {
  switch (status) {
    case "draft":
      return ["approved", "archived"];
    case "approved":
      return ["active", "paused", "archived"];
    case "active":
      return ["paused", "archived"];
    case "paused":
      return ["active", "archived"];
    case "rejected":
      return ["draft", "archived"];
    case "archived":
      return [];
    default:
      return ["archived"];
  }
}

export function approvedWhatsappTemplates(templates: MessageTemplate[]) {
  return templates.filter(
    (template) => template.channel === "whatsapp" && ["approved", "active"].includes(template.status),
  );
}

export function filterRecuperaJourneys(all: Journey[]) {
  const recupera = all.filter((journey) => (journey.name || "").startsWith(RECUPERA_FLOW_PREFIX));
  return recupera.length ? recupera : all;
}

export function errorMessage(error: unknown) {
  const err = error as { status?: number; code?: string; message?: string };
  if (err?.code === "playbook_disabled" || err?.status === 404) {
    return "Recupera no está habilitado en este entorno.";
  }
  if (err?.status === 401) return "Inicia sesión para continuar.";
  if (err?.status === 403) return "Se requiere rol administrador.";
  return err?.message || "No se pudo completar la solicitud.";
}
