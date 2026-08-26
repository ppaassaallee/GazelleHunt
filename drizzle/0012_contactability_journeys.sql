CREATE TABLE IF NOT EXISTS contact_journeys (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  locale TEXT NOT NULL DEFAULT 'en',
  goal_event TEXT NOT NULL DEFAULT 'assessment_completed',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (list_id) REFERENCES candidate_lists(id),
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contact_journey_steps (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  delay_minutes INTEGER NOT NULL,
  channel TEXT NOT NULL,
  template_name TEXT,
  brevo_template_id TEXT,
  subject_en TEXT,
  subject_es TEXT,
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (journey_id, step_order),
  FOREIGN KEY (journey_id) REFERENCES contact_journeys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_journey_enrollments (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TEXT NOT NULL,
  completed_at TEXT,
  stopped_reason TEXT,
  UNIQUE (journey_id, candidate_id, test_id),
  FOREIGN KEY (journey_id) REFERENCES contact_journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id)
);

CREATE TABLE IF NOT EXISTS contact_journey_events (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  invitation_id TEXT,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (enrollment_id) REFERENCES contact_journey_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES contact_journey_steps(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE INDEX IF NOT EXISTS contact_journeys_scope_idx ON contact_journeys(company_id, list_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS contact_journey_events_due_idx ON contact_journey_events(status, scheduled_at, updated_at);
CREATE INDEX IF NOT EXISTS contact_journey_enrollments_status_idx ON contact_journey_enrollments(journey_id, status);
