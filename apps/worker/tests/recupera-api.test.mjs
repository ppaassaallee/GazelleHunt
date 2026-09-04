import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../../../playbooks/recupera/', import.meta.url);
const [stageSource, apiSource, legacyServerSource, buildSource, auditSource, webhooksSource] = await Promise.all([
  readFile(new URL('stage.js', recuperaRoot), 'utf8'),
  readFile(new URL('api.js', recuperaRoot), 'utf8'),
  readFile(new URL('../src/legacy/server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../build.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../../../packages/runtime/src/audit.js', import.meta.url), 'utf8'),
  readFile(new URL('../../../packages/runtime/src/webhooks.js', import.meta.url), 'utf8'),
]);

const serverSource = `${stageSource}\n${apiSource}\n${auditSource}\n${webhooksSource}\n${legacyServerSource}`;

for (const route of [
  '/api/recupera/install',
  '/api/recupera/installation',
  '/api/recupera/obligations',
  '/api/recupera/obligations/import',
]) {
  assert.match(apiSource, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(serverSource, /handleRecuperaApi/);
}

assert.match(apiSource, /playbook_disabled/);
assert.match(apiSource, /RECUPERA_ENABLED === 'true'/);
assert.match(apiSource, /playbooks_enabled_json/);
assert.match(apiSource, /playbook_installed/);
assert.match(apiSource, /recupera_obligations_imported/);
assert.match(apiSource, /RECUPERA_IMPORT_MAX_ROWS = 500/);
assert.match(buildSource, /recuperaRoot/);
assert.match(buildSource, /recuperaStage/);
assert.match(buildSource, /recuperaApi/);

const NOW = new Date('2026-09-04T12:00:00.000Z');
const stageContext = { globalThis: null, Date, Math, Number, String, Object, Array, JSON, console };
stageContext.globalThis = stageContext;
vm.runInNewContext(`${stageSource}\n;globalThis.__recuperaStage = { recuperaStageFromDueDate, recuperaIsoDateValid };`, stageContext);
const stage = stageContext.__recuperaStage;
assert.equal(stage.recuperaStageFromDueDate('2026-09-05', NOW), 'PRE_DUE');
assert.equal(stage.recuperaStageFromDueDate('2026-09-04', NOW), 'DUE');
assert.equal(stage.recuperaStageFromDueDate('2026-08-28', NOW), 'DPD_1_7');
assert.equal(stage.recuperaStageFromDueDate('2026-07-05', NOW), 'DPD_60_PLUS');
assert.equal(stage.recuperaIsoDateValid('2026-09-01'), true);
assert.equal(stage.recuperaIsoDateValid('09/01/2026'), false);

const auditCalls = [];
const dbState = {
  companies: [{ id: 'co-1', status: 'active', playbooks_enabled_json: null }],
  playbook_installations: [],
  obligations: [],
};
const db = {
  prepare(sql) {
    const query = String(sql).replace(/\s+/g, ' ').trim();
    return {
      bind(...bindings) {
        return {
          async first() {
            if (query.includes('FROM companies WHERE id = ? AND status')) {
              return dbState.companies.find((row) => row.id === bindings[0] && row.status === 'active') || null;
            }
            if (query.includes('playbooks_enabled_json FROM companies')) {
              return dbState.companies.find((row) => row.id === bindings[0]) || null;
            }
            if (query.includes('FROM playbook_installations WHERE company_id = ? AND playbook_key = ?')) {
              return dbState.playbook_installations.find((row) => row.company_id === bindings[0] && row.playbook_key === bindings[1]) || null;
            }
            if (query.includes('FROM playbook_installations WHERE id = ?')) {
              return dbState.playbook_installations.find((row) => row.id === bindings[0]) || null;
            }
            return null;
          },
          async all() {
            if (query.includes('FROM obligations WHERE company_id = ? ORDER BY')) {
              return { results: dbState.obligations.filter((row) => row.company_id === bindings[0]).slice(0, bindings[1]) };
            }
            if (query.includes('FROM obligations WHERE company_id = ? AND id IN')) {
              const ids = bindings.slice(1);
              return { results: dbState.obligations.filter((row) => row.company_id === bindings[0] && ids.includes(row.id)) };
            }
            return { results: [] };
          },
          async run() {
            if (query.startsWith('INSERT INTO playbook_installations')) {
              dbState.playbook_installations.push({
                id: bindings[0],
                company_id: bindings[1],
                playbook_key: bindings[2],
                playbook_version: bindings[3],
                status: 'active',
                config_json: null,
                installed_by_user_id: bindings[5],
                created_at: bindings[6],
                updated_at: bindings[7],
              });
            }
            if (query.startsWith('UPDATE companies SET playbooks_enabled_json')) {
              const company = dbState.companies.find((row) => row.id === bindings[1]);
              if (company) company.playbooks_enabled_json = bindings[0];
            }
            if (query.startsWith('INSERT INTO obligations')) {
              dbState.obligations.push({
                id: bindings[0],
                company_id: bindings[1],
                payer_name: bindings[2],
                payer_email: bindings[3],
                payer_phone: bindings[4],
                reference: bindings[5],
                description: bindings[6],
                currency: bindings[7],
                amount_cents: bindings[8],
                balance_cents: bindings[9],
                due_date: bindings[10],
                stage_key: bindings[11],
                strategy_key: bindings[12],
                status: bindings[13],
                created_at: bindings[14],
                updated_at: bindings[15],
              });
            }
            return { success: true };
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

function isSuperAdmin(user) {
  return Number(user.ryvoStaff) === 1;
}

function canManageCompanyAssets(user) {
  return isSuperAdmin(user) || user.role === 'admin';
}

async function audit(env, actor, type, entityType, entityId, payload) {
  auditCalls.push({ actor, type, entityType, entityId, payload });
}

const apiContext = {
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
  isSuperAdmin,
  canManageCompanyAssets,
  audit,
};
apiContext.globalThis = apiContext;
vm.runInNewContext(`${stageSource}\n${apiSource}\n;globalThis.__recuperaApi = { handleRecuperaApi, recuperaPlaybookEnabled, recuperaGloballyEnabled, recuperaParsePlaybooksEnabled };`, apiContext);
const api = apiContext.__recuperaApi;
const adminUser = { id: 'admin-1', email: 'admin@example.com', role: 'admin', companyId: 'co-1', ryvoStaff: 0 };

const disabledEnv = { DB: db, RECUPERA_ENABLED: 'false' };
const disabledRequest = new Request('https://example.com/api/recupera/installation', { method: 'GET' });
const disabledResponse = await api.handleRecuperaApi(disabledRequest, disabledEnv, new URL(disabledRequest.url), adminUser);
assert.equal(disabledResponse.status, 404);
assert.deepEqual(await disabledResponse.json(), { error: 'not_found', code: 'playbook_disabled' });

dbState.companies[0].playbooks_enabled_json = JSON.stringify(['recupera']);
const enabledEnv = { DB: db, RECUPERA_ENABLED: 'false' };
const missingInstallation = await api.handleRecuperaApi(disabledRequest, enabledEnv, new URL(disabledRequest.url), adminUser);
assert.equal(missingInstallation.status, 404);
assert.deepEqual(await missingInstallation.json(), { error: 'not_found', code: 'installation_not_found' });

const installRequest = new Request('https://example.com/api/recupera/install', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
const installResponse = await api.handleRecuperaApi(installRequest, enabledEnv, new URL(installRequest.url), adminUser);
assert.equal(installResponse.status, 201);
const installBody = await installResponse.json();
assert.equal(installBody.installation.playbookKey, 'recupera');
assert.equal(installBody.installation.playbookVersion, '0.1.0');
assert.ok(auditCalls.some((entry) => entry.type === 'playbook_installed'));

const importRequest = new Request('https://example.com/api/recupera/obligations/import', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    obligations: [{
      payerName: 'Ana López',
      payerEmail: 'ana@example.com',
      payerPhone: '50255551212',
      reference: 'FAC-100',
      description: 'Factura',
      amountCents: 450000,
      balanceCents: 450000,
      dueDate: '2026-09-01',
      currency: 'GTQ',
    }],
  }),
});
const importResponse = await api.handleRecuperaApi(importRequest, enabledEnv, new URL(importRequest.url), adminUser);
assert.equal(importResponse.status, 201);
const importBody = await importResponse.json();
assert.equal(importBody.imported.length, 1);
assert.equal(importBody.imported[0].stageKey, 'DPD_1_7');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_obligations_imported'));

assert.equal(await api.recuperaGloballyEnabled({ RECUPERA_ENABLED: 'true' }), true);
assert.equal(await api.recuperaGloballyEnabled({ RECUPERA_ENABLED: 'false' }), false);
assert.equal(api.recuperaParsePlaybooksEnabled(JSON.stringify(['recupera'])).includes('recupera'), true);
assert.equal(api.recuperaParsePlaybooksEnabled('not-json').length, 0);

console.log('recupera api tests passed');
