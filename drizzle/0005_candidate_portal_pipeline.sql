ALTER TABLE companies ADD COLUMN candidate_brand_name TEXT;
ALTER TABLE companies ADD COLUMN referral_bonus_cents INTEGER NOT NULL DEFAULT 10000;
ALTER TABLE companies ADD COLUMN candidate_portal_enabled INTEGER NOT NULL DEFAULT 1;

UPDATE companies
SET candidate_brand_name = COALESCE(candidate_brand_name, CASE WHEN id = 'org_legacy' THEN 'Allied Global' ELSE name END);

CREATE TABLE IF NOT EXISTS candidate_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  google_sub TEXT UNIQUE,
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  password_changed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_account_links (
  account_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  linked_at TEXT NOT NULL,
  PRIMARY KEY (account_id, candidate_id),
  FOREIGN KEY (account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ip_hash TEXT,
  user_agent_hash TEXT,
  revoked_at TEXT,
  FOREIGN KEY (account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidate_oauth_states (
  state_hash TEXT PRIMARY KEY,
  access_token_hash TEXT,
  code_verifier TEXT NOT NULL,
  locale TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_portal_links (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recruitment_stages (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  is_terminal INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (company_id, stage_key),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS candidate_pipeline (
  candidate_id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  status_message_en TEXT,
  status_message_es TEXT,
  updated_by_user_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES recruitment_stages(id),
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS candidate_stage_history (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status_message_en TEXT,
  status_message_es TEXT,
  changed_by_user_id TEXT,
  changed_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES recruitment_stages(id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS candidate_communications (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject_en TEXT,
  subject_es TEXT,
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  visible_to_candidate INTEGER NOT NULL DEFAULT 1,
  provider_message_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS candidate_test_access (
  candidate_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  attempt_limit INTEGER NOT NULL DEFAULT 3,
  updated_by_user_id TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (candidate_id, test_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS candidate_referrals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  referrer_account_id TEXT NOT NULL,
  source_candidate_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  bonus_cents INTEGER NOT NULL DEFAULT 10000,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (referrer_account_id, email),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (referrer_account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (source_candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS candidate_account_links_candidate_idx ON candidate_account_links(candidate_id, account_id);
CREATE INDEX IF NOT EXISTS candidate_sessions_account_idx ON candidate_sessions(account_id, expires_at);
CREATE INDEX IF NOT EXISTS candidate_portal_links_candidate_idx ON candidate_portal_links(candidate_id, expires_at);
CREATE INDEX IF NOT EXISTS recruitment_stages_company_idx ON recruitment_stages(company_id, stage_order);
CREATE INDEX IF NOT EXISTS candidate_stage_history_candidate_idx ON candidate_stage_history(candidate_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS candidate_communications_candidate_idx ON candidate_communications(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidate_referrals_account_idx ON candidate_referrals(referrer_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidate_referrals_company_idx ON candidate_referrals(company_id, created_at DESC);
