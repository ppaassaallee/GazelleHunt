-- goal_event exists since 0012; stop_on_reply / stop_events_json are new configurables.
ALTER TABLE contact_journeys ADD COLUMN stop_on_reply INTEGER NOT NULL DEFAULT 1;
ALTER TABLE contact_journeys ADD COLUMN stop_events_json TEXT;
