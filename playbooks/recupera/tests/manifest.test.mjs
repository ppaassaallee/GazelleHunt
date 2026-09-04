import assert from 'node:assert/strict';
import recuperaManifest from '../manifest.js';
import { RECUPERA_STATES, RECUPERA_STATE_KEYS, RECUPERA_TERMINAL_STATES } from '../states.js';
import { RECUPERA_STRATEGIES, RECUPERA_STRATEGY_KEYS } from '../strategies.js';

const EXPECTED_STATE_KEYS = [
  'PRE_DUE', 'DUE', 'DPD_1_7', 'DPD_8_15', 'DPD_16_30', 'DPD_31_60', 'DPD_60_PLUS',
  'PROMISE', 'DISPUTE', 'PAID', 'LEGAL', 'CLOSED',
];

const EXPECTED_TERMINAL = ['PAID', 'LEGAL', 'CLOSED'];

assert.equal(recuperaManifest.id, 'recupera');
assert.equal(recuperaManifest.version, '0.1.0');
assert.equal(recuperaManifest.outcome, 'RECOVER_PAYMENT');
assert.equal(recuperaManifest.agent, 'rocio');
assert.deepEqual(recuperaManifest.goal_events, ['payment_received', 'promise_created']);
assert.equal(recuperaManifest.stop_on_reply, false);
assert.deepEqual(recuperaManifest.stop_events, ['payment.received', 'dispute.opened', 'opt_out']);
assert.deepEqual(recuperaManifest.channels, ['whatsapp', 'email', 'sms', 'voice']);

assert.deepEqual(RECUPERA_STATE_KEYS, EXPECTED_STATE_KEYS);
assert.equal(RECUPERA_STATES.length, EXPECTED_STATE_KEYS.length);
assert.deepEqual(RECUPERA_TERMINAL_STATES, EXPECTED_TERMINAL);

for (const state of RECUPERA_STATES) {
  assert.equal(typeof state.key, 'string');
  assert.equal(typeof state.label, 'string');
  assert.equal(typeof state.terminal, 'boolean');
}

for (const key of EXPECTED_TERMINAL) {
  const state = RECUPERA_STATES.find((entry) => entry.key === key);
  assert(state, `missing terminal state ${key}`);
  assert.equal(state.terminal, true, `${key} should be terminal`);
}

for (const key of ['PROMISE', 'DISPUTE', 'DPD_1_7']) {
  const state = RECUPERA_STATES.find((entry) => entry.key === key);
  assert.equal(state.terminal, false, `${key} should not be terminal`);
}

assert.deepEqual(RECUPERA_STRATEGY_KEYS, ['AMABLE', 'EQUILIBRADA', 'FIRME']);

for (const key of RECUPERA_STRATEGY_KEYS) {
  const strategy = RECUPERA_STRATEGIES[key];
  assert.equal(strategy.key, key);
  assert.ok(Array.isArray(strategy.steps) && strategy.steps.length > 0, `${key} must have steps`);
  for (const step of strategy.steps) {
    assert.ok(step.channel, `${key} step missing channel`);
    assert.ok(typeof step.delay_minutes === 'number', `${key} step missing delay_minutes`);
  }
}

assert.equal(recuperaManifest.states, RECUPERA_STATES);
assert.equal(recuperaManifest.strategies, RECUPERA_STRATEGIES);

console.log('recupera manifest tests passed');
