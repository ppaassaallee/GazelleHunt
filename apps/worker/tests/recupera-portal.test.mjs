import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createHash, webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../../../playbooks/recupera/', import.meta.url);
const [stageSource, apiSource, portalSource, legacyServerSource, buildSource] = await Promise.all([
  readFile(new URL('stage.js', recuperaRoot), 'utf8'),
  readFile(new URL('api.js', recuperaRoot), 'utf8'),
  readFile(new URL('portal-api.js', recuperaRoot), 'utf8'),
  readFile(new URL('../src/legacy/server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../build.mjs', import.meta.url), 'utf8'),
]);

assert.match(apiSource, /portal-link/);
assert.match(apiSource, /obligation_portal_links/);
assert.match(portalSource, /handleRecuperaPublicPortal/);
assert.match(portalSource, /recupera_portal_pay_intent/);
assert.match(portalSource, /pending_verification/);
assert.match(legacyServerSource, /handleRecuperaPublicPortal/);
assert.match(legacyServerSource, /obligation_portal_links/);
assert.match(buildSource, /recuperaPortalApi/);
assert.match(buildSource, /portal-api\.js/);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const auditCalls = [];
const portalLinks = [];
const promises = [];
const disputes = [];
const payments = [];
let obligation = {
  id: 'obl-1',
  company_id: 'co-1',
  payer_name: 'Ana López',
  payer_email: 'ana@example.com',
  reference: 'FAC-100',
  currency: 'GTQ',
  amount_cents: 450000,
  balance_cents: 450000,
  due_date: '2026-09-01',
  stage_key: 'DPD_1_7',
  strategy_key: 'EQUILIBRADA',
  status: 'open',
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
};

const rawToken = 'portal-test-token-abc';
const tokenHash = sha256(rawToken);
portalLinks.push({
  id: 'link-1',
  company_id: 'co-1',
  obligation_id: obligation.id,
  token_hash: tokenHash,
  expires_at: '2026-12-31T00:00:00.000Z',
  revoked_at: null,
  last_used_at: null,
  created_at: '2026-09-01T00:00:00.000Z',
});

const dbState = {
  companies: [{ id: 'co-1', status: 'active', playbooks_enabled_json: JSON.stringify(['recupera']) }],
};

const db = {
  prepare(sql) {
    const query = String(sql).replace(/\s+/g, ' ').trim();
    return {
      bind(...bindings) {
        return {
          async first() {
            if (query.includes('playbooks_enabled_json FROM companies')) {
              return dbState.companies.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM obligation_portal_links p')) {
              const link = portalLinks.find((row) => row.token_hash === bindings[0]);
              if (!link) return null;
              return {
                ...obligation,
                portal_link_id: link.id,
                portal_expires_at: link.expires_at,
                portal_revoked_at: link.revoked_at,
                company_name: 'Acme Co',
              };
            }
            if (query.includes('FROM obligations WHERE id = ? AND company_id = ?')) {
              return obligation.company_id === bindings[1] && obligation.id === bindings[0] ? { ...obligation } : null;
            }
            return null;
          },
          async run() {
            if (query.includes('UPDATE obligation_portal_links SET last_used_at')) {
              const link = portalLinks.find((row) => row.id === bindings[1]);
              if (link) link.last_used_at = bindings[0];
            }
            if (query.includes('INSERT INTO obligation_portal_links')) {
              portalLinks.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                token_hash: bindings[3],
                expires_at: bindings[4],
                created_at: bindings[5],
                revoked_at: null,
                last_used_at: null,
              });
            }
            if (query.includes('INSERT INTO promises')) {
              promises.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                amount_cents: bindings[3],
                promise_date: bindings[4],
                status: 'open',
                source: bindings[5],
                created_at: bindings[6],
                updated_at: bindings[7],
              });
            }
            if (query.includes('INSERT INTO disputes')) {
              disputes.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                reason_code: bindings[3],
                notes: bindings[4],
                status: 'open',
                created_at: bindings[5],
                updated_at: bindings[6],
              });
            }
            if (query.includes('INSERT INTO payments')) {
              payments.push({
                id: bindings[0],
                company_id: bindings[1],
                obligation_id: bindings[2],
                amount_cents: bindings[3],
                currency: bindings[4],
                provider: 'recupera_portal',
                provider_payment_id: bindings[5],
                status: bindings[6],
                paid_at: bindings[7],
                created_at: bindings[8],
              });
            }
            if (query.includes('UPDATE obligations SET balance_cents = 0')) {
              obligation = {
                ...obligation,
                balance_cents: 0,
                stage_key: 'PAID',
                status: 'closed',
                updated_at: bindings[0],
              };
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max);
}

function cleanEmail(value) {
  const email = cleanText(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

async function sha256Async(value) {
  return sha256(value);
}

function randomToken() {
  return rawToken;
}

function assetHeaders(contentType) {
  return { 'content-type': contentType };
}

const rateLimitCalls = [];
async function rateLimit(env, request, action, identity, limit, windowSeconds) {
  rateLimitCalls.push({ action, identity, limit, windowSeconds });
  return true;
}

function isSuperAdmin(user) {
  return Number(user.ryvoStaff) === 1;
}

function canManageCompanyAssets(user) {
  return isSuperAdmin(user) || user.role === 'admin';
}

async function audit(env, actor, type, entityType, entityId, payload) {
  auditCalls.push({ actor, type, entityType, entityId, payload });
}

async function ensureSchema() {}

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
  console,
  json,
  cleanText,
  cleanEmail,
  escapeHtml,
  sha256: sha256Async,
  randomToken,
  assetHeaders,
  rateLimit,
  isSuperAdmin,
  canManageCompanyAssets,
  audit,
  ensureSchema,
};
context.globalThis = context;

vm.runInNewContext(`${stageSource}\n${apiSource}\n${portalSource}\n;globalThis.__recupera = {
  handleRecuperaApi,
  handleRecuperaPublicPortal,
  recuperaPlaybookEnabled,
  recuperaCreatePortalLink,
};`, context);
const api = context.__recupera;
const adminUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin', companyId: 'co-1', ryvoStaff: 0 };
const env = { DB: db, RECUPERA_ENABLED: 'false' };

const portalLinkRequest = new Request('https://example.com/api/recupera/obligations/obl-1/portal-link', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
const portalLinkResponse = await api.handleRecuperaApi(portalLinkRequest, env, new URL(portalLinkRequest.url), adminUser);
assert.equal(portalLinkResponse.status, 200);
const portalLinkBody = await portalLinkResponse.json();
assert.match(portalLinkBody.url, /^https:\/\/example\.com\/p\//);
assert.ok(portalLinkBody.expiresAt);
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_portal_link_created'));

const jsonGet = new Request(`https://example.com/p/${rawToken}`, {
  headers: { accept: 'application/json' },
});
const jsonGetResponse = await api.handleRecuperaPublicPortal(jsonGet, env, new URL(jsonGet.url));
assert.equal(jsonGetResponse.status, 200);
const jsonPayload = await jsonGetResponse.json();
assert.equal(jsonPayload.balanceCents, 450000);
assert.equal(jsonPayload.isOpen, true);
assert.equal(jsonPayload.companyName, 'Acme Co');

const htmlGet = new Request(`https://example.com/p/${rawToken}`);
const htmlGetResponse = await api.handleRecuperaPublicPortal(htmlGet, env, new URL(htmlGet.url));
assert.equal(htmlGetResponse.status, 200);
assert.match(await htmlGetResponse.text(), /Saldo pendiente/);

const payRequest = new Request(`https://example.com/p/${rawToken}/pay`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
const payResponse = await api.handleRecuperaPublicPortal(payRequest, env, new URL(payRequest.url));
assert.equal(payResponse.status, 200);
const payBody = await payResponse.json();
assert.equal(payBody.mode, 'manual');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_portal_pay_intent'));

const paidRequest = new Request(`https://example.com/p/${rawToken}/paid`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
const paidResponse = await api.handleRecuperaPublicPortal(paidRequest, env, new URL(paidRequest.url));
assert.equal(paidResponse.status, 200);
const paidBody = await paidResponse.json();
assert.equal(paidBody.status, 'pending_verification');
assert.equal(payments.length, 1);
assert.equal(payments[0].status, 'pending_verification');
assert.equal(obligation.status, 'open');

const promiseRequest = new Request(`https://example.com/p/${rawToken}/promise`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ promiseDate: '2026-09-15', amountCents: 200000 }),
});
const promiseResponse = await api.handleRecuperaPublicPortal(promiseRequest, env, new URL(promiseRequest.url));
assert.equal(promiseResponse.status, 200);
const promiseBody = await promiseResponse.json();
assert.equal(promiseBody.amountCents, 200000);
assert.equal(promises.length, 1);
assert.equal(promises[0].source, 'portal');

const disputeRequest = new Request(`https://example.com/p/${rawToken}/dispute`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ reasonCode: 'billing_error', notes: 'Monto incorrecto' }),
});
const disputeResponse = await api.handleRecuperaPublicPortal(disputeRequest, env, new URL(disputeRequest.url));
assert.equal(disputeResponse.status, 200);
assert.equal(disputes.length, 1);
assert.equal(disputes[0].reason_code, 'billing_error');

const instantEnv = { ...env, RECUPERA_PORTAL_INSTANT_PAY: 'true' };
obligation = { ...obligation, status: 'open', balance_cents: 450000, stage_key: 'DPD_1_7' };
const instantPaid = await api.handleRecuperaPublicPortal(paidRequest, instantEnv, new URL(paidRequest.url));
assert.equal(instantPaid.status, 200);
const instantBody = await instantPaid.json();
assert.equal(instantBody.status, 'completed');
assert.equal(obligation.status, 'closed');

const disabledEnv = { DB: db, RECUPERA_ENABLED: 'false' };
dbState.companies[0].playbooks_enabled_json = JSON.stringify([]);
const disabledPortal = await api.handleRecuperaPublicPortal(jsonGet, disabledEnv, new URL(jsonGet.url));
assert.equal(disabledPortal.status, 404);

console.log('recupera portal tests passed');
