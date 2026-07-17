CREATE TABLE IF NOT EXISTS invitation_scenarios (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  construct TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_es TEXT NOT NULL,
  evidence_item_ids_json TEXT NOT NULL,
  reviewer_note TEXT NOT NULL,
  source TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (invitation_id, question_order),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE TABLE IF NOT EXISTS assessment_scenario_responses (
  assessment_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  response_text TEXT NOT NULL,
  response_locale TEXT NOT NULL,
  response_ms INTEGER NOT NULL,
  PRIMARY KEY (assessment_id, scenario_id),
  FOREIGN KEY (assessment_id) REFERENCES assessments(id),
  FOREIGN KEY (scenario_id) REFERENCES invitation_scenarios(id)
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  assessment_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  provider_response_id TEXT,
  evidence_hash TEXT,
  output_hash TEXT,
  output_en_json TEXT,
  output_es_json TEXT,
  evidence_claims_json TEXT,
  limitations_json TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

CREATE INDEX IF NOT EXISTS scenario_invitation_idx ON invitation_scenarios(invitation_id, question_order);
CREATE INDEX IF NOT EXISTS scenario_response_assessment_idx ON assessment_scenario_responses(assessment_id);
