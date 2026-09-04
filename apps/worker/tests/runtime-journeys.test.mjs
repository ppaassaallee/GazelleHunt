import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
function isRetryableProviderError(error) {
  const status = Number(error?.providerStatus || 0);
  const code = cleanText(error?.message, 120);
  if (['provider_timeout', 'brevo_smtp_timeout', 'brevo_smtp_disconnected', 'brevo_missing_message_id'].includes(code)) return true;
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500 || (!status && !['invalid_email', 'email_not_configured', 'attempt_limit_reached'].includes(code));
}
function contactabilityConfig() { return { sms: { configured: true }, whatsapp: { configured: true } }; }
function messageTemplateByReference() { return null; }
function templateInvitationMessage() { return ''; }
async function sendInvitationForCandidate() { return { invitationId: 'inv', providerMessageId: 'msg' }; }
async function audit() {}
function json() { return new Response(); }
function listScope() { return { sql: '1=1', bindings: [] }; }
function candidateScope() { return { sql: '1=1', bindings: [] }; }
async function executableTest() { return null; }
async function visibleList() { return null; }
async function ensureSchema() {}
`;

const source = helpers + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/contactability.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/journeys.js', import.meta.url), 'utf8'));

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
  URL,
  Intl,
  Response,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__journeysTest = {
  normalizedJourneySteps,
  validateJourneyApiUrl,
  parseJourneyApiHeaders,
  scheduledJourneyStepDate,
  journeyRetryAt,
  isRetryableJourneyError,
  journeyGoalReached,
  listContactJourneys,
  createContactJourney,
  enrollContactJourney,
  sendJourneyApiEvent,
  processDueJourneyEvent,
  processDueJourneyEvents,
};`, context);

const journeys = context.__journeysTest;
assert.equal(typeof journeys.normalizedJourneySteps, 'function');
assert.equal(typeof journeys.processDueJourneyEvents, 'function');
assert.equal(typeof journeys.journeyRetryAt, 'function');

assert.equal(typeof journeys.journeyGoalReached, 'function');

const steps = journeys.normalizedJourneySteps([{ channel: 'email', delayHours: 2 }]);
assert.equal(steps.length, 1);
assert.equal(steps[0].channel, 'email');
assert.equal(steps[0].delay_minutes, 120);
assert.equal(steps[0].step_order, 1);

const fallback = journeys.normalizedJourneySteps([]);
assert.equal(fallback.length, 6);
assert.equal(fallback[0].channel, 'whatsapp');

assert.equal(journeys.validateJourneyApiUrl('https://api.example.com/hook'), true);
assert.equal(journeys.validateJourneyApiUrl('http://api.example.com/hook'), false);
assert.equal(journeys.validateJourneyApiUrl('https://localhost/hook'), false);

assert.equal(JSON.stringify(journeys.parseJourneyApiHeaders('')), '{}');
assert.deepEqual(journeys.parseJourneyApiHeaders('{"Authorization":"Bearer token"}'), { Authorization: 'Bearer token' });
assert.equal(journeys.parseJourneyApiHeaders('not-json'), null);

const start = new Date('2026-01-05T10:00:00.000Z');
const scheduled = journeys.scheduledJourneyStepDate(start, { delay_minutes: 30, business_day_offset: null });
assert.equal(scheduled.toISOString(), '2026-01-05T10:30:00.000Z');

const retry1 = Date.parse(journeys.journeyRetryAt(1));
const retry2 = Date.parse(journeys.journeyRetryAt(2));
const retry3 = Date.parse(journeys.journeyRetryAt(3));
assert.ok(retry1 - Date.now() >= 4.9 * 60 * 1000 && retry1 - Date.now() <= 5.1 * 60 * 1000);
assert.ok(retry2 - Date.now() >= 29 * 60 * 1000 && retry2 - Date.now() <= 31 * 60 * 1000);
assert.ok(retry3 - Date.now() >= 119 * 60 * 1000 && retry3 - Date.now() <= 121 * 60 * 1000);

assert.equal(journeys.isRetryableJourneyError({ message: 'provider_timeout' }), true);
assert.equal(journeys.isRetryableJourneyError({ message: 'whatsapp_template_not_approved' }), false);
assert.equal(journeys.isRetryableJourneyError({ message: 'invalid_email', providerStatus: 422 }), false);

const journeysSource = await readFile(new URL('../../../packages/runtime/src/journeys.js', import.meta.url), 'utf8');
assert.match(journeysSource, /async function journeyGoalReached/);
assert.match(journeysSource, /case 'assessment_completed':/);
assert.match(journeysSource, /goal_event, stop_on_reply/);
assert.match(journeysSource, /VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, 'assessment_completed', 1, \?, \?\)/);
assert.match(journeysSource, /j\.goal_event, j\.stop_on_reply, j\.stop_events_json/);

console.log('Runtime journeys module tests passed.');
