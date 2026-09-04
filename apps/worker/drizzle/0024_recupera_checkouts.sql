CREATE TABLE IF NOT EXISTS recupera_checkouts (
  checkout_id TEXT PRIMARY KEY,
  obligation_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (obligation_id) REFERENCES obligations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS recupera_checkouts_obligation_idx ON recupera_checkouts(obligation_id);
