import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import '../assessment-engine.js';
import '../ai-assessment.js';
import '../pdf-report.js';

const [appSource, indexSource, serverSource, readmeSource] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
]);

const appElement = { innerHTML: '' };
const fetchCalls = [];
const previewAnalysis = {
  status: 'completed', model: 'gpt-5.5-2026-04-23', prompt_version: 'analysis-v1.0.0', evidence_hash: 'a'.repeat(64), output_hash: 'b'.repeat(64),
  output: {
    en: { title: 'Preview analysis', paragraphs: Array.from({ length: 5 }, (_, index) => `English paragraph ${index + 1}`), interview_focus: ['Focus one', 'Focus two', 'Focus three'] },
    es: { title: 'Análisis de vista previa', paragraphs: Array.from({ length: 5 }, (_, index) => `Párrafo en español ${index + 1}`), interview_focus: ['Enfoque uno', 'Enfoque dos', 'Enfoque tres'] },
  },
};
const context = {
  globalThis: null,
  GazelleAssessmentEngine: globalThis.GazelleAssessmentEngine,
  GazelleAiAssessment: globalThis.GazelleAiAssessment,
  GazellePdfReport: globalThis.GazellePdfReport,
  document: {
    getElementById(id) { return id === 'app' ? appElement : null; },
    querySelectorAll() { return []; },
  },
  location: { search: '', pathname: '/', origin: 'https://assessment.example.com' },
  history: { replaceState() {} },
  fetch: async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    return {
    ok: true,
    status: 200,
    async json() {
      if (url === '/api/auth/me') return { user: { id: 'owner-1', name: 'Alejandro Pascual', email: 'david.alejandro.pa@gmail.com', role: 'super_admin', status: 'active', companyId: 'org_legacy', companyName: 'Gazelle Platform' } };
      if (url === '/api/preview/ai-analysis') return { analysis: previewAnalysis };
      if (String(url).startsWith('/api/assessment')) {
        return {
          candidate: { name: 'Candidate', role: 'Customer Care', site: 'Guatemala City' },
          roleConditions: { en: ['Rotating schedule'], es: ['Horario rotativo'] },
        };
      }
      if (url === '/api/candidates') return { candidates: [] };
      if (url === '/api/tests') return { tests: [{ id: 'test_tenure_potential', code: 'TP-001', name_en: 'Tenure Potential', name_es: 'Potencial de Permanencia', description_en: 'Transparent assessment.', description_es: 'Evaluacion transparente.', engine_key: 'tenure_potential', status: 'active', version: '2.0.0-pilot', estimated_minutes: 15, item_count: 27 }] };
      if (url === '/api/lists') return { lists: [] };
      if (url === '/api/batches') return { batches: [] };
      if (url === '/api/admin/users') return { users: [], companies: [{ id: 'org_legacy', name: 'Gazelle Platform' }] };
      return { database: true, email: { configured: false, sendingConfigured: false, webhookConfigured: false, provider: 'Brevo', senderEmail: null, senderName: 'Gazelle Assessment' }, ai: { configured: true, model: 'gpt-5.5-2026-04-23' } };
    },
  };
  },
  URLSearchParams,
  Intl,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  JSON,
  console,
  setTimeout() { return 0; },
  clearTimeout() {},
};
context.globalThis = context;

vm.runInNewContext(`${appSource}\n;globalThis.__gazelleWorkflowTest = { startPreview, startInvite, prepareScenarios, completeAssessment, state, render };`, context);
await Promise.resolve();

context.__gazelleWorkflowTest.startPreview();
assert.match(appElement.innerHTML, /Choose your language/);
assert.match(appElement.innerHTML, /Elige tu idioma/);
assert.match(appElement.innerHTML, /data-language="en"/);
assert.match(appElement.innerHTML, /data-language="es"/);

const previewState = context.__gazelleWorkflowTest.state;
previewState.runner.locale = 'en';
previewState.runner.experienceBranch = 'experienced';
previewState.runner.stage = 'questions';
previewState.runner.startedAt = new Date().toISOString();
for (const item of globalThis.GazelleAssessmentEngine.applicableItems('experienced')) {
  previewState.runner.answers[item.id] = 4;
  previewState.runner.responseTimes[item.id] = 5000;
}
await context.__gazelleWorkflowTest.prepareScenarios();
assert.match(appElement.innerHTML, /Job scenario/);
assert.match(appElement.innerHTML, /1 \/ 3/);
assert.match(appElement.innerHTML, /Score weight: 0/);
for (const scenario of previewState.runner.scenarios) {
  previewState.runner.scenarioResponses[scenario.scenarioId] = 'I would clarify the priority, explain my reasoning, ask for feedback, and document the next action before continuing.';
  previewState.runner.scenarioResponseTimes[scenario.scenarioId] = 12000;
}
await context.__gazelleWorkflowTest.completeAssessment();
assert.match(appElement.innerHTML, /Assessment complete/);
assert.equal(context.__gazelleWorkflowTest.state.previewReport.scenarioResponses.length, 3);
assert.equal(context.__gazelleWorkflowTest.state.previewReport.aiAnalysis.status, 'completed');
assert.equal(context.__gazelleWorkflowTest.state.previewReport.aiAnalysis.output.en.paragraphs.length, 5);
assert.ok(fetchCalls.some((call) => call.url === '/api/preview/ai-analysis' && call.options.method === 'POST'));

await context.__gazelleWorkflowTest.startInvite('test-token');
assert.match(appElement.innerHTML, /class="candidate-app"/);
assert.doesNotMatch(appElement.innerHTML, /class="app-shell"/);
assert.match(appElement.innerHTML, /Choose your language/);

assert.match(indexSource, /app\.js\?v=20260717\.9/);
assert.match(indexSource, /assessment-engine\.js\?v=20260717\.9/);
assert.match(indexSource, /ai-assessment\.js\?v=20260717\.9/);
assert.match(indexSource, /pdf-report\.js\?v=20260717\.9/);
assert.match(serverSource, /\/assessment\?invite=/);
assert.match(serverSource, /\/api\/assessment\/scenarios/);
assert.match(serverSource, /aiAnalysisMatch/);
assert.match(serverSource, /ai-analysis/);
assert.match(serverSource, /\/api\/preview\/ai-analysis/);
assert.match(serverSource, /assetHeaders\('text\/html; charset=utf-8', 'no-cache', true\)/);
assert.match(serverSource, /assessments_invitation_unique/);
assert.match(serverSource, /soft_bounce/);
assert.match(serverSource, /hard_bounce/);
assert.match(serverSource, /A valid experience branch is required/);
assert.match(appSource, /Create your account/);
assert.match(appSource, /Activate super administrator/);
assert.match(appSource, /Candidate lists/);
assert.match(appSource, /Send selected tests/);
assert.match(appSource, /Continue to scenarios/);
assert.match(appSource, /Download PDF/);
assert.match(appSource, /Human review required/);
assert.doesNotMatch(appSource, /Preview mode does not send responses to OpenAI/);
assert.doesNotMatch(appSource, /signin-with-chatgpt/);

for (const route of [
  '/api/auth/signup', '/api/auth/login', '/api/auth/logout', '/api/auth/me',
  '/api/tests', '/api/lists', '/api/batches', '/api/admin/users',
  '/api/brevo/configure-webhook',
]) assert.match(serverSource, new RegExp(route.replaceAll('/', '\\/')));

for (const securityControl of [
  '__Host-gz_session', 'PBKDF2', 'SameSite=Strict', 'HttpOnly', 'PASSWORD_ITERATIONS',
  'candidateScope', 'listScope', 'rateLimit',
]) assert.match(serverSource, new RegExp(securityControl));

for (const variable of [
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'BREVO_SENDER_NAME',
  'BREVO_WEBHOOK_TOKEN',
]) {
  assert.match(serverSource, new RegExp(variable));
  assert.match(readmeSource, new RegExp(variable));
}

for (const providerControl of [
  '/api/brevo/webhook', 'https://api.brevo.com/v3/smtp/email',
  'idempotencyKey', 'X-Mailin-custom', 'Bearer',
]) assert.match(serverSource, new RegExp(providerControl.replaceAll('/', '\\/')));

assert.doesNotMatch(`${appSource}\n${serverSource}\n${readmeSource}`, /mailgun/i);
assert.doesNotMatch(serverSource, /MAILGUN_/);

for (const variable of ['OPENAI_API_KEY', 'OPENAI_MODEL']) {
  assert.match(serverSource, new RegExp(variable));
  assert.match(readmeSource, new RegExp(variable));
}

assert.match(readmeSource, /first interactive screen always asks/);
assert.match(readmeSource, /Sites access policy must be public/);
assert.match(readmeSource, /Scenario responses and the GPT-5\.5 narrative also have a weight of zero/);

console.log('Workflow tests passed.');
