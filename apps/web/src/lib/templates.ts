import { apiFetch } from "@/lib/api";

export type TemplateChannel = "email" | "whatsapp" | "sms";
export type TemplateProvider = "brevo" | "infobip" | "custom";
export type TemplateStatus =
  | "draft"
  | "approved"
  | "active"
  | "paused"
  | "rejected"
  | "archived";

/** Row shape returned by GET /api/templates (message_templates). */
export type MessageTemplate = {
  id: string;
  company_id: string;
  channel: TemplateChannel;
  provider: TemplateProvider;
  name: string;
  provider_template_name: string | null;
  provider_template_id: string | null;
  language: string;
  status: TemplateStatus;
  subject_en: string | null;
  subject_es: string | null;
  message_en: string;
  message_es: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  created_by_name: string | null;
};

export type CreateTemplatePayload = {
  channel: TemplateChannel;
  name: string;
  messageEn: string;
  messageEs: string;
  provider?: TemplateProvider;
  language?: "es" | "en";
  status?: TemplateStatus;
  providerTemplateName?: string;
  providerTemplateId?: string;
  subjectEn?: string;
  subjectEs?: string;
  companyId?: string;
};

export function listTemplates() {
  return apiFetch<{ templates: MessageTemplate[] }>("/api/templates");
}

export function createTemplate(payload: CreateTemplatePayload) {
  return apiFetch<{ templateId: string; templates: MessageTemplate[] }>(
    "/api/templates",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function updateTemplateStatus(id: string, status: TemplateStatus) {
  return apiFetch<{ templates: MessageTemplate[] }>(
    `/api/templates/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}
