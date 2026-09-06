import { apiFetch } from "@/lib/api";

export type JourneyChannel = "email" | "whatsapp" | "sms" | "api";
export type JourneyStatus = "draft" | "active" | "paused" | "archived";

/** Row shape returned by the shared runtime (contact_journey_steps). */
export type JourneyStep = {
  id: string;
  journey_id: string;
  step_order: number;
  delay_minutes: number;
  business_day_offset: number | null;
  channel: JourneyChannel;
  template_name: string | null;
  brevo_template_id: string | null;
  subject_en: string | null;
  subject_es: string | null;
  message_en: string | null;
  message_es: string | null;
  api_url: string | null;
  api_method: string | null;
  api_headers_json: string | null;
  created_at: string;
};

/** Row shape returned by GET /api/journeys (contact_journeys + aggregates). */
export type Journey = {
  id: string;
  company_id: string;
  list_id: string;
  test_id: string;
  created_by_user_id: string;
  name: string;
  status: JourneyStatus;
  locale: string;
  goal_event: string | null;
  stop_on_reply: number | null;
  stop_events_json: string | null;
  created_at: string;
  updated_at: string;
  list_name: string | null;
  company_name: string | null;
  test_name_en: string | null;
  test_name_es: string | null;
  created_by_name: string | null;
  step_count: number;
  list_member_count: number;
  enrollment_count: number;
  completed_count: number;
  active_enrollment_count: number;
  touched_candidate_count: number;
  contacted_candidate_count: number;
  failed_candidate_count: number;
  assessment_completed_count: number;
  queued_event_count: number;
  accepted_event_count: number;
  skipped_event_count: number;
  failed_event_count: number;
  steps: JourneyStep[];
};

export type JourneyStepInput = {
  channel: JourneyChannel;
  delayHours?: number;
  businessDayOffset?: number | null;
  templateName?: string;
  brevoTemplateId?: string;
  subjectEn?: string;
  subjectEs?: string;
  messageEn?: string;
  messageEs?: string;
  apiUrl?: string;
  apiMethod?: "POST" | "PUT" | "PATCH";
  apiHeadersJson?: string;
};

export type CreateJourneyPayload = {
  name: string;
  listId: string;
  testId: string;
  locale?: "es" | "en";
  status?: "draft" | "active";
  steps: JourneyStepInput[];
};

export function listJourneys() {
  return apiFetch<{ journeys: Journey[] }>("/api/journeys");
}

export function createJourney(payload: CreateJourneyPayload) {
  return apiFetch<{ journeyId: string; journeys: Journey[] }>("/api/journeys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateJourneyStatus(id: string, status: JourneyStatus) {
  return apiFetch<{ journeys: Journey[] }>(
    `/api/journeys/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}
