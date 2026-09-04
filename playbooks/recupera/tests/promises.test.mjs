import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const recuperaRoot = new URL('../', import.meta.url);
const [stageSource, recomputeSource, promisesSource] = await Promise.all([
  readFile(new URL('stage.js', recuperaRoot), 'utf8'),
  readFile(new URL('recompute.js', recuperaRoot), 'utf8'),
  readFile(new URL('promises.js', recuperaRoot), 'utf8'),
]);

assert.match(promisesSource, /recuperaSweepBrokenPromises/);
assert.match(promisesSource, /recuperaRecomputeShouldRun/);
assert.match(promisesSource, /status = 'broken'/);
assert.match(promisesSource, /promise_date < date\('now'\)/);
assert.match(promisesSource, /recuperaNextStageAfterBrokenPromise/);
assert.match(promisesSource, /recupera_promises_broken/);
assert.match(stageSource, /recuperaNextStageAfterBrokenPromise/);

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
  promises: [
    {
      id: 'prm-1',
      company_id: 'co-1',
      obligation_id: 'obl-1',
      promise_date: '2026-09-03',
      status: 'open',
    },
    {
      id: 'prm-2',
      company_id: 'co-1',
      obligation_id: 'obl-2',
      promise_date: '2026-09-04',
      status: 'open',
    },
  ],
  obligations: [
    {
      id: 'obl-1',
      company_id: 'co-1',
      due_date: '2026-08-28',
      stage_key: 'PROMISE',
      status: 'open',
    },
    {
      id: 'obl-2',
      company_id: 'co-1',
      due_date: '2026-07-05',
      stage_key: 'DPD_1_7',
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
        if (query.includes('FROM promises p') && query.includes('INNER JOIN obligations o')) {
          const today = '2026-09-04';
          return {
            results: dbState.promises
              .filter((promise) => promise.status === 'open' && promise.promise_date < today)
              .map((promise) => {
                const obligation = dbState.obligations.find((row) => row.id === promise.obligation_id);
                return {
                  id: promise.id,
                  company_id: promise.company_id,
                  obligation_id: promise.obligation_id,
                  due_date: obligation?.due_date,
                  stage_key: obligation?.stage_key,
                };
              }),
          };
        }
        return { results: [] };
      },
      async run() {
        if (query.startsWith("UPDATE promises SET status = 'broken'")) {
          const promise = dbState.promises.find((row) => row.id === bindings[1]);
          if (promise) {
            promise.status = 'broken';
            promise.updated_at = bindings[0];
          }
        }
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
vm.runInNewContext(`${stageSource}\n${recomputeSource}\nglobalThis.__auditCalls = [];\nasync function audit(env, actor, type, entityType, entityId, payload) { globalThis.__auditCalls.push({ actor, type, entityType, entityId, payload }); }\n${promisesSource}\n;globalThis.__recuperaPromises = { recuperaSweepBrokenPromises };`, context);
const promises = context.__recuperaPromises;
const auditCalls = context.__auditCalls;

const result = await promises.recuperaSweepBrokenPromises({ RECUPERA_ENABLED: 'false', DB: db });
assert.equal(result.broken, 1);
assert.equal(result.stagesUpdated, 1);
assert.equal(dbState.promises.find((row) => row.id === 'prm-1').status, 'broken');
assert.equal(dbState.promises.find((row) => row.id === 'prm-2').status, 'open');
assert.equal(dbState.obligations.find((row) => row.id === 'obl-1').stage_key, 'DPD_1_7');
assert.ok(auditCalls.some((entry) => entry.type === 'recupera_promises_broken'));

console.log('recupera promises tests passed');
