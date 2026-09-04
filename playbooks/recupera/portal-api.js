/**
 * Recupera public payer portal — plain script for Worker concat (after api.js).
 */
const RECUPERA_PORTAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RECUPERA_PORTAL_SOURCE = 'portal';

function recuperaPortalInstantPay(env) {
  return env.RECUPERA_PORTAL_INSTANT_PAY === 'true';
}

function recuperaPortalWantsJson(request) {
  const accept = String(request.headers.get('accept') || '').toLowerCase();
  return accept.includes('application/json');
}

function recuperaPortalOrigin(request, env) {
  const configured = cleanText(env.APP_BASE_URL, 500).replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}

function recuperaPortalFormatMoney(cents, currency) {
  const value = Number(cents || 0) / 100;
  const code = cleanText(currency, 8) || 'GTQ';
  try {
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value.toFixed(0)} ${code}`;
  }
}

function recuperaPortalPublicPayload(obligation, companyName) {
  return {
    balanceCents: obligation.balance_cents,
    amountCents: obligation.amount_cents,
    currency: obligation.currency || 'GTQ',
    dueDate: obligation.due_date,
    reference: obligation.reference || null,
    status: obligation.status,
    stageKey: obligation.stage_key,
    companyName: companyName || null,
    isOpen: obligation.status === 'open',
  };
}

async function recuperaObligationFromPortalToken(env, rawToken, touchLastUsed = true) {
  const token = cleanText(rawToken, 200);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT o.*, p.id AS portal_link_id, p.expires_at AS portal_expires_at, p.revoked_at AS portal_revoked_at,
      co.name AS company_name
    FROM obligation_portal_links p
    JOIN obligations o ON o.id = p.obligation_id
    JOIN companies co ON co.id = o.company_id
    WHERE p.token_hash = ?
  `).bind(tokenHash).first();
  if (!row || row.portal_revoked_at) return null;
  if (new Date(row.portal_expires_at).getTime() <= Date.now()) return null;
  if (!await recuperaPlaybookEnabled(env, row.company_id)) return null;
  if (touchLastUsed) {
    await env.DB.prepare(`UPDATE obligation_portal_links SET last_used_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), row.portal_link_id).run();
  }
  return { obligation: row, portalLinkId: row.portal_link_id, token, companyName: row.company_name };
}

async function recuperaPortalRateLimitPost(request, env, token) {
  const key = await sha256(cleanText(token, 200) || 'missing');
  return rateLimit(env, request, 'recupera_portal_post', key, 24, 15 * 60);
}

async function recuperaPortalInsertPayment(env, obligation, status) {
  const now = new Date().toISOString();
  const paymentId = crypto.randomUUID();
  const amountCents = Number(obligation.balance_cents) || 0;
  const statements = [
    env.DB.prepare(`
      INSERT INTO payments (id, company_id, obligation_id, amount_cents, currency, provider, provider_payment_id, status, paid_at, created_at)
      VALUES (?, ?, ?, ?, ?, 'recupera_portal', ?, ?, ?, ?)
    `).bind(paymentId, obligation.company_id, obligation.id, amountCents, obligation.currency || 'GTQ', `portal-${paymentId}`, status, now, now),
  ];
  if (status === 'completed') {
    statements.push(env.DB.prepare(`
      UPDATE obligations SET balance_cents = 0, stage_key = 'PAID', status = 'closed', updated_at = ? WHERE id = ?
    `).bind(now, obligation.id));
  }
  await env.DB.batch(statements);
  return paymentId;
}

function recuperaPortalHtml(view) {
  const money = escapeHtml(view.balanceLabel);
  const company = escapeHtml(view.companyName || 'Meikapen');
  const reference = view.reference ? `<p class="meta">${escapeHtml(view.reference)}</p>` : '';
  const due = view.dueDate ? `<p class="meta">Vence ${escapeHtml(view.dueDate)} · Due ${escapeHtml(view.dueDate)}</p>` : '';
  const closed = view.isOpen ? '' : '<p class="status">Esta obligación ya está cerrada. · This obligation is closed.</p>';
  const actions = view.isOpen ? `
    <div class="actions">
      <button type="button" class="primary" data-action="pay">Pagar · Pay</button>
      <button type="button" data-action="paid">Ya pagué · I already paid</button>
      <button type="button" data-action="promise-toggle">Prometer pago · Promise payment</button>
      <button type="button" data-action="dispute-toggle">Tengo un problema · I have a problem</button>
    </div>
    <form id="promise-form" class="panel hidden">
      <label>Fecha prometida · Promise date<input type="date" name="promiseDate" required></label>
      <label>Monto (opcional) · Amount (optional)<input type="number" name="amount" min="1" step="0.01" placeholder="${escapeHtml((view.balanceCents / 100).toFixed(2))}"></label>
      <button type="submit">Enviar promesa · Submit promise</button>
    </form>
    <form id="dispute-form" class="panel hidden">
      <label>Motivo · Reason<input type="text" name="reasonCode" maxlength="80" placeholder="billing_error"></label>
      <label>Notas · Notes<textarea name="notes" maxlength="500" rows="3"></textarea></label>
      <button type="submit">Abrir caso · Open dispute</button>
    </form>
  ` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pago · Payment</title>
  <style>
    :root { color-scheme: light dark; --bg: #f5f5f7; --card: #fff; --text: #1d1d1f; --muted: #6e6e73; --accent: #0071e3; --border: rgba(0,0,0,.08); }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #000; --card: #1c1c1e; --text: #f5f5f7; --muted: #a1a1a6; --border: rgba(255,255,255,.12); }
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); display: grid; place-items: center; padding: 24px; }
    main { width: min(420px, 100%); background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px 24px; box-shadow: 0 12px 40px rgba(0,0,0,.08); }
    h1 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 600; }
    .amount { font-size: 2.5rem; font-weight: 600; letter-spacing: -0.03em; margin: 16px 0 8px; }
    .meta { margin: 0; color: var(--muted); font-size: .9rem; }
    .status { margin-top: 16px; padding: 12px; border-radius: 12px; background: rgba(0,0,0,.04); font-size: .9rem; }
    .actions { display: grid; gap: 10px; margin-top: 24px; }
    button { appearance: none; border: 1px solid var(--border); background: var(--card); color: var(--text); border-radius: 12px; padding: 12px 14px; font-size: .95rem; cursor: pointer; }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    .panel { margin-top: 16px; display: grid; gap: 10px; }
    .panel.hidden { display: none; }
    label { display: grid; gap: 6px; font-size: .85rem; color: var(--muted); }
    input, textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font: inherit; background: transparent; color: inherit; }
    #message { margin-top: 16px; min-height: 1.2em; font-size: .9rem; color: var(--muted); }
    #message.ok { color: #248a3d; }
    #message.err { color: #d70015; }
    .powered { margin: 20px 0 0; text-align: center; font-size: .75rem; color: var(--muted); }
  </style>
</head>
<body>
  <main>
    <p class="meta">${company}</p>
    <h1>Saldo pendiente · Balance due</h1>
    <p class="amount">${money}</p>
    ${reference}
    ${due}
    ${closed}
    ${actions}
    <p id="message" role="status" aria-live="polite"></p>
    <p class="powered">powered by Meikapen</p>
  </main>
  <script>
    const token = ${JSON.stringify(view.token)};
    const base = ${JSON.stringify(view.basePath)};
    const msg = document.getElementById('message');
    function show(text, kind) {
      msg.textContent = text;
      msg.className = kind || '';
    }
    async function post(path, body) {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Error');
      return data;
    }
    document.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-action');
        if (action === 'promise-toggle') {
          document.getElementById('promise-form').classList.toggle('hidden');
          document.getElementById('dispute-form').classList.add('hidden');
          return;
        }
        if (action === 'dispute-toggle') {
          document.getElementById('dispute-form').classList.toggle('hidden');
          document.getElementById('promise-form').classList.add('hidden');
          return;
        }
        btn.disabled = true;
        try {
          if (action === 'pay') {
            const data = await post('/pay', {});
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            show(data.message || 'Intención registrada. · Intent registered.', 'ok');
          } else if (action === 'paid') {
            const data = await post('/paid', {});
            show(data.message || 'Gracias. Revisaremos su pago. · Thanks. We will review your payment.', 'ok');
          }
        } catch (error) {
          show(error.message, 'err');
        } finally {
          btn.disabled = false;
        }
      });
    });
    document.getElementById('promise-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const promiseDate = form.promiseDate.value;
      const amount = form.amount.value;
      const body = { promiseDate };
      if (amount) body.amountCents = Math.round(Number(amount) * 100);
      try {
        await post('/promise', body);
        show('Promesa registrada. · Promise recorded.', 'ok');
        form.classList.add('hidden');
      } catch (error) {
        show(error.message, 'err');
      }
    });
    document.getElementById('dispute-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      try {
        await post('/dispute', {
          reasonCode: form.reasonCode.value || undefined,
          notes: form.notes.value || undefined,
        });
        show('Caso abierto. · Dispute opened.', 'ok');
        form.classList.add('hidden');
      } catch (error) {
        show(error.message, 'err');
      }
    });
  </script>
</body>
</html>`;
}

async function recuperaPortalGet(request, env, token) {
  const access = await recuperaObligationFromPortalToken(env, token);
  if (!access) return json({ error: 'not_found', code: 'portal_link_invalid' }, 404);
  const payload = recuperaPortalPublicPayload(access.obligation, access.companyName);
  if (recuperaPortalWantsJson(request)) return json(payload);
  const html = recuperaPortalHtml({
    token,
    basePath: `/p/${token}`,
    companyName: access.companyName,
    reference: access.obligation.reference,
    dueDate: access.obligation.due_date,
    balanceCents: access.obligation.balance_cents,
    balanceLabel: recuperaPortalFormatMoney(access.obligation.balance_cents, access.obligation.currency),
    isOpen: access.obligation.status === 'open',
  });
  return new Response(html, { headers: assetHeaders('text/html; charset=utf-8', 'no-cache', true) });
}

async function recuperaPortalPostPromise(request, env, token) {
  if (!await recuperaPortalRateLimitPost(request, env, token)) {
    return json({ error: 'Too many requests.', code: 'rate_limited' }, 429);
  }
  const access = await recuperaObligationFromPortalToken(env, token, false);
  if (!access) return json({ error: 'not_found', code: 'portal_link_invalid' }, 404);
  if (access.obligation.status !== 'open') {
    return json({ error: 'Obligation is closed.', code: 'obligation_closed' }, 422);
  }
  const body = await request.json().catch(() => ({}));
  const promiseDate = cleanText(body.promiseDate, 20);
  if (!recuperaIsoDateValid(promiseDate)) {
    return json({ error: 'promiseDate must be YYYY-MM-DD.', code: 'invalid_promise_date' }, 422);
  }
  const amountCents = Number.isFinite(Number(body.amountCents)) && Number(body.amountCents) > 0
    ? Number(body.amountCents)
    : Number(access.obligation.balance_cents) || 0;
  const now = new Date().toISOString();
  const promiseId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO promises (id, company_id, obligation_id, amount_cents, promise_date, status, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?)
  `).bind(promiseId, access.obligation.company_id, access.obligation.id, amountCents, promiseDate, RECUPERA_PORTAL_SOURCE, now, now).run();
  await audit(env, RECUPERA_PORTAL_SOURCE, 'recupera_portal_promise', 'obligation', access.obligation.id, {
    companyId: access.obligation.company_id, promiseId,
  });
  return json({ promiseId, promiseDate, amountCents });
}

async function recuperaPortalPostDispute(request, env, token) {
  if (!await recuperaPortalRateLimitPost(request, env, token)) {
    return json({ error: 'Too many requests.', code: 'rate_limited' }, 429);
  }
  const access = await recuperaObligationFromPortalToken(env, token, false);
  if (!access) return json({ error: 'not_found', code: 'portal_link_invalid' }, 404);
  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const disputeId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO disputes (id, company_id, obligation_id, reason_code, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
  `).bind(
    disputeId,
    access.obligation.company_id,
    access.obligation.id,
    cleanText(body.reasonCode, 80) || null,
    cleanText(body.notes, 500) || null,
    now,
    now,
  ).run();
  await audit(env, RECUPERA_PORTAL_SOURCE, 'recupera_portal_dispute', 'obligation', access.obligation.id, {
    companyId: access.obligation.company_id, disputeId,
  });
  return json({ disputeId, status: 'open' });
}

async function recuperaPortalPostPaid(request, env, token) {
  if (!await recuperaPortalRateLimitPost(request, env, token)) {
    return json({ error: 'Too many requests.', code: 'rate_limited' }, 429);
  }
  const access = await recuperaObligationFromPortalToken(env, token, false);
  if (!access) return json({ error: 'not_found', code: 'portal_link_invalid' }, 404);
  if (access.obligation.status !== 'open') {
    return json({ message: 'Esta obligación ya está cerrada. · This obligation is already closed.' });
  }
  const instant = recuperaPortalInstantPay(env);
  const status = instant ? 'completed' : 'pending_verification';
  const paymentId = await recuperaPortalInsertPayment(env, access.obligation, status);
  await audit(env, RECUPERA_PORTAL_SOURCE, 'recupera_portal_paid', 'obligation', access.obligation.id, {
    companyId: access.obligation.company_id, paymentId, status,
  });
  if (instant) {
    return json({
      paymentId,
      status,
      message: 'Pago registrado. Gracias. · Payment recorded. Thank you.',
      obligation: recuperaMapObligationRow(await recuperaLoadObligation(env, access.obligation.company_id, access.obligation.id)),
    });
  }
  return json({
    paymentId,
    status,
    message: 'Gracias. Revisaremos su pago. · Thanks. We will review your payment.',
  });
}

async function recuperaPortalPostPay(request, env, token) {
  if (!await recuperaPortalRateLimitPost(request, env, token)) {
    return json({ error: 'Too many requests.', code: 'rate_limited' }, 429);
  }
  const access = await recuperaObligationFromPortalToken(env, token, false);
  if (!access) return json({ error: 'not_found', code: 'portal_link_invalid' }, 404);
  if (access.obligation.status !== 'open') {
    return json({ mode: 'manual', message: 'Esta obligación ya está cerrada. · This obligation is already closed.' });
  }
  if (recurrenteConfigured(env) && recuperaPaymentsEnabled(env)) {
    const origin = recuperaPortalOrigin(request, env);
    const portalPath = `/p/${token}`;
    const checkout = await recuperaCreateRecurrenteCheckout(env, {
      obligation: access.obligation,
      successUrl: `${origin}${portalPath}`,
      cancelUrl: `${origin}${portalPath}`,
    });
    if (checkout.ok) {
      await audit(env, RECUPERA_PORTAL_SOURCE, 'recupera_portal_pay_checkout', 'obligation', access.obligation.id, {
        companyId: access.obligation.company_id,
        checkoutId: checkout.checkoutId,
      });
      return json({ mode: 'recurrente', url: checkout.checkoutUrl });
    }
  }
  await audit(env, RECUPERA_PORTAL_SOURCE, 'recupera_portal_pay_intent', 'obligation', access.obligation.id, {
    companyId: access.obligation.company_id,
  });
  return json({
    mode: 'manual',
    message: 'Intención de pago registrada. Un asesor le contactará. · Payment intent registered. An advisor will contact you.',
  });
}

async function handleRecuperaPublicPortal(request, env, url) {
  await ensureSchema(env);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'p' || !parts[1]) return new Response('Not found', { status: 404 });
  const token = parts[1];
  const action = parts[2] || null;
  if (!action && request.method === 'GET') return recuperaPortalGet(request, env, token);
  if (action === 'promise' && request.method === 'POST') return recuperaPortalPostPromise(request, env, token);
  if (action === 'dispute' && request.method === 'POST') return recuperaPortalPostDispute(request, env, token);
  if (action === 'paid' && request.method === 'POST') return recuperaPortalPostPaid(request, env, token);
  if (action === 'pay' && request.method === 'POST') return recuperaPortalPostPay(request, env, token);
  return new Response('Not found', { status: 404 });
}
