export const schemaVersion = '0002_ai_scenarios_and_analysis';

export type CandidateRecord = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  site: string | null;
  created_at: string;
  updated_at: string;
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
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_configured';
  model: string;
  prompt_version: string;
  evidence_hash: string | null;
  output_hash: string | null;
};

export const logicalBindings = {
  database: 'DB',
  objectStorage: null,
} as const;
