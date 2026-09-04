import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function randomToken() {
  return 'test-portal-token';
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/portal.js', import.meta.url), 'utf8');

const inserts = [];
const context = {
  globalThis: null,
  crypto: webcrypto,
  TextEncoder,
  Date,
  JSON,
  String,
  encodeURIComponent,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__portalTest = { createCandidatePortalLink };`, context);

const portal = context.__portalTest;
assert.equal(typeof portal.createCandidatePortalLink, 'function');

const result = await portal.createCandidatePortalLink(
  {
    DB: {
      prepare(sql) {
        assert.match(sql, /INSERT INTO candidate_portal_links/);
        return {
          bind(...args) {
            inserts.push(args);
            return { async run() { return { success: true }; } };
          },
        };
      },
    },
  },
  'cand_1',
  'https://app.example.com',
);
assert.equal(inserts.length, 1);
assert.equal(inserts[0][1], 'cand_1');
assert.match(inserts[0][2], /^[a-f0-9]{64}$/);
assert.match(result.link, /^https:\/\/app\.example\.com\/candidate\?invite=/);
assert.match(result.expiresAt, /^\d{4}-\d{2}-\d{2}T/);

console.log('Runtime portal module tests passed.');
