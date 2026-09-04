/**
 * RYVO runtime — inbound provider webhooks (Brevo, Infobip).
 * Move-only extraction from server-worker.js. Do not improve.
 */

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
      SELECT e.id, j.stop_on_reply
      FROM contact_journey_enrollments e
      JOIN contact_journeys j ON j.id = e.journey_id
      WHERE e.candidate_id = ? AND e.status = 'active'
    `).bind(candidate.id).all();
    const stoppable = (enrollments.results || []).filter((entry) => Number(entry.stop_on_reply ?? 1) !== 0);
    const enrollmentIds = stoppable.map((entry) => entry.id);
    if (enrollmentIds.length) {
      await env.DB.batch(enrollmentIds.flatMap((enrollmentId) => [
        env.DB.prepare(`UPDATE contact_journey_enrollments SET status = 'stopped', completed_at = ?, stopped_reason = 'candidate_replied' WHERE id = ?`).bind(now, enrollmentId),
        env.DB.prepare(`UPDATE contact_journey_events SET status = 'skipped', error_code = 'candidate_replied', updated_at = ? WHERE enrollment_id = ? AND status = 'queued'`).bind(now, enrollmentId),
      ]));
    }
    await audit(env, 'infobip-webhook', 'candidate_whatsapp_reply_received', 'candidate', candidate.id, { from, providerMessageId: messageId || null, text: cleanText(message, 240) });
    if (env.RECUPERA_ROCIO_INBOUND === 'true' && typeof rocioMaybeProcessInfobipInbound === 'function') {
      await rocioMaybeProcessInfobipInbound(env, candidate, message, messageId || null).catch(() => {});
    }
    matched += 1;
  }
  return json({ received: true, eventCount: received, matched });
}
