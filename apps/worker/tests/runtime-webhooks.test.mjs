import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
function json(body, status = 200) {
  return { body, status };
}
function constantTimeEqual(a, b) {
  return String(a) === String(b);
}
function cleanPhoneDigits(value) {
  return String(value || '').replace(/\\D/g, '');
}
async function ensureSchema() {}
async function storeBrevoEvent() {
  return { stored: true, invitationId: null, status: null, eventType: null };
}
function emailConfig(env) {
  const token = String(env.BREVO_WEBHOOK_TOKEN || '');
  return { webhookConfigured: token.length >= 24, webhookToken: token };
}
function infobipConfig(env) {
  return { webhookToken: String(env.INFOBIP_WEBHOOK_TOKEN || '') };
}
function infobipInboundEvents(body) {
  return Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [body];
}
async function audit() {}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/webhooks.js', import.meta.url), 'utf8');

const context = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  JSON,
  String,
  URL,
  Array,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__webhooksTest = { handleBrevoWebhook, handleInfobipWebhook, deepValue, firstDeepText, communicationRecorderForCandidate };`, context);

const webhooks = context.__webhooksTest;
assert.equal(typeof webhooks.handleBrevoWebhook, 'function');
assert.equal(typeof webhooks.handleInfobipWebhook, 'function');
assert.equal(typeof webhooks.deepValue, 'function');
assert.equal(typeof webhooks.firstDeepText, 'function');
assert.equal(typeof webhooks.communicationRecorderForCandidate, 'function');

const moduleSource = await readFile(new URL('../../../packages/runtime/src/webhooks.js', import.meta.url), 'utf8');
assert.match(moduleSource, /handleBrevoWebhook/);
assert.match(moduleSource, /handleInfobipWebhook/);
assert.match(moduleSource, /storeBrevoEvent/);
assert.match(moduleSource, /infobipInboundEvents/);
assert.match(moduleSource, /x-gazelle-webhook-token/);
assert.match(moduleSource, /infobip_inbound_unmatched/);
assert.match(moduleSource, /candidate_whatsapp_reply_received/);
assert.match(moduleSource, /j\.stop_on_reply/);
assert.match(moduleSource, /Number\(entry\.stop_on_reply/);
assert.match(moduleSource, /RECUPERA_ROCIO_INBOUND/);
assert.match(moduleSource, /rocioMaybeProcessInfobipInbound/);

console.log('Runtime webhooks module tests passed.');
