import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../', import.meta.url);
const workerRoot = new URL('../../../apps/worker/', import.meta.url);

const [paymentsSource, apiSource, portalSource, legacyServerSource, buildSource] = await Promise.all([
  readFile(new URL('payments.js', recuperaRoot), 'utf8'),
  readFile(new URL('api.js', recuperaRoot), 'utf8'),
  readFile(new URL('portal-api.js', recuperaRoot), 'utf8'),
  readFile(new URL('src/legacy/server-worker.js', workerRoot), 'utf8'),
  readFile(new URL('build.mjs', workerRoot), 'utf8'),
]);

const serverSource = `${paymentsSource}\n${apiSource}\n${legacyServerSource}`;

assert.match(paymentsSource, /recuperaCreateRecurrenteCheckout/);
assert.match(paymentsSource, /verifyRecurrenteWebhook/);
assert.match(paymentsSource, /recuperaHandleRecurrenteWebhook/);
assert.match(paymentsSource, /https:\/\/app\.recurrente\.com\/api/);
assert.match(paymentsSource, /recupera_checkouts/);
assert.match(paymentsSource, /createPaymentLinkStub/);
assert.match(paymentsSource, /recurrenteConfigured/);
assert.match(apiSource, /recurrenteConfigured/);
assert.match(portalSource, /recurrenteConfigured/);
assert.match(portalSource, /recuperaCreateRecurrenteCheckout/);
assert.match(serverSource, /\/api\/recupera\/payments\/recurrente\/webhook/);
assert.match(serverSource, /recuperaHandleRecurrenteWebhook/);
assert.match(serverSource, /\/api\/recupera\/payments\/webhook/);
assert.match(buildSource, /recuperaPayments/);

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function constantTimeEqual(left, right) {
  const a = typeof left === 'string' ? new TextEncoder().encode(left) : left;
  const b = typeof right === 'string' ? new TextEncoder().encode(right) : right;
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] || 0) ^ (b[index] || 0);
  return mismatch === 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

async function audit() {}

const checkouts = [];
const paymentRows = [];
const obligations = [{
  id: 'obl-pay-1',
  company_id: 'co-1',
  balance_cents: 125000,
  currency: 'GTQ',
  reference: 'FAC-200',
  status: 'open',
}, {
  id: 'obl-pay-2',
  company_id: 'co-1',
  balance_cents: 99000,
  currency: 'GTQ',
  reference: 'FAC-201',
  status: 'open',
}];

const db = {
  prepare(sql) {
    const query = String(sql).replace(/\s+/g, ' ').trim();
    return {
      bind(...bindings) {
        return {
          async first() {
            if (query.includes('FROM obligations WHERE id = ? AND company_id = ?')) {
              const row = obligations.find((entry) => entry.id === bindings[0] && entry.company_id === bindings[1]);
              return row ? { ...row } : null;
            }
            if (query === 'SELECT * FROM obligations WHERE id = ?') {
              const row = obligations.find((entry) => entry.id === bindings[0]);
              return row ? { ...row } : null;
            }
            if (query.includes('FROM recupera_checkouts WHERE checkout_id = ?')) {
              return checkouts.find((entry) => entry.checkout_id === bindings[0]) || null;
            }
            if (query.includes('playbooks_enabled_json FROM companies')) {
              return { playbooks_enabled_json: JSON.stringify(['recupera']) };
            }
            return null;
          },
          async run() {
            if (query.includes('INSERT INTO recupera_checkouts')) {
              checkouts.push({
                checkout_id: bindings[0],
                obligation_id: bindings[1],
                company_id: bindings[2],
                created_at: bindings[3],
              });
            }
            if (query.includes('INSERT INTO payments')) {
              paymentRows.push({ id: bindings[0], obligation_id: bindings[2], status: bindings[7] });
            }
            if (query.includes('UPDATE obligations SET balance_cents = 0')) {
              const obligation = obligations.find((entry) => entry.id === bindings[1]);
              if (obligation) {
                obligation.balance_cents = 0;
                obligation.stage_key = 'PAID';
                obligation.status = 'closed';
              }
            }
            return { success: true };
          },
          async all() {
            return { results: [] };
          },
        };
      },
    };
  },
  async batch(statements) {
    for (const statement of statements) await statement.run();
  },
};

const context = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  JSON,
  URL,
  Response,
  fetch: async () => new Response('{}', { status: 500 }),
  atob,
  btoa,
  TextEncoder,
  TextDecoder,
  console,
  json,
  cleanText,
  constantTimeEqual,
  audit,
};
context.globalThis = context;

vm.runInNewContext(`${paymentsSource}\n;globalThis.__payments = {
  verifyRecurrenteWebhook,
  recuperaCreateRecurrenteCheckout,
  recuperaHandleRecurrenteWebhook,
  recuperaHandlePaymentWebhook,
  createPaymentLinkStub,
  recurrenteConfigured,
  recuperaPaymentsEnabled,
  recuperaAppendObligationQuery,
};`, context);
const payments = context.__payments;

const webhookSecret = 'whsec_dGVzdC1zZWNyZXQta2V5LTMyYnl0ZXMtbG9uZyEh';
const msgId = 'msg_test_123';
const timestamp = String(Math.floor(Date.now() / 1000));
const body = JSON.stringify({ type: 'intent.succeeded', data: { status: 'succeeded', id: 'pi_test' } });
const secretEncoded = 'dGVzdC1zZWNyZXQta2V5LTMyYnl0ZXMtbG9uZyEh';
const paddedSecret = `${secretEncoded}${'==='.slice((secretEncoded.length + 3) % 4)}`;
const keyBytes = Uint8Array.from(atob(paddedSecret), (character) => character.charCodeAt(0));
const cryptoKey = await webcrypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const digest = await webcrypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${msgId}.${timestamp}.${body}`));
const signature = `v1,${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
const headers = new Map([
  ['svix-id', msgId],
  ['svix-timestamp', timestamp],
  ['svix-signature', signature],
]);
assert.equal(await payments.verifyRecurrenteWebhook(body, { get: (name) => headers.get(name) || null }, webhookSecret), true);
assert.equal(await payments.verifyRecurrenteWebhook(body, { get: (name) => headers.get(name) || null }, 'whsec_invalid'), false);

const stub = payments.createPaymentLinkStub({
  obligationId: 'obl-1',
  amountCents: 5000,
  currency: 'GTQ',
  successUrl: 'https://example.com/p/tok',
});
assert.equal(stub.provider, 'stub');
assert.equal(stub.externalId, 'stub_obl-1');

const env = {
  DB: db,
  RECUPERA_ENABLED: 'true',
  RECUPERA_PAYMENTS_ENABLED: 'true',
  RECURRENTE_SECRET_KEY: 'sk_test',
  RECURRENTE_PUBLIC_KEY: 'pk_test',
  RECURRENTE_WEBHOOK_SECRET: webhookSecret,
};
assert.equal(payments.recurrenteConfigured(env), true);
assert.equal(payments.recurrenteConfigured({}), false);

const originalFetch = context.fetch;
context.fetch = async (url, init) => {
  assert.equal(url, 'https://app.recurrente.com/api/checkouts');
  const payload = JSON.parse(init.body);
  assert.equal(payload.items[0].amount_in_cents, 125000);
  assert.match(payload.success_url, /oid=obl-pay-1/);
  return new Response(JSON.stringify({
    id: 'chk_test_1',
    checkout_url: 'https://app.recurrente.com/checkout/chk_test_1',
  }), { status: 201, headers: { 'content-type': 'application/json' } });
};
const checkout = await payments.recuperaCreateRecurrenteCheckout(env, {
  obligation: obligations[0],
  successUrl: 'https://example.com/p/token',
  cancelUrl: 'https://example.com/p/token',
});
context.fetch = originalFetch;
assert.equal(checkout.ok, true);
assert.equal(checkout.checkoutUrl, 'https://app.recurrente.com/checkout/chk_test_1');
assert.equal(checkouts.length, 1);
assert.equal(checkouts[0].obligation_id, 'obl-pay-1');

const webhookPayload = JSON.stringify({
  type: 'intent.succeeded',
  data: {
    id: 'pi_live_1',
    status: 'succeeded',
    checkout_id: 'chk_test_1',
    amount_in_cents: 125000,
  },
});
const webhookDigest = await webcrypto.subtle.sign(
  'HMAC',
  cryptoKey,
  new TextEncoder().encode(`${msgId}.${timestamp}.${webhookPayload}`),
);
const webhookSignature = `v1,${btoa(String.fromCharCode(...new Uint8Array(webhookDigest)))}`;
const webhookRequest = new Request('https://example.com/api/recupera/payments/recurrente/webhook', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'svix-id': msgId,
    'svix-timestamp': timestamp,
    'svix-signature': webhookSignature,
  },
  body: webhookPayload,
});
const webhookResponse = await payments.recuperaHandleRecurrenteWebhook(webhookRequest, env);
assert.equal(webhookResponse.status, 200);
const webhookBody = await webhookResponse.json();
assert.equal(webhookBody.ok, true);
assert.equal(obligations[0].status, 'closed');
assert.equal(paymentRows.length, 1);

const stubWebhook = new Request('https://example.com/api/recupera/payments/webhook', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-Recupera-Payments-Secret': 'local-secret',
  },
  body: JSON.stringify({
    obligationId: 'obl-pay-2',
    amountCents: 99000,
    providerPaymentId: 'stub-pay-1',
    status: 'completed',
  }),
});
const stubEnv = {
  ...env,
  RECUPERA_PAYMENTS_WEBHOOK_SECRET: 'local-secret',
};
const stubResponse = await payments.recuperaHandlePaymentWebhook(stubWebhook, stubEnv);
assert.equal(stubResponse.status, 200);

assert.equal(
  payments.recuperaAppendObligationQuery('https://example.com/p/tok', 'obl-1'),
  'https://example.com/p/tok?oid=obl-1',
);

console.log('recupera payments tests passed');
