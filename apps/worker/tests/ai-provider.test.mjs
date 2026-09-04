import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = (
  (await readFile(new URL('../../../packages/runtime/src/audit.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/messaging.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/contactability.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/journeys.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/templates.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/portal.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/ai.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../packages/runtime/src/webhooks.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../playbooks/recupera/stage.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../../../playbooks/recupera/api.js', import.meta.url), 'utf8'))
  + '\n'
  + (await readFile(new URL('../src/legacy/server-worker.js', import.meta.url), 'utf8'))
).replace('export default {', 'globalThis.__worker = {');
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
  GazelleAiAssessment: { DEFAULT_MODEL: 'gpt-4.1-mini', DEFAULT_GEMINI_MODEL: 'gemini-3.5-flash' },
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__aiProviderTest = { aiConfig, openAiSupportsReasoning, openAiJsonResult, isRetryableAiError };`, context);

const api = context.__aiProviderTest;
assert.equal(api.aiConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4.1-mini' }).background, false);
assert.equal(api.aiConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4.1-mini', OPENAI_BACKGROUND: 'true' }).background, true);
assert.equal(api.openAiSupportsReasoning('gpt-4.1-mini'), false);
assert.equal(api.openAiSupportsReasoning('gpt-5-mini'), true);
assert.deepEqual(JSON.parse(JSON.stringify(api.openAiJsonResult({ id: 'resp_123', status: 'in_progress', model: 'gpt-4.1-mini' }, { model: 'gpt-4.1-mini' }))), {
  pending: true,
  responseId: 'resp_123',
  model: 'gpt-4.1-mini',
});
const completed = api.openAiJsonResult({
  id: 'resp_456', status: 'completed', model: 'gpt-4.1-mini',
  output: [{ type: 'message', content: [{ type: 'output_text', text: '{"status":"ok"}' }] }],
}, { model: 'gpt-4.1-mini' });
assert.equal(completed.data.status, 'ok');
assert.equal(api.isRetryableAiError({ message: 'provider_timeout' }), true);
assert.equal(api.isRetryableAiError({ message: 'ai_invalid_analysis' }), false);
assert.match(source, /background: config\.providerKey === 'openai' && config\.background/);
assert.match(source, /AI_BACKGROUND_MAX_MS/);
assert.match(source, /retrieveOpenAiJson/);

console.log('AI provider queue tests passed.');
