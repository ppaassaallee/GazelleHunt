import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = await readFile(new URL('../../../packages/runtime/src/audit.js', import.meta.url), 'utf8');

const inserts = [];
const context = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  JSON,
  String,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__auditTest = { audit };`, context);

await context.__auditTest.audit(
  {
    DB: {
      prepare(sql) {
        assert.match(sql, /INSERT INTO audit_events/);
        return {
          bind(...args) {
            inserts.push(args);
            return { async run() { return { success: true }; } };
          },
        };
      },
    },
  },
  'recruiter@example.com',
  'candidate_created',
  'candidate',
  'cand_1',
  { companyId: 'org_1' },
);

assert.equal(inserts.length, 1);
assert.equal(inserts[0][1], 'recruiter@example.com');
assert.equal(inserts[0][2], 'candidate_created');
assert.equal(inserts[0][3], 'candidate');
assert.equal(inserts[0][4], 'cand_1');
assert.equal(JSON.parse(inserts[0][5]).companyId, 'org_1');
assert.match(inserts[0][6], /^\d{4}-\d{2}-\d{2}T/);

console.log('Runtime audit module tests passed.');
