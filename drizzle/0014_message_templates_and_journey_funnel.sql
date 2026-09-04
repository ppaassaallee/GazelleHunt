CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  provider_template_name TEXT,
  provider_template_id TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'draft',
  subject_en TEXT,
  subject_es TEXT,
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (company_id, channel, provider, provider_template_name, language),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS message_templates_scope_idx
  ON message_templates(company_id, channel, status, updated_at DESC);
