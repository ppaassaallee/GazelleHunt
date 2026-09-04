ALTER TABLE contact_journey_events ADD COLUMN next_retry_at TEXT;

CREATE INDEX IF NOT EXISTS contact_journey_events_retry_idx
ON contact_journey_events(status, next_retry_at, scheduled_at);

ALTER TABLE candidates ADD COLUMN do_not_contact INTEGER NOT NULL DEFAULT 0;
ALTER TABLE candidates ADD COLUMN opt_out_channels_json TEXT;
ALTER TABLE candidates ADD COLUMN quiet_hours_start INTEGER;
ALTER TABLE candidates ADD COLUMN quiet_hours_end INTEGER;
ALTER TABLE candidates ADD COLUMN timezone TEXT;
