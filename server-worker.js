const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    site TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
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
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
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
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (invitation_id) REFERENCES invitations(id)
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
  `CREATE INDEX IF NOT EXISTS invitations_candidate_idx ON invitations(candidate_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS assessments_candidate_idx ON assessments(candidate_id, completed_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS assessments_invitation_unique ON assessments(invitation_id) WHERE invitation_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_events(entity_type, entity_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS email_invitation_idx ON email_events(invitation_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS scenario_invitation_idx ON invitation_scenarios(invitation_id, question_order)`,
  `CREATE INDEX IF NOT EXISTS scenario_response_assessment_idx ON assessment_scenario_responses(assessment_id)`,
];

let schemaReady = false;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function cleanEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

const sensitiveEvidencePattern = /\b(age|aged|race|racial|ethnicity|ethnic|nationality|religion|religious|sex|gender|sexual orientation|pregnan\w*|disab\w*|health|medical|diagnos\w*|mental|family|familia\w*|childcare|caregiv\w*|financial|finanzas|politic\w*|union|edad|raza|etnia|nacionalidad|religión|religion|sexo|género|genero|orientación sexual|embaraz\w*|discap\w*|salud|médic\w*|diagnóstic\w*|diagnostic\w*|cuidad\w*|polític\w*|politic\w*|sindicat\w*)\b/iu;
const contactEvidencePattern = /(?:https?:\/\/|www\.|\b[^\s@]+@[^\s@]+\.[^\s@]+\b|(?:\+?\d[\d\s().-]{7,}\d))/iu;
const prohibitedAnalysisPattern = /\b(recommend\w*\s+(?:to\s+)?(?:hire|reject)|should\s+(?:be\s+)?(?:hired|rejected)|hire\s+this\s+candidate|reject\s+this\s+candidate|contratar\s+(?:a\s+)?(?:este|esta)\s+candidat\w*|rechazar\s+(?:a\s+)?(?:este|esta)\s+candidat\w*|diagnos\w*|diagnóstic\w*|high[ -]risk|low[ -]risk|alto\s+riesgo|bajo\s+riesgo)\b/iu;

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
  const itemIds = new Set(evidence.scoringTrace.map((entry) => entry.itemId));
  const scenarioIds = new Set(evidence.scenarios.map((entry) => entry.scenarioId));
  return Array.isArray(output.evidence_claims) && output.evidence_claims.length >= 3 && output.evidence_claims.every((claim) => {
    const claimItems = claim.item_ids || [];
    const claimScenarios = claim.scenario_ids || [];
    return claim.claim && claimItems.concat(claimScenarios).length > 0
      && claimItems.every((id) => itemIds.has(id))
      && claimScenarios.every((id) => scenarioIds.has(id));
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

function adminEmail(request) {
  return cleanEmail(request.headers.get('oai-authenticated-user-email'));
}

function requireAdmin(request) {
  const email = adminEmail(request);
  return email ? { email } : null;
}

async function ensureSchema(env) {
  if (!env.DB) throw new Error('database_unavailable');
  if (schemaReady) return;
  await env.DB.batch(schemaStatements.map((statement) => env.DB.prepare(statement)));
  schemaReady = true;
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

function emailConfig(env) {
  const region = String(env.MAILGUN_REGION || 'US').toUpperCase() === 'EU' ? 'EU' : 'US';
  const domain = cleanText(env.MAILGUN_DOMAIN, 253);
  const from = cleanText(env.MAILGUN_FROM, 320);
  const apiKey = String(env.MAILGUN_API_KEY || '');
  const webhookSigningKey = String(env.MAILGUN_WEBHOOK_SIGNING_KEY || '');
  return { configured: Boolean(domain && from && apiKey && webhookSigningKey), region, domain, from, apiKey, webhookSigningKey };
}

function openAiConfig(env) {
  const apiKey = String(env.OPENAI_API_KEY || '');
  const model = cleanText(env.OPENAI_MODEL, 120) || GazelleAiAssessment.DEFAULT_MODEL;
  return { configured: Boolean(apiKey), apiKey, model };
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

async function callOpenAiJson(env, { instructions, input, schema, schemaName, safetyIdentifier, maxOutputTokens }) {
  const config = openAiConfig(env);
  if (!config.configured) throw new Error('openai_not_configured');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      instructions,
      input: [{ role: 'user', content: [{ type: 'input_text', text: JSON.stringify(input) }] }],
      reasoning: { effort: 'medium' },
      text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
      max_output_tokens: maxOutputTokens,
      store: false,
      safety_identifier: safetyIdentifier,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('openai_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body?.error?.message || 'OpenAI rejected the request.', 400);
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

async function sendMailgun(env, message) {
  const config = emailConfig(env);
  if (!config.configured) throw new Error('email_not_configured');
  const baseUrl = config.region === 'EU' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
  const form = new FormData();
  form.append('from', config.from);
  form.append('to', message.to);
  form.append('subject', message.subject);
  form.append('text', message.text);
  form.append('html', message.html);
  form.append('o:tag', 'tenure-potential');
  form.append('o:tracking-opens', 'no');
  form.append('o:tracking-clicks', 'no');
  form.append('o:require-tls', 'yes');
  if (message.invitationId) form.append('v:invitation_id', message.invitationId);
  const response = await fetch(`${baseUrl}/v3/${encodeURIComponent(config.domain)}/messages`, {
    method: 'POST',
    headers: { authorization: `Basic ${btoa(`api:${config.apiKey}`)}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('mailgun_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.error || 'Provider rejected the request', 300);
    throw error;
  }
  return { id: cleanText(body.id, 300), message: cleanText(body.message, 300) };
}

function invitationCopy(candidate, locale, link) {
  const name = escapeHtml(candidate.name.split(/\s+/)[0] || candidate.name);
  const role = escapeHtml(candidate.role);
  const safeLink = escapeHtml(link);
  if (locale === 'es') {
    return {
      subject: 'Tu evaluación de Potencial de Permanencia',
      text: `Hola ${candidate.name},\n\nTe invitamos a completar la evaluación de Potencial de Permanencia para el puesto ${candidate.role}. Antes de comenzar podrás elegir inglés o español. Incluye 27 reactivos y tres escenarios laborales. Las respuestas de escenarios pueden utilizarse en un reporte asistido por IA, pero no cambian la puntuación. La evaluación toma aproximadamente 12–16 minutos.\n\n${link}\n\nEl resultado será revisado por una persona junto con otra información del proceso.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Gazelle Assessment</h1><p>Hola ${name},</p><p>Te invitamos a completar la evaluación de <strong>Potencial de Permanencia</strong> para el puesto <strong>${role}</strong>.</p><p>Antes de comenzar podrás elegir inglés o español. Incluye 27 reactivos y tres escenarios laborales. Las respuestas de escenarios pueden utilizarse en un reporte asistido por IA, pero no cambian la puntuación. La evaluación toma aproximadamente 12–16 minutos.</p><p><a href="${safeLink}" style="display:inline-block;background:#e4571b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Comenzar evaluación</a></p><p style="font-size:13px;color:#687174">El resultado será revisado por una persona junto con otra información del proceso.</p></div>`,
    };
  }
  return {
    subject: 'Your Tenure Potential assessment',
    text: `Hello ${candidate.name},\n\nYou are invited to complete the Tenure Potential assessment for the ${candidate.role} role. Before starting, you can choose English or Spanish. It includes 27 items and three job scenarios. Scenario responses may be used in an AI-assisted report but do not change the score. The assessment takes about 12–16 minutes.\n\n${link}\n\nA person will review the result together with other hiring information.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202628"><h1 style="font-size:24px">Gazelle Assessment</h1><p>Hello ${name},</p><p>You are invited to complete the <strong>Tenure Potential</strong> assessment for the <strong>${role}</strong> role.</p><p>Before starting, you can choose English or Spanish. It includes 27 items and three job scenarios. Scenario responses may be used in an AI-assisted report but do not change the score. The assessment takes about 12–16 minutes.</p><p><a href="${safeLink}" style="display:inline-block;background:#e4571b;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">Start assessment</a></p><p style="font-size:13px;color:#687174">A person will review the result together with other hiring information.</p></div>`,
  };
}

async function audit(env, actor, type, entityType, entityId, payload) {
  await env.DB.prepare(`INSERT INTO audit_events (id, actor_email, event_type, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), actor || null, type, entityType, entityId, JSON.stringify(payload || {}), new Date().toISOString())
    .run();
}

async function listCandidates(env) {
  const result = await env.DB.prepare(`
    WITH latest_invitation AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY candidate_id ORDER BY created_at DESC) AS row_number
      FROM invitations
    ), latest_assessment AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY candidate_id ORDER BY completed_at DESC) AS row_number
      FROM assessments
    )
    SELECT c.id, c.name, c.email, c.phone, c.role, c.site, c.created_at, c.updated_at,
      i.id AS invitation_id, i.locale AS invitation_locale, i.status AS invitation_status, i.provider_message_id,
      i.created_at AS invitation_created_at, i.delivered_at, i.completed_at AS invitation_completed_at,
      a.id AS assessment_id, a.assessment_version, a.model_version, a.model_status, a.locale AS assessment_locale,
      a.experience_branch, a.completed_at AS assessment_completed_at, a.duration_ms, a.potential_index,
      a.potential_band, a.fit_score, a.intent_score, a.reliability_score, a.context_score,
      a.support_profile_json, a.response_quality_json, a.scoring_trace_json, a.weights_json, a.audit_hash,
      ai.status AS ai_analysis_status, ai.model AS ai_analysis_model, ai.prompt_version AS ai_prompt_version,
      ai.provider_response_id AS ai_provider_response_id, ai.evidence_hash AS ai_evidence_hash,
      ai.output_hash AS ai_output_hash, ai.output_en_json AS ai_output_en_json, ai.output_es_json AS ai_output_es_json,
      ai.evidence_claims_json AS ai_evidence_claims_json, ai.limitations_json AS ai_limitations_json,
      ai.error_code AS ai_error_code, ai.updated_at AS ai_analysis_updated_at
    FROM candidates c
    LEFT JOIN latest_invitation i ON i.candidate_id = c.id AND i.row_number = 1
    LEFT JOIN latest_assessment a ON a.candidate_id = c.id AND a.row_number = 1
    LEFT JOIN ai_analyses ai ON ai.assessment_id = a.id
    ORDER BY c.created_at DESC
  `).all();
  const rows = (result.results || []).map((row) => ({
    ...row,
    support_profile: row.support_profile_json ? JSON.parse(row.support_profile_json) : null,
    response_quality: row.response_quality_json ? JSON.parse(row.response_quality_json) : null,
    scoring_trace: row.scoring_trace_json ? JSON.parse(row.scoring_trace_json) : null,
    weights: row.weights_json ? JSON.parse(row.weights_json) : null,
    ai_analysis: row.ai_analysis_status ? {
      status: row.ai_analysis_status,
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
      evidence_item_ids: JSON.parse(scenario.evidence_item_ids_json || '[]'),
    }));
  });
  return rows;
}

async function importCandidates(request, env, admin) {
  const body = await request.json().catch(() => ({}));
  const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, 500) : [];
  if (!candidates.length) return json({ error: 'No valid candidate rows supplied.' }, 400);
  const now = new Date().toISOString();
  const statements = [];
  let accepted = 0;
  for (const input of candidates) {
    const email = cleanEmail(input.email);
    const name = cleanText(input.name, 140);
    const role = cleanText(input.role, 140);
    if (!email || !name || !role) continue;
    accepted += 1;
    statements.push(env.DB.prepare(`
      INSERT INTO candidates (id, email, name, phone, role, site, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name, phone = excluded.phone, role = excluded.role, site = excluded.site, updated_at = excluded.updated_at
    `).bind(crypto.randomUUID(), email, name, cleanText(input.phone, 40), role, cleanText(input.site, 120), now, now));
  }
  if (!statements.length) return json({ error: 'Each row needs a valid name, email, and role.' }, 422);
  await env.DB.batch(statements);
  await audit(env, admin.email, 'candidates_imported', 'candidate_batch', crypto.randomUUID(), { accepted });
  return json({ accepted, candidates: await listCandidates(env) }, 201);
}

async function createInvitation(request, env, admin) {
  const body = await request.json().catch(() => ({}));
  const candidateInput = body.candidate || {};
  const email = cleanEmail(candidateInput.email);
  const name = cleanText(candidateInput.name, 140);
  const role = cleanText(candidateInput.role, 140);
  const locale = body.locale === 'es' ? 'es' : 'en';
  if (!email || !name || !role) return json({ error: 'A valid candidate name, email, and role are required.' }, 422);
  if (!emailConfig(env).configured) return json({ error: 'Mailgun is not configured.', code: 'email_not_configured' }, 503);

  const now = new Date();
  const candidateId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO candidates (id, email, name, phone, role, site, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET name = excluded.name, phone = excluded.phone, role = excluded.role, site = excluded.site, updated_at = excluded.updated_at
  `).bind(candidateId, email, name, cleanText(candidateInput.phone, 40), role, cleanText(candidateInput.site, 120), now.toISOString(), now.toISOString()).run();
  const candidateRow = await env.DB.prepare(`SELECT * FROM candidates WHERE email = ?`).bind(email).first();
  const token = randomToken();
  const tokenHash = await sha256(token);
  const invitationId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`INSERT INTO invitations (id, candidate_id, token_hash, locale, status, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(invitationId, candidateRow.id, tokenHash, locale, 'sending', admin.email, now.toISOString(), expiresAt).run();

  const origin = cleanText(env.APP_BASE_URL, 500) || new URL(request.url).origin;
  const link = `${origin}/assessment?invite=${encodeURIComponent(token)}`;
  const copy = invitationCopy(candidateRow, locale, link);
  try {
    const provider = await sendMailgun(env, { to: email, ...copy, invitationId });
    await env.DB.prepare(`UPDATE invitations SET status = ?, provider_message_id = ? WHERE id = ?`).bind('accepted', provider.id, invitationId).run();
    await audit(env, admin.email, 'invitation_accepted_by_provider', 'invitation', invitationId, { providerMessageId: provider.id, locale, assessmentVersion: GazelleAssessmentEngine.ASSESSMENT_VERSION });
    return json({ invitationId, status: 'accepted', providerMessageId: provider.id, expiresAt }, 201);
  } catch (error) {
    await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).bind('failed', invitationId).run();
    await audit(env, admin.email, 'invitation_failed', 'invitation', invitationId, { code: error.message, providerStatus: error.providerStatus || null });
    return json({ error: error.providerMessage || 'The email provider did not accept the message.', code: error.message }, error.providerStatus || 502);
  }
}

async function getInvitation(request, env) {
  const token = cleanText(new URL(request.url).searchParams.get('token'), 200);
  if (!token) return json({ error: 'Invitation token is required.' }, 400);
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT i.id AS invitation_id, i.locale, i.status, i.expires_at, c.id AS candidate_id, c.name, c.role, c.site
    FROM invitations i JOIN candidates c ON c.id = i.candidate_id WHERE i.token_hash = ?
  `).bind(tokenHash).first();
  if (!row) return json({ error: 'Invitation not found.' }, 404);
  if (new Date(row.expires_at).getTime() < Date.now()) return json({ error: 'This invitation has expired.', code: 'expired' }, 410);
  if (row.status === 'completed') return json({ error: 'This assessment has already been completed.', code: 'completed' }, 409);
  return json({
    invitationId: row.invitation_id,
    candidate: { id: row.candidate_id, name: row.name, role: row.role, site: row.site },
    suggestedLocale: row.locale,
    assessmentVersion: GazelleAssessmentEngine.ASSESSMENT_VERSION,
    roleConditions: {
      en: ['Rotating evening or weekend schedule', 'Back-to-back customer conversations', 'Quality, productivity, and attendance targets'],
      es: ['Horario rotativo nocturno o de fin de semana', 'Conversaciones consecutivas con clientes', 'Metas de calidad, productividad y asistencia'],
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
    const ai = await callOpenAiJson(env, {
      instructions: GazelleAiAssessment.SCENARIO_INSTRUCTIONS,
      input: evidence,
      schema: GazelleAiAssessment.scenarioSchema,
      schemaName: 'tenure_potential_scenarios',
      safetyIdentifier: `invitation_${invitation.id}`,
      maxOutputTokens: 3200,
    });
    const candidateQuestions = ai.data?.questions;
    const itemIds = new Set(result.scoringTrace.map((entry) => entry.itemId));
    if (!validateScenarioOutput(candidateQuestions, itemIds)) throw new Error('openai_invalid_scenarios');
    questions = candidateQuestions.sort((a, b) => a.id.localeCompare(b.id));
    source = 'gpt_5_5';
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
        scenarioId: row.id,
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

async function generateAndStoreAiAnalysis(env, assessmentId, actorEmail = null) {
  const config = openAiConfig(env);
  const now = new Date().toISOString();
  if (!config.configured) {
    await env.DB.prepare(`
      INSERT INTO ai_analyses (assessment_id, status, model, prompt_version, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(assessment_id) DO UPDATE SET status = excluded.status, model = excluded.model, prompt_version = excluded.prompt_version, updated_at = excluded.updated_at
    `).bind(assessmentId, 'not_configured', config.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, now, now).run();
    return { status: 'not_configured' };
  }

  const evidence = await aiEvidenceForAssessment(env, assessmentId);
  if (!evidence) throw new Error('assessment_not_found');
  if (evidence.scenarios.length !== 3) throw new Error('scenario_evidence_incomplete');
  const { assessmentId: omittedAssessmentId, ...modelEvidence } = evidence;
  const evidenceHash = await sha256(GazelleAssessmentEngine.stableStringify(modelEvidence));
  await env.DB.prepare(`
    INSERT INTO ai_analyses (assessment_id, status, model, prompt_version, evidence_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(assessment_id) DO UPDATE SET status = excluded.status, model = excluded.model, prompt_version = excluded.prompt_version,
      evidence_hash = excluded.evidence_hash, error_code = NULL, updated_at = excluded.updated_at
  `).bind(assessmentId, 'processing', config.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, evidenceHash, now, now).run();

  try {
    const ai = await callOpenAiJson(env, {
      instructions: GazelleAiAssessment.ANALYSIS_INSTRUCTIONS,
      input: modelEvidence,
      schema: GazelleAiAssessment.analysisSchema,
      schemaName: 'tenure_potential_recruiter_analysis',
      safetyIdentifier: `assessment_${assessmentId}`,
      maxOutputTokens: 9000,
    });
    if (!validateAnalysisOutput(ai.data, modelEvidence)) throw new Error('openai_invalid_analysis');
    const outputHash = await sha256(GazelleAssessmentEngine.stableStringify(ai.data));
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE ai_analyses SET status = ?, model = ?, provider_response_id = ?, output_hash = ?, output_en_json = ?, output_es_json = ?,
        evidence_claims_json = ?, limitations_json = ?, error_code = NULL, updated_at = ? WHERE assessment_id = ?
    `).bind(
      'completed', ai.model, ai.responseId, outputHash, JSON.stringify(ai.data.en), JSON.stringify(ai.data.es),
      JSON.stringify(ai.data.evidence_claims || []), JSON.stringify(ai.data.limitations || []), updatedAt, assessmentId,
    ).run();
    await audit(env, actorEmail, 'ai_analysis_completed', 'assessment', assessmentId, {
      model: ai.model,
      promptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION,
      providerResponseId: ai.responseId,
      evidenceHash,
      outputHash,
    });
    return { status: 'completed', model: ai.model, evidenceHash, outputHash };
  } catch (error) {
    const errorCode = cleanText(error.message, 120) || 'ai_analysis_failed';
    await env.DB.prepare(`UPDATE ai_analyses SET status = ?, error_code = ?, updated_at = ? WHERE assessment_id = ?`)
      .bind('failed', errorCode, new Date().toISOString(), assessmentId).run();
    await audit(env, actorEmail, 'ai_analysis_failed', 'assessment', assessmentId, { errorCode, evidenceHash });
    return { status: 'failed', errorCode };
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
      INSERT INTO assessments (id, candidate_id, invitation_id, assessment_version, model_version, model_status, locale, experience_branch, started_at, completed_at, duration_ms, potential_index, potential_band, fit_score, intent_score, reliability_score, context_score, support_profile_json, response_quality_json, scoring_trace_json, weights_json, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assessmentId, invitation.candidate_id, invitation.id, result.assessmentVersion, result.modelVersion, result.modelStatus,
      locale, result.experienceBranch, startedAt.toISOString(), completedAt.toISOString(), durationMs, result.potentialIndex,
      result.potentialBand, result.subscales.fit.score, result.subscales.intent.score, result.subscales.reliability.score,
      result.subscales.context.score, JSON.stringify(result.supportProfile), JSON.stringify(result.quality),
      JSON.stringify(result.scoringTrace), JSON.stringify(result.weights), auditHash,
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
  const ai = openAiConfig(env);
  statements.push(env.DB.prepare(`
    INSERT INTO ai_analyses (assessment_id, status, model, prompt_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(assessmentId, ai.configured ? 'queued' : 'not_configured', ai.model, GazelleAiAssessment.ANALYSIS_PROMPT_VERSION, completedAt.toISOString(), completedAt.toISOString()));
  await env.DB.batch(statements);
  if (ai.configured) {
    const analysisWork = generateAndStoreAiAnalysis(env, assessmentId);
    if (context?.waitUntil) context.waitUntil(analysisWork);
    else analysisWork.catch(() => {});
  }
  return json({ assessmentId, auditHash, result, aiAnalysisStatus: ai.configured ? 'queued' : 'not_configured' }, 201);
}

async function sendTestEmail(request, env, admin) {
  const body = await request.json().catch(() => ({}));
  const to = cleanEmail(body.to || admin.email);
  if (!to) return json({ error: 'A valid recipient email is required.' }, 422);
  try {
    const provider = await sendMailgun(env, {
      to,
      subject: 'Gazelle Assessment email connection test',
      text: 'Mailgun accepted this Gazelle Assessment test message. Delivery events should be confirmed through the configured webhook.',
      html: '<div style="font-family:Arial,sans-serif"><h1>Gazelle Assessment</h1><p>Mailgun accepted this email connection test.</p><p>Delivery events should be confirmed through the configured webhook.</p></div>',
    });
    await audit(env, admin.email, 'email_connection_tested', 'email_provider', 'mailgun', { to, providerMessageId: provider.id });
    return json({ status: 'accepted', providerMessageId: provider.id });
  } catch (error) {
    return json({ error: error.providerMessage || 'Mailgun did not accept the test message.', code: error.message }, error.providerStatus || 502);
  }
}

async function regenerateAiAnalysis(env, admin, assessmentId) {
  if (!openAiConfig(env).configured) return json({ error: 'OpenAI is not configured.', code: 'openai_not_configured' }, 503);
  const assessment = await env.DB.prepare(`SELECT id FROM assessments WHERE id = ?`).bind(assessmentId).first();
  if (!assessment) return json({ error: 'Assessment not found.' }, 404);
  const result = await generateAndStoreAiAnalysis(env, assessmentId, admin.email);
  if (result.status !== 'completed') return json({ error: 'The AI analysis could not be completed.', code: result.errorCode || result.status }, 502);
  return json(result);
}

async function verifyWebhookSignature(signingKey, timestamp, token, signature) {
  if (!signingKey || !timestamp || !token || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 900) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(signingKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}${token}`)));
  if (digest.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < digest.length; index += 1) mismatch |= digest.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0;
}

async function handleMailgunWebhook(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid webhook payload.' }, 400);
  const signature = body.signature || {};
  const valid = await verifyWebhookSignature(String(env.MAILGUN_WEBHOOK_SIGNING_KEY || ''), signature.timestamp, signature.token, signature.signature);
  if (!valid) return json({ error: 'Invalid webhook signature.' }, 401);
  await ensureSchema(env);
  const eventData = body['event-data'] || {};
  const variables = eventData['user-variables'] || {};
  const invitationId = cleanText(variables.invitation_id, 100) || null;
  const eventType = cleanText(eventData.event, 80) || 'unknown';
  const messageId = cleanText(eventData.message?.headers?.['message-id'], 300) || null;
  const severity = cleanText(eventData.severity, 80) || null;
  const createdAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO email_events (id, invitation_id, provider_message_id, event_type, severity, provider_timestamp, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), invitationId, messageId, eventType, severity, String(eventData.timestamp || ''), JSON.stringify(eventData), createdAt).run();
  if (invitationId && eventType === 'accepted') await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).bind('accepted', invitationId).run();
  if (invitationId && eventType === 'delivered') await env.DB.prepare(`UPDATE invitations SET status = ?, delivered_at = ? WHERE id = ?`).bind('delivered', createdAt, invitationId).run();
  if (invitationId && eventType === 'temporary_fail') await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).bind('deferred', invitationId).run();
  if (invitationId && ['failed', 'permanent_fail', 'complained', 'unsubscribed'].includes(eventType)) await env.DB.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).bind(eventType, invitationId).run();
  return json({ received: true });
}

async function handleApi(request, env, context) {
  const url = new URL(request.url);
  if (url.pathname === '/api/health') {
    let database = false;
    if (env.DB) {
      try { await ensureSchema(env); database = true; } catch { database = false; }
    }
    const email = emailConfig(env);
    const ai = openAiConfig(env);
    return json({
      database,
      email: { configured: email.configured, provider: 'Mailgun', region: email.region, domain: email.domain || null, from: email.from || null },
      ai: {
        configured: ai.configured,
        provider: 'OpenAI',
        model: ai.model,
        scenarioPromptVersion: GazelleAiAssessment.SCENARIO_PROMPT_VERSION,
        analysisPromptVersion: GazelleAiAssessment.ANALYSIS_PROMPT_VERSION,
      },
      assessmentVersion: GazelleAssessmentEngine.ASSESSMENT_VERSION,
      modelVersion: GazelleAssessmentEngine.MODEL_VERSION,
    });
  }
  if (url.pathname === '/api/mailgun/webhook' && request.method === 'POST') return handleMailgunWebhook(request, env);
  if (url.pathname === '/api/assessment' && request.method === 'GET') { await ensureSchema(env); return getInvitation(request, env); }
  if (url.pathname === '/api/assessment/scenarios' && request.method === 'POST') { await ensureSchema(env); return createScenarioQuestions(request, env); }
  if (url.pathname === '/api/assessment/submit' && request.method === 'POST') { await ensureSchema(env); return submitAssessment(request, env, context); }

  const admin = requireAdmin(request);
  if (!admin) return json({ error: 'Authenticated workspace access is required.' }, 401);
  await ensureSchema(env);
  if (url.pathname === '/api/candidates' && request.method === 'GET') return json({ candidates: await listCandidates(env) });
  if (url.pathname === '/api/candidates/import' && request.method === 'POST') return importCandidates(request, env, admin);
  if (url.pathname === '/api/invitations' && request.method === 'POST') return createInvitation(request, env, admin);
  if (url.pathname === '/api/email/test' && request.method === 'POST') return sendTestEmail(request, env, admin);
  const aiAnalysisMatch = url.pathname.match(/^\/api\/assessments\/([^/]+)\/ai-analysis$/);
  if (aiAnalysisMatch && request.method === 'POST') return regenerateAiAnalysis(env, admin, cleanText(aiAnalysisMatch[1], 100));
  return json({ error: 'API route not found.' }, 404);
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, context);
      if (url.pathname === '/styles.css') return new Response(stylesAsset, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-cache' } });
      if (url.pathname === '/assessment-engine.js') return new Response(engineAsset, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
      if (url.pathname === '/ai-assessment.js') return new Response(aiAssessmentAsset, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
      if (url.pathname === '/pdf-report.js') return new Response(pdfReportAsset, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
      if (url.pathname === '/app.js') return new Response(appAsset, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
      if (url.pathname === '/og.png' && ogAsset) return new Response(decodeAsset(ogAsset), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
      if (url.pathname === '/' || !url.pathname.includes('.')) return new Response(htmlAsset.replaceAll('__ORIGIN__', url.origin), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
      return new Response('Not found', { status: 404 });
    } catch (error) {
      const code = error?.message === 'database_unavailable' ? 'database_unavailable' : 'server_error';
      return json({ error: code === 'database_unavailable' ? 'Persistent storage is not available.' : 'The request could not be completed.', code }, code === 'database_unavailable' ? 503 : 500);
    }
  },
};
