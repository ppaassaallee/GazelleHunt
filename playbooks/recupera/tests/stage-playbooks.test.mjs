import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(root, '../stage-playbooks.js'), 'utf8');

// Evaluate plain script helpers in isolation.
const sandbox = { console };
const fn = new Function(
  'exports',
  `${source}
  return {
    band: recuperaIntensityBand,
    drafts: recuperaStagePlaybookDrafts,
    resolve: recuperaResolveActivationStage,
    preview: recuperaPreviewLines,
    name: recuperaJourneyNameFor,
  };`,
);
const api = fn({});

assert.equal(api.band('PRE_DUE'), 'preventivo');
assert.equal(api.band('DPD_1_7'), 'temprano');
assert.equal(api.band('DPD_31_60'), 'medio');
assert.equal(api.band('DPD_60_PLUS'), 'avanzado');
assert.equal(api.resolve('PRE_DUE', false), 'DUE');
assert.equal(api.resolve('PRE_DUE', true), 'PRE_DUE');

const soft = api.drafts('AMABLE', 'PRE_DUE', 'off');
assert.ok(soft.every((step) => step.channel !== 'voice'));
assert.match(soft[0].messageEs, /fecha de pago/i);

const firm = api.drafts('FIRME', 'DPD_60_PLUS', 'stage');
assert.ok(firm.some((step) => step.channel === 'voice'));
assert.ok(firm.some((step) => /escal/i.test(step.messageEs)));

const preview = api.preview('EQUILIBRADA', 'DPD_1_7', 'if_no_reply');
assert.ok(preview.some((line) => /WhatsApp/.test(line)));
assert.ok(preview.some((line) => /Rocío/.test(line)));

assert.equal(api.name('FIRME', 'DUE'), 'Recupera · FIRME · DUE');

console.log('stage-playbooks.test.mjs: ok');
