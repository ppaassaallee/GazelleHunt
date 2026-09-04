CREATE TABLE IF NOT EXISTS playbook_installations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  playbook_key TEXT NOT NULL,
  playbook_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT,
  installed_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(company_id, playbook_key),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS playbook_installations_company_idx ON playbook_installations(company_id, status);

ALTER TABLE companies ADD COLUMN playbooks_enabled_json TEXT;
