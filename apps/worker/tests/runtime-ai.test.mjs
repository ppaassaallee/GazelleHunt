import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const helpers = `
function cleanText(value, max) {
  return String(value || '').slice(0, max).trim();
}
async function fetchWithTimeout() {
  throw new Error('fetchWithTimeout stub');
}
`;

const source = helpers + '\n' + await readFile(new URL('../../../packages/runtime/src/ai.js', import.meta.url), 'utf8');

const context = {
  globalThis: null,
  crypto: webcrypto,
  TextEncoder,
  Date,
  JSON,
  String,
  GazelleAiAssessment: { DEFAULT_MODEL: 'gpt-4.1-mini', DEFAULT_GEMINI_MODEL: 'gemini-3.5-flash' },
};
context.globalThis = context;
vm.runInNewContext(`${source}\n;globalThis.__aiTest = { aiConfig, openAiSupportsReasoning, openAiJsonResult, isRetryableAiError };`, context);

const api = context.__aiTest;
assert.equal(typeof api.aiConfig, 'function');
assert.equal(api.aiConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4.1-mini' }).background, false);
assert.equal(api.aiConfig({ OPENAI_API_KEY: 'sk-test', OPENAI_MODEL: 'gpt-4.1-mini', OPENAI_BACKGROUND: 'true' }).background, true);
assert.equal(api.openAiSupportsReasoning('gpt-4.1-mini'), false);
assert.equal(api.openAiSupportsReasoning('gpt-5-mini'), true);
assert.equal(api.isRetryableAiError({ message: 'provider_timeout' }), true);
assert.equal(api.isRetryableAiError({ message: 'ai_invalid_analysis' }), false);

console.log('Runtime AI module tests passed.');
