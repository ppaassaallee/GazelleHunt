/**
 * Recupera HTTP API — plain script for Worker concat (after stage.js).
 * Feature-flagged; does not affect Gazelle Hunt routes.
 */
const RECUPERA_PLAYBOOK_KEY = 'recupera';
const RECUPERA_PLAYBOOK_VERSION = '0.1.0';
const RECUPERA_OBLIGATIONS_DEFAULT_LIMIT = 200;
const RECUPERA_OBLIGATIONS_MAX_LIMIT = 200;
const RECUPERA_IMPORT_MAX_ROWS = 500;
const RECUPERA_TEST_ID = 'test_recupera_obligation';
const RECUPERA_LIST_NAME = 'Recupera';
const RECUPERA_JOURNEY_GOAL = 'payment_received';
const RECUPERA_STOP_EVENTS_JSON = '["payment.received","dispute.opened","opt_out"]';
const RECUPERA_CANDIDATE_ROLE = 'Recupera';

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
    subjectCandidateId: row.subject_candidate_id || null,
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

function recuperaImportObligationsFromBody(body) {
  if (typeof body?.csv === 'string' && body.csv.trim()) {
    const parsed = parseRecuperaObligationsCsv(body.csv);
    if (parsed.error) return { error: parsed.error, code: 'invalid_csv' };
    return { obligations: parsed.obligations };
  }
  if (Array.isArray(body?.obligations)) return { obligations: body.obligations };
  return { error: 'obligations array or csv string is required.', code: 'invalid_body' };
}

async function recuperaImportObligations(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const companyId = recuperaTargetCompanyId(user, url, body);
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  if (!company) return json({ error: 'Company not found.', code: 'company_not_found' }, 404);
  const parsedBody = recuperaImportObligationsFromBody(body);
  if (parsedBody.error) return json({ error: parsedBody.error, code: parsedBody.code }, 422);
  const obligations = parsedBody.obligations;
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
  const autoActivate = body.autoActivate !== false;
  const activationErrors = [];
  if (autoActivate && recuperaActivateEnabled(env)) {
    for (const row of inserted) {
      const activation = await recuperaActivateObligation(env, user, row.id, companyId);
      if (!activation.ok) activationErrors.push({ obligationId: row.id, code: activation.code });
    }
  }
  const response = { imported: rows.map(recuperaMapObligationRow) };
  if (activationErrors.length) response.activationErrors = activationErrors;
  return json(response, 201);
}

function recuperaActivateEnabled(env) {
  if (env.RECUPERA_ACTIVATE_ENABLED === 'false') return false;
  return true;
}

function recuperaMarkPaidEnabled(env) {
  return env.RECUPERA_MARK_PAID_ENABLED === 'true';
}

function recuperaPlaceholderEmail(obligationId) {
  return `obl_${cleanText(obligationId, 36)}@recupera.local`;
}

function recuperaJourneyName(stageKey) {
  return `Recupera · ${cleanText(stageKey, 40)}`;
}

function recuperaDefaultJourneySteps() {
  return normalizedJourneySteps([
    {
      channel: 'email',
      delayHours: 0,
      subjectEn: 'Payment reminder',
      subjectEs: 'Recordatorio de pago',
      messageEn: 'Hi {{name}}, this is a reminder from {{brand}} regarding your outstanding balance. Reference: {{role}}.',
      messageEs: 'Hola {{name}}, le recordamos desde {{brand}} su saldo pendiente. Referencia: {{role}}.',
    },
    {
      channel: 'email',
      delayHours: 24,
      subjectEn: 'Follow-up on your balance',
      subjectEs: 'Seguimiento de su saldo',
      messageEn: 'Hi {{name}}, we are following up on your balance with {{brand}}. Please contact us if you need assistance.',
      messageEs: 'Hola {{name}}, damos seguimiento a su saldo con {{brand}}. Contáctenos si necesita ayuda.',
    },
  ]);
}

async function recuperaLoadObligation(env, companyId, obligationId) {
  return env.DB.prepare(`SELECT * FROM obligations WHERE id = ? AND company_id = ?`).bind(obligationId, companyId).first();
}

async function recuperaExistingActivation(env, obligationId) {
  return env.DB.prepare(`
    SELECT ojl.enrollment_id, ojl.journey_id, ojl.stage_key, e.status AS enrollment_status
    FROM obligation_journey_links ojl
    JOIN contact_journey_enrollments e ON e.id = ojl.enrollment_id
    WHERE ojl.obligation_id = ?
    ORDER BY ojl.created_at DESC
    LIMIT 1
  `).bind(obligationId).first();
}

async function recuperaUpsertCandidate(env, companyId, obligation, ownerUserId) {
  const now = new Date().toISOString();
  const email = cleanEmail(obligation.payer_email) || recuperaPlaceholderEmail(obligation.id);
  const name = cleanText(obligation.payer_name, 140);
  const phone = cleanText(obligation.payer_phone, 40) || null;
  const role = cleanText(obligation.reference, 140) || RECUPERA_CANDIDATE_ROLE;
  let candidate = await env.DB.prepare(`SELECT * FROM candidates WHERE company_id = ? AND email = ? COLLATE NOCASE`).bind(companyId, email).first();
  if (candidate) {
    await env.DB.prepare(`
      UPDATE candidates SET name = ?, phone = COALESCE(?, phone), role = ?, updated_at = ? WHERE id = ?
    `).bind(name, phone, role, now, candidate.id).run();
    candidate = await env.DB.prepare(`SELECT * FROM candidates WHERE id = ?`).bind(candidate.id).first();
    return candidate;
  }
  const candidateId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO candidates (id, company_id, owner_user_id, email, name, phone, role, site, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).bind(candidateId, companyId, ownerUserId, email, name, phone, role, now, now).run();
  return env.DB.prepare(`SELECT * FROM candidates WHERE id = ?`).bind(candidateId).first();
}

async function recuperaEnsureTest(env) {
  const existing = await env.DB.prepare(`SELECT id FROM assessment_tests WHERE id = ? AND status = 'active'`).bind(RECUPERA_TEST_ID).first();
  if (existing) return RECUPERA_TEST_ID;
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO assessment_tests
      (id, code, slug, name_en, name_es, description_en, description_es, engine_key, version, status, estimated_minutes, item_count, created_at, updated_at)
    VALUES (?, 'RECUPERA-OBL', 'recupera-obligation', 'Recupera obligation', 'Obligación Recupera',
      'Recupera collection follow-up journey bridge.', 'Puente de journey para seguimiento de cobranza Recupera.',
      'recupera_obligation', '0.1.0', 'active', 0, 0, ?, ?)
  `).bind(RECUPERA_TEST_ID, now, now).run();
  return RECUPERA_TEST_ID;
}

async function recuperaEnsureList(env, companyId, ownerUserId) {
  const existing = await env.DB.prepare(`
    SELECT id FROM candidate_lists WHERE company_id = ? AND name = ? AND status = 'active' LIMIT 1
  `).bind(companyId, RECUPERA_LIST_NAME).first();
  if (existing) return existing.id;
  const now = new Date().toISOString();
  const listId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO candidate_lists (id, company_id, owner_user_id, name, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Recupera payer contacts', 'active', ?, ?)
  `).bind(listId, companyId, ownerUserId, RECUPERA_LIST_NAME, now, now).run();
  return listId;
}

async function recuperaEnsureListMember(env, listId, candidateId, userId) {
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO candidate_list_members (list_id, candidate_id, added_by_user_id, added_at)
    VALUES (?, ?, ?, ?)
  `).bind(listId, candidateId, userId, now).run();
  await env.DB.prepare(`
    INSERT OR IGNORE INTO candidate_list_tests (list_id, test_id, added_by_user_id, added_at)
    VALUES (?, ?, ?, ?)
  `).bind(listId, RECUPERA_TEST_ID, userId, now).run();
}

async function recuperaEnsureJourney(env, companyId, userId, stageKey, listId, testId) {
  const journeyName = recuperaJourneyName(stageKey);
  const existing = await env.DB.prepare(`
    SELECT j.* FROM contact_journeys j
    WHERE j.company_id = ? AND j.name = ? AND j.test_id = ? AND j.list_id = ? AND j.status = 'active'
    LIMIT 1
  `).bind(companyId, journeyName, testId, listId).first();
  if (existing) return existing;
  const steps = recuperaDefaultJourneySteps();
  const journeyId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [env.DB.prepare(`
    INSERT INTO contact_journeys
      (id, company_id, list_id, test_id, created_by_user_id, name, status, locale, goal_event, stop_on_reply, stop_events_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', 'es', ?, 0, ?, ?, ?)
  `).bind(journeyId, companyId, listId, testId, userId, journeyName, RECUPERA_JOURNEY_GOAL, RECUPERA_STOP_EVENTS_JSON, now, now)];
  steps.forEach((step) => statements.push(env.DB.prepare(`
    INSERT INTO contact_journey_steps
      (id, journey_id, step_order, delay_minutes, business_day_offset, channel, template_name, brevo_template_id, subject_en, subject_es, message_en, message_es, api_url, api_method, api_headers_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(step.id, journeyId, step.step_order, step.delay_minutes, step.business_day_offset, step.channel, step.template_name, step.brevo_template_id, step.subject_en, step.subject_es, step.message_en, step.message_es, step.api_url, step.api_method, step.api_headers_json, now)));
  await env.DB.batch(statements);
  return env.DB.prepare(`SELECT * FROM contact_journeys WHERE id = ?`).bind(journeyId).first();
}

async function recuperaEnrollCandidateInJourney(env, journey, candidate, testId) {
  const steps = await env.DB.prepare(`SELECT * FROM contact_journey_steps WHERE journey_id = ? ORDER BY step_order`).bind(journey.id).all();
  const stepRows = steps.results || [];
  if (!stepRows.length) return null;
  const now = new Date();
  const enrollmentId = crypto.randomUUID();
  const statements = [env.DB.prepare(`
    INSERT OR IGNORE INTO contact_journey_enrollments (id, journey_id, candidate_id, test_id, status, enrolled_at)
    VALUES (?, ?, ?, ?, 'active', ?)
  `).bind(enrollmentId, journey.id, candidate.id, testId, now.toISOString())];
  for (const step of stepRows) {
    const scheduledAt = scheduledJourneyStepDate(now, step).toISOString();
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO contact_journey_events (id, enrollment_id, step_id, candidate_id, channel, status, scheduled_at, created_at, updated_at)
      SELECT ?, e.id, ?, ?, ?, 'queued', ?, ?, ?
      FROM contact_journey_enrollments e
      WHERE e.journey_id = ? AND e.candidate_id = ? AND e.test_id = ?
    `).bind(crypto.randomUUID(), step.id, candidate.id, step.channel, scheduledAt, now.toISOString(), now.toISOString(), journey.id, candidate.id, testId));
  }
  await env.DB.batch(statements);
  const enrollment = await env.DB.prepare(`
    SELECT id FROM contact_journey_enrollments WHERE journey_id = ? AND candidate_id = ? AND test_id = ?
  `).bind(journey.id, candidate.id, testId).first();
  return enrollment?.id || enrollmentId;
}

async function recuperaActivateObligation(env, user, obligationId, companyId = null) {
  const resolvedCompanyId = companyId || user.companyId;
  const obligation = await recuperaLoadObligation(env, resolvedCompanyId, cleanText(obligationId, 100));
  if (!obligation) return { ok: false, code: 'obligation_not_found' };
  if (obligation.status !== 'open') return { ok: false, code: 'obligation_not_open' };
  const existing = await recuperaExistingActivation(env, obligation.id);
  if (existing?.enrollment_id) {
    const candidateId = obligation.subject_candidate_id || (await env.DB.prepare(`SELECT candidate_id FROM contact_journey_enrollments WHERE id = ?`).bind(existing.enrollment_id).first())?.candidate_id;
    return {
      ok: true,
      obligation: recuperaMapObligationRow(obligation),
      candidateId: candidateId || null,
      journeyId: existing.journey_id,
      enrollmentId: existing.enrollment_id,
      alreadyActive: true,
    };
  }
  await ensureSchema(env);
  const testId = await recuperaEnsureTest(env);
  const candidate = await recuperaUpsertCandidate(env, resolvedCompanyId, obligation, user.id);
  const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE obligations SET subject_candidate_id = ?, updated_at = ? WHERE id = ?`).bind(candidate.id, now, obligation.id).run();
  const listId = await recuperaEnsureList(env, resolvedCompanyId, user.id);
  await recuperaEnsureListMember(env, listId, candidate.id, user.id);
  const journey = await recuperaEnsureJourney(env, resolvedCompanyId, user.id, obligation.stage_key, listId, testId);
  const enrollmentId = await recuperaEnrollCandidateInJourney(env, journey, candidate, testId);
  if (!enrollmentId) return { ok: false, code: 'journey_steps_required' };
  await env.DB.prepare(`
    INSERT OR IGNORE INTO obligation_journey_links (obligation_id, enrollment_id, journey_id, stage_key, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(obligation.id, enrollmentId, journey.id, obligation.stage_key, now).run();
  processDueJourneyEvents(env).catch(() => {});
  const updated = await recuperaLoadObligation(env, resolvedCompanyId, obligation.id);
  await audit(env, user.email, 'recupera_obligation_activated', 'obligation', obligation.id, {
    companyId: resolvedCompanyId, candidateId: candidate.id, journeyId: journey.id, enrollmentId, stageKey: obligation.stage_key,
  });
  return {
    ok: true,
    obligation: recuperaMapObligationRow(updated),
    candidateId: candidate.id,
    journeyId: journey.id,
    enrollmentId,
  };
}

async function recuperaActivateObligationRequest(request, env, user, obligationId) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  if (!recuperaActivateEnabled(env)) return json({ error: 'not_found', code: 'activate_disabled' }, 404);
  const result = await recuperaActivateObligation(env, user, obligationId, companyId);
  if (!result.ok) {
    if (result.code === 'obligation_not_found') return json({ error: 'Obligation not found.', code: result.code }, 404);
    if (result.code === 'obligation_not_open') return json({ error: 'Only open obligations can be activated.', code: result.code }, 422);
    if (result.code === 'journey_steps_required') return json({ error: 'Journey has no steps.', code: result.code }, 422);
    return json({ error: 'Activation failed.', code: result.code || 'activation_failed' }, 422);
  }
  if (result.alreadyActive) {
    return json({
      obligation: result.obligation,
      candidateId: result.candidateId,
      journeyId: result.journeyId,
      enrollmentId: result.enrollmentId,
      alreadyActive: true,
    });
  }
  return json({
    obligation: result.obligation,
    candidateId: result.candidateId,
    journeyId: result.journeyId,
    enrollmentId: result.enrollmentId,
  }, 201);
}

async function recuperaCreatePaymentLinkRequest(request, env, user, obligationId) {
  if (!recuperaPaymentsEnabled(env)) return json({ error: 'not_found', code: 'payments_disabled' }, 404);
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const obligation = await recuperaLoadObligation(env, companyId, cleanText(obligationId, 100));
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  const portalResponse = await recuperaCreatePortalLink(request, env, user, obligationId);
  if (!portalResponse.ok) return portalResponse;
  const portalBody = await portalResponse.json();
  const link = createPaymentLinkStub({
    obligationId: obligation.id,
    amountCents: obligation.balance_cents,
    currency: obligation.currency || 'GTQ',
    successUrl: portalBody.url || null,
  });
  return json({ ...link, portalUrl: portalBody.url || null, expiresAt: portalBody.expiresAt || null });
}

async function recuperaCreatePortalLink(request, env, user, obligationId) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const obligation = await recuperaLoadObligation(env, companyId, cleanText(obligationId, 100));
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const linkId = crypto.randomUUID();
  const origin = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '') || new URL(request.url).origin;
  await env.DB.prepare(`
    INSERT INTO obligation_portal_links (id, company_id, obligation_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(linkId, companyId, obligation.id, await sha256(token), expiresAt, now.toISOString()).run();
  await audit(env, user.email, 'recupera_portal_link_created', 'obligation', obligation.id, { companyId, expiresAt });
  return json({ url: `${origin}/p/${token}`, expiresAt });
}

function recuperaTodayIsoDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

async function recuperaTableExists(env, tableName) {
  try {
    const row = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

function recuperaExceptionTitle(row) {
  return cleanText(row.payer_name || row.reference, 200) || 'Cuenta por cobrar';
}

function recuperaExceptionSubtitle(type, row) {
  if (type === 'broken_promise') {
    const date = cleanText(row.promise_date, 20);
    return date ? `Promesa vencida · ${date}` : 'Promesa vencida';
  }
  if (type === 'dispute') {
    const reason = cleanText(row.reason_code, 80);
    return reason ? `Reclamo abierto · ${reason}` : 'Reclamo abierto';
  }
  if (type === 'pending_payment') return 'Pago por verificar';
  if (type === 'needs_human') return 'Rocío necesita tu ayuda';
  if (type === 'aging') {
    const stage = cleanText(row.stage_key, 40);
    return stage === 'LEGAL' ? 'Etapa legal' : 'Más de 60 días vencido';
  }
  return '';
}

function recuperaMapExceptionItem(type, row) {
  const amountCents = Number.isFinite(Number(row.amount_cents))
    ? Number(row.amount_cents)
    : Number(row.balance_cents) || 0;
  const currency = cleanText(row.currency || row.obligation_currency, 8) || 'GTQ';
  const obligationId = type === 'aging' ? row.id : row.obligation_id;
  return {
    id: row.id,
    type,
    obligationId,
    title: recuperaExceptionTitle(row),
    subtitle: recuperaExceptionSubtitle(type, row),
    amountCents,
    currency,
    createdAt: row.created_at,
  };
}

const RECUPERA_AGING_STAGE_KEYS = ['PRE_DUE', 'DUE', 'DPD_1_7', 'DPD_8_15', 'DPD_16_30', 'DPD_31_60', 'DPD_60_PLUS'];

async function recuperaGetInsights(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const now = new Date();
  const today = recuperaTodayIsoDate(now);
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;

  const pendingRow = await env.DB.prepare(`
    SELECT COALESCE(SUM(balance_cents), 0) AS cents FROM obligations WHERE company_id = ? AND status = 'open'
  `).bind(companyId).first();

  const recoveredRow = await env.DB.prepare(`
    SELECT COALESCE(SUM(amount_cents), 0) AS cents FROM payments
    WHERE company_id = ? AND status = 'completed' AND paid_at >= ?
  `).bind(companyId, monthStart).first();

  const openRow = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM obligations WHERE company_id = ? AND status = 'open'
  `).bind(companyId).first();

  const activePromisesRow = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM promises WHERE company_id = ? AND status = 'open'
  `).bind(companyId).first();

  const brokenPromisesRow = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM promises
    WHERE company_id = ? AND (status = 'broken' OR (status = 'open' AND promise_date < ?))
  `).bind(companyId, today).first();

  const disputesRow = await env.DB.prepare(`
    SELECT COUNT(*) AS count FROM disputes WHERE company_id = ? AND status = 'open'
  `).bind(companyId).first();

  const agingRows = await env.DB.prepare(`
    SELECT stage_key, COALESCE(SUM(balance_cents), 0) AS cents, COUNT(*) AS count
    FROM obligations
    WHERE company_id = ? AND status = 'open' AND stage_key IN (${RECUPERA_AGING_STAGE_KEYS.map(() => '?').join(', ')})
    GROUP BY stage_key
  `).bind(companyId, ...RECUPERA_AGING_STAGE_KEYS).all();
  const agingMap = new Map();
  for (const row of agingRows.results || []) {
    agingMap.set(row.stage_key, { stageKey: row.stage_key, cents: Number(row.cents) || 0, count: Number(row.count) || 0 });
  }
  const aging = RECUPERA_AGING_STAGE_KEYS.map((stageKey) => agingMap.get(stageKey) || { stageKey, cents: 0, count: 0 });

  let rocio = { jobsToday: 0, needsHuman: 0 };
  if (await recuperaTableExists(env, 'rocio_intent_jobs')) {
    try {
      const jobsTodayRow = await env.DB.prepare(`
        SELECT COUNT(*) AS count FROM rocio_intent_jobs WHERE company_id = ? AND created_at >= ?
      `).bind(companyId, today).first();
      const needsHumanRow = await env.DB.prepare(`
        SELECT COUNT(*) AS count FROM rocio_intent_jobs WHERE company_id = ? AND status = 'needs_human'
      `).bind(companyId).first();
      rocio = {
        jobsToday: Number(jobsTodayRow?.count) || 0,
        needsHuman: Number(needsHumanRow?.count) || 0,
      };
    } catch {
      // Migration not applied yet — skip silently.
    }
  }

  return json({
    pendingCents: Number(pendingRow?.cents) || 0,
    recoveredCentsThisMonth: Number(recoveredRow?.cents) || 0,
    openObligations: Number(openRow?.count) || 0,
    activePromises: Number(activePromisesRow?.count) || 0,
    brokenPromises: Number(brokenPromisesRow?.count) || 0,
    disputesOpen: Number(disputesRow?.count) || 0,
    aging,
    rocio,
  });
}

async function recuperaListExceptions(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const today = recuperaTodayIsoDate();
  const items = [];

  const brokenPromiseRows = await env.DB.prepare(`
    SELECT p.*, o.payer_name, o.reference, o.balance_cents, o.currency AS obligation_currency
    FROM promises p
    JOIN obligations o ON o.id = p.obligation_id
    WHERE p.company_id = ?
      AND (p.status = 'broken' OR (p.status = 'open' AND p.promise_date < ?))
    ORDER BY p.created_at DESC
  `).bind(companyId, today).all();
  for (const row of brokenPromiseRows.results || []) {
    items.push(recuperaMapExceptionItem('broken_promise', row));
  }

  const disputeRows = await env.DB.prepare(`
    SELECT d.*, o.payer_name, o.reference, o.balance_cents, o.currency AS obligation_currency
    FROM disputes d
    JOIN obligations o ON o.id = d.obligation_id
    WHERE d.company_id = ? AND d.status = 'open'
    ORDER BY d.created_at DESC
  `).bind(companyId).all();
  for (const row of disputeRows.results || []) {
    items.push(recuperaMapExceptionItem('dispute', row));
  }

  const paymentRows = await env.DB.prepare(`
    SELECT py.*, o.payer_name, o.reference, o.balance_cents, o.currency AS obligation_currency
    FROM payments py
    JOIN obligations o ON o.id = py.obligation_id
    WHERE py.company_id = ? AND py.status = 'pending_verification'
    ORDER BY py.created_at DESC
  `).bind(companyId).all();
  for (const row of paymentRows.results || []) {
    items.push(recuperaMapExceptionItem('pending_payment', row));
  }

  if (await recuperaTableExists(env, 'rocio_intent_jobs')) {
    try {
      const intentRows = await env.DB.prepare(`
        SELECT j.*, o.payer_name, o.reference, o.balance_cents, o.currency AS obligation_currency
        FROM rocio_intent_jobs j
        LEFT JOIN obligations o ON o.id = j.obligation_id
        WHERE j.company_id = ? AND j.status = 'needs_human'
        ORDER BY j.created_at DESC
      `).bind(companyId).all();
      for (const row of intentRows.results || []) {
        items.push(recuperaMapExceptionItem('needs_human', row));
      }
    } catch {
      // Migration not applied yet — skip silently.
    }
  }

  const agingRows = await env.DB.prepare(`
    SELECT * FROM obligations
    WHERE company_id = ? AND status = 'open' AND stage_key IN ('DPD_60_PLUS', 'LEGAL')
    ORDER BY updated_at DESC
  `).bind(companyId).all();
  for (const row of agingRows.results || []) {
    items.push(recuperaMapExceptionItem('aging', row));
  }

  const summary = {
    brokenPromises: items.filter((item) => item.type === 'broken_promise').length,
    disputes: items.filter((item) => item.type === 'dispute').length,
    pendingPayments: items.filter((item) => item.type === 'pending_payment').length,
    needsHuman: items.filter((item) => item.type === 'needs_human').length,
    total: items.length,
  };
  return json({ summary, items });
}

async function recuperaResolveException(request, env, user, type, id) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const body = await request.json().catch(() => ({}));
  const resolution = cleanText(body.resolution, 40);
  const entityId = cleanText(id, 100);
  const exceptionType = cleanText(type, 40);
  const now = new Date().toISOString();

  if (exceptionType === 'pending_payment' && resolution === 'confirm_paid') {
    const payment = await env.DB.prepare(`
      SELECT * FROM payments WHERE id = ? AND company_id = ? AND status = 'pending_verification'
    `).bind(entityId, companyId).first();
    if (!payment) return json({ error: 'Payment not found.', code: 'payment_not_found' }, 404);
    const obligation = await recuperaLoadObligation(env, companyId, payment.obligation_id);
    if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
    await env.DB.batch([
      env.DB.prepare(`UPDATE payments SET status = 'completed', paid_at = ? WHERE id = ?`).bind(now, payment.id),
      env.DB.prepare(`
        UPDATE obligations SET balance_cents = 0, stage_key = 'PAID', status = 'closed', updated_at = ? WHERE id = ?
      `).bind(now, obligation.id),
    ]);
    await audit(env, user.email, 'recupera_exception_payment_confirmed', 'payment', payment.id, { companyId, obligationId: obligation.id });
    return json({ ok: true, obligationId: obligation.id });
  }

  if (exceptionType === 'broken_promise' && resolution === 'dismiss') {
    const promise = await env.DB.prepare(`
      SELECT * FROM promises WHERE id = ? AND company_id = ?
    `).bind(entityId, companyId).first();
    if (!promise) return json({ error: 'Promise not found.', code: 'promise_not_found' }, 404);
    await env.DB.prepare(`UPDATE promises SET status = 'cancelled', updated_at = ? WHERE id = ?`).bind(now, promise.id).run();
    await audit(env, user.email, 'recupera_exception_promise_dismissed', 'promise', promise.id, { companyId, obligationId: promise.obligation_id });
    return json({ ok: true, obligationId: promise.obligation_id });
  }

  if (exceptionType === 'dispute' && resolution === 'dismiss') {
    const dispute = await env.DB.prepare(`
      SELECT * FROM disputes WHERE id = ? AND company_id = ?
    `).bind(entityId, companyId).first();
    if (!dispute) return json({ error: 'Dispute not found.', code: 'dispute_not_found' }, 404);
    await env.DB.prepare(`UPDATE disputes SET status = 'closed', updated_at = ? WHERE id = ?`).bind(now, dispute.id).run();
    await audit(env, user.email, 'recupera_exception_dispute_dismissed', 'dispute', dispute.id, { companyId, obligationId: dispute.obligation_id });
    return json({ ok: true, obligationId: dispute.obligation_id });
  }

  return json({ error: 'Unsupported resolution.', code: 'invalid_resolution' }, 422);
}

async function recuperaMarkPaidObligation(request, env, user, obligationId) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  if (!recuperaMarkPaidEnabled(env)) return json({ error: 'not_found', code: 'mark_paid_disabled' }, 404);
  const obligation = await recuperaLoadObligation(env, companyId, cleanText(obligationId, 100));
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const amountCents = Number(obligation.balance_cents) || 0;
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO payments (id, company_id, obligation_id, amount_cents, currency, provider, provider_payment_id, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'recupera_demo', ?, 'completed', ?, ?)
    `).bind(paymentId, companyId, obligation.id, amountCents, obligation.currency || 'GTQ', `demo-${paymentId}`, now, now),
    env.DB.prepare(`
      UPDATE obligations SET balance_cents = 0, stage_key = 'PAID', status = 'closed', updated_at = ? WHERE id = ?
    `).bind(now, obligation.id),
  ]);
  const updated = await recuperaLoadObligation(env, companyId, obligation.id);
  await audit(env, user.email, 'recupera_obligation_marked_paid', 'obligation', obligation.id, { companyId, paymentId, amountCents });
  return json({ obligation: recuperaMapObligationRow(updated), paymentId });
}

async function recuperaClassifyIntentRequest(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const body = await request.json().catch(() => ({}));
  const text = cleanText(body?.text, 2000);
  if (!text) return json({ error: 'text is required.', code: 'invalid_body' }, 422);
  const classification = rocioClassifyIntent(text);
  const obligationId = body?.obligationId ? cleanText(body.obligationId, 100) : null;
  return json({ classification, obligationId });
}

async function recuperaInboundMessageRequest(request, env, user, obligationId) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Administrator access is required.', code: 'admin_required' }, 403);
  const companyId = recuperaTargetCompanyId(user, new URL(request.url));
  if (!await recuperaPlaybookEnabled(env, companyId)) return recuperaPlaybookDisabledResponse();
  const obligation = await recuperaLoadObligation(env, companyId, cleanText(obligationId, 100));
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  const body = await request.json().catch(() => ({}));
  const text = cleanText(body?.text, 2000);
  if (!text) return json({ error: 'text is required.', code: 'invalid_body' }, 422);
  const result = await rocioProcessInbound(env, {
    companyId,
    obligationId: obligation.id,
    text,
    actor: user.email,
    messageId: body?.messageId ? cleanText(body.messageId, 160) : null,
  });
  const updated = await recuperaLoadObligation(env, companyId, obligation.id);
  return json({
    jobId: result.jobId,
    status: result.status,
    classification: result.classification,
    applied: result.applied,
    obligation: recuperaMapObligationRow(updated),
  }, 201);
}

async function handleRecuperaApi(request, env, url, user) {
  if (!url.pathname.startsWith('/api/recupera/')) return null;
  if (url.pathname === '/api/recupera/install' && request.method === 'POST') return recuperaInstallPlaybook(request, env, user);
  if (url.pathname === '/api/recupera/installation' && request.method === 'GET') return recuperaGetInstallation(request, env, user);
  if (url.pathname === '/api/recupera/obligations' && request.method === 'GET') return recuperaListObligations(request, env, user);
  if (url.pathname === '/api/recupera/obligations/import' && request.method === 'POST') return recuperaImportObligations(request, env, user);
  if (url.pathname === '/api/recupera/rocio/classify' && request.method === 'POST') return recuperaClassifyIntentRequest(request, env, user);
  const activateMatch = url.pathname.match(/^\/api\/recupera\/obligations\/([^/]+)\/activate$/);
  if (activateMatch && request.method === 'POST') return recuperaActivateObligationRequest(request, env, user, activateMatch[1]);
  const markPaidMatch = url.pathname.match(/^\/api\/recupera\/obligations\/([^/]+)\/mark-paid$/);
  if (markPaidMatch && request.method === 'POST') return recuperaMarkPaidObligation(request, env, user, markPaidMatch[1]);
  const portalLinkMatch = url.pathname.match(/^\/api\/recupera\/obligations\/([^/]+)\/portal-link$/);
  if (portalLinkMatch && request.method === 'POST') return recuperaCreatePortalLink(request, env, user, portalLinkMatch[1]);
  const paymentLinkMatch = url.pathname.match(/^\/api\/recupera\/obligations\/([^/]+)\/payment-link$/);
  if (paymentLinkMatch && request.method === 'POST') return recuperaCreatePaymentLinkRequest(request, env, user, paymentLinkMatch[1]);
  const inboundMatch = url.pathname.match(/^\/api\/recupera\/obligations\/([^/]+)\/inbound-message$/);
  if (inboundMatch && request.method === 'POST') return recuperaInboundMessageRequest(request, env, user, inboundMatch[1]);
  if (url.pathname === '/api/recupera/insights' && request.method === 'GET') return recuperaGetInsights(request, env, user);
  if (url.pathname === '/api/recupera/exceptions' && request.method === 'GET') return recuperaListExceptions(request, env, user);
  const resolveMatch = url.pathname.match(/^\/api\/recupera\/exceptions\/([^/]+)\/([^/]+)\/resolve$/);
  if (resolveMatch && request.method === 'POST') return recuperaResolveException(request, env, user, resolveMatch[1], resolveMatch[2]);
  return json({ error: 'not_found', code: 'playbook_disabled' }, 404);
}
