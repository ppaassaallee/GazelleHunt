const engine = globalThis.GazelleAssessmentEngine;
const aiAssessment = globalThis.GazelleAiAssessment;
const pdfReport = globalThis.GazellePdfReport;

const icons = {
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
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
};

const navItems = [
  ['home', 'Home', 'home'], ['candidates', 'Candidates', 'users'], ['import', 'Import CSV', 'upload'],
  ['send', 'Send Test', 'send'], ['progress', 'Test Progress', 'clock'], ['reports', 'Results & Reports', 'file'], ['settings', 'Settings', 'settings'],
];

const state = {
  view: 'home', reportTab: 'report', reportLocale: 'en', candidates: [], filteredStatus: 'All', search: '',
  health: {
    database: false,
    email: { configured: false, provider: 'Mailgun', region: 'US', domain: null, from: null },
    ai: { configured: false, provider: 'OpenAI', model: 'gpt-5.5-2026-04-23' },
  },
  loading: true, busy: false, error: '', adminAuthenticated: null, csv: null, reportCandidateId: null, previewReport: null, runner: null,
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]);
}

function initials(name = '') { return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'TP'; }
function formatDate(value) { return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'; }
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
    state.health = await fetchJson('/api/health');
    if (state.health.database) {
      const data = await fetchJson('/api/candidates');
      state.candidates = data.candidates || [];
      state.adminAuthenticated = true;
      if (!state.reportCandidateId && state.candidates.some((candidate) => candidate.assessment_id)) {
        state.reportCandidateId = state.candidates.find((candidate) => candidate.assessment_id).id;
      }
    }
    state.error = '';
  } catch (error) {
    if (error.status === 401) {
      state.adminAuthenticated = false;
      state.error = '';
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
  const tone = ['completed', 'delivered'].includes(value) ? 'teal' : ['failed', 'permanent_fail', 'complained'].includes(value) ? 'red' : ['accepted', 'sending', 'deferred'].includes(value) ? 'orange' : 'neutral';
  return `<span class="badge badge-${tone}">${esc(value.replaceAll('_', ' '))}</span>`;
}

function shell(content) {
  const current = navItems.find(([id]) => id === state.view) || navItems[0];
  return `<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark">G</div><div><strong>Gazelle Assessment</strong><span>Tenure Potential</span></div></div><nav class="nav" aria-label="Main navigation">${navItems.map(([id, label, iconName]) => `<button class="nav-button ${state.view === id ? 'active' : ''}" data-nav="${id}">${icon(iconName)}<span>${label}</span></button>`).join('')}</nav><div class="sidebar-footer"><div class="workspace"><div class="avatar">AP</div><div><strong>Research pilot</strong><span>${engine.ASSESSMENT_VERSION}</span></div></div></div></aside><main class="main"><header class="topbar"><div class="topbar-left"><button class="button button-secondary icon-button mobile-menu" id="mobile-menu" aria-label="Open navigation">${icon('menu')}</button><div><h1>${current[1]}</h1><p>Tenure Potential Assessment · ${engine.MODEL_VERSION}</p></div></div><div class="top-actions"><span class="badge badge-${state.health.database ? 'teal' : 'orange'}">${state.health.database ? 'Audit database active' : 'Database unavailable'}</span><button class="button button-secondary icon-button" data-action="reload" aria-label="Refresh">${icon('refresh')}</button></div></header><div class="page">${state.error ? `<div class="notice notice-error">${esc(state.error)}</div>` : ''}${content}</div></main></div>${state.runner ? renderRunner() : ''}`;
}

function adminSignInPage() {
  return `<main class="candidate-app"><div class="candidate-stage"><section class="candidate-panel admin-signin">${icon('lock')}<p class="eyebrow">Gazelle Assessment</p><h1>Administrator sign-in</h1><p>Candidate assessments open only from a valid invitation link. Hiring-team records and settings require an authenticated workspace account.</p><a class="button button-primary" href="/signin-with-chatgpt?return_to=%2F">Sign in with ChatGPT</a></section></div></main>`;
}

function pageIntro(kicker, title, description, action = '') {
  return `<div class="page-intro"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function metric(label, value, note, iconName) {
  return `<article class="card metric"><div class="metric-top"><span>${label}</span>${icon(iconName)}</div><strong>${value}</strong><small>${note}</small></article>`;
}

function renderHome() {
  const completed = state.candidates.filter((candidate) => candidate.assessment_id).length;
  const active = state.candidates.filter((candidate) => candidate.invitation_id && !candidate.assessment_id).length;
  return `<div class="stack"><section class="card mission-panel"><div class="mission-copy"><span class="badge badge-teal">Evidence-first redesign</span><h2>Measure Tenure Potential, then learn what actually predicts staying.</h2><p>The candidate score is a transparent pilot index, not a probability or a hidden risk label. It separates observed fit, stay intention, and work reliability from the support conditions the employer can improve.</p><div class="mission-actions"><button class="button button-primary" data-action="preview">${icon('file')}Start test · Choose English or Spanish</button><button class="button button-secondary" data-nav="send">${icon('send')}Send real invitation</button></div><div class="language-proof"><strong>First candidate screen</strong><span>Choose your language · Elige tu idioma</span></div></div><div class="pilot-panel"><div><p class="eyebrow">Model status</p><div class="pilot-meta"><strong>Pilot · uncalibrated</strong><span>${engine.ASSESSMENT_VERSION}</span></div></div><p>No 90-day or 180-day probability is shown until local outcome data supports calibration. Every completed result stores its item responses, transformations, version, timing, quality flags, and cryptographic audit hash.</p></div></section>
    <section class="grid grid-4">${metric('Candidates', state.candidates.length, 'Persistent records', 'users')}${metric('Active invitations', active, 'Provider and delivery states', 'send')}${metric('Audited results', completed, 'Server-scored assessments', 'shield')}${metric('Email connection', state.health.email?.configured ? 'Ready' : 'Open', state.health.email?.configured ? 'Mailgun configured' : 'Credentials required', 'send')}</section>
    <div class="section-title"><div><h3>What the assessment measures</h3><p>Three scored constructs plus one separate employer-action profile.</p></div><span class="badge badge-neutral">27 items per branch</span></div>
    <section class="grid grid-4">${dimensionCard('Role reality alignment', '33⅓%', 'Schedule, location, compensation model, work intensity, and performance expectations.')}${dimensionCard('Stay intention', '33⅓%', 'Current commitment to train, invest, and stay if the stated conditions are honored.')}${dimensionCard('Work reliability', '33⅓%', 'Follow-through, recovery, self-regulation, and asking for help before problems grow.')}${dimensionCard('Support leverage', 'Not scored', 'Clear expectations, coaching, schedule notice, feedback, and psychological safety.')}</section>
    <section class="grid grid-2"><article class="card"><div class="card-header"><div><h3>Reverse-engineering result</h3><p>What the four legacy reports reveal.</p></div></div><div class="card-body stack"><div class="evidence-row"><strong>Composite</strong><span>The supplied overall scores match the rounded arithmetic mean of available subscales within 0.5 points.</span></div><div class="evidence-row"><strong>No-experience branch</strong><span>The prior-behavior measure is displayed as zero but appears excluded from the overall calculation.</span></div><div class="evidence-row"><strong>Missing evidence</strong><span>No item trace, reliability estimate, uncertainty interval, scoring version, or local validity result is shown.</span></div><button class="button button-secondary" data-action="method">Open method review</button></div></article><article class="card"><div class="card-header"><div><h3>Scientific boundary</h3><p>What makes the new system honest.</p></div>${icon('shield')}</div><div class="card-body stack"><div class="notice"><strong>No pass/fail rule.</strong> The index summarizes current responses. It does not claim that a person will stay.</div><div class="guardrail-list">${guardrail('Criterion validation', 'Link assessment versions to voluntary 90-day and 180-day outcomes.', 'Required')}${guardrail('Bilingual equivalence', 'Cognitive interviews, measurement invariance, and differential item functioning.', 'Required')}${guardrail('Adverse-impact review', 'Monitor by role and lawful groups without using protected data in scoring.', 'Required')}</div></div></article></section></div>`;
}

function dimensionCard(title, weight, text) { return `<article class="card dimension-card"><div class="dimension-head"><h3>${title}</h3><span>${weight}</span></div><p>${text}</p></article>`; }
function guardrail(title, text, badge) { return `<div class="guardrail"><div><strong>${title}</strong><span>${text}</span></div><span class="badge badge-orange">${badge}</span></div>`; }

function filteredCandidates() {
  return state.candidates.filter((candidate) => {
    const status = candidate.assessment_id ? 'Completed' : candidate.invitation_status || 'Not invited';
    const text = `${candidate.name} ${candidate.email} ${candidate.role} ${candidate.site || ''}`.toLowerCase();
    return text.includes(state.search.toLowerCase()) && (state.filteredStatus === 'All' || status.toLowerCase() === state.filteredStatus.toLowerCase());
  });
}

function renderCandidates() {
  const candidates = filteredCandidates();
  return `${pageIntro('Persistent candidate records', 'Candidates', 'Candidate, invitation, and assessment states come from the audit database.', `<button class="button button-primary" data-nav="import">${icon('plus')}Import candidates</button>`)}<section class="card"><div class="card-header"><div class="toolbar"><div class="search">${icon('search')}<input class="input" id="candidate-search" value="${esc(state.search)}" placeholder="Search candidates"></div><select class="select" id="candidate-status"><option>All</option><option>Not invited</option><option>accepted</option><option>delivered</option><option>Completed</option><option>failed</option></select></div><span class="badge badge-neutral">${candidates.length} records</span></div>${candidateTable(candidates)}</section>`;
}

function candidateTable(candidates) {
  if (!candidates.length) return `<div class="empty-panel"><h3>No candidate records yet</h3><p>Import a CSV or send a real invitation to create the first durable record.</p></div>`;
  return `<div class="table-scroll"><table><thead><tr><th>Candidate</th><th>Role / site</th><th>Invitation</th><th>Assessment</th><th>Updated</th><th></th></tr></thead><tbody>${candidates.map((candidate) => `<tr><td><div class="person"><div class="person-avatar">${initials(candidate.name)}</div><div><strong>${esc(candidate.name)}</strong><span>${esc(candidate.email)}</span></div></div></td><td><strong>${esc(candidate.role)}</strong><br><span class="empty-value">${esc(candidate.site || 'No site')}</span></td><td>${statusBadge(candidate.invitation_status)}</td><td>${candidate.assessment_id ? `<span class="score-badge">${Number(candidate.potential_index).toFixed(1)} / 100</span>` : '<span class="empty-value">Not completed</span>'}</td><td>${formatDate(candidate.updated_at)}</td><td><div class="row-actions">${candidate.assessment_id ? `<button class="row-button" data-report="${candidate.id}">Open audited report</button>` : `<button class="row-button" data-send-candidate="${candidate.id}">Invite</button>`}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(field.trim()); field = ''; if (row.some(Boolean)) rows.push(row); row = []; }
    else field += character;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return { headers: rows[0] || [], rows: rows.slice(1).filter((entry) => entry.some(Boolean)) };
}

function guessedMapping(header) {
  const value = header.toLowerCase();
  if (value.includes('name') || value.includes('nombre')) return 'name';
  if (value.includes('mail') || value.includes('correo')) return 'email';
  if (value.includes('phone') || value.includes('mobile') || value.includes('tel')) return 'phone';
  if (value.includes('role') || value.includes('position') || value.includes('puesto') || value.includes('opening')) return 'role';
  if (value.includes('site') || value.includes('location') || value.includes('sede')) return 'site';
  return 'ignore';
}

function renderImport() {
  const csv = state.csv;
  return `${pageIntro('Persistent CSV import', 'Import candidates', 'Parse locally, verify the mapping, then write valid candidate rows to the audit database.', '')}<div class="grid grid-2"><section class="card card-body"><div class="dropzone">${icon('upload')}<div><h3>${csv ? esc(csv.name) : 'Choose a candidate CSV'}</h3><p>${csv ? `${csv.rows.length} rows detected` : 'Required: name, email, and role'}</p><label class="button button-secondary" for="csv-file">${csv ? 'Choose another file' : 'Browse files'}</label><input class="file-input" id="csv-file" type="file" accept=".csv,text/csv"></div></div></section><section class="card"><div class="card-header"><div><h3>Data boundaries</h3><p>Import only data needed for the workflow.</p></div>${icon('shield')}</div><div class="card-body guardrail-list">${guardrail('Do not score protected data', 'Birth date, sex, race, ethnicity, disability, and family status stay outside the assessment model.', 'Blocked')}${guardrail('Duplicate control', 'Email is the unique candidate key; existing records are updated.', 'Active')}${guardrail('Audit event', 'Each import records the authenticated actor and accepted row count.', 'Active')}</div></section></div>${csv ? `<section class="card"><div class="card-header"><div><h3>Column mapping</h3><p>Confirm fields before writing records.</p></div><button class="button button-primary" data-action="confirm-import" ${state.busy ? 'disabled' : ''}>${icon('check')}Import ${csv.rows.length}</button></div><div class="card-body mapping-list">${csv.headers.map((header, index) => `<div class="mapping-row"><div class="source-column"><strong>${esc(header)}</strong><small>Sample: ${esc(csv.rows[0]?.[index] || '')}</small></div><span>→</span><select class="select mapping-select" data-column="${index}">${['name','email','phone','role','site','ignore'].map((target) => `<option value="${target}" ${guessedMapping(header) === target ? 'selected' : ''}>${target}</option>`).join('')}</select></div>`).join('')}</div></section>` : ''}`;
}

function renderSend(prefill = {}) {
  const emailReady = state.health.email?.configured;
  return `${pageIntro('Transactional email', 'Send Tenure Potential Assessment', 'The server creates a one-time token, stores its hash, and reports success only after Mailgun accepts the message.', `<button class="button button-secondary" data-action="preview">${icon('file')}Preview test</button>`)}<div class="grid grid-2"><section class="card"><div class="card-header"><div><h3>Candidate invitation</h3><p>English or Spanish can be suggested; the candidate chooses before starting.</p></div>${statusBadge(emailReady ? 'delivered' : 'Not configured')}</div><form class="card-body form-grid" id="invite-form"><div class="field"><label for="invite-name">Candidate name</label><input class="input" id="invite-name" required value="${esc(prefill.name || '')}"></div><div class="field"><label for="invite-email">Email</label><input class="input" id="invite-email" type="email" required value="${esc(prefill.email || '')}"></div><div class="field"><label for="invite-phone">Phone</label><input class="input" id="invite-phone" value="${esc(prefill.phone || '')}"></div><div class="field"><label for="invite-role">Role</label><input class="input" id="invite-role" required value="${esc(prefill.role || 'Bilingual Customer Care')}"></div><div class="field"><label for="invite-site">Site</label><input class="input" id="invite-site" value="${esc(prefill.site || 'Guatemala City')}"></div><div class="field"><label for="invite-locale">Suggested email language</label><select class="select" id="invite-locale"><option value="en">English</option><option value="es">Español</option></select></div><div class="form-span"><button class="button button-primary" type="submit" ${!emailReady || state.busy ? 'disabled' : ''}>${icon('send')}${state.busy ? 'Sending…' : 'Send real invitation'}</button>${!emailReady ? '<p class="field-help">Connect and verify Mailgun in Settings before sending.</p>' : ''}</div></form></section><section class="stack"><article class="card test-summary"><div class="test-main"><p class="eyebrow">Candidate-facing name</p><h3>Tenure Potential Assessment</h3><p>27 scored and context items plus three bilingual, job-related scenario questions. The scenario responses inform a separate GPT-5.5 recruiter narrative and never change the transparent index.</p><div class="notice"><strong>Score status:</strong> transparent pilot index. No retention probability or hiring cutoff is produced.</div></div></article><article class="card"><div class="card-header"><div><h3>Delivery controls</h3><p>High-deliverability requirements.</p></div></div><div class="card-body guardrail-list">${guardrail('Verified sending domain', 'SPF and DKIM must verify in Mailgun; publish DMARC with your domain policy.', emailReady ? 'Configured' : 'Open')}${guardrail('TLS required', 'Messages are submitted with required TLS and both text and HTML bodies.', 'Active')}${guardrail('Delivery webhooks', 'Delivered, failed, complaint, and unsubscribe events update invitation status.', 'Implemented')}</div></article></section></div>`;
}

function renderProgress() {
  const invited = state.candidates.filter((candidate) => candidate.invitation_id);
  return `${pageIntro('Provider and candidate events', 'Test progress', 'Invitation status is based on stored provider events and completed assessment records.', '')}<section class="grid grid-3">${metric('Accepted by provider', invited.filter((candidate) => ['accepted', 'deferred'].includes(candidate.invitation_status)).length, 'Queued or retrying delivery', 'send')}${metric('Delivered', invited.filter((candidate) => candidate.invitation_status === 'delivered').length, 'Recipient server accepted', 'check')}${metric('Completed', invited.filter((candidate) => candidate.assessment_id).length, 'Audited server score', 'shield')}</section><section class="card">${candidateTable(invited)}</section>`;
}

function reportRecord() {
  if (state.previewReport) return state.previewReport;
  return state.candidates.find((candidate) => candidate.id === state.reportCandidateId && candidate.assessment_id) || state.candidates.find((candidate) => candidate.assessment_id) || null;
}

function normalizedReport(record) {
  if (!record) return null;
  if (record.isPreview) return record;
  return {
    id: record.assessment_id, candidateId: record.id, name: record.name, email: record.email, role: record.role, site: record.site,
    locale: record.assessment_locale, experienceBranch: record.experience_branch, completedAt: record.assessment_completed_at,
    durationMs: record.duration_ms, potentialIndex: Number(record.potential_index), potentialBand: record.potential_band,
    subscales: { fit: { score: Number(record.fit_score) }, intent: { score: Number(record.intent_score) }, reliability: { score: Number(record.reliability_score) }, context: { score: record.context_score == null ? null : Number(record.context_score) } },
    supportProfile: record.support_profile || [], quality: record.response_quality || { status: 'unknown', flags: [] },
    scoringTrace: record.scoring_trace || [], weights: record.weights || {}, auditHash: record.audit_hash,
    assessmentVersion: record.assessment_version, modelVersion: record.model_version, modelStatus: record.model_status,
    scenarioResponses: record.scenario_responses || [], aiAnalysis: record.ai_analysis || null,
  };
}

function renderReports() {
  const records = state.candidates.filter((candidate) => candidate.assessment_id);
  const report = normalizedReport(reportRecord());
  const aiReady = report?.aiAnalysis?.status === 'completed';
  const canGenerateAi = report && !aiReady && (!report.isPreview || Boolean(report.previewInput));
  return `${pageIntro('Evidence with provenance', 'Results & Reports', 'Every operational result can be traced to its item responses, scoring transformations, model version, timing, scenario evidence, and audit hashes.', '')}<section class="card"><div class="tabs"><button class="tab ${state.reportTab === 'report' ? 'active' : ''}" data-report-tab="report">Tenure Potential report</button><button class="tab ${state.reportTab === 'audit' ? 'active' : ''}" data-report-tab="audit">Scoring audit</button><button class="tab ${state.reportTab === 'method' ? 'active' : ''}" data-report-tab="method">Method & validation</button></div><div class="card-body">${state.reportTab === 'method' ? renderMethod() : !report ? `<div class="empty-panel"><h3>No audited result yet</h3><p>Complete a real invitation or run the clearly labeled preview assessment.</p><button class="button button-primary" data-action="preview">Preview assessment</button></div>` : `${records.length || state.previewReport ? `<div class="toolbar report-toolbar">${records.length ? `<select class="select" id="report-select">${records.map((candidate) => `<option value="${candidate.id}" ${candidate.id === report.candidateId ? 'selected' : ''}>${esc(candidate.name)} · ${Number(candidate.potential_index).toFixed(1)}</option>`).join('')}</select>` : ''}<select class="select" id="report-locale"><option value="en" ${state.reportLocale === 'en' ? 'selected' : ''}>Report in English</option><option value="es" ${state.reportLocale === 'es' ? 'selected' : ''}>Reporte en español</option></select>${canGenerateAi ? `<button class="button button-secondary" data-action="generate-ai" ${state.busy ? 'disabled' : ''}>${icon('refresh')}${state.reportLocale === 'es' ? 'Generar análisis' : 'Generate analysis'}</button>` : ''}<button class="button button-primary" data-action="download-pdf">${icon('file')}${state.reportLocale === 'es' ? 'Descargar PDF' : 'Download PDF'}</button></div>` : ''}${state.reportTab === 'audit' ? renderAudit(report) : renderReport(report)}`}</div></section>`;
}

function reportCopy(report) {
  const es = state.reportLocale === 'es';
  const band = report.potentialBand === 'strong_observed' ? (es ? 'Potencial observado sólido' : 'Strong observed potential') : report.potentialBand === 'conditional' ? (es ? 'Potencial condicionado' : 'Conditional potential') : (es ? 'Se necesita más evidencia' : 'More evidence needed');
  return { es, band, fit: es ? 'Alineación con la realidad del puesto' : 'Role reality alignment', intent: es ? 'Intención de permanencia' : 'Stay intention', reliability: es ? 'Confiabilidad laboral' : 'Work reliability', context: es ? 'Contexto de compromiso' : 'Commitment context' };
}

function renderReport(report) {
  const copy = reportCopy(report);
  const qualityTone = report.quality.status === 'pilot_usable' ? 'teal' : 'orange';
  const supports = (report.supportProfile || []).slice(0, 3).map((entry) => engine.supportLabel(entry.itemId, copy.es ? 'es' : 'en'));
  const scenarios = report.scenarioResponses || [];
  const analysis = report.aiAnalysis?.output?.[copy.es ? 'es' : 'en'];
  const analysisStatus = report.aiAnalysis?.status || (report.isPreview ? 'not_generated' : 'queued');
  const canRetryAi = !['queued', 'processing'].includes(analysisStatus) && (!report.isPreview || Boolean(report.previewInput));
  const statusCopy = {
    queued: copy.es ? 'En cola. Actualice en unos momentos.' : 'Queued. Refresh in a moment.',
    processing: copy.es ? 'GPT-5.5 está procesando la evidencia.' : 'GPT-5.5 is processing the evidence.',
    not_configured: copy.es ? 'Agregue OPENAI_API_KEY en el entorno para generar este análisis.' : 'Add OPENAI_API_KEY to the runtime to generate this analysis.',
    failed: copy.es ? 'El análisis falló. Puede volver a intentarlo sin cambiar la puntuación.' : 'The analysis failed. It can be retried without changing the score.',
    not_generated: copy.es ? 'El análisis de vista previa todavía no se ha generado.' : 'The preview analysis has not been generated yet.',
  };
  const scenarioSection = `<section class="card card-body"><div class="section-title compact"><div><h3>${copy.es ? 'Evidencia de escenarios' : 'Scenario evidence'}</h3><p>${copy.es ? 'Respuestas abiertas para revisión; no modifican el índice.' : 'Open responses for review; they do not change the index.'}</p></div><span class="badge badge-neutral">${scenarios.length} / 3</span></div><div class="scenario-evidence">${scenarios.length ? scenarios.map((entry, index) => `<article><span>${index + 1}</span><div><strong>${esc(copy.es ? entry.question_es : entry.question_en)}</strong><p>${esc(entry.response_text)}</p><small>${esc(entry.construct || '')} · ${formatDuration(entry.response_ms)}</small></div></article>`).join('') : `<p>${copy.es ? 'Sin respuestas de escenarios en este resultado.' : 'No scenario responses are available for this result.'}</p>`}</div></section>`;
  const aiSection = `<section class="card card-body ai-report"><div class="section-title compact"><div><p class="eyebrow">${copy.es ? 'Análisis asistido' : 'Assisted analysis'}</p><h3>${analysis?.title ? esc(analysis.title) : (copy.es ? 'Análisis de reclutamiento con GPT-5.5' : 'GPT-5.5 recruiter analysis')}</h3><p>${copy.es ? 'Narrativa separada, bilingüe y vinculada a evidencia.' : 'Separate bilingual narrative tied to auditable evidence.'}</p></div><span class="badge badge-${analysis ? 'teal' : 'orange'}">${esc(analysis ? (copy.es ? '5 párrafos' : '5 paragraphs') : analysisStatus.replaceAll('_', ' '))}</span></div>${analysis?.paragraphs?.length === 5 ? `<div class="analysis-paragraphs">${analysis.paragraphs.map((paragraph, index) => `<article><span>${index + 1}</span><p>${esc(paragraph)}</p></article>`).join('')}</div><div class="interview-focus"><strong>${copy.es ? 'Enfoque para entrevista humana' : 'Human interview focus'}</strong><ul>${(analysis.interview_focus || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div><div class="ai-provenance"><code>${esc(report.aiAnalysis.model || '')}</code><code>${esc(report.aiAnalysis.prompt_version || '')}</code></div>` : `<div class="empty-analysis"><p>${esc(statusCopy[analysisStatus] || analysisStatus)}</p>${canRetryAi ? `<button class="button button-secondary" data-action="generate-ai" ${state.busy ? 'disabled' : ''}>${icon('refresh')}${copy.es ? 'Generar o reintentar' : 'Generate or retry'}</button>` : `<button class="button button-secondary" data-action="reload">${icon('refresh')}${copy.es ? 'Actualizar' : 'Refresh'}</button>`}</div>`}<div class="notice"><strong>${copy.es ? 'Revisión humana obligatoria.' : 'Human review required.'}</strong> ${copy.es ? 'La narrativa no es una evaluación clínica, no altera la puntuación y no debe usarse sola para contratar, rechazar o clasificar.' : 'The narrative is not a clinical assessment, does not alter the score, and must not be used alone to hire, reject, or rank.'}</div></section>`;
  return `<div class="report-shell"><aside class="card report-profile"><div class="score-ring" style="--score-angle:${report.potentialIndex / 100 * 360}deg"><div><strong>${report.potentialIndex.toFixed(1)}</strong><span>/ 100</span></div></div><span class="badge badge-orange">${copy.es ? 'Piloto sin calibrar' : 'Uncalibrated pilot'}</span><h3>${esc(report.name)}</h3><p>${esc(report.role)} · ${esc(report.site || '')}</p><strong class="report-band">${copy.band}</strong><div class="confidence">${copy.es ? 'Este índice resume las respuestas actuales. No es una probabilidad de permanencia ni una decisión de contratación.' : 'This index summarizes current responses. It is not a retention probability or a hiring decision.'}</div></aside><div class="report-main"><section class="card card-body"><div class="section-title compact"><div><h3>${copy.es ? 'Perfil de evidencia' : 'Evidence profile'}</h3><p>${copy.es ? 'Pesos iguales y transparentes durante el piloto.' : 'Transparent equal weights during the pilot.'}</p></div><span class="badge badge-${qualityTone}">${esc(report.quality.status.replaceAll('_', ' '))}</span></div>${dimensionBar(copy.fit, report.subscales.fit.score)}${dimensionBar(copy.intent, report.subscales.intent.score)}${dimensionBar(copy.reliability, report.subscales.reliability.score)}${dimensionBar(copy.context, report.subscales.context.score, true)}</section>${aiSection}${scenarioSection}<div class="grid grid-2"><div class="report-block"><h4>${copy.es ? 'Palancas de permanencia' : 'Retention support levers'}</h4><ul>${supports.length ? supports.map((label) => `<li>${esc(label)}</li>`).join('') : `<li>${copy.es ? 'No disponibles' : 'Not available'}</li>`}</ul><p>${copy.es ? 'Estas preferencias no aumentan ni reducen el índice; orientan acciones del empleador.' : 'These preferences do not raise or lower the index; they guide employer actions.'}</p></div><div class="report-block"><h4>${copy.es ? 'Límites de interpretación' : 'Interpretation limits'}</h4><p>${copy.es ? 'No existe todavía una tasa local calibrada de permanencia a 90 o 180 días. El contexto laboral o no laboral se muestra por separado hasta validar la equivalencia de las ramas.' : 'No locally calibrated 90-day or 180-day retention probability exists yet. Work or non-work context is separate until branch equivalence is validated.'}</p></div></div><div class="notice"><strong>${copy.es ? 'Revisión humana obligatoria.' : 'Human review required.'}</strong> ${copy.es ? 'No use este resultado por sí solo para contratar, rechazar o clasificar candidatos.' : 'Do not use this result alone to hire, reject, or rank candidates.'}</div></div></div>`;
}

function dimensionBar(label, value, contextual = false) {
  if (value == null) return `<div class="dimension-score"><span>${label}</span><div class="progress-track"></div><strong>—</strong></div>`;
  return `<div class="dimension-score ${contextual ? 'contextual' : ''}"><span>${label}${contextual ? ' *' : ''}</span><div class="progress-track"><span style="width:${value}%"></span></div><strong>${Number(value).toFixed(1)}</strong></div>`;
}

function renderAudit(report) {
  const flags = report.quality.flags || [];
  const ai = report.aiAnalysis || {};
  const scenarioRows = report.scenarioResponses || [];
  return `<div class="stack"><section class="audit-banner"><div>${icon('shield')}<div><strong>Cryptographic result fingerprint</strong><code>${esc(report.auditHash || 'Preview result - no server hash')}</code></div></div><span class="badge badge-${report.auditHash ? 'teal' : 'orange'}">${report.auditHash ? 'Server recorded' : 'Preview only'}</span></section><div class="grid grid-3">${auditFact('Assessment version', report.assessmentVersion)}${auditFact('Scoring model', report.modelVersion)}${auditFact('Model status', report.modelStatus)}${auditFact('Locale', report.locale)}${auditFact('Experience branch', report.experienceBranch)}${auditFact('Duration', formatDuration(report.durationMs))}${auditFact('Completed', formatDate(report.completedAt))}${auditFact('Items scored', report.scoringTrace.length)}${auditFact('Quality status', report.quality.status)}</div><section class="card"><div class="card-header"><div><h3>AI analysis provenance</h3><p>The narrative is versioned and hashed separately from the transparent score.</p></div><span class="badge badge-${ai.status === 'completed' ? 'teal' : 'orange'}">${esc(ai.status || 'not available')}</span></div><div class="card-body grid grid-3">${auditFact('AI model', ai.model)}${auditFact('Prompt version', ai.prompt_version)}${auditFact('Provider response', ai.provider_response_id)}${auditFact('Evidence hash', ai.evidence_hash)}${auditFact('Output hash', ai.output_hash)}${auditFact('Updated', formatDate(ai.updated_at))}</div></section><section class="card"><div class="card-header"><div><h3>Scenario provenance</h3><p>Question source, model, prompt version, response language, and timing.</p></div><span class="badge badge-neutral">${scenarioRows.length} responses</span></div><div class="table-scroll"><table><thead><tr><th>ID</th><th>Construct</th><th>Source</th><th>Model</th><th>Prompt</th><th>Locale</th><th>Time</th></tr></thead><tbody>${scenarioRows.map((entry) => `<tr><td><code>${esc(entry.scenario_id)}</code></td><td>${esc(entry.construct)}</td><td>${esc(entry.source)}</td><td>${esc(entry.model)}</td><td>${esc(entry.prompt_version)}</td><td>${esc(entry.response_locale)}</td><td>${formatDuration(entry.response_ms)}</td></tr>`).join('')}</tbody></table></div></section><section class="card"><div class="card-header"><div><h3>Response-quality checks</h3><p>Flags trigger human review; they never silently change a score.</p></div></div><div class="card-body">${flags.length ? `<div class="guardrail-list">${flags.map((flag) => guardrail(flag.code.replaceAll('_', ' '), JSON.stringify(flag), flag.severity)).join('')}</div>` : '<span class="badge badge-teal">No response-quality flags</span>'}</div></section><section class="card"><div class="card-header"><div><h3>Item-level scoring trace</h3><p>Raw response, reverse-scoring rule, transformed value, timing, and index inclusion.</p></div></div><div class="table-scroll"><table><thead><tr><th>Item ID</th><th>Dimension</th><th>Raw</th><th>Reverse</th><th>Transformed</th><th>0-100 contribution</th><th>Time</th><th>Index</th></tr></thead><tbody>${report.scoringTrace.map((entry) => `<tr><td><code>${esc(entry.itemId)}</code></td><td>${esc(entry.dimension)}</td><td>${entry.rawResponse}</td><td>${entry.reverseScored ? 'Yes' : 'No'}</td><td>${entry.transformedResponse}</td><td>${entry.scaledContribution}</td><td>${Math.round(entry.responseMs / 1000)}s</td><td>${entry.includedInPotentialIndex ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table></div></section><div class="notice"><strong>Reproducibility:</strong> potential index = mean(role reality alignment, stay intention, work reliability). The AI narrative and scenarios have zero score weight.</div></div>`;
}

function auditFact(label, value) { return `<article class="card audit-fact"><span>${label}</span><strong>${esc(value ?? '—')}</strong></article>`; }

function renderMethod() {
  return `<div class="stack"><section class="card"><div class="card-header"><div><h3>Legacy report reverse engineering</h3><p>Four supplied reports, anonymized for analysis.</p></div></div><div class="table-scroll"><table><thead><tr><th>Case</th><th>Experience</th><th>Reported overall</th><th>Mean of available measures</th><th>Difference</th></tr></thead><tbody><tr><td>A</td><td>No</td><td>49</td><td>48.67</td><td>0.33</td></tr><tr><td>B</td><td>No</td><td>79</td><td>79.33</td><td>0.33</td></tr><tr><td>C</td><td>Yes</td><td>80</td><td>79.50</td><td>0.50</td></tr><tr><td>D</td><td>Yes</td><td>42</td><td>42.50</td><td>0.50</td></tr></tbody></table></div></section><div class="grid grid-2"><section class="card card-body"><h3>What can be inferred</h3><ul class="method-list"><li>The overall score is consistent with an unweighted mean of available subscales followed by rounding.</li><li>The no-experience branch appears to exclude the unscored prior-behavior measure rather than treating the displayed zero as evidence.</li><li>The reports use norm-referenced 0–100 scores and narrative bands, but the supplied examples are insufficient to recover exact cut scores.</li><li>The local comparison is explicitly unavailable below 200 examined candidates.</li></ul></section><section class="card card-body"><h3>What cannot be inferred</h3><ul class="method-list"><li>Original items, item keys, transformations, internal precision, norm sample, and actual model coefficients.</li><li>Reliability, construct structure, language equivalence, subgroup performance, and criterion validity for the role/site.</li><li>Whether the reported band is calibrated to a probability of voluntary exit.</li></ul></section></div><section class="card"><div class="card-header"><div><h3>Validation plan before predictive claims</h3><p>The score stays descriptive until these gates are passed.</p></div></div><div class="card-body validation-grid">${validationStep('1', 'Content evidence', 'I/O psychologist review, role analysis, candidate cognitive interviews, and documented item rationale.')}${validationStep('2', 'Bilingual adaptation', 'Independent translation review, cognitive debriefs, measurement invariance, and DIF checks by language/country.')}${validationStep('3', 'Pilot reliability', 'Item distributions, omega reliability, test–retest where appropriate, response-quality rates, and branch analysis.')}${validationStep('4', 'Criterion model', 'Pre-register voluntary 90/180-day outcomes; fit an interpretable survival or discrete-time model on local data.')}${validationStep('5', 'Holdout evaluation', 'Calibration curve/intercept/slope, Brier score, C-index or AUC, confidence intervals, and site/role transport checks.')}${validationStep('6', 'Fairness and use', 'Selection-rate and score analyses, alternative procedures, human review rules, and documented change control.')}</div></section></div>`;
}

function validationStep(number, title, text) { return `<div class="validation-step"><span>${number}</span><div><strong>${title}</strong><p>${text}</p></div></div>`; }

function renderSettings() {
  const email = state.health.email || {};
  const ai = state.health.ai || {};
  const webhookUrl = `${location.origin}/api/mailgun/webhook`;
  return `${pageIntro('Secure runtime configuration', 'Settings', 'Email and OpenAI credentials stay server-side; the browser sees only connection status and safe metadata.', `<button class="button button-secondary" data-action="reload">${icon('refresh')}Refresh status</button>`)}<div class="grid grid-2"><section class="card settings-card"><div class="settings-title"><div><h3>Mailgun delivery</h3><p>Real REST API integration with verified-domain sending.</p></div><span class="badge badge-${email.configured ? 'teal' : 'orange'}">${email.configured ? 'Connected' : 'Not connected'}</span></div>${settingLine('Provider', 'Mailgun Email API', 'Implemented')}${settingLine('Region', email.region || 'US', 'Configured')}${settingLine('Sending domain', email.domain || 'Missing MAILGUN_DOMAIN', email.domain ? 'Present' : 'Required')}${settingLine('Sender', email.from || 'Missing MAILGUN_FROM', email.from ? 'Present' : 'Required')}<div class="field email-test"><label for="email-test-recipient">Connection test recipient</label><div class="inline-field"><input class="input" id="email-test-recipient" type="email" placeholder="you@company.com"><button class="button button-primary" data-action="test-email" ${!email.configured || state.busy ? 'disabled' : ''}>Send test</button></div><small>A successful test means Mailgun accepted the message. Delivery is confirmed separately through the signed webhook.</small></div></section><section class="card settings-card"><h3>Connect Mailgun</h3><p>Complete these steps once, in order.</p><ol class="setup-list"><li><strong>Add a dedicated sending subdomain in Mailgun.</strong><span>Example: <code>assessment.yourcompany.com</code>. Select the correct US or EU region.</span></li><li><strong>Publish and verify the DNS records.</strong><span>Add Mailgun's SPF and DKIM records, then add DMARC under your organization's policy.</span></li><li><strong>Create a domain sending key and the hosted runtime values.</strong><span><code>MAILGUN_API_KEY</code>, <code>MAILGUN_DOMAIN</code>, <code>MAILGUN_FROM</code>, <code>MAILGUN_REGION</code>, and <code>MAILGUN_WEBHOOK_SIGNING_KEY</code>. Keep both keys secret.</span></li><li><strong>Register signed webhooks.</strong><span>Use <code>${esc(webhookUrl)}</code> for accepted, delivered, temporary fail, permanent fail, complained, and unsubscribed events.</span></li><li><strong>Refresh and send a connection test.</strong><span>The status above changes to Connected when all sending and webhook values are present.</span></li></ol><p class="settings-link"><a href="https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-verify" target="_blank" rel="noreferrer">Open Mailgun domain-verification documentation</a></p></section><section class="card settings-card"><div class="settings-title"><div><h3>GPT-5.5 analysis</h3><p>Structured bilingual recruiter narrative with separate evidence and output hashes.</p></div><span class="badge badge-${ai.configured ? 'teal' : 'orange'}">${ai.configured ? 'Connected' : 'Not connected'}</span></div>${settingLine('Provider', 'OpenAI Responses API', 'Implemented')}${settingLine('Model', ai.model || 'gpt-5.5-2026-04-23', 'Pinned')}${settingLine('Scenario prompt', ai.scenarioPromptVersion || 'scenario-v1.0.0', 'Versioned')}${settingLine('Analysis prompt', ai.analysisPromptVersion || 'analysis-v1.0.0', 'Versioned')}<div class="notice"><strong>Configuration:</strong> add <code>OPENAI_API_KEY</code> as a secret and optionally set <code>OPENAI_MODEL</code>. Candidate identity and contact fields are excluded from AI evidence.</div></section><section class="card settings-card"><h3>AI governance</h3><p>Controls enforced by the current build.</p>${settingLine('Score contribution', 'Zero; narrative is separate from the index', 'Locked')}${settingLine('Automatic hiring action', 'No hire, reject, pass, fail, or ranking output', 'Blocked')}${settingLine('Clinical interpretation', 'Diagnosis and protected-trait inference prohibited', 'Blocked')}${settingLine('Human review', 'Required with other job-related evidence', 'Required')}</section><section class="card settings-card"><h3>Assessment governance</h3><p>Controls enforced by the current build.</p>${settingLine('Automatic rejection', 'Disabled by product design', 'Locked off')}${settingLine('Model status', 'Pilot · uncalibrated', engine.MODEL_VERSION)}${settingLine('Assessment version', engine.ASSESSMENT_VERSION, 'Versioned')}${settingLine('Result fingerprint', 'SHA-256 over inputs, score, version, and timestamps', 'Active')}</section><section class="card settings-card"><h3>Data and access</h3><p>Current private workspace architecture.</p>${settingLine('Structured records', 'Platform database', state.health.database ? 'Active' : 'Unavailable')}${settingLine('Admin attribution', 'Authenticated workspace email header', 'Server-side')}${settingLine('Candidate invitation', 'One-time random token; only hash stored', 'Implemented')}${settingLine('Candidate access', 'Public or candidate-authenticated hosting is required before external delivery', 'Action required')}${settingLine('Secret handling', 'Hosted runtime variables only', 'Server-side')}</section></div>`;
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
    return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-header"><div><p class="eyebrow">${es ? 'Potencial de Permanencia' : 'Tenure Potential'}</p><h2>${esc(runner.candidate.role)}</h2></div>${close}</div><div class="modal-body"><span class="badge badge-${runner.mode === 'preview' ? 'orange' : 'teal'}">${runner.mode === 'preview' ? (es ? 'Vista previa · no se guarda' : 'Preview · not saved') : (es ? 'Evaluación registrada' : 'Recorded assessment')}</span><h3 class="question-text">${es ? `Hola, ${esc(runner.candidate.name.split(' ')[0])}.` : `Hello, ${esc(runner.candidate.name.split(' ')[0])}.`}</h3><p>${es ? 'Responde según lo que sea realista para ti hoy. No hay respuestas perfectas. Una persona revisará el resultado junto con otra información.' : 'Answer based on what is realistic for you today. There are no perfect answers. A person will review the result with other information.'}</p><div class="card card-body"><strong>${es ? 'Condiciones que debes considerar' : 'Conditions to consider'}</strong><ul class="method-list">${conditions.map((condition) => `<li>${esc(condition)}</li>`).join('')}</ul></div><div class="ai-consent-note"><strong>${es ? 'Uso de IA' : 'AI use'}</strong><p>${es ? 'Después de 27 reactivos responderás tres escenarios laborales. GPT-5.5 puede adaptar esas preguntas y generar una narrativa bilingüe para el reclutador. Las respuestas abiertas no cambian tu puntuación y una persona debe revisar el reporte.' : 'After 27 items, you will answer three job scenarios. GPT-5.5 may adapt those questions and generate a bilingual recruiter narrative. Open responses do not change your score, and a person must review the report.'}</p></div><label class="consent"><input type="checkbox" id="runner-consent" ${runner.consent ? 'checked' : ''}><span>${es ? 'Entiendo el propósito, el uso de IA descrito y que este resultado no decide por sí solo una contratación.' : 'I understand the purpose, the described AI use, and that this result does not make a hiring decision by itself.'}</span></label></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="back-experience">${es ? 'Atrás' : 'Back'}</button><button class="button button-primary" data-runner-action="start" ${runner.consent ? '' : 'disabled'}>${es ? 'Comenzar' : 'Begin'}</button></div></section></div>`;
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
          status: error.code === 'openai_not_configured' ? 'not_configured' : 'failed',
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
  const candidate = { name: document.getElementById('invite-name')?.value, email: document.getElementById('invite-email')?.value, phone: document.getElementById('invite-phone')?.value, role: document.getElementById('invite-role')?.value, site: document.getElementById('invite-site')?.value };
  const locale = document.getElementById('invite-locale')?.value || 'en';
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/invitations', { method: 'POST', body: JSON.stringify({ candidate, locale }) });
    toast(`Mailgun accepted the invitation: ${response.providerMessageId}`);
    await loadWorkspace(); state.view = 'progress';
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function confirmImport() {
  if (!state.csv) return;
  const mapping = [...document.querySelectorAll('.mapping-select')].map((select) => select.value);
  const candidates = state.csv.rows.map((row) => {
    const record = {}; mapping.forEach((target, index) => { if (target !== 'ignore') record[target] = row[index] || ''; }); return record;
  });
  state.busy = true; render();
  try {
    const response = await fetchJson('/api/candidates/import', { method: 'POST', body: JSON.stringify({ candidates }) });
    state.candidates = response.candidates || []; state.csv = null; state.view = 'candidates'; toast(`${response.accepted} candidates written to the audit database.`);
  } catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

async function testEmail() {
  const to = document.getElementById('email-test-recipient')?.value;
  if (!to) { toast('Enter a test recipient.'); return; }
  state.busy = true; render();
  try { const response = await fetchJson('/api/email/test', { method: 'POST', body: JSON.stringify({ to }) }); toast(`Mailgun accepted the test: ${response.providerMessageId}`); }
  catch (error) { toast(error.message); }
  finally { state.busy = false; render(); }
}

function render() {
  if (state.runner?.mode === 'invite') {
    document.getElementById('app').innerHTML = `<main class="candidate-app">${renderRunner()}</main>`;
    bindEvents();
    return;
  }
  if (state.adminAuthenticated === false && !state.loading) {
    document.getElementById('app').innerHTML = adminSignInPage();
    return;
  }
  const views = { home: renderHome, candidates: renderCandidates, import: renderImport, send: renderSend, progress: renderProgress, reports: renderReports, settings: renderSettings };
  document.getElementById('app').innerHTML = shell(state.loading ? '<div class="loading-panel"><div class="spinner"></div><p>Loading secure workspace…</p></div>' : (views[state.view] || renderHome)());
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => { state.view = button.dataset.nav; render(); }));
  document.getElementById('mobile-menu')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'reload') loadWorkspace();
    if (action === 'preview') startPreview();
    if (action === 'method') { state.view = 'reports'; state.reportTab = 'method'; render(); }
    if (action === 'confirm-import') confirmImport();
    if (action === 'test-email') testEmail();
    if (action === 'generate-ai') generateAiAnalysis();
    if (action === 'download-pdf') downloadPdf();
  }));
  document.getElementById('invite-form')?.addEventListener('submit', sendInvitation);
  document.getElementById('candidate-search')?.addEventListener('input', (event) => { state.search = event.target.value; render(); });
  document.getElementById('candidate-status')?.addEventListener('change', (event) => { state.filteredStatus = event.target.value; render(); });
  document.getElementById('csv-file')?.addEventListener('change', (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { state.csv = { name: file.name, ...parseCsv(reader.result) }; render(); }; reader.readAsText(file); });
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => { state.previewReport = null; state.reportCandidateId = button.dataset.report; state.view = 'reports'; state.reportTab = 'report'; render(); }));
  document.querySelectorAll('[data-send-candidate]').forEach((button) => button.addEventListener('click', () => { const candidate = state.candidates.find((item) => item.id === button.dataset.sendCandidate); state.view = 'send'; document.getElementById('app').innerHTML = shell(renderSend(candidate)); bindEvents(); }));
  document.querySelectorAll('[data-report-tab]').forEach((button) => button.addEventListener('click', () => { state.reportTab = button.dataset.reportTab; render(); }));
  document.getElementById('report-select')?.addEventListener('change', (event) => { state.previewReport = null; state.reportCandidateId = event.target.value; render(); });
  document.getElementById('report-locale')?.addEventListener('change', (event) => { state.reportLocale = event.target.value; render(); });
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
    if (action === 'finish') { if (runner.mode === 'invite') { runner.stage = 'done'; render(); } else { state.runner = null; state.view = 'reports'; state.reportTab = 'report'; render(); } }
  }));
}

const inviteToken = new URLSearchParams(location.search).get('invite');
if (inviteToken) startInvite(inviteToken); else { render(); loadWorkspace(); }
