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
  fetch: async (url) => ({
    ok: true,
    status: 200,
    async json() {
      if (String(url).startsWith('/api/assessment')) {
        return {
          candidate: { name: 'Candidate', role: 'Customer Care', site: 'Guatemala City' },
          roleConditions: { en: ['Rotating schedule'], es: ['Horario rotativo'] },
        };
      }
      if (url === '/api/candidates') return { candidates: [] };
      return { database: true, email: { configured: false, provider: 'Mailgun', region: 'US' } };
    },
  }),
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

await context.__gazelleWorkflowTest.startInvite('test-token');
assert.match(appElement.innerHTML, /class="candidate-app"/);
assert.doesNotMatch(appElement.innerHTML, /class="app-shell"/);
assert.match(appElement.innerHTML, /Choose your language/);

assert.match(indexSource, /app\.js\?v=20260717\.5/);
assert.match(indexSource, /assessment-engine\.js\?v=20260717\.5/);
assert.match(indexSource, /ai-assessment\.js\?v=20260717\.5/);
assert.match(indexSource, /pdf-report\.js\?v=20260717\.5/);
assert.match(serverSource, /\/assessment\?invite=/);
assert.match(serverSource, /\/api\/assessment\/scenarios/);
assert.match(serverSource, /aiAnalysisMatch/);
assert.match(serverSource, /ai-analysis/);
assert.match(serverSource, /'cache-control': 'no-cache'/);
assert.match(serverSource, /assessments_invitation_unique/);
assert.match(serverSource, /temporary_fail/);
assert.match(serverSource, /A valid experience branch is required/);
assert.match(appSource, /Administrator sign-in/);
assert.match(appSource, /Continue to scenarios/);
assert.match(appSource, /Download PDF/);
assert.match(appSource, /Human review required/);

for (const variable of [
  'MAILGUN_API_KEY',
  'MAILGUN_DOMAIN',
  'MAILGUN_FROM',
  'MAILGUN_REGION',
  'MAILGUN_WEBHOOK_SIGNING_KEY',
]) {
  assert.match(serverSource, new RegExp(variable));
  assert.match(readmeSource, new RegExp(variable));
}

for (const variable of ['OPENAI_API_KEY', 'OPENAI_MODEL']) {
  assert.match(serverSource, new RegExp(variable));
  assert.match(readmeSource, new RegExp(variable));
}

assert.match(readmeSource, /first interactive screen always asks/);
assert.match(readmeSource, /private owner-only deployment is suitable for internal review but not for external candidate delivery/);
assert.match(readmeSource, /Scenario responses and the GPT-5\.5 narrative also have a weight of zero/);

console.log('Workflow tests passed.');
