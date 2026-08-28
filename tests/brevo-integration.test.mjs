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
    if (String(url).includes('/whatsapp/2/senders/') && String(url).endsWith('/templates')) {
      return {
        ok: true,
        status: 200,
        async json() {
          return { templates: [{ name: 'gazelle_assessment_invitation', language: 'es', status: 'APPROVED' }] };
        },
      };
    }
    return { ok: true, status: 201, async json() { return { messageId: '<brevo-message-123@example.com>' }; } };
  },
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__brevoTest = { emailConfig, contactabilityConfig, infobipConfig, customSmsConfig, infobipWhatsAppTemplateStatus, normalizeContactPhone, sendBrevoSms, sendBrevoWhatsApp, sendInfobipSms, sendCustomHttpSms, sendInfobipWhatsApp, sendSms, sendWhatsApp, sendBrevo, smtpMessage, normalizeCandidateEmail, isRetryableProviderError, brevoWebhookPayload, normalizedBrevoEvent, brevoInvitationId, brevoInvitationStatus, brevoDeliverySummary, normalizedProviderMessageId, batchDeliveryStatus };`, context);

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
assert.equal(configured.transport, 'api');
assert.equal(configured.apiConfigured, true);

const contactability = brevo.contactabilityConfig({
  ...env,
  BREVO_WHATSAPP_SENDER_NUMBER: '+50255551212',
  BREVO_WHATSAPP_TEMPLATE_ID: '123456',
  BREVO_SMS_SENDER: 'Gazelle',
});
assert.equal(contactability.whatsapp.configured, true);
assert.equal(contactability.whatsapp.templateId, '123456');
assert.equal(contactability.sms.configured, true);
assert.equal(brevo.normalizeContactPhone('?4804-8638', '502').phone, '50248048638');
assert.equal(brevo.normalizeContactPhone('bad phone', '502').valid, false);

const smtpConfigured = brevo.emailConfig({
  ...env,
  BREVO_EMAIL_TRANSPORT: 'smtp',
  BREVO_SMTP_LOGIN: 'relay@example.com',
  BREVO_SMTP_KEY: 'smtp-test-key',
});
assert.equal(smtpConfigured.transport, 'smtp');
assert.equal(smtpConfigured.smtpConfigured, true);
assert.equal(smtpConfigured.sendingConfigured, true);
const mime = brevo.smtpMessage(smtpConfigured, {
  invitationId: 'invitation-123', tag: 'Tenure Potential', to: 'candidate@example.com', toName: 'Candidate Name',
  subject: 'Assessment invitation\r\nBcc: attacker@example.com', text: 'Plain content', html: '<p>HTML content</p>',
}, '<gazelle-test@gazellehunt.com>');
assert.match(mime, /Message-ID: <gazelle-test@gazellehunt\.com>/);
assert.match(mime, /X-Mailin-custom: invitation_id:invitation-123/);
assert.doesNotMatch(mime, /\r\nBcc:/);
assert.match(mime, /multipart\/alternative/);

const sent = await brevo.sendBrevo(env, {
  invitationId: 'invitation-123',
  idempotencyKey: 'batch-item-stable-123',
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
assert.equal(requestBody.headers.idempotencyKey, 'batch-item-stable-123');
assert.equal(requestBody.headers['X-Mailin-custom'], 'invitation_id:invitation-123');
assert.equal(requestBody.headers['X-Sib-Sandbox'], undefined);
assert.deepEqual(requestBody.tags, ['tenure-potential']);

const smsSent = await brevo.sendBrevoSms({ ...env, BREVO_SMS_SENDER: 'Gazelle' }, {
  toPhone: '50248048638',
  text: 'Complete your assessment: https://example.com/candidate?invite=abc',
  tag: 'tenure-potential',
});
assert.equal(smsSent.transport, 'sms');
assert.equal(fetchCalls.at(-1).url, 'https://api.brevo.com/v3/transactionalSMS/send');
const smsBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.equal(smsBody.recipient, '50248048638');
assert.equal(smsBody.sender, 'Gazelle');

const whatsAppSent = await brevo.sendBrevoWhatsApp({ ...env, BREVO_WHATSAPP_SENDER_NUMBER: '+50255551212' }, {
  toPhone: '50248048638',
  text: 'Complete your assessment: https://example.com/candidate?invite=abc',
});
assert.equal(whatsAppSent.transport, 'whatsapp');
assert.equal(fetchCalls.at(-1).url, 'https://api.brevo.com/v3/whatsapp/sendMessage');
const whatsappBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.deepEqual(whatsappBody.contactNumbers, ['50248048638']);
assert.equal(whatsappBody.senderNumber, '+50255551212');

const infobipEnv = {
  ...env,
  WHATSAPP_PROVIDER: 'infobip',
  SMS_PROVIDER: 'infobip',
  INFOBIP_API_KEY: 'infobip-test-key',
  INFOBIP_BASE_URL: 'abc123.api.infobip.com/',
  INFOBIP_SMS_SENDER: 'Gazelle',
  INFOBIP_WHATSAPP_SENDER: '+50255551212',
  INFOBIP_WHATSAPP_TEMPLATE_ID: '1723626188858185',
  INFOBIP_WHATSAPP_TEMPLATE_NAME: 'gazelle_assessment_invitation',
  INFOBIP_WHATSAPP_TEMPLATE_LANGUAGE: 'Spanish',
};
const infobipContactability = brevo.contactabilityConfig(infobipEnv);
assert.equal(infobipContactability.whatsapp.configured, true);
assert.equal(infobipContactability.whatsapp.providerKey, 'infobip');
assert.equal(infobipContactability.whatsapp.provider, 'Infobip WhatsApp');
assert.equal(infobipContactability.whatsapp.senderNumber, '+50255551212');
assert.equal(infobipContactability.whatsapp.templateName, 'gazelle_assessment_invitation');
assert.equal(infobipContactability.whatsapp.templateId, '1723626188858185');
assert.equal(infobipContactability.whatsapp.linkPlacement, 'button');
assert.equal(infobipContactability.sms.configured, true);
assert.equal(infobipContactability.sms.providerKey, 'infobip');
assert.equal(brevo.infobipConfig(infobipEnv).baseUrl, 'https://abc123.api.infobip.com');
assert.equal(brevo.infobipConfig(infobipEnv).whatsappTemplateLanguage, 'es');
const infobipTemplateStatus = await brevo.infobipWhatsAppTemplateStatus(infobipEnv);
assert.equal(infobipTemplateStatus.sendable, true);
assert.equal(infobipTemplateStatus.status, 'APPROVED');

const infobipSms = await brevo.sendInfobipSms(infobipEnv, {
  toPhone: '50248048638',
  text: 'Complete your assessment: https://example.com/candidate?invite=abc',
  idempotencyKey: 'sms-event-1',
});
assert.equal(infobipSms.transport, 'sms');
assert.equal(fetchCalls.at(-1).url, 'https://abc123.api.infobip.com/sms/2/text/advanced');
assert.equal(fetchCalls.at(-1).options.headers.authorization, 'App infobip-test-key');
const infobipSmsBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.equal(infobipSmsBody.messages[0].from, 'Gazelle');
assert.deepEqual(infobipSmsBody.messages[0].destinations, [{ to: '50248048638', messageId: 'sms-event-1' }]);

const infobipWhatsApp = await brevo.sendInfobipWhatsApp(infobipEnv, {
  toPhone: '50248048638',
  candidate: { name: 'Candidate Name', candidate_brand_name: 'Allied Global', role: 'Bilingual Customer Care' },
  link: 'https://example.com/candidate?invite=abc',
  buttonToken: 'abc',
  idempotencyKey: 'wa-event-1',
});
assert.equal(infobipWhatsApp.transport, 'whatsapp');
assert.equal(fetchCalls.at(-1).url, 'https://abc123.api.infobip.com/whatsapp/1/message/template');
const infobipWhatsAppBody = JSON.parse(fetchCalls.at(-1).options.body);
assert.equal(infobipWhatsAppBody.messages[0].from, '+50255551212');
assert.equal(infobipWhatsAppBody.messages[0].to, '50248048638');
assert.equal(infobipWhatsAppBody.messages[0].messageId, 'wa-event-1');
assert.equal(infobipWhatsAppBody.messages[0].content.templateName, 'gazelle_assessment_invitation');
assert.equal(infobipWhatsAppBody.messages[0].content.language, 'es');
assert.deepEqual(infobipWhatsAppBody.messages[0].content.templateData.body.placeholders, ['Candidate Name', 'Allied Global', 'Bilingual Customer Care']);
assert.deepEqual(infobipWhatsAppBody.messages[0].content.templateData.buttons, [{ type: 'URL', parameter: 'abc' }]);

const infobipBodyLink = await brevo.sendInfobipWhatsApp({ ...infobipEnv, INFOBIP_WHATSAPP_LINK_PLACEMENT: 'body' }, {
  toPhone: '50248048638',
  candidate: { name: 'Candidate Name', candidate_brand_name: 'Allied Global', role: 'Bilingual Customer Care' },
  link: 'https://example.com/candidate?invite=abc',
});
const infobipBodyLinkPayload = JSON.parse(fetchCalls.at(-1).options.body);
assert.deepEqual(infobipBodyLinkPayload.messages[0].content.templateData.body.placeholders, ['Candidate Name', 'Allied Global', 'Bilingual Customer Care', 'https://example.com/candidate?invite=abc']);
assert.equal(infobipBodyLinkPayload.messages[0].content.templateData.buttons, undefined);

const customSmsEnv = {
  ...env,
  SMS_PROVIDER: 'custom_http',
  CUSTOM_SMS_ENDPOINT: 'https://sms.example.com/send',
  CUSTOM_SMS_API_KEY: 'custom-sms-key',
  CUSTOM_SMS_SENDER: 'Gazelle',
};
assert.equal(brevo.contactabilityConfig(customSmsEnv).sms.configured, true);
const customSms = await brevo.sendCustomHttpSms(customSmsEnv, {
  toPhone: '50248048638',
  text: 'Complete your assessment',
  idempotencyKey: 'custom-sms-1',
  tag: 'tenure-potential',
});
assert.equal(customSms.transport, 'sms');
assert.equal(fetchCalls.at(-1).url, 'https://sms.example.com/send');
assert.equal(fetchCalls.at(-1).options.headers.Authorization, 'Bearer custom-sms-key');
assert.deepEqual(JSON.parse(fetchCalls.at(-1).options.body), {
  from: 'Gazelle',
  to: '50248048638',
  text: 'Complete your assessment',
  messageId: 'custom-sms-1',
  tag: 'tenure-potential',
});

await assert.rejects(
  brevo.sendInfobipWhatsApp({ ...infobipEnv, INFOBIP_WHATSAPP_TEMPLATE_NAME: 'missing_template' }, {
    toPhone: '50248048638',
    candidate: { name: 'Candidate Name', candidate_brand_name: 'Allied Global', role: 'Bilingual Customer Care' },
    link: 'https://example.com/candidate?invite=abc',
  }),
  /whatsapp_template_not_approved/,
);

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
assert.equal(brevo.brevoInvitationStatus('requests'), 'accepted');
assert.equal(brevo.brevoInvitationStatus('delivered'), 'delivered');
assert.equal(brevo.brevoInvitationStatus('soft_bounce'), 'deferred');
assert.equal(brevo.brevoInvitationStatus('soft_bounces'), 'deferred');
assert.equal(brevo.brevoInvitationStatus('hard_bounce'), 'hard_bounce');
assert.equal(brevo.brevoInvitationStatus('hard_bounces'), 'hard_bounce');
assert.equal(brevo.brevoInvitationStatus('invalid'), 'invalid_email');
assert.equal(brevo.brevoInvitationStatus('spam'), 'complained');
assert.equal(brevo.brevoInvitationStatus('spam_reports'), 'complained');
assert.equal(brevo.brevoInvitationStatus('opened'), null);
assert.equal(brevo.brevoDeliverySummary([{ event: 'request', date: '2026-08-11T16:03:24Z' }], { blocked: false }, true).status, 'pending');
assert.equal(brevo.brevoDeliverySummary([{ event: 'delivered', date: '2026-08-11T16:04:24Z' }], { blocked: false }, true).status, 'delivered');
assert.equal(brevo.brevoDeliverySummary([{ event: 'hardBounce', reason: 'Mailbox unavailable' }], { blocked: false }, true).status, 'hard_bounce');
assert.equal(brevo.brevoDeliverySummary([], { blocked: true, reason: 'Unsubscribed' }, true).status, 'blocked');
assert.equal(brevo.normalizedProviderMessageId('<brevo-message-123@example.com>'), 'brevo-message-123@example.com');
assert.equal(brevo.batchDeliveryStatus({ status: 'completed', accepted_count: 25, failed_count: 0, provider_confirmed_count: 0, delivered_count: 0 }), 'provider_unconfirmed');
assert.equal(brevo.batchDeliveryStatus({ status: 'api_accepted', accepted_count: 25, failed_count: 0, provider_confirmed_count: 25, delivered_count: 3 }), 'provider_confirmed');
assert.equal(brevo.batchDeliveryStatus({ status: 'api_accepted', accepted_count: 25, failed_count: 0, provider_confirmed_count: 25, delivered_count: 25 }), 'delivered');
assert.equal(brevo.batchDeliveryStatus({ status: 'processing', accepted_count: 0, failed_count: 0, provider_confirmed_count: 0, delivered_count: 0 }), 'processing');
assert.equal(brevo.normalizeCandidateEmail('?candidate@example.com').email, 'candidate@example.com');
assert.equal(brevo.normalizeCandidateEmail('candidate@@example.com').valid, false);
assert.equal(brevo.isRetryableProviderError({ message: 'provider_timeout' }), true);
assert.equal(brevo.isRetryableProviderError({ message: 'invalid_email', providerStatus: 422 }), false);
assert.match(source, /async scheduled\(/);
assert.match(source, /processDueJourneyEvents/);
assert.match(source, /\/api\/journeys/);
assert.match(source, /idempotencyKey: row\.item_id/);
assert.match(source, /\/api\/admin\/email-diagnostics/);
assert.match(source, /email-delivery\\\/check/);
assert.match(source, /reconcilePendingEmailDelivery/);
assert.match(source, /status NOT IN \('completed', 'delivered', 'deferred'/);
assert.match(source, /\/smtp\/statistics\/events\?days=2/);
assert.match(source, /\/smtp\/blockedContacts\?limit=100/);
assert.match(source, /\/smtp\/emails\?email=/);
assert.match(source, /secureTransport: 'starttls'/);
assert.match(source, /AUTH LOGIN/);

console.log('Brevo integration tests passed.');
