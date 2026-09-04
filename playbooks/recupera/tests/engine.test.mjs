import assert from 'node:assert/strict';
import {
  stageFromDueDate,
  nextStageAfterPayment,
  nextStageAfterPromise,
  nextStageAfterBrokenPromise,
  isTerminalStage,
} from '../engine.js';

const NOW = new Date('2026-09-04T12:00:00.000Z');

assert.equal(stageFromDueDate('2026-09-05', NOW), 'PRE_DUE');
assert.equal(stageFromDueDate('2026-09-04', NOW), 'DUE');
assert.equal(stageFromDueDate('2026-09-03', NOW), 'DPD_1_7');
assert.equal(stageFromDueDate('2026-08-28', NOW), 'DPD_1_7');
assert.equal(stageFromDueDate('2026-08-27', NOW), 'DPD_8_15');
assert.equal(stageFromDueDate('2026-08-20', NOW), 'DPD_8_15');
assert.equal(stageFromDueDate('2026-08-19', NOW), 'DPD_16_30');
assert.equal(stageFromDueDate('2026-08-05', NOW), 'DPD_16_30');
assert.equal(stageFromDueDate('2026-08-04', NOW), 'DPD_31_60');
assert.equal(stageFromDueDate('2026-07-06', NOW), 'DPD_31_60');
assert.equal(stageFromDueDate('2026-07-05', NOW), 'DPD_60_PLUS');
assert.equal(stageFromDueDate('2026-01-01', NOW), 'DPD_60_PLUS');

assert.equal(nextStageAfterPayment(), 'PAID');
assert.equal(nextStageAfterPromise(), 'PROMISE');

assert.equal(
  nextStageAfterBrokenPromise({ due_date: '2026-08-28' }, NOW),
  'DPD_1_7',
);
assert.equal(
  nextStageAfterBrokenPromise({ due_date: '2026-07-05' }, NOW),
  'DPD_60_PLUS',
);
assert.equal(nextStageAfterBrokenPromise({}, NOW), 'DPD_1_7');

assert.equal(isTerminalStage('PAID'), true);
assert.equal(isTerminalStage('LEGAL'), true);
assert.equal(isTerminalStage('CLOSED'), true);
assert.equal(isTerminalStage('DPD_1_7'), false);
assert.equal(isTerminalStage('PROMISE'), false);

assert.throws(() => stageFromDueDate('not-a-date', NOW), /invalid_due_date/);

console.log('recupera engine tests passed');
