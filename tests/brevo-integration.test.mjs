import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = (await readFile(new URL('../server-worker.js', import.meta.url), 'utf8'))
  .replace('export default {', 'globalThis.__worker = {');
const fetchCalls = [];
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
  btoa,
  atob,
  fetch: async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    return { ok: true, status: 201, async json() { return { messageId: '<brevo-message-123@example.com>' }; } };
  },
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__brevoTest = { emailConfig, sendBrevo, brevoWebhookPayload, normalizedBrevoEvent, brevoInvitationId, brevoInvitationStatus, normalizedProviderMessageId, batchDeliveryStatus };`, context);

const brevo = context.__brevoTest;
const emptyConfig = brevo.emailConfig({});
assert.equal(emptyConfig.configured, false);
assert.equal(emptyConfig.sendingConfigured, false);
assert.equal(emptyConfig.webhookConfigured, false);

const env = {
  BREVO_API_KEY: 'test-brevo-api-key',
  BREVO_SENDER_EMAIL: 'Assessments@Example.com',
  BREVO_SENDER_NAME: 'Gazelle Assessment',
  BREVO_WEBHOOK_TOKEN: 'test-webhook-token-at-least-24-characters',
};
const configured = brevo.emailConfig(env);
assert.equal(configured.configured, true);
assert.equal(configured.sendingConfigured, true);
assert.equal(configured.webhookConfigured, true);
assert.equal(configured.senderEmail, 'assessments@example.com');

const sent = await brevo.sendBrevo(env, {
  invitationId: 'invitation-123',
  tag: 'Tenure Potential',
  to: 'candidate@example.com',
  toName: 'Candidate Name',
  subject: 'Assessment invitation',
  text: 'Plain-text invitation',
  html: '<p>HTML invitation</p>',
});
assert.equal(sent.id, '<brevo-message-123@example.com>');
assert.equal(fetchCalls.length, 1);
assert.equal(fetchCalls[0].url, 'https://api.brevo.com/v3/smtp/email');
assert.equal(fetchCalls[0].options.headers['api-key'], env.BREVO_API_KEY);
const requestBody = JSON.parse(fetchCalls[0].options.body);
assert.deepEqual(requestBody.sender, { email: 'assessments@example.com', name: 'Gazelle Assessment' });
assert.deepEqual(requestBody.to, [{ email: 'candidate@example.com', name: 'Candidate Name' }]);
assert.equal(requestBody.headers.idempotencyKey, 'invitation-123');
assert.equal(requestBody.headers['X-Mailin-custom'], 'invitation_id:invitation-123');
assert.equal(requestBody.headers['X-Sib-Sandbox'], undefined);
assert.deepEqual(requestBody.tags, ['tenure-potential']);

const webhook = brevo.brevoWebhookPayload(configured, 'https://assessment.example.com/api/brevo/webhook');
assert.equal(webhook.type, 'transactional');
assert.equal(webhook.batched, false);
assert.deepEqual(JSON.parse(JSON.stringify(webhook.headers)), [{ key: 'X-Gazelle-Webhook-Token', value: env.BREVO_WEBHOOK_TOKEN }]);
assert.deepEqual(Array.from(webhook.events), ['sent', 'delivered', 'hardBounce', 'softBounce', 'blocked', 'spam', 'invalid', 'deferred', 'unsubscribed']);

assert.equal(brevo.normalizedBrevoEvent('hardBounce'), 'hard_bounce');
assert.equal(brevo.normalizedBrevoEvent('softBounce'), 'soft_bounce');
assert.equal(brevo.normalizedBrevoEvent('uniqueOpened'), 'unique_opened');
assert.equal(brevo.brevoInvitationId({ 'X-Mailin-custom': 'source:gazelle|invitation_id:invitation-123|test:tp' }), 'invitation-123');
assert.equal(brevo.brevoInvitationStatus('request'), 'accepted');
assert.equal(brevo.brevoInvitationStatus('delivered'), 'delivered');
assert.equal(brevo.brevoInvitationStatus('soft_bounce'), 'deferred');
assert.equal(brevo.brevoInvitationStatus('hard_bounce'), 'hard_bounce');
assert.equal(brevo.brevoInvitationStatus('spam'), 'complained');
assert.equal(brevo.brevoInvitationStatus('opened'), null);
assert.equal(brevo.normalizedProviderMessageId('<brevo-message-123@example.com>'), 'brevo-message-123@example.com');
assert.equal(brevo.batchDeliveryStatus({ status: 'completed', accepted_count: 25, failed_count: 0, provider_confirmed_count: 0, delivered_count: 0 }), 'provider_unconfirmed');
assert.equal(brevo.batchDeliveryStatus({ status: 'api_accepted', accepted_count: 25, failed_count: 0, provider_confirmed_count: 25, delivered_count: 3 }), 'provider_confirmed');
assert.equal(brevo.batchDeliveryStatus({ status: 'api_accepted', accepted_count: 25, failed_count: 0, provider_confirmed_count: 25, delivered_count: 25 }), 'delivered');
assert.equal(brevo.batchDeliveryStatus({ status: 'processing', accepted_count: 0, failed_count: 0, provider_confirmed_count: 0, delivered_count: 0 }), 'processing');
assert.match(source, /\/api\/admin\/email-diagnostics/);
assert.match(source, /\/smtp\/statistics\/events\?days=2/);

console.log('Brevo integration tests passed.');
