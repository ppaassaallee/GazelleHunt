const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS candidates (
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
  )`,
  `CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    locale TEXT NOT NULL,
    status TEXT NOT NULL,
    provider_message_id TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    delivered_at TEXT,
    completed_at TEXT,
    company_id TEXT,
    test_id TEXT,
    list_id TEXT,
    batch_id TEXT,
    created_by_user_id TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    invitation_id TEXT,
    assessment_version TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_status TEXT NOT NULL,
    locale TEXT NOT NULL,
    experience_branch TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    potential_index REAL NOT NULL,
    potential_band TEXT NOT NULL,
    fit_score REAL NOT NULL,
    intent_score REAL NOT NULL,
    reliability_score REAL NOT NULL,
    context_score REAL,
    support_profile_json TEXT NOT NULL,
    response_quality_json TEXT NOT NULL,
    scoring_trace_json TEXT NOT NULL,
    weights_json TEXT NOT NULL,
    audit_hash TEXT NOT NULL UNIQUE,
    test_id TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (invitation_id) REFERENCES invitations(id),
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id)
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_responses (
    assessment_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    raw_response INTEGER NOT NULL,
    reverse_scored INTEGER NOT NULL,
    transformed_response INTEGER NOT NULL,
    scaled_contribution REAL NOT NULL,
    response_ms INTEGER NOT NULL,
    included_in_index INTEGER NOT NULL,
    PRIMARY KEY (assessment_id, item_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_email TEXT,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS email_events (
    id TEXT PRIMARY KEY,
    invitation_id TEXT,
    provider_message_id TEXT,
    event_type TEXT NOT NULL,
    severity TEXT,
    provider_timestamp TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
  )`,
  `CREATE TABLE IF NOT EXISTS invitation_scenarios (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    construct TEXT NOT NULL,
    question_en TEXT NOT NULL,
    question_es TEXT NOT NULL,
    evidence_item_ids_json TEXT NOT NULL,
    reviewer_note TEXT NOT NULL,
    source TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (invitation_id, question_order),
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_scenario_responses (
    assessment_id TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    response_text TEXT NOT NULL,
    response_locale TEXT NOT NULL,
    response_ms INTEGER NOT NULL,
    PRIMARY KEY (assessment_id, scenario_id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id),
    FOREIGN KEY (scenario_id) REFERENCES invitation_scenarios(id)
  )`,
  `CREATE TABLE IF NOT EXISTS ai_analyses (
    assessment_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    provider TEXT,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    provider_response_id TEXT,
    evidence_hash TEXT,
    output_hash TEXT,
    output_en_json TEXT,
    output_es_json TEXT,
    evidence_claims_json TEXT,
    limitations_json TEXT,
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    candidate_brand_name TEXT,
    referral_bonus_cents INTEGER NOT NULL DEFAULT 10000,
    candidate_portal_enabled INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    requested_company_name TEXT,
    approved_by TEXT,
    approved_at TEXT,
    last_login_at TEXT,
    password_changed_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )`,
  `DROP INDEX IF EXISTS users_single_active_super_admin`,
  `DROP TRIGGER IF EXISTS users_super_admin_email_insert`,
  `DROP TRIGGER IF EXISTS users_super_admin_email_update`,
  `CREATE TRIGGER IF NOT EXISTS users_super_admin_allowlist_insert
    BEFORE INSERT ON users
    WHEN NEW.role = 'super_admin' AND lower(NEW.email) NOT IN (
      'david.alejandro.pa@gmail.com',
      'karla.ms@alliedglobal.com',
      'jose.le@alliedglobal.com',
      'daniela.ld@alliedglobal.com',
      'eduardo.ac@alliedglobal.com',
      'marcos.gs@alliedglobal.com'
    )
    BEGIN SELECT RAISE(ABORT, 'super_admin_email_restricted'); END`,
  `CREATE TRIGGER IF NOT EXISTS users_super_admin_allowlist_update
    BEFORE UPDATE OF role, email ON users
    WHEN NEW.role = 'super_admin' AND lower(NEW.email) NOT IN (
      'david.alejandro.pa@gmail.com',
      'karla.ms@alliedglobal.com',
      'jose.le@alliedglobal.com',
      'daniela.ld@alliedglobal.com',
      'eduardo.ac@alliedglobal.com',
      'marcos.gs@alliedglobal.com'
    )
    BEGIN SELECT RAISE(ABORT, 'super_admin_email_restricted'); END`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip_hash TEXT,
    user_agent_hash TEXT,
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    requested_by_user_id TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS auth_rate_limits (
    rate_key TEXT NOT NULL,
    action TEXT NOT NULL,
    window_started_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL,
    PRIMARY KEY (rate_key, action)
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_tests (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_es TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_es TEXT NOT NULL,
    engine_key TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    item_count INTEGER NOT NULL,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_lists (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (owner_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_list_members (
    list_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    added_by_user_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (list_id, candidate_id),
    FOREIGN KEY (list_id) REFERENCES candidate_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_list_tests (
    list_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    added_by_user_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (list_id, test_id),
    FOREIGN KEY (list_id) REFERENCES candidate_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
    FOREIGN KEY (added_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS send_batches (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    list_id TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL,
    locale TEXT NOT NULL,
    status TEXT NOT NULL,
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
  )`,
  `CREATE TABLE IF NOT EXISTS send_batch_items (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    invitation_id TEXT,
    status TEXT NOT NULL,
    provider_message_id TEXT,
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (batch_id, candidate_id, test_id),
    FOREIGN KEY (batch_id) REFERENCES send_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_accounts (
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
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_account_links (
    account_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    linked_at TEXT NOT NULL,
    PRIMARY KEY (account_id, candidate_id),
    FOREIGN KEY (account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip_hash TEXT,
    user_agent_hash TEXT,
    revoked_at TEXT,
    FOREIGN KEY (account_id) REFERENCES candidate_accounts(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_oauth_states (
    state_hash TEXT PRIMARY KEY,
    access_token_hash TEXT,
    code_verifier TEXT NOT NULL,
    locale TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_portal_links (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS recruitment_stages (
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
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_pipeline (
    candidate_id TEXT PRIMARY KEY,
    stage_id TEXT NOT NULL,
    status_message_en TEXT,
    status_message_es TEXT,
    updated_by_user_id TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES recruitment_stages(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_stage_history (
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
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_communications (
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
  )`,
  `CREATE TABLE IF NOT EXISTS contact_journeys (
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
  )`,
  `CREATE TABLE IF NOT EXISTS contact_journey_steps (
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
  )`,
  `CREATE TABLE IF NOT EXISTS contact_journey_enrollments (
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
  )`,
  `CREATE TABLE IF NOT EXISTS contact_journey_events (
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
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_test_access (
    candidate_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    attempt_limit INTEGER NOT NULL DEFAULT 3,
    updated_by_user_id TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (candidate_id, test_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS candidate_referrals (
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
  )`,
  `CREATE TABLE IF NOT EXISTS assessment_outcomes (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    test_id TEXT NOT NULL,
    outcome_type TEXT NOT NULL,
    outcome_date TEXT NOT NULL,
    tenure_days INTEGER,
    performance_rating INTEGER,
    hired INTEGER,
    started INTEGER,
    still_employed INTEGER,
    source TEXT NOT NULL,
    notes TEXT,
    recorded_by_user_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (test_id) REFERENCES assessment_tests(id),
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
  )`,
  `CREATE INDEX IF NOT EXISTS invitations_candidate_idx ON invitations(candidate_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS assessments_candidate_idx ON assessments(candidate_id, completed_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS assessments_invitation_unique ON assessments(invitation_id) WHERE invitation_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_events(entity_type, entity_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS email_invitation_idx ON email_events(invitation_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS scenario_invitation_idx ON invitation_scenarios(invitation_id, question_order)`,
  `CREATE INDEX IF NOT EXISTS scenario_response_assessment_idx ON assessment_scenario_responses(assessment_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id, expires_at)`,
  `CREATE INDEX IF NOT EXISTS candidate_lists_scope_idx ON candidate_lists(company_id, owner_user_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS candidate_list_members_candidate_idx ON candidate_list_members(candidate_id, list_id)`,
  `CREATE INDEX IF NOT EXISTS send_batches_scope_idx ON send_batches(company_id, created_by_user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS send_batch_items_batch_idx ON send_batch_items(batch_id, status)`,
  `CREATE INDEX IF NOT EXISTS candidate_account_links_candidate_idx ON candidate_account_links(candidate_id, account_id)`,
  `CREATE INDEX IF NOT EXISTS candidate_sessions_account_idx ON candidate_sessions(account_id, expires_at)`,
  `CREATE INDEX IF NOT EXISTS candidate_portal_links_candidate_idx ON candidate_portal_links(candidate_id, expires_at)`,
  `CREATE INDEX IF NOT EXISTS recruitment_stages_company_idx ON recruitment_stages(company_id, stage_order)`,
  `CREATE INDEX IF NOT EXISTS candidate_stage_history_candidate_idx ON candidate_stage_history(candidate_id, changed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS candidate_communications_candidate_idx ON candidate_communications(candidate_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS candidate_referrals_account_idx ON candidate_referrals(referrer_account_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS candidate_referrals_company_idx ON candidate_referrals(company_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS assessment_outcomes_scope_idx ON assessment_outcomes(company_id, test_id, outcome_date DESC)`,
  `CREATE INDEX IF NOT EXISTS assessment_outcomes_assessment_idx ON assessment_outcomes(assessment_id, created_at DESC)`,
];

const runtimeColumnMigrations = [
  ['companies', 'candidate_brand_name', `ALTER TABLE companies ADD COLUMN candidate_brand_name TEXT`],
  ['companies', 'referral_bonus_cents', `ALTER TABLE companies ADD COLUMN referral_bonus_cents INTEGER NOT NULL DEFAULT 10000`],
  ['companies', 'candidate_portal_enabled', `ALTER TABLE companies ADD COLUMN candidate_portal_enabled INTEGER NOT NULL DEFAULT 1`],
  ['candidates', 'company_id', `ALTER TABLE candidates ADD COLUMN company_id TEXT REFERENCES companies(id)`],
  ['candidates', 'owner_user_id', `ALTER TABLE candidates ADD COLUMN owner_user_id TEXT REFERENCES users(id)`],
  ['invitations', 'company_id', `ALTER TABLE invitations ADD COLUMN company_id TEXT REFERENCES companies(id)`],
  ['invitations', 'test_id', `ALTER TABLE invitations ADD COLUMN test_id TEXT REFERENCES assessment_tests(id)`],
  ['invitations', 'list_id', `ALTER TABLE invitations ADD COLUMN list_id TEXT`],
  ['invitations', 'batch_id', `ALTER TABLE invitations ADD COLUMN batch_id TEXT`],
  ['invitations', 'created_by_user_id', `ALTER TABLE invitations ADD COLUMN created_by_user_id TEXT REFERENCES users(id)`],
  ['assessments', 'test_id', `ALTER TABLE assessments ADD COLUMN test_id TEXT REFERENCES assessment_tests(id)`],
  ['ai_analyses', 'provider', `ALTER TABLE ai_analyses ADD COLUMN provider TEXT`],
  ['send_batch_items', 'attempt_count', `ALTER TABLE send_batch_items ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0`],
  ['send_batch_items', 'last_attempt_at', `ALTER TABLE send_batch_items ADD COLUMN last_attempt_at TEXT`],
  ['send_batch_items', 'next_attempt_at', `ALTER TABLE send_batch_items ADD COLUMN next_attempt_at TEXT`],
  ['ai_analyses', 'attempt_count', `ALTER TABLE ai_analyses ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0`],
  ['ai_analyses', 'last_started_at', `ALTER TABLE ai_analyses ADD COLUMN last_started_at TEXT`],
  ['ai_analyses', 'next_retry_at', `ALTER TABLE ai_analyses ADD COLUMN next_retry_at TEXT`],
  ['ai_analyses', 'requested_by_email', `ALTER TABLE ai_analyses ADD COLUMN requested_by_email TEXT`],
];

const postMigrationStatements = [
  `CREATE UNIQUE INDEX IF NOT EXISTS candidates_company_email_unique ON candidates(company_id, email)`,
  `CREATE INDEX IF NOT EXISTS candidates_company_owner_idx ON candidates(company_id, owner_user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS invitations_company_test_idx ON invitations(company_id, test_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS invitations_batch_idx ON invitations(batch_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS assessments_test_idx ON assessments(test_id, completed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS send_batch_items_retry_idx ON send_batch_items(status, next_attempt_at, updated_at)`,
  `CREATE INDEX IF NOT EXISTS ai_analyses_retry_idx ON ai_analyses(status, next_retry_at, updated_at)`,
  `CREATE INDEX IF NOT EXISTS contact_journeys_scope_idx ON contact_journeys(company_id, list_id, status, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS contact_journey_events_due_idx ON contact_journey_events(status, scheduled_at, updated_at)`,
  `CREATE INDEX IF NOT EXISTS contact_journey_enrollments_status_idx ON contact_journey_enrollments(journey_id, status)`,
  `CREATE INDEX IF NOT EXISTS assessment_outcomes_scope_idx ON assessment_outcomes(company_id, test_id, outcome_date DESC)`,
  `CREATE INDEX IF NOT EXISTS assessment_outcomes_assessment_idx ON assessment_outcomes(assessment_id, created_at DESC)`,
];

let schemaReady = false;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      ...headers,
    },
  });
}

function assetHeaders(contentType, cacheControl = 'no-cache', html = false) {
  const headers = {
    'content-type': contentType,
    'cache-control': cacheControl,
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
  };
  if (html) headers['content-security-policy'] = "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'";
  return headers;
}

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function validEmailAddress(value) {
  const email = String(value || '');
  if (!email || email.length > 254 || /[^\x21-\x7E]/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!/^[a-z0-9](?:[a-z0-9!#$%&'*+/=?^_`{|}~.-]{0,62}[a-z0-9])?$/i.test(local)) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) return false;
  return labels.at(-1).length >= 2;
}

function normalizeCandidateEmail(value) {
  const original = String(value || '').slice(0, 500);
  let email = original.normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim()
    .toLowerCase();
  if (email.startsWith('mailto:')) email = email.slice(7).trim();
  const angleMatch = email.match(/^<([^<>]+)>$/);
  if (angleMatch) email = angleMatch[1].trim();
  if (!validEmailAddress(email)) {
    const withoutLeadingPunctuation = email.replace(/^[?¿:;,]+/, '').trim();
    if (validEmailAddress(withoutLeadingPunctuation)) email = withoutLeadingPunctuation;
  }
  const valid = validEmailAddress(email);
  return { email: valid ? email : '', valid, corrected: valid && email !== original.trim().toLowerCase(), original };
}

function cleanEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  return validEmailAddress(email) ? email : '';
}

function cleanPhoneDigits(value) {
  return cleanText(value, 80).replace(/[^\d]/g, '');
}

const sensitiveEvidencePattern = /\b(age|aged|race|racial|ethnicity|ethnic|nationality|religion|religious|sex|gender|sexual orientation|pregnan\w*|disab\w*|health|medical|diagnos\w*|mental health|family|familia(?:s|r(?:es)?)?|childcare|caregiv\w*|financial|finanzas|politic\w*|union|edad|raza|etnia|nacionalidad|religión|religion|sexo|género|genero|orientación sexual|embaraz\w*|discap\w*|salud(?: mental)?|médic\w*|diagnóstic\w*|diagnostic\w*|cuidador(?:a|es|as)?|responsabilidades? de cuidado|polític\w*|politic\w*|sindicat\w*)\b/iu;
const contactEvidencePattern = /(?:https?:\/\/|www\.|\b[^\s@]+@[^\s@]+\.[^\s@]+\b|(?:\+?\d[\d\s().-]{7,}\d))/iu;
const prohibitedAnalysisPattern = /\b(recommend\w*\s+(?:to\s+)?(?:hire|reject)|should\s+(?:be\s+)?(?:hired|rejected)|hire\s+this\s+candidate|reject\s+this\s+candidate|contratar\s+(?:a\s+)?(?:este|esta)\s+candidat\w*|rechazar\s+(?:a\s+)?(?:este|esta)\s+candidat\w*|diagnos\w*|diagnóstic\w*|high[ -]risk|low[ -]risk|alto\s+riesgo|bajo\s+riesgo)\b/iu;
const internalEvidenceCodePattern = /\b(?:(?:fit|intent|reliability|support|experienced|new)_[a-z0-9_]+|scenario_[123])\b/iu;
const unclearRecruiterPhrasePattern = /\b(?:coaching\s+(?:and|y)\s+voice|solicita\s+coaching\s+y\s+voz|requests?\s+coaching\s+and\s+voice|intención\s+media|moderate\s+intent)\b/iu;

function redactAiEvidence(value) {
  let redacted = false;
  const sentences = cleanText(value, 2500).split(/(?<=[.!?])\s+/u).map((sentence) => {
    if (sensitiveEvidencePattern.test(sentence) || contactEvidencePattern.test(sentence)) {
      redacted = true;
      return '[sensitive or identifying detail omitted]';
    }
    return sentence;
  });
  return { text: sentences.filter((sentence, index) => sentence !== '[sensitive or identifying detail omitted]' || sentences.indexOf(sentence) === index).join(' '), redacted };
}

function validateScenarioOutput(questions, itemIds) {
  const expected = [
    ['scenario_1', 'role_reality'],
    ['scenario_2', 'work_reliability'],
    ['scenario_3', 'stay_intention'],
  ];
  if (!Array.isArray(questions) || questions.length !== 3) return false;
  return expected.every(([id, construct]) => {
    const question = questions.find((entry) => entry.id === id);
    const evidenceIds = question?.evidence_item_ids || [];
    return question?.construct === construct
      && cleanText(question.question_en, 1600).length >= 80
      && cleanText(question.question_es, 1600).length >= 80
      && evidenceIds.length >= 1
      && evidenceIds.every((itemId) => itemIds.has(itemId))
      && !sensitiveEvidencePattern.test(`${question.question_en} ${question.question_es}`);
  });
}

function validateAnalysisOutput(output, evidence) {
  const paragraphs = [...(output?.en?.paragraphs || []), ...(output?.es?.paragraphs || [])];
  if (output?.en?.paragraphs?.length !== 5 || output?.es?.paragraphs?.length !== 5) return false;
  if (paragraphs.some((paragraph) => {
    const words = cleanText(paragraph, 5000).split(/\s+/).filter(Boolean).length;
    return words < 45 || words > 160 || sensitiveEvidencePattern.test(paragraph) || prohibitedAnalysisPattern.test(paragraph);
  })) return false;
  for (const localized of [output.en, output.es]) {
    if (!cleanText(localized?.executive_summary, 3000)
      || !Array.isArray(localized?.observed_strengths) || localized.observed_strengths.length < 2
      || !Array.isArray(localized?.watch_areas) || localized.watch_areas.length < 2
      || !Array.isArray(localized?.interview_focus) || localized.interview_focus.length < 3
      || !Array.isArray(localized?.support_actions) || localized.support_actions.length < 3) return false;
  }
  const recruiterFacingText = [
    output.en?.title, output.en?.executive_summary, ...(output.en?.paragraphs || []), ...(output.en?.observed_strengths || []),
    ...(output.en?.watch_areas || []), ...(output.en?.interview_focus || []), ...(output.en?.support_actions || []),
    output.es?.title, output.es?.executive_summary, ...(output.es?.paragraphs || []), ...(output.es?.observed_strengths || []),
    ...(output.es?.watch_areas || []), ...(output.es?.interview_focus || []), ...(output.es?.support_actions || []),
    output.job_alignment?.label_en, output.job_alignment?.label_es, output.job_alignment?.rationale_en, output.job_alignment?.rationale_es,
    ...(output.job_alignment?.counterevidence_en || []), ...(output.job_alignment?.counterevidence_es || []),
    ...(output.job_alignment?.conditions_en || []), ...(output.job_alignment?.conditions_es || []),
    ...(output.scenario_findings || []).flatMap((entry) => [entry.finding_en, entry.finding_es]),
  ].filter(Boolean);
  if (recruiterFacingText.some((value) => internalEvidenceCodePattern.test(value) || unclearRecruiterPhrasePattern.test(value))) return false;
  const itemIds = new Set(evidence.scoringTrace.map((entry) => entry.itemId));
  const scenarioIds = new Set(evidence.scenarios.map((entry) => entry.scenarioId));
  const alignment = output?.job_alignment;
  if (!Number.isInteger(alignment?.rating) || alignment.rating < 1 || alignment.rating > 5
    || !['low', 'moderate', 'high'].includes(alignment?.confidence)
    || !Array.isArray(alignment?.questionnaire_item_ids) || alignment.questionnaire_item_ids.length < 3
    || !alignment.questionnaire_item_ids.every((id) => itemIds.has(id))
    || !Array.isArray(alignment?.scenario_ids) || alignment.scenario_ids.length !== 3
    || alignment.scenario_ids.some((id) => !scenarioIds.has(id))
    || new Set(alignment.scenario_ids).size !== 3) return false;
  if (!Array.isArray(output?.scenario_findings) || output.scenario_findings.length !== 3
    || new Set(output.scenario_findings.map((entry) => entry.scenario_id)).size !== 3
    || output.scenario_findings.some((entry) => !scenarioIds.has(entry.scenario_id))) return false;
  return Array.isArray(output.evidence_claims) && output.evidence_claims.length >= 5 && output.evidence_claims.every((claim) => {
    const claimItems = claim.item_ids || [];
    const claimScenarios = claim.scenario_ids || [];
    return claim.claim && claimItems.concat(claimScenarios).length > 0
      && claimItems.every((id) => itemIds.has(id))
      && claimScenarios.every((id) => scenarioIds.has(id));
  });
}

function localizedAnalysisOutput(output, locale) {
  return {
    ...output[locale],
    job_alignment: output.job_alignment,
    scenario_findings: output.scenario_findings,
  };
}

function normalizeRecruiterAnalysisOutput(output) {
  const normalized = JSON.parse(JSON.stringify(output || {}));
  for (const locale of ['en', 'es']) {
    const localized = normalized[locale] || {};
    for (const field of ['title', 'executive_summary']) {
      localized[field] = GazelleAiAssessment.recruiterText(localized[field], locale);
    }
    for (const field of ['paragraphs', 'observed_strengths', 'watch_areas', 'interview_focus', 'support_actions']) {
      localized[field] = (localized[field] || []).map((value) => GazelleAiAssessment.recruiterText(value, locale));
    }
    normalized[locale] = localized;
  }
  const alignment = normalized.job_alignment || {};
  for (const field of ['label_en', 'rationale_en']) alignment[field] = GazelleAiAssessment.recruiterText(alignment[field], 'en');
  for (const field of ['label_es', 'rationale_es']) alignment[field] = GazelleAiAssessment.recruiterText(alignment[field], 'es');
  for (const field of ['counterevidence_en', 'conditions_en']) {
    alignment[field] = (alignment[field] || []).map((value) => GazelleAiAssessment.recruiterText(value, 'en'));
  }
  for (const field of ['counterevidence_es', 'conditions_es']) {
    alignment[field] = (alignment[field] || []).map((value) => GazelleAiAssessment.recruiterText(value, 'es'));
  }
  normalized.job_alignment = alignment;
  normalized.scenario_findings = (normalized.scenario_findings || []).map((finding) => ({
    ...finding,
    finding_en: GazelleAiAssessment.recruiterText(finding.finding_en, 'en'),
    finding_es: GazelleAiAssessment.recruiterText(finding.finding_es, 'es'),
  }));
  return normalized;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

async function ensureSchema(env) {
  if (!env.DB) throw new Error('database_unavailable');
  if (schemaReady) return;
  await env.DB.batch(schemaStatements.map((statement) => env.DB.prepare(statement)));
  for (const [table, column, statement] of runtimeColumnMigrations) {
    const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
    if (!(info.results || []).some((entry) => entry.name === column)) await env.DB.prepare(statement).run();
  }
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO companies (id, name, candidate_brand_name, referral_bonus_cents, candidate_portal_enabled, status, created_at, updated_at) VALUES ('org_legacy', 'Gazelle Platform', 'Allied Global', 10000, 1, 'active', ?, ?)`).bind(now, now),
    env.DB.prepare(`UPDATE companies SET candidate_brand_name = COALESCE(candidate_brand_name, CASE WHEN id = 'org_legacy' THEN 'Allied Global' ELSE name END), referral_bonus_cents = COALESCE(referral_bonus_cents, 10000), candidate_portal_enabled = COALESCE(candidate_portal_enabled, 1)`),
    env.DB.prepare(`INSERT OR IGNORE INTO assessment_tests (id, code, slug, name_en, name_es, description_en, description_es, engine_key, version, status, estimated_minutes, item_count, created_at, updated_at) VALUES ('test_tenure_potential', 'TP-001', 'tenure-potential', 'Tenure Potential', 'Potencial de Permanencia', 'Transparent assessment of role alignment, stay intention, and work reliability.', 'Evaluacion transparente de alineacion con el rol, intencion de permanencia y confiabilidad laboral.', 'tenure_potential', '2.0.1-pilot', 'active', 15, 27, ?, ?)`).bind(now, now),
    env.DB.prepare(`UPDATE assessment_tests SET version = '2.0.1-pilot', updated_at = ? WHERE id = 'test_tenure_potential' AND version <> '2.0.1-pilot'`).bind(now),
    env.DB.prepare(`UPDATE candidates SET company_id = 'org_legacy' WHERE company_id IS NULL`),
    env.DB.prepare(`UPDATE invitations SET company_id = 'org_legacy' WHERE company_id IS NULL`),
    env.DB.prepare(`UPDATE invitations SET test_id = 'test_tenure_potential' WHERE test_id IS NULL`),
    env.DB.prepare(`UPDATE assessments SET test_id = 'test_tenure_potential' WHERE test_id IS NULL`),
  ]);
  await env.DB.batch(postMigrationStatements.map((statement) => env.DB.prepare(statement)));
  const companies = await env.DB.prepare(`SELECT id FROM companies WHERE status = 'active'`).all();
  for (const company of companies.results || []) await ensureDefaultStages(env, company.id);
  schemaReady = true;
}

const DEFAULT_RECRUITMENT_STAGES = [
  ['applied', 'Application received', 'Solicitud recibida', 10, 0],
  ['assessment', 'Assessment', 'Evaluación', 20, 0],
  ['review', 'Team review', 'Revisión del equipo', 30, 0],
  ['interview', 'Interview', 'Entrevista', 40, 0],
  ['offer', 'Offer', 'Oferta', 50, 0],
  ['hired', 'Welcome aboard', 'Bienvenido al equipo', 60, 1],
];

async function ensureDefaultStages(env, companyId) {
  const now = new Date().toISOString();
  await env.DB.batch(DEFAULT_RECRUITMENT_STAGES.map(([key, nameEn, nameEs, order, terminal]) => env.DB.prepare(`
    INSERT OR IGNORE INTO recruitment_stages (id, company_id, stage_key, name_en, name_es, stage_order, is_terminal, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `).bind(crypto.randomUUID(), companyId, key, nameEn, nameEs, order, terminal, now, now)));
}

async function ensureCandidatePipeline(env, candidateId, companyId) {
  await ensureDefaultStages(env, companyId);
  const current = await env.DB.prepare(`SELECT candidate_id FROM candidate_pipeline WHERE candidate_id = ?`).bind(candidateId).first();
  if (current) return;
  const stage = await env.DB.prepare(`SELECT id FROM recruitment_stages WHERE company_id = ? AND stage_key = 'applied'`).bind(companyId).first();
  if (!stage) return;
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO candidate_pipeline (candidate_id, stage_id, status_message_en, status_message_es, updated_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(candidateId, stage.id, 'We received your application and will keep this page updated.', 'Recibimos tu solicitud y mantendremos esta página actualizada.', now),
    env.DB.prepare(`INSERT INTO candidate_stage_history (id, candidate_id, stage_id, status_message_en, status_message_es, changed_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), candidateId, stage.id, 'Application received.', 'Solicitud recibida.', now),
  ]);
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const SESSION_COOKIE = '__Host-gz_session';
const CANDIDATE_SESSION_COOKIE = '__Host-gz_candidate_session';
const PASSWORD_ITERATIONS = 100000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CANDIDATE_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const OWNER_EMAIL = 'david.alejandro.pa@gmail.com';
const SUPER_ADMIN_EMAILS = new Set([
  OWNER_EMAIL,
  'karla.ms@alliedglobal.com',
  'jose.le@alliedglobal.com',
  'daniela.ld@alliedglobal.com',
  'eduardo.ac@alliedglobal.com',
  'marcos.gs@alliedglobal.com',
]);
const commonPasswords = new Set([
  'password', 'password123', '12345678', '123456789', 'qwerty123', 'letmein123',
  'admin123', 'welcome123', 'contraseña', 'contrasena', 'gazelle123',
]);

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesFromBase64Url(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(value).length + 3) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  const a = typeof left === 'string' ? new TextEncoder().encode(left) : left;
  const b = typeof right === 'string' ? new TextEncoder().encode(right) : right;
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

function authPepper(env) {
  const value = String(env.AUTH_PEPPER || '');
  if (value.length < 32) throw new Error('auth_not_configured');
  return value;
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 12) return 'Use at least 12 characters.';
  if (value.length > 128) return 'Use no more than 128 characters.';
  if (commonPasswords.has(value.toLowerCase())) return 'Choose a less common password.';
  return '';
}

async function derivePassword(password, salt, iterations, pepper) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${password}\u0000${pepper}`),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256));
}

async function passwordRecord(password, env) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS, authPepper(env));
  return { hash: base64Url(hash), salt: base64Url(salt), iterations: PASSWORD_ITERATIONS };
}

async function verifyPassword(password, user, env) {
  const actual = await derivePassword(password, bytesFromBase64Url(user.password_salt), Number(user.password_iterations), authPepper(env));
  return constantTimeEqual(actual, bytesFromBase64Url(user.password_hash));
}

function cookieValue(request, name) {
  const cookies = String(request.headers.get('cookie') || '').split(';');
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(parts.join('='));
  }
  return '';
}

function sessionCookie(token, expiresAt) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${new Date(expiresAt).toUTCString()}; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function candidateSessionCookie(token, expiresAt) {
  return `${CANDIDATE_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${new Date(expiresAt).toUTCString()}; HttpOnly; Secure; SameSite=Lax`;
}

function clearCandidateSessionCookie() {
  return `${CANDIDATE_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function requestIp(request) {
  return cleanText(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown', 100);
}

async function rateLimit(env, request, action, identity, limit, windowSeconds) {
  const rateKey = await sha256(`${requestIp(request)}|${cleanText(identity, 254)}`);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT window_started_at, attempts FROM auth_rate_limits WHERE rate_key = ? AND action = ?`).bind(rateKey, action).first();
  if (!row || now - Number(row.window_started_at) >= windowSeconds) {
    await env.DB.prepare(`INSERT INTO auth_rate_limits (rate_key, action, window_started_at, attempts) VALUES (?, ?, ?, 1) ON CONFLICT(rate_key, action) DO UPDATE SET window_started_at = excluded.window_started_at, attempts = 1`)
      .bind(rateKey, action, now).run();
    return true;
  }
  if (Number(row.attempts) >= limit) return false;
  await env.DB.prepare(`UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE rate_key = ? AND action = ?`).bind(rateKey, action).run();
  return true;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

async function sessionTokenHash(token, env) {
  return sha256(`${token}:${authPepper(env)}`);
}

async function createSession(request, env, userId) {
  const token = randomToken();
  const tokenHash = await sessionTokenHash(token, env);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const ipHash = await sha256(`${requestIp(request)}:${authPepper(env)}`);
  const agentHash = await sha256(`${cleanText(request.headers.get('user-agent'), 500)}:${authPepper(env)}`);
  await env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ip_hash, user_agent_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(tokenHash, userId, now.toISOString(), expiresAt.toISOString(), now.toISOString(), ipHash, agentHash).run();
  return { token, expiresAt };
}

async function createCandidateSession(request, env, accountId) {
  const token = randomToken();
  const tokenHash = await sessionTokenHash(token, env);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CANDIDATE_SESSION_TTL_MS);
  const ipHash = await sha256(`${requestIp(request)}:${authPepper(env)}`);
  const agentHash = await sha256(`${cleanText(request.headers.get('user-agent'), 500)}:${authPepper(env)}`);
  await env.DB.prepare(`INSERT INTO candidate_sessions (token_hash, account_id, created_at, expires_at, last_seen_at, ip_hash, user_agent_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(tokenHash, accountId, now.toISOString(), expiresAt.toISOString(), now.toISOString(), ipHash, agentHash).run();
  return { token, expiresAt };
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    companyId: row.company_id,
    companyName: row.company_name || null,
    requestedCompanyName: row.requested_company_name || null,
  };
}

async function authenticatedUser(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sessionTokenHash(token, env);
  const row = await env.DB.prepare(`
    SELECT u.*, c.name AS company_name, s.token_hash AS session_token_hash, s.expires_at AS session_expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    LEFT JOIN companies c ON c.id = u.company_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL
  `).bind(tokenHash).first();
  if (!row || row.status !== 'active' || new Date(row.session_expires_at).getTime() <= Date.now()) return null;
  await env.DB.prepare(`UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?`).bind(new Date().toISOString(), tokenHash).run();
  const user = publicUser(row);
  Object.defineProperty(user, 'sessionTokenHash', { value: tokenHash, enumerable: false });
  return user;
}

function publicCandidateAccount(row) {
  return { id: row.id, email: row.email, name: row.name, locale: row.locale === 'es' ? 'es' : 'en', googleConnected: Boolean(row.google_sub) };
}

async function authenticatedCandidate(request, env) {
  const token = cookieValue(request, CANDIDATE_SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sessionTokenHash(token, env);
  const row = await env.DB.prepare(`
    SELECT a.*, s.token_hash AS session_token_hash, s.expires_at AS session_expires_at
    FROM candidate_sessions s JOIN candidate_accounts a ON a.id = s.account_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL
  `).bind(tokenHash).first();
  if (!row || row.status !== 'active' || new Date(row.session_expires_at).getTime() <= Date.now()) return null;
  await env.DB.prepare(`UPDATE candidate_sessions SET last_seen_at = ? WHERE token_hash = ?`).bind(new Date().toISOString(), tokenHash).run();
  const account = publicCandidateAccount(row);
  Object.defineProperty(account, 'sessionTokenHash', { value: tokenHash, enumerable: false });
  return account;
}

async function linkCandidateAccountByEmail(env, accountId, email) {
  const candidates = await env.DB.prepare(`SELECT id FROM candidates WHERE email = ? COLLATE NOCASE`).bind(email).all();
  if (!(candidates.results || []).length) return 0;
  const now = new Date().toISOString();
  await env.DB.batch(candidates.results.map((candidate) => env.DB.prepare(`INSERT OR IGNORE INTO candidate_account_links (account_id, candidate_id, linked_at) VALUES (?, ?, ?)`)
    .bind(accountId, candidate.id, now)));
  return candidates.results.length;
}

async function candidateAccessFromToken(env, rawToken) {
  const token = cleanText(rawToken, 200);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const invitation = await env.DB.prepare(`
    SELECT c.*, i.id AS invitation_id, i.status AS invitation_status, i.locale AS invitation_locale, i.expires_at AS access_expires_at,
      co.name AS company_name, COALESCE(co.candidate_brand_name, co.name) AS candidate_brand_name,
      co.referral_bonus_cents, co.candidate_portal_enabled
    FROM invitations i JOIN candidates c ON c.id = i.candidate_id
    JOIN companies co ON co.id = c.company_id WHERE i.token_hash = ?
  `).bind(tokenHash).first();
  if (invitation && Number(invitation.candidate_portal_enabled) === 1 && new Date(invitation.access_expires_at).getTime() > Date.now()) {
    return { candidate: invitation, invitationId: invitation.invitation_id, tokenHash, source: 'invitation' };
  }
  const portal = await env.DB.prepare(`
    SELECT c.*, p.id AS portal_link_id, p.expires_at AS access_expires_at,
      co.name AS company_name, COALESCE(co.candidate_brand_name, co.name) AS candidate_brand_name,
      co.referral_bonus_cents, co.candidate_portal_enabled
    FROM candidate_portal_links p JOIN candidates c ON c.id = p.candidate_id
    JOIN companies co ON co.id = c.company_id WHERE p.token_hash = ?
  `).bind(tokenHash).first();
  if (!portal || Number(portal.candidate_portal_enabled) !== 1 || new Date(portal.access_expires_at).getTime() <= Date.now()) return null;
  await env.DB.prepare(`UPDATE candidate_portal_links SET last_used_at = ? WHERE id = ?`).bind(new Date().toISOString(), portal.portal_link_id).run();
  return { candidate: portal, invitationId: null, tokenHash, source: 'portal_link' };
}

function isSuperAdmin(user) {
  return user?.status === 'active' && user.role === 'super_admin' && SUPER_ADMIN_EMAILS.has(cleanEmail(user.email));
}

function candidateScope(user, alias = 'c') {
  if (isSuperAdmin(user)) return { sql: '1 = 1', bindings: [] };
  if (user.role === 'admin') return { sql: `${alias}.company_id = ?`, bindings: [user.companyId] };
  return { sql: `${alias}.owner_user_id = ?`, bindings: [user.id] };
}

function listScope(user, alias = 'l') {
  if (isSuperAdmin(user)) return { sql: '1 = 1', bindings: [] };
  if (user.role === 'admin') return { sql: `${alias}.company_id = ?`, bindings: [user.companyId] };
  return { sql: `${alias}.owner_user_id = ?`, bindings: [user.id] };
}

async function signUp(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  const name = cleanText(body.name, 140);
  const requestedCompanyName = cleanText(body.companyName, 140);
  const password = String(body.password || '');
  if (!await rateLimit(env, request, 'signup', email || 'invalid', 8, 60 * 60)) return json({ error: 'Too many registration attempts. Try again later.', code: 'rate_limited' }, 429);
  if (!email || !name) return json({ error: 'A valid name and email are required.' }, 422);
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError, code: 'weak_password' }, 422);
  const existing = await env.DB.prepare(`SELECT id, status FROM users WHERE email = ? COLLATE NOCASE`).bind(email).first();
  if (existing) return json({ error: 'An account already exists for this email.', code: 'account_exists' }, 409);

  const isOwnerBootstrap = email === OWNER_EMAIL;
  const currentSuperAdmin = await env.DB.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE AND role = 'super_admin' AND status = 'active'`).bind(OWNER_EMAIL).first();
  if (isOwnerBootstrap && currentSuperAdmin) return json({ error: 'The super administrator account is already active.', code: 'owner_already_active' }, 409);
  if (isOwnerBootstrap) {
    const configuredOwner = cleanEmail(env.SUPER_ADMIN_EMAIL);
    const configuredToken = String(env.SUPER_ADMIN_BOOTSTRAP_TOKEN || '');
    if (configuredOwner !== OWNER_EMAIL || configuredToken.length < 24 || !constantTimeEqual(String(body.bootstrapToken || ''), configuredToken)) {
      return json({ error: 'The owner activation key is invalid.', code: 'invalid_owner_activation' }, 403);
    }
  } else if (!requestedCompanyName) {
    return json({ error: 'Company name is required.' }, 422);
  }

  let passwordData;
  try {
    passwordData = await passwordRecord(password, env);
  } catch {
    return json({ error: 'Secure password processing is unavailable.', code: 'password_processing_failed' }, 503);
  }
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const companyId = isOwnerBootstrap ? 'org_legacy' : null;
  const role = isOwnerBootstrap ? 'super_admin' : 'recruiter';
  const status = isOwnerBootstrap ? 'active' : 'pending';
  const insertUser = env.DB.prepare(`
    INSERT INTO users (id, company_id, email, name, password_hash, password_salt, password_iterations, role, status, requested_company_name, approved_by, approved_at, password_changed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, companyId, email, name, passwordData.hash, passwordData.salt, passwordData.iterations, role, status,
    requestedCompanyName || null, isOwnerBootstrap ? userId : null, isOwnerBootstrap ? now : null, now, now, now,
  );

  if (isOwnerBootstrap) {
    try {
      await env.DB.batch([
        insertUser,
        env.DB.prepare(`UPDATE candidates SET owner_user_id = ? WHERE company_id = ? AND owner_user_id IS NULL`).bind(userId, companyId),
        env.DB.prepare(`UPDATE invitations SET created_by_user_id = ? WHERE company_id = ? AND created_by_user_id IS NULL`).bind(userId, companyId),
      ]);
    } catch {
      return json({ error: 'The owner account could not be stored.', code: 'owner_account_insert_failed' }, 500);
    }
    let session;
    try {
      session = await createSession(request, env, userId);
    } catch {
      return json({ error: 'The owner account was created, but its session could not be started. Sign in again.', code: 'owner_session_failed' }, 500);
    }
    await audit(env, email, 'super_admin_bootstrapped', 'user', userId, { companyId });
    return json({ user: { id: userId, email, name, role, status, companyId, companyName: 'Gazelle Platform' } }, 201, { 'set-cookie': sessionCookie(session.token, session.expiresAt) });
  }

  await insertUser.run();
  await audit(env, email, 'user_registration_requested', 'user', userId, { requestedCompanyName });
  return json({ status: 'pending', message: 'Your account is awaiting approval by a platform super administrator.' }, 202);
}

async function logIn(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  const password = String(body.password || '');
  if (!await rateLimit(env, request, 'login', email || 'invalid', 6, 15 * 60)) return json({ error: 'Too many sign-in attempts. Try again later.', code: 'rate_limited' }, 429);
  const user = email ? await env.DB.prepare(`SELECT * FROM users WHERE email = ? COLLATE NOCASE`).bind(email).first() : null;
  let valid = false;
  if (user && password) valid = await verifyPassword(password, user, env);
  else await derivePassword(password || 'invalid', new Uint8Array(16), PASSWORD_ITERATIONS, authPepper(env));
  if (!valid) return json({ error: 'Email or password is incorrect.', code: 'invalid_credentials' }, 401);
  if (user.status !== 'active') {
    const message = user.status === 'pending' ? 'Your account is awaiting approval by a platform super administrator.' : 'This account is not active.';
    return json({ error: message, code: `account_${user.status}` }, 403);
  }
  if (user.role === 'super_admin' && !SUPER_ADMIN_EMAILS.has(cleanEmail(user.email))) return json({ error: 'This account has an invalid role assignment.' }, 403);
  const session = await createSession(request, env, user.id);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, user.id),
    env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL`).bind(now),
  ]);
  await audit(env, user.email, 'user_signed_in', 'user', user.id, {});
  const company = user.company_id ? await env.DB.prepare(`SELECT name FROM companies WHERE id = ?`).bind(user.company_id).first() : null;
  return json({ user: publicUser({ ...user, company_name: company?.name || null }) }, 200, { 'set-cookie': sessionCookie(session.token, session.expiresAt) });
}

async function logOut(request, env) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sessionTokenHash(token, env);
    await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE token_hash = ?`).bind(new Date().toISOString(), tokenHash).run();
  }
  return json({ signedOut: true }, 200, { 'set-cookie': clearSessionCookie() });
}

async function candidateFromAccessHash(env, tokenHash) {
  if (!tokenHash) return null;
  const invitation = await env.DB.prepare(`
    SELECT c.*, i.id AS invitation_id, i.expires_at AS access_expires_at
    FROM invitations i JOIN candidates c ON c.id = i.candidate_id WHERE i.token_hash = ?
  `).bind(tokenHash).first();
  if (invitation && new Date(invitation.access_expires_at).getTime() > Date.now()) return invitation;
  const portal = await env.DB.prepare(`
    SELECT c.*, p.expires_at AS access_expires_at
    FROM candidate_portal_links p JOIN candidates c ON c.id = p.candidate_id WHERE p.token_hash = ?
  `).bind(tokenHash).first();
  return portal && new Date(portal.access_expires_at).getTime() > Date.now() ? portal : null;
}

async function candidateSignUp(request, env) {
  const body = await request.json().catch(() => ({}));
  const access = await candidateAccessFromToken(env, body.token);
  const password = String(body.password || '');
  if (!access) return json({ error: 'A valid candidate invitation is required to create an account.', code: 'candidate_invitation_required' }, 403);
  if (!await rateLimit(env, request, 'candidate_signup', access.candidate.email, 8, 60 * 60)) return json({ error: 'Too many account attempts. Try again later.', code: 'rate_limited' }, 429);
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError, code: 'weak_password' }, 422);
  let account = await env.DB.prepare(`SELECT * FROM candidate_accounts WHERE email = ? COLLATE NOCASE`).bind(access.candidate.email).first();
  if (account?.password_hash) return json({ error: 'An account already exists for this email. Sign in instead.', code: 'account_exists' }, 409);
  const passwordData = await passwordRecord(password, env);
  const now = new Date().toISOString();
  if (account) {
    await env.DB.prepare(`UPDATE candidate_accounts SET name = ?, password_hash = ?, password_salt = ?, password_iterations = ?, locale = ?, password_changed_at = ?, updated_at = ? WHERE id = ?`)
      .bind(access.candidate.name, passwordData.hash, passwordData.salt, passwordData.iterations, body.locale === 'es' ? 'es' : 'en', now, now, account.id).run();
  } else {
    const accountId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO candidate_accounts (id, email, name, password_hash, password_salt, password_iterations, locale, status, password_changed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).bind(accountId, access.candidate.email, access.candidate.name, passwordData.hash, passwordData.salt, passwordData.iterations, body.locale === 'es' ? 'es' : 'en', now, now, now).run();
    account = await env.DB.prepare(`SELECT * FROM candidate_accounts WHERE id = ?`).bind(accountId).first();
  }
  await linkCandidateAccountByEmail(env, account.id, account.email);
  const session = await createCandidateSession(request, env, account.id);
  await audit(env, account.email, 'candidate_account_created', 'candidate_account', account.id, { candidateId: access.candidate.id, method: 'password' });
  return json({ account: publicCandidateAccount(account) }, 201, { 'set-cookie': candidateSessionCookie(session.token, session.expiresAt) });
}

async function candidateLogIn(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  const password = String(body.password || '');
  if (!await rateLimit(env, request, 'candidate_login', email || 'invalid', 8, 15 * 60)) return json({ error: 'Too many sign-in attempts. Try again later.', code: 'rate_limited' }, 429);
  const account = email ? await env.DB.prepare(`SELECT * FROM candidate_accounts WHERE email = ? COLLATE NOCASE`).bind(email).first() : null;
  const valid = Boolean(account?.password_hash && password && await verifyPassword(password, account, env));
  if (!valid) {
    if (!account?.password_hash) await derivePassword(password || 'invalid', new Uint8Array(16), PASSWORD_ITERATIONS, authPepper(env));
    return json({ error: 'Email or password is incorrect.', code: 'invalid_credentials' }, 401);
  }
  if (account.status !== 'active') return json({ error: 'This candidate account is not active.', code: 'account_inactive' }, 403);
  await linkCandidateAccountByEmail(env, account.id, account.email);
  const session = await createCandidateSession(request, env, account.id);
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE candidate_accounts SET last_login_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, account.id).run();
  return json({ account: publicCandidateAccount(account) }, 200, { 'set-cookie': candidateSessionCookie(session.token, session.expiresAt) });
}

async function candidateLogOut(request, env) {
  const token = cookieValue(request, CANDIDATE_SESSION_COOKIE);
  if (token) {
    const tokenHash = await sessionTokenHash(token, env);
    await env.DB.prepare(`UPDATE candidate_sessions SET revoked_at = ? WHERE token_hash = ?`).bind(new Date().toISOString(), tokenHash).run();
  }
  return json({ signedOut: true }, 200, { 'set-cookie': clearCandidateSessionCookie() });
}

async function updateCandidateLocale(request, env, account) {
  const body = await request.json().catch(() => ({}));
  const locale = body.locale === 'es' ? 'es' : 'en';
  await env.DB.prepare(`UPDATE candidate_accounts SET locale = ?, updated_at = ? WHERE id = ?`).bind(locale, new Date().toISOString(), account.id).run();
  return json({ locale });
}

function googleOAuthConfig(env) {
  const clientId = cleanText(env.GOOGLE_OAUTH_CLIENT_ID, 300);
  const clientSecret = String(env.GOOGLE_OAUTH_CLIENT_SECRET || '');
  const baseUrl = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '');
  return { clientId, clientSecret, redirectUri: baseUrl ? `${baseUrl}/api/candidate/auth/google/callback` : '', configured: Boolean(clientId && clientSecret && baseUrl) };
}

let googleJwksCache = { keys: [], expiresAt: 0 };

async function googleSigningKeys() {
  if (googleJwksCache.keys.length && googleJwksCache.expiresAt > Date.now()) return googleJwksCache.keys;
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(body.keys)) throw new Error('google_signing_keys_unavailable');
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 1800);
  googleJwksCache = { keys: body.keys, expiresAt: Date.now() + Math.max(300, maxAge) * 1000 };
  return googleJwksCache.keys;
}

async function verifyGoogleIdToken(idToken, clientId, expectedNonce) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) return null;
  let header;
  let payload;
  try {
    header = JSON.parse(new TextDecoder().decode(bytesFromBase64Url(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(bytesFromBase64Url(parts[1])));
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;
  const jwk = (await googleSigningKeys()).find((key) => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    bytesFromBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const audienceValid = payload.aud === clientId || (Array.isArray(payload.aud) && payload.aud.includes(clientId));
  if (!validSignature || !audienceValid || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
    || Number(payload.exp || 0) <= Math.floor(Date.now() / 1000) || payload.nonce !== expectedNonce) return null;
  return payload;
}

async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

async function startCandidateGoogleOAuth(request, env) {
  const config = googleOAuthConfig(env);
  if (!config.configured) return json({ error: 'Google sign-in is not configured.', code: 'google_oauth_not_configured' }, 503);
  const url = new URL(request.url);
  const rawAccessToken = cleanText(url.searchParams.get('invite'), 200);
  let accessTokenHash = null;
  if (rawAccessToken) {
    const access = await candidateAccessFromToken(env, rawAccessToken);
    if (!access) return json({ error: 'The candidate access link is invalid or expired.', code: 'candidate_link_invalid' }, 403);
    accessTokenHash = access.tokenHash;
  }
  const state = randomToken();
  const verifier = randomToken();
  const now = new Date();
  await env.DB.prepare(`INSERT INTO candidate_oauth_states (state_hash, access_token_hash, code_verifier, locale, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(await sha256(state), accessTokenHash, verifier, url.searchParams.get('locale') === 'es' ? 'es' : 'en', new Date(now.getTime() + 10 * 60 * 1000).toISOString(), now.toISOString()).run();
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256',
    nonce: state,
    prompt: 'select_account',
  }).toString();
  return Response.redirect(authUrl.toString(), 302);
}

async function finishCandidateGoogleOAuth(request, env) {
  const config = googleOAuthConfig(env);
  const url = new URL(request.url);
  const state = cleanText(url.searchParams.get('state'), 200);
  const code = cleanText(url.searchParams.get('code'), 1000);
  const fail = (reason) => Response.redirect(`${cleanText(env.APP_BASE_URL, 500) || url.origin}/candidate?oauth_error=${encodeURIComponent(reason)}`, 302);
  if (!config.configured || !state || !code) return fail('google_signin_failed');
  const stateHash = await sha256(state);
  const stored = await env.DB.prepare(`SELECT * FROM candidate_oauth_states WHERE state_hash = ?`).bind(stateHash).first();
  if (!stored || new Date(stored.expires_at).getTime() <= Date.now()) return fail('google_signin_expired');
  await env.DB.prepare(`DELETE FROM candidate_oauth_states WHERE state_hash = ?`).bind(stateHash).run();
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: 'authorization_code', code_verifier: stored.code_verifier }),
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenBody.id_token) return fail('google_token_exchange_failed');
  const identity = await verifyGoogleIdToken(tokenBody.id_token, config.clientId, state).catch(() => null);
  const email = cleanEmail(identity?.email);
  if (!identity || identity.email_verified !== true || !email || !identity.sub) return fail('google_identity_invalid');
  const invitedCandidate = await candidateFromAccessHash(env, stored.access_token_hash);
  let account = await env.DB.prepare(`SELECT * FROM candidate_accounts WHERE email = ? COLLATE NOCASE`).bind(email).first();
  if (!account && (!invitedCandidate || invitedCandidate.email.toLowerCase() !== email)) return fail('candidate_invitation_required');
  if (account?.google_sub && account.google_sub !== identity.sub) return fail('google_account_conflict');
  const now = new Date().toISOString();
  if (!account) {
    const accountId = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO candidate_accounts (id, email, name, google_sub, locale, status, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`)
      .bind(accountId, email, cleanText(identity.name, 140) || invitedCandidate.name, identity.sub, stored.locale === 'es' ? 'es' : 'en', now, now, now).run();
    account = await env.DB.prepare(`SELECT * FROM candidate_accounts WHERE id = ?`).bind(accountId).first();
  } else {
    await env.DB.prepare(`UPDATE candidate_accounts SET google_sub = ?, name = COALESCE(NULLIF(?, ''), name), last_login_at = ?, updated_at = ? WHERE id = ?`)
      .bind(identity.sub, cleanText(identity.name, 140), now, now, account.id).run();
  }
  await linkCandidateAccountByEmail(env, account.id, email);
  const session = await createCandidateSession(request, env, account.id);
  await audit(env, email, 'candidate_signed_in', 'candidate_account', account.id, { method: 'google' });
  return new Response(null, { status: 302, headers: { location: `${cleanText(env.APP_BASE_URL, 500) || url.origin}/candidate?oauth=success`, 'set-cookie': candidateSessionCookie(session.token, session.expiresAt) } });
}

async function candidatePortalData(request, env) {
  const url = new URL(request.url);
  const access = await candidateAccessFromToken(env, url.searchParams.get('invite'));
  const account = await authenticatedCandidate(request, env);
  if (!access && !account) return json({ error: 'A valid candidate link or account is required.', code: 'candidate_access_required' }, 401);

  if (access && account && access.candidate.email.toLowerCase() === account.email.toLowerCase()) {
    await linkCandidateAccountByEmail(env, account.id, account.email);
  }

  let candidateRows = [];
  if (account) {
    const linked = await env.DB.prepare(`
      SELECT c.* FROM candidate_account_links l JOIN candidates c ON c.id = l.candidate_id
      WHERE l.account_id = ? ORDER BY c.updated_at DESC
    `).bind(account.id).all();
    candidateRows = linked.results || [];
  }
  if (access && (!account || access.candidate.email.toLowerCase() === account.email.toLowerCase()) && !candidateRows.some((row) => row.id === access.candidate.id)) {
    candidateRows.unshift(access.candidate);
  }
  if (!candidateRows.length) return json({ error: 'No candidate applications are linked to this account.', code: 'candidate_application_not_found' }, 404);

  const applications = [];
  for (const candidate of candidateRows) {
    await ensureCandidatePipeline(env, candidate.id, candidate.company_id);
    const summary = await env.DB.prepare(`
      SELECT c.id, c.name, c.email, c.role, c.site, c.created_at,
        co.id AS company_id, co.name AS company_name, COALESCE(co.candidate_brand_name, co.name) AS candidate_brand_name,
        co.referral_bonus_cents, p.updated_at AS pipeline_updated_at, p.status_message_en, p.status_message_es,
        s.id AS current_stage_id, s.stage_key AS current_stage_key, s.name_en AS current_stage_name_en,
        s.name_es AS current_stage_name_es, s.stage_order AS current_stage_order
      FROM candidates c JOIN companies co ON co.id = c.company_id
      JOIN candidate_pipeline p ON p.candidate_id = c.id JOIN recruitment_stages s ON s.id = p.stage_id
      WHERE c.id = ?
    `).bind(candidate.id).first();
    if (!summary) continue;
    const [stagesResult, historyResult, messagesResult, invitationsResult] = await Promise.all([
      env.DB.prepare(`SELECT id, stage_key, name_en, name_es, stage_order, is_terminal FROM recruitment_stages WHERE company_id = ? AND status = 'active' ORDER BY stage_order`).bind(candidate.company_id).all(),
      env.DB.prepare(`
        SELECT h.changed_at, h.status_message_en, h.status_message_es, s.stage_key, s.name_en, s.name_es, s.stage_order
        FROM candidate_stage_history h JOIN recruitment_stages s ON s.id = h.stage_id
        WHERE h.candidate_id = ? ORDER BY h.changed_at DESC LIMIT 12
      `).bind(candidate.id).all(),
      env.DB.prepare(`
        SELECT channel, subject_en, subject_es, message_en, message_es, created_at
        FROM candidate_communications WHERE candidate_id = ? AND visible_to_candidate = 1
        ORDER BY created_at DESC LIMIT 20
      `).bind(candidate.id).all(),
      env.DB.prepare(`
        WITH ranked AS (
          SELECT i.*, ROW_NUMBER() OVER (PARTITION BY i.test_id ORDER BY i.created_at DESC) AS row_number
          FROM invitations i WHERE i.candidate_id = ?
        )
        SELECT i.id, i.test_id, i.locale, i.status, i.created_at, i.expires_at, i.completed_at,
          t.name_en, t.name_es, t.estimated_minutes,
          (SELECT COUNT(*) FROM invitations used WHERE used.candidate_id = ? AND used.test_id = i.test_id AND used.status NOT IN ('failed', 'provider_unconfirmed')) AS attempts_used,
          COALESCE(a.attempt_limit, 3) AS attempt_limit
        FROM ranked i JOIN assessment_tests t ON t.id = i.test_id
        LEFT JOIN candidate_test_access a ON a.candidate_id = i.candidate_id AND a.test_id = i.test_id
        WHERE i.row_number = 1 ORDER BY i.created_at DESC
      `).bind(candidate.id, candidate.id).all(),
    ]);
    applications.push({
      ...summary,
      referral_bonus_cents: Number(summary.referral_bonus_cents || 10000),
      stages: stagesResult.results || [],
      history: historyResult.results || [],
      communications: messagesResult.results || [],
      tests: (invitationsResult.results || []).map((test) => ({
        ...test,
        attempts_used: Number(test.attempts_used || 0),
        attempt_limit: Number(test.attempt_limit || 3),
        attempts_remaining: Math.max(0, Number(test.attempt_limit || 3) - Number(test.attempts_used || 0)),
        direct_access: Boolean(access?.source === 'invitation' && access.invitationId === test.id),
      })),
    });
  }

  const accountExists = access ? Boolean(await env.DB.prepare(`SELECT id FROM candidate_accounts WHERE email = ? COLLATE NOCASE`).bind(access.candidate.email).first()) : Boolean(account);
  const referrals = account ? await env.DB.prepare(`
    SELECT id, source_candidate_id, name, email, phone, status, bonus_cents, created_at, updated_at
    FROM candidate_referrals WHERE referrer_account_id = ? ORDER BY created_at DESC
  `).bind(account.id).all() : { results: [] };
  return json({
    account,
    accountExists,
    googleConfigured: googleOAuthConfig(env).configured,
    suggestedLocale: account?.locale || access?.candidate?.locale || access?.candidate?.invitation_locale || 'en',
    access: access ? { source: access.source, candidateId: access.candidate.id, invitationId: access.invitationId } : null,
    applications,
    referrals: referrals.results || [],
  });
}

async function startCandidateInvitation(request, env, account, invitationId) {
  const row = await env.DB.prepare(`
    SELECT i.*, c.email FROM invitations i JOIN candidates c ON c.id = i.candidate_id
    JOIN candidate_account_links l ON l.candidate_id = c.id
    WHERE i.id = ? AND l.account_id = ?
  `).bind(invitationId, account.id).first();
  if (!row || row.email.toLowerCase() !== account.email.toLowerCase()) return json({ error: 'Assessment invitation not found.', code: 'invitation_not_found' }, 404);
  if (row.status === 'completed') return json({ error: 'This assessment is already complete.', code: 'assessment_completed' }, 409);
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`UPDATE invitations SET token_hash = ?, expires_at = ? WHERE id = ?`).bind(await sha256(token), expiresAt, row.id).run();
  await audit(env, account.email, 'candidate_assessment_access_rotated', 'invitation', row.id, { candidateId: row.candidate_id, expiresAt });
  return json({ assessmentPath: `/assessment?invite=${encodeURIComponent(token)}`, expiresAt });
}

async function createCandidateReferral(request, env, account) {
  const body = await request.json().catch(() => ({}));
  const candidateId = cleanText(body.applicationId, 100);
  const source = await env.DB.prepare(`
    SELECT c.company_id, co.referral_bonus_cents FROM candidate_account_links l
    JOIN candidates c ON c.id = l.candidate_id JOIN companies co ON co.id = c.company_id
    WHERE l.account_id = ? AND c.id = ?
  `).bind(account.id, candidateId).first();
  const name = cleanText(body.name, 140);
  const email = cleanEmail(body.email);
  const phone = cleanText(body.phone, 40);
  if (!source || !name || !email) return json({ error: 'Choose an application and provide a valid name and email.', code: 'invalid_referral' }, 422);
  if (email === account.email) return json({ error: 'You cannot refer your own account email.', code: 'self_referral' }, 422);
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO candidate_referrals (id, company_id, referrer_account_id, source_candidate_id, name, email, phone, status, bonus_cents, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)
    `).bind(crypto.randomUUID(), source.company_id, account.id, candidateId, name, email, phone || null, Number(source.referral_bonus_cents || 10000), now, now).run();
  } catch {
    return json({ error: 'This person has already been referred from your account.', code: 'referral_exists' }, 409);
  }
  await audit(env, account.email, 'candidate_referral_submitted', 'candidate', candidateId, { referredEmailHash: await sha256(email) });
  return candidatePortalData(request, env);
}

async function changePassword(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const passwordError = validatePassword(newPassword);
  if (passwordError) return json({ error: passwordError, code: 'weak_password' }, 422);
  const stored = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(user.id).first();
  if (!stored || !await verifyPassword(currentPassword, stored, env)) return json({ error: 'Current password is incorrect.', code: 'invalid_credentials' }, 401);
  const passwordData = await passwordRecord(newPassword, env);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, password_changed_at = ?, updated_at = ? WHERE id = ?`)
      .bind(passwordData.hash, passwordData.salt, passwordData.iterations, now, now, user.id),
    env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND token_hash <> ?`).bind(now, user.id, user.sessionTokenHash),
  ]);
  await audit(env, user.email, 'password_changed', 'user', user.id, {});
  return json({ changed: true });
}

function emailConfig(env) {
  const apiKey = String(env.BREVO_API_KEY || '');
  const senderEmail = cleanEmail(env.BREVO_SENDER_EMAIL);
  const senderName = cleanText(env.BREVO_SENDER_NAME, 140) || 'Gazelle Assessment';
  const webhookToken = String(env.BREVO_WEBHOOK_TOKEN || '');
  const smtpKey = String(env.BREVO_SMTP_KEY || '');
  const smtpLogin = cleanText(env.BREVO_SMTP_LOGIN, 180);
  const smtpHost = cleanText(env.BREVO_SMTP_HOST, 180) || 'smtp-relay.brevo.com';
  const configuredPort = Number(env.BREVO_SMTP_PORT || 587);
  const smtpPort = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535 ? configuredPort : 587;
  const requestedTransport = cleanText(env.BREVO_EMAIL_TRANSPORT, 20).toLowerCase();
  const transport = requestedTransport === 'smtp' ? 'smtp' : 'api';
  const apiConfigured = Boolean(apiKey && senderEmail);
  const smtpConfigured = Boolean(smtpKey && smtpLogin && senderEmail);
  const sendingConfigured = transport === 'smtp' ? smtpConfigured : apiConfigured;
  return {
    configured: Boolean(sendingConfigured && webhookToken.length >= 24),
    sendingConfigured,
    webhookConfigured: webhookToken.length >= 24,
    apiConfigured,
    smtpConfigured,
    transport,
    senderEmail,
    senderName,
    apiKey,
    webhookToken,
    smtpKey,
    smtpLogin,
    smtpHost,
    smtpPort,
  };
}

function contactabilityConfig(env) {
  const email = emailConfig(env);
  const whatsappProvider = cleanText(env.WHATSAPP_PROVIDER, 30).toLowerCase() === 'infobip' ? 'infobip' : 'brevo';
  const requestedSmsProvider = cleanText(env.SMS_PROVIDER, 30).toLowerCase();
  const smsProvider = requestedSmsProvider === 'infobip' ? 'infobip' : requestedSmsProvider === 'custom_http' ? 'custom_http' : 'brevo';
  const infobip = infobipConfig(env);
  const customSms = customSmsConfig(env);
  const whatsappSenderNumber = cleanText(env.BREVO_WHATSAPP_SENDER_NUMBER, 40).replace(/[^\d+]/g, '');
  const whatsappTemplateId = cleanText(env.BREVO_WHATSAPP_TEMPLATE_ID, 80);
  const smsSender = cleanText(env.BREVO_SMS_SENDER, 40);
  const defaultCountryCode = cleanText(env.DEFAULT_PHONE_COUNTRY_CODE, 8).replace(/[^\d]/g, '') || '502';
  const whatsappConfigured = whatsappProvider === 'infobip'
    ? Boolean(infobip.configured && infobip.whatsappSender && infobip.whatsappTemplateName)
    : Boolean(email.apiKey && whatsappSenderNumber);
  const smsConfigured = smsProvider === 'infobip'
    ? Boolean(infobip.configured && infobip.smsSender)
    : smsProvider === 'custom_http'
      ? customSms.configured
    : Boolean(email.apiKey && smsSender);
  return {
    defaultCountryCode,
    email: {
      configured: email.configured,
      sendingConfigured: email.sendingConfigured,
      provider: 'Brevo',
      transport: email.transport,
    },
    whatsapp: {
      configured: whatsappConfigured,
      apiConfigured: whatsappProvider === 'infobip' ? infobip.configured : Boolean(email.apiKey),
      providerKey: whatsappProvider,
      senderNumber: whatsappProvider === 'infobip' ? infobip.whatsappSender || null : whatsappSenderNumber || null,
      templateId: whatsappProvider === 'infobip' ? infobip.whatsappTemplateId || null : whatsappTemplateId || null,
      templateName: whatsappProvider === 'infobip' ? infobip.whatsappTemplateName || null : null,
      templateLanguage: whatsappProvider === 'infobip' ? infobip.whatsappTemplateLanguage : null,
      linkPlacement: whatsappProvider === 'infobip' ? infobip.whatsappLinkPlacement : 'body',
      provider: whatsappProvider === 'infobip' ? 'Infobip WhatsApp' : 'Brevo WhatsApp',
      missing: whatsappProvider === 'infobip'
        ? [!infobip.apiKey ? 'INFOBIP_API_KEY' : '', !infobip.baseUrl ? 'INFOBIP_BASE_URL' : '', !infobip.whatsappSender ? 'INFOBIP_WHATSAPP_SENDER' : '', !infobip.whatsappTemplateName ? 'INFOBIP_WHATSAPP_TEMPLATE_NAME' : ''].filter(Boolean)
        : [!email.apiKey ? 'BREVO_API_KEY' : '', !whatsappSenderNumber ? 'BREVO_WHATSAPP_SENDER_NUMBER' : ''].filter(Boolean),
    },
    sms: {
      configured: smsConfigured,
      apiConfigured: smsProvider === 'infobip' ? infobip.configured : smsProvider === 'custom_http' ? Boolean(customSms.endpoint && customSms.apiKey) : Boolean(email.apiKey),
      providerKey: smsProvider,
      sender: smsProvider === 'infobip' ? infobip.smsSender || null : smsProvider === 'custom_http' ? customSms.sender || null : smsSender || null,
      provider: smsProvider === 'infobip' ? 'Infobip SMS' : smsProvider === 'custom_http' ? 'Custom SMS Provider' : 'Brevo Transactional SMS',
      missing: smsProvider === 'infobip'
        ? [!infobip.apiKey ? 'INFOBIP_API_KEY' : '', !infobip.baseUrl ? 'INFOBIP_BASE_URL' : '', !infobip.smsSender ? 'INFOBIP_SMS_SENDER' : ''].filter(Boolean)
        : smsProvider === 'custom_http'
          ? [!customSms.endpoint ? 'CUSTOM_SMS_ENDPOINT' : '', !customSms.apiKey ? 'CUSTOM_SMS_API_KEY' : '', !customSms.sender ? 'CUSTOM_SMS_SENDER' : ''].filter(Boolean)
        : [!email.apiKey ? 'BREVO_API_KEY' : '', !smsSender ? 'BREVO_SMS_SENDER' : ''].filter(Boolean),
    },
  };
}

function infobipConfig(env) {
  const apiKey = String(env.INFOBIP_API_KEY || '');
  let baseUrl = cleanText(env.INFOBIP_BASE_URL, 220).replace(/\/+$/, '');
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  const language = cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_LANGUAGE, 20).toLowerCase();
  return {
    configured: Boolean(apiKey && baseUrl),
    apiKey,
    baseUrl,
    smsSender: cleanText(env.INFOBIP_SMS_SENDER, 40),
    whatsappSender: cleanText(env.INFOBIP_WHATSAPP_SENDER, 40).replace(/[^\d+]/g, ''),
    whatsappTemplateName: cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_NAME, 120),
    whatsappTemplateId: cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_ID, 120),
    whatsappTemplateLanguage: language === 'spanish' ? 'es' : language || 'es',
    whatsappLinkPlacement: cleanText(env.INFOBIP_WHATSAPP_LINK_PLACEMENT, 20).toLowerCase() === 'body' ? 'body' : 'button',
    webhookToken: String(env.INFOBIP_WEBHOOK_TOKEN || ''),
  };
}

function customSmsConfig(env) {
  const endpoint = cleanText(env.CUSTOM_SMS_ENDPOINT, 500);
  return {
    configured: Boolean(endpoint && env.CUSTOM_SMS_API_KEY && cleanText(env.CUSTOM_SMS_SENDER, 40)),
    endpoint,
    apiKey: String(env.CUSTOM_SMS_API_KEY || ''),
    authHeader: cleanText(env.CUSTOM_SMS_AUTH_HEADER, 80) || 'Authorization',
    authScheme: cleanText(env.CUSTOM_SMS_AUTH_SCHEME, 40) || 'Bearer',
    sender: cleanText(env.CUSTOM_SMS_SENDER, 40),
  };
}

function normalizeContactPhone(value, defaultCountryCode = '502') {
  const original = String(value || '').slice(0, 80);
  let digits = original.normalize('NFKC').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  digits = digits.replace(/\D/g, '');
  const countryCode = String(defaultCountryCode || '502').replace(/\D/g, '') || '502';
  if (digits.length === 8 && countryCode) digits = `${countryCode}${digits}`;
  const valid = digits.length >= 8 && digits.length <= 15;
  return { phone: valid ? digits : '', valid, corrected: valid && digits !== original.replace(/\D/g, ''), original };
}

function aiConfig(env) {
  const openAiKey = String(env.OPENAI_API_KEY || '');
  const geminiKey = String(env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '');
  const requested = cleanText(env.AI_PROVIDER, 30).toLowerCase();
  const providerKey = ['openai', 'gemini'].includes(requested)
    ? requested
    : openAiKey ? 'openai' : geminiKey ? 'gemini' : 'openai';
  const openAiModel = cleanText(env.OPENAI_MODEL, 120) || GazelleAiAssessment.DEFAULT_MODEL;
  const geminiModel = cleanText(env.GEMINI_MODEL, 120) || GazelleAiAssessment.DEFAULT_GEMINI_MODEL;
  const apiKey = providerKey === 'gemini' ? geminiKey : openAiKey;
  const background = String(env.OPENAI_BACKGROUND || '').toLowerCase() === 'true';
  return {
    configured: Boolean(apiKey),
    providerKey,
    provider: providerKey === 'gemini' ? 'Google Gemini' : 'OpenAI',
    apiKey,
    model: providerKey === 'gemini' ? geminiModel : openAiModel,
    background,
  };
}

function responseOutputText(body) {
  if (typeof body?.output_text === 'string') return body.output_text;
  for (const item of body?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('provider_timeout'), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError' || controller.signal.aborted) throw new Error('provider_timeout');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function openAiSupportsReasoning(model) {
  return /^(?:gpt-5|o[134](?:-|$))/i.test(String(model || ''));
}

function openAiJsonResult(body, config) {
  if (['queued', 'in_progress'].includes(body?.status)) {
    return { pending: true, responseId: cleanText(body.id, 200), model: cleanText(body.model, 120) || config.model };
  }
  if (['failed', 'cancelled', 'incomplete'].includes(body?.status)) {
    const error = new Error(body?.status === 'incomplete' ? 'openai_incomplete' : 'openai_background_failed');
    error.providerMessage = cleanText(body?.error?.message || body?.incomplete_details?.reason || 'OpenAI could not complete the response.', 400);
    throw error;
  }
  const text = responseOutputText(body);
  if (!text) throw new Error('openai_empty_output');
  try {
    return { data: JSON.parse(text), responseId: cleanText(body.id, 200), model: cleanText(body.model, 120) || config.model };
  } catch {
    throw new Error('openai_invalid_json');
  }
}

async function retrieveOpenAiJson(config, responseId) {
  const response = await fetchWithTimeout(`https://api.openai.com/v1/responses/${encodeURIComponent(responseId)}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${config.apiKey}` },
  }, 10000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('openai_retrieve_failed');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'OpenAI rejected the status request.', 400);
    throw error;
  }
  return openAiJsonResult(body, config);
}

async function callOpenAiJson(config, { instructions, input, schema, schemaName, safetyIdentifier, maxOutputTokens, reasoningEffort = 'medium', background = false }) {
  const payload = {
    model: config.model,
    instructions,
    input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(input) }] }],
    text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
    max_output_tokens: maxOutputTokens,
    safety_identifier: safetyIdentifier,
  };
  if (background) payload.background = true;
  else payload.store = false;
  if (openAiSupportsReasoning(config.model)) payload.reasoning = { effort: reasoningEffort };
  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }, background ? 10000 : 25000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('openai_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'OpenAI rejected the request.', 400);
    throw error;
  }
  return openAiJsonResult(body, config);
}

async function callGeminiJson(config, { instructions, input, schema, maxOutputTokens }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'x-goog-api-key': config.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        maxOutputTokens,
        temperature: 0.2,
      },
    }),
  }, 25000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('gemini_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'Gemini rejected the request.', 400);
    throw error;
  }
  const text = (body?.candidates?.[0]?.content?.parts || []).map((part) => part?.text || '').join('');
  if (!text) throw new Error('gemini_empty_output');
  try {
    return {
      data: JSON.parse(text),
      responseId: cleanText(body.responseId, 200) || null,
      model: cleanText(body.modelVersion, 120) || config.model,
      provider: config.provider,
    };
  } catch {
    throw new Error('gemini_invalid_json');
  }
}

async function callAiJson(env, request) {
  const config = aiConfig(env);
  if (!config.configured) throw new Error('ai_not_configured');
  const result = config.providerKey === 'gemini'
    ? await callGeminiJson(config, request)
    : await callOpenAiJson(config, request);
  return { ...result, provider: config.provider };
}

async function sendBrevoApi(config, message) {
  const invitationId = cleanText(message.invitationId, 100);
  const idempotencyKey = cleanText(message.idempotencyKey, 100) || invitationId || crypto.randomUUID();
  const tag = cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment';
  const headers = { idempotencyKey };
  if (invitationId) headers['X-Mailin-custom'] = `invitation_id:${invitationId}`;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      to: [{ email: message.to, name: cleanText(message.toName, 140) || undefined }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
      tags: [tag],
      headers,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('brevo_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.code || 'Brevo rejected the request', 300);
    throw error;
  }
  const messageId = cleanText(body.messageId, 300);
  if (!messageId) throw new Error('brevo_missing_message_id');
  return { id: messageId, transport: 'api', message: 'Brevo accepted the transactional email API request.' };
}

function smtpHeader(value) {
  return cleanText(value, 500).replace(/[\r\n]+/g, ' ').trim();
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function foldedBase64(value) {
  return base64Utf8(value).match(/.{1,76}/g)?.join('\r\n') || '';
}

function encodedEmailHeader(value) {
  const text = smtpHeader(value);
  return /[^\x20-\x7E]/.test(text) ? `=?UTF-8?B?${base64Utf8(text)}?=` : text;
}

function smtpMessage(config, message, messageId) {
  const boundary = `gazelle-${crypto.randomUUID()}`;
  const tag = smtpHeader(message.tag).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment';
  const invitationId = smtpHeader(message.invitationId);
  const toName = encodedEmailHeader(message.toName || message.to);
  const fromName = encodedEmailHeader(config.senderName);
  const headers = [
    `From: ${fromName} <${config.senderEmail}>`,
    `To: ${toName} <${message.to}>`,
    `Subject: ${encodedEmailHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `X-Mailin-Tag: ${tag}`,
    invitationId ? `X-Mailin-custom: invitation_id:${invitationId}` : '',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);
  return `${headers.join('\r\n')}\r\n\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldedBase64(message.text)}\r\n--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldedBase64(message.html)}\r\n--${boundary}--\r\n`;
}

async function smtpReadReply(state, timeoutMs = 15000) {
  const lines = [];
  while (true) {
    const newline = state.buffer.indexOf('\n');
    if (newline >= 0) {
      const line = state.buffer.slice(0, newline + 1).replace(/[\r\n]+$/, '');
      state.buffer = state.buffer.slice(newline + 1);
      if (line) lines.push(line);
      const match = line.match(/^(\d{3})([ -])/);
      if (match?.[2] === ' ') return { code: Number(match[1]), lines, text: lines.join(' | ') };
      continue;
    }
    let timer;
    const chunk = await Promise.race([
      state.reader.read(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('brevo_smtp_timeout')), timeoutMs); }),
    ]).finally(() => clearTimeout(timer));
    if (chunk.done) throw new Error('brevo_smtp_disconnected');
    state.buffer += state.decoder.decode(chunk.value, { stream: true });
  }
}

async function smtpCommand(writer, state, command, allowedCodes) {
  await writer.write(new TextEncoder().encode(`${command}\r\n`));
  const reply = await smtpReadReply(state);
  if (!allowedCodes.includes(reply.code)) {
    const error = new Error(reply.code === 535 ? 'brevo_smtp_authentication_failed' : 'brevo_smtp_rejected');
    error.providerStatus = reply.code === 535 ? 401 : 502;
    error.providerMessage = cleanText(reply.text, 400) || 'Brevo SMTP rejected the command.';
    throw error;
  }
  return reply;
}

async function sendBrevoSmtp(config, message) {
  let socket;
  let reader;
  let writer;
  const messageId = `<${crypto.randomUUID()}@gazellehunt.com>`;
  try {
    socket = connectSocket({ hostname: config.smtpHost, port: config.smtpPort }, { secureTransport: 'starttls', allowHalfOpen: false });
    await socket.opened;
    reader = socket.readable.getReader();
    writer = socket.writable.getWriter();
    let state = { reader, decoder: new TextDecoder(), buffer: '' };
    const greeting = await smtpReadReply(state);
    if (greeting.code !== 220) throw new Error('brevo_smtp_greeting_rejected');
    await smtpCommand(writer, state, 'EHLO gazellehunt.com', [250]);
    await smtpCommand(writer, state, 'STARTTLS', [220]);
    reader.releaseLock();
    writer.releaseLock();
    socket = socket.startTls();
    await socket.opened;
    reader = socket.readable.getReader();
    writer = socket.writable.getWriter();
    state = { reader, decoder: new TextDecoder(), buffer: '' };
    await smtpCommand(writer, state, 'EHLO gazellehunt.com', [250]);
    await smtpCommand(writer, state, 'AUTH LOGIN', [334]);
    await smtpCommand(writer, state, btoa(config.smtpLogin), [334]);
    await smtpCommand(writer, state, btoa(config.smtpKey), [235]);
    await smtpCommand(writer, state, `MAIL FROM:<${config.senderEmail}>`, [250]);
    await smtpCommand(writer, state, `RCPT TO:<${message.to}>`, [250, 251]);
    await smtpCommand(writer, state, 'DATA', [354]);
    const mime = smtpMessage(config, message, messageId).replace(/\r?\n\./g, '\r\n..');
    await writer.write(new TextEncoder().encode(`${mime}.\r\n`));
    const accepted = await smtpReadReply(state, 30000);
    if (accepted.code !== 250) {
      const error = new Error('brevo_smtp_message_rejected');
      error.providerStatus = 502;
      error.providerMessage = cleanText(accepted.text, 400);
      throw error;
    }
    await smtpCommand(writer, state, 'QUIT', [221]).catch(() => null);
    const queuedId = accepted.text.match(/<[^>]+>/)?.[0] || messageId;
    return { id: queuedId, transport: 'smtp', message: 'Brevo SMTP relay accepted the transactional email.' };
  } finally {
    try { reader?.releaseLock(); } catch {}
    try { writer?.releaseLock(); } catch {}
    try { socket?.close(); } catch {}
  }
}

async function sendBrevo(env, message) {
  const config = emailConfig(env);
  if (!config.sendingConfigured) throw new Error('email_not_configured');
  if (!cleanEmail(message.to)) {
    const error = new Error('invalid_email');
    error.providerStatus = 422;
    error.providerMessage = 'The candidate email address is invalid. Correct it before sending.';
    throw error;
  }
  return config.transport === 'smtp' ? sendBrevoSmtp(config, message) : sendBrevoApi(config, message);
}

function runtimeOrigin(request, env) {
  return cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '') || new URL(request.url).origin;
}

async function issuePasswordReset(request, env, target, requestedBy = null) {
  const token = randomToken();
  const tokenHash = await sessionTokenHash(token, env);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS);
  await env.DB.batch([
    env.DB.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL`).bind(now.toISOString(), target.id),
    env.DB.prepare(`
      INSERT INTO password_reset_tokens (token_hash, user_id, requested_by_user_id, created_at, expires_at, used_at)
      VALUES (?, ?, ?, ?, ?, NULL)
    `).bind(tokenHash, target.id, requestedBy?.id || null, now.toISOString(), expiresAt.toISOString()),
  ]);
  const resetUrl = `${runtimeOrigin(request, env)}/?reset=${encodeURIComponent(token)}`;
  try {
    const provider = await sendBrevo(env, {
      to: target.email,
      toName: target.name,
      subject: 'Set up or reset your Gazelle Assessment password',
      text: `Hello ${target.name},\n\nUse this secure link to create or reset your Gazelle Assessment password. The link expires in 60 minutes and can be used only once:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this message.\n\n---\n\nHola ${target.name},\n\nUsa este enlace seguro para crear o restablecer tu contraseña de Gazelle Assessment. El enlace vence en 60 minutos y solo puede usarse una vez:\n\n${resetUrl}\n\nSi no solicitaste este cambio, puedes ignorar este mensaje.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Set up or reset your password</h1><p>Hello ${escapeHtml(target.name)},</p><p>Use the secure link below to create or reset your Gazelle Assessment password. It expires in 60 minutes and can be used only once.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#11756d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Create or reset password</a></p><hr style="border:0;border-top:1px solid #dbe2e1;margin:28px 0"><h2 style="font-size:20px">Crea o restablece tu contraseña</h2><p>Usa el enlace seguro para crear o restablecer tu contraseña. Vence en 60 minutos y solo puede usarse una vez.</p><p style="font-size:13px;color:#687174">If you did not request this, you can ignore this message. · Si no solicitaste este cambio, puedes ignorar este mensaje.</p></div>`,
      tag: 'staff-password-reset',
    });
    await audit(env, requestedBy?.email || target.email, 'password_reset_requested', 'user', target.id, { providerMessageId: provider.id, requestedByAdmin: Boolean(requestedBy) });
    return provider;
  } catch (error) {
    await env.DB.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?`).bind(new Date().toISOString(), tokenHash).run();
    await audit(env, requestedBy?.email || target.email, 'password_reset_delivery_failed', 'user', target.id, { errorCode: error.message });
    throw error;
  }
}

async function requestPasswordReset(request, env) {
  const body = await request.json().catch(() => ({}));
  const email = cleanEmail(body.email);
  if (!await rateLimit(env, request, 'password_reset_request', email || 'invalid', 3, 60 * 60)) {
    return json({ error: 'Too many reset requests. Try again later.', code: 'rate_limited' }, 429);
  }
  const target = email ? await env.DB.prepare(`SELECT id, email, name, status FROM users WHERE email = ? COLLATE NOCASE`).bind(email).first() : null;
  if (target?.status === 'active') await issuePasswordReset(request, env, target).catch(() => null);
  return json({ accepted: true, message: 'If an active account exists, a password reset link has been sent.' }, 202);
}

async function confirmPasswordReset(request, env) {
  const body = await request.json().catch(() => ({}));
  const token = cleanText(body.token, 300);
  const newPassword = String(body.newPassword || '');
  const passwordError = validatePassword(newPassword);
  if (passwordError) return json({ error: passwordError, code: 'weak_password' }, 422);
  if (!token || !await rateLimit(env, request, 'password_reset_confirm', 'token', 8, 60 * 60)) {
    return json({ error: 'This password reset link is invalid or expired.', code: 'invalid_reset_token' }, 422);
  }
  const tokenHash = await sessionTokenHash(token, env);
  const stored = await env.DB.prepare(`
    SELECT t.token_hash, t.user_id, t.expires_at, t.used_at, u.email, u.status
    FROM password_reset_tokens t JOIN users u ON u.id = t.user_id
    WHERE t.token_hash = ?
  `).bind(tokenHash).first();
  if (!stored || stored.used_at || stored.status !== 'active' || new Date(stored.expires_at).getTime() <= Date.now()) {
    return json({ error: 'This password reset link is invalid or expired.', code: 'invalid_reset_token' }, 422);
  }
  const passwordData = await passwordRecord(newPassword, env);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, password_changed_at = ?, updated_at = ? WHERE id = ?`)
      .bind(passwordData.hash, passwordData.salt, passwordData.iterations, now, now, stored.user_id),
    env.DB.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL`).bind(now, stored.user_id),
    env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`).bind(now, stored.user_id),
  ]);
  await audit(env, stored.email, 'password_reset_completed', 'user', stored.user_id, {});
  return json({ changed: true });
}

async function sendAccountApprovedEmail(request, env, target, companyName, role) {
  const loginUrl = `${runtimeOrigin(request, env)}/`;
  return sendBrevo(env, {
    to: target.email,
    toName: target.name,
    subject: 'Your Gazelle Assessment access is ready',
    text: `Hello ${target.name},\n\nYour Gazelle Assessment account was approved as ${role === 'admin' ? 'Company administrator' : 'Recruiter'} for ${companyName}. Sign in with the password you created during registration:\n\n${loginUrl}\n\nIf you forgot your password, select “Forgot password?” on the sign-in page.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Your access is ready</h1><p>Hello ${escapeHtml(target.name)},</p><p>Your account was approved as <strong>${role === 'admin' ? 'Company administrator' : 'Recruiter'}</strong> for <strong>${escapeHtml(companyName)}</strong>.</p><p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#11756d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Sign in to Gazelle</a></p><p style="font-size:13px;color:#687174">Use the password you created during registration. If you forgot it, select “Forgot password?” on the sign-in page.</p></div>`,
    tag: 'staff-access-approved',
  });
}

const BREVO_TRANSACTIONAL_EVENTS = Object.freeze([
  'sent', 'delivered', 'hardBounce', 'softBounce', 'blocked', 'spam', 'invalid', 'deferred', 'unsubscribed',
]);

function brevoWebhookPayload(config, webhookUrl) {
  return {
    description: 'Gazelle Assessment transactional delivery events',
    url: webhookUrl,
    events: BREVO_TRANSACTIONAL_EVENTS,
    type: 'transactional',
    batched: false,
    headers: [{ key: 'X-Gazelle-Webhook-Token', value: config.webhookToken }],
  };
}

async function brevoApiRequest(config, path, options = {}) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method: options.method || 'GET',
    headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('brevo_configuration_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.code || 'Brevo rejected the configuration request.', 400);
    throw error;
  }
  return body;
}

async function infobipApiRequest(config, path, options = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: { accept: 'application/json', authorization: `App ${config.apiKey}`, 'content-type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('infobip_configuration_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.requestError?.serviceException?.text || body.message || body.error || 'Infobip rejected the messaging request.', 400);
    throw error;
  }
  return body;
}

function infobipTemplateRecords(value, records = []) {
  if (!value || typeof value !== 'object') return records;
  if (!Array.isArray(value)) {
    const templateName = cleanText(value.name || value.templateName, 120);
    const status = cleanText(value.status || value.state || value.registrationStatus, 80);
    if (templateName || status) records.push(value);
  }
  const values = Array.isArray(value) ? value : Object.values(value);
  for (const item of values) {
    if (item && typeof item === 'object') infobipTemplateRecords(item, records);
  }
  return records;
}

function normalizedTemplateStatus(template) {
  return cleanText(template?.status || template?.state || template?.registrationStatus, 80).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function isInfobipTemplateSendable(template) {
  const status = normalizedTemplateStatus(template);
  if (!status) return false;
  if (/(REJECTED|PENDING|IN_REVIEW|PAUSED|DISABLED|DELETED|ARCHIVED)/.test(status)) return false;
  return /(APPROVED|ACTIVE)/.test(status);
}

function findInfobipTemplate(body, templateName, language) {
  const expectedName = cleanText(templateName, 120).toLowerCase();
  const expectedLanguage = cleanText(language, 20).toLowerCase();
  return infobipTemplateRecords(body).find((template) => {
    const name = cleanText(template.name || template.templateName, 120).toLowerCase();
    const id = cleanText(template.id || template.templateId, 120).toLowerCase();
    const templateLanguage = cleanText(template.language || template.locale, 20).toLowerCase();
    return (name === expectedName || id === expectedName) && (!expectedLanguage || !templateLanguage || templateLanguage === expectedLanguage);
  }) || null;
}

async function infobipWhatsAppTemplateStatus(env, templateName = null, language = null) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  const sender = contact.whatsapp.senderNumber;
  const wantedName = cleanText(templateName, 120) || contact.whatsapp.templateName;
  const wantedLanguage = cleanText(language, 20) || contact.whatsapp.templateLanguage || 'es';
  if (!config.configured || !sender || !wantedName) {
    return {
      configured: false,
      sendable: false,
      templateName: wantedName || null,
      language: wantedLanguage,
      status: null,
      missing: contact.whatsapp.missing,
      error: 'Infobip WhatsApp template validation is not configured.',
    };
  }
  const body = await infobipApiRequest(config, `/whatsapp/2/senders/${encodeURIComponent(sender)}/templates`);
  const template = findInfobipTemplate(body, wantedName, wantedLanguage);
  return {
    configured: true,
    sendable: Boolean(template && isInfobipTemplateSendable(template)),
    templateName: wantedName,
    language: wantedLanguage,
    status: template ? normalizedTemplateStatus(template) || null : null,
    missing: [],
    error: template ? null : 'The configured WhatsApp template was not found for this sender and language.',
  };
}

function compactMessage(value, max = 420) {
  return cleanText(value, max).replace(/\s+/g, ' ').trim();
}

function textInvitationCopy(candidate, locale, link) {
  const brand = candidate.candidate_brand_name || 'Allied Global';
  const name = candidate.name || (locale === 'es' ? 'candidato' : 'candidate');
  const role = candidate.role || (locale === 'es' ? 'la posición' : 'the role');
  if (locale === 'es') {
    return compactMessage(`Hola ${name}, ${brand} te invita a completar tu evaluación para ${role}. Toma unos 10 minutos. Entra aquí: ${link}`, 320);
  }
  return compactMessage(`Hi ${name}, ${brand} invited you to complete your assessment for ${role}. It takes about 10 minutes. Open it here: ${link}`, 320);
}

function templateInvitationMessage(candidate, locale, link, step = {}) {
  const template = cleanText(locale === 'es' ? step.message_es : step.message_en, 800);
  if (!template) return textInvitationCopy(candidate, locale, link);
  return compactMessage(template
    .replaceAll('{{name}}', candidate.name || '')
    .replaceAll('{{brand}}', candidate.candidate_brand_name || 'Allied Global')
    .replaceAll('{{role}}', candidate.role || '')
    .replaceAll('{{link}}', link), 800);
}

async function sendBrevoSms(env, message) {
  const config = emailConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured) {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'Brevo SMS'} before SMS journeys can send.`;
    throw error;
  }
  const body = await brevoApiRequest(config, '/transactionalSMS/send', {
    method: 'POST',
    body: {
      sender: contact.sms.sender,
      recipient: message.toPhone,
      content: compactMessage(message.text, 640),
      type: 'transactional',
      tag: cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment',
    },
  });
  const messageId = cleanText(body.messageId || body.reference || body.id, 300) || `brevo-sms-${crypto.randomUUID()}`;
  return { id: messageId, transport: 'sms', message: 'Brevo accepted the transactional SMS request.' };
}

async function sendBrevoWhatsApp(env, message) {
  const config = emailConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.whatsapp.configured) {
    const error = new Error('whatsapp_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.whatsapp.missing.join(', ') || 'Brevo WhatsApp'} before WhatsApp journeys can send.`;
    throw error;
  }
  const payload = {
    senderNumber: contact.whatsapp.senderNumber,
    contactNumbers: [message.toPhone],
  };
  const templateId = cleanText(message.templateId, 80) || contact.whatsapp.templateId;
  if (templateId) payload.templateId = Number.isFinite(Number(templateId)) ? Number(templateId) : templateId;
  else payload.text = compactMessage(message.text, 900);
  const body = await brevoApiRequest(config, '/whatsapp/sendMessage', { method: 'POST', body: payload });
  const messageId = cleanText(body.messageId || body.reference || body.id, 300) || `brevo-whatsapp-${crypto.randomUUID()}`;
  return { id: messageId, transport: 'whatsapp', message: 'Brevo accepted the WhatsApp request.' };
}

async function sendInfobipSms(env, message) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured || contact.sms.providerKey !== 'infobip') {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'Infobip SMS'} before SMS journeys can send.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const body = await infobipApiRequest(config, '/sms/2/text/advanced', {
    method: 'POST',
    body: {
      messages: [{
        from: contact.sms.sender,
        destinations: [{ to: message.toPhone, messageId: providerMessageId }],
        text: compactMessage(message.text, 640),
      }],
    },
  });
  const responseMessage = Array.isArray(body.messages) ? body.messages[0] || {} : {};
  const messageId = cleanText(responseMessage.messageId || body.bulkId || providerMessageId, 300);
  return { id: messageId, transport: 'sms', message: 'Infobip accepted the SMS request.' };
}

async function sendCustomHttpSms(env, message) {
  const config = customSmsConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured || contact.sms.providerKey !== 'custom_http') {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'custom SMS provider'} before SMS journeys can send.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const headers = { accept: 'application/json', 'content-type': 'application/json' };
  headers[config.authHeader] = `${config.authScheme} ${config.apiKey}`.trim();
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: config.sender,
      to: message.toPhone,
      text: compactMessage(message.text, 640),
      messageId: providerMessageId,
      tag: cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('custom_sms_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.error || body.code || 'The custom SMS provider rejected the request.', 400);
    throw error;
  }
  const messageId = cleanText(body.messageId || body.id || body.reference || providerMessageId, 300);
  return { id: messageId, transport: 'sms', message: 'The custom SMS provider accepted the request.' };
}

async function sendInfobipWhatsApp(env, message) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.whatsapp.configured || contact.whatsapp.providerKey !== 'infobip') {
    const error = new Error('whatsapp_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.whatsapp.missing.join(', ') || 'Infobip WhatsApp'} before WhatsApp journeys can send.`;
    throw error;
  }
  const templateName = cleanText(message.templateName, 120) || cleanText(message.templateId, 120) || contact.whatsapp.templateName;
  const language = cleanText(message.templateLanguage, 20) || contact.whatsapp.templateLanguage || 'es';
  const buttonToken = cleanText(message.buttonToken, 500) || cleanText(message.link || '', 500);
  const bodyPlaceholders = [
    cleanText(message.candidate?.name || '', 120),
    cleanText(message.candidate?.candidate_brand_name || 'Allied Global', 120),
    cleanText(message.candidate?.role || '', 120),
  ];
  if (config.whatsappLinkPlacement === 'body') bodyPlaceholders.push(cleanText(message.link || '', 500));
  const templateStatus = await infobipWhatsAppTemplateStatus(env, templateName, language);
  if (!templateStatus.sendable) {
    const error = new Error('whatsapp_template_not_approved');
    error.providerStatus = 422;
    error.providerMessage = templateStatus.error || `Infobip template ${templateName} is ${templateStatus.status || 'not approved'} and cannot be sent yet.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const body = await infobipApiRequest(config, '/whatsapp/1/message/template', {
    method: 'POST',
    body: {
      messages: [{
        from: contact.whatsapp.senderNumber,
        to: message.toPhone,
        messageId: providerMessageId,
        content: {
          templateName,
          templateData: {
            body: {
              placeholders: bodyPlaceholders,
            },
            ...(config.whatsappLinkPlacement === 'button' ? { buttons: [{ type: 'URL', parameter: buttonToken }] } : {}),
          },
          language,
        },
      }],
    },
  });
  const responseMessage = Array.isArray(body.messages) ? body.messages[0] || {} : {};
  const messageId = cleanText(responseMessage.messageId || body.bulkId || providerMessageId, 300);
  return { id: messageId, transport: 'whatsapp', message: 'Infobip accepted the WhatsApp template request.' };
}

async function sendSms(env, message) {
  const provider = contactabilityConfig(env).sms.providerKey;
  if (provider === 'infobip') return sendInfobipSms(env, message);
  if (provider === 'custom_http') return sendCustomHttpSms(env, message);
  return sendBrevoSms(env, message);
}

async function sendWhatsApp(env, message) {
  return contactabilityConfig(env).whatsapp.providerKey === 'infobip'
    ? sendInfobipWhatsApp(env, message)
    : sendBrevoWhatsApp(env, message);
}

async function brevoDiagnosticRequest(config, path) {
  try {
    return { ok: true, body: await brevoApiRequest(config, path), error: null };
  } catch (error) {
    return {
      ok: false,
      body: null,
      error: {
        code: cleanText(error.message, 100) || 'brevo_request_failed',
        message: cleanText(error.providerMessage, 300) || 'Brevo could not complete the diagnostic request.',
        status: Number(error.providerStatus || 0) || null,
      },
    };
  }
}

function normalizedProviderMessageId(value) {
  return cleanText(value, 400).replace(/^</, '').replace(/>$/, '').trim();
}

async function brevoBlockedRecipient(config, email) {
  const recipient = cleanEmail(email);
  if (!recipient) return { checked: false, blocked: false, reason: null, senderEmail: null };
  let offset = 0;
  let total = 0;
  let checked = 0;
  for (let page = 0; page < 20; page += 1) {
    const body = await brevoApiRequest(config, `/smtp/blockedContacts?limit=100&offset=${offset}&sort=desc`);
    const contacts = body.contacts || [];
    total = Number(body.count || contacts.length);
    checked += contacts.length;
    const match = contacts.find((contact) => {
      if (cleanEmail(contact.email) !== recipient) return false;
      const blockedSender = cleanEmail(contact.senderEmail);
      return !blockedSender || blockedSender === config.senderEmail;
    });
    if (match) {
      return {
        checked: true,
        blocked: true,
        reason: cleanText(match.reason?.message || match.reason?.code, 240) || 'Blocked or unsubscribed',
        reasonCode: cleanText(match.reason?.code, 100) || null,
        senderEmail: cleanEmail(match.senderEmail) || null,
        blockedAt: cleanText(match.blockedAt, 80) || null,
      };
    }
    offset += contacts.length;
    if (!contacts.length || offset >= total) break;
  }
  return { checked: true, blocked: false, reason: null, senderEmail: null, checkedContacts: checked, totalContacts: total };
}

async function emailDeliveryDiagnostics(request, env, user) {
  if (!isSuperAdmin(user)) return json({ error: 'Super administrator access is required.', code: 'super_admin_required' }, 403);
  const config = emailConfig(env);
  if (!config.apiConfigured) return json({ error: 'The Brevo API key is required for delivery diagnostics.', code: 'brevo_api_not_configured' }, 503);
  const requestUrl = new URL(request.url);
  const batchId = cleanText(requestUrl.searchParams.get('batchId'), 100);
  const requestedRecipient = cleanText(requestUrl.searchParams.get('email'), 320);
  const normalizedRecipient = requestedRecipient ? normalizeCandidateEmail(requestedRecipient) : null;
  if (requestedRecipient && !normalizedRecipient?.valid) return json({ error: 'Enter a valid recipient email address.', code: 'invalid_email' }, 422);
  const batch = batchId ? await env.DB.prepare(`SELECT id, total_count, accepted_count, failed_count, created_at FROM send_batches WHERE id = ?`).bind(batchId).first() : null;
  if (batchId && !batch) return json({ error: 'Batch not found.', code: 'batch_not_found' }, 404);
  const invitationResult = batch
    ? await env.DB.prepare(`SELECT invitation_id, provider_message_id FROM send_batch_items WHERE batch_id = ? AND provider_message_id IS NOT NULL`).bind(batch.id).all()
    : await env.DB.prepare(`SELECT id AS invitation_id, provider_message_id FROM invitations WHERE provider_message_id IS NOT NULL ORDER BY created_at DESC LIMIT 500`).all();
  const invitations = invitationResult.results || [];
  const providerIds = new Set(invitations.map((entry) => normalizedProviderMessageId(entry.provider_message_id)).filter(Boolean));
  const latestTest = await env.DB.prepare(`
    SELECT json_extract(payload_json, '$.providerMessageId') AS provider_message_id,
      json_extract(payload_json, '$.to') AS recipient
    FROM audit_events WHERE event_type = 'email_connection_tested'
    ORDER BY created_at DESC LIMIT 1
  `).first();
  const sampleMessageId = latestTest?.provider_message_id || invitations[0]?.provider_message_id || null;
  const sampleRecipient = normalizedRecipient?.email || cleanEmail(latestTest?.recipient);
  const empty = (body) => ({ ok: true, body, error: null });
  const [accountResult, activityResult, sampleLookupResult, sampleEventsResult, recipientLookupResult, recipientEventsResult, blockedRecipientResult, sendersResult, domainsResult] = await Promise.all([
    brevoDiagnosticRequest(config, '/account'),
    brevoDiagnosticRequest(config, '/smtp/statistics/events?days=2&limit=5000&sort=desc'),
    sampleMessageId ? brevoDiagnosticRequest(config, `/smtp/emails?messageId=${encodeURIComponent(sampleMessageId)}&limit=10`) : Promise.resolve(empty({ count: 0, transactionalEmails: [] })),
    sampleMessageId ? brevoDiagnosticRequest(config, `/smtp/statistics/events?messageId=${encodeURIComponent(sampleMessageId)}&limit=100&sort=desc`) : Promise.resolve(empty({ events: [] })),
    sampleRecipient ? brevoDiagnosticRequest(config, `/smtp/emails?email=${encodeURIComponent(sampleRecipient)}&limit=50&sort=desc`) : Promise.resolve(empty({ count: 0, transactionalEmails: [] })),
    sampleRecipient ? brevoDiagnosticRequest(config, `/smtp/statistics/events?email=${encodeURIComponent(sampleRecipient)}&days=2&limit=100&sort=desc`) : Promise.resolve(empty({ events: [] })),
    sampleRecipient ? brevoBlockedRecipient(config, sampleRecipient).then((body) => empty(body)).catch((error) => ({ ok: false, body: { checked: false, blocked: false }, error: { code: cleanText(error.message, 100), message: cleanText(error.providerMessage, 300), status: Number(error.providerStatus || 0) || null } })) : Promise.resolve(empty({ checked: false, blocked: false })),
    brevoDiagnosticRequest(config, '/senders'),
    brevoDiagnosticRequest(config, '/senders/domains'),
  ]);
  const account = accountResult.body || {};
  const activity = activityResult.body || { events: [] };
  const sampleLookup = sampleLookupResult.body || { count: 0, transactionalEmails: [] };
  const sampleEvents = sampleEventsResult.body || { events: [] };
  const recipientLookup = recipientLookupResult.body || { count: 0, transactionalEmails: [] };
  const recipientEvents = recipientEventsResult.body || { events: [] };
  const blockedRecipient = blockedRecipientResult.body || { checked: false, blocked: false };
  const senders = sendersResult.body || { senders: [] };
  const domains = domainsResult.body || { domains: [] };
  const diagnosticErrors = [accountResult, activityResult, sampleLookupResult, sampleEventsResult, recipientLookupResult, recipientEventsResult, blockedRecipientResult, sendersResult, domainsResult]
    .filter((result) => !result.ok && result.error)
    .map((result) => result.error);
  const matchedEvents = (activity.events || []).filter((event) => providerIds.has(normalizedProviderMessageId(event.messageId)));
  const eventCounts = {};
  matchedEvents.forEach((event) => { eventCounts[event.event || 'unknown'] = (eventCounts[event.event || 'unknown'] || 0) + 1; });
  const matchedProviderIds = new Set(matchedEvents.map((event) => normalizedProviderMessageId(event.messageId)).filter(Boolean));
  const accountEventCounts = {};
  (activity.events || []).forEach((event) => { accountEventCounts[event.event || 'unknown'] = (accountEventCounts[event.event || 'unknown'] || 0) + 1; });
  const taggedEvents = (activity.events || []).filter((event) => event.tag === 'tenure-potential');
  const taggedEventCounts = {};
  taggedEvents.forEach((event) => { taggedEventCounts[event.event || 'unknown'] = (taggedEventCounts[event.event || 'unknown'] || 0) + 1; });
  const sampleEventCounts = {};
  (sampleEvents.events || []).forEach((event) => { sampleEventCounts[event.event || 'unknown'] = (sampleEventCounts[event.event || 'unknown'] || 0) + 1; });
  const recipientEventCounts = {};
  (recipientEvents.events || []).forEach((event) => { recipientEventCounts[event.event || 'unknown'] = (recipientEventCounts[event.event || 'unknown'] || 0) + 1; });
  const sampleNormalizedId = normalizedProviderMessageId(sampleMessageId);
  const recipientMessageMatch = (recipientLookup.transactionalEmails || []).some((entry) => normalizedProviderMessageId(entry.messageId) === sampleNormalizedId);
  const senderRecord = (senders.senders || []).find((sender) => cleanEmail(sender.email) === config.senderEmail);
  const senderDomain = config.senderEmail.split('@')[1] || '';
  const domainRecord = (domains.domains || []).find((domain) => cleanText(domain.domain_name, 180).toLowerCase() === senderDomain);
  let webhookCounts = [];
  if (invitations.length) {
    const webhookResult = batch
      ? await env.DB.prepare(`
        SELECT e.event_type, COUNT(*) AS count FROM email_events e
        JOIN send_batch_items bi ON bi.invitation_id = e.invitation_id
        WHERE bi.batch_id = ? GROUP BY e.event_type ORDER BY e.event_type
      `).bind(batch.id).all()
      : await env.DB.prepare(`
        SELECT e.event_type, COUNT(*) AS count FROM email_events e
        JOIN (SELECT id FROM invitations WHERE provider_message_id IS NOT NULL ORDER BY created_at DESC LIMIT 500) recent
          ON recent.id = e.invitation_id
        GROUP BY e.event_type ORDER BY e.event_type
      `).all();
    webhookCounts = webhookResult.results || [];
  }
  return json({
    account: {
      email: cleanEmail(account.email),
      companyName: cleanText(account.companyName, 160) || null,
      organizationId: cleanText(account.organization_id, 160) || null,
      relayEnabled: Boolean(account.relay?.enabled),
      relayUsername: cleanEmail(account.relay?.data?.userName),
      plans: (account.plan || []).map((plan) => ({ type: cleanText(plan.type, 60), creditsType: cleanText(plan.creditsType, 60), credits: Number(plan.credits || 0) })),
    },
    sender: { email: config.senderEmail, exists: Boolean(senderRecord), active: Boolean(senderRecord?.active) },
    domain: { name: senderDomain, exists: Boolean(domainRecord), verified: Boolean(domainRecord?.verified), authenticated: Boolean(domainRecord?.authenticated) },
    recipient: {
      email: sampleRecipient || null,
      checked: blockedRecipient.checked,
      blocked: blockedRecipient.blocked,
      reason: blockedRecipient.reason,
      reasonCode: blockedRecipient.reasonCode || null,
      blockedAt: blockedRecipient.blockedAt || null,
      senderEmail: blockedRecipient.senderEmail,
      transactionalEmailCount: Number(recipientLookup.count || 0),
      latestMessageMatchedByRecipient: recipientMessageMatch,
      eventCounts: recipientEventCounts,
      events: (recipientEvents.events || []).slice(0, 20).map((event) => ({
        event: normalizedBrevoEvent(event.event),
        date: cleanText(event.date, 80) || null,
        reason: cleanText(event.reason, 240) || null,
        messageId: normalizedProviderMessageId(event.messageId),
      })),
    },
    batch: batch ? {
      id: batch.id,
      total: Number(batch.total_count || 0),
      accepted: Number(batch.accepted_count || 0),
      failed: Number(batch.failed_count || 0),
      createdAt: batch.created_at,
    } : null,
    provider: {
      messageIds: providerIds.size,
      matchedMessageIds: matchedProviderIds.size,
      eventCounts,
      latestEventAt: matchedEvents.map((event) => event.date).filter(Boolean).sort().at(-1) || null,
      accountEvents: (activity.events || []).length,
      accountEventCounts,
      tenurePotentialMessageIds: new Set(taggedEvents.map((event) => normalizedProviderMessageId(event.messageId)).filter(Boolean)).size,
      tenurePotentialEventCounts: taggedEventCounts,
      latestAccountEventAt: (activity.events || []).map((event) => event.date).filter(Boolean).sort().at(-1) || null,
      sampleMessageLookupCount: Number(sampleLookup.count || 0),
      sampleMessageId,
      sampleEventCounts,
      sampleEvents: (sampleEvents.events || []).slice(0, 10).map((event) => ({ event: cleanText(event.event, 80) || 'unknown', date: cleanText(event.date, 80) || null, reason: cleanText(event.reason, 200) || null })),
      recentEvents: (activity.events || []).slice(0, 12).map((event) => ({
        event: cleanText(event.event, 80) || 'unknown',
        date: cleanText(event.date, 80) || null,
        tag: cleanText(event.tag, 80) || null,
        matchedInvitation: providerIds.has(normalizedProviderMessageId(event.messageId)),
      })),
    },
    webhook: { eventCounts: webhookCounts.map((entry) => ({ event: entry.event_type, count: Number(entry.count || 0) })) },
    errors: diagnosticErrors,
  });
}

function invitationCopy(candidate, locale, link) {
  const name = escapeHtml(candidate.name.split(/\s+/)[0] || candidate.name);
  const role = escapeHtml(candidate.role);
  const brand = escapeHtml(candidate.candidate_brand_name || 'Allied Global');
  const safeLink = escapeHtml(link);
  if (locale === 'es') {
    return {
      subject: `Tu proceso con ${candidate.candidate_brand_name || 'Allied Global'}`,
      text: `Hola ${candidate.name},\n\nBienvenido a ${candidate.candidate_brand_name || 'Allied Global'}. Te invitamos a completar la evaluación de Potencial de Permanencia para el puesto ${candidate.role}. Busca un lugar tranquilo y reserva al menos 10 minutos. No te preocupes: simplemente queremos conocerte mejor. En tu portal podrás elegir inglés o español, completar la evaluación y seguir el avance de tu proceso.\n\n${link}\n\nEl resultado será revisado por una persona junto con otra información del proceso.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Bienvenido a ${brand}</h1><p>Hola ${name},</p><p>Te invitamos a completar la evaluación de <strong>Potencial de Permanencia</strong> para el puesto <strong>${role}</strong>.</p><p>Busca un lugar tranquilo y reserva al menos 10 minutos. No te preocupes: simplemente queremos conocerte mejor. En tu portal podrás elegir inglés o español, completar la evaluación y seguir el avance de tu proceso.</p><p><a href="${safeLink}" style="display:inline-block;background:#11756d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Abrir mi portal</a></p><p style="font-size:13px;color:#687174">El resultado será revisado por una persona junto con otra información del proceso.</p></div>`,
    };
  }
  return {
    subject: `Your application with ${candidate.candidate_brand_name || 'Allied Global'}`,
    text: `Hello ${candidate.name},\n\nWelcome to ${candidate.candidate_brand_name || 'Allied Global'}. You are invited to complete the Tenure Potential assessment for the ${candidate.role} role. Find a quiet place and reserve at least 10 minutes. Don't worry: we simply want to get to know you better. In your portal you can choose English or Spanish, complete the assessment, and follow your hiring progress.\n\n${link}\n\nA person will review the result together with other hiring information.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Welcome to ${brand}</h1><p>Hello ${name},</p><p>You are invited to complete the <strong>Tenure Potential</strong> assessment for the <strong>${role}</strong> role.</p><p>Find a quiet place and reserve at least 10 minutes. Don't worry: we simply want to get to know you better. In your portal you can choose English or Spanish, complete the assessment, and follow your hiring progress.</p><p><a href="${safeLink}" style="display:inline-block;background:#11756d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Open my portal</a></p><p style="font-size:13px;color:#687174">A person will review the result together with other hiring information.</p></div>`,
  };
}

async function audit(env, actor, type, entityType, entityId, payload) {
  await env.DB.prepare(`INSERT INTO audit_events (id, actor_email, event_type, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), actor || null, type, entityType, entityId, JSON.stringify(payload || {}), new Date().toISOString())
    .run();
}

async function testAttemptStatus(env, candidateId, testId, updatedByUserId = null) {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO candidate_test_access (candidate_id, test_id, attempt_limit, updated_by_user_id, updated_at)
    VALUES (?, ?, 3, ?, ?)
  `).bind(candidateId, testId, updatedByUserId, now).run();
  const row = await env.DB.prepare(`
    SELECT a.attempt_limit,
      (SELECT COUNT(*) FROM invitations i WHERE i.candidate_id = a.candidate_id AND i.test_id = a.test_id AND i.status NOT IN ('failed', 'provider_unconfirmed')) AS attempts_used
    FROM candidate_test_access a WHERE a.candidate_id = ? AND a.test_id = ?
  `).bind(candidateId, testId).first();
  const limit = Number(row?.attempt_limit || 3);
  const used = Number(row?.attempts_used || 0);
  return { limit, used, remaining: Math.max(0, limit - used) };
}

async function staffCandidate(env, user, candidateId) {
  const scope = candidateScope(user);
  return env.DB.prepare(`SELECT c.* FROM candidates c WHERE c.id = ? AND ${scope.sql}`).bind(candidateId, ...scope.bindings).first();
}

async function listRecruitmentStages(env, user) {
  const companyFilter = isSuperAdmin(user) ? '1 = 1' : 's.company_id = ?';
  const bindings = isSuperAdmin(user) ? [] : [user.companyId];
  const result = await env.DB.prepare(`
    SELECT s.*, c.name AS company_name FROM recruitment_stages s JOIN companies c ON c.id = s.company_id
    WHERE ${companyFilter} AND s.status = 'active' ORDER BY c.name, s.stage_order
  `).bind(...bindings).all();
  return result.results || [];
}

async function createRecruitmentStage(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const companyId = isSuperAdmin(user) ? cleanText(body.companyId, 100) || user.companyId : user.companyId;
  const nameEn = cleanText(body.nameEn, 120);
  const nameEs = cleanText(body.nameEs, 120);
  if (!companyId || !nameEn || !nameEs) return json({ error: 'Company and both stage names are required.', code: 'invalid_stage' }, 422);
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.' }, 404);
  const last = await env.DB.prepare(`SELECT COALESCE(MAX(stage_order), 0) AS stage_order FROM recruitment_stages WHERE company_id = ?`).bind(companyId).first();
  const stageKeyBase = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48) || 'custom';
  const stageKey = `${stageKeyBase}_${crypto.randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO recruitment_stages (id, company_id, stage_key, name_en, name_es, stage_order, is_terminal, status, created_by_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 'active', ?, ?, ?)
  `).bind(crypto.randomUUID(), companyId, stageKey, nameEn, nameEs, Number(last?.stage_order || 0) + 10, user.id, now, now).run();
  await audit(env, user.email, 'recruitment_stage_created', 'company', companyId, { stageKey, nameEn, nameEs });
  return json({ stages: await listRecruitmentStages(env, user) }, 201);
}

async function updateCandidateStage(request, env, user, candidateId) {
  const candidate = await staffCandidate(env, user, candidateId);
  if (!candidate) return json({ error: 'Candidate not found.' }, 404);
  const body = await request.json().catch(() => ({}));
  const stageId = cleanText(body.stageId, 100);
  const messageEn = cleanText(body.messageEn, 1200);
  const messageEs = cleanText(body.messageEs, 1200);
  const stage = await env.DB.prepare(`SELECT * FROM recruitment_stages WHERE id = ? AND company_id = ? AND status = 'active'`).bind(stageId, candidate.company_id).first();
  if (!stage || !messageEn || !messageEs) return json({ error: 'A valid stage and both candidate-facing messages are required.', code: 'invalid_stage_update' }, 422);
  const now = new Date().toISOString();
  await ensureCandidatePipeline(env, candidate.id, candidate.company_id);
  await env.DB.batch([
    env.DB.prepare(`UPDATE candidate_pipeline SET stage_id = ?, status_message_en = ?, status_message_es = ?, updated_by_user_id = ?, updated_at = ? WHERE candidate_id = ?`)
      .bind(stage.id, messageEn, messageEs, user.id, now, candidate.id),
    env.DB.prepare(`INSERT INTO candidate_stage_history (id, candidate_id, stage_id, status_message_en, status_message_es, changed_by_user_id, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), candidate.id, stage.id, messageEn, messageEs, user.id, now),
  ]);
  await audit(env, user.email, 'candidate_stage_updated', 'candidate', candidate.id, { stageId: stage.id, stageKey: stage.stage_key });
  return json({ candidateId: candidate.id, stageId: stage.id, updatedAt: now });
}

async function createCandidatePortalLink(env, candidateId, origin) {
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`INSERT INTO candidate_portal_links (id, candidate_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), candidateId, await sha256(token), expiresAt, now.toISOString()).run();
  return { link: `${origin}/candidate?invite=${encodeURIComponent(token)}`, expiresAt };
}

async function createCandidateCommunication(request, env, user, candidateId) {
  const candidate = await staffCandidate(env, user, candidateId);
  if (!candidate) return json({ error: 'Candidate not found.' }, 404);
  const body = await request.json().catch(() => ({}));
  const subjectEn = cleanText(body.subjectEn, 180);
  const subjectEs = cleanText(body.subjectEs, 180);
  const messageEn = cleanText(body.messageEn, 3000);
  const messageEs = cleanText(body.messageEs, 3000);
  const sendEmail = Boolean(body.sendEmail);
  if (!messageEn || !messageEs || (sendEmail && (!subjectEn || !subjectEs))) return json({ error: 'Both English and Spanish message content is required.', code: 'invalid_communication' }, 422);
  const origin = cleanText(env.APP_BASE_URL, 500) || new URL(request.url).origin;
  const access = await createCandidatePortalLink(env, candidate.id, origin);
  let providerMessageId = null;
  if (sendEmail) {
    const latest = await env.DB.prepare(`SELECT locale FROM invitations WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1`).bind(candidate.id).first();
    const useSpanish = latest?.locale === 'es';
    const selectedSubject = useSpanish ? subjectEs : subjectEn;
    const selectedMessage = useSpanish ? messageEs : messageEn;
    const button = useSpanish ? 'Ver mi proceso' : 'View my application';
    const provider = await sendBrevo(env, {
      to: candidate.email,
      toName: candidate.name,
      subject: selectedSubject,
      text: `${selectedMessage}\n\n${access.link}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:23px">GazelleHunt</h1><p style="line-height:1.65">${escapeHtml(selectedMessage).replace(/\n/g, '<br>')}</p><p><a href="${escapeHtml(access.link)}" style="display:inline-block;background:#11756d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">${button}</a></p></div>`,
      invitationId: null,
      tag: 'candidate-update',
    });
    providerMessageId = provider.id;
  }
  const communicationId = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO candidate_communications (id, candidate_id, created_by_user_id, channel, subject_en, subject_es, message_en, message_es, visible_to_candidate, provider_message_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(communicationId, candidate.id, user.id, sendEmail ? 'email_and_portal' : 'portal', subjectEn || null, subjectEs || null, messageEn, messageEs, providerMessageId, now).run();
  await audit(env, user.email, 'candidate_communication_created', 'candidate', candidate.id, { communicationId, sendEmail, providerMessageId });
  return json({ communicationId, providerMessageId, portalLinkExpiresAt: access.expiresAt }, 201);
}

async function releaseCandidateAttempts(request, env, user, candidateId) {
  if (!isSuperAdmin(user) && user.role !== 'admin') return json({ error: 'Administrator access is required to release more attempts.', code: 'admin_required' }, 403);
  const candidate = await staffCandidate(env, user, candidateId);
  if (!candidate) return json({ error: 'Candidate not found.' }, 404);
  const body = await request.json().catch(() => ({}));
  const testId = cleanText(body.testId, 100);
  const test = await env.DB.prepare(`SELECT id FROM assessment_tests WHERE id = ?`).bind(testId).first();
  if (!test) return json({ error: 'Test not found.' }, 404);
  await testAttemptStatus(env, candidate.id, test.id, user.id);
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE candidate_test_access SET attempt_limit = attempt_limit + 3, updated_by_user_id = ?, updated_at = ? WHERE candidate_id = ? AND test_id = ?`)
    .bind(user.id, now, candidate.id, test.id).run();
  const attempts = await testAttemptStatus(env, candidate.id, test.id, user.id);
  await audit(env, user.email, 'candidate_attempts_released', 'candidate', candidate.id, { testId: test.id, added: 3, attemptLimit: attempts.limit });
  return json({ candidateId: candidate.id, testId: test.id, ...attempts });
}

async function listCandidateReferrals(env, user) {
  const where = isSuperAdmin(user) ? '1 = 1' : user.role === 'admin' ? 'r.company_id = ?' : 'c.owner_user_id = ?';
  const binding = isSuperAdmin(user) ? [] : [user.role === 'admin' ? user.companyId : user.id];
  const result = await env.DB.prepare(`
    SELECT r.*, a.name AS referrer_name, a.email AS referrer_email, c.name AS source_candidate_name,
      co.name AS company_name FROM candidate_referrals r
    JOIN candidate_accounts a ON a.id = r.referrer_account_id
    JOIN candidates c ON c.id = r.source_candidate_id JOIN companies co ON co.id = r.company_id
    WHERE ${where} ORDER BY r.created_at DESC
  `).bind(...binding).all();
  return result.results || [];
}

async function updateCandidateReferral(request, env, user, referralId) {
  const body = await request.json().catch(() => ({}));
  const status = cleanText(body.status, 30);
  if (!['submitted', 'reviewing', 'qualified', 'paid'].includes(status)) return json({ error: 'Invalid referral status.' }, 422);
  const referrals = await listCandidateReferrals(env, user);
  const referral = referrals.find((entry) => entry.id === referralId);
  if (!referral) return json({ error: 'Referral not found.' }, 404);
  await env.DB.prepare(`UPDATE candidate_referrals SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), referral.id).run();
  await audit(env, user.email, 'candidate_referral_updated', 'candidate_referral', referral.id, { status });
  return json({ referrals: await listCandidateReferrals(env, user) });
}

async function updateCandidateContact(request, env, user, candidateId) {
  const candidate = await staffCandidate(env, user, candidateId);
  if (!candidate) return json({ error: 'Candidate not found.' }, 404);
  const body = await request.json().catch(() => ({}));
  const normalized = normalizeCandidateEmail(body.email);
  if (!normalized.valid) return json({ error: 'Enter a valid email address, for example name@company.com.', code: 'invalid_email' }, 422);
  if (normalized.email === candidate.email.toLowerCase()) return json({ candidateId, email: candidate.email, changed: false, candidates: await listCandidates(env, user) });
  const conflict = await env.DB.prepare(`SELECT id FROM candidates WHERE company_id = ? AND email = ? COLLATE NOCASE AND id <> ?`)
    .bind(candidate.company_id, normalized.email, candidate.id).first();
  if (conflict) return json({ error: 'Another candidate in this company already uses that email address.', code: 'candidate_email_conflict' }, 409);
  const linkedAccount = await env.DB.prepare(`
    SELECT account.email FROM candidate_account_links link
    JOIN candidate_accounts account ON account.id = link.account_id
    WHERE link.candidate_id = ? LIMIT 1
  `).bind(candidate.id).first();
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE candidates SET email = ?, updated_at = ? WHERE id = ?`).bind(normalized.email, now, candidate.id).run();
  await audit(env, user.email, 'candidate_email_updated', 'candidate', candidate.id, {
    previousEmailHash: await sha256(candidate.email.toLowerCase()),
    newEmailHash: await sha256(normalized.email),
    linkedAccountEmailUnchanged: Boolean(linkedAccount && linkedAccount.email.toLowerCase() !== normalized.email),
  });
  return json({
    candidateId: candidate.id,
    email: normalized.email,
    changed: true,
    linkedAccountEmailUnchanged: Boolean(linkedAccount && linkedAccount.email.toLowerCase() !== normalized.email),
    candidates: await listCandidates(env, user),
  });
}

async function listCandidates(env, user) {
  const scope = candidateScope(user);
  const candidatesMissingPipeline = await env.DB.prepare(`
    SELECT c.id, c.company_id
    FROM candidates c
    LEFT JOIN candidate_pipeline pipeline ON pipeline.candidate_id = c.id
    WHERE ${scope.sql} AND pipeline.candidate_id IS NULL
  `).bind(...scope.bindings).all();
  for (const candidate of candidatesMissingPipeline.results || []) await ensureCandidatePipeline(env, candidate.id, candidate.company_id);
  const result = await env.DB.prepare(`
    WITH latest_invitation AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY candidate_id ORDER BY created_at DESC) AS row_number
      FROM invitations
    ), latest_batch_item AS (
      SELECT bi.*, b.created_at AS assignment_created_at, t.name_en AS assignment_test_name,
        ROW_NUMBER() OVER (PARTITION BY bi.candidate_id ORDER BY bi.created_at DESC, bi.rowid DESC) AS row_number
      FROM send_batch_items bi
      JOIN send_batches b ON b.id = bi.batch_id
      JOIN assessment_tests t ON t.id = bi.test_id
    ), latest_assessment AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY candidate_id ORDER BY completed_at DESC) AS row_number
      FROM assessments
    )
    SELECT c.id, c.company_id, c.owner_user_id, c.name, c.email, c.phone, c.role, c.site, c.created_at, c.updated_at,
      company.name AS company_name, owner.name AS owner_name,
      stage.id AS current_stage_id, stage.stage_key AS current_stage_key, stage.name_en AS current_stage_name_en,
      stage.name_es AS current_stage_name_es, pipeline.status_message_en, pipeline.status_message_es, pipeline.updated_at AS pipeline_updated_at,
      (SELECT COUNT(*) FROM candidate_list_members clm WHERE clm.candidate_id = c.id) AS list_count,
      i.id AS invitation_id, i.locale AS invitation_locale, i.status AS invitation_status, i.provider_message_id,
      i.test_id AS invitation_test_id, invitation_test.name_en AS invitation_test_name,
      batch_item.status AS assignment_status, batch_item.error_code AS assignment_error_code,
      batch_item.test_id AS assignment_test_id, batch_item.assignment_test_name, batch_item.assignment_created_at,
      COALESCE(access.attempt_limit, 3) AS attempt_limit,
      CASE WHEN i.test_id IS NULL THEN 0 ELSE (SELECT COUNT(*) FROM invitations used WHERE used.candidate_id = c.id AND used.test_id = i.test_id AND used.status NOT IN ('failed', 'provider_unconfirmed')) END AS attempts_used,
      i.created_at AS invitation_created_at, i.delivered_at, i.completed_at AS invitation_completed_at,
      a.id AS assessment_id, a.assessment_version, a.model_version, a.model_status, a.locale AS assessment_locale,
      a.experience_branch, a.completed_at AS assessment_completed_at, a.duration_ms, a.potential_index,
      a.potential_band, a.fit_score, a.intent_score, a.reliability_score, a.context_score,
      a.support_profile_json, a.response_quality_json, a.scoring_trace_json, a.weights_json, a.audit_hash,
      ai.status AS ai_analysis_status, ai.provider AS ai_analysis_provider, ai.model AS ai_analysis_model, ai.prompt_version AS ai_prompt_version,
      ai.provider_response_id AS ai_provider_response_id, ai.evidence_hash AS ai_evidence_hash,
      ai.output_hash AS ai_output_hash, ai.output_en_json AS ai_output_en_json, ai.output_es_json AS ai_output_es_json,
      ai.evidence_claims_json AS ai_evidence_claims_json, ai.limitations_json AS ai_limitations_json,
      ai.error_code AS ai_error_code, ai.updated_at AS ai_analysis_updated_at
    FROM candidates c
    JOIN companies company ON company.id = c.company_id
    LEFT JOIN users owner ON owner.id = c.owner_user_id
    LEFT JOIN candidate_pipeline pipeline ON pipeline.candidate_id = c.id
    LEFT JOIN recruitment_stages stage ON stage.id = pipeline.stage_id
    LEFT JOIN latest_invitation i ON i.candidate_id = c.id AND i.row_number = 1
    LEFT JOIN latest_batch_item batch_item ON batch_item.candidate_id = c.id AND batch_item.row_number = 1
    LEFT JOIN assessment_tests invitation_test ON invitation_test.id = i.test_id
    LEFT JOIN candidate_test_access access ON access.candidate_id = c.id AND access.test_id = i.test_id
    LEFT JOIN latest_assessment a ON a.candidate_id = c.id AND a.row_number = 1
    LEFT JOIN ai_analyses ai ON ai.assessment_id = a.id
    WHERE ${scope.sql}
    ORDER BY c.created_at DESC
  `).bind(...scope.bindings).all();
  const rows = (result.results || []).map((row) => {
    const assignmentIsCurrent = row.assignment_status && (!row.invitation_created_at || row.assignment_created_at > row.invitation_created_at)
      && ['queued', 'sending', 'failed'].includes(row.assignment_status);
    return {
    ...row,
    invitation_status: assignmentIsCurrent ? row.assignment_status : row.invitation_status,
    invitation_test_id: assignmentIsCurrent ? row.assignment_test_id : row.invitation_test_id,
    invitation_test_name: assignmentIsCurrent ? row.assignment_test_name : row.invitation_test_name,
    attempt_limit: Number(row.attempt_limit || 3),
    attempts_used: Number(row.attempts_used || 0),
    attempts_remaining: Math.max(0, Number(row.attempt_limit || 3) - Number(row.attempts_used || 0)),
    support_profile: row.support_profile_json ? JSON.parse(row.support_profile_json) : null,
    response_quality: row.response_quality_json ? JSON.parse(row.response_quality_json) : null,
    scoring_trace: row.scoring_trace_json ? JSON.parse(row.scoring_trace_json) : null,
    weights: row.weights_json ? JSON.parse(row.weights_json) : null,
    ai_analysis: row.ai_analysis_status ? {
      status: row.ai_analysis_status,
      provider: row.ai_analysis_provider,
      model: row.ai_analysis_model,
      prompt_version: row.ai_prompt_version,
      provider_response_id: row.ai_provider_response_id,
      evidence_hash: row.ai_evidence_hash,
      output_hash: row.ai_output_hash,
      output: row.ai_output_en_json && row.ai_output_es_json ? { en: JSON.parse(row.ai_output_en_json), es: JSON.parse(row.ai_output_es_json) } : null,
      evidence_claims: row.ai_evidence_claims_json ? JSON.parse(row.ai_evidence_claims_json) : [],
      limitations: row.ai_limitations_json ? JSON.parse(row.ai_limitations_json) : [],
      error_code: row.ai_error_code,
      updated_at: row.ai_analysis_updated_at,
    } : null,
  };
  });
  const assessmentIds = rows.map((row) => row.assessment_id).filter(Boolean);
  if (!assessmentIds.length) return rows;
  const placeholders = assessmentIds.map(() => '?').join(',');
  const scenarioResult = await env.DB.prepare(`
    SELECT sr.assessment_id, sr.response_text, sr.response_locale, sr.response_ms,
      s.id AS scenario_id, s.question_order, s.construct, s.question_en, s.question_es,
      s.evidence_item_ids_json, s.reviewer_note, s.source, s.model, s.prompt_version
    FROM assessment_scenario_responses sr
    JOIN invitation_scenarios s ON s.id = sr.scenario_id
    WHERE sr.assessment_id IN (${placeholders})
    ORDER BY sr.assessment_id, s.question_order
  `).bind(...assessmentIds).all();
  const scenarioRows = scenarioResult.results || [];
  rows.forEach((row) => {
    row.scenario_responses = scenarioRows.filter((scenario) => scenario.assessment_id === row.assessment_id).map((scenario) => ({
      ...scenario,
      database_scenario_id: scenario.scenario_id,
      scenario_id: GazelleAiAssessment.stableScenarioId(scenario.question_order),
      evidence_item_ids: JSON.parse(scenario.evidence_item_ids_json || '[]'),
    }));
  });
  return rows;
}

async function listAssessmentResults(env, user) {
  const scope = candidateScope(user);
  const result = await env.DB.prepare(`
    SELECT c.id, c.company_id, c.owner_user_id, c.name, c.email, c.role, c.site,
      company.name AS company_name, owner.name AS owner_name,
      a.id AS assessment_id, a.assessment_version, a.model_version, a.model_status, a.locale AS assessment_locale,
      a.experience_branch, a.completed_at AS assessment_completed_at, a.duration_ms, a.potential_index,
      a.potential_band, a.fit_score, a.intent_score, a.reliability_score, a.context_score,
      a.support_profile_json, a.response_quality_json, a.scoring_trace_json, a.weights_json, a.audit_hash,
      COALESCE(a.test_id, invitation.test_id) AS assessment_test_id,
      test.code AS assessment_test_code, test.name_en AS assessment_test_name_en, test.name_es AS assessment_test_name_es,
      invitation.id AS invitation_id, invitation.list_id AS source_list_id, source_list.name AS source_list_name,
      (SELECT GROUP_CONCAT(m.list_id) FROM candidate_list_members m
        JOIN candidate_lists member_list ON member_list.id = m.list_id
        WHERE m.candidate_id = c.id AND member_list.status = 'active') AS candidate_list_ids_csv,
      ai.status AS ai_analysis_status, ai.provider AS ai_analysis_provider, ai.model AS ai_analysis_model,
      ai.prompt_version AS ai_prompt_version, ai.provider_response_id AS ai_provider_response_id,
      ai.evidence_hash AS ai_evidence_hash, ai.output_hash AS ai_output_hash,
      ai.output_en_json AS ai_output_en_json, ai.output_es_json AS ai_output_es_json,
      ai.evidence_claims_json AS ai_evidence_claims_json, ai.limitations_json AS ai_limitations_json,
      ai.error_code AS ai_error_code, ai.updated_at AS ai_analysis_updated_at
    FROM assessments a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN companies company ON company.id = c.company_id
    LEFT JOIN users owner ON owner.id = c.owner_user_id
    LEFT JOIN invitations invitation ON invitation.id = a.invitation_id
    LEFT JOIN assessment_tests test ON test.id = COALESCE(a.test_id, invitation.test_id)
    LEFT JOIN candidate_lists source_list ON source_list.id = invitation.list_id AND source_list.status = 'active'
    LEFT JOIN ai_analyses ai ON ai.assessment_id = a.id
    WHERE ${scope.sql}
    ORDER BY a.completed_at DESC
  `).bind(...scope.bindings).all();
  const rows = (result.results || []).map((row) => ({
    ...row,
    candidate_list_ids: row.candidate_list_ids_csv ? row.candidate_list_ids_csv.split(',') : [],
    support_profile: row.support_profile_json ? JSON.parse(row.support_profile_json) : null,
    response_quality: row.response_quality_json ? JSON.parse(row.response_quality_json) : null,
    scoring_trace: row.scoring_trace_json ? JSON.parse(row.scoring_trace_json) : null,
    weights: row.weights_json ? JSON.parse(row.weights_json) : null,
    ai_analysis: row.ai_analysis_status ? {
      status: row.ai_analysis_status,
      provider: row.ai_analysis_provider,
      model: row.ai_analysis_model,
      prompt_version: row.ai_prompt_version,
      provider_response_id: row.ai_provider_response_id,
      evidence_hash: row.ai_evidence_hash,
      output_hash: row.ai_output_hash,
      output: row.ai_output_en_json && row.ai_output_es_json ? { en: JSON.parse(row.ai_output_en_json), es: JSON.parse(row.ai_output_es_json) } : null,
      evidence_claims: row.ai_evidence_claims_json ? JSON.parse(row.ai_evidence_claims_json) : [],
      limitations: row.ai_limitations_json ? JSON.parse(row.ai_limitations_json) : [],
      error_code: row.ai_error_code,
      updated_at: row.ai_analysis_updated_at,
    } : null,
  }));
  if (!rows.length) return rows;
  const scenarioResult = await env.DB.prepare(`
    SELECT sr.assessment_id, sr.response_text, sr.response_locale, sr.response_ms,
      s.id AS scenario_id, s.question_order, s.construct, s.question_en, s.question_es,
      s.evidence_item_ids_json, s.reviewer_note, s.source, s.model, s.prompt_version
    FROM assessment_scenario_responses sr
    JOIN invitation_scenarios s ON s.id = sr.scenario_id
    JOIN assessments scenario_assessment ON scenario_assessment.id = sr.assessment_id
    JOIN candidates c ON c.id = scenario_assessment.candidate_id
    WHERE ${scope.sql}
    ORDER BY sr.assessment_id, s.question_order
  `).bind(...scope.bindings).all();
  const scenarioRows = scenarioResult.results || [];
  rows.forEach((row) => {
    row.scenario_responses = scenarioRows.filter((scenario) => scenario.assessment_id === row.assessment_id).map((scenario) => ({
      ...scenario,
      database_scenario_id: scenario.scenario_id,
      scenario_id: GazelleAiAssessment.stableScenarioId(scenario.question_order),
      evidence_item_ids: JSON.parse(scenario.evidence_item_ids_json || '[]'),
    }));
  });
  return rows;
}

const OUTCOME_TYPES = new Set(['not_hired', 'hired', 'started', 'checkpoint', 'exit', 'performance_review']);

function cleanOutcomeType(value) {
  const normalized = cleanText(value, 40).toLowerCase();
  return OUTCOME_TYPES.has(normalized) ? normalized : '';
}

function optionalInteger(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

function optionalBooleanInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function scoreBucket(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return 'unknown';
  if (numeric >= 80) return 'strong';
  if (numeric >= 65) return 'aligned';
  if (numeric >= 50) return 'conditional';
  return 'limited';
}

function buildCalibrationSummaries(assessments = [], outcomes = []) {
  const byAssessment = new Map();
  for (const outcome of outcomes) {
    const list = byAssessment.get(outcome.assessment_id) || [];
    list.push(outcome);
    byAssessment.set(outcome.assessment_id, list);
  }
  const summaries = new Map();
  for (const assessment of assessments) {
    const key = assessment.assessment_test_id || assessment.test_id || 'unknown';
    if (!summaries.has(key)) summaries.set(key, {
      test_id: key,
      test_name_en: assessment.assessment_test_name_en || 'Assessment',
      test_name_es: assessment.assessment_test_name_es || assessment.assessment_test_name_en || 'Evaluacion',
      completed_assessments: 0,
      outcomes_recorded: 0,
      hired_count: 0,
      started_count: 0,
      known_tenure_count: 0,
      retained_30_count: 0,
      retained_90_count: 0,
      retained_180_count: 0,
      exit_count: 0,
      performance_count: 0,
      performance_sum: 0,
      tenure_sum: 0,
      high_score_known_count: 0,
      high_score_retained_90_count: 0,
      lower_score_known_count: 0,
      lower_score_retained_90_count: 0,
      score_buckets: { strong: 0, aligned: 0, conditional: 0, limited: 0, unknown: 0 },
    });
    const summary = summaries.get(key);
    summary.completed_assessments += 1;
    summary.score_buckets[scoreBucket(assessment.potential_index)] += 1;
    const assessmentOutcomes = byAssessment.get(assessment.assessment_id) || [];
    if (!assessmentOutcomes.length) continue;
    summary.outcomes_recorded += assessmentOutcomes.length;
    const hired = assessmentOutcomes.some((outcome) => Number(outcome.hired) === 1 || ['hired', 'started', 'checkpoint', 'exit', 'performance_review'].includes(outcome.outcome_type));
    const started = assessmentOutcomes.some((outcome) => Number(outcome.started) === 1 || ['started', 'checkpoint', 'exit', 'performance_review'].includes(outcome.outcome_type));
    const exited = assessmentOutcomes.some((outcome) => outcome.outcome_type === 'exit' || Number(outcome.still_employed) === 0);
    const tenureValues = assessmentOutcomes.map((outcome) => Number(outcome.tenure_days)).filter(Number.isFinite);
    const maxTenure = tenureValues.length ? Math.max(...tenureValues) : null;
    const retainedAt = (days) => maxTenure != null && maxTenure >= days;
    if (hired) summary.hired_count += 1;
    if (started) summary.started_count += 1;
    if (exited) summary.exit_count += 1;
    if (maxTenure != null) {
      summary.known_tenure_count += 1;
      summary.tenure_sum += maxTenure;
      if (retainedAt(30)) summary.retained_30_count += 1;
      if (retainedAt(90)) summary.retained_90_count += 1;
      if (retainedAt(180)) summary.retained_180_count += 1;
      if (Number(assessment.potential_index) >= 65) {
        summary.high_score_known_count += 1;
        if (retainedAt(90)) summary.high_score_retained_90_count += 1;
      } else {
        summary.lower_score_known_count += 1;
        if (retainedAt(90)) summary.lower_score_retained_90_count += 1;
      }
    }
    for (const outcome of assessmentOutcomes) {
      const rating = Number(outcome.performance_rating);
      if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        summary.performance_count += 1;
        summary.performance_sum += rating;
      }
    }
  }
  return [...summaries.values()].map((summary) => {
    const tenureRate = (count) => summary.known_tenure_count ? Math.round((count / summary.known_tenure_count) * 1000) / 10 : null;
    const highRate = summary.high_score_known_count ? Math.round((summary.high_score_retained_90_count / summary.high_score_known_count) * 1000) / 10 : null;
    const lowerRate = summary.lower_score_known_count ? Math.round((summary.lower_score_retained_90_count / summary.lower_score_known_count) * 1000) / 10 : null;
    const knownRate = summary.completed_assessments ? Math.round((summary.known_tenure_count / summary.completed_assessments) * 1000) / 10 : 0;
    return {
      ...summary,
      outcome_coverage_rate: knownRate,
      retained_30_rate: tenureRate(summary.retained_30_count),
      retained_90_rate: tenureRate(summary.retained_90_count),
      retained_180_rate: tenureRate(summary.retained_180_count),
      average_tenure_days: summary.known_tenure_count ? Math.round(summary.tenure_sum / summary.known_tenure_count) : null,
      average_performance_rating: summary.performance_count ? Math.round((summary.performance_sum / summary.performance_count) * 10) / 10 : null,
      high_score_retained_90_rate: highRate,
      lower_score_retained_90_rate: lowerRate,
      score_lift_90: highRate != null && lowerRate != null ? Math.round((highRate - lowerRate) * 10) / 10 : null,
      validation_status: summary.known_tenure_count >= 100 ? 'calibration_ready' : summary.known_tenure_count >= 30 ? 'directional' : 'learning_sample',
    };
  }).sort((left, right) => right.completed_assessments - left.completed_assessments);
}

async function assessmentOutcomeDataset(env, user) {
  const scope = candidateScope(user);
  const assessmentRows = await env.DB.prepare(`
    SELECT a.id AS assessment_id, a.test_id AS assessment_test_id, a.completed_at AS assessment_completed_at,
      a.potential_index, a.potential_band, c.id AS candidate_id, c.company_id, c.owner_user_id, c.name AS candidate_name,
      c.email AS candidate_email, c.role, c.site, company.name AS company_name,
      t.name_en AS assessment_test_name_en, t.name_es AS assessment_test_name_es
    FROM assessments a
    JOIN candidates c ON c.id = a.candidate_id
    JOIN companies company ON company.id = c.company_id
    LEFT JOIN assessment_tests t ON t.id = a.test_id
    WHERE ${scope.sql}
    ORDER BY a.completed_at DESC
  `).bind(...scope.bindings).all();
  const outcomeRows = await env.DB.prepare(`
    SELECT o.*, c.name AS candidate_name, c.email AS candidate_email, c.role, c.site,
      company.name AS company_name, t.name_en AS test_name_en, t.name_es AS test_name_es,
      a.potential_index, a.potential_band, recorder.name AS recorded_by_name
    FROM assessment_outcomes o
    JOIN candidates c ON c.id = o.candidate_id
    JOIN companies company ON company.id = o.company_id
    LEFT JOIN assessment_tests t ON t.id = o.test_id
    LEFT JOIN assessments a ON a.id = o.assessment_id
    LEFT JOIN users recorder ON recorder.id = o.recorded_by_user_id
    WHERE ${scope.sql}
    ORDER BY o.outcome_date DESC, o.created_at DESC
    LIMIT 500
  `).bind(...scope.bindings).all();
  const assessments = assessmentRows.results || [];
  const outcomes = outcomeRows.results || [];
  return { assessments, outcomes, summaries: buildCalibrationSummaries(assessments, outcomes) };
}

async function listAssessmentOutcomes(env, user) {
  return assessmentOutcomeDataset(env, user);
}

async function recordAssessmentOutcome(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const assessmentId = cleanText(body.assessmentId, 100);
  const outcomeType = cleanOutcomeType(body.outcomeType);
  const outcomeDate = cleanText(body.outcomeDate, 40) || new Date().toISOString().slice(0, 10);
  const tenureDays = optionalInteger(body.tenureDays, 0, 5000);
  const performanceRating = optionalInteger(body.performanceRating, 1, 5);
  const hired = optionalBooleanInteger(body.hired);
  const started = optionalBooleanInteger(body.started);
  const stillEmployed = optionalBooleanInteger(body.stillEmployed);
  const source = cleanText(body.source || 'manual', 80);
  const notes = cleanText(body.notes, 1200);
  if (!assessmentId || !outcomeType) return json({ error: 'Assessment and outcome type are required.', code: 'outcome_required' }, 422);
  if (!/^\d{4}-\d{2}-\d{2}/.test(outcomeDate)) return json({ error: 'Use a valid outcome date.', code: 'invalid_outcome_date' }, 422);
  const scope = candidateScope(user);
  const assessment = await env.DB.prepare(`
    SELECT a.id AS assessment_id, a.test_id, c.id AS candidate_id, c.company_id
    FROM assessments a JOIN candidates c ON c.id = a.candidate_id
    WHERE a.id = ? AND ${scope.sql}
  `).bind(assessmentId, ...scope.bindings).first();
  if (!assessment) return json({ error: 'Assessment not found in your accessible scope.', code: 'assessment_not_found' }, 404);
  if (['checkpoint', 'exit'].includes(outcomeType) && tenureDays == null) return json({ error: 'Tenure days are required for checkpoint or exit outcomes.', code: 'tenure_required' }, 422);
  if (outcomeType === 'performance_review' && performanceRating == null) return json({ error: 'Performance rating 1-5 is required for performance review outcomes.', code: 'performance_required' }, 422);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO assessment_outcomes (id, assessment_id, candidate_id, company_id, test_id, outcome_type, outcome_date, tenure_days, performance_rating, hired, started, still_employed, source, notes, recorded_by_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, assessment.assessment_id, assessment.candidate_id, assessment.company_id, assessment.test_id || 'test_tenure_potential', outcomeType, outcomeDate, tenureDays, performanceRating, hired, started, stillEmployed, source, notes, user.id, now, now).run();
  await audit(env, user.email, 'assessment_outcome_recorded', 'assessment_outcome', id, { assessmentId, outcomeType, tenureDays, performanceRating, source });
  return json(await listAssessmentOutcomes(env, user), 201);
}

async function importCandidates(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 500) : [];
  if (!candidates.length) return json({ error: 'No valid candidate rows supplied.' }, 400);
  const listId = cleanText(body.listId, 100);
  const list = listId ? await visibleList(env, user, listId) : null;
  if (listId && !list) return json({ error: 'The selected candidate list is not available to your account.', code: 'list_not_found' }, 404);
  const companyId = isSuperAdmin(user) ? list?.company_id || cleanText(body.companyId, 100) || user.companyId : user.companyId;
  if (!companyId) return json({ error: 'A company is required before importing candidates.' }, 422);
  if (list && list.company_id !== companyId) return json({ error: 'The selected list belongs to a different company.', code: 'list_company_mismatch' }, 422);
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.' }, 404);
  const defaultRole = cleanText(body.defaultRole, 140);
  const defaultSite = cleanText(body.defaultSite, 120);
  const now = new Date().toISOString();
  const statements = [];
  const acceptedEmails = [];
  const invalidRows = [];
  const correctedRows = [];
  let accepted = 0;
  for (let index = 0; index < candidates.length; index += 1) {
    const input = candidates[index];
    const normalizedEmail = normalizeCandidateEmail(input.email);
    const email = normalizedEmail.email;
    const name = cleanText(input.name, 140);
    const role = cleanText(input.role, 140) || defaultRole;
    const site = cleanText(input.site, 120) || defaultSite;
    const missing = [!name && 'name', !email && 'valid email', !role && 'role'].filter(Boolean);
    if (missing.length) { invalidRows.push({ row: index + 2, missing }); continue; }
    if (normalizedEmail.corrected) correctedRows.push({ row: index + 2, from: normalizedEmail.original, to: email });
    accepted += 1;
    acceptedEmails.push(email);
    statements.push(env.DB.prepare(`
      INSERT INTO candidates (id, company_id, owner_user_id, email, name, phone, role, site, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company_id, email) DO UPDATE SET name = excluded.name, phone = excluded.phone, role = excluded.role, site = excluded.site,
        owner_user_id = CASE WHEN candidates.owner_user_id IS NULL THEN excluded.owner_user_id ELSE candidates.owner_user_id END,
        updated_at = excluded.updated_at
    `).bind(crypto.randomUUID(), companyId, user.id, email, name, cleanText(input.phone, 40), role, site, now, now));
  }
  if (!statements.length) return json({ error: 'No rows are ready to import. Map name and email, then provide either a role column or a default role.', code: 'no_valid_import_rows', invalidRows }, 422);
  await env.DB.batch(statements);
  const imported = await env.DB.prepare(`SELECT id, email FROM candidates WHERE company_id = ? AND email IN (${acceptedEmails.map(() => '?').join(',')})`).bind(companyId, ...acceptedEmails).all();
  let addedToList = 0;
  if (list && (imported.results || []).length) {
    const additions = imported.results.map((candidate) => env.DB.prepare(`INSERT OR IGNORE INTO candidate_list_members (list_id, candidate_id, added_by_user_id, added_at) VALUES (?, ?, ?, ?)`)
      .bind(list.id, candidate.id, user.id, now));
    const results = await env.DB.batch(additions);
    addedToList = results.reduce((sum, result) => sum + Number(result.meta?.changes || 0), 0);
    await env.DB.prepare(`UPDATE candidate_lists SET updated_at = ? WHERE id = ?`).bind(now, list.id).run();
  }
  await audit(env, user.email, 'candidates_imported', 'candidate_batch', crypto.randomUUID(), { accepted, skipped: invalidRows.length, corrected: correctedRows.length, companyId, listId: list?.id || null, addedToList });
  return json({ accepted, skipped: invalidRows.length, invalidRows, correctedRows, addedToList, candidates: await listCandidates(env, user), lists: await listCandidateLists(env, user) }, 201);
}

async function sendInvitationForCandidate({ env, user, candidate, test, locale, origin, listId = null, batchId = null, idempotencyKey = null, channel = 'email', step = null }) {
  const deliveryChannel = ['email', 'whatsapp', 'sms'].includes(channel) ? channel : 'email';
  const recipientEmail = cleanEmail(candidate.email);
  const contact = contactabilityConfig(env);
  const recipientPhone = normalizeContactPhone(candidate.phone, contact.defaultCountryCode);
  if (deliveryChannel === 'email' && !recipientEmail) {
    const error = new Error('invalid_email');
    error.providerStatus = 422;
    error.providerMessage = 'The candidate email address is invalid. Correct it before sending.';
    throw error;
  }
  if (deliveryChannel !== 'email' && !recipientPhone.valid) {
    const error = new Error('invalid_phone');
    error.providerStatus = 422;
    error.providerMessage = 'The candidate phone number is invalid or missing. Add a country code or a valid local mobile number before sending.';
    throw error;
  }
  const attempts = await testAttemptStatus(env, candidate.id, test.id, user.id);
  await ensureCandidatePipeline(env, candidate.id, candidate.company_id);
  const company = await env.DB.prepare(`SELECT COALESCE(candidate_brand_name, name) AS candidate_brand_name FROM companies WHERE id = ?`).bind(candidate.company_id).first();
  candidate.candidate_brand_name = company?.candidate_brand_name || 'Allied Global';
  const now = new Date();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const invitationId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const reserved = await env.DB.prepare(`
    INSERT INTO invitations (id, candidate_id, token_hash, locale, status, created_by, created_at, expires_at, company_id, test_id, list_id, batch_id, created_by_user_id)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    FROM candidate_test_access access
    WHERE access.candidate_id = ? AND access.test_id = ?
      AND (SELECT COUNT(*) FROM invitations used WHERE used.candidate_id = access.candidate_id AND used.test_id = access.test_id AND used.status NOT IN ('failed', 'provider_unconfirmed')) < access.attempt_limit
  `).bind(invitationId, candidate.id, tokenHash, locale, 'sending', user.email, now.toISOString(), expiresAt, candidate.company_id, test.id, listId, batchId, user.id, candidate.id, test.id).run();
  if (!Number(reserved.meta?.changes || 0)) {
    const error = new Error('attempt_limit_reached');
    error.providerStatus = 409;
    error.providerMessage = 'This candidate has used all released attempts for this test. An administrator must release three more.';
    throw error;
  }
  const link = `${origin}/candidate?invite=${encodeURIComponent(token)}`;
  const copy = invitationCopy(candidate, locale, link);
  const messageText = templateInvitationMessage(candidate, locale, link, step);
  try {
    const provider = deliveryChannel === 'email'
      ? await sendBrevo(env, { to: recipientEmail, toName: candidate.name, ...copy, invitationId, idempotencyKey, tag: test.slug })
      : deliveryChannel === 'sms'
        ? await sendSms(env, { toPhone: recipientPhone.phone, text: messageText, invitationId, idempotencyKey, tag: test.slug })
        : await sendWhatsApp(env, { toPhone: recipientPhone.phone, text: messageText, link, buttonToken: token, candidate, templateName: step?.brevo_template_id, templateId: step?.brevo_template_id, invitationId, idempotencyKey, tag: test.slug });
    await env.DB.prepare(`UPDATE invitations SET status = ?, provider_message_id = ? WHERE id = ?`).bind('accepted', provider.id, invitationId).run();
    await audit(env, user.email, 'invitation_accepted_by_provider', 'invitation', invitationId, { providerMessageId: provider.id, locale, channel: deliveryChannel, testId: test.id, listId, batchId });
    return { invitationId, status: 'accepted', providerMessageId: provider.id, transport: provider.transport, channel: deliveryChannel, expiresAt, attempts: { limit: attempts.limit, used: attempts.used + 1, remaining: attempts.remaining - 1 } };
  } catch (error) {
    await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).bind('failed', invitationId).run();
    await audit(env, user.email, 'invitation_failed', 'invitation', invitationId, { code: error.message, providerStatus: error.providerStatus || null, channel: deliveryChannel, testId: test.id, listId, batchId });
    error.invitationId = invitationId;
    throw error;
  }
}

async function executableTest(env, testId) {
  const test = await env.DB.prepare(`SELECT * FROM assessment_tests WHERE id = ? AND status = 'active'`).bind(testId || 'test_tenure_potential').first();
  return test?.engine_key === 'tenure_potential' ? test : null;
}

async function createInvitation(request, env, user) {
  const body = await request.json().catch(() => ({}));
  if (!emailConfig(env).configured) return json({ error: 'Brevo transactional email is not fully configured.', code: 'email_not_configured' }, 503);
  const test = await executableTest(env, cleanText(body.testId, 100) || 'test_tenure_potential');
  if (!test) return json({ error: 'This test is not active or does not have an executable engine.', code: 'test_not_executable' }, 422);
  let candidate;
  const candidateId = cleanText(body.candidateId, 100);
  if (candidateId) {
    const scope = candidateScope(user);
    candidate = await env.DB.prepare(`SELECT c.* FROM candidates c WHERE c.id = ? AND ${scope.sql}`).bind(candidateId, ...scope.bindings).first();
    if (!candidate) return json({ error: 'Candidate not found.' }, 404);
  } else {
    const input = body.candidate || {};
    const normalizedEmail = normalizeCandidateEmail(input.email);
    const email = normalizedEmail.email;
    const name = cleanText(input.name, 140);
    const role = cleanText(input.role, 140);
    const companyId = isSuperAdmin(user) ? cleanText(body.companyId, 100) || user.companyId : user.companyId;
    if (!email || !name || !role || !companyId) return json({ error: 'A valid candidate name, email, role, and company are required.', code: !email ? 'invalid_email' : 'invalid_candidate' }, 422);
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO candidates (id, company_id, owner_user_id, email, name, phone, role, site, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(company_id, email) DO UPDATE SET name = excluded.name, phone = excluded.phone, role = excluded.role, site = excluded.site, updated_at = excluded.updated_at
    `).bind(crypto.randomUUID(), companyId, user.id, email, name, cleanText(input.phone, 40), role, cleanText(input.site, 120), now, now).run();
    candidate = await env.DB.prepare(`SELECT * FROM candidates WHERE company_id = ? AND email = ? COLLATE NOCASE`).bind(companyId, email).first();
  }
  const locale = body.locale === 'es' ? 'es' : 'en';
  const origin = cleanText(env.APP_BASE_URL, 500) || new URL(request.url).origin;
  try {
    return json(await sendInvitationForCandidate({ env, user, candidate, test, locale, origin }), 201);
  } catch (error) {
    return json({ error: error.providerMessage || 'The email provider did not accept the message.', code: error.message }, error.providerStatus || 502);
  }
}

async function createBulkResend(request, env, user, context) {
  if (!emailConfig(env).configured) return json({ error: 'Brevo transactional email is not fully configured.', code: 'email_not_configured' }, 503);
  const body = await request.json().catch(() => ({}));
  const rawCandidateIds = Array.isArray(body.candidateIds) ? body.candidateIds.map((id) => cleanText(id, 100)).filter(Boolean) : [];
  const candidateIds = [...new Set(rawCandidateIds)];
  if (!candidateIds.length) return json({ error: 'Select at least one candidate to resend the test.' }, 422);
  if (candidateIds.length > 500) return json({ error: 'A bulk resend can contain at most 500 candidates.' }, 422);
  const test = await executableTest(env, cleanText(body.testId, 100));
  if (!test) return json({ error: 'This test is not active or does not have an executable engine.', code: 'test_not_executable' }, 422);
  const scope = candidateScope(user);
  const candidates = await env.DB.prepare(`
    SELECT c.id, c.company_id, c.name,
      (SELECT i.locale FROM invitations i WHERE i.candidate_id = c.id AND i.test_id = ? AND i.status <> 'failed' ORDER BY i.created_at DESC LIMIT 1) AS previous_locale,
      (SELECT COUNT(*) FROM invitations used WHERE used.candidate_id = c.id AND used.test_id = ? AND used.status NOT IN ('failed', 'provider_unconfirmed')) AS attempts_used,
      COALESCE((SELECT access.attempt_limit FROM candidate_test_access access WHERE access.candidate_id = c.id AND access.test_id = ?), 3) AS attempt_limit
    FROM candidates c WHERE c.id IN (${candidateIds.map(() => '?').join(',')}) AND ${scope.sql}
    ORDER BY c.company_id, c.name
  `).bind(test.id, test.id, test.id, ...candidateIds, ...scope.bindings).all();
  const rows = candidates.results || [];
  if (rows.length !== candidateIds.length) return json({ error: 'One or more selected candidates are outside your access scope.', code: 'candidate_scope_mismatch' }, 403);
  const withoutPrevious = rows.filter((candidate) => !candidate.previous_locale);
  if (withoutPrevious.length) return json({ error: `${withoutPrevious.length} selected candidate${withoutPrevious.length === 1 ? ' has' : 's have'} not received this test before. Use Direct send for a first invitation.`, code: 'previous_invitation_required' }, 422);
  const withoutAttempts = rows.filter((candidate) => Number(candidate.attempts_used || 0) >= Number(candidate.attempt_limit || 3));
  if (withoutAttempts.length) return json({ error: `${withoutAttempts.length} selected candidate${withoutAttempts.length === 1 ? ' has' : 's have'} no attempts remaining. An administrator must release three more before resending.`, code: 'attempt_limit_reached' }, 409);

  const requestedLocale = ['en', 'es'].includes(body.locale) ? body.locale : 'previous';
  const groups = new Map();
  rows.forEach((candidate) => {
    const locale = requestedLocale === 'previous' ? (candidate.previous_locale === 'es' ? 'es' : 'en') : requestedLocale;
    const key = `${candidate.company_id}:${locale}`;
    if (!groups.has(key)) groups.set(key, { companyId: candidate.company_id, locale, candidates: [] });
    groups.get(key).candidates.push(candidate);
  });

  const now = new Date().toISOString();
  const requestId = crypto.randomUUID();
  const batches = [];
  const statements = [];
  for (const group of groups.values()) {
    const listId = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const listName = `Bulk resend - ${test.name_en} - ${now.slice(0, 16).replace('T', ' ')}`;
    statements.push(env.DB.prepare(`INSERT INTO candidate_lists (id, company_id, owner_user_id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'archived', ?, ?)`)
      .bind(listId, group.companyId, user.id, listName, 'System tracking list for a bulk resend from the Candidates area.', now, now));
    statements.push(env.DB.prepare(`INSERT INTO candidate_list_tests (list_id, test_id, added_by_user_id, added_at) VALUES (?, ?, ?, ?)`)
      .bind(listId, test.id, user.id, now));
    statements.push(env.DB.prepare(`INSERT INTO send_batches (id, company_id, list_id, created_by_user_id, locale, status, total_count, queued_count, accepted_count, failed_count, created_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, 0, 0, ?)`)
      .bind(batchId, group.companyId, listId, user.id, group.locale, group.candidates.length, group.candidates.length, now));
    group.candidates.forEach((candidate) => {
      statements.push(env.DB.prepare(`INSERT INTO candidate_list_members (list_id, candidate_id, added_by_user_id, added_at) VALUES (?, ?, ?, ?)`)
        .bind(listId, candidate.id, user.id, now));
      statements.push(env.DB.prepare(`INSERT INTO send_batch_items (id, batch_id, candidate_id, test_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'queued', ?, ?)`)
        .bind(crypto.randomUUID(), batchId, candidate.id, test.id, now, now));
    });
    batches.push({ batchId, listId, total: group.candidates.length });
  }
  await env.DB.batch(statements);
  await audit(env, user.email, 'bulk_resend_queued', 'bulk_resend', requestId, { testId: test.id, candidateCount: rows.length, batchIds: batches.map((batch) => batch.batchId), locale: requestedLocale });
  const origin = cleanText(env.APP_BASE_URL, 500) || new URL(request.url).origin;
  const work = Promise.allSettled(batches.map((batch) => processSendBatch(env, user, batch.batchId, origin)));
  if (context?.waitUntil) context.waitUntil(work);
  else work.catch(() => {});
  return json({ requestId, batchIds: batches.map((batch) => batch.batchId), batchCount: batches.length, total: rows.length, status: 'queued' }, 202);
}

async function getInvitation(request, env) {
  const token = cleanText(new URL(request.url).searchParams.get('token'), 200);
  if (!token) return json({ error: 'Invitation token is required.' }, 400);
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT i.id AS invitation_id, i.locale, i.status, i.expires_at, i.test_id,
      c.id AS candidate_id, c.name, c.role, c.site, t.name_en AS test_name_en, t.name_es AS test_name_es, t.engine_key
    FROM invitations i JOIN candidates c ON c.id = i.candidate_id
    JOIN assessment_tests t ON t.id = i.test_id WHERE i.token_hash = ?
  `).bind(tokenHash).first();
  if (!row) return json({ error: 'Invitation not found.' }, 404);
  if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: 'This invitation has expired.', code: 'expired' }, 410);
  if (row.status === 'completed') return json({ error: 'This assessment has already been completed.', code: 'completed' }, 409);
  if (row.engine_key !== 'tenure_potential') return json({ error: 'This assessment engine is not available.', code: 'test_not_executable' }, 422);
  return json({
    invitationId: row.invitation_id,
    candidate: { id: row.candidate_id, name: row.name, role: row.role, site: row.site },
    suggestedLocale: row.locale,
    assessmentVersion: GazelleAssessmentEngine.ASSESSMENT_VERSION,
    test: { id: row.test_id, name_en: row.test_name_en, name_es: row.test_name_es, engineKey: row.engine_key },
    roleConditions: {
      en: ['Published work schedule and attendance expectations', 'Back-to-back customer conversations', 'Quality and productivity targets'],
      es: ['Horario de trabajo informado y expectativas de asistencia', 'Conversaciones consecutivas con clientes', 'Metas de calidad y productividad'],
    },
  });
}

async function invitationFromToken(env, token) {
  const tokenHash = await sha256(token);
  return env.DB.prepare(`
    SELECT i.*, c.name, c.role, c.site
    FROM invitations i JOIN candidates c ON c.id = i.candidate_id
    WHERE i.token_hash = ?
  `).bind(tokenHash).first();
}

function candidateScenarioShape(row) {
  return {
    scenarioId: row.id,
    order: Number(row.question_order),
    construct: row.construct,
    question_en: row.question_en,
    question_es: row.question_es,
    source: row.source,
  };
}

async function scenarioRowsForInvitation(env, invitationId) {
  const result = await env.DB.prepare(`SELECT * FROM invitation_scenarios WHERE invitation_id = ? ORDER BY question_order`).bind(invitationId).all();
  return result.results || [];
}

async function createScenarioQuestions(request, env) {
  const body = await request.json().catch(() => ({}));
  const token = cleanText(body.token, 200);
  if (!token) return json({ error: 'Invitation token is required.' }, 400);
  const invitation = await invitationFromToken(env, token);
  if (!invitation) return json({ error: 'Invitation not found.' }, 404);
  if (invitation.status === 'completed') return json({ error: 'This assessment has already been completed.' }, 409);
  if (new Date(invitation.expires_at).getTime() < Date.now()) return json({ error: 'This invitation has expired.' }, 410);
  if (!['experienced', 'new'].includes(body.experienceBranch)) return json({ error: 'A valid experience branch is required.' }, 422);

  const existing = await scenarioRowsForInvitation(env, invitation.id);
  if (existing.length === 3) return json({ questions: existing.map(candidateScenarioShape), reused: true });

  const result = GazelleAssessmentEngine.scoreAssessment({
    answers: body.answers,
    responseTimes: body.responseTimes,
    experienceBranch: body.experienceBranch,
  });
  if (result.potentialIndex == null) return json({ error: 'Complete the assessment items before the scenario questions.', missingItemIds: result.missingItemIds }, 422);

  const evidence = {
    assessmentVersion: result.assessmentVersion,
    modelStatus: result.modelStatus,
    role: invitation.role,
    experienceBranch: result.experienceBranch,
    potentialIndex: result.potentialIndex,
    subscales: result.subscales,
    quality: result.quality,
    itemEvidence: result.scoringTrace.map((entry) => {
      const definition = GazelleAssessmentEngine.ITEMS.find((item) => item.id === entry.itemId);
      return { itemId: entry.itemId, dimension: entry.dimension, rawResponse: entry.rawResponse, transformedResponse: entry.transformedResponse, text: definition?.text || null };
    }),
  };

  let questions;
  let source = 'deterministic_fallback';
  let model = 'rules-v1';
  let providerResponseId = null;
  try {
    const ai = await callAiJson(env, {
      instructions: GazelleAiAssessment.SCENARIO_INSTRUCTIONS,
      input: evidence,
      schema: GazelleAiAssessment.scenarioSchema,
      schemaName: 'tenure_potential_scenarios',
      safetyIdentifier: `invitation_${invitation.id}`,
      maxOutputTokens: 3200,
      reasoningEffort: 'low',
    });
    const candidateQuestions = ai.data?.questions;
    const itemIds = new Set(result.scoringTrace.map((entry) => entry.itemId));
    if (!validateScenarioOutput(candidateQuestions, itemIds)) throw new Error('ai_invalid_scenarios');
    questions = candidateQuestions.sort((a, b) => a.id.localeCompare(b.id));
    source = ai.provider === 'Google Gemini' ? 'google_gemini' : 'openai';
    model = ai.model;
    providerResponseId = ai.responseId;
  } catch (error) {
    questions = GazelleAiAssessment.fallbackScenarios(result);
    await audit(env, null, 'scenario_generation_fallback', 'invitation', invitation.id, { errorCode: cleanText(error.message, 100) });
  }

  const now = new Date().toISOString();
  const statements = questions.map((question, index) => env.DB.prepare(`
    INSERT OR IGNORE INTO invitation_scenarios
      (id, invitation_id, question_order, construct, question_en, question_es, evidence_item_ids_json, reviewer_note, source, model, prompt_version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(), invitation.id, index + 1, cleanText(question.construct, 80), cleanText(question.question_en, 1600),
    cleanText(question.question_es, 1600), JSON.stringify((question.evidence_item_ids || []).slice(0, 4)), cleanText(question.reviewer_note, 800),
    source, model, GazelleAiAssessment.SCENARIO_PROMPT_VERSION, now,
  ));
  await env.DB.batch(statements);
  const stored = await scenarioRowsForInvitation(env, invitation.id);
  await audit(env, null, 'scenario_questions_generated', 'invitation', invitation.id, {
    source, model, providerResponseId, promptVersion: GazelleAiAssessment.SCENARIO_PROMPT_VERSION, questionCount: stored.length,
  });
  return json({ questions: stored.map(candidateScenarioShape), reused: false }, 201);
}

async function aiEvidenceForAssessment(env, assessmentId) {
  const assessment = await env.DB.prepare(`
    SELECT a.*, c.role, c.site
    FROM assessments a JOIN candidates c ON c.id = a.candidate_id
    WHERE a.id = ?
  `).bind(assessmentId).first();
  if (!assessment) return null;
  const scenarioResult = await env.DB.prepare(`
    SELECT s.id, s.question_order, s.construct, s.question_en, s.question_es, s.evidence_item_ids_json,
      sr.response_text, sr.response_locale, sr.response_ms
    FROM assessment_scenario_responses sr
    JOIN invitation_scenarios s ON s.id = sr.scenario_id
    WHERE sr.assessment_id = ? ORDER BY s.question_order
  `).bind(assessmentId).all();
  return {
    assessmentId,
    assessmentVersion: assessment.assessment_version,
    scoringModel: assessment.model_version,
    modelStatus: assessment.model_status,
    role: assessment.role,
    experienceBranch: assessment.experience_branch,
    completedAt: assessment.completed_at,
    durationMs: assessment.duration_ms,
    potentialIndex: assessment.potential_index,
    potentialBand: assessment.potential_band,
    subscales: {
      fit: assessment.fit_score,
      intent: assessment.intent_score,
      reliability: assessment.reliability_score,
      context: assessment.context_score,
    },
    supportProfile: JSON.parse(assessment.support_profile_json || '[]'),
    responseQuality: JSON.parse(assessment.response_quality_json || '{}'),
    scoringTrace: JSON.parse(assessment.scoring_trace_json || '[]'),
    weights: JSON.parse(assessment.weights_json || '{}'),
    scenarios: (scenarioResult.results || []).map((row) => {
      const redacted = redactAiEvidence(row.response_text);
      return {
        scenarioId: GazelleAiAssessment.stableScenarioId(row.question_order),
        order: row.question_order,
        construct: row.construct,
        question_en: row.question_en,
        question_es: row.question_es,
        evidence_item_ids: JSON.parse(row.evidence_item_ids_json || '[]'),
        candidate_response: redacted.text,
        sensitive_details_omitted: redacted.redacted,
        response_locale: row.response_locale,
        response_ms: row.response_ms,
      };
    }),
  };
}

function recruiterModelEvidence(evidence) {
  const assessmentVersion = evidence.assessmentVersion || GazelleAssessmentEngine.ASSESSMENT_VERSION;
  const scoringTrace = (evidence.scoringTrace || []).map((entry) => {
    const definition = GazelleAssessmentEngine.itemDefinition(entry.itemId, assessmentVersion);
    const responseIndex = Number(entry.rawResponse) - 1;
    return {
      ...entry,
      item_text_en: definition?.text?.en || '',
      item_text_es: definition?.text?.es || '',
      response_label_en: GazelleAssessmentEngine.RESPONSE_LABELS.en[responseIndex] || '',
      response_label_es: GazelleAssessmentEngine.RESPONSE_LABELS.es[responseIndex] || '',
      recruiter_meaning_en: GazelleAiAssessment.recruiterEvidenceLabel(entry.itemId, 'en'),
      recruiter_meaning_es: GazelleAiAssessment.recruiterEvidenceLabel(entry.itemId, 'es'),
    };
  });
  const supportProfile = (evidence.supportProfile || []).map((entry) => ({
    ...entry,
    support_action_en: GazelleAiAssessment.recruiterEvidenceLabel(entry.itemId, 'en'),
    support_action_es: GazelleAiAssessment.recruiterEvidenceLabel(entry.itemId, 'es'),
  }));
  return { ...evidence, scoringTrace, supportProfile };
}

const AI_MAX_ATTEMPTS = 3;
const AI_STALE_PROCESSING_MS = 3 * 60 * 1000;
const AI_BACKGROUND_MAX_MS = 8 * 60 * 1000;

function isRetryableAiError(error) {
  const status = Number(error?.providerStatus || 0);
  const code = cleanText(error?.message, 120);
  if (['provider_timeout', 'openai_empty_output', 'gemini_empty_output'].includes(code)) return true;
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500 || (!status && !['ai_invalid_analysis', 'scenario_evidence_incomplete', 'assessment_not_found', 'ai_not_configured'].includes(code));
}

async function queueAiAnalysis(env, assessmentId, actorEmail = null) {
  const config = aiConfig(env);
  if (!config.configured) return { status: 'not_configured' };
  const evidence = await aiEvidenceForAssessment(env, assessmentId);
  if (!evidence) return { status: 'not_found' };
  if (evidence.scenarios.length !== 3) return { status: 'scenario_evidence_incomplete' };
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO ai_analyses (assessment_id, status, provider, model, prompt_version, attempt_count, requested_by_email, created_at, updated_at)
    VALUES (?, 'queued', ?, ?, ?, 0, ?, ?, ?)
    ON CONFLICT(assessment_id) DO UPDATE SET status = 'queued', provider = excluded.provider, model = excluded.model,
      prompt_version = excluded.prompt_version, attempt_count = 0, last_started_at = NULL, next_retry_at = NULL,
      requested_by_email = excluded.requested_by_email, provider_response_id = NULL, output_hash = NULL,
      output_en_json = NULL, output_es_json = NULL, evidence_claims_json = NULL, limitations_json = NULL,
      error_code = NULL, updated_at = excluded.updated_at
  `).bind(assessmentId, config.provider, config.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, actorEmail, now, now).run();
  await audit(env, actorEmail, 'ai_analysis_queued', 'assessment', assessmentId, { provider: config.provider, model: config.model, promptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION });
  return { status: 'queued' };
}

async function generateAndStoreAiAnalysis(env, assessmentId, actorEmail = null) {
  const config = aiConfig(env);
  const now = new Date().toISOString();
  if (!config.configured) {
    await env.DB.prepare(`
      INSERT INTO ai_analyses (assessment_id, status, provider, model, prompt_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(assessment_id) DO UPDATE SET status = excluded.status, provider = excluded.provider, model = excluded.model, prompt_version = excluded.prompt_version, updated_at = excluded.updated_at
    `).bind(assessmentId, 'not_configured', config.provider, config.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, now, now).run();
    return { status: 'not_configured' };
  }

  const staleCutoff = new Date(Date.now() - AI_STALE_PROCESSING_MS).toISOString();
  const analysisRow = await env.DB.prepare(`SELECT status, provider_response_id, attempt_count, requested_by_email, next_retry_at, updated_at, last_started_at FROM ai_analyses WHERE assessment_id = ?`).bind(assessmentId).first();
  if (!analysisRow || (!['queued', 'processing'].includes(analysisRow.status))) return { status: analysisRow?.status || 'not_generated' };
  const backgroundPoll = analysisRow.status === 'processing' && config.providerKey === 'openai' && Boolean(analysisRow.provider_response_id);
  const startedAt = Date.parse(analysisRow.last_started_at || analysisRow.updated_at || '');
  const backgroundExpired = backgroundPoll && Number.isFinite(startedAt) && Date.now() - startedAt > AI_BACKGROUND_MAX_MS;
  if (analysisRow.status === 'processing' && !backgroundPoll && analysisRow.updated_at >= staleCutoff) return { status: 'processing' };
  if (analysisRow.status === 'queued') {
    const nextRetry = Date.parse(analysisRow.next_retry_at || '');
    if (Number.isFinite(nextRetry) && nextRetry > Date.now()) return { status: 'queued' };
  }
  if (!backgroundPoll) {
    const claimed = await env.DB.prepare(`
      UPDATE ai_analyses SET status = 'processing', attempt_count = attempt_count + 1, last_started_at = ?, next_retry_at = NULL, error_code = NULL, updated_at = ?
      WHERE assessment_id = ? AND (status = 'queued' OR (status = 'processing' AND updated_at < ?))
    `).bind(now, now, assessmentId, staleCutoff).run();
    if (!Number(claimed.meta?.changes || 0)) return { status: 'processing' };
  }
  const attemptNumber = Number(analysisRow.attempt_count || 0) + (backgroundPoll ? 0 : 1);
  const auditActor = actorEmail || analysisRow.requested_by_email || null;
  let evidenceHash = null;
  try {
    if (backgroundExpired) throw new Error('provider_timeout');
    const evidence = await aiEvidenceForAssessment(env, assessmentId);
    if (!evidence) throw new Error('assessment_not_found');
    if (evidence.scenarios.length !== 3) throw new Error('scenario_evidence_incomplete');
    const { assessmentId: omittedAssessmentId, ...storedEvidence } = evidence;
    const modelEvidence = recruiterModelEvidence(storedEvidence);
    evidenceHash = await sha256(GazelleAssessmentEngine.stableStringify(modelEvidence));
    await env.DB.prepare(`UPDATE ai_analyses SET provider = ?, model = ?, prompt_version = ?, evidence_hash = ?, updated_at = ? WHERE assessment_id = ?`)
      .bind(config.provider, config.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, evidenceHash, now, assessmentId).run();
    const ai = backgroundPoll
      ? { ...(await retrieveOpenAiJson(config, analysisRow.provider_response_id)), provider: config.provider }
      : await callAiJson(env, {
        instructions: GazelleAiAssessment.ANALYSIS_INSTRUCTIONS,
        input: modelEvidence,
        schema: GazelleAiAssessment.analysisSchema,
        schemaName: 'tenure_potential_recruiter_analysis',
        safetyIdentifier: `assessment_${assessmentId}`,
        maxOutputTokens: 5000,
        background: config.providerKey === 'openai' && config.background,
      });
    if (ai.pending) {
      await env.DB.prepare(`UPDATE ai_analyses SET status = 'processing', provider = ?, model = ?, provider_response_id = ?, error_code = NULL, updated_at = ? WHERE assessment_id = ?`)
        .bind(config.provider, ai.model || config.model, ai.responseId, new Date().toISOString(), assessmentId).run();
      return { status: 'processing', provider: config.provider, model: ai.model || config.model, providerResponseId: ai.responseId };
    }
    const analysisData = normalizeRecruiterAnalysisOutput(ai.data);
    if (!validateAnalysisOutput(analysisData, modelEvidence)) throw new Error('ai_invalid_analysis');
    const outputHash = await sha256(GazelleAssessmentEngine.stableStringify(analysisData));
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE ai_analyses SET status = ?, provider = ?, model = ?, provider_response_id = ?, output_hash = ?, output_en_json = ?, output_es_json = ?,
        evidence_claims_json = ?, limitations_json = ?, error_code = NULL, updated_at = ? WHERE assessment_id = ?
    `).bind(
      'completed', ai.provider, ai.model, ai.responseId, outputHash, JSON.stringify(localizedAnalysisOutput(analysisData, 'en')), JSON.stringify(localizedAnalysisOutput(analysisData, 'es')),
      JSON.stringify(analysisData.evidence_claims || []), JSON.stringify(analysisData.limitations || []), updatedAt, assessmentId,
    ).run();
    await audit(env, auditActor, 'ai_analysis_completed', 'assessment', assessmentId, {
      provider: ai.provider, model: ai.model,
      promptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION,
      providerResponseId: ai.responseId,
      evidenceHash,
      outputHash,
    });
    return { status: 'completed', provider: ai.provider, model: ai.model, evidenceHash, outputHash };
  } catch (error) {
    const errorCode = cleanText(error.message, 120) || 'ai_analysis_failed';
    const retry = isRetryableAiError(error) && attemptNumber < AI_MAX_ATTEMPTS;
    await env.DB.prepare(`UPDATE ai_analyses SET status = ?, provider_response_id = NULL, error_code = ?, next_retry_at = ?, updated_at = ? WHERE assessment_id = ?`)
      .bind(retry ? 'queued' : 'failed', errorCode, retry ? retryAt(attemptNumber) : null, new Date().toISOString(), assessmentId).run();
    await audit(env, auditActor, retry ? 'ai_analysis_retry_queued' : 'ai_analysis_failed', 'assessment', assessmentId, { errorCode, attemptNumber, evidenceHash });
    return { status: retry ? 'queued' : 'failed', errorCode };
  }
}

async function submitAssessment(request, env, context) {
  const body = await request.json().catch(() => ({}));
  const token = cleanText(body.token, 200);
  if (!token) return json({ error: 'Invitation token is required.' }, 400);
  const tokenHash = await sha256(token);
  const invitation = await env.DB.prepare(`SELECT i.*, c.name, c.role FROM invitations i JOIN candidates c ON c.id = i.candidate_id WHERE i.token_hash = ?`).bind(tokenHash).first();
  if (!invitation) return json({ error: 'Invitation not found.' }, 404);
  if (invitation.status === 'completed') return json({ error: 'This assessment has already been completed.' }, 409);
  if (new Date(invitation.expires_at).getTime() < Date.now()) return json({ error: 'This invitation has expired.' }, 410);
  if (!['experienced', 'new'].includes(body.experienceBranch)) return json({ error: 'A valid experience branch is required.' }, 422);

  const storedScenarios = await scenarioRowsForInvitation(env, invitation.id);
  const suppliedScenarioResponses = Array.isArray(body.scenarioResponses) ? body.scenarioResponses : [];
  if (storedScenarios.length !== 3 || suppliedScenarioResponses.length !== 3) {
    return json({ error: 'Complete all three scenario questions before submitting.' }, 422);
  }
  const scenarioResponses = [];
  for (const scenario of storedScenarios) {
    const supplied = suppliedScenarioResponses.find((entry) => cleanText(entry.scenarioId, 100) === scenario.id);
    const responseText = cleanText(supplied?.response, 2500);
    if (responseText.length < 40) return json({ error: 'Each scenario response needs at least 40 characters.' }, 422);
    scenarioResponses.push({
      scenarioId: scenario.id,
      response: responseText,
      responseMs: Math.max(0, Math.min(30 * 60 * 1000, Number(supplied?.responseMs || 0))),
    });
  }

  const completedAt = new Date();
  const startedAt = new Date(body.startedAt);
  const startedAtMs = startedAt.getTime();
  if (!Number.isFinite(startedAtMs) || startedAtMs > completedAt.getTime() + 5 * 60 * 1000 || startedAtMs < completedAt.getTime() - 24 * 60 * 60 * 1000) {
    return json({ error: 'The assessment start time is invalid.' }, 422);
  }
  const durationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());
  const result = GazelleAssessmentEngine.scoreAssessment({
    answers: body.answers,
    responseTimes: body.responseTimes,
    experienceBranch: body.experienceBranch,
    durationMs,
  });
  if (result.potentialIndex == null) return json({ error: 'The assessment is incomplete.', missingItemIds: result.missingItemIds }, 422);

  const assessmentId = crypto.randomUUID();
  const locale = body.locale === 'es' ? 'es' : 'en';
  const auditPayload = {
    assessmentId,
    invitationId: invitation.id,
    candidateId: invitation.candidate_id,
    assessmentVersion: result.assessmentVersion,
    modelVersion: result.modelVersion,
    locale,
    experienceBranch: result.experienceBranch,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs,
    answers: body.answers,
    responseTimes: body.responseTimes || {},
    scenarioResponses,
    score: result,
  };
  const auditHash = await sha256(GazelleAssessmentEngine.stableStringify(auditPayload));
  const statements = [
    env.DB.prepare(`
      INSERT INTO assessments (id, candidate_id, invitation_id, assessment_version, model_version, model_status, locale, experience_branch, started_at, completed_at, duration_ms, potential_index, potential_band, fit_score, intent_score, reliability_score, context_score, support_profile_json, response_quality_json, scoring_trace_json, weights_json, audit_hash, test_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assessmentId, invitation.candidate_id, invitation.id, result.assessmentVersion, result.modelVersion, result.modelStatus,
      locale, result.experienceBranch, startedAt.toISOString(), completedAt.toISOString(), durationMs, result.potentialIndex,
      result.potentialBand, result.subscales.fit.score, result.subscales.intent.score, result.subscales.reliability.score,
      result.subscales.context.score, JSON.stringify(result.supportProfile), JSON.stringify(result.quality),
      JSON.stringify(result.scoringTrace), JSON.stringify(result.weights), auditHash, invitation.test_id || 'test_tenure_potential',
    ),
    env.DB.prepare(`UPDATE invitations SET status = ?, completed_at = ? WHERE id = ?`).bind('completed', completedAt.toISOString(), invitation.id),
    env.DB.prepare(`INSERT INTO audit_events (id, actor_email, event_type, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), null, 'assessment_completed', 'assessment', assessmentId, JSON.stringify({ auditHash, assessmentVersion: result.assessmentVersion, modelVersion: result.modelVersion }), completedAt.toISOString()),
  ];
  result.scoringTrace.forEach((entry) => statements.push(env.DB.prepare(`
    INSERT INTO assessment_responses (assessment_id, item_id, raw_response, reverse_scored, transformed_response, scaled_contribution, response_ms, included_in_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(assessmentId, entry.itemId, entry.rawResponse, entry.reverseScored ? 1 : 0, entry.transformedResponse, entry.scaledContribution, entry.responseMs, entry.includedInPotentialIndex ? 1 : 0)));
  scenarioResponses.forEach((entry) => statements.push(env.DB.prepare(`
    INSERT INTO assessment_scenario_responses (assessment_id, scenario_id, response_text, response_locale, response_ms)
    VALUES (?, ?, ?, ?, ?)
  `).bind(assessmentId, entry.scenarioId, entry.response, locale, entry.responseMs)));
  const ai = aiConfig(env);
  const initialAiStatus = ai.configured ? 'not_generated' : 'not_configured';
  statements.push(env.DB.prepare(`
    INSERT INTO ai_analyses (assessment_id, status, provider, model, prompt_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(assessmentId, initialAiStatus, ai.provider, ai.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, completedAt.toISOString(), completedAt.toISOString()));
  statements.push(env.DB.prepare(`
    UPDATE contact_journey_events
    SET status = 'skipped', error_code = 'assessment_completed', updated_at = ?
    WHERE candidate_id = ? AND status = 'queued'
      AND enrollment_id IN (
        SELECT e.id FROM contact_journey_enrollments e WHERE e.candidate_id = ? AND e.test_id = ?
      )
  `).bind(completedAt.toISOString(), invitation.candidate_id, invitation.candidate_id, invitation.test_id || 'test_tenure_potential'));
  statements.push(env.DB.prepare(`
    UPDATE contact_journey_enrollments
    SET status = 'completed', completed_at = ?, stopped_reason = 'assessment_completed'
    WHERE candidate_id = ? AND test_id = ? AND status = 'active'
  `).bind(completedAt.toISOString(), invitation.candidate_id, invitation.test_id || 'test_tenure_potential'));
  await env.DB.batch(statements);
  return json({ assessmentId, auditHash, result, aiAnalysisStatus: initialAiStatus }, 201);
}

async function sendTestEmail(request, env, admin) {
  const body = await request.json().catch(() => ({}));
  const to = cleanEmail(body.to || admin.email);
  if (!to) return json({ error: 'A valid recipient email is required.' }, 422);
  try {
    const provider = await sendBrevo(env, {
      to,
      subject: 'Gazelle Assessment email connection test',
      text: 'Brevo accepted this Gazelle Assessment transactional email test. Delivery events should be confirmed through the authenticated webhook.',
      html: '<div style="font-family:Arial,sans-serif"><h1>Gazelle Assessment</h1><p>Brevo accepted this transactional email test.</p><p>Delivery events should be confirmed through the authenticated webhook.</p></div>',
      tag: 'gazelle-connection-test',
    });
    await audit(env, admin.email, 'email_connection_tested', 'email_provider', 'brevo', { to, providerMessageId: provider.id, transport: provider.transport });
    return json({ status: 'accepted', providerMessageId: provider.id, transport: provider.transport });
  } catch (error) {
    return json({ error: error.providerMessage || 'Brevo did not accept the test message.', code: error.message }, error.providerStatus || 502);
  }
}

async function configureBrevoWebhook(request, env, user) {
  if (!isSuperAdmin(user)) return json({ error: 'Only the super administrator can configure the provider webhook.' }, 403);
  const config = emailConfig(env);
  if (!config.apiConfigured || !config.webhookConfigured) return json({ error: 'Brevo API and webhook secrets are not fully configured.', code: 'email_not_configured' }, 503);
  const origin = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '') || new URL(request.url).origin;
  const webhookUrl = `${origin}/api/brevo/webhook?integration=gazelle-v1`;
  try {
    let current;
    try {
      current = await brevoApiRequest(config, '/webhooks?type=transactional&sort=desc');
    } catch (error) {
      if (error.providerStatus !== 400 || !/does not exist/i.test(error.providerMessage || '')) throw error;
      current = { webhooks: [] };
    }
    const existing = (current.webhooks || []).find((entry) => entry.url === webhookUrl && entry.type === 'transactional');
    const payload = brevoWebhookPayload(config, webhookUrl);
    let webhookId = existing?.id || null;
    let action = 'created';
    if (existing?.id != null) {
      try {
        await brevoApiRequest(config, `/webhooks/${encodeURIComponent(existing.id)}`, { method: 'PUT', body: payload });
        action = 'updated';
      } catch (error) {
        if (error.providerStatus !== 400 || !/does not exist/i.test(error.providerMessage || '')) throw error;
        const created = await brevoApiRequest(config, '/webhooks', { method: 'POST', body: payload });
        webhookId = created.id || null;
        action = 'recreated';
      }
    } else {
      const created = await brevoApiRequest(config, '/webhooks', { method: 'POST', body: payload });
      webhookId = created.id || null;
    }
    await audit(env, user.email, 'brevo_webhook_configured', 'email_provider', String(webhookId || 'brevo'), { action, webhookUrl, events: BREVO_TRANSACTIONAL_EVENTS });
    return json({ configured: true, action, webhookId, webhookUrl, events: BREVO_TRANSACTIONAL_EVENTS });
  } catch (error) {
    return json({ error: error.providerMessage || 'Brevo webhook configuration failed.', code: error.message }, error.providerStatus || 502);
  }
}

async function regenerateAiAnalysis(env, user, assessmentId, context) {
  if (!aiConfig(env).configured) return json({ error: 'An AI analysis provider is not configured.', code: 'ai_not_configured' }, 503);
  const scope = candidateScope(user, 'c');
  const assessment = await env.DB.prepare(`SELECT a.id FROM assessments a JOIN candidates c ON c.id = a.candidate_id WHERE a.id = ? AND ${scope.sql}`).bind(assessmentId, ...scope.bindings).first();
  if (!assessment) return json({ error: 'Assessment not found.' }, 404);
  const queued = await queueAiAnalysis(env, assessmentId, user.email);
  if (queued.status === 'scenario_evidence_incomplete') return json({ error: 'All three scenario responses are required before generating the analysis.', code: queued.status }, 422);
  const work = generateAndStoreAiAnalysis(env, assessmentId, user.email);
  if (context?.waitUntil) context.waitUntil(work);
  else work.catch(() => {});
  return json({ status: 'queued', assessmentId }, 202);
}

async function advanceAiAnalysis(env, user, assessmentId, context) {
  if (!aiConfig(env).configured) return json({ error: 'An AI analysis provider is not configured.', code: 'ai_not_configured' }, 503);
  const scope = candidateScope(user, 'c');
  const assessment = await env.DB.prepare(`SELECT a.id FROM assessments a JOIN candidates c ON c.id = a.candidate_id WHERE a.id = ? AND ${scope.sql}`).bind(assessmentId, ...scope.bindings).first();
  if (!assessment) return json({ error: 'Assessment not found.' }, 404);
  const work = generateAndStoreAiAnalysis(env, assessmentId, user.email);
  if (context?.waitUntil) context.waitUntil(work);
  else work.catch(() => {});
  return json({ status: 'processing', assessmentId }, 202);
}

async function analyzePreview(request, env, admin) {
  const config = aiConfig(env);
  if (!config.configured) return json({ error: 'An AI analysis provider is not configured.', code: 'ai_not_configured' }, 503);
  const body = await request.json().catch(() => ({}));
  const role = cleanText(body.role, 140);
  const experienceBranch = body.experienceBranch;
  if (!role) return json({ error: 'A role is required for preview analysis.' }, 422);
  if (!['experienced', 'new'].includes(experienceBranch)) return json({ error: 'A valid experience branch is required.' }, 422);

  const durationMs = Math.max(0, Math.min(24 * 60 * 60 * 1000, Number(body.durationMs || 0)));
  const result = GazelleAssessmentEngine.scoreAssessment({
    answers: body.answers,
    responseTimes: body.responseTimes,
    experienceBranch,
    durationMs,
  });
  if (result.potentialIndex == null) return json({ error: 'The preview assessment is incomplete.', missingItemIds: result.missingItemIds }, 422);

  const questions = Array.isArray(body.scenarios) ? body.scenarios.map((scenario) => ({
    id: cleanText(scenario.scenarioId || scenario.id, 100),
    construct: cleanText(scenario.construct, 80),
    question_en: cleanText(scenario.question_en, 1600),
    question_es: cleanText(scenario.question_es, 1600),
    evidence_item_ids: Array.isArray(scenario.evidence_item_ids) ? scenario.evidence_item_ids.map((id) => cleanText(id, 100)).slice(0, 4) : [],
  })) : [];
  const itemIds = new Set(result.scoringTrace.map((entry) => entry.itemId));
  if (!validateScenarioOutput(questions, itemIds)) return json({ error: 'The preview scenarios are invalid.' }, 422);

  const suppliedResponses = Array.isArray(body.scenarioResponses) ? body.scenarioResponses : [];
  if (suppliedResponses.length !== 3) return json({ error: 'Complete all three preview scenarios.' }, 422);
  const scenarios = [];
  for (const question of questions) {
    const supplied = suppliedResponses.find((entry) => cleanText(entry.scenarioId, 100) === question.id);
    const response = cleanText(supplied?.response, 2500);
    if (response.length < 40) return json({ error: 'Each scenario response needs at least 40 characters.' }, 422);
    const redacted = redactAiEvidence(response);
    scenarios.push({
      scenarioId: question.id,
      order: scenarios.length + 1,
      construct: question.construct,
      question_en: question.question_en,
      question_es: question.question_es,
      evidence_item_ids: question.evidence_item_ids,
      candidate_response: redacted.text,
      sensitive_details_omitted: redacted.redacted,
      response_locale: body.locale === 'es' ? 'es' : 'en',
      response_ms: Math.max(0, Math.min(30 * 60 * 1000, Number(supplied?.responseMs || 0))),
    });
  }

  const modelEvidence = recruiterModelEvidence({
    assessmentVersion: result.assessmentVersion,
    scoringModel: result.modelVersion,
    modelStatus: result.modelStatus,
    role,
    experienceBranch: result.experienceBranch,
    completedAt: new Date().toISOString(),
    durationMs,
    potentialIndex: result.potentialIndex,
    potentialBand: result.potentialBand,
    subscales: {
      fit: result.subscales.fit.score,
      intent: result.subscales.intent.score,
      reliability: result.subscales.reliability.score,
      context: result.subscales.context.score,
    },
    supportProfile: result.supportProfile,
    responseQuality: result.quality,
    scoringTrace: result.scoringTrace,
    weights: result.weights,
    scenarios,
  });
  const evidenceHash = await sha256(GazelleAssessmentEngine.stableStringify(modelEvidence));
  const previewId = crypto.randomUUID();
  try {
    const ai = await callAiJson(env, {
      instructions: GazelleAiAssessment.ANALYSIS_INSTRUCTIONS,
      input: modelEvidence,
      schema: GazelleAiAssessment.analysisSchema,
      schemaName: 'tenure_potential_preview_analysis',
      safetyIdentifier: `preview_${previewId}`,
      maxOutputTokens: 9000,
    });
    const analysisData = normalizeRecruiterAnalysisOutput(ai.data);
    if (!validateAnalysisOutput(analysisData, modelEvidence)) throw new Error('ai_invalid_analysis');
    const outputHash = await sha256(GazelleAssessmentEngine.stableStringify(analysisData));
    const updatedAt = new Date().toISOString();
    await audit(env, admin.email, 'preview_ai_analysis_completed', 'preview', previewId, {
      provider: ai.provider, model: ai.model,
      promptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION,
      providerResponseId: ai.responseId,
      evidenceHash,
      outputHash,
    });
    return json({
      analysis: {
        status: 'completed',
        provider: ai.provider,
        model: ai.model,
        prompt_version: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION,
        provider_response_id: ai.responseId,
        evidence_hash: evidenceHash,
        output_hash: outputHash,
        output: { en: localizedAnalysisOutput(analysisData, 'en'), es: localizedAnalysisOutput(analysisData, 'es') },
        evidence_claims: analysisData.evidence_claims || [],
        limitations: analysisData.limitations || [],
        updated_at: updatedAt,
      },
    });
  } catch (error) {
    const errorCode = cleanText(error.message, 120) || 'ai_analysis_failed';
    await audit(env, admin.email, 'preview_ai_analysis_failed', 'preview', previewId, { errorCode, evidenceHash });
    return json({ error: 'The preview AI analysis could not be completed.', code: errorCode }, 502);
  }
}

async function listTests(env, user) {
  const result = await env.DB.prepare(`
    SELECT t.*, u.name AS created_by_name,
      (SELECT COUNT(*) FROM candidate_list_tests clt WHERE clt.test_id = t.id) AS list_count,
      (SELECT COUNT(*) FROM invitations i WHERE i.test_id = t.id) AS invitation_count
    FROM assessment_tests t LEFT JOIN users u ON u.id = t.created_by_user_id
    ${isSuperAdmin(user) ? '' : "WHERE t.status = 'active'"}
    ORDER BY CASE t.status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, t.created_at
  `).all();
  return result.results || [];
}

async function createTest(request, env, user) {
  if (!isSuperAdmin(user)) return json({ error: 'Only the super administrator can manage the test catalog.' }, 403);
  const body = await request.json().catch(() => ({}));
  const nameEn = cleanText(body.nameEn, 140);
  const nameEs = cleanText(body.nameEs, 140);
  const descriptionEn = cleanText(body.descriptionEn, 800);
  const descriptionEs = cleanText(body.descriptionEs, 800);
  if (!nameEn || !nameEs || !descriptionEn || !descriptionEs) return json({ error: 'Names and descriptions are required in both languages.' }, 422);
  const slug = cleanText(body.slug, 100).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return json({ error: 'A valid slug is required.' }, 422);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const code = `GZ-${Math.floor(Date.now() / 1000).toString(36).toUpperCase()}`;
  try {
    await env.DB.prepare(`
      INSERT INTO assessment_tests (id, code, slug, name_en, name_es, description_en, description_es, engine_key, version, status, estimated_minutes, item_count, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `).bind(id, code, slug, nameEn, nameEs, descriptionEn, descriptionEs, `draft:${slug}`, cleanText(body.version, 40) || '0.1.0-draft', Math.max(1, Math.min(180, Number(body.estimatedMinutes || 15))), Math.max(0, Math.min(500, Number(body.itemCount || 0))), user.id, now, now).run();
  } catch {
    return json({ error: 'A test with that slug already exists.' }, 409);
  }
  await audit(env, user.email, 'test_catalog_entry_created', 'assessment_test', id, { slug, status: 'draft' });
  return json({ tests: await listTests(env, user) }, 201);
}

async function visibleList(env, user, listId) {
  const scope = listScope(user, 'l');
  return env.DB.prepare(`SELECT l.*, c.name AS company_name, u.name AS owner_name FROM candidate_lists l JOIN companies c ON c.id = l.company_id JOIN users u ON u.id = l.owner_user_id WHERE l.id = ? AND l.status = 'active' AND ${scope.sql}`)
    .bind(listId, ...scope.bindings).first();
}

async function listCandidateLists(env, user) {
  const scope = listScope(user, 'l');
  const result = await env.DB.prepare(`
    SELECT l.*, c.name AS company_name, u.name AS owner_name,
      (SELECT COUNT(*) FROM candidate_list_members m WHERE m.list_id = l.id) AS member_count,
      (SELECT COUNT(*) FROM candidate_list_tests lt WHERE lt.list_id = l.id) AS test_count,
      (SELECT GROUP_CONCAT(m.candidate_id) FROM candidate_list_members m WHERE m.list_id = l.id) AS member_ids_csv,
      (SELECT GROUP_CONCAT(lt.test_id) FROM candidate_list_tests lt WHERE lt.list_id = l.id) AS test_ids_csv,
      (SELECT COUNT(*) FROM send_batches b WHERE b.list_id = l.id) AS batch_count
    FROM candidate_lists l JOIN companies c ON c.id = l.company_id JOIN users u ON u.id = l.owner_user_id
    WHERE l.status = 'active' AND ${scope.sql}
    ORDER BY l.updated_at DESC
  `).bind(...scope.bindings).all();
  return (result.results || []).map((row) => ({
    ...row,
    member_ids: row.member_ids_csv ? row.member_ids_csv.split(',') : [],
    test_ids: row.test_ids_csv ? row.test_ids_csv.split(',') : [],
  }));
}

async function createCandidateList(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body.name, 140);
  const description = cleanText(body.description, 500);
  const companyId = isSuperAdmin(user) ? cleanText(body.companyId, 100) || user.companyId : user.companyId;
  if (!name || !companyId) return json({ error: 'List name and company are required.' }, 422);
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.' }, 404);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO candidate_lists (id, company_id, owner_user_id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`)
    .bind(id, companyId, user.id, name, description || null, now, now).run();
  await audit(env, user.email, 'candidate_list_created', 'candidate_list', id, { companyId, name });
  return json({ listId: id, lists: await listCandidateLists(env, user) }, 201);
}

async function updateCandidateList(request, env, user, listId) {
  const list = await visibleList(env, user, listId);
  if (!list) return json({ error: 'List not found.' }, 404);
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body.name, 140) || list.name;
  const description = body.description === undefined ? list.description : cleanText(body.description, 500) || null;
  const candidateIds = Array.isArray(body.candidateIds) ? [...new Set(body.candidateIds.map((id) => cleanText(id, 100)).filter(Boolean))].slice(0, 1000) : null;
  const testIds = Array.isArray(body.testIds) ? [...new Set(body.testIds.map((id) => cleanText(id, 100)).filter(Boolean))].slice(0, 50) : null;
  if (candidateIds) {
    const scope = candidateScope(user);
    const candidates = candidateIds.length ? await env.DB.prepare(`SELECT c.id FROM candidates c WHERE c.company_id = ? AND c.id IN (${candidateIds.map(() => '?').join(',')}) AND ${scope.sql}`).bind(list.company_id, ...candidateIds, ...scope.bindings).all() : { results: [] };
    if ((candidates.results || []).length !== candidateIds.length) return json({ error: 'One or more candidates are outside this list company.' }, 422);
  }
  if (testIds) {
    const tests = testIds.length ? await env.DB.prepare(`SELECT id FROM assessment_tests WHERE id IN (${testIds.map(() => '?').join(',')}) AND status <> 'archived'`).bind(...testIds).all() : { results: [] };
    if ((tests.results || []).length !== testIds.length) return json({ error: 'One or more tests are unavailable.' }, 422);
  }
  const now = new Date().toISOString();
  const statements = [env.DB.prepare(`UPDATE candidate_lists SET name = ?, description = ?, updated_at = ? WHERE id = ?`).bind(name, description, now, listId)];
  if (candidateIds) {
    statements.push(env.DB.prepare(`DELETE FROM candidate_list_members WHERE list_id = ?`).bind(listId));
    candidateIds.forEach((candidateId) => statements.push(env.DB.prepare(`INSERT INTO candidate_list_members (list_id, candidate_id, added_by_user_id, added_at) VALUES (?, ?, ?, ?)`).bind(listId, candidateId, user.id, now)));
  }
  if (testIds) {
    statements.push(env.DB.prepare(`DELETE FROM candidate_list_tests WHERE list_id = ?`).bind(listId));
    testIds.forEach((testId) => statements.push(env.DB.prepare(`INSERT INTO candidate_list_tests (list_id, test_id, added_by_user_id, added_at) VALUES (?, ?, ?, ?)`).bind(listId, testId, user.id, now)));
  }
  await env.DB.batch(statements);
  await audit(env, user.email, 'candidate_list_updated', 'candidate_list', listId, { candidateCount: candidateIds?.length, testCount: testIds?.length });
  return json({ lists: await listCandidateLists(env, user) });
}

const BATCH_MAX_ATTEMPTS = 3;
const BATCH_ITEMS_PER_RUN = 50;
const BATCH_CONCURRENCY = 5;

function isRetryableProviderError(error) {
  const status = Number(error?.providerStatus || 0);
  const code = cleanText(error?.message, 120);
  if (['provider_timeout', 'brevo_smtp_timeout', 'brevo_smtp_disconnected', 'brevo_missing_message_id'].includes(code)) return true;
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500 || (!status && !['invalid_email', 'email_not_configured', 'attempt_limit_reached'].includes(code));
}

function retryAt(attemptNumber) {
  const delayMs = attemptNumber <= 1 ? 30000 : attemptNumber === 2 ? 120000 : 300000;
  return new Date(Date.now() + delayMs).toISOString();
}

async function updateBatchCounts(env, batchId, actorEmail = null) {
  const counts = await env.DB.prepare(`
    SELECT COUNT(*) AS total_count,
      SUM(CASE WHEN status IN ('queued', 'sending') THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count
    FROM send_batch_items WHERE batch_id = ?
  `).bind(batchId).first();
  const pendingCount = Number(counts.pending_count || 0);
  const failedCount = Number(counts.failed_count || 0);
  const acceptedCount = Number(counts.accepted_count || 0);
  const status = pendingCount ? 'processing' : failedCount === 0 ? 'api_accepted' : acceptedCount > 0 ? 'api_accepted_with_errors' : 'failed';
  const completedAt = pendingCount ? null : new Date().toISOString();
  await env.DB.prepare(`UPDATE send_batches SET status = ?, total_count = ?, queued_count = ?, accepted_count = ?, failed_count = ?, completed_at = ? WHERE id = ?`)
    .bind(status, Number(counts.total_count || 0), pendingCount, acceptedCount, failedCount, completedAt, batchId).run();
  if (!pendingCount) await audit(env, actorEmail, 'send_batch_api_processing_finished', 'send_batch', batchId, { status, acceptedCount, failedCount });
  return { status, pendingCount, acceptedCount, failedCount };
}

async function processBatchItem(env, user, row, batchId, origin) {
  const existing = await env.DB.prepare(`
    SELECT id, provider_message_id FROM invitations
    WHERE batch_id = ? AND candidate_id = ? AND test_id = ? AND status IN ('accepted', 'delivered', 'completed')
    ORDER BY created_at DESC LIMIT 1
  `).bind(batchId, row.id, row.test_record_id).first();
  if (existing) {
    await env.DB.prepare(`UPDATE send_batch_items SET status = 'accepted', invitation_id = ?, provider_message_id = ?, error_code = NULL, next_attempt_at = NULL, updated_at = ? WHERE id = ?`)
      .bind(existing.id, existing.provider_message_id, new Date().toISOString(), row.item_id).run();
    return;
  }
  const startedAt = new Date().toISOString();
  const claimed = await env.DB.prepare(`
    UPDATE send_batch_items SET status = 'sending', attempt_count = attempt_count + 1, last_attempt_at = ?, next_attempt_at = NULL, updated_at = ?
    WHERE id = ? AND status = 'queued'
  `).bind(startedAt, startedAt, row.item_id).run();
  if (!Number(claimed.meta?.changes || 0)) return;
  const attemptNumber = Number(row.attempt_count || 0) + 1;
  const test = { id: row.test_record_id, slug: row.test_slug, name_en: row.name_en, name_es: row.name_es, engine_key: row.engine_key, status: row.test_status };
  try {
    const sent = await sendInvitationForCandidate({
      env, user, candidate: row, test, locale: row.locale, origin, listId: row.list_id, batchId,
      idempotencyKey: row.item_id,
    });
    await env.DB.prepare(`UPDATE send_batch_items SET status = 'accepted', invitation_id = ?, provider_message_id = ?, error_code = NULL, next_attempt_at = NULL, updated_at = ? WHERE id = ?`)
      .bind(sent.invitationId, sent.providerMessageId, new Date().toISOString(), row.item_id).run();
  } catch (error) {
    const retry = isRetryableProviderError(error) && attemptNumber < BATCH_MAX_ATTEMPTS;
    await env.DB.prepare(`UPDATE send_batch_items SET status = ?, invitation_id = ?, error_code = ?, next_attempt_at = ?, updated_at = ? WHERE id = ?`)
      .bind(retry ? 'queued' : 'failed', error.invitationId || null, cleanText(error.message, 120) || 'delivery_failed', retry ? retryAt(attemptNumber) : null, new Date().toISOString(), row.item_id).run();
  }
}

async function processSendBatch(env, user, batchId, origin) {
  const startedAt = new Date().toISOString();
  const staleCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE send_batches SET status = 'processing', started_at = COALESCE(started_at, ?) WHERE id = ?`).bind(startedAt, batchId),
    env.DB.prepare(`UPDATE send_batch_items SET status = 'queued', next_attempt_at = ?, error_code = 'worker_interrupted', updated_at = ? WHERE batch_id = ? AND status = 'sending' AND attempt_count < ${BATCH_MAX_ATTEMPTS} AND updated_at < ?`)
      .bind(startedAt, startedAt, batchId, staleCutoff),
    env.DB.prepare(`UPDATE send_batch_items SET status = 'failed', next_attempt_at = NULL, error_code = 'retry_limit_reached', updated_at = ? WHERE batch_id = ? AND status IN ('queued', 'sending') AND attempt_count >= ${BATCH_MAX_ATTEMPTS} AND updated_at < ?`)
      .bind(startedAt, batchId, staleCutoff),
  ]);
  const result = await env.DB.prepare(`
    SELECT bi.id AS item_id, bi.attempt_count, c.*, t.id AS test_record_id, t.slug AS test_slug, t.name_en, t.name_es, t.engine_key, t.status AS test_status,
      b.locale, b.list_id
    FROM send_batch_items bi JOIN send_batches b ON b.id = bi.batch_id
    JOIN candidates c ON c.id = bi.candidate_id JOIN assessment_tests t ON t.id = bi.test_id
    WHERE bi.batch_id = ? AND bi.status = 'queued' AND (bi.next_attempt_at IS NULL OR bi.next_attempt_at <= ?)
    ORDER BY bi.created_at LIMIT ?
  `).bind(batchId, startedAt, BATCH_ITEMS_PER_RUN).all();
  const rows = result.results || [];
  for (let index = 0; index < rows.length; index += BATCH_CONCURRENCY) {
    await Promise.all(rows.slice(index, index + BATCH_CONCURRENCY).map((row) => processBatchItem(env, user, row, batchId, origin)));
  }
  return updateBatchCounts(env, batchId, user.email);
}

async function createSendBatch(request, env, user, context) {
  if (!emailConfig(env).configured) return json({ error: 'Brevo transactional email is not fully configured.', code: 'email_not_configured' }, 503);
  const body = await request.json().catch(() => ({}));
  const listId = cleanText(body.listId, 100);
  const list = await visibleList(env, user, listId);
  if (!list) return json({ error: 'List not found.' }, 404);
  let testIds = Array.isArray(body.testIds) ? [...new Set(body.testIds.map((id) => cleanText(id, 100)).filter(Boolean))] : [];
  if (!testIds.length) {
    const selected = await env.DB.prepare(`SELECT test_id FROM candidate_list_tests WHERE list_id = ?`).bind(listId).all();
    testIds = (selected.results || []).map((row) => row.test_id);
  }
  if (!testIds.length) return json({ error: 'Select at least one test for this list.' }, 422);
  const tests = await env.DB.prepare(`SELECT * FROM assessment_tests WHERE id IN (${testIds.map(() => '?').join(',')}) AND status = 'active' AND engine_key = 'tenure_potential'`).bind(...testIds).all();
  if ((tests.results || []).length !== testIds.length) return json({ error: 'Every selected test must be active and executable.' }, 422);
  const scope = candidateScope(user);
  const members = await env.DB.prepare(`SELECT c.id FROM candidate_list_members m JOIN candidates c ON c.id = m.candidate_id WHERE m.list_id = ? AND c.company_id = ? AND ${scope.sql}`).bind(listId, list.company_id, ...scope.bindings).all();
  if (!(members.results || []).length) return json({ error: 'Add candidates to the list before sending.' }, 422);
  const total = members.results.length * testIds.length;
  if (total > 500) return json({ error: 'A batch can contain at most 500 candidate-test sends.' }, 422);
  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const locale = body.locale === 'es' ? 'es' : 'en';
  const statements = [env.DB.prepare(`INSERT INTO send_batches (id, company_id, list_id, created_by_user_id, locale, status, total_count, queued_count, accepted_count, failed_count, created_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, 0, 0, ?)`)
    .bind(batchId, list.company_id, listId, user.id, locale, total, total, now)];
  members.results.forEach((member) => testIds.forEach((testId) => statements.push(env.DB.prepare(`INSERT INTO send_batch_items (id, batch_id, candidate_id, test_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'queued', ?, ?)`)
    .bind(crypto.randomUUID(), batchId, member.id, testId, now, now))));
  await env.DB.batch(statements);
  await audit(env, user.email, 'send_batch_queued', 'send_batch', batchId, { listId, testIds, total });
  const origin = cleanText(env.APP_BASE_URL, 500) || new URL(request.url).origin;
  const work = processSendBatch(env, user, batchId, origin);
  if (context?.waitUntil) context.waitUntil(work);
  else work.catch(() => {});
  return json({ batchId, status: 'queued', total }, 202);
}

function batchDeliveryStatus(batch) {
  const persistedStatus = cleanText(batch.status, 80);
  if (['queued', 'processing', 'failed'].includes(persistedStatus)) return persistedStatus;
  const accepted = Number(batch.accepted_count || 0);
  const failed = Number(batch.failed_count || 0);
  const providerConfirmed = Number(batch.provider_confirmed_count || 0);
  const delivered = Number(batch.delivered_count || 0);
  if (!accepted) return failed ? 'failed' : persistedStatus;
  if (delivered >= accepted) return failed ? 'delivered_with_errors' : 'delivered';
  if (providerConfirmed >= accepted) return failed ? 'provider_confirmed_with_errors' : 'provider_confirmed';
  if (providerConfirmed > 0) return 'partially_confirmed';
  return 'provider_unconfirmed';
}

async function listSendBatches(env, user) {
  const scope = listScope(user, 'l');
  const result = await env.DB.prepare(`
    SELECT b.*, l.name AS list_name, c.name AS company_name, u.name AS created_by_name,
      (SELECT COUNT(*) FROM send_batch_items pending WHERE pending.batch_id = b.id AND pending.status IN ('queued', 'sending')) AS pending_count,
      (SELECT MAX(error_code) FROM send_batch_items failed_item WHERE failed_item.batch_id = b.id AND failed_item.status = 'failed') AS last_error_code,
      (SELECT COUNT(*) FROM send_batch_items bi JOIN invitations i ON i.id = bi.invitation_id WHERE bi.batch_id = b.id AND i.status = 'completed') AS completed_assessments,
      (SELECT COUNT(DISTINCT bi.invitation_id) FROM send_batch_items bi
        WHERE bi.batch_id = b.id AND bi.status = 'accepted' AND EXISTS (
          SELECT 1 FROM email_events ee WHERE ee.invitation_id = bi.invitation_id
        )) AS provider_confirmed_count,
      (SELECT COUNT(DISTINCT bi.invitation_id) FROM send_batch_items bi JOIN invitations i ON i.id = bi.invitation_id
        WHERE bi.batch_id = b.id AND bi.status = 'accepted' AND i.status IN ('delivered', 'completed')) AS delivered_count
    FROM send_batches b JOIN candidate_lists l ON l.id = b.list_id JOIN companies c ON c.id = b.company_id JOIN users u ON u.id = b.created_by_user_id
    WHERE ${scope.sql} ORDER BY b.created_at DESC LIMIT 100
  `).bind(...scope.bindings).all();
  return (result.results || []).map((batch) => ({ ...batch, status: batchDeliveryStatus(batch) }));
}

function normalizedJourneySteps(inputSteps) {
  const fallback = [
    { delayHours: 0, channel: 'email' },
    { delayHours: 3, channel: 'whatsapp' },
    { delayHours: 24, channel: 'email' },
    { delayHours: 48, channel: 'sms' },
  ];
  const rows = (Array.isArray(inputSteps) && inputSteps.length ? inputSteps : fallback).slice(0, 8);
  return rows.map((step, index) => {
    const channel = ['email', 'whatsapp', 'sms'].includes(step.channel) ? step.channel : 'email';
    const delayHours = Math.max(0, Math.min(720, Number(step.delayHours ?? step.delay_hours ?? 0) || 0));
    const delayMinutes = Math.round(delayHours * 60);
    const order = index + 1;
    const defaultEn = channel === 'email'
      ? `Hi {{name}}, your {{brand}} assessment for {{role}} is ready. Please complete it here: {{link}}`
      : `Hi {{name}}, {{brand}} here. Your assessment for {{role}} is ready: {{link}}`;
    const defaultEs = channel === 'email'
      ? `Hola {{name}}, tu evaluación de {{brand}} para {{role}} está lista. Complétala aquí: {{link}}`
      : `Hola {{name}}, somos {{brand}}. Tu evaluación para {{role}} está lista: {{link}}`;
    return {
      id: crypto.randomUUID(),
      step_order: order,
      delay_minutes: delayMinutes,
      channel,
      template_name: cleanText(step.templateName || step.template_name || `Step ${order}`, 120) || `Step ${order}`,
      brevo_template_id: cleanText(step.brevoTemplateId || step.brevo_template_id, 80) || null,
      subject_en: cleanText(step.subjectEn || step.subject_en || 'Your assessment is ready', 180),
      subject_es: cleanText(step.subjectEs || step.subject_es || 'Tu evaluación está lista', 180),
      message_en: cleanText(step.messageEn || step.message_en || defaultEn, 800) || defaultEn,
      message_es: cleanText(step.messageEs || step.message_es || defaultEs, 800) || defaultEs,
    };
  });
}

async function listContactJourneys(env, user) {
  const scope = listScope(user, 'l');
  const rows = await env.DB.prepare(`
    SELECT j.*, l.name AS list_name, c.name AS company_name, t.name_en AS test_name_en, t.name_es AS test_name_es, u.name AS created_by_name,
      (SELECT COUNT(*) FROM contact_journey_steps s WHERE s.journey_id = j.id) AS step_count,
      (SELECT COUNT(*) FROM contact_journey_enrollments e WHERE e.journey_id = j.id) AS enrollment_count,
      (SELECT COUNT(*) FROM contact_journey_enrollments e WHERE e.journey_id = j.id AND e.status = 'completed') AS completed_count,
      (SELECT COUNT(*) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'queued') AS queued_event_count,
      (SELECT COUNT(*) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'accepted') AS accepted_event_count,
      (SELECT COUNT(*) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'skipped') AS skipped_event_count,
      (SELECT COUNT(*) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'failed') AS failed_event_count
    FROM contact_journeys j
    JOIN candidate_lists l ON l.id = j.list_id
    JOIN companies c ON c.id = j.company_id
    JOIN assessment_tests t ON t.id = j.test_id
    JOIN users u ON u.id = j.created_by_user_id
    WHERE ${scope.sql}
    ORDER BY j.updated_at DESC
  `).bind(...scope.bindings).all();
  const journeys = [];
  for (const row of rows.results || []) {
    const steps = await env.DB.prepare(`SELECT * FROM contact_journey_steps WHERE journey_id = ? ORDER BY step_order`).bind(row.id).all();
    journeys.push({ ...row, steps: steps.results || [] });
  }
  return journeys;
}

async function createContactJourney(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body.name, 140);
  const listId = cleanText(body.listId, 100);
  const test = await executableTest(env, cleanText(body.testId, 100));
  const list = await visibleList(env, user, listId);
  if (!name || !list) return json({ error: 'Journey name and a valid candidate list are required.', code: 'invalid_journey' }, 422);
  if (!test) return json({ error: 'Select an active executable test for this journey.', code: 'test_not_executable' }, 422);
  const steps = normalizedJourneySteps(body.steps);
  if (!steps.length) return json({ error: 'Add at least one journey step.', code: 'journey_steps_required' }, 422);
  const journeyId = crypto.randomUUID();
  const now = new Date().toISOString();
  const locale = body.locale === 'es' ? 'es' : 'en';
  const status = body.status === 'active' ? 'active' : 'draft';
  const statements = [env.DB.prepare(`
    INSERT INTO contact_journeys (id, company_id, list_id, test_id, created_by_user_id, name, status, locale, goal_event, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assessment_completed', ?, ?)
  `).bind(journeyId, list.company_id, list.id, test.id, user.id, name, status, locale, now, now)];
  steps.forEach((step) => statements.push(env.DB.prepare(`
    INSERT INTO contact_journey_steps (id, journey_id, step_order, delay_minutes, channel, template_name, brevo_template_id, subject_en, subject_es, message_en, message_es, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(step.id, journeyId, step.step_order, step.delay_minutes, step.channel, step.template_name, step.brevo_template_id, step.subject_en, step.subject_es, step.message_en, step.message_es, now)));
  await env.DB.batch(statements);
  await audit(env, user.email, 'contact_journey_created', 'contact_journey', journeyId, { listId: list.id, testId: test.id, stepCount: steps.length, status });
  return json({ journeyId, journeys: await listContactJourneys(env, user) }, 201);
}

async function updateContactJourney(request, env, user, journeyId) {
  const body = await request.json().catch(() => ({}));
  const visible = (await listContactJourneys(env, user)).find((journey) => journey.id === journeyId);
  if (!visible) return json({ error: 'Journey not found.', code: 'journey_not_found' }, 404);
  const status = cleanText(body.status, 30);
  if (!['draft', 'active', 'paused', 'archived'].includes(status)) return json({ error: 'Invalid journey status.', code: 'invalid_journey_status' }, 422);
  await env.DB.prepare(`UPDATE contact_journeys SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), journeyId).run();
  await audit(env, user.email, 'contact_journey_status_updated', 'contact_journey', journeyId, { status });
  return json({ journeys: await listContactJourneys(env, user) });
}

async function enrollContactJourney(request, env, user, journeyId, context) {
  const journey = (await listContactJourneys(env, user)).find((entry) => entry.id === journeyId);
  if (!journey) return json({ error: 'Journey not found.', code: 'journey_not_found' }, 404);
  if (journey.status !== 'active') return json({ error: 'Activate the journey before enrollment.', code: 'journey_not_active' }, 422);
  if (!journey.steps.length) return json({ error: 'This journey has no steps.', code: 'journey_steps_required' }, 422);
  const scope = candidateScope(user);
  const members = await env.DB.prepare(`
    SELECT c.* FROM candidate_list_members m JOIN candidates c ON c.id = m.candidate_id
    WHERE m.list_id = ? AND c.company_id = ? AND ${scope.sql}
      AND NOT EXISTS (SELECT 1 FROM assessments a WHERE a.candidate_id = c.id AND a.test_id = ?)
    ORDER BY c.name LIMIT 500
  `).bind(journey.list_id, journey.company_id, ...scope.bindings, journey.test_id).all();
  const now = new Date();
  const statements = [];
  let enrolled = 0;
  for (const candidate of members.results || []) {
    const enrollmentId = crypto.randomUUID();
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO contact_journey_enrollments (id, journey_id, candidate_id, test_id, status, enrolled_at)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).bind(enrollmentId, journey.id, candidate.id, journey.test_id, now.toISOString()));
    for (const step of journey.steps) {
      const scheduledAt = new Date(now.getTime() + Number(step.delay_minutes || 0) * 60 * 1000).toISOString();
      statements.push(env.DB.prepare(`
        INSERT OR IGNORE INTO contact_journey_events (id, enrollment_id, step_id, candidate_id, channel, status, scheduled_at, created_at, updated_at)
        SELECT ?, e.id, ?, ?, ?, 'queued', ?, ?, ? FROM contact_journey_enrollments e
        WHERE e.journey_id = ? AND e.candidate_id = ? AND e.test_id = ?
      `).bind(crypto.randomUUID(), step.id, candidate.id, step.channel, scheduledAt, now.toISOString(), now.toISOString(), journey.id, candidate.id, journey.test_id));
    }
    enrolled += 1;
  }
  if (statements.length) await env.DB.batch(statements);
  await audit(env, user.email, 'contact_journey_enrolled', 'contact_journey', journey.id, { enrolled, listId: journey.list_id, testId: journey.test_id });
  const work = processDueJourneyEvents(env);
  if (context?.waitUntil) context.waitUntil(work);
  else work.catch(() => {});
  return json({ journeyId: journey.id, enrolled, journeys: await listContactJourneys(env, user) }, 202);
}

async function processDueJourneyEvent(env, row, origin) {
  const claimedAt = new Date().toISOString();
  const claimed = await env.DB.prepare(`
    UPDATE contact_journey_events SET status = 'sending', attempt_count = attempt_count + 1, error_code = NULL, updated_at = ?
    WHERE id = ? AND status = 'queued'
  `).bind(claimedAt, row.event_id).run();
  if (!Number(claimed.meta?.changes || 0)) return;
  const user = { id: row.user_id, email: row.user_email, name: row.user_name, role: row.user_role, companyId: row.user_company_id, status: 'active' };
  const candidate = {
    id: row.candidate_id, company_id: row.company_id, owner_user_id: row.owner_user_id, email: row.email, name: row.name,
    phone: row.phone, role: row.role, site: row.site, candidate_brand_name: row.candidate_brand_name,
  };
  const test = { id: row.test_id, slug: row.test_slug, name_en: row.test_name_en, name_es: row.test_name_es, engine_key: row.engine_key, status: row.test_status };
  const step = {
    brevo_template_id: row.brevo_template_id, message_en: row.message_en, message_es: row.message_es,
    subject_en: row.subject_en, subject_es: row.subject_es,
  };
  const completed = await env.DB.prepare(`SELECT id FROM assessments WHERE candidate_id = ? AND test_id = ? LIMIT 1`).bind(candidate.id, test.id).first();
  if (completed) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE contact_journey_events SET status = 'skipped', error_code = 'assessment_completed', updated_at = ? WHERE id = ?`).bind(claimedAt, row.event_id),
      env.DB.prepare(`UPDATE contact_journey_enrollments SET status = 'completed', completed_at = ?, stopped_reason = 'assessment_completed' WHERE id = ?`).bind(claimedAt, row.enrollment_id),
    ]);
    return;
  }
  try {
    const sent = await sendInvitationForCandidate({
      env, user, candidate, test, locale: row.locale, origin, listId: row.list_id, idempotencyKey: row.event_id, channel: row.channel, step,
    });
    await env.DB.prepare(`
      UPDATE contact_journey_events SET status = 'accepted', invitation_id = ?, provider_message_id = ?, sent_at = ?, error_code = NULL, updated_at = ? WHERE id = ?
    `).bind(sent.invitationId, sent.providerMessageId, claimedAt, claimedAt, row.event_id).run();
  } catch (error) {
    await env.DB.prepare(`
      UPDATE contact_journey_events SET status = 'failed', invitation_id = ?, error_code = ?, updated_at = ? WHERE id = ?
    `).bind(error.invitationId || null, cleanText(error.message, 120) || 'delivery_failed', new Date().toISOString(), row.event_id).run();
  }
}

async function processDueJourneyEvents(env) {
  await ensureSchema(env);
  const origin = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '');
  const now = new Date().toISOString();
  const rows = await env.DB.prepare(`
    SELECT ev.id AS event_id, ev.enrollment_id, ev.channel, e.journey_id,
      j.list_id, j.locale, j.company_id, COALESCE(co.candidate_brand_name, co.name) AS candidate_brand_name,
      s.brevo_template_id, s.subject_en, s.subject_es, s.message_en, s.message_es,
      c.id AS candidate_id, c.owner_user_id, c.email, c.name, c.phone, c.role, c.site,
      t.id AS test_id, t.slug AS test_slug, t.name_en AS test_name_en, t.name_es AS test_name_es, t.engine_key, t.status AS test_status,
      u.id AS user_id, u.email AS user_email, u.name AS user_name, u.role AS user_role, u.company_id AS user_company_id
    FROM contact_journey_events ev
    JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id
    JOIN contact_journeys j ON j.id = e.journey_id
    JOIN contact_journey_steps s ON s.id = ev.step_id
    JOIN candidates c ON c.id = ev.candidate_id
    JOIN companies co ON co.id = j.company_id
    JOIN assessment_tests t ON t.id = j.test_id
    JOIN users u ON u.id = j.created_by_user_id
    WHERE ev.status = 'queued' AND ev.scheduled_at <= ? AND e.status = 'active' AND j.status = 'active'
    ORDER BY ev.scheduled_at LIMIT 25
  `).bind(now).all();
  for (const row of rows.results || []) await processDueJourneyEvent(env, row, origin);
  return { processed: (rows.results || []).length };
}

async function recoverAsyncWork(env) {
  await ensureSchema(env);
  const origin = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '');
  const batches = await env.DB.prepare(`
    SELECT b.id, u.id AS user_id, u.email, u.name, u.role, u.company_id
    FROM send_batches b JOIN users u ON u.id = b.created_by_user_id
    WHERE b.status IN ('queued', 'processing') ORDER BY b.created_at LIMIT 5
  `).all();
  for (const row of batches.results || []) {
    const user = { id: row.user_id, email: row.email, name: row.name, role: row.role, companyId: row.company_id };
    await processSendBatch(env, user, row.id, origin);
  }

  const staleCutoff = new Date(Date.now() - AI_STALE_PROCESSING_MS).toISOString();
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE ai_analyses SET status = 'failed', error_code = 'retry_limit_reached', next_retry_at = NULL, updated_at = ?
    WHERE status IN ('queued', 'processing') AND provider_response_id IS NULL AND attempt_count >= ? AND updated_at < ?
  `).bind(now, AI_MAX_ATTEMPTS, staleCutoff).run();
  const analyses = await env.DB.prepare(`
    SELECT assessment_id, requested_by_email FROM ai_analyses
    WHERE (status = 'processing' AND provider_response_id IS NOT NULL)
      OR (attempt_count < ? AND ((status = 'queued' AND (next_retry_at IS NULL OR next_retry_at <= ?)) OR (status = 'processing' AND updated_at < ?)))
    ORDER BY updated_at LIMIT 2
  `).bind(AI_MAX_ATTEMPTS, now, staleCutoff).all();
  await Promise.all((analyses.results || []).map((row) => generateAndStoreAiAnalysis(env, row.assessment_id, row.requested_by_email)));
}

async function listCompanies(env, user) {
  if (!isSuperAdmin(user)) return [];
  const result = await env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.status = 'active') AS user_count, (SELECT COUNT(*) FROM candidates ca WHERE ca.company_id = c.id) AS candidate_count FROM companies c ORDER BY c.name`).all();
  return result.results || [];
}

async function listUsers(env, user) {
  if (!isSuperAdmin(user)) return json({ error: 'Only the super administrator can manage users.' }, 403);
  const result = await env.DB.prepare(`SELECT u.id, u.company_id, u.email, u.name, u.role, u.status, u.requested_company_name, u.approved_at, u.last_login_at, u.created_at, u.updated_at, c.name AS company_name FROM users u LEFT JOIN companies c ON c.id = u.company_id ORDER BY CASE u.status WHEN 'pending' THEN 0 ELSE 1 END, u.created_at DESC`).all();
  return json({ users: result.results || [], companies: await listCompanies(env, user) });
}

async function updateUser(request, env, user, targetUserId) {
  if (!isSuperAdmin(user)) return json({ error: 'Only the super administrator can manage users.' }, 403);
  const target = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(targetUserId).first();
  if (!target) return json({ error: 'User not found.' }, 404);
  if (target.role === 'super_admin') return json({ error: 'Protected super administrator accounts cannot be reassigned here.' }, 403);
  const body = await request.json().catch(() => ({}));
  const status = ['active', 'suspended', 'rejected'].includes(body.status) ? body.status : target.status;
  const role = ['recruiter', 'admin'].includes(body.role) ? body.role : target.role;
  let companyId = cleanText(body.companyId, 100) || target.company_id;
  const companyName = cleanText(body.companyName, 140) || target.requested_company_name;
  if (status === 'active' && !companyId && companyName) {
    const existing = await env.DB.prepare(`SELECT id FROM companies WHERE lower(name) = lower(?)`).bind(companyName).first();
    companyId = existing?.id || crypto.randomUUID();
    if (!existing) {
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO companies (id, name, status, created_at, updated_at) VALUES (?, ?, 'active', ?, ?)`).bind(companyId, companyName, now, now).run();
    }
  }
  if (status === 'active' && !companyId) return json({ error: 'Assign a company before approving this user.' }, 422);
  if (companyId) {
    const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
    if (!company) return json({ error: 'Company not found.' }, 404);
  }
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE users SET company_id = ?, role = ?, status = ?, approved_by = ?, approved_at = CASE WHEN ? = 'active' THEN COALESCE(approved_at, ?) ELSE approved_at END, updated_at = ? WHERE id = ?`)
    .bind(companyId || null, role, status, user.id, status, now, now, targetUserId).run();
  if (status !== 'active') await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`).bind(now, targetUserId).run();
  await audit(env, user.email, 'user_access_updated', 'user', targetUserId, { status, role, companyId });
  if (target.status !== 'active' && status === 'active') {
    const company = await env.DB.prepare(`SELECT name FROM companies WHERE id = ?`).bind(companyId).first();
    try {
      const provider = await sendAccountApprovedEmail(request, env, target, company?.name || companyName, role);
      await audit(env, user.email, 'user_approval_email_sent', 'user', targetUserId, { providerMessageId: provider.id });
    } catch (error) {
      await audit(env, user.email, 'user_approval_email_failed', 'user', targetUserId, { errorCode: error.message });
    }
  }
  return listUsers(env, user);
}

async function adminSendPasswordReset(request, env, user, targetUserId) {
  if (!isSuperAdmin(user)) return json({ error: 'Only the super administrator can send password reset links.' }, 403);
  const target = await env.DB.prepare(`SELECT id, email, name, status, role FROM users WHERE id = ?`).bind(targetUserId).first();
  if (!target) return json({ error: 'User not found.' }, 404);
  if (target.status !== 'active') return json({ error: 'Activate the account before sending a password reset link.' }, 422);
  if (!await rateLimit(env, request, 'admin_password_reset', target.email, 5, 60 * 60)) {
    return json({ error: 'Too many reset links were requested for this account. Try again later.', code: 'rate_limited' }, 429);
  }
  try {
    const provider = await issuePasswordReset(request, env, target, user);
    return json({ sent: true, providerMessageId: provider.id });
  } catch (error) {
    return json({ error: error.providerMessage || 'The password reset email could not be sent.', code: error.message }, error.providerStatus || 502);
  }
}

function normalizedBrevoEvent(value) {
  return cleanText(value, 80).replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[ -]+/g, '_').toLowerCase() || 'unknown';
}

function brevoInvitationId(eventData) {
  const custom = cleanText(eventData['X-Mailin-custom'] || eventData['x-mailin-custom'], 500);
  return cleanText(custom.match(/(?:^|\|)invitation_id:([^|]+)/)?.[1], 100) || null;
}

function brevoInvitationStatus(eventType) {
  if (['request', 'requests', 'sent'].includes(eventType)) return 'accepted';
  if (eventType === 'delivered') return 'delivered';
  if (['deferred', 'soft_bounce', 'soft_bounces'].includes(eventType)) return 'deferred';
  if (['hard_bounce', 'hard_bounces'].includes(eventType)) return 'hard_bounce';
  if (['invalid', 'invalid_email'].includes(eventType)) return 'invalid_email';
  if (['spam', 'spam_reports'].includes(eventType)) return 'complained';
  if (['blocked', 'unsubscribed', 'error'].includes(eventType)) return eventType;
  return null;
}

async function storeBrevoEvent(env, eventData, invitationIdHint = null) {
  if (!eventData || typeof eventData !== 'object') return { stored: false, invitationId: null, status: null };
  const eventType = normalizedBrevoEvent(eventData.event);
  const rawMessageId = cleanText(eventData['message-id'] || eventData.messageId, 300);
  const normalizedMessageId = normalizedProviderMessageId(rawMessageId);
  let invitationId = cleanText(invitationIdHint, 100) || brevoInvitationId(eventData);
  if (!invitationId && normalizedMessageId) {
    const invitation = await env.DB.prepare(`
      SELECT id FROM invitations
      WHERE replace(replace(provider_message_id, '<', ''), '>', '') = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(normalizedMessageId).first();
    invitationId = invitation?.id || null;
  }
  const severity = cleanText(eventData.reason || eventData.code, 160) || null;
  const providerTimestamp = String(eventData.ts_event || eventData.ts_epoch || eventData.ts || eventData.date || '');
  const eventDate = Date.parse(String(eventData.date || ''));
  const createdAt = Number.isFinite(eventDate) ? new Date(eventDate).toISOString() : new Date().toISOString();
  const existing = await env.DB.prepare(`
    SELECT id FROM email_events
    WHERE COALESCE(invitation_id, '') = COALESCE(?, '') AND event_type = ? AND provider_timestamp = ?
      AND replace(replace(COALESCE(provider_message_id, ''), '<', ''), '>', '') = ?
    LIMIT 1
  `).bind(invitationId, eventType, providerTimestamp, normalizedMessageId).first();
  if (!existing) {
    await env.DB.prepare(`INSERT INTO email_events (id, invitation_id, provider_message_id, event_type, severity, provider_timestamp, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), invitationId, rawMessageId || null, eventType, severity, providerTimestamp, JSON.stringify(eventData), createdAt).run();
  }
  const invitationStatus = brevoInvitationStatus(eventType);
  if (invitationId && invitationStatus === 'delivered') {
    await env.DB.prepare(`UPDATE invitations SET status = 'delivered', delivered_at = COALESCE(delivered_at, ?) WHERE id = ? AND status <> 'completed'`)
      .bind(createdAt, invitationId).run();
  } else if (invitationId && invitationStatus === 'accepted') {
    await env.DB.prepare(`UPDATE invitations SET status = 'accepted' WHERE id = ? AND status NOT IN ('completed', 'delivered', 'deferred', 'hard_bounce', 'invalid_email', 'blocked', 'complained', 'unsubscribed')`)
      .bind(invitationId).run();
  } else if (invitationId && invitationStatus === 'deferred') {
    await env.DB.prepare(`UPDATE invitations SET status = 'deferred' WHERE id = ? AND status NOT IN ('completed', 'delivered', 'hard_bounce', 'invalid_email', 'blocked', 'complained', 'unsubscribed')`)
      .bind(invitationId).run();
  } else if (invitationId && invitationStatus) {
    await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ? AND status NOT IN ('completed', 'delivered')`)
      .bind(invitationStatus, invitationId).run();
  }
  return { stored: !existing, invitationId, status: invitationStatus, eventType };
}

function brevoDeliverySummary(events, blockedRecipient, messageFound) {
  const normalizedEvents = (events || []).map((event) => ({
    event: normalizedBrevoEvent(event.event),
    date: cleanText(event.date, 80) || null,
    reason: cleanText(event.reason || event.code, 240) || null,
  }));
  const latest = [...normalizedEvents].sort((left, right) => Date.parse(right.date || 0) - Date.parse(left.date || 0))[0] || null;
  const delivered = normalizedEvents.find((event) => event.event === 'delivered');
  const failure = normalizedEvents.find((event) => ['hard_bounce', 'hard_bounces', 'invalid', 'invalid_email', 'blocked', 'spam', 'spam_reports', 'unsubscribed', 'error'].includes(event.event));
  const deferred = normalizedEvents.find((event) => ['deferred', 'soft_bounce', 'soft_bounces'].includes(event.event));
  if (blockedRecipient?.blocked) return { status: 'blocked', reason: blockedRecipient.reason || failure?.reason || 'Recipient is blocklisted in Brevo.' };
  if (delivered) return { status: 'delivered', reason: null };
  if (failure) return { status: brevoInvitationStatus(failure.event) || 'failed', reason: failure.reason || 'Brevo reported a delivery failure.' };
  if (deferred) return { status: 'deferred', reason: deferred.reason || 'The recipient server temporarily delayed the message.' };
  if (messageFound || normalizedEvents.some((event) => ['request', 'requests', 'sent'].includes(event.event))) return { status: 'pending', reason: latest?.reason || null };
  return { status: 'not_found', reason: null };
}

async function checkCandidateEmailDelivery(request, env, user, candidateId) {
  const config = emailConfig(env);
  if (!config.apiConfigured) return json({ error: 'Brevo API access is required to check delivery.', code: 'brevo_api_not_configured' }, 503);
  const scope = candidateScope(user, 'c');
  const invitation = await env.DB.prepare(`
    SELECT i.id, i.status, i.provider_message_id, i.created_at, i.delivered_at, c.id AS candidate_id, c.name, c.email
    FROM candidates c JOIN invitations i ON i.candidate_id = c.id
    WHERE c.id = ? AND ${scope.sql}
    ORDER BY i.created_at DESC LIMIT 1
  `).bind(candidateId, ...scope.bindings).first();
  if (!invitation) return json({ error: 'No invitation was found for this candidate.', code: 'invitation_not_found' }, 404);
  if (!invitation.provider_message_id) return json({ error: 'The latest invitation has no Brevo message ID.', code: 'provider_message_missing' }, 409);
  const messageId = cleanText(invitation.provider_message_id, 300);
  const normalizedMessageId = normalizedProviderMessageId(messageId);
  let [messageResult, eventsResult, recipientMessagesResult, recipientEventsResult, blockedResult] = await Promise.all([
    brevoDiagnosticRequest(config, `/smtp/emails?messageId=${encodeURIComponent(messageId)}&limit=10`),
    brevoDiagnosticRequest(config, `/smtp/statistics/events?messageId=${encodeURIComponent(messageId)}&limit=100&sort=desc`),
    brevoDiagnosticRequest(config, `/smtp/emails?email=${encodeURIComponent(invitation.email)}&limit=50&sort=desc`),
    brevoDiagnosticRequest(config, `/smtp/statistics/events?email=${encodeURIComponent(invitation.email)}&days=7&limit=100&sort=desc`),
    brevoBlockedRecipient(config, invitation.email)
      .then((body) => ({ ok: true, body, error: null }))
      .catch((error) => ({ ok: false, body: { checked: false, blocked: false }, error: { code: cleanText(error.message, 100), message: cleanText(error.providerMessage, 300), status: Number(error.providerStatus || 0) || null } })),
  ]);
  if (normalizedMessageId !== messageId && Number(messageResult.body?.count || 0) === 0 && !(eventsResult.body?.events || []).length) {
    const [normalizedMessages, normalizedEvents] = await Promise.all([
      brevoDiagnosticRequest(config, `/smtp/emails?messageId=${encodeURIComponent(normalizedMessageId)}&limit=10`),
      brevoDiagnosticRequest(config, `/smtp/statistics/events?messageId=${encodeURIComponent(normalizedMessageId)}&limit=100&sort=desc`),
    ]);
    if (normalizedMessages.ok && Number(normalizedMessages.body?.count || 0) > 0) messageResult = normalizedMessages;
    if (normalizedEvents.ok && (normalizedEvents.body?.events || []).length) eventsResult = normalizedEvents;
  }
  if (!messageResult.ok && !eventsResult.ok) {
    const providerError = eventsResult.error || messageResult.error;
    return json({ error: providerError?.message || 'Brevo delivery status could not be checked.', code: providerError?.code || 'brevo_diagnostics_failed' }, providerError?.status || 502);
  }
  const recipientMessages = (recipientMessagesResult.body?.transactionalEmails || []).filter((entry) => normalizedProviderMessageId(entry.messageId) === normalizedMessageId);
  const recipientEvents = (recipientEventsResult.body?.events || []).filter((event) => normalizedProviderMessageId(event.messageId) === normalizedMessageId);
  const localEventResult = await env.DB.prepare(`
    SELECT event_type AS event, created_at AS date, severity AS reason
    FROM email_events WHERE invitation_id = ? ORDER BY created_at DESC LIMIT 100
  `).bind(invitation.id).all();
  const localEvents = localEventResult.results || [];
  const remoteProviderEvents = (eventsResult.body?.events || []).length ? eventsResult.body.events : recipientEvents;
  const providerEvents = remoteProviderEvents.length ? remoteProviderEvents : localEvents;
  for (const event of remoteProviderEvents) await storeBrevoEvent(env, event, invitation.id);
  const refreshed = await env.DB.prepare(`SELECT status, delivered_at FROM invitations WHERE id = ?`).bind(invitation.id).first();
  const messageFound = Number(messageResult.body?.count || 0) > 0 || recipientMessages.length > 0 || localEvents.length > 0;
  const summary = brevoDeliverySummary(providerEvents, blockedResult.body, messageFound);
  const ageMinutes = Math.max(0, Math.round((Date.now() - Date.parse(invitation.created_at)) / 60000));
  const messages = {
    delivered: 'Brevo confirmed delivery to the recipient mail server.',
    pending: ageMinutes >= 15
      ? 'Brevo accepted the email but has not confirmed delivery. Ask the candidate to check Junk and the Outlook Other tab before resending or using an alternate verified address.'
      : 'Brevo accepted the email and delivery confirmation is still pending.',
    deferred: 'The recipient mail server temporarily delayed the email. Gazelle will continue reconciling Brevo events.',
    blocked: 'Brevo has this recipient on a blocklist. Resolve the block in Brevo or use a verified alternate address before resending.',
    hard_bounce: 'The recipient server permanently rejected this address. Correct the email or use a verified alternate address.',
    invalid_email: 'Brevo marked the recipient address as invalid. Correct it before resending.',
    complained: 'The recipient reported a previous message as spam. Do not resend without confirming consent.',
    unsubscribed: 'The recipient is unsubscribed in Brevo. Resolve the recipient status before resending.',
    not_found: 'Brevo did not return a transaction for this message ID. Review the provider configuration before resending.',
  };
  await audit(env, user.email, 'candidate_email_delivery_checked', 'invitation', invitation.id, { candidateId, providerStatus: summary.status, messageFound, eventCount: providerEvents.length });
  return json({
    candidateId,
    invitationId: invitation.id,
    recipient: invitation.email,
    provider: 'Brevo',
    status: summary.status,
    invitationStatus: refreshed?.status || invitation.status,
    message: messages[summary.status] || 'Brevo returned a delivery status that requires review.',
    reason: summary.reason,
    messageFound,
    ageMinutes,
    deliveredAt: refreshed?.delivered_at || invitation.delivered_at || null,
    blocked: Boolean(blockedResult.body?.blocked),
    events: providerEvents.slice(0, 20).map((event) => ({ event: normalizedBrevoEvent(event.event), date: cleanText(event.date, 80) || null, reason: cleanText(event.reason, 240) || null })),
    errors: [messageResult, eventsResult, recipientMessagesResult, recipientEventsResult, blockedResult].filter((result) => !result.ok && result.error).map((result) => result.error),
  });
}

async function reconcilePendingEmailDelivery(env) {
  const config = emailConfig(env);
  if (!config.apiConfigured) return { checked: 0, matched: 0, stored: 0 };
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pending = await env.DB.prepare(`
    SELECT id, provider_message_id FROM invitations
    WHERE provider_message_id IS NOT NULL AND status IN ('accepted', 'deferred') AND created_at >= ?
    ORDER BY created_at DESC LIMIT 500
  `).bind(cutoff).all();
  const rows = pending.results || [];
  if (!rows.length) return { checked: 0, matched: 0, stored: 0 };
  const activity = await brevoDiagnosticRequest(config, '/smtp/statistics/events?days=7&limit=5000&sort=desc');
  if (!activity.ok) return { checked: rows.length, matched: 0, stored: 0, error: activity.error };
  const invitationByMessageId = new Map(rows.map((row) => [normalizedProviderMessageId(row.provider_message_id), row.id]));
  let matched = 0;
  let stored = 0;
  for (const event of activity.body?.events || []) {
    const invitationId = invitationByMessageId.get(normalizedProviderMessageId(event.messageId));
    if (!invitationId) continue;
    matched += 1;
    const result = await storeBrevoEvent(env, event, invitationId);
    if (result.stored) stored += 1;
  }
  return { checked: rows.length, matched, stored };
}

async function handleBrevoWebhook(request, env) {
  const config = emailConfig(env);
  if (!config.webhookConfigured) return json({ error: 'Brevo webhook authentication is not configured.' }, 503);
  const authorization = String(request.headers.get('authorization') || '');
  const secretHeader = String(request.headers.get('x-gazelle-webhook-token') || '');
  if (!constantTimeEqual(authorization, `Bearer ${config.webhookToken}`) && !constantTimeEqual(secretHeader, config.webhookToken)) {
    return json({ error: 'Invalid webhook authorization.' }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid webhook payload.' }, 400);
  const events = Array.isArray(body) ? body : Array.isArray(body.events) ? body.events : [body];
  if (!events.length || events.length > 1000) return json({ error: 'Invalid webhook event count.' }, 422);
  await ensureSchema(env);
  let received = 0;
  for (const eventData of events) {
    if (!eventData || typeof eventData !== 'object') continue;
    await storeBrevoEvent(env, eventData);
    received += 1;
  }
  return json({ received: true, eventCount: received });
}

function deepValue(object, path) {
  return path.split('.').reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, object);
}

function firstDeepText(object, paths, max = 500) {
  for (const path of paths) {
    const value = deepValue(object, path);
    if (typeof value === 'string' || typeof value === 'number') {
      const text = cleanText(value, max);
      if (text) return text;
    }
    if (value && typeof value === 'object') {
      const nested = cleanText(value.number || value.phoneNumber || value.address || value.id || value.text, max);
      if (nested) return nested;
    }
  }
  return '';
}

function infobipInboundEvents(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.messages)) return body.messages;
  if (Array.isArray(body?.events)) return body.events;
  return body && typeof body === 'object' ? [body] : [];
}

async function communicationRecorderForCandidate(env, candidate) {
  if (candidate.owner_user_id) return candidate.owner_user_id;
  const user = await env.DB.prepare(`
    SELECT id FROM users
    WHERE status = 'active' AND (company_id = ? OR role = 'super_admin')
    ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'super_admin' THEN 2 ELSE 3 END, created_at ASC
    LIMIT 1
  `).bind(candidate.company_id).first();
  return user?.id || null;
}

async function handleInfobipWebhook(request, env) {
  const config = infobipConfig(env);
  const url = new URL(request.url);
  const configuredToken = config.webhookToken;
  if (configuredToken) {
    const authorization = String(request.headers.get('authorization') || '');
    const secretHeader = String(request.headers.get('x-gazelle-webhook-token') || '');
    const queryToken = String(url.searchParams.get('token') || '');
    if (!constantTimeEqual(authorization, `Bearer ${configuredToken}`) && !constantTimeEqual(secretHeader, configuredToken) && !constantTimeEqual(queryToken, configuredToken)) {
      return json({ error: 'Invalid Infobip webhook authorization.' }, 401);
    }
  }
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid webhook payload.' }, 400);
  await ensureSchema(env);
  const events = infobipInboundEvents(body).slice(0, 100);
  const phoneExpression = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(c.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')`;
  let received = 0;
  let matched = 0;
  for (const eventData of events) {
    const from = cleanPhoneDigits(firstDeepText(eventData, ['from', 'sender', 'senderAddress', 'contact.from', 'message.from', 'message.sender', 'waId', 'identity.phoneNumber'], 80));
    const text = firstDeepText(eventData, ['text', 'message.text', 'message.content.text', 'content.text', 'content.body.text', 'message.body', 'body.text'], 1200);
    const messageId = firstDeepText(eventData, ['messageId', 'message.id', 'id', 'callbackData'], 160);
    if (!from && !text) continue;
    received += 1;
    if (from.length < 7) {
      await audit(env, 'infobip-webhook', 'infobip_inbound_unmatched', 'whatsapp_message', messageId || crypto.randomUUID(), { from, text: cleanText(text, 200), reason: 'missing_or_short_phone' });
      continue;
    }
    const candidate = await env.DB.prepare(`
      SELECT c.id, c.company_id, c.owner_user_id, c.name, c.phone
      FROM candidates c
      WHERE c.phone IS NOT NULL AND (${phoneExpression} = ? OR ? LIKE '%' || ${phoneExpression} OR ${phoneExpression} LIKE '%' || ?)
      ORDER BY c.updated_at DESC LIMIT 1
    `).bind(from, from, from).first();
    if (!candidate) {
      await audit(env, 'infobip-webhook', 'infobip_inbound_unmatched', 'whatsapp_message', messageId || crypto.randomUUID(), { from, text: cleanText(text, 200), reason: 'candidate_phone_not_found' });
      continue;
    }
    const recorderId = await communicationRecorderForCandidate(env, candidate);
    if (!recorderId) {
      await audit(env, 'infobip-webhook', 'infobip_inbound_unmatched', 'candidate', candidate.id, { from, text: cleanText(text, 200), reason: 'no_active_recorder' });
      continue;
    }
    const now = new Date().toISOString();
    const message = text || '[non-text WhatsApp reply received]';
    await env.DB.prepare(`
      INSERT INTO candidate_communications (id, candidate_id, created_by_user_id, channel, subject_en, subject_es, message_en, message_es, visible_to_candidate, provider_message_id, created_at)
      VALUES (?, ?, ?, 'whatsapp', ?, ?, ?, ?, 0, ?, ?)
    `).bind(crypto.randomUUID(), candidate.id, recorderId, 'Inbound WhatsApp reply', 'Respuesta entrante de WhatsApp', message, message, messageId || null, now).run();
    const enrollments = await env.DB.prepare(`
      SELECT id FROM contact_journey_enrollments WHERE candidate_id = ? AND status = 'active'
    `).bind(candidate.id).all();
    const enrollmentIds = (enrollments.results || []).map((entry) => entry.id);
    if (enrollmentIds.length) {
      await env.DB.batch(enrollmentIds.flatMap((enrollmentId) => [
        env.DB.prepare(`UPDATE contact_journey_enrollments SET status = 'stopped', completed_at = ?, stopped_reason = 'candidate_replied' WHERE id = ?`).bind(now, enrollmentId),
        env.DB.prepare(`UPDATE contact_journey_events SET status = 'skipped', error_code = 'candidate_replied', updated_at = ? WHERE enrollment_id = ? AND status = 'queued'`).bind(now, enrollmentId),
      ]));
    }
    await audit(env, 'infobip-webhook', 'candidate_whatsapp_reply_received', 'candidate', candidate.id, { from, providerMessageId: messageId || null, text: cleanText(message, 240) });
    matched += 1;
  }
  return json({ received: true, eventCount: received, matched });
}

async function handleApi(request, env, context) {
  const url = new URL(request.url);
  if (url.pathname === '/api/brevo/webhook' && request.method === 'POST') return handleBrevoWebhook(request, env);
  if (url.pathname === '/api/infobip/webhook' && request.method === 'POST') return handleInfobipWebhook(request, env);
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  await ensureSchema(env);
  if (url.pathname === '/api/auth/bootstrap-status' && request.method === 'GET') {
    const row = await env.DB.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE AND role = 'super_admin' AND status = 'active'`).bind(OWNER_EMAIL).first();
    return json({ ownerSetupRequired: !row, ownerEmail: OWNER_EMAIL, registrationOpen: true });
  }
  if (url.pathname === '/api/auth/signup' && request.method === 'POST') return signUp(request, env);
  if (url.pathname === '/api/auth/login' && request.method === 'POST') return logIn(request, env);
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') return logOut(request, env);
  if (url.pathname === '/api/auth/password-reset/request' && request.method === 'POST') return requestPasswordReset(request, env);
  if (url.pathname === '/api/auth/password-reset/confirm' && request.method === 'POST') return confirmPasswordReset(request, env);
  if (url.pathname === '/api/candidate/portal' && request.method === 'GET') return candidatePortalData(request, env);
  if (url.pathname === '/api/candidate/auth/signup' && request.method === 'POST') return candidateSignUp(request, env);
  if (url.pathname === '/api/candidate/auth/login' && request.method === 'POST') return candidateLogIn(request, env);
  if (url.pathname === '/api/candidate/auth/logout' && request.method === 'POST') return candidateLogOut(request, env);
  if (url.pathname === '/api/candidate/auth/google' && request.method === 'GET') return startCandidateGoogleOAuth(request, env);
  if (url.pathname === '/api/candidate/auth/google/callback' && request.method === 'GET') return finishCandidateGoogleOAuth(request, env);
  const candidateAccount = await authenticatedCandidate(request, env);
  if (url.pathname === '/api/candidate/locale' && request.method === 'POST') {
    if (!candidateAccount) return json({ error: 'Candidate sign-in is required.', code: 'candidate_authentication_required' }, 401);
    return updateCandidateLocale(request, env, candidateAccount);
  }
  if (url.pathname === '/api/candidate/referrals' && request.method === 'POST') {
    if (!candidateAccount) return json({ error: 'Create or sign in to your candidate account first.', code: 'candidate_authentication_required' }, 401);
    return createCandidateReferral(request, env, candidateAccount);
  }
  const candidateInvitationMatch = url.pathname.match(/^\/api\/candidate\/invitations\/([^/]+)\/start$/);
  if (candidateInvitationMatch && request.method === 'POST') {
    if (!candidateAccount) return json({ error: 'Candidate sign-in is required.', code: 'candidate_authentication_required' }, 401);
    return startCandidateInvitation(request, env, candidateAccount, cleanText(candidateInvitationMatch[1], 100));
  }
  if (url.pathname === '/api/assessment' && request.method === 'GET') { await ensureSchema(env); return getInvitation(request, env); }
  if (url.pathname === '/api/assessment/scenarios' && request.method === 'POST') { await ensureSchema(env); return createScenarioQuestions(request, env); }
  if (url.pathname === '/api/assessment/submit' && request.method === 'POST') { await ensureSchema(env); return submitAssessment(request, env, context); }

  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'Sign in is required.', code: 'authentication_required' }, 401, { 'set-cookie': clearSessionCookie() });
  if (url.pathname === '/api/auth/me' && request.method === 'GET') return json({ user });
  if (url.pathname === '/api/auth/password' && request.method === 'POST') return changePassword(request, env, user);
  if (url.pathname === '/api/brevo/configure-webhook' && request.method === 'POST') return configureBrevoWebhook(request, env, user);
  if (url.pathname === '/api/admin/email-diagnostics' && request.method === 'GET') return emailDeliveryDiagnostics(request, env, user);
  if (url.pathname === '/api/health' && request.method === 'GET') {
    const email = emailConfig(env);
    const ai = aiConfig(env);
    const messaging = contactabilityConfig(env);
    const whatsappTemplate = messaging.whatsapp.providerKey === 'infobip'
      ? await infobipWhatsAppTemplateStatus(env).catch((error) => ({
        configured: messaging.whatsapp.configured,
        sendable: false,
        templateName: messaging.whatsapp.templateName,
        language: messaging.whatsapp.templateLanguage,
        status: null,
        missing: messaging.whatsapp.missing,
        error: cleanText(error.providerMessage || error.message || 'Infobip template status could not be checked.', 300),
      }))
      : null;
    return json({
      database: true,
      publicBaseUrl: cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '') || url.origin,
      email: {
        configured: email.configured,
        sendingConfigured: email.sendingConfigured,
        webhookConfigured: email.webhookConfigured,
        provider: 'Brevo',
        transport: email.transport,
        apiConfigured: email.apiConfigured,
        smtpConfigured: email.smtpConfigured,
        senderEmail: email.senderEmail || null,
        senderName: email.senderName,
      },
      messaging: {
        defaultCountryCode: messaging.defaultCountryCode,
        whatsapp: {
          configured: messaging.whatsapp.configured,
          provider: messaging.whatsapp.provider,
          providerKey: messaging.whatsapp.providerKey,
          senderNumber: messaging.whatsapp.senderNumber,
          templateId: messaging.whatsapp.templateId,
          templateName: messaging.whatsapp.templateName,
          templateLanguage: messaging.whatsapp.templateLanguage,
          linkPlacement: messaging.whatsapp.linkPlacement,
          templateStatus: whatsappTemplate,
          missing: messaging.whatsapp.missing,
        },
        sms: {
          configured: messaging.sms.configured,
          provider: messaging.sms.provider,
          providerKey: messaging.sms.providerKey,
          sender: messaging.sms.sender,
          missing: messaging.sms.missing,
        },
      },
      ai: { configured: ai.configured, provider: ai.provider, providerKey: ai.providerKey, model: ai.model, background: ai.background, scenarioPromptVersion: GazelleAiAssessment.SCENARIO_PROMPT_VERSION, analysisPromptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION },
      candidatePortal: { enabled: true, googleConfigured: googleOAuthConfig(env).configured },
      assessmentVersion: GazelleAssessmentEngine.ASSESSMENT_VERSION,
      modelVersion: GazelleAssessmentEngine.MODEL_VERSION,
    });
  }
  if (url.pathname === '/api/candidates' && request.method === 'GET') return json({ candidates: await listCandidates(env, user) });
  if (url.pathname === '/api/results' && request.method === 'GET') return json({ results: await listAssessmentResults(env, user) });
  if (url.pathname === '/api/outcomes' && request.method === 'GET') return json(await listAssessmentOutcomes(env, user));
  if (url.pathname === '/api/outcomes' && request.method === 'POST') return recordAssessmentOutcome(request, env, user);
  if (url.pathname === '/api/candidates/import' && request.method === 'POST') return importCandidates(request, env, user);
  if (url.pathname === '/api/stages' && request.method === 'GET') return json({ stages: await listRecruitmentStages(env, user) });
  if (url.pathname === '/api/stages' && request.method === 'POST') return createRecruitmentStage(request, env, user);
  if (url.pathname === '/api/referrals' && request.method === 'GET') return json({ referrals: await listCandidateReferrals(env, user) });
  const referralMatch = url.pathname.match(/^\/api\/referrals\/([^/]+)$/);
  if (referralMatch && request.method === 'PATCH') return updateCandidateReferral(request, env, user, cleanText(referralMatch[1], 100));
  const candidateStageMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/stage$/);
  if (candidateStageMatch && request.method === 'PATCH') return updateCandidateStage(request, env, user, cleanText(candidateStageMatch[1], 100));
  const candidateContactMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/contact$/);
  if (candidateContactMatch && request.method === 'PATCH') return updateCandidateContact(request, env, user, cleanText(candidateContactMatch[1], 100));
  const candidateDeliveryMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/email-delivery\/check$/);
  if (candidateDeliveryMatch && request.method === 'POST') return checkCandidateEmailDelivery(request, env, user, cleanText(candidateDeliveryMatch[1], 100));
  const candidateCommunicationMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/communications$/);
  if (candidateCommunicationMatch && request.method === 'POST') return createCandidateCommunication(request, env, user, cleanText(candidateCommunicationMatch[1], 100));
  const candidateAttemptsMatch = url.pathname.match(/^\/api\/candidates\/([^/]+)\/attempts\/release$/);
  if (candidateAttemptsMatch && request.method === 'POST') return releaseCandidateAttempts(request, env, user, cleanText(candidateAttemptsMatch[1], 100));
  if (url.pathname === '/api/invitations' && request.method === 'POST') return createInvitation(request, env, user);
  if (url.pathname === '/api/invitations/resend-bulk' && request.method === 'POST') return createBulkResend(request, env, user, context);
  if (url.pathname === '/api/tests' && request.method === 'GET') return json({ tests: await listTests(env, user) });
  if (url.pathname === '/api/tests' && request.method === 'POST') return createTest(request, env, user);
  if (url.pathname === '/api/lists' && request.method === 'GET') return json({ lists: await listCandidateLists(env, user) });
  if (url.pathname === '/api/lists' && request.method === 'POST') return createCandidateList(request, env, user);
  const listMatch = url.pathname.match(/^\/api\/lists\/([^/]+)$/);
  if (listMatch && request.method === 'PATCH') return updateCandidateList(request, env, user, cleanText(listMatch[1], 100));
  if (url.pathname === '/api/journeys' && request.method === 'GET') return json({ journeys: await listContactJourneys(env, user) });
  if (url.pathname === '/api/journeys' && request.method === 'POST') return createContactJourney(request, env, user);
  const journeyEnrollMatch = url.pathname.match(/^\/api\/journeys\/([^/]+)\/enroll$/);
  if (journeyEnrollMatch && request.method === 'POST') return enrollContactJourney(request, env, user, cleanText(journeyEnrollMatch[1], 100), context);
  const journeyMatch = url.pathname.match(/^\/api\/journeys\/([^/]+)$/);
  if (journeyMatch && request.method === 'PATCH') return updateContactJourney(request, env, user, cleanText(journeyMatch[1], 100));
  if (url.pathname === '/api/batches' && request.method === 'GET') return json({ batches: await listSendBatches(env, user) });
  if (url.pathname === '/api/batches' && request.method === 'POST') return createSendBatch(request, env, user, context);
  if (url.pathname === '/api/admin/users' && request.method === 'GET') return listUsers(env, user);
  const userPasswordResetMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/password-reset$/);
  if (userPasswordResetMatch && request.method === 'POST') return adminSendPasswordReset(request, env, user, cleanText(userPasswordResetMatch[1], 100));
  const userMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userMatch && request.method === 'PATCH') return updateUser(request, env, user, cleanText(userMatch[1], 100));
  if (url.pathname === '/api/email/test' && request.method === 'POST') return sendTestEmail(request, env, user);
  if (url.pathname === '/api/preview/ai-analysis' && request.method === 'POST') return analyzePreview(request, env, user);
  const aiAnalysisMatch = url.pathname.match(/^\/api\/assessments\/([^/]+)\/ai-analysis$/);
  if (aiAnalysisMatch && request.method === 'POST') return regenerateAiAnalysis(env, user, cleanText(aiAnalysisMatch[1], 100), context);
  if (aiAnalysisMatch && request.method === 'PATCH') return advanceAiAnalysis(env, user, cleanText(aiAnalysisMatch[1], 100), context);
  return json({ error: 'API route not found.' }, 404);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, context);
      if (url.pathname === '/styles.css') return new Response(stylesAsset, { headers: assetHeaders('text/css; charset=utf-8') });
      if (url.pathname === '/assessment-engine.js') return new Response(engineAsset, { headers: assetHeaders('text/javascript; charset=utf-8') });
      if (url.pathname === '/ai-assessment.js') return new Response(aiAssessmentAsset, { headers: assetHeaders('text/javascript; charset=utf-8') });
      if (url.pathname === '/pdf-report.js') return new Response(pdfReportAsset, { headers: assetHeaders('text/javascript; charset=utf-8') });
      if (url.pathname === '/candidate-portal.js') return new Response(candidatePortalAsset, { headers: assetHeaders('text/javascript; charset=utf-8') });
      if (url.pathname === '/app.js') return new Response(appAsset, { headers: assetHeaders('text/javascript; charset=utf-8') });
      if (url.pathname === '/og.png' && ogAsset) return new Response(decodeAsset(ogAsset), { headers: assetHeaders('image/png', 'public, max-age=86400') });
      if (url.pathname === '/candidate-welcome.png' && candidateWelcomeAsset) return new Response(decodeAsset(candidateWelcomeAsset), { headers: assetHeaders('image/png', 'public, max-age=86400') });
      if (url.pathname === '/' || !url.pathname.includes('.')) return new Response(htmlAsset.replaceAll('__ORIGIN__', url.origin), { headers: assetHeaders('text/html; charset=utf-8', 'no-cache', true) });
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('gazelle_request_failed', { path: url.pathname, message: cleanText(error?.message, 160), stack: cleanText(error?.stack, 1200) });
      const code = error?.message === 'database_unavailable' ? 'database_unavailable' : 'server_error';
      return json({ error: code === 'database_unavailable' ? 'Persistent storage is not available.' : 'The request could not be completed.', code }, code === 'database_unavailable' ? 503 : 500);
    }
  },
  async scheduled(controller, env, context) {
    const work = [recoverAsyncWork(env), processDueJourneyEvents(env)];
    if (new Date(controller.scheduledTime).getUTCMinutes() % 5 === 0) work.push(reconcilePendingEmailDelivery(env));
    context.waitUntil(Promise.all(work));
  },
};
