const engine = globalThis.GazelleAssessmentEngine;
const aiAssessment = globalThis.GazelleAiAssessment;
const pdfReport = globalThis.GazellePdfReport;
const AI_ACTIVE_STATUSES = new Set(['queued', 'processing']);
const AI_STALE_AFTER_MS = 3 * 60 * 1000;
let aiRefreshTimer = null;

const icons = {
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 7L2 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.12.6.63 1 1.24 1H21v4h-.36c-.61 0-1.12.4-1.24 1Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 4-7"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 12h20"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  headphones: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M18 19c0 1.7-1.3 3-3 3h-3"/><path d="M4 14v4a2 2 0 0 0 2 2h1v-8H6a2 2 0 0 0-2 2ZM20 14v4a2 2 0 0 1-2 2h-1v-8h1a2 2 0 0 1 2 2Z"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0 2 5.3"/><path d="M20 4v7h-7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  building: '<path d="M3 21h18M6 21V4h12v17M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/>',
  logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m11 12 9-9M15 8l3 3M17 6l3 3"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8C5 8 4 4 6.5 4 9 4 12 8 12 8M16.5 8C19 8 20 4 17.5 4 15 4 12 8 12 8"/>',
};

const baseNavItems = [
  ['home', 'Overview', 'home'], ['tests', 'Test catalog', 'layers'], ['lists', 'Candidate lists', 'list'],
  ['candidates', 'Candidates', 'users'], ['import', 'Import CSV', 'upload'], ['send', 'Direct send', 'send'],
  ['progress', 'Send progress', 'clock'], ['referrals', 'Referrals', 'gift'], ['reports', 'Results & Reports', 'file'], ['settings', 'Settings', 'settings'],
];

function navItems() {
  return state.user?.role === 'super_admin' ? [...baseNavItems.slice(0, -1), ['team', 'Users & companies', 'building'], baseNavItems.at(-1)] : baseNavItems;
}

const state = {
  view: 'home', reportTab: 'report', reportLocale: 'en', candidates: [], results: [], filteredStatus: 'All', search: '',
  health: {
    database: false, publicBaseUrl: '',
    email: { configured: false, sendingConfigured: false, webhookConfigured: false, provider: 'Brevo', senderEmail: null, senderName: 'Gazelle Assessment' },
    ai: { configured: false, provider: 'OpenAI', providerKey: 'openai', model: 'gpt-5-mini' },
  },
  loading: true, busy: false, error: '', adminAuthenticated: null, user: null, authMode: 'login', accountPending: false,
  bootstrap: { ownerSetupRequired: false, ownerEmail: 'david.alejandro.pa@gmail.com' },
  tests: [], lists: [], batches: [], users: [], companies: [], selectedListId: null,
  stages: [], referrals: [], journeyCandidateId: null,
  selectedCandidateIds: [], bulkResendTestId: null, bulkResendLocale: 'previous',
  csv: null, reportResultId: null, reportSearch: '', reportTestId: 'all', reportScope: 'all', reportRole: 'all', reportListId: 'all', previewReport: null, runner: null,
  directSendReceipt: null,
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

function initials(name = '') { return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'TP'; }
function formatDate(value, locale = 'en') { return value ? new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'; }
function formatDuration(ms) { const seconds = Math.round(Number(ms || 0) / 1000); return seconds ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : '—'; }

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'The request could not be completed.');
    error.code = body.code;
    error.status = response.status;
    throw error;
  }
  return body;
}

async function loadWorkspace() {
  state.loading = true;
  render();
  try {
    const auth = await fetchJson('/api/auth/me');
    state.user = auth.user;
    state.adminAuthenticated = true;
    const requests = [fetchJson('/api/health'), fetchJson('/api/candidates'), fetchJson('/api/results'), fetchJson('/api/tests'), fetchJson('/api/lists'), fetchJson('/api/batches'), fetchJson('/api/stages'), fetchJson('/api/referrals')];
    if (state.user.role === 'super_admin') requests.push(fetchJson('/api/admin/users'));
    const [health, candidates, results, tests, lists, batches, stages, referrals, team] = await Promise.all(requests);
    state.health = health;
    state.candidates = candidates.candidates || [];
    state.results = results.results || [];
    state.tests = tests.tests || [];
    state.lists = lists.lists || [];
    state.batches = batches.batches || [];
    state.stages = stages.stages || [];
    state.referrals = referrals.referrals || [];
    const visibleCandidateIds = new Set(state.candidates.map((candidate) => candidate.id));
    state.selectedCandidateIds = state.selectedCandidateIds.filter((id) => visibleCandidateIds.has(id));
    if (!state.bulkResendTestId) state.bulkResendTestId = state.tests.find((test) => test.status === 'active' && test.engine_key === 'tenure_potential')?.id || null;
    state.users = team?.users || [];
    state.companies = team?.companies || [];
    if (!state.selectedListId && state.lists.length) state.selectedListId = state.lists[0].id;
    if (!state.results.some((result) => result.assessment_id === state.reportResultId)) state.reportResultId = state.results[0]?.assessment_id || null;
    state.error = '';
  } catch (error) {
    if (error.status === 401) {
      state.adminAuthenticated = false;
      state.user = null;
      state.error = '';
      try { state.bootstrap = await fetchJson('/api/auth/bootstrap-status'); } catch { /* Render normal sign-in if status cannot load. */ }
    } else {
      state.error = error.message;
    }
  } finally {
    state.loading = false;
    render();
  }
}

function toast(message) {
  const region = document.getElementById('toast-region');
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  region.appendChild(element);
  setTimeout(() => element.remove(), 3800);
}

function statusBadge(status) {
  const value = status || 'Not invited';
  const labels = {
    api_accepted: 'API accepted', api_accepted_with_errors: 'API accepted with errors',
    provider_unconfirmed: 'Brevo unconfirmed', provider_confirmed: 'Brevo confirmed',
    provider_confirmed_with_errors: 'Brevo confirmed with errors', partially_confirmed: 'Partially confirmed',
    delivered_with_errors: 'Delivered with errors', smtp_ready: 'SMTP ready',
  };
  const tone = ['completed', 'delivered', 'active', 'smtp_ready'].includes(value) ? 'teal' : ['failed', 'hard_bounce', 'invalid_email', 'blocked', 'complained', 'error', 'rejected', 'suspended'].includes(value) ? 'red' : ['accepted', 'sending', 'deferred', 'pending', 'processing', 'api_accepted', 'api_accepted_with_errors', 'provider_unconfirmed', 'provider_confirmed', 'provider_confirmed_with_errors', 'partially_confirmed', 'delivered_with_errors'].includes(value) ? 'orange' : 'neutral';
  return `<span class="badge badge-${tone}">${esc(labels[value] || value.replaceAll('_', ' '))}</span>`;
}

function shell(content) {
  const items = navItems();
  const current = items.find(([id]) => id === state.view) || items[0];
  const user = state.user || {};
  return `<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark">G</div><div><strong>Gazelle Assessment</strong><span>Multi-test platform</span></div></div><nav class="nav" aria-label="Main navigation">${items.map(([id, label, iconName]) => `<button class="nav-button ${state.view === id ? 'active' : ''}" data-nav="${id}">${icon(iconName)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-footer"><div class="workspace"><div class="avatar">${initials(user.name)}</div><div><strong>${esc(user.name || '')}</strong><span>${esc(user.companyName || 'Platform')} · ${esc((user.role || '').replace('_', ' '))}</span></div></div><button class="button button-quiet sidebar-signout" data-action="logout">${icon('logout')}Sign out</button></div></aside><main class="main"><header class="topbar"><div class="topbar-left"><button class="button button-secondary icon-button mobile-menu" id="mobile-menu" aria-label="Open navigation">${icon('menu')}</button><div><h1>${current[1]}</h1><p>${esc(user.companyName || 'Gazelle Platform')} · Role-based workspace</p></div></div><div class="top-actions"><span class="badge badge-${state.health.database ? 'teal' : 'orange'}">${state.health.database ? 'Audit database active' : 'Database unavailable'}</span><button class="button button-secondary icon-button" data-action="reload" aria-label="Refresh">${icon('refresh')}</button></div></header><div class="page">${state.error ? `<div class="notice notice-error">${esc(state.error)}</div>` : ''}${content}</div></main></div>${state.runner ? renderRunner() : ''}${state.journeyCandidateId ? renderJourneyModal() : ''}`;
}

function adminSignInPage() {
  if (state.accountPending) return `<main class="auth-app"><section class="auth-panel auth-message">${icon('clock')}<p class="eyebrow">Registration received</p><h1>Awaiting approval</h1><p>Alejandro Pascual will review your company and assign your recruiter or administrator role. Return here and sign in after approval.</p><button class="button button-primary" data-auth-mode="login">Back to sign in</button></section></main>`;
  const setup = state.authMode === 'setup';
  const signup = state.authMode === 'signup';
  const title = setup ? 'Activate super administrator' : signup ? 'Create your account' : 'Sign in to Gazelle';
  const subtitle = setup ? 'Reserved for Alejandro Pascual. This activation can be completed only once.' : signup ? 'Your account remains pending until Alejandro approves it.' : 'Access candidates, lists, tests, sends, and reports for your role.';
  return `<main class="auth-app"><section class="auth-brand"><div class="brand-mark">G</div><p class="eyebrow">Gazelle Assessment</p><h1>One platform for structured candidate assessments.</h1><p>Run bilingual tests, organize candidates into reusable lists, send batches, and keep every result auditable.</p><div class="auth-proof"><span>${icon('shield')}Server-enforced company access</span><span>${icon('list')}Lists and multi-test batches</span><span>${icon('file')}Bilingual PDF reports</span></div></section><section class="auth-panel"><div><p class="eyebrow">Secure account access</p><h2>${title}</h2><p>${subtitle}</p></div><form id="auth-form" class="auth-form" data-mode="${state.authMode}"><label class="field"><span>Email</span><input class="input" id="auth-email" type="email" autocomplete="email" required value="${setup ? esc(state.bootstrap.ownerEmail) : ''}" ${setup ? 'readonly' : ''}></label>${state.authMode !== 'login' ? `<label class="field"><span>Full name</span><input class="input" id="auth-name" autocomplete="name" required></label>` : ''}${signup ? `<label class="field"><span>Company</span><input class="input" id="auth-company" autocomplete="organization" required></label>` : ''}<label class="field"><span>Password</span><input class="input" id="auth-password" type="password" autocomplete="${state.authMode === 'login' ? 'current-password' : 'new-password'}" minlength="12" maxlength="128" required></label>${setup ? `<label class="field"><span>Owner activation key</span><input class="input" id="auth-bootstrap" type="password" autocomplete="one-time-code" required></label>` : ''}${state.error ? `<div class="notice notice-error">${esc(state.error)}</div>` : ''}<button class="button button-primary auth-submit" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Please wait…' : setup ? 'Activate account' : signup ? 'Request access' : 'Sign in'}</button></form><div class="auth-switch">${state.authMode !== 'login' ? '<button data-auth-mode="login">Already have an account? Sign in</button>' : '<button data-auth-mode="signup">Create an account</button>'}${state.bootstrap.ownerSetupRequired && state.authMode !== 'setup' ? '<button data-auth-mode="setup">Alejandro: activate owner account</button>' : ''}</div><p class="auth-security">Passwords are never stored in plain text. Sessions use secure, HTTP-only cookies.</p></section></main>`;
}

function pageIntro(kicker, title, description, action = '') {
  return `<div class="page-intro"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function metric(label, value, note, iconName) {
  return `<article class="card metric"><div class="metric-top"><span>${label}</span>${icon(iconName)}</div><strong>${value}</strong><small>${note}</small></article>`;
}

function renderHome() {
  const completed = state.candidates.filter((candidate) => candidate.assessment_id).length;
  const activeBatches = state.batches.filter((batch) => ['queued', 'processing'].includes(batch.status)).length;
  const pendingUsers = state.users.filter((user) => user.status === 'pending').length;
  return `<div class="stack"><section class="workflow-hero"><div><span class="badge badge-teal">${esc(state.user?.companyName || 'Gazelle Platform')}</span><h2>Build a list, assign tests, and send one auditable batch.</h2><p>Candidate lists are the operating unit. A candidate can belong to multiple lists, and each list can carry one or more tests as the catalog grows.</p><div class="mission-actions"><button class="button button-primary" data-nav="lists">${icon('list')}Create or open a list</button><button class="button button-secondary" data-nav="tests">${icon('layers')}Browse test catalog</button></div></div><div class="workflow-steps"><div><span>1</span><strong>List</strong><small>Define the hiring cohort</small></div><div><span>2</span><strong>Tests</strong><small>Select the assessment set</small></div><div><span>3</span><strong>Batch</strong><small>Send and monitor delivery</small></div></div></section>
    <section class="grid grid-4">${metric('Candidate lists', state.lists.length, 'Reusable cohorts', 'list')}${metric('Available tests', state.tests.filter((test) => test.status === 'active').length, 'Extensible catalog', 'layers')}${metric('Audited results', completed, 'Scoped to your role', 'shield')}${metric('Active batches', activeBatches, 'Queued or processing', 'send')}</section>
    ${pendingUsers ? `<button class="pending-strip" data-nav="team">${icon('users')}<span><strong>${pendingUsers} account${pendingUsers === 1 ? '' : 's'} awaiting approval</strong><small>Assign a company and role before access is granted.</small></span></button>` : ''}
    <section><div class="section-title"><div><h3>Test catalog</h3><p>The platform is multi-test; only validated executable engines can be sent.</p></div><button class="button button-secondary" data-nav="tests">View all</button></div><div class="grid grid-3">${state.tests.slice(0, 3).map(testCatalogCard).join('') || '<div class="empty-panel"><h3>No tests available</h3></div>'}</div></section>
    <section class="grid grid-2"><article class="card"><div class="card-header"><div><h3>Tenure Potential boundaries</h3><p>The first executable assessment remains transparent.</p></div></div><div class="card-body guardrail-list">${guardrail('No retention probability', 'The questionnaire index does not claim a 90-day or 180-day probability.', 'Locked')}${guardrail('Separate evidence outputs', 'The 1–5 AI alignment rating and narrative do not alter the questionnaire index.', 'Auditable')}${guardrail('No automatic decision', 'No automatic hire, reject, pass, fail, or ranking action is produced.', 'Locked')}</div></article><article class="card"><div class="card-header"><div><h3>Access scope</h3><p>Visibility is enforced on the server.</p></div>${icon('shield')}</div><div class="card-body stack"><div class="scope-line"><strong>${esc((state.user?.role || '').replace('_', ' '))}</strong><span>${state.user?.role === 'recruiter' ? 'Your candidates and lists only' : state.user?.role === 'admin' ? 'All candidates and lists in your company' : 'All companies, users, candidates, and lists'}</span></div><div class="scope-line"><strong>Company</strong><span>${esc(state.user?.companyName || 'All companies')}</span></div><div class="scope-line"><strong>Email</strong><span>${state.health.email?.configured ? 'Brevo connected' : 'Brevo configuration required before sending'}</span></div></div></article></section></div>`;
}

function testCatalogCard(test) {
  const active = test.status === 'active' && test.engine_key === 'tenure_potential';
  return `<article class="card test-catalog-card"><div class="test-code"><code>${esc(test.code)}</code><span class="badge badge-${active ? 'teal' : 'neutral'}">${esc(test.status)}</span></div><h3>${esc(test.name_en)}</h3><p class="test-es">${esc(test.name_es)}</p><p>${esc(test.description_en)}</p><div class="test-meta"><span>${Number(test.estimated_minutes)} min</span><span>${Number(test.item_count)} items</span><span>v${esc(test.version)}</span></div>${active ? `<button class="button button-secondary" data-action="preview">${icon('file')}Preview</button>` : '<span class="draft-note">Catalog entry only. Engine not yet released.</span>'}</article>`;
}

function dimensionCard(title, weight, text) { return `<article class="card dimension-card"><div class="dimension-head"><h3>${title}</h3><span>${weight}</span></div><p>${text}</p></article>`; }
function guardrail(title, text, badge) { return `<div class="guardrail"><div><strong>${title}</strong><span>${text}</span></div><span class="badge badge-orange">${badge}</span></div>`; }

function renderTests() {
  const active = state.tests.filter((test) => test.status === 'active').length;
  const create = state.user?.role === 'super_admin' ? `<section class="card"><div class="card-header"><div><h3>Add a future test</h3><p>New entries start as drafts. A catalog entry cannot be sent until its scoring engine and validation package are implemented.</p></div>${icon('plus')}</div><form class="card-body form-grid" id="test-form"><label class="field"><span>English name</span><input class="input" id="test-name-en" required></label><label class="field"><span>Spanish name</span><input class="input" id="test-name-es" required></label><label class="field"><span>Slug</span><input class="input" id="test-slug" placeholder="customer-service-judgment" required></label><label class="field"><span>Estimated minutes</span><input class="input" id="test-minutes" type="number" min="1" max="180" value="15"></label><label class="field form-wide"><span>English description</span><textarea class="textarea" id="test-description-en" required></textarea></label><label class="field form-wide"><span>Spanish description</span><textarea class="textarea" id="test-description-es" required></textarea></label><div class="form-span"><button class="button button-primary" type="submit">${icon('plus')}Create draft</button></div></form></section>` : '';
  return `<div class="stack">${pageIntro('Multi-test architecture', 'Test catalog', 'Tests are versioned entities. Active means the assessment has an executable engine; draft means design work remains.', `<span class="badge badge-teal">${active} active</span>`)}<section class="grid grid-3">${state.tests.map(testCatalogCard).join('')}</section>${create}</div>`;
}

function renderLists() {
  const selected = state.lists.find((list) => list.id === state.selectedListId) || state.lists[0];
  const companyCandidates = selected ? state.candidates.filter((candidate) => candidate.company_id === selected.company_id) : [];
  const activeTests = state.tests.filter((test) => test.status === 'active');
  const companyChoice = state.user?.role === 'super_admin' ? `<label class="field"><span>Company</span><select class="select" id="list-company">${state.companies.map((company) => `<option value="${company.id}">${esc(company.name)}</option>`).join('')}</select></label>` : '';
  const editor = selected ? `<section class="list-editor"><div class="list-editor-head"><div><p class="eyebrow">${esc(selected.company_name)}</p><h3>${esc(selected.name)}</h3><p>${esc(selected.description || 'No description')}</p></div><span class="badge badge-neutral">${Number(selected.member_count)} candidates · ${Number(selected.test_count)} tests</span></div><form id="list-editor-form"><div class="list-editor-grid"><div class="selection-panel"><div class="selection-title"><div><h4>Candidates</h4><p>A candidate can belong to multiple lists.</p></div><span>${companyCandidates.length} available</span></div><div class="check-list">${companyCandidates.map((candidate) => `<label><input type="checkbox" name="list-candidate" value="${candidate.id}" ${selected.member_ids.includes(candidate.id) ? 'checked' : ''}><span><strong>${esc(candidate.name)}</strong><small>${esc(candidate.role)} · ${esc(candidate.email)}</small></span></label>`).join('') || '<p class="empty-value">No visible candidates in this company.</p>'}</div></div><div class="selection-panel"><div class="selection-title"><div><h4>Tests</h4><p>Select one or more active tests for this list.</p></div><span>${activeTests.length} active</span></div><div class="check-list">${activeTests.map((test) => `<label><input type="checkbox" name="list-test" value="${test.id}" ${selected.test_ids.includes(test.id) ? 'checked' : ''}><span><strong>${esc(test.name_en)}</strong><small>${esc(test.name_es)} · ${Number(test.estimated_minutes)} min</small></span></label>`).join('')}</div></div></div><div class="list-actions"><button class="button button-secondary" type="submit">${icon('check')}Save list</button><label class="compact-select"><span>Email language</span><select class="select" id="batch-locale"><option value="en">English</option><option value="es">Español</option></select></label><button class="button button-primary" type="button" data-batch-list="${selected.id}" ${!state.health.email?.configured || !Number(selected.member_count) || !Number(selected.test_count) || state.busy ? 'disabled' : ''}>${icon('send')}Send selected tests</button></div>${!state.health.email?.configured ? '<p class="field-help list-help">Connect Brevo before starting a batch.</p>' : ''}</form></section>` : `<div class="empty-panel"><h3>Create the first candidate list</h3><p>Lists connect candidates, tests, and batch delivery.</p></div>`;
  return `<div class="stack">${pageIntro('Core workflow', 'Candidate lists', 'Create reusable cohorts, assign multiple tests, and send the full matrix as a tracked batch.', '')}<div class="lists-layout"><aside class="lists-rail"><form class="card card-body list-create" id="list-form"><h3>New list</h3><label class="field"><span>Name</span><input class="input" id="list-name" required placeholder="July customer care cohort"></label><label class="field"><span>Description</span><textarea class="textarea" id="list-description" maxlength="500"></textarea></label>${companyChoice}<button class="button button-primary" type="submit">${icon('plus')}Create list</button></form><div class="list-nav">${state.lists.map((list) => `<button class="list-nav-item ${selected?.id === list.id ? 'active' : ''}" data-list-id="${list.id}"><span><strong>${esc(list.name)}</strong><small>${esc(list.company_name)} · ${Number(list.member_count)} candidates</small></span><span>${Number(list.test_count)}</span></button>`).join('')}</div></aside>${editor}</div></div>`;
}

function renderTeam() {
  if (state.user?.role !== 'super_admin') return '<div class="notice notice-error">Super administrator access is required.</div>';
  const pending = state.users.filter((user) => user.status === 'pending');
  const active = state.users.filter((user) => user.status !== 'pending');
  const companyOptions = state.companies.map((company) => `<option value="${company.id}">${esc(company.name)}</option>`).join('');
  return `<div class="stack">${pageIntro('Platform control', 'Users & companies', 'Only Alejandro Pascual can approve accounts and assign recruiter or company administrator roles.', `<span class="badge badge-${pending.length ? 'orange' : 'teal'}">${pending.length} pending</span>`)}<section class="card"><div class="card-header"><div><h3>Approval queue</h3><p>Confirm company and minimum required role before activation.</p></div></div>${pending.length ? `<div class="approval-list">${pending.map((user) => `<article class="approval-row"><div class="person"><div class="person-avatar">${initials(user.name)}</div><div><strong>${esc(user.name)}</strong><span>${esc(user.email)} · requested ${esc(user.requested_company_name || 'no company')}</span></div></div><select class="select" id="approve-role-${user.id}"><option value="recruiter">Recruiter</option><option value="admin">Company admin</option></select><select class="select" id="approve-company-${user.id}"><option value="">Create/use company below</option>${companyOptions}</select><input class="input" id="approve-company-name-${user.id}" value="${esc(user.requested_company_name || '')}" placeholder="Company name"><div class="approval-actions"><button class="button button-primary" data-approve-user="${user.id}">Approve</button><button class="button button-secondary" data-reject-user="${user.id}">Reject</button></div></article>`).join('')}</div>` : '<div class="empty-panel"><h3>No accounts awaiting approval</h3><p>New public registrations will appear here.</p></div>'}</section><section class="card"><div class="card-header"><div><h3>Platform accounts</h3><p>One super administrator; all other accounts are company scoped.</p></div><span class="badge badge-neutral">${active.length} accounts</span></div><div class="table-scroll"><table><thead><tr><th>User</th><th>Company</th><th>Role</th><th>Status</th><th>Last sign-in</th></tr></thead><tbody>${active.map((user) => `<tr><td><strong>${esc(user.name)}</strong><br><span class="empty-value">${esc(user.email)}</span></td><td>${esc(user.company_name || 'Platform')}</td><td>${esc(user.role.replace('_', ' '))}</td><td>${statusBadge(user.status)}</td><td>${formatDate(user.last_login_at)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}

function filteredCandidates() {
  return state.candidates.filter((candidate) => {
    const status = candidate.assessment_id ? 'Completed' : candidate.invitation_status || 'Not invited';
    const text = `${candidate.name} ${candidate.email} ${candidate.role} ${candidate.site || ''}`.toLowerCase();
    return text.includes(state.search.toLowerCase()) && (state.filteredStatus === 'All' || status.toLowerCase() === state.filteredStatus.toLowerCase());
  });
}

function renderCandidates() {
  const candidates = filteredCandidates();
  const scope = state.user?.role === 'recruiter' ? 'Candidates you own' : state.user?.role === 'admin' ? `All candidates at ${state.user.companyName}` : 'Candidates across every company';
  const activeTests = state.tests.filter((test) => test.status === 'active' && test.engine_key === 'tenure_potential');
  const selectedTestId = activeTests.some((test) => test.id === state.bulkResendTestId) ? state.bulkResendTestId : activeTests[0]?.id || '';
  const eligibleIds = new Set(candidates.filter((candidate) => bulkResendEligible(candidate, selectedTestId)).map((candidate) => candidate.id));
  const selectedIds = state.selectedCandidateIds.filter((id) => eligibleIds.has(id));
  const testOptions = activeTests.map((test) => `<option value="${test.id}" ${selectedTestId === test.id ? 'selected' : ''}>${esc(test.name_en)}</option>`).join('');
  const resendDisabled = !state.health.email?.configured || !selectedIds.length || !selectedTestId || state.busy;
  const resendHelp = !state.health.email?.configured ? '<p class="field-help">Connect Brevo in Settings before resending tests.</p>' : '<p class="field-help">Only candidates with a previous send and an available attempt can be selected.</p>';
  const bulkBar = `<div class="candidate-bulk-bar"><div class="bulk-selection"><strong>${selectedIds.length} selected</strong><span>${eligibleIds.size} eligible in this view</span></div><label class="compact-select"><span>Test</span><select class="select" id="bulk-resend-test">${testOptions}</select></label><label class="compact-select"><span>Email language</span><select class="select" id="bulk-resend-locale"><option value="previous" ${state.bulkResendLocale === 'previous' ? 'selected' : ''}>Previous language</option><option value="en" ${state.bulkResendLocale === 'en' ? 'selected' : ''}>English</option><option value="es" ${state.bulkResendLocale === 'es' ? 'selected' : ''}>Español</option></select></label><button class="button button-primary" data-action="bulk-resend" ${resendDisabled ? 'disabled' : ''}>${icon('send')}Resend to ${selectedIds.length}</button>${resendHelp}</div>`;
  return `${pageIntro('Role-scoped records', 'Candidates', `${scope}. Invitation and assessment states come from the audit database.`, `<button class="button button-primary" data-nav="import">${icon('plus')}Import candidates</button>`)}<section class="card"><div class="card-header"><div class="toolbar"><div class="search">${icon('search')}<input class="input" id="candidate-search" value="${esc(state.search)}" placeholder="Search candidates"></div><select class="select" id="candidate-status">${['All', 'Not invited', 'accepted', 'delivered', 'Completed', 'failed'].map((status) => `<option ${state.filteredStatus === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><span class="badge badge-neutral">${candidates.length} records</span></div>${bulkBar}${candidateTable(candidates, selectedTestId, selectedIds)}</section>`;
}

function bulkResendEligible(candidate, testId) {
  return Boolean(testId && candidate.invitation_test_id === testId && Number(candidate.attempts_remaining || 0) > 0);
}

function candidateTable(candidates, selectedTestId, selectedIds = []) {
  if (!candidates.length) return `<div class="empty-panel"><h3>No candidate records yet</h3><p>Import a CSV or send a real invitation to create the first durable record.</p></div>`;
  const eligibleCandidates = candidates.filter((candidate) => bulkResendEligible(candidate, selectedTestId));
  const selected = new Set(selectedIds);
  const allEligibleSelected = eligibleCandidates.length > 0 && eligibleCandidates.every((candidate) => selected.has(candidate.id));
  const rows = candidates.map((candidate) => {
    const eligible = bulkResendEligible(candidate, selectedTestId);
    const checked = selected.has(candidate.id);
    const reason = candidate.invitation_test_id !== selectedTestId ? 'No previous invitation for this test' : Number(candidate.attempts_remaining || 0) <= 0 ? 'No attempts remaining' : 'Select candidate';
    return `<tr class="${checked ? 'candidate-row-selected' : ''}"><td class="table-check"><input type="checkbox" class="candidate-resend-checkbox" value="${candidate.id}" aria-label="Select ${esc(candidate.name)}" title="${esc(reason)}" ${checked ? 'checked' : ''} ${eligible ? '' : 'disabled'}></td><td><div class="person"><div class="person-avatar">${initials(candidate.name)}</div><div><strong>${esc(candidate.name)}</strong><span>${esc(candidate.email)}</span></div></div></td><td><strong>${esc(candidate.role)}</strong><br><span class="empty-value">${esc(candidate.company_name || candidate.site || 'No company')}</span></td><td><span class="badge badge-neutral">${esc(candidate.current_stage_name_en || 'Application received')}</span><br><small class="attempt-note">${Number(candidate.attempts_used || 0)} / ${Number(candidate.attempt_limit || 3)} attempts</small></td><td>${statusBadge(candidate.invitation_status)}</td><td>${candidate.assessment_id ? `<span class="score-badge">${Number(candidate.potential_index).toFixed(1)} / 100</span>` : '<span class="empty-value">Not completed</span>'}</td><td><div class="row-actions"><button class="row-button" data-journey="${candidate.id}">Manage journey</button>${candidate.assessment_id ? `<button class="row-button" data-report="${candidate.id}">Open report</button>` : ''}</div></td></tr>`;
  }).join('');
  return `<div class="table-scroll"><table><thead><tr><th class="table-check"><input type="checkbox" id="candidate-select-visible" aria-label="Select all eligible visible candidates" ${allEligibleSelected ? 'checked' : ''} ${eligibleCandidates.length ? '' : 'disabled'}></th><th>Candidate</th><th>Role / company</th><th>Stage</th><th>Invitation</th><th>Assessment</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderJourneyModal() {
  const candidate = state.candidates.find((entry) => entry.id === state.journeyCandidateId);
  if (!candidate) return '';
  const stages = state.stages.filter((stage) => stage.company_id === candidate.company_id);
  const testId = candidate.invitation_test_id || state.tests.find((test) => test.status === 'active')?.id || '';
  const canRelease = ['admin', 'super_admin'].includes(state.user?.role);
  return `<div class="modal-backdrop journey-backdrop"><section class="modal journey-modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">Candidate journey</p><h2>${esc(candidate.name)}</h2><p>${esc(candidate.role)} · ${esc(candidate.email)}</p></div><button class="button button-secondary icon-button" data-close-journey aria-label="Close">${icon('x')}</button></div><div class="journey-summary"><div><span>Current stage</span><strong>${esc(candidate.current_stage_name_en || 'Application received')}</strong></div><div><span>Test attempts</span><strong>${Number(candidate.attempts_used || 0)} of ${Number(candidate.attempt_limit || 3)} used</strong></div><div><span>Candidate portal</span><strong>Active</strong></div></div><div class="modal-body journey-body"><section><div class="journey-section-title"><div><h3>Move application</h3><p>The candidate sees the selected stage and localized status message.</p></div>${icon('chart')}</div><form id="candidate-stage-form" class="form-grid"><label class="field form-wide"><span>Stage</span><select class="select" id="journey-stage" required>${stages.map((stage) => `<option value="${stage.id}" ${stage.id === candidate.current_stage_id ? 'selected' : ''}>${esc(stage.name_en)} · ${esc(stage.name_es)}</option>`).join('')}</select></label><label class="field"><span>Candidate message · English</span><textarea class="textarea" id="journey-stage-message-en" required>${esc(candidate.status_message_en || 'Your application is moving forward. We will share the next update here.')}</textarea></label><label class="field"><span>Mensaje al candidato · Español</span><textarea class="textarea" id="journey-stage-message-es" required>${esc(candidate.status_message_es || 'Tu solicitud sigue avanzando. Compartiremos la proxima actualizacion aqui.')}</textarea></label><div class="form-span"><button class="button button-primary" ${state.busy ? 'disabled' : ''}>${icon('check')}Update stage</button></div></form></section><section><div class="journey-section-title"><div><h3>Add a custom stage</h3><p>Stages are available to the recruitment team for this company.</p></div>${icon('plus')}</div><form id="candidate-stage-create-form" class="form-grid"><input type="hidden" id="journey-stage-company" value="${esc(candidate.company_id)}"><label class="field"><span>English name</span><input class="input" id="journey-stage-name-en" required maxlength="120"></label><label class="field"><span>Spanish name</span><input class="input" id="journey-stage-name-es" required maxlength="120"></label><div class="form-span"><button class="button button-secondary" ${state.busy ? 'disabled' : ''}>${icon('plus')}Add stage</button></div></form></section><section><div class="journey-section-title"><div><h3>Candidate communication</h3><p>Store a portal update and optionally send it through Brevo.</p></div>${icon('send')}</div><form id="candidate-communication-form" class="form-grid"><label class="field"><span>Subject · English</span><input class="input" id="journey-subject-en" maxlength="180" value="Update on your application"></label><label class="field"><span>Asunto · Español</span><input class="input" id="journey-subject-es" maxlength="180" value="Actualizacion sobre tu solicitud"></label><label class="field"><span>Message · English</span><textarea class="textarea" id="journey-message-en" required></textarea></label><label class="field"><span>Mensaje · Español</span><textarea class="textarea" id="journey-message-es" required></textarea></label><label class="consent form-wide"><input type="checkbox" id="journey-send-email" checked><span>Send the localized message by Brevo and store it in the candidate portal.</span></label><div class="form-span"><button class="button button-primary" ${state.busy ? 'disabled' : ''}>${icon('send')}Publish update</button></div></form></section><section><div class="journey-section-title"><div><h3>Assessment access</h3><p>Recruiters can resend within the released limit. Administrators release three more at a time.</p></div>${icon('refresh')}</div><input type="hidden" id="journey-test-id" value="${esc(testId)}"><div class="attempt-control"><div><strong>${Math.max(0, Number(candidate.attempt_limit || 3) - Number(candidate.attempts_used || 0))} attempts remaining</strong><span>Failed provider sends do not consume an attempt.</span></div><button class="button button-secondary" data-resend-test="${candidate.id}" ${!testId || state.busy || Number(candidate.attempts_remaining || 0) <= 0 ? 'disabled' : ''}>${icon('send')}Resend test</button>${canRelease ? `<button class="button button-primary" data-release-attempts="${candidate.id}" ${!testId || state.busy ? 'disabled' : ''}>${icon('plus')}Release 3 more</button>` : ''}</div></section></div></section></div>`;
}

function renderReferrals() {
  const totalValue = state.referrals.reduce((sum, referral) => sum + (referral.status === 'paid' ? Number(referral.bonus_cents || 0) : 0), 0);
  return `<div class="stack">${pageIntro('Candidate network', 'Referrals', 'Track candidate-submitted referrals and update the status visible in their portal.', `<span class="badge badge-teal">${state.referrals.length} referrals</span>`)}<section class="grid grid-3">${metric('Submitted', state.referrals.filter((item) => item.status === 'submitted').length, 'Awaiting review', 'gift')}${metric('Qualified', state.referrals.filter((item) => item.status === 'qualified').length, 'Eligible under program rules', 'check')}${metric('Paid rewards', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue / 100), 'Recorded as paid', 'shield')}</section><section class="card"><div class="table-scroll"><table><thead><tr><th>Referral</th><th>Referred by</th><th>Company</th><th>Reward</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${state.referrals.map((referral) => `<tr><td><strong>${esc(referral.name)}</strong><br><span class="empty-value">${esc(referral.email)}</span></td><td>${esc(referral.referrer_name)}<br><span class="empty-value">via ${esc(referral.source_candidate_name)}</span></td><td>${esc(referral.company_name)}</td><td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(referral.bonus_cents || 0) / 100)}</td><td><select class="select referral-status-select" data-referral-status="${referral.id}">${['submitted', 'reviewing', 'qualified', 'paid'].map((status) => `<option value="${status}" ${status === referral.status ? 'selected' : ''}>${status.replace('_', ' ')}</option>`).join('')}</select></td><td>${formatDate(referral.created_at)}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty-panel"><h3>No referrals yet</h3><p>Candidate referrals will appear here after submission.</p></div></td></tr>'}</tbody></table></div></section></div>`;
}

function parseCsv(text) {
  let source = String(text || '').replace(/^\uFEFF/, '');
  const separatorDeclaration = source.match(/^sep=(.)\s*(?:\r?\n|\r)/i);
  const declaredDelimiter = separatorDeclaration?.[1];
  if (separatorDeclaration) source = source.slice(separatorDeclaration[0].length);
  const firstLine = source.split(/\r?\n|\r/, 1)[0] || '';
  const delimiterCounts = [',', ';', '\t'].map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length - 1 }));
  const delimiter = declaredDelimiter || delimiterCounts.sort((left, right) => right.count - left.count)[0]?.delimiter || ',';
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) { row.push(field.trim()); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && source[index + 1] === '\n') index += 1; row.push(field.trim()); field = ''; if (row.some(Boolean)) rows.push(row); row = []; }
    else field += character;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return { headers: (rows[0] || []).map((header) => header.replace(/^\uFEFF/, '').trim()), rows: rows.slice(1).filter((entry) => entry.some(Boolean)), delimiter };
}

function guessedMapping(header) {
  const value = header.toLowerCase();
  if (value.includes('name') || value.includes('nombre')) return 'name';
  if (value.includes('mail') || value.includes('correo')) return 'email';
  if (value.includes('phone') || value.includes('mobile') || value.includes('tel') || value.includes('numero') || value.includes('número') || value.includes('celular')) return 'phone';
  if (value.includes('role') || value.includes('position') || value.includes('puesto') || value.includes('opening')) return 'role';
  if (value.includes('site') || value.includes('location') || value.includes('sede')) return 'site';
  return 'ignore';
}

function csvMappedCandidates(csv, defaultRole = '', defaultSite = '') {
  return csv.rows.map((row, rowIndex) => {
    const candidate = {};
    csv.mapping.forEach((target, index) => { if (target !== 'ignore') candidate[target] = String(row[index] || '').trim(); });
    candidate.role = candidate.role || defaultRole.trim();
    candidate.site = candidate.site || defaultSite.trim();
    const errors = [];
    if (!candidate.name) errors.push('name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email || '')) errors.push('valid email');
    if (!candidate.role) errors.push('role');
    return { candidate, rowNumber: rowIndex + 2, errors };
  });
}

function renderImport() {
  const csv = state.csv;
  const mappings = { name: 'Full name', email: 'Email', phone: 'Phone', role: 'Role', site: 'Site', ignore: 'Ignore column' };
  const mapped = csv ? csvMappedCandidates(csv, csv.defaultRole || '', csv.defaultSite || '') : [];
  const invalid = mapped.filter((entry) => entry.errors.length);
  const delimiterName = csv?.delimiter === ';' ? 'semicolon' : csv?.delimiter === '\t' ? 'tab' : 'comma';
  const sourceSummary = csv ? `${csv.rows.length} rows, ${delimiterName} separated` : 'Name and email columns are required. Role can be a column or a shared default.';
  const sourcePanel = `<section class="card card-body"><div class="dropzone">${icon('upload')}<div><h3>${csv ? esc(csv.name) : 'Choose a candidate CSV'}</h3><p>${sourceSummary}</p><label class="button button-secondary" for="csv-file">${csv ? 'Choose another file' : 'Browse files'}</label><input class="file-input" id="csv-file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values"></div></div></section>`;
  const behaviorPanel = `<section class="card"><div class="card-header"><div><h3>Import behavior</h3><p>Records are validated before they are written.</p></div>${icon('shield')}</div><div class="card-body guardrail-list">${guardrail('Flexible files', 'Excel CSV files with comma, semicolon, tab, BOM, quoted fields, and bilingual headers are supported.', 'Active')}${guardrail('Duplicate control', 'Email is unique inside each company; existing records are updated.', 'Active')}${guardrail('List assignment', 'Valid imported candidates can be added to one existing list in the same operation.', 'Optional')}</div></section>`;
  const intro = pageIntro('Persistent CSV import', 'Import candidates', 'Upload comma, semicolon, or tab-separated files. Map the columns once, apply shared defaults, and optionally add every valid candidate to a list.', '');
  if (!csv) return `${intro}<div class="grid grid-2">${sourcePanel}${behaviorPanel}</div>`;

  const mappingOptions = (selected) => Object.entries(mappings)
    .map(([target, label]) => `<option value="${target}" ${selected === target ? 'selected' : ''}>${label}</option>`)
    .join('');
  const mappingRows = csv.headers.map((header, index) => {
    const label = header || `Column ${index + 1}`;
    const sample = csv.rows[0]?.[index] || 'Empty';
    return `<div class="mapping-row"><div class="source-column"><strong>${esc(label)}</strong><small>Sample: ${esc(sample)}</small></div><span aria-hidden="true">to</span><select class="select mapping-select" data-column="${index}" aria-label="Map ${esc(label)}">${mappingOptions(csv.mapping[index])}</select></div>`;
  }).join('');
  const listOptions = state.lists.map((list) => {
    const company = state.user?.role === 'super_admin' ? `, ${list.company_name}` : '';
    return `<option value="${list.id}" ${csv.listId === list.id ? 'selected' : ''}>${esc(`${list.name}${company}`)}</option>`;
  }).join('');
  const companyOptions = state.companies.map((company) => `<option value="${company.id}" ${csv.companyId === company.id ? 'selected' : ''}>${esc(company.name)}</option>`).join('');
  const companySelect = state.user?.role === 'super_admin'
    ? `<label class="compact-select"><span>Import into company</span><select class="select" id="import-company">${companyOptions}</select></label>`
    : '';
  const reviewMessage = invalid.length
    ? `${invalid.length} row${invalid.length === 1 ? '' : 's'} still need attention. Only valid rows will be imported.`
    : `All ${mapped.length} rows have the required fields.`;
  const errorRows = invalid.slice(0, 8).map((entry) => `<span>Row ${entry.rowNumber}: missing ${esc(entry.errors.join(', '))}</span>`).join('');
  const errorOverflow = invalid.length > 8 ? `<span>+ ${invalid.length - 8} more rows</span>` : '';
  const errors = invalid.length ? `<div class="import-errors">${errorRows}${errorOverflow}</div>` : '';
  const workspace = `<section class="card import-workspace"><div class="card-header"><div><h3>1. Map columns</h3><p>Each destination can be mapped once. Changes are saved immediately.</p></div><span class="badge badge-neutral">${csv.headers.length} columns</span></div><div class="card-body mapping-list">${mappingRows}</div><div class="import-defaults"><div><h3>2. Complete shared fields</h3><p>Use these when the CSV does not contain a role or site column.</p></div><label class="field"><span>Default role <b>Required if not mapped</b></span><input class="input" id="import-default-role" value="${esc(csv.defaultRole || '')}" placeholder="Bilingual Customer Care"></label><label class="field"><span>Default site</span><input class="input" id="import-default-site" value="${esc(csv.defaultSite || '')}" placeholder="Guatemala City"></label><label class="field"><span>Add valid candidates to list</span><select class="select" id="import-list"><option value="">Do not add to a list</option>${listOptions}</select></label></div><div class="import-review"><div><h3>3. Review and import</h3><p>${reviewMessage}</p></div><div class="import-review-actions">${companySelect}<span class="badge badge-${invalid.length ? 'orange' : 'teal'}">${mapped.length - invalid.length} valid, ${invalid.length} skipped</span><button class="button button-primary" data-action="confirm-import" ${state.busy || mapped.length === invalid.length ? 'disabled' : ''}>${icon('check')}Import ${mapped.length - invalid.length} valid candidates</button></div></div>${errors}</section>`;
  return `${intro}<div class="grid grid-2">${sourcePanel}${behaviorPanel}</div>${workspace}`;
}

function renderSend(prefill = {}) {
  const emailReady = state.health.email?.configured;
  const activeTests = state.tests.filter((test) => test.status === 'active');
  const receipt = state.directSendReceipt;
  const receiptCandidate = receipt ? state.candidates.find((candidate) => candidate.invitation_id === receipt.invitationId) : null;
  const receiptStatus = receiptCandidate?.invitation_status || receipt?.status || 'accepted';
  const receiptTest = receipt ? state.tests.find((test) => test.id === receipt.testId) : null;
  const receiptMessage = receiptStatus === 'delivered' || receiptStatus === 'completed'
    ? 'Brevo confirmed delivery to the recipient mail server.'
    : receiptStatus === 'accepted'
      ? 'Brevo SMTP accepted the message. Refresh to check the delivery event.'
      : 'The latest provider status is shown below. Refresh to check for a newer event.';
  const publicHost = (state.health.publicBaseUrl || location.origin).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const receiptHtml = receipt ? `<section class="direct-send-receipt" aria-live="polite"><div class="receipt-heading"><span class="receipt-icon">${icon(receiptStatus === 'delivered' || receiptStatus === 'completed' ? 'check' : 'mail')}</span><div><p class="eyebrow">Direct-send receipt</p><h3>Invitation submitted</h3><p>${esc(receiptMessage)}</p></div>${statusBadge(receiptStatus)}</div><dl class="receipt-details"><div><dt>Candidate</dt><dd>${esc(receipt.candidateName)}</dd><small>${esc(receipt.candidateEmail)}</small></div><div><dt>Assessment</dt><dd>${esc(receiptTest?.name_en || 'Assessment')}</dd><small>${receipt.locale === 'es' ? 'Email in Spanish' : 'Email in English'}</small></div><div><dt>Transport</dt><dd>Brevo SMTP</dd><small>${esc(formatDate(receipt.submittedAt))}</small></div><div><dt>Public access</dt><dd>${esc(publicHost)}</dd><small>No ChatGPT account required</small></div></dl><div class="receipt-footer"><p>Direct sends are tracked on the candidate record and do not appear in the batch table.</p><div class="receipt-actions"><button class="button button-secondary" data-action="reload">${icon('refresh')}Refresh status</button><button class="button button-secondary" data-nav="candidates">${icon('users')}View candidate</button></div></div></section>` : '';
  const companyField = state.user?.role === 'super_admin' && !prefill.id ? `<div class="field"><label for="invite-company">Company</label><select class="select" id="invite-company">${state.companies.map((company) => `<option value="${company.id}">${esc(company.name)}</option>`).join('')}</select></div>` : '';
  return `${pageIntro('One-off delivery', 'Direct test send', 'Use lists for cohorts and test sets. Direct send is available for an individual exception.', `<button class="button button-secondary" data-nav="lists">${icon('list')}Use a list instead</button>`)}${receiptHtml}<div class="grid grid-2"><section class="card"><div class="card-header"><div><h3>Candidate invitation</h3><p>The candidate still chooses English or Spanish before starting.</p></div>${statusBadge(emailReady ? 'smtp_ready' : 'Not configured')}</div><form class="card-body form-grid" id="invite-form"><input type="hidden" id="invite-candidate-id" value="${esc(prefill.id || '')}"><div class="field"><label for="invite-name">Candidate name</label><input class="input" id="invite-name" required value="${esc(prefill.name || '')}"></div><div class="field"><label for="invite-email">Email</label><input class="input" id="invite-email" type="email" required value="${esc(prefill.email || '')}"></div><div class="field"><label for="invite-phone">Phone</label><input class="input" id="invite-phone" value="${esc(prefill.phone || '')}"></div><div class="field"><label for="invite-role">Role</label><input class="input" id="invite-role" required value="${esc(prefill.role || 'Bilingual Customer Care')}"></div><div class="field"><label for="invite-site">Site</label><input class="input" id="invite-site" value="${esc(prefill.site || '')}"></div>${companyField}<div class="field"><label for="invite-test">Test</label><select class="select" id="invite-test">${activeTests.map((test) => `<option value="${test.id}">${esc(test.name_en)}</option>`).join('')}</select></div><div class="field"><label for="invite-locale">Suggested email language</label><select class="select" id="invite-locale"><option value="en">English</option><option value="es">Español</option></select></div><div class="form-span"><button class="button button-primary" type="submit" ${!emailReady || state.busy ? 'disabled' : ''}>${icon('send')}${state.busy ? 'Sending…' : 'Send invitation'}</button>${!emailReady ? '<p class="field-help">Connect and verify Brevo in Settings before sending.</p>' : ''}</div></form></section><section class="stack">${activeTests.map(testCatalogCard).join('')}<article class="card"><div class="card-header"><div><h3>Delivery controls</h3><p>High-deliverability requirements.</p></div></div><div class="card-body guardrail-list">${guardrail('Verified sender', 'Authenticate the sender or domain in Brevo and publish DMARC with your domain policy.', emailReady ? 'Configured' : 'Open')}${guardrail('Idempotent sending', 'Each invitation uses a stable idempotency key to prevent accidental duplicates.', 'Active')}${guardrail('Authenticated webhooks', 'Delivery failures and complaints update the invitation record.', 'Implemented')}</div></article></section></div>`;
}

function renderProgress() {
  const total = state.batches.reduce((sum, batch) => sum + Number(batch.total_count || 0), 0);
  const accepted = state.batches.reduce((sum, batch) => sum + Number(batch.accepted_count || 0), 0);
  const confirmed = state.batches.reduce((sum, batch) => sum + Number(batch.provider_confirmed_count || 0), 0);
  const delivered = state.batches.reduce((sum, batch) => sum + Number(batch.delivered_count || 0), 0);
  return `${pageIntro('Batch and candidate events', 'Send progress', 'API acceptance is not delivery. Gazelle reports Brevo evidence, inbox delivery, and assessment completion separately.', `<button class="button button-secondary" data-action="reload">${icon('refresh')}Refresh</button>`)}<section class="grid grid-4">${metric('Batch items', total, 'Candidate-test combinations', 'send')}${metric('API accepted', accepted, 'Brevo returned a message ID', 'check')}${metric('Brevo confirmed', confirmed, 'Provider event recorded', 'shield')}${metric('Delivered', delivered, 'Inbox delivery recorded', 'mail')}</section><section class="card"><div class="table-scroll"><table><thead><tr><th>List</th><th>Company</th><th>Status</th><th>API outcome</th><th>Brevo evidence</th><th>Assessments</th><th>Created</th></tr></thead><tbody>${state.batches.map((batch) => { const processed = Number(batch.accepted_count || 0) + Number(batch.failed_count || 0); const pct = Number(batch.total_count) ? Math.round(processed / Number(batch.total_count) * 100) : 0; const acceptedCount = Number(batch.accepted_count || 0); const confirmedCount = Number(batch.provider_confirmed_count || 0); const deliveredCount = Number(batch.delivered_count || 0); return `<tr><td><strong>${esc(batch.list_name)}</strong><br><span class="empty-value">by ${esc(batch.created_by_name)}</span></td><td>${esc(batch.company_name)}</td><td>${statusBadge(batch.status)}</td><td><div class="batch-progress"><div class="progress-track"><span style="width:${pct}%"></span></div><small>${acceptedCount} accepted · ${Number(batch.failed_count)} failed</small></div></td><td><strong>${confirmedCount} / ${acceptedCount} confirmed</strong><br><span class="empty-value">${deliveredCount} delivered</span></td><td>${Number(batch.completed_assessments)} completed</td><td>${formatDate(batch.created_at)}</td></tr>`; }).join('') || '<tr><td colspan="7"><div class="empty-panel"><h3>No batches yet</h3><p>Create a list, assign tests, and send the first batch.</p></div></td></tr>'}</tbody></table></div></section>`;
}

function reportRecord(records = state.results) {
  if (state.previewReport) return state.previewReport;
  return records.find((result) => result.assessment_id === state.reportResultId) || records[0] || null;
}

function normalizedReport(record) {
  if (!record) return null;
  if (record.isPreview) return record;
  return {
    id: record.assessment_id, candidateId: record.id, name: record.name, email: record.email, role: record.role, site: record.site,
    companyName: record.company_name, ownerName: record.owner_name, testId: record.assessment_test_id,
    testNameEn: record.assessment_test_name_en, testNameEs: record.assessment_test_name_es,
    locale: record.assessment_locale, experienceBranch: record.experience_branch, completedAt: record.assessment_completed_at,
    durationMs: record.duration_ms, potentialIndex: Number(record.potential_index), potentialBand: record.potential_band,
    subscales: { fit: { score: Number(record.fit_score) }, intent: { score: Number(record.intent_score) }, reliability: { score: Number(record.reliability_score) }, context: { score: record.context_score == null ? null : Number(record.context_score) } },
    supportProfile: record.support_profile || [], quality: record.response_quality || { status: 'unknown', flags: [] },
    scoringTrace: record.scoring_trace || [], weights: record.weights || {}, auditHash: record.audit_hash,
    assessmentVersion: record.assessment_version, modelVersion: record.model_version, modelStatus: record.model_status,
    scenarioResponses: record.scenario_responses || [], aiAnalysis: record.ai_analysis || null,
  };
}

function aiAnalysisIsStale(analysis) {
  if (!AI_ACTIVE_STATUSES.has(analysis?.status)) return false;
  const updatedAt = Date.parse(analysis?.updated_at || '');
  return !Number.isFinite(updatedAt) || Date.now() - updatedAt >= AI_STALE_AFTER_MS;
}

function scheduleAiReportRefresh() {
  if (state.loading || state.busy || state.view !== 'reports' || state.previewReport) return;
  const analysis = normalizedReport(reportRecord())?.aiAnalysis;
  if (!AI_ACTIVE_STATUSES.has(analysis?.status) || aiAnalysisIsStale(analysis)) return;
  aiRefreshTimer = setTimeout(() => loadWorkspace(), 8000);
}

function reportUiCopy() {
  const es = state.reportLocale === 'es';
  return {
    es,
    eyebrow: es ? 'Evidencia con trazabilidad' : 'Evidence with provenance',
    title: es ? 'Resultados y reportes' : 'Results & Reports',
    description: es ? 'Resultados del cuestionario, escenarios, interpretación asistida y trazabilidad técnica.' : 'Questionnaire results, scenario evidence, assisted interpretation, and technical provenance.',
    reportTab: es ? 'Reporte de Potencial de Permanencia' : 'Tenure Potential report',
    auditTab: es ? 'Auditoría de puntuación' : 'Scoring audit',
    methodTab: es ? 'Método y validación' : 'Method & validation',
    library: es ? 'Biblioteca de resultados' : 'Result library',
    search: es ? 'Buscar resultados' : 'Search results',
    allTests: es ? 'Todos los tests' : 'All tests',
    allRoles: es ? 'Todos los roles' : 'All roles',
    allLists: es ? 'Todas las listas' : 'All lists',
    allAccessible: es ? 'Todo mi alcance' : 'All accessible',
    myCandidates: es ? 'Mis candidatos' : 'My candidates',
    allCompanies: es ? 'Todas las empresas' : 'All companies',
    entireCompany: es ? 'Toda la empresa' : 'Entire company',
    noList: es ? 'Sin lista' : 'No list',
    noMatches: es ? 'No hay resultados que coincidan con estos filtros.' : 'No results match these filters.',
    emptyTitle: es ? 'Aún no hay resultados auditados' : 'No audited results yet',
    emptyText: es ? 'Complete una invitación real o ejecute la evaluación de vista previa.' : 'Complete a real invitation or run the preview assessment.',
    preview: es ? 'Vista previa de evaluación' : 'Preview assessment',
    clear: es ? 'Limpiar filtros' : 'Clear filters',
    result: es ? 'resultado' : 'result',
    results: es ? 'resultados' : 'results',
    download: es ? 'Descargar PDF' : 'Download PDF',
  };
}

function resultListIds(record) {
  return [...new Set([record.source_list_id, ...(record.candidate_list_ids || [])].filter(Boolean))];
}

function resultListNames(record) {
  const names = resultListIds(record).map((id) => state.lists.find((list) => list.id === id)?.name).filter(Boolean);
  if (record.source_list_name) names.unshift(record.source_list_name);
  return [...new Set(names)];
}

function filteredReportResults() {
  const search = state.reportSearch.trim().toLocaleLowerCase();
  return state.results.filter((result) => {
    const listNames = resultListNames(result);
    const searchable = [result.name, result.email, result.role, result.site, result.company_name, result.owner_name, result.assessment_test_name_en, result.assessment_test_name_es, ...listNames].filter(Boolean).join(' ').toLocaleLowerCase();
    if (search && !searchable.includes(search)) return false;
    if (state.reportTestId !== 'all' && result.assessment_test_id !== state.reportTestId) return false;
    if (state.reportRole !== 'all' && result.role !== state.reportRole) return false;
    if (state.reportListId !== 'all' && !resultListIds(result).includes(state.reportListId)) return false;
    if (state.reportScope === 'mine' && result.owner_user_id !== state.user?.id) return false;
    if (state.reportScope.startsWith('company:') && result.company_id !== state.reportScope.slice(8)) return false;
    return true;
  });
}

function reportScopeOptions(copy) {
  const options = [];
  const role = state.user?.role;
  options.push({ value: 'all', label: role === 'super_admin' ? copy.allCompanies : role === 'admin' ? copy.entireCompany : copy.allAccessible });
  if (role !== 'recruiter') options.push({ value: 'mine', label: copy.myCandidates });
  if (role === 'super_admin') {
    const companies = [...new Map(state.results.map((result) => [result.company_id, result.company_name]).filter((entry) => entry[0])).entries()]
      .sort((left, right) => String(left[1]).localeCompare(String(right[1])));
    companies.forEach(([id, name]) => options.push({ value: `company:${id}`, label: name }));
  }
  return options;
}

function renderResultDirectory(records, copy) {
  const tests = [...new Map(state.results.map((result) => [result.assessment_test_id, copy.es ? result.assessment_test_name_es : result.assessment_test_name_en]).filter((entry) => entry[0])).entries()]
    .sort((left, right) => String(left[1]).localeCompare(String(right[1])));
  const roles = [...new Set(state.results.map((result) => result.role).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  const scopes = reportScopeOptions(copy);
  const hasFilters = Boolean(state.reportSearch || state.reportTestId !== 'all' || state.reportScope !== 'all' || state.reportRole !== 'all' || state.reportListId !== 'all');
  const resultRows = records.map((result) => {
    const selected = result.assessment_id === state.reportResultId;
    const listLabel = resultListNames(result).join(', ') || copy.noList;
    const testName = copy.es ? result.assessment_test_name_es : result.assessment_test_name_en;
    return `<button class="result-row ${selected ? 'selected' : ''}" data-report-result="${esc(result.assessment_id)}" type="button" aria-pressed="${selected}"><span class="person-avatar">${initials(result.name)}</span><span class="result-row-main"><strong>${esc(result.name)}</strong><small>${esc(testName || result.assessment_test_code || 'Assessment')} · ${esc(result.role)}</small><small>${esc(result.company_name)} · ${esc(listLabel)}</small></span><span class="result-row-score"><strong>${Number(result.potential_index).toFixed(1)}</strong><small>/ 100</small></span></button>`;
  }).join('');
  return `<aside class="results-directory"><div class="results-directory-header"><div><h3>${copy.library}</h3><span>${records.length} ${records.length === 1 ? copy.result : copy.results}</span></div>${hasFilters ? `<button class="icon-button" type="button" data-action="clear-report-filters" title="${copy.clear}" aria-label="${copy.clear}">${icon('x')}</button>` : ''}</div><div class="report-filters"><label class="report-filter-search"><span class="sr-only">${copy.search}</span><span class="search">${icon('search')}<input class="input" id="report-search" value="${esc(state.reportSearch)}" placeholder="${copy.search}"></span></label><label><span>Test</span><select class="select" id="report-test-filter"><option value="all">${copy.allTests}</option>${tests.map(([id, name]) => `<option value="${esc(id)}" ${state.reportTestId === id ? 'selected' : ''}>${esc(name || id)}</option>`).join('')}</select></label><label><span>${copy.es ? 'Alcance' : 'Scope'}</span><select class="select" id="report-scope-filter">${scopes.map((scope) => `<option value="${esc(scope.value)}" ${state.reportScope === scope.value ? 'selected' : ''}>${esc(scope.label)}</option>`).join('')}</select></label><label><span>${copy.es ? 'Rol' : 'Role'}</span><select class="select" id="report-role-filter"><option value="all">${copy.allRoles}</option>${roles.map((role) => `<option value="${esc(role)}" ${state.reportRole === role ? 'selected' : ''}>${esc(role)}</option>`).join('')}</select></label><label><span>${copy.es ? 'Lista' : 'List'}</span><select class="select" id="report-list-filter"><option value="all">${copy.allLists}</option>${state.lists.map((list) => `<option value="${esc(list.id)}" ${state.reportListId === list.id ? 'selected' : ''}>${esc(list.name)}</option>`).join('')}</select></label></div><div class="result-list" role="list">${resultRows || `<div class="result-list-empty">${icon('search')}<p>${copy.noMatches}</p></div>`}</div></aside>`;
}

function renderReports() {
  const copy = reportUiCopy();
  const records = filteredReportResults();
  const selectedRecord = reportRecord(records);
  if (!state.previewReport && selectedRecord && selectedRecord.assessment_id !== state.reportResultId) state.reportResultId = selectedRecord.assessment_id;
  const report = normalizedReport(selectedRecord);
  const aiReady = report?.aiAnalysis?.status === 'completed';
  const aiActive = AI_ACTIVE_STATUSES.has(report?.aiAnalysis?.status) && !aiAnalysisIsStale(report.aiAnalysis);
  const canGenerateAi = report && !aiReady && !aiActive && (!report.isPreview || Boolean(report.previewInput));
  const generateLabel = state.busy ? (state.reportLocale === 'es' ? 'Generando…' : 'Generating…') : (state.reportLocale === 'es' ? 'Generar análisis' : 'Generate analysis');
  const languageSwitch = `<div class="report-language" role="group" aria-label="Report language"><button type="button" data-report-locale="en" class="${state.reportLocale === 'en' ? 'active' : ''}" aria-pressed="${state.reportLocale === 'en'}">EN</button><button type="button" data-report-locale="es" class="${state.reportLocale === 'es' ? 'active' : ''}" aria-pressed="${state.reportLocale === 'es'}">ES</button></div>`;
  const navigation = `<div class="report-navigation"><div class="tabs"><button class="tab ${state.reportTab === 'report' ? 'active' : ''}" data-report-tab="report">${copy.reportTab}</button><button class="tab ${state.reportTab === 'audit' ? 'active' : ''}" data-report-tab="audit">${copy.auditTab}</button><button class="tab ${state.reportTab === 'method' ? 'active' : ''}" data-report-tab="method">${copy.methodTab}</button></div>${languageSwitch}</div>`;
  const empty = `<div class="empty-panel"><h3>${copy.emptyTitle}</h3><p>${state.results.length ? copy.noMatches : copy.emptyText}</p>${state.results.length ? '' : `<button class="button button-primary" data-action="preview">${copy.preview}</button>`}</div>`;
  const actions = report ? `<div class="toolbar report-toolbar">${canGenerateAi ? `<button class="button button-secondary" data-action="generate-ai" ${state.busy ? 'disabled' : ''}>${icon('refresh')}${generateLabel}</button>` : ''}<button class="button button-primary" data-action="download-pdf">${icon('file')}${copy.download}</button></div>` : '';
  const resultWorkspace = `<div class="results-shell">${renderResultDirectory(records, copy)}<div class="selected-report">${actions}${report ? (state.reportTab === 'audit' ? renderAudit(report) : renderReport(report)) : empty}</div></div>`;
  return `${pageIntro(copy.eyebrow, copy.title, copy.description, '')}<section class="report-workspace">${navigation}<div class="report-content">${state.reportTab === 'method' ? renderMethod() : resultWorkspace}</div></section>`;
}

function reportCopy(report) {
  const es = state.reportLocale === 'es';
  const band = report.potentialBand === 'strong_observed' ? (es ? 'Potencial observado sólido' : 'Strong observed potential') : report.potentialBand === 'conditional' ? (es ? 'Potencial condicionado' : 'Conditional potential') : (es ? 'Se necesita más evidencia' : 'More evidence needed');
  return { es, band, fit: es ? 'Alineación con la realidad del puesto' : 'Role reality alignment', intent: es ? 'Intención de permanencia' : 'Stay intention', reliability: es ? 'Confiabilidad laboral' : 'Work reliability', context: es ? 'Contexto de compromiso' : 'Commitment context' };
}

function qualityLabel(status, es) {
  if (status === 'pilot_usable') return es ? 'Patrón de respuesta claro' : 'Clear response pattern';
  if (status === 'review_required') return es ? 'Revisar calidad de respuesta' : 'Review response quality';
  if (status === 'incomplete') return es ? 'Evidencia incompleta' : 'Incomplete evidence';
  return es ? 'Calidad registrada' : 'Quality recorded';
}

function alignmentScale(rating, es) {
  const labels = es ? ['Limitada', 'Baja', 'Mixta', 'Alineada', 'Sólida'] : ['Limited', 'Below aligned', 'Mixed', 'Aligned', 'Strong'];
  return `<div class="alignment-scale" aria-label="${es ? 'Alineación laboral' : 'Job alignment'} ${rating} ${es ? 'de' : 'of'} 5">${labels.map((label, index) => `<div class="${index < rating ? 'filled' : ''} ${index + 1 === rating ? 'current' : ''}"><strong>${index + 1}</strong><span>${label}</span></div>`).join('')}</div>`;
}

function renderReport(report) {
  const copy = reportCopy(report);
  const qualityTone = report.quality.status === 'pilot_usable' ? 'teal' : 'orange';
  const supports = (report.supportProfile || []).slice(0, 3).map((entry) => engine.supportLabel(entry.itemId, copy.es ? 'es' : 'en'));
  const scenarios = report.scenarioResponses || [];
  const analysis = report.aiAnalysis?.output?.[copy.es ? 'es' : 'en'];
  const alignment = analysis?.job_alignment;
  const findings = analysis?.scenario_findings || [];
  const aiProvider = report.aiAnalysis?.provider || state.health.ai?.provider || 'AI';
  const analysisStatus = report.aiAnalysis?.status || 'not_generated';
  const analysisStale = aiAnalysisIsStale(report.aiAnalysis);
  const canRetryAi = (!AI_ACTIVE_STATUSES.has(analysisStatus) || analysisStale) && (!report.isPreview || Boolean(report.previewInput));
  const visibleStatus = analysisStale ? 'retry_available' : analysisStatus;
  const statusCopy = {
    queued: copy.es ? 'En cola. Actualice en unos momentos.' : 'Queued. Refresh in a moment.',
    processing: copy.es ? 'La IA está procesando el cuestionario y los tres escenarios.' : 'AI is processing the questionnaire and all three scenarios.',
    retry_available: copy.es ? 'El proceso anterior no terminó. Puede reintentar el análisis.' : 'The previous run did not finish. You can retry the analysis.',
    not_configured: copy.es ? 'El análisis de IA no se ha generado para este resultado.' : 'AI analysis has not been generated for this result.',
    failed: copy.es ? 'El análisis falló. Puede volver a intentarlo sin cambiar la puntuación.' : 'The analysis failed. It can be retried without changing the score.',
    not_generated: copy.es ? 'El análisis de vista previa todavía no se ha generado.' : 'The preview analysis has not been generated yet.',
  };
  const alignmentSection = alignment ? `<section class="report-section alignment-panel"><div class="section-title compact"><div><p class="eyebrow">${copy.es ? 'Síntesis cuestionario + escenarios' : 'Questionnaire + scenario synthesis'}</p><h3>${copy.es ? 'Alineación laboral basada en evidencia' : 'Evidence-based job alignment'}</h3></div><div class="alignment-number"><strong>${alignment.rating}</strong><span>/ 5</span></div></div>${alignmentScale(alignment.rating, copy.es)}<div class="alignment-summary"><div><span>${copy.es ? 'Lectura' : 'Interpretation'}</span><strong>${esc(copy.es ? alignment.label_es : alignment.label_en)}</strong></div><div><span>${copy.es ? 'Confianza' : 'Confidence'}</span><strong>${esc(alignment.confidence)}</strong></div><p>${esc(copy.es ? alignment.rationale_es : alignment.rationale_en)}</p></div><div class="evidence-columns"><div><h4>${copy.es ? 'Fortalezas observadas' : 'Observed strengths'}</h4><ul>${(analysis.observed_strengths || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div><div><h4>${copy.es ? 'Aspectos por verificar' : 'Areas to verify'}</h4><ul>${(analysis.watch_areas || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div></div></section>` : '';
  const scenarioSection = `<section class="report-section"><div class="section-title compact"><div><h3>${copy.es ? 'Evidencia de los tres escenarios' : 'Evidence from all three scenarios'}</h3><p>${copy.es ? 'Respuesta original y lectura conductual vinculada.' : 'Original response with its linked behavioral interpretation.'}</p></div><span class="badge badge-neutral">${scenarios.length} / 3</span></div><div class="scenario-evidence">${scenarios.length ? scenarios.map((entry, index) => { const finding = findings.find((item) => item.scenario_id === (entry.scenario_id || entry.id)); return `<article><span>${index + 1}</span><div><strong>${esc(copy.es ? entry.question_es : entry.question_en)}</strong><p>${esc(entry.response_text)}</p>${finding ? `<div class="scenario-finding"><b>${copy.es ? 'Lectura' : 'Finding'} · ${esc(finding.signal)}</b><span>${esc(copy.es ? finding.finding_es : finding.finding_en)}</span></div>` : ''}<small>${esc(entry.construct || '')} · ${formatDuration(entry.response_ms)}</small></div></article>`; }).join('') : `<p>${copy.es ? 'Sin respuestas de escenarios en este resultado.' : 'No scenario responses are available for this result.'}</p>`}</div></section>`;
  const retryLabel = state.busy ? (copy.es ? 'Generando…' : 'Generating…') : (copy.es ? 'Generar o reintentar' : 'Generate or retry');
  const aiSection = `<section class="report-section ai-report"><div class="section-title compact"><div><p class="eyebrow">${copy.es ? 'Interpretación profesional asistida' : 'Assisted professional interpretation'}</p><h3>${analysis?.title ? esc(analysis.title) : (copy.es ? 'Análisis integrado del candidato' : 'Integrated candidate analysis')}</h3><p>${copy.es ? `Generado con ${esc(aiProvider)} y vinculado a evidencia auditable.` : `Generated with ${esc(aiProvider)} and tied to auditable evidence.`}</p></div><span class="badge badge-${analysis ? 'teal' : 'orange'}">${esc(analysis ? (copy.es ? 'Completo' : 'Complete') : visibleStatus.replaceAll('_', ' '))}</span></div>${analysis?.paragraphs?.length === 5 ? `<p class="executive-summary">${esc(analysis.executive_summary || '')}</p><div class="analysis-paragraphs">${analysis.paragraphs.map((paragraph, index) => `<article><span>${index + 1}</span><p>${esc(paragraph)}</p></article>`).join('')}</div><div class="action-columns"><div><h4>${copy.es ? 'Preguntas de entrevista' : 'Structured interview probes'}</h4><ul>${(analysis.interview_focus || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div><div><h4>${copy.es ? 'Acciones de incorporación' : 'Onboarding actions'}</h4><ul>${(analysis.support_actions || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div></div><div class="ai-provenance"><code>${esc(aiProvider)}</code><code>${esc(report.aiAnalysis.model || '')}</code><code>${esc(report.aiAnalysis.prompt_version || '')}</code></div>` : `<div class="empty-analysis"><p>${esc(statusCopy[visibleStatus] || visibleStatus)}</p>${canRetryAi ? `<button class="button button-secondary" data-action="generate-ai" ${state.busy ? 'disabled' : ''}>${icon('refresh')}${retryLabel}</button>` : `<button class="button button-secondary" data-action="reload">${icon('refresh')}${copy.es ? 'Actualizar' : 'Refresh'}</button>`}</div>`}</section>`;
  return `<article class="report-document"><header class="report-cover"><div><p class="eyebrow">Gazelle Assessment</p><h2>${copy.es ? 'Reporte de Potencial de Permanencia' : 'Tenure Potential Report'}</h2><p>${esc(report.name)} · ${esc(report.role)}${report.site ? ` · ${esc(report.site)}` : ''}</p></div><div class="report-date"><span>${copy.es ? 'Completado' : 'Completed'}</span><strong>${formatDate(report.completedAt, copy.es ? 'es' : 'en')}</strong></div></header><div class="report-shell"><aside class="report-profile"><div class="score-ring" style="--score-angle:${report.potentialIndex / 100 * 360}deg"><div><strong>${report.potentialIndex.toFixed(1)}</strong><span>/ 100</span></div></div><span class="score-caption">${copy.es ? 'Índice de Potencial de Permanencia' : 'Tenure Potential Index'}</span><strong class="report-band">${copy.band}</strong><div class="profile-meta"><div><span>${copy.es ? 'Alineación IA' : 'AI alignment'}</span><strong>${alignment ? `${alignment.rating} / 5` : '—'}</strong></div><div><span>${copy.es ? 'Calidad' : 'Quality'}</span><strong>${esc(qualityLabel(report.quality.status, copy.es))}</strong></div></div><p class="interpretive-note">${copy.es ? 'El índice resume el cuestionario. La calificación 1–5 integra el cuestionario con los tres escenarios y se reporta por separado.' : 'The index summarizes questionnaire responses. The 1–5 rating integrates questionnaire and all three scenarios and is reported separately.'}</p></aside><div class="report-main"><section class="report-section score-profile"><div class="section-title compact"><div><h3>${copy.es ? 'Perfil de evidencia estructurada' : 'Structured evidence profile'}</h3><p>${copy.es ? 'Tres dimensiones con ponderación igual; el contexto se muestra por separado.' : 'Three equally weighted dimensions; context is displayed separately.'}</p></div><span class="badge badge-${qualityTone}">${esc(qualityLabel(report.quality.status, copy.es))}</span></div>${dimensionBar(copy.fit, report.subscales.fit.score)}${dimensionBar(copy.intent, report.subscales.intent.score)}${dimensionBar(copy.reliability, report.subscales.reliability.score)}${dimensionBar(copy.context, report.subscales.context.score, true)}</section>${alignmentSection}${aiSection}${scenarioSection}<section class="report-section report-guidance"><div><h4>${copy.es ? 'Palancas de permanencia' : 'Retention support levers'}</h4><ul>${supports.length ? supports.map((label) => `<li>${esc(label)}</li>`).join('') : `<li>${copy.es ? 'No disponibles' : 'Not available'}</li>`}</ul></div><div><h4>${copy.es ? 'Alcance de interpretación' : 'Interpretation scope'}</h4><p>${copy.es ? 'Utilice este perfil con una entrevista estructurada y otra evidencia relacionada con el puesto. La validación contra resultados locales de permanencia sigue en desarrollo.' : 'Use this profile with a structured interview and other job-related evidence. Validation against local tenure outcomes remains in progress.'}</p></div></section></div></div></article>`;
}

function dimensionBar(label, value, contextual = false) {
  if (value == null) return `<div class="dimension-score"><span>${label}</span><div class="progress-track"></div><strong>—</strong></div>`;
  return `<div class="dimension-score ${contextual ? 'contextual' : ''}"><span>${label}${contextual ? ' *' : ''}</span><div class="progress-track"><span style="width:${value}%"></span></div><strong>${Number(value).toFixed(1)}</strong></div>`;
}

function renderAudit(report) {
  const es = state.reportLocale === 'es';
  const flags = report.quality.flags || [];
  const ai = report.aiAnalysis || {};
  const scenarioRows = report.scenarioResponses || [];
  const statusLabels = { completed: es ? 'completado' : 'completed', queued: es ? 'en cola' : 'queued', processing: es ? 'procesando' : 'processing', failed: es ? 'fallido' : 'failed', not_generated: es ? 'no generado' : 'not generated' };
  const dimensionLabels = es ? { fit: 'Alineación con el puesto', intent: 'Intención de permanencia', reliability: 'Confiabilidad laboral', context: 'Contexto de compromiso' } : {};
  const flagLabels = es ? { missing_items: 'Reactivos faltantes', low_response_variation: 'Baja variación de respuestas', paired_item_inconsistency: 'Inconsistencia entre reactivos relacionados', unusually_fast_completion: 'Finalización inusualmente rápida' } : {};
  const yes = es ? 'Sí' : 'Yes';
  const no = es ? 'No' : 'No';
  return `<div class="stack"><section class="audit-banner"><div>${icon('shield')}<div><strong>${es ? 'Huella criptográfica del resultado' : 'Cryptographic result fingerprint'}</strong><code>${esc(report.auditHash || (es ? 'Resultado de vista previa: sin huella del servidor' : 'Preview result - no server hash'))}</code></div></div><span class="badge badge-${report.auditHash ? 'teal' : 'orange'}">${report.auditHash ? (es ? 'Registrado en servidor' : 'Server recorded') : (es ? 'Solo vista previa' : 'Preview only')}</span></section><div class="grid grid-3">${auditFact(es ? 'Versión de evaluación' : 'Assessment version', report.assessmentVersion)}${auditFact(es ? 'Modelo de puntuación' : 'Scoring model', report.modelVersion)}${auditFact(es ? 'Marco de evaluación' : 'Assessment framework', es ? 'Modelo de evidencia en desarrollo' : 'Development evidence model')}${auditFact(es ? 'Idioma de respuesta' : 'Response locale', report.locale === 'es' ? 'Español' : 'English')}${auditFact(es ? 'Rama de experiencia' : 'Experience branch', es ? (report.experienceBranch === 'experienced' ? 'Con experiencia' : 'Sin experiencia') : report.experienceBranch)}${auditFact(es ? 'Duración' : 'Duration', formatDuration(report.durationMs))}${auditFact(es ? 'Completado' : 'Completed', formatDate(report.completedAt, state.reportLocale))}${auditFact(es ? 'Reactivos puntuados' : 'Items scored', report.scoringTrace.length)}${auditFact(es ? 'Calidad de respuesta' : 'Quality status', qualityLabel(report.quality.status, es))}</div><section class="card"><div class="card-header"><div><h3>${es ? 'Trazabilidad del análisis de IA' : 'AI analysis provenance'}</h3><p>${es ? 'La narrativa se versiona y se firma por separado de la puntuación transparente.' : 'The narrative is versioned and hashed separately from the transparent score.'}</p></div><span class="badge badge-${ai.status === 'completed' ? 'teal' : 'orange'}">${esc(statusLabels[ai.status] || ai.status || (es ? 'no disponible' : 'not available'))}</span></div><div class="card-body grid grid-3">${auditFact(es ? 'Proveedor de IA' : 'AI provider', ai.provider)}${auditFact(es ? 'Modelo de IA' : 'AI model', ai.model)}${auditFact(es ? 'Versión del prompt' : 'Prompt version', ai.prompt_version)}${auditFact(es ? 'Respuesta del proveedor' : 'Provider response', ai.provider_response_id)}${auditFact(es ? 'Huella de evidencia' : 'Evidence hash', ai.evidence_hash)}${auditFact(es ? 'Huella de salida' : 'Output hash', ai.output_hash)}${auditFact(es ? 'Actualizado' : 'Updated', formatDate(ai.updated_at, state.reportLocale))}</div></section><section class="card"><div class="card-header"><div><h3>${es ? 'Trazabilidad de escenarios' : 'Scenario provenance'}</h3><p>${es ? 'Fuente de la pregunta, modelo, versión del prompt, idioma de respuesta y tiempo.' : 'Question source, model, prompt version, response language, and timing.'}</p></div><span class="badge badge-neutral">${scenarioRows.length} ${es ? 'respuestas' : 'responses'}</span></div><div class="table-scroll"><table><thead><tr><th>ID</th><th>${es ? 'Constructo' : 'Construct'}</th><th>${es ? 'Fuente' : 'Source'}</th><th>${es ? 'Modelo' : 'Model'}</th><th>Prompt</th><th>${es ? 'Idioma' : 'Locale'}</th><th>${es ? 'Tiempo' : 'Time'}</th></tr></thead><tbody>${scenarioRows.map((entry) => `<tr><td><code>${esc(entry.scenario_id)}</code></td><td>${esc(entry.construct)}</td><td>${esc(entry.source)}</td><td>${esc(entry.model)}</td><td>${esc(entry.prompt_version)}</td><td>${esc(entry.response_locale)}</td><td>${formatDuration(entry.response_ms)}</td></tr>`).join('')}</tbody></table></div></section><section class="card"><div class="card-header"><div><h3>${es ? 'Controles de calidad de respuesta' : 'Response-quality checks'}</h3><p>${es ? 'Las alertas quedan registradas para revisión y nunca modifican una puntuación silenciosamente.' : 'Flags are recorded for reviewer attention and never silently change a score.'}</p></div></div><div class="card-body">${flags.length ? `<div class="guardrail-list">${flags.map((flag) => guardrail(flagLabels[flag.code] || flag.code.replaceAll('_', ' '), JSON.stringify(flag), flag.severity)).join('')}</div>` : `<span class="badge badge-teal">${es ? 'Sin alertas de calidad de respuesta' : 'No response-quality flags'}</span>`}</div></section><section class="card"><div class="card-header"><div><h3>${es ? 'Traza de puntuación por reactivo' : 'Item-level scoring trace'}</h3><p>${es ? 'Respuesta original, regla de inversión, valor transformado, tiempo e inclusión en el índice.' : 'Raw response, reverse-scoring rule, transformed value, timing, and index inclusion.'}</p></div></div><div class="table-scroll"><table><thead><tr><th>${es ? 'Reactivo' : 'Item ID'}</th><th>${es ? 'Dimensión' : 'Dimension'}</th><th>${es ? 'Original' : 'Raw'}</th><th>${es ? 'Invertido' : 'Reverse'}</th><th>${es ? 'Transformado' : 'Transformed'}</th><th>${es ? 'Contribución 0-100' : '0-100 contribution'}</th><th>${es ? 'Tiempo' : 'Time'}</th><th>${es ? 'Índice' : 'Index'}</th></tr></thead><tbody>${report.scoringTrace.map((entry) => `<tr><td><code>${esc(entry.itemId)}</code></td><td>${esc(dimensionLabels[entry.dimension] || entry.dimension)}</td><td>${entry.rawResponse}</td><td>${entry.reverseScored ? yes : no}</td><td>${entry.transformedResponse}</td><td>${entry.scaledContribution}</td><td>${Math.round(entry.responseMs / 1000)}s</td><td>${entry.includedInPotentialIndex ? yes : no}</td></tr>`).join('')}</tbody></table></div></section><div class="notice"><strong>${es ? 'Reproducibilidad' : 'Reproducibility'}:</strong> ${es ? 'índice de potencial = media de alineación con la realidad del puesto, intención de permanencia y confiabilidad laboral. La calificación de alineación de IA y la narrativa son resultados separados con sus propias huellas de evidencia y salida.' : 'potential index = mean(role reality alignment, stay intention, work reliability). The AI alignment rating and narrative are separate outputs with their own evidence and output hashes.'}</div></div>`;
}

function auditFact(label, value) { return `<article class="card audit-fact"><span>${label}</span><strong>${esc(value ?? '—')}</strong></article>`; }

function renderMethod() {
  const es = state.reportLocale === 'es';
  if (es) return `<div class="stack"><section class="card"><div class="card-header"><div><h3>Ingeniería inversa de reportes anteriores</h3><p>Cuatro reportes suministrados, anonimizados para el análisis.</p></div></div><div class="table-scroll"><table><thead><tr><th>Caso</th><th>Experiencia</th><th>Resultado reportado</th><th>Media de medidas disponibles</th><th>Diferencia</th></tr></thead><tbody><tr><td>A</td><td>No</td><td>49</td><td>48.67</td><td>0.33</td></tr><tr><td>B</td><td>No</td><td>79</td><td>79.33</td><td>0.33</td></tr><tr><td>C</td><td>Sí</td><td>80</td><td>79.50</td><td>0.50</td></tr><tr><td>D</td><td>Sí</td><td>42</td><td>42.50</td><td>0.50</td></tr></tbody></table></div></section><div class="grid grid-2"><section class="card card-body"><h3>Qué puede inferirse</h3><ul class="method-list"><li>La puntuación general es consistente con una media no ponderada de las subescalas disponibles seguida de redondeo.</li><li>La rama sin experiencia parece excluir la medida de conducta previa no puntuada, en lugar de tratar el cero mostrado como evidencia.</li><li>Los reportes utilizan puntuaciones normativas de 0 a 100 y bandas narrativas, pero los ejemplos no permiten recuperar puntos de corte exactos.</li><li>La comparación local se declara no disponible por debajo de 200 candidatos evaluados.</li></ul></section><section class="card card-body"><h3>Qué no puede inferirse</h3><ul class="method-list"><li>Reactivos originales, claves de corrección, transformaciones, precisión interna, muestra normativa ni coeficientes reales del modelo.</li><li>Confiabilidad, estructura del constructo, equivalencia entre idiomas, desempeño por subgrupos y validez de criterio para el rol o la sede.</li><li>Si la banda reportada está calibrada como probabilidad de salida voluntaria.</li></ul></section></div><section class="card"><div class="card-header"><div><h3>Plan de validación antes de realizar afirmaciones predictivas</h3><p>La puntuación permanece descriptiva hasta superar estas etapas.</p></div></div><div class="card-body validation-grid">${validationStep('1', 'Evidencia de contenido', 'Revisión por psicología I/O, análisis del rol, entrevistas cognitivas con candidatos y justificación documentada de cada reactivo.')}${validationStep('2', 'Adaptación bilingüe', 'Revisión independiente de traducción, entrevistas cognitivas, invariancia de medición y análisis DIF por idioma y país.')}${validationStep('3', 'Confiabilidad inicial', 'Distribución de reactivos, confiabilidad omega, test-retest cuando corresponda, tasas de calidad de respuesta y análisis de ramas.')}${validationStep('4', 'Modelo de criterio', 'Prerregistrar permanencia voluntaria a 90 y 180 días; ajustar un modelo interpretable de supervivencia o tiempo discreto con datos locales.')}${validationStep('5', 'Evaluación de reserva', 'Curva, intercepto y pendiente de calibración; puntuación de Brier, índice C o AUC, intervalos de confianza y transporte entre sedes y roles.')}${validationStep('6', 'Equidad y uso', 'Análisis de tasas de selección y puntuaciones, procedimientos alternativos, reglas de revisión humana y control de cambios documentado.')}</div></section></div>`;
  return `<div class="stack"><section class="card"><div class="card-header"><div><h3>Legacy report reverse engineering</h3><p>Four supplied reports, anonymized for analysis.</p></div></div><div class="table-scroll"><table><thead><tr><th>Case</th><th>Experience</th><th>Reported overall</th><th>Mean of available measures</th><th>Difference</th></tr></thead><tbody><tr><td>A</td><td>No</td><td>49</td><td>48.67</td><td>0.33</td></tr><tr><td>B</td><td>No</td><td>79</td><td>79.33</td><td>0.33</td></tr><tr><td>C</td><td>Yes</td><td>80</td><td>79.50</td><td>0.50</td></tr><tr><td>D</td><td>Yes</td><td>42</td><td>42.50</td><td>0.50</td></tr></tbody></table></div></section><div class="grid grid-2"><section class="card card-body"><h3>What can be inferred</h3><ul class="method-list"><li>The overall score is consistent with an unweighted mean of available subscales followed by rounding.</li><li>The no-experience branch appears to exclude the unscored prior-behavior measure rather than treating the displayed zero as evidence.</li><li>The reports use norm-referenced 0–100 scores and narrative bands, but the supplied examples are insufficient to recover exact cut scores.</li><li>The local comparison is explicitly unavailable below 200 examined candidates.</li></ul></section><section class="card card-body"><h3>What cannot be inferred</h3><ul class="method-list"><li>Original items, item keys, transformations, internal precision, norm sample, and actual model coefficients.</li><li>Reliability, construct structure, language equivalence, subgroup performance, and criterion validity for the role/site.</li><li>Whether the reported band is calibrated to a probability of voluntary exit.</li></ul></section></div><section class="card"><div class="card-header"><div><h3>Validation plan before predictive claims</h3><p>The score stays descriptive until these gates are passed.</p></div></div><div class="card-body validation-grid">${validationStep('1', 'Content evidence', 'I/O psychologist review, role analysis, candidate cognitive interviews, and documented item rationale.')}${validationStep('2', 'Bilingual adaptation', 'Independent translation review, cognitive debriefs, measurement invariance, and DIF checks by language/country.')}${validationStep('3', 'Pilot reliability', 'Item distributions, omega reliability, test–retest where appropriate, response-quality rates, and branch analysis.')}${validationStep('4', 'Criterion model', 'Pre-register voluntary 90/180-day outcomes; fit an interpretable survival or discrete-time model on local data.')}${validationStep('5', 'Holdout evaluation', 'Calibration curve/intercept/slope, Brier score, C-index or AUC, confidence intervals, and site/role transport checks.')}${validationStep('6', 'Fairness and use', 'Selection-rate and score analyses, alternative procedures, human review rules, and documented change control.')}</div></section></div>`;
}

function validationStep(number, title, text) { return `<div class="validation-step"><span>${number}</span><div><strong>${title}</strong><p>${text}</p></div></div>`; }

function renderSettings() {
  const email = state.health.email || {};
  const ai = state.health.ai || {};
  const webhookUrl = `${location.origin}/api/brevo/webhook`;
  const sender = email.senderEmail ? `${email.senderName || 'Gazelle Assessment'} <${email.senderEmail}>` : 'Missing BREVO_SENDER_EMAIL';
  const transport = email.transport === 'smtp' ? 'SMTP relay with STARTTLS' : 'Transactional Email API';
  const emailStatus = email.configured ? 'Ready' : email.sendingConfigured ? 'Webhook required' : 'Setup required';
  const aiSecret = ai.providerKey === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY';
  return `${pageIntro('Secure runtime configuration', 'Settings', 'Email, AI provider, and authentication secrets stay server-side; the browser sees only connection status.', `<button class="button button-secondary" data-action="reload">${icon('refresh')}Refresh status</button>`)}
    <div class="grid grid-2">
      <section class="card settings-card">
        <div class="settings-title"><div><h3>Brevo delivery</h3><p>Transactional email API with auditable delivery events.</p></div><span class="badge badge-${email.configured ? 'teal' : 'orange'}">${emailStatus}</span></div>
        ${settingLine('Provider', 'Brevo transactional email', 'Implemented')}
        ${settingLine('Transport', transport, email.sendingConfigured ? 'Active' : 'Required')}
        ${settingLine('Sender', sender, email.senderEmail ? 'Configured' : 'Required')}
        ${settingLine('API diagnostics', email.apiConfigured ? 'API key is configured for logs and webhooks' : 'Add BREVO_API_KEY', email.apiConfigured ? 'Ready' : 'Required')}
        ${settingLine('Webhook authentication', email.webhookConfigured ? 'Secret header token is configured' : 'Add BREVO_WEBHOOK_TOKEN', email.webhookConfigured ? 'Ready' : 'Required')}
        <div class="field email-test"><label for="email-test-recipient">Connection test recipient</label><div class="inline-field"><input class="input" id="email-test-recipient" type="email" placeholder="you@company.com"><button class="button button-primary" data-action="test-email" ${!email.configured || state.busy ? 'disabled' : ''}>Send test</button></div><small>Brevo acceptance is recorded immediately; the authenticated webhook confirms delivery.</small></div>
      </section>
      <section class="card settings-card">
        <h3>Connect Brevo</h3>
        <ol class="setup-list">
          <li><strong>Authenticate a sender or domain.</strong><span>Complete Brevo verification and publish the requested SPF/DKIM records; add DMARC for your domain policy.</span></li>
          <li><strong>Create a Brevo API key.</strong><span>Use a server-side key with transactional email access. Candidate invitations are transactional messages, not marketing campaigns.</span></li>
          <li><strong>Add hosted runtime values.</strong><span><code>BREVO_API_KEY</code>, <code>BREVO_SMTP_KEY</code>, <code>BREVO_SMTP_LOGIN</code>, <code>BREVO_SENDER_EMAIL</code>, <code>BREVO_SENDER_NAME</code>, and <code>BREVO_WEBHOOK_TOKEN</code>.</span></li>
          <li><strong>Register a transactional webhook.</strong><span>Use <code>${esc(webhookUrl)}</code> with the secret header configured by the super administrator action.</span></li>
        </ol>
        ${state.user?.role === 'super_admin' ? `<button class="button button-secondary" data-action="configure-brevo-webhook" ${!email.configured || state.busy ? 'disabled' : ''}>${icon('refresh')}Create or update webhook</button>` : ''}
        <p class="settings-link"><a href="https://app.brevo.com" target="_blank" rel="noreferrer">Open Brevo</a> · <a href="https://developers.brevo.com/docs/send-a-transactional-email" target="_blank" rel="noreferrer">Sending guide</a> · <a href="https://developers.brevo.com/docs/secured-webhooks" target="_blank" rel="noreferrer">Webhook security</a></p>
      </section>
      <section class="card settings-card"><div class="settings-title"><div><h3>AI evidence synthesis</h3><p>Five-paragraph bilingual interpretation and an auditable 1–5 job-alignment rating.</p></div><span class="badge badge-${ai.configured ? 'teal' : 'orange'}">${ai.configured ? 'Connected' : 'Not connected'}</span></div>${settingLine('Provider', ai.provider || 'OpenAI', ai.configured ? 'Connected' : 'Selected')}${settingLine('Model', ai.model || aiAssessment.DEFAULT_MODEL, 'Pinned')}${settingLine('Scenario prompt', ai.scenarioPromptVersion || aiAssessment.SCENARIO_PROMPT_VERSION, 'Versioned')}${settingLine('Analysis prompt', ai.analysisPromptVersion || aiAssessment.ANALYSIS_PROMPT_VERSION, 'Versioned')}<div class="notice"><strong>Configuration:</strong> set <code>AI_PROVIDER</code> to <code>openai</code> or <code>gemini</code>, then add <code>${aiSecret}</code> as a hosted secret. Candidate identity and contact fields are excluded from AI evidence.</div></section>
      <section class="card settings-card"><h3>Account security</h3><p>${esc(state.user?.email || '')}</p><form id="password-form" class="stack"><label class="field"><span>Current password</span><input class="input" id="current-password" type="password" autocomplete="current-password" required></label><label class="field"><span>New password</span><input class="input" id="new-password" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></label><button class="button button-secondary" type="submit">${icon('key')}Change password</button></form></section>
      <section class="card settings-card"><h3>Data and access</h3>${settingLine('Structured records', 'Platform database', state.health.database ? 'Active' : 'Unavailable')}${settingLine('Signed-in identity', 'App-owned secure session', 'HTTP-only')}${settingLine('Role scope', (state.user?.role || '').replace('_', ' '), 'Server-side')}${settingLine('Company scope', state.user?.companyName || 'All companies', 'Server-side')}${settingLine('Candidate invitation', 'Random one-time token; only hash stored', 'Implemented')}${settingLine('Public access', 'Account pages and invitation links', 'Enabled')}</section>
      <section class="card settings-card"><h3>Assessment governance</h3>${settingLine('Automatic rejection', 'Disabled by product design', 'Locked off')}${settingLine('AI alignment rating', 'Separate from the deterministic index', 'Auditable')}${settingLine('Validation lifecycle', 'Local outcome validation in progress', engine.MODEL_VERSION)}${settingLine('Result fingerprint', 'SHA-256 over inputs, score, version, and timestamps', 'Active')}</section>
    </div>`;
}

function settingLine(title, text, badge) { return `<div class="setting-line"><div><strong>${title}</strong><span>${text}</span></div><span class="badge badge-neutral">${badge}</span></div>`; }

function renderRunner() {
  const runner = state.runner;
  const locale = runner.locale || 'en';
  const es = locale === 'es';
  const close = runner.mode === 'preview' ? `<button class="button button-secondary icon-button" data-runner-action="close" aria-label="Close">${icon('x')}</button>` : '';
  if (runner.stage === 'loading') return `<div class="candidate-stage"><section class="candidate-panel"><div class="spinner"></div><p>Loading assessment · Cargando evaluación</p></section></div>`;
  if (runner.stage === 'scenario-loading') return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-body scenario-loading"><div class="spinner"></div><h2>${es ? 'Preparando tres escenarios del puesto' : 'Preparing three job scenarios'}</h2><p>${es ? 'Las preguntas profundizan tus respuestas, pero no cambian la puntuación.' : 'The questions deepen your responses but do not change the score.'}</p></div></section></div>`;
  if (runner.stage === 'error') return `<div class="candidate-stage"><section class="candidate-panel candidate-error">${icon('alert')}<h1>Assessment unavailable · Evaluación no disponible</h1><p>${esc(runner.error || 'The invitation could not be opened. · No se pudo abrir la invitación.')}</p></section></div>`;
  if (runner.stage === 'done') return `<div class="candidate-stage"><section class="candidate-panel candidate-complete">${icon('check')}<h1>${es ? 'Gracias' : 'Thank you'}</h1><p>${es ? 'Puedes cerrar esta ventana.' : 'You may close this window.'}</p></section></div>`;
  if (runner.stage === 'language') return `<div class="modal-backdrop"><section class="modal language-modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">Gazelle Assessment</p><h2>Choose your language · Elige tu idioma</h2></div>${close}</div><div class="modal-body"><p class="language-lead">Which language would you like to use to complete the assessment?<br>¿En qué idioma deseas completar la evaluación?</p><div class="language-options"><button class="language-choice" data-language="en"><strong>English</strong><span>Continue in English</span></button><button class="language-choice" data-language="es"><strong>Español</strong><span>Continuar en español</span></button></div></div></section></div>`;
  if (runner.stage === 'experience') return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">${es ? 'Antes de comenzar' : 'Before you begin'}</p><h2>${es ? 'Experiencia laboral' : 'Work experience'}</h2></div>${close}</div><div class="modal-body"><h3 class="question-text">${es ? '¿Has tenido un empleo formal anteriormente?' : 'Have you held a formal job before?'}</h3><p>${es ? 'Tu respuesta selecciona una rama de contexto equivalente en duración. El contexto se reporta por separado y no aumenta ni reduce el índice principal.' : 'Your answer selects a context branch of equal length. Context is reported separately and does not raise or lower the main index.'}</p><div class="language-options"><button class="language-choice" data-experience="experienced"><strong>${es ? 'Sí, tengo experiencia' : 'Yes, I have experience'}</strong><span>${es ? 'Preguntas sobre compromisos laborales previos' : 'Questions about prior work commitments'}</span></button><button class="language-choice" data-experience="new"><strong>${es ? 'No, sería mi primer empleo' : 'No, this would be my first job'}</strong><span>${es ? 'Preguntas sobre otros compromisos sostenidos' : 'Questions about other sustained commitments'}</span></button></div></div></section></div>`;
  if (runner.stage === 'intro') {
    const conditions = runner.roleConditions?.[locale] || (es ? ['Horario rotativo nocturno o de fin de semana', 'Conversaciones consecutivas con clientes', 'Metas de calidad, productividad y asistencia'] : ['Rotating evening or weekend schedule', 'Back-to-back customer conversations', 'Quality, productivity, and attendance targets']);
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">${es ? 'Potencial de Permanencia' : 'Tenure Potential'}</p><h2>${esc(runner.candidate.role)}</h2></div>${close}</div><div class="modal-body"><span class="badge badge-${runner.mode === 'preview' ? 'orange' : 'teal'}">${runner.mode === 'preview' ? (es ? 'Vista previa · no se guarda' : 'Preview · not saved') : (es ? 'Evaluación registrada' : 'Recorded assessment')}</span><h3 class="question-text">${es ? `Hola, ${esc(runner.candidate.name.split(' ')[0])}.` : `Hello, ${esc(runner.candidate.name.split(' ')[0])}.`}</h3><p>${es ? 'Responde según lo que sea realista para ti hoy. No hay respuestas perfectas. Una persona revisará el resultado junto con otra información.' : 'Answer based on what is realistic for you today. There are no perfect answers. A person will review the result with other information.'}</p><div class="card card-body"><strong>${es ? 'Condiciones que debes considerar' : 'Conditions to consider'}</strong><ul class="method-list">${conditions.map((condition) => `<li>${esc(condition)}</li>`).join('')}</ul></div><div class="ai-consent-note"><strong>${es ? 'Uso de IA' : 'AI use'}</strong><p>${es ? 'Después de 27 reactivos responderás tres escenarios laborales. Un proveedor de IA puede adaptar las preguntas y generar una interpretación bilingüe con una calificación de alineación de 1 a 5. Las respuestas abiertas no cambian el índice del cuestionario.' : 'After 27 items, you will answer three job scenarios. An AI provider may adapt the questions and generate a bilingual interpretation with a 1–5 alignment rating. Open responses do not change the questionnaire index.'}</p></div><label class="consent"><input type="checkbox" id="runner-consent" ${runner.consent ? 'checked' : ''}><span>${es ? 'Entiendo el propósito, el uso de IA descrito y que este resultado no decide por sí solo una contratación.' : 'I understand the purpose, the described AI use, and that this result does not make a hiring decision by itself.'}</span></label></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="back-experience">${es ? 'Atrás' : 'Back'}</button><button class="button button-primary" data-runner-action="start" ${runner.consent ? '' : 'disabled'}>${es ? 'Comenzar' : 'Begin'}</button></div></section></div>`;
  }
  if (runner.stage === 'complete') return `<div class="modal-backdrop"><section class="modal complete-modal" role="dialog" aria-modal="true"><div class="modal-body">${icon('check')}<h2>${es ? 'Evaluación completada' : 'Assessment complete'}</h2><p>${runner.mode === 'preview' ? (es ? 'La vista previa generó un reporte local claramente identificado. No se creó un registro operativo.' : 'The preview generated a clearly labeled local report. No operational record was created.') : (es ? 'Tu respuesta fue registrada con un comprobante de auditoría. El equipo de contratación revisará el resultado.' : 'Your response was recorded with an audit fingerprint. The hiring team will review the result.')}</p><button class="button button-primary" data-runner-action="finish">${es ? 'Finalizar' : 'Finish'}</button></div></section></div>`;
  if (runner.stage === 'scenarios') {
    const scenario = runner.scenarios[runner.scenarioIndex];
    const response = runner.scenarioResponses[scenario.scenarioId] || '';
    const valid = response.trim().length >= 40;
    return `<div class="modal-backdrop"><section class="modal scenario-modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">${es ? 'Escenario laboral' : 'Job scenario'}</p><h2>${es ? 'Profundización estructurada' : 'Structured follow-up'}</h2></div>${close}</div><div class="modal-body"><div class="test-progress"><div class="progress-track"><span style="width:${(runner.scenarioIndex + 1) / 3 * 100}%"></span></div><span>${runner.scenarioIndex + 1} / 3</span></div><div class="scenario-zero-weight"><span class="badge badge-neutral">${es ? 'Peso de puntuación: 0' : 'Score weight: 0'}</span><p>${es ? 'Describe lo que harías de forma realista. No incluyas información médica, familiar ni otra información privada.' : 'Describe what you would realistically do. Do not include medical, family, or other private information.'}</p></div><h3 class="question-text">${esc(es ? scenario.question_es : scenario.question_en)}</h3><label class="field" for="scenario-response"><span>${es ? 'Tu respuesta' : 'Your response'}</span><textarea class="textarea scenario-response" id="scenario-response" maxlength="2500" placeholder="${es ? 'Explica qué harías primero, por qué y qué apoyo te ayudaría…' : 'Explain what you would do first, why, and what support would help…'}">${esc(response)}</textarea><small id="scenario-count" class="${valid ? 'valid-count' : ''}">${response.trim().length} / 40 ${es ? 'caracteres mínimos' : 'minimum characters'}</small></label></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="scenario-back">${es ? 'Atrás' : 'Back'}</button><button class="button button-primary" id="scenario-next" data-runner-action="scenario-next" ${valid && !state.busy ? '' : 'disabled'}>${state.busy ? (es ? 'Guardando…' : 'Saving…') : runner.scenarioIndex === 2 ? (es ? 'Enviar evaluación' : 'Submit assessment') : (es ? 'Continuar' : 'Continue')}</button></div></section></div>`;
  }
  const items = engine.applicableItems(runner.experienceBranch);
  const question = items[runner.index];
  const answer = runner.answers[question.id];
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">${es ? 'Potencial de Permanencia' : 'Tenure Potential'}</p><h2>${engine.DIMENSIONS[question.dimension][locale]}</h2></div>${close}</div><div class="modal-body"><div class="test-progress"><div class="progress-track"><span style="width:${(runner.index + 1) / items.length * 100}%"></span></div><span>${runner.index + 1} / ${items.length}</span></div><div class="question-kicker"><code>${question.id}</code></div><h3 class="question-text">${esc(question.text[locale])}</h3><div class="answer-scale">${engine.RESPONSE_LABELS[locale].map((label, index) => `<button class="answer-option ${answer === index + 1 ? 'selected' : ''}" data-answer="${index + 1}"><strong>${index + 1}</strong><span>${esc(label)}</span></button>`).join('')}</div></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="back" ${runner.index === 0 ? 'disabled' : ''}>${es ? 'Atrás' : 'Back'}</button><button class="button button-primary" data-runner-action="next" ${answer || state.busy ? '' : 'disabled'}>${runner.index === items.length - 1 ? (es ? 'Continuar a escenarios' : 'Continue to scenarios') : (es ? 'Continuar' : 'Continue')}</button></div></section></div>`;
}

function startPreview() {
  state.runner = { mode: 'preview', stage: 'language', token: null, locale: null, experienceBranch: null, candidate: { name: 'Preview Candidate', role: 'Bilingual Customer Care', site: 'Guatemala City' }, roleConditions: null, consent: false, index: 0, answers: {}, responseTimes: {}, scenarios: [], scenarioIndex: 0, scenarioResponses: {}, scenarioResponseTimes: {}, startedAt: null, itemStartedAt: null, scenarioStartedAt: null };
  render();
}

async function startInvite(token) {
  state.loading = false;
  state.runner = { mode: 'invite', stage: 'loading', token, locale: null, experienceBranch: null, candidate: null, roleConditions: null, consent: false, index: 0, answers: {}, responseTimes: {}, scenarios: [], scenarioIndex: 0, scenarioResponses: {}, scenarioResponseTimes: {}, startedAt: null, itemStartedAt: null, scenarioStartedAt: null };
  render();
  try {
    const data = await fetchJson(`/api/assessment?token=${encodeURIComponent(token)}`);
    state.runner = { mode: 'invite', stage: 'language', token, locale: null, experienceBranch: null, candidate: data.candidate, roleConditions: data.roleConditions, consent: false, index: 0, answers: {}, responseTimes: {}, scenarios: [], scenarioIndex: 0, scenarioResponses: {}, scenarioResponseTimes: {}, startedAt: null, itemStartedAt: null, scenarioStartedAt: null };
    render();
  } catch (error) {
    state.runner = { ...state.runner, stage: 'error', error: error.message };
    render();
  }
}

async function prepareScenarios() {
  const runner = state.runner;
  const localResult = engine.scoreAssessment({ answers: runner.answers, responseTimes: runner.responseTimes, experienceBranch: runner.experienceBranch });
  if (localResult.potentialIndex == null) { toast(runner.locale === 'es' ? 'Faltan respuestas.' : 'Some responses are missing.'); return; }
  runner.stage = 'scenario-loading';
  render();
  try {
    if (runner.mode === 'preview') {
      runner.scenarios = aiAssessment.fallbackScenarios(localResult).map((question, index) => ({ ...question, scenarioId: question.id, order: index + 1, source: 'preview_fallback' }));
    } else {
      const response = await fetchJson('/api/assessment/scenarios', { method: 'POST', body: JSON.stringify({ token: runner.token, experienceBranch: runner.experienceBranch, answers: runner.answers, responseTimes: runner.responseTimes }) });
      runner.scenarios = response.questions || [];
    }
    if (runner.scenarios.length !== 3) throw new Error(runner.locale === 'es' ? 'No se pudieron preparar los tres escenarios.' : 'The three scenarios could not be prepared.');
    runner.scenarioIndex = 0;
    runner.scenarioStartedAt = Date.now();
    runner.stage = 'scenarios';
  } catch (error) {
    runner.stage = 'questions';
    toast(error.message);
  }
  render();
}

function previewAnalysisInput(runner, scenarioResponses, durationMs) {
  return {
    role: runner.candidate.role,
    locale: runner.locale,
    experienceBranch: runner.experienceBranch,
    answers: runner.answers,
    responseTimes: runner.responseTimes,
    durationMs,
    scenarios: runner.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      construct: scenario.construct,
      question_en: scenario.question_en,
      question_es: scenario.question_es,
      evidence_item_ids: scenario.evidence_item_ids,
    })),
    scenarioResponses,
  };
}

async function requestPreviewAnalysis(input) {
  const response = await fetchJson('/api/preview/ai-analysis', { method: 'POST', body: JSON.stringify(input) });
  if (!response.analysis) throw new Error('The preview analysis response was incomplete.');
  return response.analysis;
}

async function completeAssessment() {
  const runner = state.runner;
  const durationMs = Date.now() - new Date(runner.startedAt).getTime();
  const localResult = engine.scoreAssessment({ answers: runner.answers, responseTimes: runner.responseTimes, experienceBranch: runner.experienceBranch, durationMs });
  if (localResult.potentialIndex == null) { toast(runner.locale === 'es' ? 'Faltan respuestas.' : 'Some responses are missing.'); return; }
  const scenarioResponses = runner.scenarios.map((scenario) => ({
    scenarioId: scenario.scenarioId,
    response: (runner.scenarioResponses[scenario.scenarioId] || '').trim(),
    responseMs: runner.scenarioResponseTimes[scenario.scenarioId] || 0,
  }));
  if (scenarioResponses.length !== 3 || scenarioResponses.some((entry) => entry.response.length < 40)) {
    toast(runner.locale === 'es' ? 'Completa las tres respuestas de escenarios.' : 'Complete all three scenario responses.');
    return;
  }
  state.busy = true; render();
  try {
    let auditHash = null; let result = localResult;
    if (runner.mode === 'invite') {
      const response = await fetchJson('/api/assessment/submit', { method: 'POST', body: JSON.stringify({ token: runner.token, locale: runner.locale, experienceBranch: runner.experienceBranch, answers: runner.answers, responseTimes: runner.responseTimes, scenarioResponses, startedAt: runner.startedAt }) });
      result = response.result; auditHash = response.auditHash;
      history.replaceState({}, '', location.pathname);
    } else {
      const previewInput = previewAnalysisInput(runner, scenarioResponses, durationMs);
      let aiAnalysis;
      try {
        aiAnalysis = await requestPreviewAnalysis(previewInput);
      } catch (error) {
        aiAnalysis = {
          status: error.code === 'ai_not_configured' ? 'not_configured' : 'failed',
          provider: state.health.ai?.provider || 'OpenAI',
          model: state.health.ai?.model || aiAssessment.DEFAULT_MODEL,
          prompt_version: aiAssessment.ANALYSIS_PROMPT_VERSION,
          error_code: error.code || 'preview_ai_analysis_failed',
        };
        toast(error.message);
      }
      state.previewReport = { isPreview: true, id: 'preview', candidateId: 'preview', name: runner.candidate.name, role: runner.candidate.role, site: runner.candidate.site, locale: runner.locale, experienceBranch: runner.experienceBranch, completedAt: new Date().toISOString(), durationMs, potentialIndex: result.potentialIndex, potentialBand: result.potentialBand, subscales: result.subscales, supportProfile: result.supportProfile, quality: result.quality, scoringTrace: result.scoringTrace, weights: result.weights, auditHash: null, assessmentVersion: result.assessmentVersion, modelVersion: result.modelVersion, modelStatus: result.modelStatus, scenarioResponses: runner.scenarios.map((scenario) => ({ ...scenario, scenario_id: scenario.scenarioId, response_text: runner.scenarioResponses[scenario.scenarioId], response_locale: runner.locale, response_ms: runner.scenarioResponseTimes[scenario.scenarioId], model: scenario.model || 'rules-v1', prompt_version: aiAssessment.SCENARIO_PROMPT_VERSION })), aiAnalysis, previewInput };
    }
    state.runner = { ...runner, stage: 'complete', result, auditHash };
  } catch (error) {
    toast(error.message);
  } finally { state.busy = false; render(); }
}

async function generateAiAnalysis() {
  const report = normalizedReport(reportRecord());
  if (!report) return;
  state.busy = true;
  render();
  try {
    if (report.isPreview) {
      if (!report.previewInput) throw new Error('Preview evidence is unavailable. Run the preview assessment again.');
      state.previewReport.aiAnalysis = await requestPreviewAnalysis(report.previewInput);
    } else {
      await fetchJson(`/api/assessments/${encodeURIComponent(report.id)}/ai-analysis`, { method: 'POST', body: '{}' });
      await loadWorkspace();
    }
    toast(state.reportLocale === 'es' ? 'Análisis bilingüe generado.' : 'Bilingual analysis generated.');
  } catch (error) {
    toast(error.message);
  } finally {
    state.busy = false;
    render();
  }
}

function downloadPdf() {
  const report = normalizedReport(reportRecord());
  if (!report || !pdfReport) return;
  const locale = state.reportLocale === 'es' ? 'es' : 'en';
  pdfReport.download({
    ...report,
    supportLabels: (report.supportProfile || []).slice(0, 5).map((entry) => engine.supportLabel(entry.itemId, locale)),
  }, locale);
}

async function sendInvitation(event) {
  event.preventDefault();
  const candidateId = document.getElementById('invite-candidate-id')?.value;
  const candidate = { name: document.getElementById('invite-name')?.value, email: document.getElementById('invite-email')?.value, phone: document.getElementById('invite-phone')?.value, role: document.getElementById('invite-role')?.value, site: document.getElementById('invite-site')?.value };
  const locale = document.getElementById('invite-locale')?.value || 'en';
  const testId = document.getElementById('invite-test')?.value;
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/invitations', { method: 'POST', body: JSON.stringify({ candidateId: candidateId || undefined, candidate: candidateId ? undefined : candidate, companyId: document.getElementById('invite-company')?.value, testId, locale }) });
    state.directSendReceipt = { invitationId: response.invitationId, providerMessageId: response.providerMessageId, transport: response.transport || 'smtp', status: response.status || 'accepted', candidateName: candidate.name, candidateEmail: candidate.email, locale, testId, submittedAt: new Date().toISOString() };
    state.view = 'send';
    toast('Invitation submitted through Brevo SMTP. Checking delivery.');
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function updateJourneyStage(event) {
  event.preventDefault();
  const candidateId = state.journeyCandidateId;
  state.busy = true;
  try {
    await fetchJson(`/api/candidates/${encodeURIComponent(candidateId)}/stage`, { method: 'PATCH', body: JSON.stringify({ stageId: document.getElementById('journey-stage').value, messageEn: document.getElementById('journey-stage-message-en').value, messageEs: document.getElementById('journey-stage-message-es').value }) });
    toast('Candidate stage updated.');
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function createJourneyStage(event) {
  event.preventDefault();
  state.busy = true;
  try {
    const response = await fetchJson('/api/stages', { method: 'POST', body: JSON.stringify({ companyId: document.getElementById('journey-stage-company').value, nameEn: document.getElementById('journey-stage-name-en').value, nameEs: document.getElementById('journey-stage-name-es').value }) });
    state.stages = response.stages || [];
    toast('Custom recruitment stage added.');
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function publishCandidateCommunication(event) {
  event.preventDefault();
  const candidateId = state.journeyCandidateId;
  state.busy = true;
  try {
    const response = await fetchJson(`/api/candidates/${encodeURIComponent(candidateId)}/communications`, { method: 'POST', body: JSON.stringify({ subjectEn: document.getElementById('journey-subject-en').value, subjectEs: document.getElementById('journey-subject-es').value, messageEn: document.getElementById('journey-message-en').value, messageEs: document.getElementById('journey-message-es').value, sendEmail: document.getElementById('journey-send-email').checked }) });
    toast(response.providerMessageId ? 'Update published and accepted by Brevo.' : 'Portal update published.');
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function resendCandidateTest(candidateId) {
  const candidate = state.candidates.find((entry) => entry.id === candidateId);
  const testId = document.getElementById('journey-test-id')?.value;
  if (!candidate || !testId) return;
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/invitations', { method: 'POST', body: JSON.stringify({ candidateId, testId, locale: candidate.invitation_locale || 'en' }) });
    toast(`Test resent. ${response.attempts.remaining} attempts remain.`);
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function bulkResendCandidateTests() {
  const testId = state.bulkResendTestId;
  const candidateIds = state.selectedCandidateIds.filter((candidateId) => {
    const candidate = state.candidates.find((entry) => entry.id === candidateId);
    return candidate && bulkResendEligible(candidate, testId);
  });
  if (!candidateIds.length || !testId) return;
  const approved = typeof globalThis.confirm !== 'function' || globalThis.confirm(`Resend this test to ${candidateIds.length} selected candidate${candidateIds.length === 1 ? '' : 's'}? Each accepted email uses one released attempt.`);
  if (!approved) return;
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/invitations/resend-bulk', { method: 'POST', body: JSON.stringify({ candidateIds, testId, locale: state.bulkResendLocale }) });
    state.selectedCandidateIds = [];
    state.view = 'progress';
    toast(`${response.total} test resends queued in ${response.batchCount} tracked batch${response.batchCount === 1 ? '' : 'es'}.`);
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function releaseCandidateAttempts(candidateId) {
  const testId = document.getElementById('journey-test-id')?.value;
  if (!testId) return;
  state.busy = true; render();
  try {
    const response = await fetchJson(`/api/candidates/${encodeURIComponent(candidateId)}/attempts/release`, { method: 'POST', body: JSON.stringify({ testId }) });
    toast(`Three attempts released. New limit: ${response.limit}.`);
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function updateReferralStatus(referralId, status) {
  try {
    const response = await fetchJson(`/api/referrals/${encodeURIComponent(referralId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    state.referrals = response.referrals || [];
    toast('Referral status updated.');
  } catch (error) { toast(error.message); }
  render();
}

async function submitAuth(event) {
  event.preventDefault();
  const mode = event.currentTarget.dataset.mode;
  const payload = {
    email: document.getElementById('auth-email')?.value,
    password: document.getElementById('auth-password')?.value,
    name: document.getElementById('auth-name')?.value,
    companyName: document.getElementById('auth-company')?.value,
    bootstrapToken: document.getElementById('auth-bootstrap')?.value,
  };
  state.busy = true; state.error = ''; render();
  try {
    const response = await fetchJson(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
    if (response.status === 'pending') {
      state.accountPending = true;
      state.adminAuthenticated = false;
      state.busy = false;
      render();
      return;
    }
    state.accountPending = false;
    await loadWorkspace();
  } catch (error) {
    state.error = error.message;
  } finally { state.busy = false; render(); }
}

async function signOut() {
  state.busy = true;
  try { await fetchJson('/api/auth/logout', { method: 'POST', body: '{}' }); } catch { /* Local state is cleared even if the server is unavailable. */ }
  state.user = null; state.adminAuthenticated = false; state.accountPending = false; state.authMode = 'login'; state.busy = false; state.error = ''; render();
}

async function createList(event) {
  event.preventDefault();
  const payload = { name: document.getElementById('list-name')?.value, description: document.getElementById('list-description')?.value, companyId: document.getElementById('list-company')?.value };
  state.busy = true;
  try {
    const response = await fetchJson('/api/lists', { method: 'POST', body: JSON.stringify(payload) });
    state.lists = response.lists || [];
    state.selectedListId = response.listId;
    toast('Candidate list created.');
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function updateList(event) {
  event.preventDefault();
  const list = state.lists.find((entry) => entry.id === state.selectedListId);
  if (!list) return;
  const candidateIds = [...document.querySelectorAll('input[name="list-candidate"]:checked')].map((input) => input.value);
  const testIds = [...document.querySelectorAll('input[name="list-test"]:checked')].map((input) => input.value);
  state.busy = true;
  try {
    const response = await fetchJson(`/api/lists/${encodeURIComponent(list.id)}`, { method: 'PATCH', body: JSON.stringify({ candidateIds, testIds }) });
    state.lists = response.lists || [];
    toast('List membership and tests saved.');
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function sendBatch(listId) {
  const list = state.lists.find((entry) => entry.id === listId);
  if (!list) return;
  const checkedTests = [...document.querySelectorAll('input[name="list-test"]:checked')].map((input) => input.value);
  const locale = document.getElementById('batch-locale')?.value || 'en';
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/batches', { method: 'POST', body: JSON.stringify({ listId, testIds: checkedTests.length ? checkedTests : list.test_ids, locale }) });
    toast(`Batch queued with ${response.total} candidate-test sends.`);
    state.view = 'progress';
    await loadWorkspace();
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function createTest(event) {
  event.preventDefault();
  const payload = {
    nameEn: document.getElementById('test-name-en')?.value,
    nameEs: document.getElementById('test-name-es')?.value,
    slug: document.getElementById('test-slug')?.value,
    estimatedMinutes: document.getElementById('test-minutes')?.value,
    descriptionEn: document.getElementById('test-description-en')?.value,
    descriptionEs: document.getElementById('test-description-es')?.value,
  };
  state.busy = true;
  try { const response = await fetchJson('/api/tests', { method: 'POST', body: JSON.stringify(payload) }); state.tests = response.tests || []; toast('Draft test added to the catalog.'); }
  catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function updateUserAccess(userId, status) {
  const payload = status === 'rejected' ? { status } : {
    status: 'active',
    role: document.getElementById(`approve-role-${userId}`)?.value,
    companyId: document.getElementById(`approve-company-${userId}`)?.value,
    companyName: document.getElementById(`approve-company-name-${userId}`)?.value,
  };
  state.busy = true;
  try {
    const response = await fetchJson(`/api/admin/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body: JSON.stringify(payload) });
    state.users = response.users || [];
    state.companies = response.companies || [];
    toast(status === 'rejected' ? 'Registration rejected.' : 'User approved and access assigned.');
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function changePassword(event) {
  event.preventDefault();
  const payload = { currentPassword: document.getElementById('current-password')?.value, newPassword: document.getElementById('new-password')?.value };
  state.busy = true;
  try { await fetchJson('/api/auth/password', { method: 'POST', body: JSON.stringify(payload) }); toast('Password changed. Other sessions were revoked.'); }
  catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function confirmImport() {
  if (!state.csv) return;
  const defaultRole = document.getElementById('import-default-role')?.value.trim() || '';
  const defaultSite = document.getElementById('import-default-site')?.value.trim() || '';
  const listId = document.getElementById('import-list')?.value || '';
  const companyId = document.getElementById('import-company')?.value;
  state.csv.defaultRole = defaultRole;
  state.csv.defaultSite = defaultSite;
  state.csv.listId = listId;
  const mapped = csvMappedCandidates(state.csv, defaultRole, defaultSite);
  const candidates = mapped.filter((entry) => !entry.errors.length).map((entry) => entry.candidate);
  if (!candidates.length) {
    const missing = [...new Set(mapped.flatMap((entry) => entry.errors))].join(', ');
    toast(`No valid rows yet. Check the mapping and provide: ${missing || 'name, email, and role'}.`);
    return;
  }
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/candidates/import', { method: 'POST', body: JSON.stringify({ candidates, companyId, listId: listId || undefined, defaultRole, defaultSite }) });
    state.candidates = response.candidates || [];
    if (response.lists) state.lists = response.lists;
    state.csv = null;
    state.view = listId ? 'lists' : 'candidates';
    if (listId) state.selectedListId = listId;
    toast(`${response.accepted} candidates imported${response.addedToList ? ` and ${response.addedToList} added to the list` : ''}.`);
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function testEmail() {
  const to = document.getElementById('email-test-recipient')?.value;
  if (!to) { toast('Enter a test recipient.'); return; }
  state.busy = true; render();
  try { const response = await fetchJson('/api/email/test', { method: 'POST', body: JSON.stringify({ to }) }); toast(`Brevo accepted the test via ${String(response.transport || 'provider').toUpperCase()}: ${response.providerMessageId}`); }
  catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function configureBrevoWebhook() {
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/brevo/configure-webhook', { method: 'POST', body: '{}' });
    toast(`Brevo webhook ${response.action}: ${response.webhookId || 'configured'}`);
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

function render() {
  if (aiRefreshTimer) {
    clearTimeout(aiRefreshTimer);
    aiRefreshTimer = null;
  }
  if (state.runner?.mode === 'invite') {
    document.getElementById('app').innerHTML = `<main class="candidate-app">${renderRunner()}</main>`;
    bindEvents();
    return;
  }
  if (state.adminAuthenticated === false && !state.loading) {
    document.getElementById('app').innerHTML = adminSignInPage();
    bindEvents();
    return;
  }
  const views = { home: renderHome, tests: renderTests, lists: renderLists, candidates: renderCandidates, import: renderImport, send: renderSend, progress: renderProgress, referrals: renderReferrals, reports: renderReports, team: renderTeam, settings: renderSettings };
  document.getElementById('app').innerHTML = shell(state.loading ? '<div class="loading-panel"><div class="spinner"></div><p>Loading secure workspace…</p></div>' : (views[state.view] || renderHome)());
  bindEvents();
  scheduleAiReportRefresh();
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.nav; render(); }));
  document.querySelectorAll('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => { state.authMode = button.dataset.authMode; state.accountPending = false; state.error = ''; render(); }));
  document.getElementById('auth-form')?.addEventListener('submit', submitAuth);
  document.getElementById('mobile-menu')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'reload') loadWorkspace();
    if (action === 'preview') startPreview();
    if (action === 'method') { state.view = 'reports'; state.reportTab = 'method'; render(); }
    if (action === 'confirm-import') confirmImport();
    if (action === 'bulk-resend') bulkResendCandidateTests();
    if (action === 'test-email') testEmail();
    if (action === 'configure-brevo-webhook') configureBrevoWebhook();
    if (action === 'generate-ai') generateAiAnalysis();
    if (action === 'download-pdf') downloadPdf();
    if (action === 'clear-report-filters') {
      state.reportSearch = ''; state.reportTestId = 'all'; state.reportScope = 'all'; state.reportRole = 'all'; state.reportListId = 'all'; render();
    }
    if (action === 'logout') signOut();
  }));
  document.getElementById('invite-form')?.addEventListener('submit', sendInvitation);
  document.getElementById('candidate-stage-form')?.addEventListener('submit', updateJourneyStage);
  document.getElementById('candidate-stage-create-form')?.addEventListener('submit', createJourneyStage);
  document.getElementById('candidate-communication-form')?.addEventListener('submit', publishCandidateCommunication);
  document.getElementById('list-form')?.addEventListener('submit', createList);
  document.getElementById('list-editor-form')?.addEventListener('submit', updateList);
  document.getElementById('test-form')?.addEventListener('submit', createTest);
  document.getElementById('password-form')?.addEventListener('submit', changePassword);
  document.querySelectorAll('[data-list-id]').forEach((button) => button.addEventListener('click', () => { state.selectedListId = button.dataset.listId; render(); }));
  document.querySelectorAll('[data-batch-list]').forEach((button) => button.addEventListener('click', () => sendBatch(button.dataset.batchList)));
  document.querySelectorAll('[data-approve-user]').forEach((button) => button.addEventListener('click', () => updateUserAccess(button.dataset.approveUser, 'active')));
  document.querySelectorAll('[data-reject-user]').forEach((button) => button.addEventListener('click', () => updateUserAccess(button.dataset.rejectUser, 'rejected')));
  document.getElementById('candidate-search')?.addEventListener('input', (event) => { state.search = event.target.value; render(); });
  document.getElementById('candidate-status')?.addEventListener('change', (event) => { state.filteredStatus = event.target.value; render(); });
  document.getElementById('bulk-resend-test')?.addEventListener('change', (event) => { state.bulkResendTestId = event.target.value; state.selectedCandidateIds = []; render(); });
  document.getElementById('bulk-resend-locale')?.addEventListener('change', (event) => { state.bulkResendLocale = event.target.value; });
  document.getElementById('candidate-select-visible')?.addEventListener('change', (event) => {
    const visibleEligibleIds = filteredCandidates().filter((candidate) => bulkResendEligible(candidate, state.bulkResendTestId)).map((candidate) => candidate.id);
    const selected = new Set(state.selectedCandidateIds);
    visibleEligibleIds.forEach((id) => event.target.checked ? selected.add(id) : selected.delete(id));
    state.selectedCandidateIds = [...selected];
    render();
  });
  document.querySelectorAll('.candidate-resend-checkbox').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const selected = new Set(state.selectedCandidateIds);
    checkbox.checked ? selected.add(checkbox.value) : selected.delete(checkbox.value);
    state.selectedCandidateIds = [...selected];
    render();
  }));
  document.getElementById('csv-file')?.addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const parsed = parseCsv(reader.result); state.csv = { name: file.name, ...parsed, mapping: parsed.headers.map(guessedMapping), defaultRole: 'Bilingual Customer Care', defaultSite: '', listId: '', companyId: state.user?.companyId || state.companies[0]?.id || '' }; render(); }; reader.readAsText(file); });
  document.querySelectorAll('.mapping-select').forEach((select) => select.addEventListener('change', () => {
    const column = Number(select.dataset.column);
    const target = select.value;
    if (target !== 'ignore') state.csv.mapping = state.csv.mapping.map((value, index) => index !== column && value === target ? 'ignore' : value);
    state.csv.mapping[column] = target;
    render();
  }));
  document.getElementById('import-default-role')?.addEventListener('change', (event) => { state.csv.defaultRole = event.target.value; render(); });
  document.getElementById('import-default-site')?.addEventListener('change', (event) => { state.csv.defaultSite = event.target.value; render(); });
  document.getElementById('import-company')?.addEventListener('change', (event) => { state.csv.companyId = event.target.value; });
  document.getElementById('import-list')?.addEventListener('change', (event) => {
    state.csv.listId = event.target.value;
    const list = state.lists.find((entry) => entry.id === event.target.value);
    if (list?.company_id) state.csv.companyId = list.company_id;
    render();
  });
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => {
    state.previewReport = null;
    state.reportResultId = state.results.find((result) => result.id === button.dataset.report)?.assessment_id || null;
    state.view = 'reports'; state.reportTab = 'report'; render();
  }));
  document.querySelectorAll('[data-send-candidate]').forEach((button) => button.addEventListener('click', () => { const candidate = state.candidates.find((item) => item.id === button.dataset.sendCandidate); state.view = 'send'; document.getElementById('app').innerHTML = shell(renderSend(candidate)); bindEvents(); }));
  document.querySelectorAll('[data-journey]').forEach((button) => button.addEventListener('click', () => { state.journeyCandidateId = button.dataset.journey; render(); }));
  document.querySelector?.('[data-close-journey]')?.addEventListener('click', () => { state.journeyCandidateId = null; render(); });
  document.querySelectorAll('[data-resend-test]').forEach((button) => button.addEventListener('click', () => resendCandidateTest(button.dataset.resendTest)));
  document.querySelectorAll('[data-release-attempts]').forEach((button) => button.addEventListener('click', () => releaseCandidateAttempts(button.dataset.releaseAttempts)));
  document.querySelectorAll('[data-referral-status]').forEach((select) => select.addEventListener('change', () => updateReferralStatus(select.dataset.referralStatus, select.value)));
  document.querySelectorAll('[data-report-tab]').forEach((button) => button.addEventListener('click', () => { state.reportTab = button.dataset.reportTab; render(); }));
  document.querySelectorAll('[data-report-result]').forEach((button) => button.addEventListener('click', () => { state.previewReport = null; state.reportResultId = button.dataset.reportResult; render(); }));
  document.querySelectorAll('[data-report-locale]').forEach((button) => button.addEventListener('click', () => { state.reportLocale = button.dataset.reportLocale; render(); }));
  document.getElementById('report-search')?.addEventListener('input', (event) => {
    const cursor = event.target.selectionStart;
    state.reportSearch = event.target.value;
    render();
    const input = document.getElementById('report-search');
    input?.focus();
    if (Number.isInteger(cursor)) input?.setSelectionRange(cursor, cursor);
  });
  document.getElementById('report-test-filter')?.addEventListener('change', (event) => { state.reportTestId = event.target.value; render(); });
  document.getElementById('report-scope-filter')?.addEventListener('change', (event) => { state.reportScope = event.target.value; render(); });
  document.getElementById('report-role-filter')?.addEventListener('change', (event) => { state.reportRole = event.target.value; render(); });
  document.getElementById('report-list-filter')?.addEventListener('change', (event) => { state.reportListId = event.target.value; render(); });
  if (state.runner) bindRunner();
}

function bindRunner() {
  document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => { state.runner.locale = button.dataset.language; state.runner.stage = 'experience'; render(); }));
  document.querySelectorAll('[data-experience]').forEach((button) => button.addEventListener('click', () => { state.runner.experienceBranch = button.dataset.experience; state.runner.stage = 'intro'; render(); }));
  document.getElementById('runner-consent')?.addEventListener('change', (event) => { state.runner.consent = event.target.checked; render(); });
  document.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => { const runner = state.runner; const items = engine.applicableItems(runner.experienceBranch); const item = items[runner.index]; runner.answers[item.id] = Number(button.dataset.answer); runner.responseTimes[item.id] = Math.max(0, Date.now() - runner.itemStartedAt); render(); }));
  document.getElementById('scenario-response')?.addEventListener('input', (event) => {
    const runner = state.runner;
    const scenario = runner.scenarios[runner.scenarioIndex];
    runner.scenarioResponses[scenario.scenarioId] = event.target.value;
    runner.scenarioResponseTimes[scenario.scenarioId] = Math.max(0, Date.now() - runner.scenarioStartedAt);
    const length = event.target.value.trim().length;
    const count = document.getElementById('scenario-count');
    const next = document.getElementById('scenario-next');
    if (count) { count.textContent = `${length} / 40 ${runner.locale === 'es' ? 'caracteres mínimos' : 'minimum characters'}`; count.classList.toggle('valid-count', length >= 40); }
    if (next) next.disabled = length < 40;
  });
  document.querySelectorAll('[data-runner-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.runnerAction; const runner = state.runner;
    if (action === 'close') { state.runner = null; render(); }
    if (action === 'back-experience') { runner.stage = 'experience'; render(); }
    if (action === 'start' && runner.consent) { runner.stage = 'questions'; runner.startedAt = new Date().toISOString(); runner.itemStartedAt = Date.now(); render(); }
    if (action === 'back' && runner.index > 0) { runner.index -= 1; runner.itemStartedAt = Date.now(); render(); }
    if (action === 'next') { const items = engine.applicableItems(runner.experienceBranch); if (!runner.answers[items[runner.index].id]) return; if (runner.index === items.length - 1) prepareScenarios(); else { runner.index += 1; runner.itemStartedAt = Date.now(); render(); } }
    if (action === 'scenario-back') { if (runner.scenarioIndex > 0) runner.scenarioIndex -= 1; else runner.stage = 'questions'; runner.scenarioStartedAt = Date.now(); render(); }
    if (action === 'scenario-next') { const scenario = runner.scenarios[runner.scenarioIndex]; if ((runner.scenarioResponses[scenario.scenarioId] || '').trim().length < 40) return; runner.scenarioResponseTimes[scenario.scenarioId] = Math.max(runner.scenarioResponseTimes[scenario.scenarioId] || 0, Date.now() - runner.scenarioStartedAt); if (runner.scenarioIndex === 2) completeAssessment(); else { runner.scenarioIndex += 1; runner.scenarioStartedAt = Date.now(); render(); } }
    if (action === 'finish') { if (runner.mode === 'invite') { location.assign(sessionStorage.getItem('gazelle_candidate_return') || '/candidate'); } else { state.runner = null; state.view = 'reports'; state.reportTab = 'report'; render(); } }
  }));
}

const inviteToken = new URLSearchParams(location.search).get('invite');
if (location.pathname.startsWith('/candidate')) globalThis.GazelleCandidatePortal.start();
else if (inviteToken) startInvite(inviteToken);
else { render(); loadWorkspace(); }
