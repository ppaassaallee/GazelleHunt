import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../', import.meta.url);
const [stageSource, recomputeSource] = await Promise.all([
  readFile(new URL('stage.js', recuperaRoot), 'utf8'),
  readFile(new URL('recompute.js', recuperaRoot), 'utf8'),
]);

assert.match(recomputeSource, /recuperaRecomputeStages/);
assert.match(recomputeSource, /recuperaStageFromDueDate/);
assert.match(recomputeSource, /RECUPERA_RECOMPUTE_PROTECTED_STAGES/);
assert.match(recomputeSource, /PROMISE/);
assert.match(recomputeSource, /DISPUTE/);
assert.match(recomputeSource, /playbook_installations/);
assert.match(recomputeSource, /recupera_stages_recomputed/);

const FIXED_NOW = new Date('2026-09-04T12:00:00.000Z');
class MockDate extends Date {
  constructor(...args) {
    if (args.length === 0) super(FIXED_NOW.getTime());
    else super(...args);
  }
  static now() {
    return FIXED_NOW.getTime();
  }
}
const dbState = {
  obligations: [
    {
      id: 'obl-1',
      company_id: 'co-1',
      due_date: '2026-09-03',
      stage_key: 'PRE_DUE',
      status: 'open',
    },
    {
      id: 'obl-2',
      company_id: 'co-1',
      due_date: '2026-08-01',
      stage_key: 'DPD_1_7',
      status: 'open',
    },
    {
      id: 'obl-3',
      company_id: 'co-1',
      due_date: '2026-07-01',
      stage_key: 'PROMISE',
      status: 'open',
    },
  ],
  playbookInstallations: [{ playbook_key: 'recupera', status: 'active' }],
};
const db = {
  prepare(sql) {
    const query = String(sql).replace(/\s+/g, ' ').trim();
    let bindings = [];
    const statement = {
      bind(...args) {
        bindings = args;
        return statement;
      },
      async first() {
        if (query.includes('FROM playbook_installations WHERE playbook_key = ?')) {
          return dbState.playbookInstallations.find((row) => row.playbook_key === bindings[0] && row.status === 'active')
            ? { ok: 1 }
            : null;
        }
        return null;
      },
      async all() {
        if (query.includes("FROM obligations WHERE status = 'open'")) {
          return { results: dbState.obligations.filter((row) => row.status === 'open') };
        }
        return { results: [] };
      },
      async run() {
        if (query.startsWith('UPDATE obligations SET stage_key = ?')) {
          const obligation = dbState.obligations.find((row) => row.id === bindings[2]);
          if (obligation) {
            obligation.stage_key = bindings[0];
            obligation.updated_at = bindings[1];
          }
        }
      },
    };
    return statement;
  },
  async batch(statements) {
    for (const statement of statements) await statement.run();
  },
};

const context = {
  globalThis: null,
  Date: MockDate,
  Math,
  Number,
  String,
  Object,
  Array,
  JSON,
  console,
  crypto: webcrypto,
  db,
};
context.globalThis = context;
vm.runInNewContext(`${stageSource}\nglobalThis.__auditCalls = [];\nasync function audit(env, actor, type, entityType, entityId, payload) { globalThis.__auditCalls.push({ actor, type, entityType, entityId, payload }); }\n${recomputeSource}\n;globalThis.__recuperaRecompute = { recuperaRecomputeStages, recuperaRecomputeShouldRun };`, context);
const recompute = context.__recuperaRecompute;
const auditCalls = context.__auditCalls;

assert.equal(await recompute.recuperaRecomputeShouldRun({ RECUPERA_ENABLED: 'true' }), true);
assert.equal(await recompute.recuperaRecomputeShouldRun({ RECUPERA_ENABLED: 'false', DB: db }), true);
assert.equal(await recompute.recuperaRecomputeShouldRun({ RECUPERA_ENABLED: 'false', DB: { prepare: () => ({ bind: () => ({ async first() { return null; } }) }) } }), false);

const result = await recompute.recuperaRecomputeStages({ RECUPERA_ENABLED: 'false', DB: db });
assert.equal(result.updated, 2);
assert.equal(dbState.obligations.find((row) => row.id === 'obl-1').stage_key, 'DPD_1_7');
assert.equal(dbState.obligations.find((row) => row.id === 'obl-2').stage_key, 'DPD_31_60');
assert.equal(dbState.obligations.find((row) => row.id === 'obl-3').stage_key, 'PROMISE');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_stages_recomputed'));

console.log('recupera recompute tests passed');
