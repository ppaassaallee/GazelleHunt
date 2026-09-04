/**
 * Recupera payments stub — plain script for Worker concat (before api.js).
 * Recurrente placeholder; feature-flagged via RECUPERA_PAYMENTS_ENABLED.
 */
function recuperaPaymentsEnabled(env) {
  return env.RECUPERA_PAYMENTS_ENABLED === 'true';
}

async function recuperaPaymentsPlaybookEnabled(env, companyId) {
  if (env.RECUPERA_ENABLED === 'true') return true;
  if (!companyId) return false;
  const row = await env.DB.prepare(`SELECT playbooks_enabled_json FROM companies WHERE id = ?`).bind(companyId).first();
  if (!row?.playbooks_enabled_json) return false;
  try {
    const parsed = JSON.parse(row.playbooks_enabled_json);
    return Array.isArray(parsed) && parsed.includes('recupera');
  } catch {
    return false;
  }
}

function createPaymentLinkStub({ obligationId, amountCents, currency, successUrl }) {
  return { provider: 'stub', url: successUrl || null, externalId: `stub_${obligationId}` };
}

async function recuperaRecordCompletedPayment(env, {
  companyId,
  obligationId,
  amountCents,
  currency,
  provider,
  providerPaymentId,
  actor,
}) {
  const obligation = await env.DB.prepare(`SELECT * FROM obligations WHERE id = ? AND company_id = ?`)
    .bind(obligationId, companyId).first();
  if (!obligation) return { ok: false, code: 'obligation_not_found' };
  if (obligation.status !== 'open') return { ok: false, code: 'obligation_not_open' };
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const resolvedAmount = Number.isFinite(Number(amountCents)) ? Number(amountCents) : (Number(obligation.balance_cents) || 0);
  const resolvedCurrency = cleanText(currency, 8) || obligation.currency || 'GTQ';
  const resolvedProvider = cleanText(provider, 40) || 'stub';
  const resolvedProviderPaymentId = cleanText(providerPaymentId, 160) || `stub-${paymentId}`;
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO payments (id, company_id, obligation_id, amount_cents, currency, provider, provider_payment_id, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `).bind(paymentId, companyId, obligation.id, resolvedAmount, resolvedCurrency, resolvedProvider, resolvedProviderPaymentId, now, now),
    env.DB.prepare(`
      UPDATE obligations SET balance_cents = 0, stage_key = 'PAID', status = 'closed', updated_at = ? WHERE id = ?
    `).bind(now, obligation.id),
  ]);
  await audit(env, actor || 'recupera-payments-webhook', 'recupera_obligation_paid_via_webhook', 'obligation', obligation.id, {
    companyId,
    paymentId,
    amountCents: resolvedAmount,
    provider: resolvedProvider,
    providerPaymentId: resolvedProviderPaymentId,
  });
  return { ok: true, paymentId, obligationId: obligation.id };
}

async function recuperaHandlePaymentWebhook(request, env) {
  if (!recuperaPaymentsEnabled(env)) return json({ error: 'not_found', code: 'payments_disabled' }, 404);
  const secret = cleanText(request.headers.get('X-Recupera-Payments-Secret'), 200);
  const expected = cleanText(env.RECUPERA_PAYMENTS_WEBHOOK_SECRET, 200);
  if (!expected || secret !== expected) return json({ error: 'Unauthorized.', code: 'invalid_secret' }, 401);
  const body = await request.json().catch(() => null);
  const obligationId = cleanText(body?.obligationId, 100);
  const amountCents = Number(body?.amountCents);
  const providerPaymentId = cleanText(body?.providerPaymentId, 160);
  const status = cleanText(body?.status, 40);
  if (!obligationId || !status) return json({ error: 'Invalid body.', code: 'invalid_body' }, 422);
  if (status !== 'completed') return json({ ok: true, ignored: true });
  const obligation = await env.DB.prepare(`SELECT * FROM obligations WHERE id = ?`).bind(obligationId).first();
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  if (!await recuperaPaymentsPlaybookEnabled(env, obligation.company_id)) return json({ error: 'not_found', code: 'playbook_disabled' }, 404);
  const result = await recuperaRecordCompletedPayment(env, {
    companyId: obligation.company_id,
    obligationId,
    amountCents: Number.isFinite(amountCents) ? amountCents : obligation.balance_cents,
    currency: obligation.currency,
    provider: 'stub',
    providerPaymentId,
    actor: 'recupera-payments-webhook',
  });
  if (!result.ok) {
    if (result.code === 'obligation_not_found') return json({ error: 'Obligation not found.', code: result.code }, 404);
    if (result.code === 'obligation_not_open') return json({ error: 'Obligation is not open.', code: result.code }, 422);
    return json({ error: 'Payment could not be recorded.', code: result.code || 'payment_failed' }, 422);
  }
  return json({ ok: true, paymentId: result.paymentId, obligationId: result.obligationId });
}
