/**
 * Recupera HTTP API — plain script for Worker concat (after stage.js).
 * Feature-flagged; does not affect Gazelle Hunt routes.
 */
const RECUPERA_PLAYBOOK_KEY = 'recupera';
const RECUPERA_PLAYBOOK_VERSION = '0.1.0';
const RECUPERA_OBLIGATIONS_DEFAULT_LIMIT = 200;
const RECUPERA_OBLIGATIONS_MAX_LIMIT = 200;
const RECUPERA_IMPORT_MAX_ROWS = 500;

function recuperaParsePlaybooksEnabled(json) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function recuperaGloballyEnabled(env) {
  return env.RECUPERA_ENABLED === 'true';
}

async function recuperaCompanyPlaybooksEnabled(env, companyId) {
  if (!companyId) return false;
  const row = await env.DB.prepare(`SELECT playbooks_enabled_json FROM companies WHERE id = ?`).bind(companyId).first();
  return recuperaParsePlaybooksEnabled(row?.playbooks_enabled_json).includes(RECUPERA_PLAYBOOK_KEY);
}

async function recuperaPlaybookEnabled(env, companyId) {
  if (recuperaGloballyEnabled(env)) return true;
  return recuperaCompanyPlaybooksEnabled(env, companyId);
}

function recuperaPlaybookDisabledResponse() {
  return json({ error: 'not_found', code: 'playbook_disabled' }, 404);
}

function recuperaTargetCompanyId(user, url, body = null) {
  if (isSuperAdmin(user)) {
    const fromQuery = cleanText(url.searchParams.get('companyId'), 100);
    if (fromQuery) return fromQuery;
    if (body && body.companyId) return cleanText(body.companyId, 100);
  }
  return user.companyId;
}

function recuperaMapInstallationRow(row) {
  if (!row) return null;
  let config = null;
  if (row.config_json) {
    try { config = JSON.parse(row.config_json); } catch { config = null; }
  }
  return {
    id: row.id,
    companyId: row.company_id,
    playbookKey: row.playbook_key,
    playbookVersion: row.playbook_version,
    status: row.status,
    config,
    installedByUserId: row.installed_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function recuperaMapObligationRow(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    payerName: row.payer_name,
    payerEmail: row.payer_email || null,
    payerPhone: row.payer_phone || null,
    reference: row.reference || null,
    description: row.description || null,
    currency: row.currency,
    amountCents: row.amount_cents,
    balanceCents: row.balance_cents,
    dueDate: row.due_date,
    stageKey: row.stage_key,
    strategyKey: row.strategy_key,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function recuperaMergePlaybooksEnabled(env, companyId) {
  const company = await env.DB.prepare(`SELECT playbooks_enabled_json FROM companies WHERE id = ?`).bind(companyId).first();
  const enabled = recuperaParsePlaybooksEnabled(company?.playbooks_enabled_json);
  if (enabled.includes(RECUPERA_PLAYBOOK_KEY)) return enabled;
  enabled.push(RECUPERA_PLAYBOOK_KEY);
  await env.DB.prepare(`UPDATE companies SET playbooks_enabled_json = ? WHERE id = ?`).bind(JSON.stringify(enabled), companyId).run();
  return enabled;
}

function recuperaValidateImportRow(row, index) {
  const payerName = cleanText(row?.payerName, 200);
  const amountCents = Number(row?.amountCents);
  const dueDate = cleanText(row?.dueDate, 20);
  const errors = [];
  if (!payerName) errors.push(`obligations[${index}].payerName is required`);
  if (!Number.isFinite(amountCents) || amountCents <= 0) errors.push(`obligations[${index}].amountCents must be greater than 0`);
  if (!recuperaIsoDateValid(dueDate)) errors.push(`obligations[${index}].dueDate must be a valid ISO date (YYYY-MM-DD)`);
  if (errors.length) return { errors };
  const balanceCents = Number.isFinite(Number(row?.balanceCents)) ? Number(row.balanceCents) : amountCents;
  return {
    payerName,
    payerEmail: cleanEmail(row?.payerEmail) || null,
    payerPhone: cleanText(row?.payerPhone, 40) || null,
    reference: cleanText(row?.reference, 120) || null,
    description: cleanText(row?.description, 500) || null,
    amountCents,
    balanceCents: balanceCents >= 0 ? balanceCents : amountCents,
    dueDate,
    currency: cleanText(row?.currency, 8) || 'GTQ',
  };
}

async function recuperaInstallPlaybook(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const body = await request.json().catch(() => ({}));
  const companyId = recuperaTargetCompanyId(user, new URL(request.url), body);
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.', code: 'company_not_found' }, 404);
  const existing = await env.DB.prepare(`SELECT * FROM playbook_installations WHERE company_id = ? AND playbook_key = ?`).bind(companyId, RECUPERA_PLAYBOOK_KEY).first();
  if (existing) return json({ installation: recuperaMapInstallationRow(existing) });
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO playbook_installations
      (id, company_id, playbook_key, playbook_version, status, config_json, installed_by_user_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', NULL, ?, ?, ?)
  `).bind(id, companyId, RECUPERA_PLAYBOOK_KEY, RECUPERA_PLAYBOOK_VERSION, user.id, now, now).run();
  await recuperaMergePlaybooksEnabled(env, companyId);
  const installation = await env.DB.prepare(`SELECT * FROM playbook_installations WHERE id = ?`).bind(id).first();
  await audit(env, user.email, 'playbook_installed', 'playbook_installation', id, { companyId, playbookKey: RECUPERA_PLAYBOOK_KEY, version: RECUPERA_PLAYBOOK_VERSION });
  return json({ installation: recuperaMapInstallationRow(installation) }, 201);
}

async function recuperaGetInstallation(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const url = new URL(request.url);
  const companyId = recuperaTargetCompanyId(user, url);
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const installation = await env.DB.prepare(`SELECT * FROM playbook_installations WHERE company_id = ? AND playbook_key = ?`).bind(companyId, RECUPERA_PLAYBOOK_KEY).first();
  if (!installation) return json({ error: 'not_found', code: 'installation_not_found' }, 404);
  return json({ installation: recuperaMapInstallationRow(installation) });
}

async function recuperaListObligations(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const url = new URL(request.url);
  const companyId = recuperaTargetCompanyId(user, url);
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || RECUPERA_OBLIGATIONS_DEFAULT_LIMIT, 1), RECUPERA_OBLIGATIONS_MAX_LIMIT);
  const rows = await env.DB.prepare(`
    SELECT * FROM obligations WHERE company_id = ? ORDER BY due_date DESC, created_at DESC LIMIT ?
  `).bind(companyId, limit).all();
  return json({ obligations: (rows.results || []).map(recuperaMapObligationRow) });
}

async function recuperaImportObligations(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const companyId = recuperaTargetCompanyId(user, url, body);
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.', code: 'company_not_found' }, 404);
  const obligations = Array.isArray(body.obligations) ? body.obligations : null;
  if (!obligations) return json({ error: 'obligations array is required.', code: 'invalid_body' }, 422);
  if (obligations.length > RECUPERA_IMPORT_MAX_ROWS) {
    return json({ error: `An import can contain at most ${RECUPERA_IMPORT_MAX_ROWS} obligations.`, code: 'import_too_large' }, 422);
  }
  const validated = [];
  const errors = [];
  for (let index = 0; index < obligations.length; index += 1) {
    const result = recuperaValidateImportRow(obligations[index], index);
    if (result.errors) errors.push(...result.errors);
    else validated.push(result);
  }
  if (errors.length) return json({ error: 'Invalid obligations payload.', code: 'invalid_obligations', details: errors }, 422);
  const now = new Date().toISOString();
  const inserted = [];
  const statements = validated.map((row) => {
    const id = crypto.randomUUID();
    const stageKey = recuperaStageFromDueDate(row.dueDate, new Date(now));
    inserted.push({ id, ...row, stageKey });
    return env.DB.prepare(`
      INSERT INTO obligations
        (id, company_id, payer_name, payer_email, payer_phone, reference, description, currency, amount_cents, balance_cents, due_date, stage_key, strategy_key, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EQUILIBRADA', 'open', ?, ?)
    `).bind(id, companyId, row.payerName, row.payerEmail, row.payerPhone, row.reference, row.description, row.currency, row.amountCents, row.balanceCents, row.dueDate, stageKey, now, now);
  });
  if (statements.length) await env.DB.batch(statements);
  await audit(env, user.email, 'recupera_obligations_imported', 'company', companyId, { importedCount: inserted.length });
  const rows = inserted.length
    ? (await env.DB.prepare(`SELECT * FROM obligations WHERE company_id = ? AND id IN (${inserted.map(() => '?').join(', ')}) ORDER BY created_at DESC`).bind(companyId, ...inserted.map((row) => row.id)).all()).results || []
    : [];
  return json({ imported: rows.map(recuperaMapObligationRow) }, 201);
}

async function handleRecuperaApi(request, env, url, user) {
  if (!url.pathname.startsWith('/api/recupera/')) return null;
  if (url.pathname === '/api/recupera/install' && request.method === 'POST') return recuperaInstallPlaybook(request, env, user);
  if (url.pathname === '/api/recupera/installation' && request.method === 'GET') return recuperaGetInstallation(request, env, user);
  if (url.pathname === '/api/recupera/obligations' && request.method === 'GET') return recuperaListObligations(request, env, user);
  if (url.pathname === '/api/recupera/obligations/import' && request.method === 'POST') return recuperaImportObligations(request, env, user);
  return json({ error: 'not_found', code: 'playbook_disabled' }, 404);
}
