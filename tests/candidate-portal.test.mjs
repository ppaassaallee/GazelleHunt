import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../candidate-portal.js', import.meta.url), 'utf8');
const serverSource = fs.readFileSync(new URL('../server-worker.js', import.meta.url), 'utf8');
const appElement = { innerHTML: '' };
let storedLocale = null;
const portalPayload = {
  account: null,
  accountExists: false,
  googleConfigured: false,
  suggestedLocale: 'en',
  access: { source: 'invitation', candidateId: 'candidate-1', invitationId: 'invite-1' },
  referrals: [],
  applications: [{
    id: 'candidate-1', name: 'Jordan Example', email: 'jordan@example.com', role: 'Customer Care',
    candidate_brand_name: 'Allied Global', referral_bonus_cents: 10000, current_stage_name_en: 'Assessment',
    current_stage_name_es: 'Evaluación', current_stage_order: 20, pipeline_updated_at: '2026-07-17T12:00:00.000Z',
    status_message_en: 'Your assessment is ready.', status_message_es: 'Tu evaluación está lista.',
    stages: [
      { id: 's1', stage_order: 10, name_en: 'Application received', name_es: 'Solicitud recibida' },
      { id: 's2', stage_order: 20, name_en: 'Assessment', name_es: 'Evaluación' },
      { id: 's3', stage_order: 30, name_en: 'Team review', name_es: 'Revisión del equipo' },
    ],
    communications: [],
    tests: [{ id: 'invite-1', name_en: 'Tenure Potential', name_es: 'Potencial de Permanencia', estimated_minutes: 15, status: 'accepted', attempts_remaining: 2, direct_access: true }],
  }],
};

const context = {
  console,
  URLSearchParams,
  Intl,
  document: {
    documentElement: { lang: 'en' },
    getElementById(id) { return id === 'app' ? appElement : null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  },
  location: { search: '?invite=portal-token', href: 'https://example.com/candidate?invite=portal-token', assign() {} },
  history: { replaceState() {} },
  localStorage: { getItem() { return storedLocale; }, setItem(_key, value) { storedLocale = value; } },
  sessionStorage: { setItem() {}, getItem() { return null; } },
  fetch: async () => ({ ok: true, status: 200, json: async () => portalPayload }),
};
context.globalThis = context;
vm.runInNewContext(source, context);
await context.GazelleCandidatePortal.start();

assert.match(appElement.innerHTML, /Welcome to Allied Global/);
assert.match(appElement.innerHTML, /quiet place/);
assert.match(appElement.innerHTML, /at least 10 minutes/i);
assert.match(appElement.innerHTML, /hiring progress/);
assert.match(appElement.innerHTML, /Refer someone and earn \$100/);
assert.match(source, /Nos alegra que estés aquí/);
assert.doesNotMatch(appElement.innerHTML, /potential_index|fit_score|AI analysis/i);

storedLocale = 'es';
await context.GazelleCandidatePortal.start();
assert.match(appElement.innerHTML, /Bienvenido a Allied Global/);
assert.match(appElement.innerHTML, /Lugar tranquilo/);
assert.match(appElement.innerHTML, /Al menos 10 minutos/);
assert.match(appElement.innerHTML, /Tu avance de contratación/);
assert.match(appElement.innerHTML, /Refiere a alguien y gana \$100/);
assert.doesNotMatch(appElement.innerHTML, /potential_index|fit_score|AI analysis/i);

for (const route of [
  '/api/candidate/portal', '/api/candidate/referrals', '/api/candidate/invitations/', '/assessment?invite=',
]) assert.match(source, new RegExp(route.replaceAll('/', '\\/').replace('?', '\\?')));
assert.match(source, /\/api\/candidate\/auth\/\$\{signup \? 'signup' : 'login'\}/);
assert.match(serverSource, /\/api\/candidate\/auth\/signup/);
assert.match(serverSource, /\/api\/candidate\/auth\/login/);
assert.match(serverSource, /candidateScope\(user\)/);
assert.match(serverSource, /user\.role !== 'admin'/);
assert.match(serverSource, /status <> 'failed'/);
assert.match(serverSource, /attempt_limit = attempt_limit \+ 3/);
assert.match(serverSource, /__Host-gz_candidate_session/);

console.log('Candidate portal tests passed.');
