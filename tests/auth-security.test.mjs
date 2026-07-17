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
vm.runInNewContext(`${source}\n;globalThis.__authTest = { validatePassword, passwordRecord, verifyPassword, sessionCookie, clearSessionCookie, constantTimeEqual, PASSWORD_ITERATIONS };`, context);

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

const cookie = auth.sessionCookie('random-token', new Date(Date.now() + 60000));
for (const attribute of ['__Host-gz_session=', 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict']) assert.match(cookie, new RegExp(attribute));
assert.match(auth.clearSessionCookie(), /Max-Age=0/);

console.log('Authentication security tests passed.');
