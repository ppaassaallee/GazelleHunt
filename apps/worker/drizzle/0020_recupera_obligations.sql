CREATE TABLE IF NOT EXISTS obligations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  subject_candidate_id TEXT,
  payer_name TEXT NOT NULL,
  payer_email TEXT,
  payer_phone TEXT,
  reference TEXT,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'GTQ',
  amount_cents INTEGER NOT NULL,
  balance_cents INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  stage_key TEXT NOT NULL DEFAULT 'PRE_DUE',
  strategy_key TEXT NOT NULL DEFAULT 'EQUILIBRADA',
  status TEXT NOT NULL DEFAULT 'open',
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS obligations_company_stage_idx ON obligations(company_id, stage_key, due_date);
CREATE INDEX IF NOT EXISTS obligations_company_status_idx ON obligations(company_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS promises (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  obligation_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  promise_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (obligation_id) REFERENCES obligations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  obligation_id TEXT NOT NULL,
  reason_code TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (obligation_id) REFERENCES obligations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  obligation_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GTQ',
  provider TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  paid_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (obligation_id) REFERENCES obligations(id)
);
