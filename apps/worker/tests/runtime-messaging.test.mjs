import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
function validEmailAddress(email) {
  return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email);
}
function cleanEmail(value) {
  const email = cleanText(value, 254).toLowerCase();
  return validEmailAddress(email) ? email : '';
}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/messaging.js', import.meta.url), 'utf8');

const context = {
  globalThis: null,
  crypto: webcrypto,
  Date,
  JSON,
  String,
  Number,
  Math,
  Array,
  Object,
  fetch: async () => ({ ok: true, status: 200, async json() { return {}; } }),
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__messagingTest = { emailConfig, contactabilityConfig, infobipConfig, normalizeContactPhone, normalizedBrevoEvent, batchDeliveryStatus };`, context);

const messaging = context.__messagingTest;
const emptyConfig = messaging.emailConfig({});
assert.equal(emptyConfig.configured, false);
assert.equal(emptyConfig.sendingConfigured, false);
assert.equal(emptyConfig.webhookConfigured, false);
assert.equal(emptyConfig.transport, 'api');

const env = {
  BREVO_API_KEY: 'test-brevo-api-key',
  BREVO_SENDER_EMAIL: 'Assessments@Example.com',
  BREVO_SENDER_NAME: 'Gazelle Assessment',
  BREVO_WEBHOOK_TOKEN: 'test-webhook-token-at-least-24-characters',
  BREVO_SMS_SENDER: 'Gazelle',
};
const configured = messaging.emailConfig(env);
assert.equal(configured.configured, true);
assert.equal(configured.senderEmail, 'assessments@example.com');

const contactability = messaging.contactabilityConfig(env);
assert.equal(contactability.sms.configured, true);
assert.equal(contactability.whatsapp.configured, false);
assert.equal(messaging.normalizeContactPhone('?4804-8638', '502').phone, '50248048638');
assert.equal(messaging.normalizedBrevoEvent('hardBounce'), 'hard_bounce');
assert.equal(messaging.batchDeliveryStatus({ status: 'processing', accepted_count: 0, failed_count: 0 }), 'processing');
assert.equal(messaging.infobipConfig({ INFOBIP_API_KEY: 'key', INFOBIP_BASE_URL: 'abc.api.infobip.com' }).baseUrl, 'https://abc.api.infobip.com');

console.log('Runtime messaging module tests passed.');
