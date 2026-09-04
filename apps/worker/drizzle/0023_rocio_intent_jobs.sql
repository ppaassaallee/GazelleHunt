CREATE TABLE IF NOT EXISTS rocio_intent_jobs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  obligation_id TEXT,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  input_json TEXT NOT NULL,
  output_json TEXT,
  confidence REAL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS rocio_intent_jobs_company_idx ON rocio_intent_jobs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rocio_intent_jobs_obligation_idx ON rocio_intent_jobs(obligation_id, created_at DESC);
