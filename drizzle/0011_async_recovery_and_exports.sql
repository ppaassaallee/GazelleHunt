ALTER TABLE send_batch_items ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE send_batch_items ADD COLUMN last_attempt_at TEXT;
ALTER TABLE send_batch_items ADD COLUMN next_attempt_at TEXT;

ALTER TABLE ai_analyses ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_analyses ADD COLUMN last_started_at TEXT;
ALTER TABLE ai_analyses ADD COLUMN next_retry_at TEXT;
ALTER TABLE ai_analyses ADD COLUMN requested_by_email TEXT;

CREATE INDEX IF NOT EXISTS send_batch_items_retry_idx
ON send_batch_items(status, next_attempt_at, updated_at);

CREATE INDEX IF NOT EXISTS ai_analyses_retry_idx
ON ai_analyses(status, next_retry_at, updated_at);
