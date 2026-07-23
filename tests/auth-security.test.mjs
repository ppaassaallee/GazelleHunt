import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = (await readFile(new URL('../server-worker.js', import.meta.url), 'utf8'))
  .replace('export default {', 'globalThis.__worker = {');
assert.match(source, /sessionTokenHash', \{ value: tokenHash, enumerable: false \}/);
const context = {
  globalThis: null,
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  JSON,
  URL,
  Response,
  FormData,
  fetch,
  btoa,
  atob,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__authTest = { validatePassword, passwordRecord, verifyPassword, sessionCookie, clearSessionCookie, constantTimeEqual, isSuperAdmin, PASSWORD_ITERATIONS };`, context);

const auth = context.__authTest;
const env = { AUTH_PEPPER: 'test-only-pepper-that-is-longer-than-thirty-two-characters' };
assert.equal(auth.validatePassword('short'), 'Use at least 12 characters.');
assert.equal(auth.validatePassword('password123'), 'Use at least 12 characters.');
assert.equal(auth.validatePassword('A valid and memorable passphrase 2026'), '');
assert.equal(auth.PASSWORD_ITERATIONS, 100000);

const record = await auth.passwordRecord('A valid and memorable passphrase 2026', env);
assert.equal(record.iterations, 100000);
assert.equal(await auth.verifyPassword('A valid and memorable passphrase 2026', { password_hash: record.hash, password_salt: record.salt, password_iterations: record.iterations }, env), true);
assert.equal(await auth.verifyPassword('Not the same passphrase', { password_hash: record.hash, password_salt: record.salt, password_iterations: record.iterations }, env), false);
assert.equal(auth.constantTimeEqual('same-value', 'same-value'), true);
assert.equal(auth.constantTimeEqual('same-value', 'other-value'), false);
assert.equal(auth.isSuperAdmin({ email: 'david.alejandro.pa@gmail.com', role: 'super_admin', status: 'active' }), true);
assert.equal(auth.isSuperAdmin({ email: 'karla.ms@alliedglobal.com', role: 'super_admin', status: 'active' }), true);
assert.equal(auth.isSuperAdmin({ email: 'jose.le@alliedglobal.com', role: 'super_admin', status: 'active' }), true);
assert.equal(auth.isSuperAdmin({ email: 'daniela.ld@alliedglobal.com', role: 'super_admin', status: 'active' }), true);
assert.equal(auth.isSuperAdmin({ email: 'eduardo.ac@alliedglobal.com', role: 'super_admin', status: 'active' }), true);
assert.equal(auth.isSuperAdmin({ email: 'rogue@example.com', role: 'super_admin', status: 'active' }), false);
assert.equal(auth.isSuperAdmin({ email: 'karla.ms@alliedglobal.com', role: 'admin', status: 'active' }), false);

const cookie = auth.sessionCookie('random-token', new Date(Date.now() + 60000));
for (const attribute of ['__Host-gz_session=', 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict']) assert.match(cookie, new RegExp(attribute));
assert.match(auth.clearSessionCookie(), /Max-Age=0/);
assert.match(source, /CREATE TABLE IF NOT EXISTS password_reset_tokens/);
assert.match(source, /PASSWORD_RESET_TTL_MS = 60 \* 60 \* 1000/);
assert.match(source, /password_reset_completed/);
assert.match(source, /UPDATE sessions SET revoked_at = \?/);
assert.match(source, /\/api\/auth\/password-reset\/request/);
assert.match(source, /\/api\/auth\/password-reset\/confirm/);
assert.match(source, /adminSendPasswordReset/);
assert.doesNotMatch(source, /Use the self-service reset flow for super administrator accounts/);
assert.match(source, /Set up or reset your Gazelle Assessment password/);

console.log('Authentication security tests passed.');
