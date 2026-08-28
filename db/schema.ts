export const schemaVersion = '0013_outcomes_calibration';

export type CandidateRecord = {
  id: string;
  company_id: string;
  owner_user_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  site: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = 'recruiter' | 'admin' | 'super_admin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export type UserRecord = {
  id: string;
  company_id: string | null;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  requested_company_name: string | null;
};

export type AssessmentTestRecord = {
  id: string;
  code: string;
  slug: string;
  name_en: string;
  name_es: string;
  engine_key: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
};

export type CandidateListRecord = {
  id: string;
  company_id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived';
};

export type ContactChannel = 'email' | 'whatsapp' | 'sms';
export type ContactJourneyStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ContactJourneyEventStatus = 'queued' | 'sending' | 'accepted' | 'failed' | 'skipped';

export type ContactJourneyRecord = {
  id: string;
  company_id: string;
  list_id: string;
  test_id: string;
  created_by_user_id: string;
  name: string;
  status: ContactJourneyStatus;
  locale: 'en' | 'es';
  goal_event: 'assessment_completed';
  created_at: string;
  updated_at: string;
};

export type ContactJourneyStepRecord = {
  id: string;
  journey_id: string;
  step_order: number;
  delay_minutes: number;
  channel: ContactChannel;
  template_name: string | null;
  brevo_template_id: string | null;
  subject_en: string | null;
  subject_es: string | null;
  message_en: string;
  message_es: string;
  created_at: string;
};

export type AssessmentRecord = {
  id: string;
  candidate_id: string;
  invitation_id: string | null;
  assessment_version: string;
  model_version: string;
  model_status: 'pilot_uncalibrated';
  locale: 'en' | 'es';
  experience_branch: 'experienced' | 'new';
  potential_index: number;
  audit_hash: string;
};

export type ScenarioResponseRecord = {
  assessment_id: string;
  scenario_id: string;
  response_text: string;
  response_locale: 'en' | 'es';
  response_ms: number;
};

export type AiAnalysisRecord = {
  assessment_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_configured' | 'not_generated';
  provider: 'OpenAI' | 'Google Gemini' | null;
  model: string;
  prompt_version: string;
  evidence_hash: string | null;
  output_hash: string | null;
  attempt_count: number;
  last_started_at: string | null;
  next_retry_at: string | null;
};

export type AssessmentOutcomeType = 'not_hired' | 'hired' | 'started' | 'checkpoint' | 'exit' | 'performance_review';

export type AssessmentOutcomeRecord = {
  id: string;
  assessment_id: string;
  candidate_id: string;
  company_id: string;
  test_id: string;
  outcome_type: AssessmentOutcomeType;
  outcome_date: string;
  tenure_days: number | null;
  performance_rating: number | null;
  hired: 0 | 1 | null;
  started: 0 | 1 | null;
  still_employed: 0 | 1 | null;
  source: string;
  notes: string | null;
  recorded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CandidateAccountRecord = {
  id: string;
  email: string;
  name: string;
  locale: 'en' | 'es';
  status: 'active' | 'suspended';
  google_sub: string | null;
};

export type RecruitmentStageRecord = {
  id: string;
  company_id: string;
  stage_key: string;
  name_en: string;
  name_es: string;
  stage_order: number;
  is_terminal: 0 | 1;
};

export const logicalBindings = {
  database: 'DB',
  objectStorage: null,
} as const;
