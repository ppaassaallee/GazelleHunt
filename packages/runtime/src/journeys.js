/**
 * RYVO runtime — contact journeys (enrollment, events, API webhooks).
 * Move-only extraction from server-worker.js. Do not improve.
 */
function normalizedJourneySteps(inputSteps) {
  const fallback = [
    { delayHours: 0, businessDayOffset: 0, channel: 'whatsapp' },
    { delayHours: 1, businessDayOffset: 0, channel: 'email' },
    { delayHours: 0, businessDayOffset: 1, channel: 'whatsapp' },
    { delayHours: 0, businessDayOffset: 2, channel: 'whatsapp' },
    { delayHours: 0, businessDayOffset: 3, channel: 'email' },
    { delayHours: 0, businessDayOffset: 4, channel: 'whatsapp' },
  ];
  const rows = (Array.isArray(inputSteps) && inputSteps.length ? inputSteps : fallback).slice(0, 8);
  return rows.map((step, index) => {
    const channel = ['email', 'whatsapp', 'sms', 'api'].includes(step.channel) ? step.channel : 'email';
    const delayHours = Math.max(0, Math.min(720, Number(step.delayHours ?? step.delay_hours ?? 0) || 0));
    const delayMinutes = Math.round(delayHours * 60);
    const rawBusinessDayOffset = step.businessDayOffset ?? step.business_day_offset;
    const businessDayOffset = rawBusinessDayOffset === null || rawBusinessDayOffset === undefined || rawBusinessDayOffset === ''
      ? null
      : Math.max(0, Math.min(30, Number(rawBusinessDayOffset) || 0));
    const order = index + 1;
    const defaultEn = channel === 'email'
      ? `Hi {{name}}, your {{brand}} assessment for {{role}} is ready. Please complete it here: {{link}}`
      : channel === 'api'
        ? `External follow-up requested for {{name}}, {{role}} at {{brand}}.`
        : `Hi {{name}}, {{brand}} here. Your assessment for {{role}} is ready: {{link}}`;
    const defaultEs = channel === 'email'
      ? `Hola {{name}}, tu evaluación de {{brand}} para {{role}} está lista. Complétala aquí: {{link}}`
      : channel === 'api'
        ? `Seguimiento externo solicitado para {{name}}, {{role}} en {{brand}}.`
        : `Hola {{name}}, somos {{brand}}. Tu evaluación para {{role}} está lista: {{link}}`;
    const apiMethod = String(step.apiMethod || step.api_method || 'POST').toUpperCase();
    return {
      id: crypto.randomUUID(),
      step_order: order,
      delay_minutes: delayMinutes,
      business_day_offset: businessDayOffset,
      channel,
      template_name: cleanText(step.templateName || step.template_name || `Step ${order}`, 120) || `Step ${order}`,
      brevo_template_id: cleanText(step.brevoTemplateId || step.brevo_template_id, 80) || null,
      subject_en: cleanText(step.subjectEn || step.subject_en || 'Your assessment is ready', 180),
      subject_es: cleanText(step.subjectEs || step.subject_es || 'Tu evaluación está lista', 180),
      message_en: cleanText(step.messageEn || step.message_en || defaultEn, 800) || defaultEn,
      message_es: cleanText(step.messageEs || step.message_es || defaultEs, 800) || defaultEs,
      api_url: cleanText(step.apiUrl || step.api_url, 500) || null,
      api_method: ['POST', 'PUT', 'PATCH'].includes(apiMethod) ? apiMethod : 'POST',
      api_headers_json: cleanText(step.apiHeadersJson || step.api_headers_json, 1000) || null,
    };
  });
}

function validateJourneyApiUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function parseJourneyApiHeaders(value) {
  const text = cleanText(value, 1000);
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return null;
    return Object.fromEntries(Object.entries(parsed)
      .filter(([key, headerValue]) => /^[a-z0-9-]+$/i.test(key) && headerValue !== null && headerValue !== undefined)
      .map(([key, headerValue]) => [key, cleanText(headerValue, 500)]));
  } catch {
    return null;
  }
}

async function validateJourneyForPublication(env, user, companyId, steps, locale) {
  const contact = contactabilityConfig(env);
  const email = emailConfig(env);
  for (const step of steps) {
    if (step.channel === 'email' && !email.configured) return { error: 'Brevo email is not configured. Configure email before publishing this journey.', code: 'journey_email_not_configured' };
    if (step.channel === 'sms' && !contact.sms.configured) return { error: 'SMS is not configured. Configure the SMS provider before publishing this journey.', code: 'journey_sms_not_configured' };
    if (step.channel === 'whatsapp') {
      if (!contact.whatsapp.configured) return { error: 'WhatsApp is not configured. Configure Infobip before publishing this journey.', code: 'journey_whatsapp_not_configured' };
      const template = await messageTemplateByReference(env, user, companyId, 'whatsapp', step.brevo_template_id || step.template_name, locale);
      if (!template) return { error: 'Every WhatsApp step must use an approved active template from Template manager.', code: 'whatsapp_template_not_approved' };
      step.template_name = template.name;
      step.brevo_template_id = template.provider_template_name || template.provider_template_id || template.id;
      step.subject_en = template.subject_en;
      step.subject_es = template.subject_es;
      step.message_en = template.message_en;
      step.message_es = template.message_es;
    }
    if (step.channel === 'api') {
      if (!validateJourneyApiUrl(step.api_url)) return { error: 'Every API webhook step must use a valid HTTPS URL before publishing.', code: 'journey_api_url_invalid' };
      if (parseJourneyApiHeaders(step.api_headers_json) === null) return { error: 'API webhook headers must be valid JSON, for example {"Authorization":"Bearer token"}.', code: 'journey_api_headers_invalid' };
    }
  }
  return null;
}

async function listContactJourneys(env, user) {
  const scope = listScope(user, 'l');
  const rows = await env.DB.prepare(`
    SELECT j.*, l.name AS list_name, c.name AS company_name, t.name_en AS test_name_en, t.name_es AS test_name_es, u.name AS created_by_name,
      (SELECT COUNT(*) FROM contact_journey_steps s WHERE s.journey_id = j.id) AS step_count,
      (SELECT COUNT(*) FROM candidate_list_members lm WHERE lm.list_id = j.list_id) AS list_member_count,
      (SELECT COUNT(*) FROM contact_journey_enrollments e WHERE e.journey_id = j.id) AS enrollment_count,
      (SELECT COUNT(*) FROM contact_journey_enrollments e WHERE e.journey_id = j.id AND e.status = 'completed') AS completed_count,
      (SELECT COUNT(*) FROM contact_journey_enrollments e WHERE e.journey_id = j.id AND e.status = 'active') AS active_enrollment_count,
      (SELECT COUNT(DISTINCT ev.candidate_id) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status IN ('accepted', 'failed', 'skipped')) AS touched_candidate_count,
      (SELECT COUNT(DISTINCT ev.candidate_id) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'accepted') AS contacted_candidate_count,
      (SELECT COUNT(DISTINCT ev.candidate_id) FROM contact_journey_events ev JOIN contact_journey_enrollments e ON e.id = ev.enrollment_id WHERE e.journey_id = j.id AND ev.status = 'failed') AS failed_candidate_count,
      (SELECT COUNT(DISTINCT a.candidate_id) FROM assessments a JOIN contact_journey_enrollments e ON e.candidate_id = a.candidate_id AND e.test_id = a.test_id WHERE e.journey_id = j.id) AS assessment_completed_count,
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
  const locale = body.locale === 'es' ? 'es' : 'en';
  const status = body.status === 'active' ? 'active' : 'draft';
  if (!steps.length) return json({ error: 'Add at least one journey step.', code: 'journey_steps_required' }, 422);
  const publicationError = status === 'active' ? await validateJourneyForPublication(env, user, list.company_id, steps, locale) : null;
  if (publicationError) return json(publicationError, 422);
  const journeyId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [env.DB.prepare(`
    INSERT INTO contact_journeys (id, company_id, list_id, test_id, created_by_user_id, name, status, locale, goal_event, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assessment_completed', ?, ?)
  `).bind(journeyId, list.company_id, list.id, test.id, user.id, name, status, locale, now, now)];
  steps.forEach((step) => statements.push(env.DB.prepare(`
    INSERT INTO contact_journey_steps (id, journey_id, step_order, delay_minutes, business_day_offset, channel, template_name, brevo_template_id, subject_en, subject_es, message_en, message_es, api_url, api_method, api_headers_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(step.id, journeyId, step.step_order, step.delay_minutes, step.business_day_offset, step.channel, step.template_name, step.brevo_template_id, step.subject_en, step.subject_es, step.message_en, step.message_es, step.api_url, step.api_method, step.api_headers_json, now)));
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
  if (status === 'active') {
    const steps = normalizedJourneySteps(visible.steps || []);
    const publicationError = await validateJourneyForPublication(env, user, visible.company_id, steps, visible.locale || 'es');
    if (publicationError) return json(publicationError, 422);
  }
  await env.DB.prepare(`UPDATE contact_journeys SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), journeyId).run();
  await audit(env, user.email, 'contact_journey_status_updated', 'contact_journey', journeyId, { status });
  return json({ journeys: await listContactJourneys(env, user) });
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function nextBusinessDate(date) {
  const result = new Date(date.getTime());
  while (isWeekend(result)) result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

function addBusinessDays(date, days) {
  const result = nextBusinessDate(date);
  let remaining = Math.max(0, Number(days || 0));
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (!isWeekend(result)) remaining -= 1;
  }
  return result;
}

function scheduledJourneyStepDate(start, step) {
  const delayMinutes = Number(step.delay_minutes || 0);
  if (step.business_day_offset !== null && step.business_day_offset !== undefined) {
    const businessDate = addBusinessDays(start, Number(step.business_day_offset || 0));
    return new Date(businessDate.getTime() + delayMinutes * 60 * 1000);
  }
  return new Date(start.getTime() + delayMinutes * 60 * 1000);
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
      const scheduledAt = scheduledJourneyStepDate(now, step).toISOString();
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

async function sendJourneyApiEvent(row, candidate, test, step, origin) {
  if (!validateJourneyApiUrl(step.api_url)) {
    const error = new Error('journey_api_url_invalid');
    error.providerStatus = 422;
    throw error;
  }
  const extraHeaders = parseJourneyApiHeaders(step.api_headers_json);
  if (extraHeaders === null) {
    const error = new Error('journey_api_headers_invalid');
    error.providerStatus = 422;
    throw error;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const payload = {
    event: { id: row.event_id, channel: 'api', scheduledAt: row.scheduled_at || null },
    journey: { id: row.journey_id, listId: row.list_id, locale: row.locale },
    candidate: { id: candidate.id, name: candidate.name, email: candidate.email, phone: candidate.phone, role: candidate.role, site: candidate.site },
    test: { id: test.id, slug: test.slug, nameEn: test.name_en, nameEs: test.name_es },
    message: {
      en: templateInvitationMessage(candidate, 'en', '', step),
      es: templateInvitationMessage(candidate, 'es', '', step),
    },
    source: { app: 'Gazelle Assessment', baseUrl: origin },
  };
  try {
    const response = await fetch(step.api_url, {
      method: step.api_method || 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'Gazelle-Journeys/1.0', 'x-gazelle-journey-event': row.event_id, ...extraHeaders },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('api_webhook_rejected');
      error.providerStatus = response.status;
      error.providerMessage = cleanText(body.error || body.message || response.statusText, 180);
      throw error;
    }
    return { providerMessageId: cleanText(body.id || body.messageId || body.reference || response.headers.get('x-request-id'), 120) || `api:${row.event_id}` };
  } finally {
    clearTimeout(timeout);
  }
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
    api_url: row.api_url, api_method: row.api_method, api_headers_json: row.api_headers_json,
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
    if (row.channel === 'api') {
      const sent = await sendJourneyApiEvent(row, candidate, test, step, origin);
      await env.DB.prepare(`
        UPDATE contact_journey_events SET status = 'accepted', invitation_id = NULL, provider_message_id = ?, sent_at = ?, error_code = NULL, updated_at = ? WHERE id = ?
      `).bind(sent.providerMessageId, claimedAt, claimedAt, row.event_id).run();
      return;
    }
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
    SELECT ev.id AS event_id, ev.enrollment_id, ev.channel, ev.scheduled_at, e.journey_id,
      j.list_id, j.locale, j.company_id, COALESCE(co.candidate_brand_name, co.name) AS candidate_brand_name,
      s.brevo_template_id, s.subject_en, s.subject_es, s.message_en, s.message_es, s.api_url, s.api_method, s.api_headers_json,
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
