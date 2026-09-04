import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const rocioSource = await readFile(new URL('../rocio.js', import.meta.url), 'utf8');

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
async function ensureSchema() {}
async function audit() {}
async function recuperaPlaybookEnabled() { return true; }
`;

const context = { globalThis: null, Date, Math, Number, String, Object, Array, JSON, console, crypto: { randomUUID: () => 'job-test-id' } };
context.globalThis = context;
vm.runInNewContext(`${helpers}\n${rocioSource}\n;globalThis.__rocio = { rocioClassifyIntent, rocioExtractPromiseDate, rocioProcessInbound, rocioInboundEnabled };`, context);

const rocio = context.__rocio;
const NOW = new Date('2026-09-04T12:00:00.000Z'); // Thursday

assert.equal(rocio.rocioInboundEnabled({ RECUPERA_ROCIO_INBOUND: 'true' }), true);
assert.equal(rocio.rocioInboundEnabled({}), false);

const promise = rocio.rocioClassifyIntent('Prometo pagar el viernes');
assert.equal(promise.intent, 'PROMISE_TO_PAY');
assert.equal(promise.needsHuman, false);
assert.ok(promise.confidence >= 0.8);
assert.equal(promise.suggestedAction, 'promise');
assert.equal(rocio.rocioExtractPromiseDate('pago el viernes', NOW), '2026-09-04');

const paid = rocio.rocioClassifyIntent('Ya pagué, adjunto comprobante');
assert.equal(paid.intent, 'ALREADY_PAID');
assert.equal(paid.suggestedAction, 'verify_payment');

const dispute = rocio.rocioClassifyIntent('Esto es un error, no debo nada');
assert.equal(dispute.intent, 'DISPUTE');

const hardship = rocio.rocioClassifyIntent('No puedo pagar, estoy desempleado');
assert.equal(hardship.intent, 'HARDSHIP');
assert.equal(hardship.needsHuman, true);
assert.equal(hardship.suggestedAction, 'escalate');

const optOut = rocio.rocioClassifyIntent('No me contacten más por favor');
assert.equal(optOut.intent, 'OPT_OUT');
assert.equal(optOut.suggestedAction, 'opt_out');

const english = rocio.rocioClassifyIntent('I will pay on Friday');
assert.equal(english.intent, 'PROMISE_TO_PAY');

const unknown = rocio.rocioClassifyIntent('hola');
assert.equal(unknown.intent, 'UNKNOWN');
assert.equal(unknown.needsHuman, true);

assert.match(rocioSource, /rocioClassifyIntent/);
assert.match(rocioSource, /rocioProcessInbound/);
assert.match(rocioSource, /rocioMaybeProcessInfobipInbound/);
assert.match(rocioSource, /rocio_intent_jobs/);
assert.match(rocioSource, /pending_verification/);

console.log('recupera rocio tests passed');
