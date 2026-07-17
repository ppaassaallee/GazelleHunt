CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  site TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  delivered_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  invitation_id TEXT,
  assessment_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_status TEXT NOT NULL,
  locale TEXT NOT NULL,
  experience_branch TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  potential_index REAL NOT NULL,
  potential_band TEXT NOT NULL,
  fit_score REAL NOT NULL,
  intent_score REAL NOT NULL,
  reliability_score REAL NOT NULL,
  context_score REAL,
  support_profile_json TEXT NOT NULL,
  response_quality_json TEXT NOT NULL,
  scoring_trace_json TEXT NOT NULL,
  weights_json TEXT NOT NULL,
  audit_hash TEXT NOT NULL UNIQUE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE TABLE IF NOT EXISTS assessment_responses (
  assessment_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  raw_response INTEGER NOT NULL,
  reverse_scored INTEGER NOT NULL,
  transformed_response INTEGER NOT NULL,
  scaled_contribution REAL NOT NULL,
  response_ms INTEGER NOT NULL,
  included_in_index INTEGER NOT NULL,
  PRIMARY KEY (assessment_id, item_id),
  FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY,
  invitation_id TEXT,
  provider_message_id TEXT,
  event_type TEXT NOT NULL,
  severity TEXT,
  provider_timestamp TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE INDEX IF NOT EXISTS invitations_candidate_idx ON invitations(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS assessments_candidate_idx ON assessments(candidate_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_invitation_idx ON email_events(invitation_id, created_at DESC);
