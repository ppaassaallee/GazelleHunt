CREATE TABLE IF NOT EXISTS obligation_portal_links (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  obligation_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (obligation_id) REFERENCES obligations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS obligation_portal_links_obligation_idx ON obligation_portal_links(obligation_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS obligation_portal_links_token_idx ON obligation_portal_links(token_hash);
