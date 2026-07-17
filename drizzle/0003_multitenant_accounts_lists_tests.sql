PRAGMA defer_foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO companies (id, name, status, created_at, updated_at)
VALUES ('org_legacy', 'Gazelle Platform', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('recruiter', 'admin', 'super_admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  requested_company_name TEXT,
  approved_by TEXT,
  approved_at TEXT,
  last_login_at TEXT,
  password_changed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_single_active_super_admin
ON users((1)) WHERE role = 'super_admin' AND status = 'active';

CREATE TRIGGER IF NOT EXISTS users_super_admin_email_insert
BEFORE INSERT ON users
WHEN NEW.role = 'super_admin' AND lower(NEW.email) <> 'david.alejandro.pa@gmail.com'
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;

CREATE TRIGGER IF NOT EXISTS users_super_admin_email_update
BEFORE UPDATE OF role, email ON users
WHEN NEW.role = 'super_admin' AND lower(NEW.email) <> 'david.alejandro.pa@gmail.com'
BEGIN
  SELECT RAISE(ABORT, 'super_admin_email_restricted');
END;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  rate_key TEXT NOT NULL,
  action TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY (rate_key, action)
);

CREATE TABLE candidates_next (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  owner_user_id TEXT,
  email TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  site TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  UNIQUE (company_id, email)
);

INSERT INTO candidates_next (id, company_id, owner_user_id, email, name, phone, role, site, created_at, updated_at)
SELECT id, 'org_legacy', NULL, email, name, phone, role, site, created_at, updated_at FROM candidates;

DROP TABLE candidates;
ALTER TABLE candidates_next RENAME TO candidates;

CREATE INDEX IF NOT EXISTS candidates_company_owner_idx ON candidates(company_id, owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assessment_tests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  engine_key TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'draft', 'archived')),
  estimated_minutes INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO assessment_tests
  (id, code, slug, name_en, name_es, description_en, description_es, engine_key, version, status, estimated_minutes, item_count, created_at, updated_at)
VALUES
  ('test_tenure_potential', 'TP-001', 'tenure-potential', 'Tenure Potential', 'Potencial de Permanencia',
   'Transparent assessment of role alignment, stay intention, and work reliability.',
   'Evaluacion transparente de alineacion con el rol, intencion de permanencia y confiabilidad laboral.',
   'tenure_potential', '2.0.0-pilot', 'active', 15, 27, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE invitations ADD COLUMN company_id TEXT REFERENCES companies(id);
ALTER TABLE invitations ADD COLUMN test_id TEXT REFERENCES assessment_tests(id);
ALTER TABLE invitations ADD COLUMN list_id TEXT;
ALTER TABLE invitations ADD COLUMN batch_id TEXT;
ALTER TABLE invitations ADD COLUMN created_by_user_id TEXT REFERENCES users(id);

UPDATE invitations SET company_id = 'org_legacy' WHERE company_id IS NULL;
UPDATE invitations SET test_id = 'test_tenure_potential' WHERE test_id IS NULL;

CREATE INDEX IF NOT EXISTS invitations_company_test_idx ON invitations(company_id, test_id, created_at DESC);
CREATE INDEX IF NOT EXISTS invitations_batch_idx ON invitations(batch_id, created_at DESC);

ALTER TABLE assessments ADD COLUMN test_id TEXT REFERENCES assessment_tests(id);
UPDATE assessments SET test_id = 'test_tenure_potential' WHERE test_id IS NULL;
CREATE INDEX IF NOT EXISTS assessments_test_idx ON assessments(test_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS candidate_lists (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS candidate_lists_scope_idx ON candidate_lists(company_id, owner_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS candidate_list_members (
  list_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  added_by_user_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (list_id, candidate_id),
  FOREIGN KEY (list_id) REFERENCES candidate_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS candidate_list_members_candidate_idx ON candidate_list_members(candidate_id, list_id);

CREATE TABLE IF NOT EXISTS candidate_list_tests (
  list_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  added_by_user_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (list_id, test_id),
  FOREIGN KEY (list_id) REFERENCES candidate_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
  FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS send_batches (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'es')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'completed_with_errors', 'failed')),
  total_count INTEGER NOT NULL,
  queued_count INTEGER NOT NULL,
  accepted_count INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (list_id) REFERENCES candidate_lists(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS send_batches_scope_idx ON send_batches(company_id, created_by_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS send_batch_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  invitation_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'accepted', 'failed')),
  provider_message_id TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (batch_id, candidate_id, test_id),
  FOREIGN KEY (batch_id) REFERENCES send_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
  FOREIGN KEY (invitation_id) REFERENCES invitations(id)
);

CREATE INDEX IF NOT EXISTS send_batch_items_batch_idx ON send_batch_items(batch_id, status);
