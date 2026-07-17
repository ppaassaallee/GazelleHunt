export const schemaVersion = '0000_tenure_potential_audit';

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

export const logicalBindings = {
  database: 'DB',
  objectStorage: null,
} as const;
