import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/journeys.js', import.meta.url), 'utf8');

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
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__journeysTest = {
  normalizedJourneySteps,
  validateJourneyApiUrl,
  parseJourneyApiHeaders,
  scheduledJourneyStepDate,
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

console.log('Runtime journeys module tests passed.');
