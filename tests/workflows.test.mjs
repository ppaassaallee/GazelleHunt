import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import '../assessment-engine.js';
import '../ai-assessment.js';
import '../pdf-report.js';

const [appSource, indexSource, serverSource, readmeSource, buildSource] = await Promise.all([
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../server-worker.js', import.meta.url), 'utf8'),
  readFile(new URL('../README.md', import.meta.url), 'utf8'),
  readFile(new URL('../build.mjs', import.meta.url), 'utf8'),
]);

const appElement = { innerHTML: '' };
const fetchCalls = [];
const previewAnalysis = {
  status: 'completed', provider: 'OpenAI', model: 'gpt-5.5', prompt_version: 'analysis-v2.2.0', evidence_hash: 'a'.repeat(64), output_hash: 'b'.repeat(64),
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
          roleConditions: { en: ['Published work schedule'], es: ['Horario de trabajo informado'] },
        };
      }
      if (url === '/api/candidates') return { candidates: [] };
      if (url === '/api/results') return { results: [] };
      if (url === '/api/tests') return { tests: [{ id: 'test_tenure_potential', code: 'TP-001', name_en: 'Tenure Potential', name_es: 'Potencial de Permanencia', description_en: 'Transparent assessment.', description_es: 'Evaluacion transparente.', engine_key: 'tenure_potential', status: 'active', version: '2.0.1-pilot', estimated_minutes: 15, item_count: 27 }] };
      if (url === '/api/lists') return { lists: [] };
      if (url === '/api/batches') return { batches: [] };
      if (url === '/api/journeys') return { journeys: [] };
      if (url === '/api/admin/users') return { users: [], companies: [{ id: 'org_legacy', name: 'Gazelle Platform' }] };
      return { database: true, email: { configured: false, sendingConfigured: false, webhookConfigured: false, provider: 'Brevo', senderEmail: null, senderName: 'Gazelle Assessment' }, messaging: { defaultCountryCode: '502', whatsapp: { configured: false, missing: ['BREVO_WHATSAPP_SENDER_NUMBER'] }, sms: { configured: false, missing: ['BREVO_SMS_SENDER'] } }, ai: { configured: true, provider: 'OpenAI', providerKey: 'openai', model: 'gpt-5.5' } };
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

vm.runInNewContext(`${appSource}\n;globalThis.__gazelleWorkflowTest = { startPreview, startInvite, prepareScenarios, completeAssessment, parseCsv, guessedMapping, csvMappedCandidates, normalizeCandidateEmail, buildExcelWorkbook, renderCandidates, renderSend, renderProgress, renderContactability, bulkResendEligible, filteredReportResults, renderResultDirectory, reportUiCopy, renderReport, renderAudit, renderMethod, state, render };`, context);
await Promise.resolve();

const csvApi = context.__gazelleWorkflowTest;
const spanishCsv = csvApi.parseCsv('\uFEFFNombre,Correo,Numero\nAlejandro Pascual,david.alejandro.pa@gmail.com,48048638');
assert.equal(spanishCsv.delimiter, ',');
assert.equal(JSON.stringify(spanishCsv.headers), JSON.stringify(['Nombre', 'Correo', 'Numero']));
spanishCsv.mapping = spanishCsv.headers.map(csvApi.guessedMapping);
assert.equal(JSON.stringify(spanishCsv.mapping), JSON.stringify(['name', 'email', 'phone']));
const spanishRows = csvApi.csvMappedCandidates(spanishCsv, 'Bilingual Customer Care', '');
assert.equal(spanishRows[0].candidate.name, 'Alejandro Pascual');
assert.equal(spanishRows[0].candidate.email, 'david.alejandro.pa@gmail.com');
assert.equal(spanishRows[0].candidate.phone, '48048638');
assert.equal(spanishRows[0].candidate.role, 'Bilingual Customer Care');
assert.equal(spanishRows[0].errors.length, 0);

const excelCsv = csvApi.parseCsv('sep=;\nNombre;Correo;Puesto\nMaria Lopez;maria@example.com;Sales');
assert.equal(excelCsv.delimiter, ';');
excelCsv.mapping = excelCsv.headers.map(csvApi.guessedMapping);
assert.equal(csvApi.csvMappedCandidates(excelCsv)[0].errors.length, 0);

const repairedEmail = csvApi.normalizeCandidateEmail('?Esteban.Raigoza28@gmail.com');
assert.equal(repairedEmail.email, 'esteban.raigoza28@gmail.com');
assert.equal(repairedEmail.corrected, true);
assert.equal(csvApi.normalizeCandidateEmail('bad@@example.com').valid, false);
const repairedCsv = { headers: ['Name', 'Email', 'Role'], rows: [['Esteban', '?esteban.raigoza28@gmail.com', 'Care']], mapping: ['name', 'email', 'role'] };
const repairedRow = csvApi.csvMappedCandidates(repairedCsv)[0];
assert.equal(repairedRow.errors.length, 0);
assert.equal(repairedRow.candidate.email, 'esteban.raigoza28@gmail.com');
assert.equal(repairedRow.emailCorrection.to, 'esteban.raigoza28@gmail.com');

csvApi.state.user = { role: 'admin', companyName: 'Allied Global' };
csvApi.state.health.email.configured = true;
csvApi.state.health.email.transport = 'api';
csvApi.state.tests = [{ id: 'test_tenure_potential', name_en: 'Tenure Potential', status: 'active', engine_key: 'tenure_potential' }];
csvApi.state.bulkResendTestId = 'test_tenure_potential';
csvApi.state.candidates = [
  { id: 'candidate-ready', name: 'Ready Candidate', email: 'ready@example.com', role: 'Customer Care', company_name: 'Allied Global', invitation_test_id: 'test_tenure_potential', invitation_status: 'delivered', attempts_used: 1, attempt_limit: 3, attempts_remaining: 2 },
  { id: 'candidate-blocked', name: 'Blocked Candidate', email: 'blocked@example.com', role: 'Customer Care', company_name: 'Allied Global', invitation_test_id: 'test_tenure_potential', invitation_status: 'completed', attempts_used: 3, attempt_limit: 3, attempts_remaining: 0 },
  { id: 'candidate-pending', name: 'Pending Candidate', email: 'pending@example.com', role: 'Customer Care', company_name: 'Allied Global', invitation_test_id: 'test_tenure_potential', invitation_id: 'invite-pending', invitation_status: 'accepted', attempts_used: 1, attempt_limit: 3, attempts_remaining: 2 },
];
csvApi.state.selectedCandidateIds = ['candidate-ready'];
const candidateBulkHtml = csvApi.renderCandidates();
assert.match(candidateBulkHtml, /1 selected/);
assert.match(candidateBulkHtml, /Resend to 1/);
assert.match(candidateBulkHtml, /Previous language/);
assert.match(candidateBulkHtml, /candidate-ready[^>]*aria-label="Select Ready Candidate"[^>]*checked/);
assert.match(candidateBulkHtml, /candidate-blocked[^>]*aria-label="Select Blocked Candidate"[^>]*disabled/);
assert.match(candidateBulkHtml, /Awaiting delivery/);
assert.equal(csvApi.bulkResendEligible(csvApi.state.candidates[0], 'test_tenure_potential'), true);
assert.equal(csvApi.bulkResendEligible(csvApi.state.candidates[1], 'test_tenure_potential'), false);

csvApi.state.batches = [{ id: 'batch-unconfirmed', list_name: 'July candidates', company_name: 'Allied Global', created_by_name: 'Alejandro Pascual', status: 'provider_unconfirmed', total_count: 25, accepted_count: 25, failed_count: 0, provider_confirmed_count: 0, delivered_count: 0, completed_assessments: 0, created_at: '2026-07-22T14:49:40.427Z' }];
const progressHtml = csvApi.renderProgress();
assert.match(progressHtml, /API acceptance is not delivery/);
assert.match(progressHtml, /Brevo unconfirmed/);
assert.match(progressHtml, /0 \/ 25 confirmed/);
assert.match(progressHtml, /0 delivered/);

csvApi.state.health.messaging = { defaultCountryCode: '502', whatsapp: { configured: false, provider: 'Brevo WhatsApp', missing: ['BREVO_WHATSAPP_SENDER_NUMBER'] }, sms: { configured: true, provider: 'Brevo Transactional SMS', sender: 'Gazelle', missing: [] } };
csvApi.state.lists = [{ id: 'list-care', name: 'Customer Care', company_name: 'Allied Global', member_count: 25 }];
csvApi.state.journeys = [{
  id: 'journey-1', name: 'Email WhatsApp SMS', status: 'active', list_id: 'list-care', list_name: 'Customer Care', company_name: 'Allied Global',
  test_name_en: 'Tenure Potential', enrollment_count: 25, queued_event_count: 50, accepted_event_count: 20, failed_event_count: 1,
  completed_count: 3, skipped_event_count: 6,
  steps: [{ channel: 'email', delay_minutes: 0 }, { channel: 'whatsapp', delay_minutes: 180 }, { channel: 'sms', delay_minutes: 2880 }],
}];
const journeyHtml = csvApi.renderContactability();
assert.match(journeyHtml, /Contactability journeys/);
assert.match(journeyHtml, /WhatsApp/);
assert.match(journeyHtml, /BREVO_WHATSAPP_SENDER_NUMBER/);
assert.match(journeyHtml, /Enroll list/);
assert.match(journeyHtml, /Stop reminders/);
assert.match(journeyHtml, /No more reminders after completed test/);
assert.match(journeyHtml, /6 skipped/);
assert.match(appSource, /\/api\/journeys/);
assert.match(appSource, /flow-canvas/);
assert.match(appSource, /journey-step-card/);
assert.match(serverSource, /UPDATE contact_journey_events[\s\S]+assessment_completed/);

csvApi.state.directSendReceipt = { invitationId: 'invite-direct', providerMessageId: 'message-direct', transport: 'api', status: 'accepted', candidateName: 'Direct Candidate', candidateEmail: 'direct@example.com', locale: 'es', testId: 'test_tenure_potential', submittedAt: '2026-07-22T14:49:40.427Z' };
csvApi.state.candidates = [{ id: 'candidate-direct', invitation_id: 'invite-direct', invitation_status: 'delivered' }];
const directSendHtml = csvApi.renderSend();
assert.match(directSendHtml, /Invitation submitted/);
assert.match(directSendHtml, /Brevo confirmed delivery/);
assert.match(directSendHtml, /Direct sends are tracked on the candidate record and do not appear in the batch table/);
assert.match(directSendHtml, /API ready/);
assert.match(directSendHtml, /Brevo Transactional API/);
assert.match(directSendHtml, /No ChatGPT account required/);

csvApi.state.user = { id: 'owner-1', role: 'super_admin', companyName: 'Gazelle Platform' };
csvApi.state.lists = [{ id: 'list-care', name: 'Customer Care' }, { id: 'list-sales', name: 'Sales Pipeline' }];
csvApi.state.results = [
  { assessment_id: 'assessment-care', id: 'candidate-care', name: 'Ana Care', email: 'ana@example.com', role: 'Customer Care', company_id: 'company-a', company_name: 'Allied Global', owner_user_id: 'owner-1', assessment_test_id: 'test_tenure_potential', assessment_test_name_en: 'Tenure Potential', assessment_test_name_es: 'Potencial de Permanencia', candidate_list_ids: ['list-care'], potential_index: 82 },
  { assessment_id: 'assessment-sales', id: 'candidate-sales', name: 'Luis Sales', email: 'luis@example.com', role: 'Sales', company_id: 'company-b', company_name: 'Gazelle Sales', owner_user_id: 'owner-2', assessment_test_id: 'test_sales', assessment_test_name_en: 'Sales Judgment', assessment_test_name_es: 'Criterio Comercial', candidate_list_ids: ['list-sales'], potential_index: 74 },
];
csvApi.state.reportSearch = 'sales';
assert.equal(csvApi.filteredReportResults().length, 1);
assert.equal(csvApi.filteredReportResults()[0].assessment_id, 'assessment-sales');
const excel = csvApi.buildExcelWorkbook(csvApi.filteredReportResults(), 'en');
assert.match(excel, /Excel\.Sheet/);
assert.match(excel, /Luis Sales/);
assert.doesNotMatch(excel, /Ana Care/);
assert.match(excel, /Tenure Potential/);
csvApi.state.reportSearch = '';
csvApi.state.reportTestId = 'test_tenure_potential';
assert.equal(csvApi.filteredReportResults()[0].assessment_id, 'assessment-care');
csvApi.state.reportTestId = 'all';
csvApi.state.reportListId = 'list-sales';
assert.equal(csvApi.filteredReportResults()[0].assessment_id, 'assessment-sales');
csvApi.state.reportListId = 'all';
csvApi.state.reportLocale = 'es';
const spanishDirectory = csvApi.renderResultDirectory(csvApi.state.results, csvApi.reportUiCopy());
assert.match(spanishDirectory, /Buscar resultados/);
assert.match(spanishDirectory, /Todas las listas/);
assert.match(csvApi.reportUiCopy().auditTab, /Auditoría de puntuación/);
assert.match(csvApi.renderMethod(), /Plan de validación antes de realizar afirmaciones predictivas/);
assert.match(csvApi.renderAudit({ auditHash: 'a'.repeat(64), assessmentVersion: '2.0', modelVersion: '2.0', locale: 'es', experienceBranch: 'experienced', durationMs: 600000, completedAt: new Date().toISOString(), scoringTrace: [], quality: { status: 'pilot_usable', flags: [] }, aiAnalysis: null, scenarioResponses: [] }), /Huella criptográfica del resultado/);
const recruiterReadableHtml = csvApi.renderReport({
  name: 'Candidate Example', role: 'Customer Care', completedAt: new Date().toISOString(),
  potentialIndex: 70, potentialBand: 'conditional', quality: { status: 'pilot_usable' },
  subscales: { fit: { score: 70 }, intent: { score: 65 }, reliability: { score: 75 }, context: { score: 60 } },
  supportProfile: [], scenarioResponses: [],
  aiAnalysis: {
    status: 'completed', provider: 'OpenAI', model: 'gpt-4.1-mini', prompt_version: 'analysis-v2.1.0',
    output: {
      es: {
        title: 'Análisis integrado',
        executive_summary: 'Resumen claro.',
        paragraphs: [
          'Las salvedades son la intención media (intent_six_months, intent_path), y solicita coaching y voz (support_coach, support_voice).',
          'La evidencia debe confirmarse en entrevista.', 'La respuesta muestra una primera acción.', 'La supervisión debe aclarar expectativas.', 'La entrevista debe confirmar las condiciones.',
        ],
        observed_strengths: ['Primera acción específica', 'Comunicación directa'],
        watch_areas: ['Confirmar el horario', 'Confirmar interés de permanencia'],
        interview_focus: ['¿Qué horario puedes sostener?', '¿Cómo pedirías ayuda?', '¿Qué esperas de la capacitación?'],
        support_actions: ['Aclarar expectativas', 'Asignar un instructor', 'Programar retroalimentación'],
      },
    },
  },
});
assert.match(recruiterReadableHtml, /Los puntos que conviene confirmar/);
assert.match(recruiterReadableHtml, /Ajuste al puesto e interés de permanencia/);
assert.doesNotMatch(recruiterReadableHtml, /intent_six_months|intent_path|support_coach|support_voice|coaching y voz/);
csvApi.state.reportLocale = 'en';

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

assert.match(indexSource, /styles\.css\?v=20260826\.2/);
assert.match(indexSource, /app\.js\?v=20260826\.2/);
assert.match(indexSource, /candidate-portal\.js\?v=20260826\.2/);
assert.match(indexSource, /assessment-engine\.js\?v=20260826\.2/);
assert.match(indexSource, /ai-assessment\.js\?v=20260826\.2/);
assert.match(indexSource, /pdf-report\.js\?v=20260826\.2/);
assert.match(serverSource, /\/candidate\?invite=/);
assert.match(serverSource, /candidatePortalData/);
assert.match(serverSource, /candidate_attempts_released/);
assert.match(serverSource, /bulk_resend_queued/);
assert.match(serverSource, /\/api\/invitations\/resend-bulk/);
assert.match(serverSource, /A bulk resend can contain at most 500 candidates/);
assert.match(serverSource, /\/api\/assessment\/scenarios/);
assert.match(serverSource, /aiAnalysisMatch/);
assert.match(serverSource, /ai-analysis/);
assert.match(serverSource, /candidateContactMatch/);
assert.match(serverSource, /recoverAsyncWork/);
assert.match(appSource, /Export Excel/);
assert.match(serverSource, /scenarioId: GazelleAiAssessment\.stableScenarioId\(row\.question_order\)/);
assert.match(serverSource, /database_scenario_id: scenario\.scenario_id/);
assert.match(serverSource, /initialAiStatus = ai\.configured \? 'not_generated'/);
assert.match(buildSource, /dist\/\.openai\/hosting\.json/);
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
assert.match(appSource, /Role alignment: 1–5 interpretation/);
assert.match(appSource, /Ajuste al puesto: lectura de 1 a 5/);
assert.match(appSource, /Questions ready to ask|Interview questions ready to ask/);
assert.match(appSource, /Preguntas listas para la entrevista/);
assert.doesNotMatch(appSource, /Uncalibrated pilot|Piloto sin calibrar|Human review required/);
assert.doesNotMatch(appSource, /Preview mode does not send responses to OpenAI/);
assert.doesNotMatch(appSource, /signin-with-chatgpt/);
assert.match(appSource, /SMTP relay with STARTTLS/);
assert.match(appSource, /Check Brevo activity/);
assert.match(appSource, /Check Brevo delivery/);
assert.match(appSource, /API acceptance is not inbox delivery/);
assert.match(appSource, /Forgot password\?/);
assert.match(appSource, /data-reset-user/);
assert.match(appSource, /data-save-user/);
assert.match(serverSource, /recentEvents/);
assert.match(serverSource, /senderRecord/);
assert.match(serverSource, /domainRecord/);
assert.match(serverSource, /email-delivery\\\/check/);

for (const route of [
  '/api/auth/signup', '/api/auth/login', '/api/auth/logout', '/api/auth/me',
  '/api/auth/password-reset/request', '/api/auth/password-reset/confirm',
  '/api/tests', '/api/lists', '/api/batches', '/api/results', '/api/admin/users',
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

for (const variable of ['AI_PROVIDER', 'GEMINI_API_KEY', 'GEMINI_MODEL']) {
  assert.match(serverSource, new RegExp(variable));
  assert.match(readmeSource, new RegExp(variable));
}

assert.match(serverSource, /generativelanguage\.googleapis\.com/);
assert.match(serverSource, /responseJsonSchema/);
assert.match(serverSource, /job_alignment/);

assert.match(readmeSource, /bilingual candidate portal/);
assert.match(readmeSource, /Cloudflare Worker backed by D1/);
assert.match(readmeSource, /Candidates do not need ChatGPT/);
assert.match(readmeSource, /1–5 Job Alignment Evidence Rating/);

console.log('Workflow tests passed.');
