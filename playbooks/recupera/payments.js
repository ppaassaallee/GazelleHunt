/**
 * Recupera payments — Recurrente (GTQ) with local stub fallback.
 * Feature-flagged via RECUPERA_PAYMENTS_ENABLED; Recurrente when RECURRENTE_SECRET_KEY is set.
 */
const RECURRENTE_API_BASE = 'https://app.recurrente.com/api';
const RECURRENTE_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

function recuperaPaymentsEnabled(env) {
  return env.RECUPERA_PAYMENTS_ENABLED === 'true';
}

function recurrenteConfigured(env) {
  return Boolean(cleanText(env.RECURRENTE_SECRET_KEY, 500));
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

function recurrenteWebhookKeyBytes(secret) {
  const normalized = cleanText(secret, 500);
  const encoded = normalized.startsWith('whsec_') ? normalized.slice(6) : normalized;
  const padded = `${encoded}${'==='.slice((encoded.length + 3) % 4)}`;
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function recurrenteBytesToBase64(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
  return btoa(binary);
}

async function verifyRecurrenteWebhook(rawBody, headers, secret) {
  const svixId = cleanText(headers.get('svix-id'), 200);
  const svixTimestamp = cleanText(headers.get('svix-timestamp'), 40);
  const svixSignature = cleanText(headers.get('svix-signature'), 2000);
  if (!svixId || !svixTimestamp || !svixSignature || !cleanText(secret, 500)) return false;
  const timestampSeconds = Number(svixTimestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > RECURRENTE_WEBHOOK_TOLERANCE_SECONDS) return false;
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const keyBytes = recurrenteWebhookKeyBytes(secret);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signedContent));
  const expected = recurrenteBytesToBase64(digest);
  for (const entry of svixSignature.split(' ')) {
    if (!entry.startsWith('v1,')) continue;
    if (constantTimeEqual(entry.slice(3), expected)) return true;
  }
  return false;
}

function recuperaAppendObligationQuery(url, obligationId) {
  const base = cleanText(url, 2000);
  if (!base) return base;
  const oid = cleanText(obligationId, 100);
  if (!oid) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}oid=${encodeURIComponent(oid)}`;
}

async function recuperaCreateRecurrenteCheckout(env, { obligation, successUrl, cancelUrl }) {
  const secretKey = cleanText(env.RECURRENTE_SECRET_KEY, 500);
  if (!secretKey) return { ok: false, code: 'recurrente_not_configured' };
  const amountCents = Number(obligation?.balance_cents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { ok: false, code: 'invalid_amount' };
  const currency = cleanText(obligation.currency, 8) || 'GTQ';
  const reference = cleanText(obligation.reference, 120);
  const itemName = reference ? `Pago ${reference}` : `Pago obligación ${cleanText(obligation.id, 100)}`;
  const resolvedSuccessUrl = recuperaAppendObligationQuery(successUrl, obligation.id);
  const payload = {
    items: [{
      name: itemName,
      amount_in_cents: amountCents,
      currency,
      quantity: 1,
    }],
    success_url: resolvedSuccessUrl,
    cancel_url: cleanText(cancelUrl, 2000) || resolvedSuccessUrl,
    metadata: {
      obligation_id: obligation.id,
      company_id: obligation.company_id,
    },
  };
  const headers = {
    'Content-Type': 'application/json',
    'X-SECRET-KEY': secretKey,
  };
  const publicKey = cleanText(env.RECURRENTE_PUBLIC_KEY, 500);
  if (publicKey) headers['X-PUBLIC-KEY'] = publicKey;
  const response = await fetch(`${RECURRENTE_API_BASE}/checkouts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  let data = await response.json().catch(() => null);
  if (!response.ok && data && typeof data === 'object' && /metadata/i.test(JSON.stringify(data))) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.metadata;
    const retry = await fetch(`${RECURRENTE_API_BASE}/checkouts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fallbackPayload),
    });
    data = await retry.json().catch(() => data);
    if (retry.ok) {
      const checkoutId = cleanText(data?.id || data?.checkout_id, 160);
      const checkoutUrl = cleanText(data?.checkout_url || data?.url, 2000);
      if (checkoutId && checkoutUrl) {
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO recupera_checkouts (checkout_id, obligation_id, company_id, created_at)
          VALUES (?, ?, ?, ?)
        `).bind(checkoutId, obligation.id, obligation.company_id, now).run();
        return { ok: true, checkoutId, checkoutUrl };
      }
    }
    return { ok: false, code: 'recurrente_checkout_failed', status: response.status, detail: data };
  }
  if (!response.ok) return { ok: false, code: 'recurrente_checkout_failed', status: response.status, detail: data };
  const checkoutId = cleanText(data?.id || data?.checkout_id, 160);
  const checkoutUrl = cleanText(data?.checkout_url || data?.url, 2000);
  if (!checkoutId || !checkoutUrl) return { ok: false, code: 'recurrente_invalid_response', detail: data };
  const now = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO recupera_checkouts (checkout_id, obligation_id, company_id, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(checkoutId, obligation.id, obligation.company_id, now).run();
  return { ok: true, checkoutId, checkoutUrl };
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

function recuperaRecurrenteEventSucceeded(payload) {
  const eventType = cleanText(payload?.type || payload?.event, 80);
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const status = cleanText(data?.status, 40);
  return eventType === 'intent.succeeded' || status === 'succeeded' || status === 'paid';
}

function recuperaExtractObligationFromRecurrentePayload(data) {
  const metadata = data?.metadata && typeof data.metadata === 'object' ? data.metadata : {};
  let obligationId = cleanText(metadata.obligation_id || metadata.obligationId, 100);
  let companyId = cleanText(metadata.company_id || metadata.companyId, 100);
  if (obligationId) return { obligationId, companyId: companyId || null };
  const checkoutMetadata = data?.checkout?.metadata;
  if (checkoutMetadata && typeof checkoutMetadata === 'object') {
    obligationId = cleanText(checkoutMetadata.obligation_id || checkoutMetadata.obligationId, 100);
    companyId = cleanText(checkoutMetadata.company_id || checkoutMetadata.companyId, 100);
    if (obligationId) return { obligationId, companyId: companyId || null };
  }
  const successUrl = cleanText(data?.success_url || data?.checkout?.success_url, 2000);
  if (successUrl) {
    try {
      const oid = new URL(successUrl).searchParams.get('oid');
      if (oid) return { obligationId: cleanText(oid, 100), companyId: companyId || null };
    } catch {
      // ignore malformed URL
    }
  }
  return { obligationId: null, companyId: companyId || null };
}

async function recuperaResolveObligationFromRecurrenteWebhook(env, payload) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const extracted = recuperaExtractObligationFromRecurrentePayload(data);
  if (extracted.obligationId) return extracted;
  const checkoutId = cleanText(data?.checkout_id || data?.checkout?.id || data?.id, 160);
  if (!checkoutId) return extracted;
  const row = await env.DB.prepare(`SELECT obligation_id, company_id FROM recupera_checkouts WHERE checkout_id = ?`).bind(checkoutId).first();
  if (!row) return extracted;
  return {
    obligationId: cleanText(row.obligation_id, 100),
    companyId: cleanText(row.company_id, 100),
  };
}

async function recuperaHandleRecurrenteWebhook(request, env) {
  if (!recuperaPaymentsEnabled(env)) return json({ error: 'not_found', code: 'payments_disabled' }, 404);
  const secret = cleanText(env.RECURRENTE_WEBHOOK_SECRET, 500);
  if (!secret) return json({ error: 'not_found', code: 'webhook_not_configured' }, 404);
  const rawBody = await request.text();
  const verified = await verifyRecurrenteWebhook(rawBody, request.headers, secret);
  if (!verified) return json({ error: 'Unauthorized.', code: 'invalid_signature' }, 401);
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid body.', code: 'invalid_body' }, 422);
  }
  if (!recuperaRecurrenteEventSucceeded(payload)) return json({ ok: true, ignored: true });
  const { obligationId, companyId: mappedCompanyId } = await recuperaResolveObligationFromRecurrenteWebhook(env, payload);
  if (!obligationId) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 422);
  const obligation = await env.DB.prepare(`SELECT * FROM obligations WHERE id = ?`).bind(obligationId).first();
  if (!obligation) return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  if (mappedCompanyId && obligation.company_id !== mappedCompanyId) {
    return json({ error: 'Obligation not found.', code: 'obligation_not_found' }, 404);
  }
  if (!await recuperaPaymentsPlaybookEnabled(env, obligation.company_id)) {
    return json({ error: 'not_found', code: 'playbook_disabled' }, 404);
  }
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const amountCents = Number(data?.amount_in_cents ?? data?.amount_cents);
  const providerPaymentId = cleanText(data?.id || data?.payment_intent_id || data?.intent_id, 160);
  const result = await recuperaRecordCompletedPayment(env, {
    companyId: obligation.company_id,
    obligationId,
    amountCents: Number.isFinite(amountCents) ? amountCents : obligation.balance_cents,
    currency: obligation.currency,
    provider: 'recurrente',
    providerPaymentId,
    actor: 'recurrente-webhook',
  });
  if (!result.ok) {
    if (result.code === 'obligation_not_found') return json({ error: 'Obligation not found.', code: result.code }, 404);
    if (result.code === 'obligation_not_open') return json({ error: 'Obligation is not open.', code: result.code }, 422);
    return json({ error: 'Payment could not be recorded.', code: result.code || 'payment_failed' }, 422);
  }
  return json({ ok: true, paymentId: result.paymentId, obligationId: result.obligationId });
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
