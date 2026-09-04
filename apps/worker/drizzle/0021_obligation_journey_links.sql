CREATE TABLE IF NOT EXISTS obligation_journey_links (
  obligation_id TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (obligation_id, enrollment_id),
  FOREIGN KEY (obligation_id) REFERENCES obligations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS obligation_journey_links_enrollment_idx ON obligation_journey_links(enrollment_id);
