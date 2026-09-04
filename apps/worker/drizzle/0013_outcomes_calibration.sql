CREATE TABLE IF NOT EXISTS assessment_outcomes (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  outcome_type TEXT NOT NULL,
  outcome_date TEXT NOT NULL,
  tenure_days INTEGER,
  performance_rating INTEGER,
  hired INTEGER,
  started INTEGER,
  still_employed INTEGER,
  source TEXT NOT NULL,
  notes TEXT,
  recorded_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS assessment_outcomes_scope_idx ON assessment_outcomes(company_id, test_id, outcome_date DESC);
CREATE INDEX IF NOT EXISTS assessment_outcomes_assessment_idx ON assessment_outcomes(assessment_id, created_at DESC);
