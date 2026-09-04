import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/contactability.js', import.meta.url), 'utf8');

const context = {
  globalThis: null,
  Date,
  Intl,
  JSON,
  String,
  Number,
  Math,
  Array,
  Object,
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__contactabilityTest = {
  canContact,
  nextQuietHoursStart,
  localPartsInTimezone,
};`, context);

const contactability = context.__contactabilityTest;
assert.equal(typeof contactability.canContact, 'function');

const blocked = contactability.canContact({ do_not_contact: 1 }, 'email');
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'do_not_contact');

const optedOut = contactability.canContact({ opt_out_channels_json: '["whatsapp"]' }, 'whatsapp');
assert.equal(optedOut.ok, false);
assert.equal(optedOut.reason, 'opt_out');
const emailAllowed = contactability.canContact({ opt_out_channels_json: '["whatsapp"]' }, 'email');
assert.equal(emailAllowed.ok, true);

const quietBlocked = contactability.canContact({}, 'email', new Date('2026-01-05T06:00:00.000Z'), { defaultTimezone: 'UTC' });
assert.equal(quietBlocked.ok, false);
assert.equal(quietBlocked.reason, 'quiet_hours');
assert.equal(typeof quietBlocked.nextRetryAt, 'string');

const quietAllowed = contactability.canContact({}, 'email', new Date('2026-01-05T12:00:00.000Z'), { defaultTimezone: 'UTC' });
assert.equal(quietAllowed.ok, true);

const capped = contactability.canContact({}, 'email', new Date('2026-01-05T12:00:00.000Z'), { defaultTimezone: 'UTC', contactsThisWeek: 7 });
assert.equal(capped.ok, false);
assert.equal(capped.reason, 'frequency_cap');

const nextStart = contactability.nextQuietHoursStart(new Date('2026-01-05T22:00:00.000Z'), {}, 'UTC');
assert.equal(contactability.localPartsInTimezone(new Date(nextStart), 'UTC').hour, 8);

console.log('Runtime contactability module tests passed.');
