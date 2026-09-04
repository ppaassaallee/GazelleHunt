/**
 * Rocío v1 — heuristic inbound text intelligence (no LLM).
 * Plain script for Worker concat (before api.js).
 */
const ROCIO_CONFIDENCE_THRESHOLD = 0.8;

const ROCIO_WEEKDAY_OFFSET = {
  lunes: 1, monday: 1,
  martes: 2, tuesday: 2,
  miercoles: 3, miércoles: 3, wednesday: 3,
  jueves: 4, thursday: 4,
  viernes: 5, friday: 5,
  sabado: 6, sábado: 6, saturday: 6,
  domingo: 0, sunday: 0,
};

function rocioInboundEnabled(env) {
  return env.RECUPERA_ROCIO_INBOUND === 'true';
}

function rocioExtractPromiseDate(text, now = new Date()) {
  const lower = String(text || '').toLowerCase();
  for (const [token, targetDow] of Object.entries(ROCIO_WEEKDAY_OFFSET)) {
    if (!lower.includes(token)) continue;
    const currentDow = now.getUTCDay();
    let daysAhead = (targetDow - currentDow + 7) % 7;
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() + daysAhead);
    return target.toISOString().slice(0, 10);
  }
  const dayMatch = lower.match(/el\s+(\d{1,2})\b/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    if (!Number.isFinite(day) || day < 1 || day > 31) return null;
    let month = now.getUTCMonth();
    let year = now.getUTCFullYear();
    if (day < now.getUTCDate()) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function rocioClassifyIntent(text) {
  const normalized = cleanText(text, 2000);
  if (!normalized) {
    return { intent: 'UNKNOWN', promiseDate: null, confidence: 0, needsHuman: true, suggestedAction: null };
  }
  if (/no (me )?contact|stop|baja/i.test(normalized)) {
    return { intent: 'OPT_OUT', promiseDate: null, confidence: 0.95, needsHuman: false, suggestedAction: 'opt_out' };
  }
  if (/no debo|error|incorrecto|dispute|no reconoc/i.test(normalized)) {
    return { intent: 'DISPUTE', promiseDate: null, confidence: 0.88, needsHuman: false, suggestedAction: 'dispute' };
  }
  if (/ya pagu[eé]|comprobante|transfer[ií]/i.test(normalized)) {
    return { intent: 'ALREADY_PAID', promiseDate: null, confidence: 0.86, needsHuman: false, suggestedAction: 'verify_payment' };
  }
  if (/no puedo|desempleo|enfermedad|hardship/i.test(normalized)) {
    return { intent: 'HARDSHIP', promiseDate: null, confidence: 0.72, needsHuman: true, suggestedAction: 'escalate' };
  }
  if (/pagar[eé]|prometo|el (lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|\d{1,2})|friday|will pay/i.test(normalized)) {
    const promiseDate = rocioExtractPromiseDate(normalized);
    return {
      intent: 'PROMISE_TO_PAY',
      promiseDate,
      confidence: promiseDate ? 0.92 : 0.84,
      needsHuman: false,
      suggestedAction: 'promise',
    };
  }
  return { intent: 'UNKNOWN', promiseDate: null, confidence: 0.25, needsHuman: true, suggestedAction: null };
}


async function rocioInsertIntentJob(env, {
  companyId, obligationId, messageId, text, actor, classification, status, errorCode = null,
}) {
  const now = new Date().toISOString();
  const jobId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO rocio_intent_jobs
      (id, company_id, obligation_id, message_id, status, input_json, output_json, confidence, attempt_count, error_code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).bind(
    jobId,
    companyId,
    obligationId || null,
    messageId || null,
    status,
    JSON.stringify({ text: cleanText(text, 2000), actor: actor || null }),
    JSON.stringify(classification),
    classification.confidence,
    errorCode,
    now,
    now,
  ).run();
  return jobId;
}

async function rocioApplyClassification(env, { companyId, obligationId, text, classification, actor }) {
  const obligation = await env.DB.prepare(`SELECT * FROM obligations WHERE id = ? AND company_id = ?`).bind(obligationId, companyId).first();
  if (!obligation) return { ok: false, code: 'obligation_not_found', applied: false };
  const now = new Date().toISOString();
  const statements = [];

  if (classification.intent === 'PROMISE_TO_PAY') {
    const promiseDate = classification.promiseDate || obligation.due_date;
    const promiseId = crypto.randomUUID();
    statements.push(env.DB.prepare(`
      INSERT INTO promises (id, company_id, obligation_id, amount_cents, promise_date, status, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'open', 'rocio_inbound', ?, ?)
    `).bind(promiseId, companyId, obligationId, Number(obligation.balance_cents) || 0, promiseDate, now, now));
    statements.push(env.DB.prepare(`
      UPDATE obligations SET stage_key = 'PROMISE', updated_at = ? WHERE id = ?
    `).bind(now, obligationId));
  } else if (classification.intent === 'ALREADY_PAID') {
    const paymentId = crypto.randomUUID();
    statements.push(env.DB.prepare(`
      INSERT INTO payments (id, company_id, obligation_id, amount_cents, currency, provider, provider_payment_id, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'rocio_inbound', ?, 'pending_verification', ?, ?)
    `).bind(
      paymentId,
      companyId,
      obligationId,
      Number(obligation.balance_cents) || 0,
      obligation.currency || 'GTQ',
      `rocio-${paymentId}`,
      now,
      now,
    ));
  } else if (classification.intent === 'DISPUTE') {
    const disputeId = crypto.randomUUID();
    statements.push(env.DB.prepare(`
      INSERT INTO disputes (id, company_id, obligation_id, reason_code, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, 'payer_dispute', ?, 'open', ?, ?)
    `).bind(disputeId, companyId, obligationId, cleanText(text, 500), now, now));
    statements.push(env.DB.prepare(`
      UPDATE obligations SET stage_key = 'DISPUTE', updated_at = ? WHERE id = ?
    `).bind(now, obligationId));
  } else if (classification.intent === 'OPT_OUT') {
    const candidateId = obligation.subject_candidate_id;
    if (candidateId) {
      statements.push(env.DB.prepare(`
        UPDATE candidates SET do_not_contact = 1, updated_at = ? WHERE id = ? AND company_id = ?
      `).bind(now, candidateId, companyId));
    }
  } else {
    return { ok: true, applied: false };
  }

  if (statements.length) await env.DB.batch(statements);
  if (actor) {
    await audit(env, actor, 'rocio_intent_applied', 'obligation', obligationId, {
      companyId,
      intent: classification.intent,
      confidence: classification.confidence,
    });
  }
  return { ok: true, applied: true };
}

async function rocioProcessInbound(env, { companyId, obligationId, text, actor, messageId = null }) {
  await ensureSchema(env);
  const classification = rocioClassifyIntent(text);
  const canAutoApply = classification.confidence >= ROCIO_CONFIDENCE_THRESHOLD && !classification.needsHuman && obligationId;
  let applied = false;
  let status = 'needs_human';
  let errorCode = null;

  if (canAutoApply) {
    const applyResult = await rocioApplyClassification(env, { companyId, obligationId, text, classification, actor });
    if (!applyResult.ok) {
      status = 'failed';
      errorCode = applyResult.code || 'apply_failed';
    } else if (applyResult.applied) {
      applied = true;
      status = 'completed';
    }
  }

  const jobId = await rocioInsertIntentJob(env, {
    companyId,
    obligationId,
    messageId,
    text,
    actor,
    classification,
    status,
    errorCode,
  });

  return {
    jobId,
    status,
    classification,
    applied,
    obligationId: obligationId || null,
  };
}

async function rocioFindObligationForCandidate(env, companyId, candidateId) {
  const bySubject = await env.DB.prepare(`
    SELECT id FROM obligations
    WHERE company_id = ? AND subject_candidate_id = ? AND status = 'open'
    ORDER BY updated_at DESC LIMIT 1
  `).bind(companyId, candidateId).first();
  if (bySubject?.id) return bySubject.id;
  const byLink = await env.DB.prepare(`
    SELECT ojl.obligation_id AS id
    FROM obligation_journey_links ojl
    JOIN obligations o ON o.id = ojl.obligation_id
    WHERE o.company_id = ? AND o.status = 'open'
      AND ojl.enrollment_id IN (
        SELECT id FROM contact_journey_enrollments WHERE candidate_id = ? AND status = 'active'
      )
    ORDER BY ojl.created_at DESC LIMIT 1
  `).bind(companyId, candidateId).first();
  return byLink?.id || null;
}

async function rocioCandidateHasNonStoppingJourney(env, candidateId) {
  const enrollments = await env.DB.prepare(`
    SELECT e.id, j.stop_on_reply
    FROM contact_journey_enrollments e
    JOIN contact_journeys j ON j.id = e.journey_id
    WHERE e.candidate_id = ? AND e.status = 'active'
  `).bind(candidateId).all();
  return (enrollments.results || []).some((entry) => Number(entry.stop_on_reply ?? 1) === 0);
}

async function rocioMaybeProcessInfobipInbound(env, candidate, text, messageId) {
  if (!rocioInboundEnabled(env)) return null;
  if (!candidate?.id || !candidate?.company_id) return null;
  if (!await recuperaPlaybookEnabled(env, candidate.company_id)) return null;
  if (!await rocioCandidateHasNonStoppingJourney(env, candidate.id)) return null;
  const obligationId = await rocioFindObligationForCandidate(env, candidate.company_id, candidate.id);
  if (!obligationId || !cleanText(text, 2000)) return null;
  return rocioProcessInbound(env, {
    companyId: candidate.company_id,
    obligationId,
    text,
    actor: 'infobip-webhook',
    messageId: messageId || null,
  });
}
