const STORAGE_KEY = 'gazelle-assessment-live-v1';

const icons = {
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
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
  dollar: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

function icon(name, label = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${label ? 'false' : 'true'}"${label ? ` aria-label="${label}"` : ''}>${icons[name] || ''}</svg>`;
}

const navItems = [
  ['home', 'Home', 'home'],
  ['candidates', 'Candidates', 'users'],
  ['import', 'Import CSV', 'upload'],
  ['send', 'Send Test', 'send'],
  ['progress', 'Test Progress', 'clock'],
  ['reports', 'Results & Reports', 'file'],
  ['settings', 'Settings', 'settings'],
];

const testQuestions = [
  { id: 'history_1', dimension: 'Work history', text: 'Across your two most recent roles, how consistently did you complete the work commitments you accepted?' },
  { id: 'history_2', dimension: 'Work history', text: 'How often have you stayed in a role long enough to become fully independent in the work?' },
  { id: 'traits_1', dimension: 'Reliability traits', text: 'When work becomes repetitive, how consistently do you maintain the same level of care?' },
  { id: 'traits_2', dimension: 'Reliability traits', text: 'How comfortable are you asking for support before a small work problem becomes a larger one?' },
  { id: 'fit_1', dimension: 'Job reality fit', text: 'This role includes rotating evening or weekend shifts. How workable is that schedule for you?' },
  { id: 'fit_2', dimension: 'Job reality fit', text: 'This role involves back-to-back customer conversations and measured performance targets. How well does that match the work you want?' },
  { id: 'intent_1', dimension: 'Intention to stay', text: 'If the schedule, pay, and work conditions match what was described, how likely are you to remain for at least six months?' },
  { id: 'intent_2', dimension: 'Intention to stay', text: 'How interested are you in building experience in this type of customer operations role?' },
];

const initialState = {
  view: 'home',
  reportTab: 'individual',
  search: '',
  statusFilter: 'All',
  reportCandidateId: 1,
  selectedToSend: [5],
  csv: null,
  settings: {
    company: 'Gazelle Assessment',
    defaultRole: 'Bilingual Customer Care',
    site: 'Guatemala City',
    assessmentLanguage: 'English',
    humanReview: true,
    fairnessMonitoring: true,
    autoReject: false,
  },
  candidates: [
    { id: 1, name: 'Maya Torres', email: 'maya.torres@example.com', phone: '+502 5550 0192', role: 'Bilingual Customer Care', site: 'Guatemala City', status: 'Report ready', invitation: 'Delivered', progress: 100, score: 4.2, updated: 'Today, 9:40 AM', dimensions: { history: 4.0, traits: 4.4, fit: 4.3, intent: 4.1 } },
    { id: 2, name: 'Jordan Lee', email: 'jordan.lee@example.com', phone: '+57 315 555 0134', role: 'Customer Retention', site: 'Bogota', status: 'In progress', invitation: 'Delivered', progress: 50, score: null, updated: 'Today, 8:15 AM' },
    { id: 3, name: 'Elena Ruiz', email: 'elena.ruiz@example.com', phone: '+52 55 5550 0188', role: 'Customer Care', site: 'Mexico City', status: 'Invitation sent', invitation: 'Delivered', progress: 0, score: null, updated: 'Yesterday, 4:22 PM' },
    { id: 4, name: 'Chris Morgan', email: 'chris.morgan@example.com', phone: '+502 5550 0107', role: 'Bilingual Customer Care', site: 'Guatemala City', status: 'Email failed', invitation: 'Failed', progress: 0, score: null, updated: 'Yesterday, 2:05 PM' },
    { id: 5, name: 'Ari Patel', email: 'ari.patel@example.com', phone: '+57 315 555 0151', role: 'Chat Support', site: 'Medellin', status: 'Ready to send', invitation: 'Not sent', progress: 0, score: null, updated: 'Today, 10:10 AM' },
  ],
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...initialState, ...saved, settings: { ...initialState.settings, ...saved.settings } } : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

let state = loadState();
let runner = null;

function persist() {
  const safe = { ...state, csv: null, view: 'home' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function setState(patch, shouldPersist = true) {
  state = { ...state, ...patch };
  if (shouldPersist) persist();
  render();
}

function initials(name) { return name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase(); }
function esc(value = '') { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]); }

function statusBadge(status) {
  const tone = status === 'Report ready' ? 'teal' : status === 'Email failed' ? 'red' : status === 'In progress' || status === 'Invitation sent' ? 'orange' : 'neutral';
  return `<span class="badge badge-${tone}">${esc(status)}</span>`;
}

function toast(message) {
  const region = document.getElementById('toast-region');
  const element = document.createElement('div');
  element.className = 'toast';
  element.textContent = message;
  region.appendChild(element);
  window.setTimeout(() => element.remove(), 3200);
}

function shell(content) {
  const current = navItems.find(([id]) => id === state.view) || navItems[0];
  return `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand"><div class="brand-mark">G</div><div><strong>Gazelle Assessment</strong><span>Early-tenure pilot</span></div></div>
        <nav class="nav" aria-label="Main navigation">
          ${navItems.map(([id, label, iconName]) => `<button class="nav-button ${state.view === id ? 'active' : ''}" data-nav="${id}">${icon(iconName)}<span>${label}</span></button>`).join('')}
        </nav>
        <div class="sidebar-footer"><div class="workspace"><div class="avatar">AP</div><div><strong>Recruiter Admin</strong><span>Pilot workspace</span></div></div></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="button button-secondary icon-button mobile-menu" id="mobile-menu" aria-label="Open navigation">${icon('menu')}</button>
            <div><h1>${current[1]}</h1><p>Tenure Prediction Test — Expanded Stability Model</p></div>
          </div>
          <div class="top-actions"><span class="badge badge-orange">Pilot · Week 4 of 13</span><button class="button button-secondary icon-button" data-action="open-settings" aria-label="Open settings">${icon('settings')}</button></div>
        </header>
        <div class="page">${content}</div>
      </main>
    </div>
    ${runner ? renderRunner() : ''}`;
}

function pageIntro(kicker, title, description, action = '') {
  return `<div class="page-intro"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function renderHome() {
  const counts = {
    candidates: state.candidates.length,
    sent: state.candidates.filter((c) => c.invitation !== 'Not sent').length,
    progress: state.candidates.filter((c) => c.status === 'In progress').length,
    reports: state.candidates.filter((c) => c.status === 'Report ready').length,
  };
  const dimensions = [
    ['Work history', '25%', 'Structured evidence about reliability, tenure, and work commitments.'],
    ['Reliability traits', '25%', 'Persistence, consistency, support-seeking, and steady work behavior.'],
    ['Job reality fit', '30%', 'Alignment with the actual schedule, customer intensity, metrics, and work setting.'],
    ['Intention to stay', '20%', 'Near-term commitment when the stated job conditions are accurate.'],
  ];
  return `
    <div class="stack">
      <section class="card mission-panel">
        <div class="mission-copy"><span class="badge badge-teal">90-day pilot</span><h2>Make early tenure measurable, explainable, and fair.</h2><p>Run one focused stability assessment for high-volume BPO hiring. Use the result as structured evidence alongside interviews, job simulation, account fit, and human judgment.</p><div class="mission-actions"><button class="button button-primary" data-action="import">${icon('upload')}Import candidates</button><button class="button button-secondary" data-action="send-view">${icon('send')}Send assessment</button></div></div>
        <div class="pilot-panel"><div><p class="eyebrow">Pilot readiness</p><div class="pilot-meta"><strong>4 of 6 controls</strong><span>Before launch</span></div></div><div class="meter"><span style="width:66.7%"></span></div><p>Complete the local validity plan and email setup before using results in a live selection process.</p><button class="button button-teal" data-action="pilot-review">Review pilot controls</button></div>
      </section>
      <section class="grid grid-4">
        ${metric('Candidates', counts.candidates, 'Pilot workspace', 'users')}
        ${metric('Invitations', counts.sent, 'Delivered or attempted', 'send')}
        ${metric('In progress', counts.progress, 'Candidate activity', 'clock')}
        ${metric('Reports ready', counts.reports, 'Human review required', 'file')}
      </section>
      <div class="section-title"><div><h3>Expanded Stability Model</h3><p>Four interpretable dimensions, weighted for early-tenure relevance.</p></div><span class="badge badge-neutral">10–12 minutes</span></div>
      <section class="grid grid-4">${dimensions.map(([title, weight, text]) => `<article class="card dimension-card"><div class="dimension-head"><h3>${title}</h3><span>${weight}</span></div><p>${text}</p></article>`).join('')}</section>
      <section class="grid grid-2">
        <article class="card"><div class="card-header"><div><h3>Next actions</h3><p>Tasks that move the pilot toward a defensible launch.</p></div></div><div class="card-body action-list">
          ${actionItem(1, 'Confirm realistic job preview', 'Schedule, pay, metrics, supervision, and work setting.', 'send-view', 'Review')}
          ${actionItem(2, 'Set local validation cohorts', 'Baseline, assessment, assessment + preview, internal model.', 'pilot-review', 'Configure')}
          ${actionItem(3, 'Connect a verified sender', 'Production invitations need an authenticated company domain.', 'open-settings', 'Set up')}
        </div></article>
        <article class="card"><div class="card-header"><div><h3>Decision boundary</h3><p>What this assessment may and may not do.</p></div>${icon('shield')}</div><div class="card-body stack"><div class="notice"><strong>No automatic rejection.</strong> The score is a structured tenure-confidence signal, not a hiring decision or a promise that someone will stay.</div><div class="guardrail-list"><div class="guardrail"><div><strong>Use with</strong><span>Structured interview, job simulation, account fit, and local evidence.</span></div><span class="badge badge-teal">Required</span></div><div class="guardrail"><div><strong>Revalidate</strong><span>Every 6–12 months by country, site, account, and role family.</span></div><span class="badge badge-orange">Planned</span></div></div></div></article>
      </section>
    </div>`;
}

function metric(label, value, note, iconName) {
  return `<article class="card metric"><div class="metric-top"><span>${label}</span>${icon(iconName)}</div><strong>${value}</strong><small>${note}</small></article>`;
}

function actionItem(number, title, description, action, label) {
  return `<div class="action-item"><div class="action-index">${number}</div><div><strong>${title}</strong><span>${description}</span></div><button class="button button-quiet" data-action="${action}">${label}</button></div>`;
}

function filteredCandidates() {
  return state.candidates.filter((candidate) => {
    const text = `${candidate.name} ${candidate.email} ${candidate.role} ${candidate.site}`.toLowerCase();
    return text.includes(state.search.toLowerCase()) && (state.statusFilter === 'All' || candidate.status === state.statusFilter);
  });
}

function renderCandidates() {
  const statuses = ['All', 'Ready to send', 'Invitation sent', 'In progress', 'Report ready', 'Email failed'];
  return `${pageIntro('Candidate operations', 'Candidates', 'One list for import, delivery, completion, and report status.', `<button class="button button-primary" data-action="import">${icon('plus')}Add candidates</button>`)}
    <section class="card"><div class="card-header"><div class="toolbar"><div class="search">${icon('search')}<input class="input" id="candidate-search" value="${esc(state.search)}" placeholder="Search candidates" aria-label="Search candidates"></div><select class="select" id="status-filter" aria-label="Filter by status">${statuses.map((status) => `<option ${state.statusFilter === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><span class="badge badge-neutral">${filteredCandidates().length} shown</span></div>${candidateTable(filteredCandidates())}</section>`;
}

function candidateTable(candidates, compact = false) {
  if (!candidates.length) return `<div class="card-body"><div class="notice">No candidates match the current filters.</div></div>`;
  return `<div class="table-scroll"><table><thead><tr><th>Candidate</th><th>Role / site</th><th>Status</th><th>Progress</th>${compact ? '' : '<th>Updated</th>'}<th>Action</th></tr></thead><tbody>${candidates.map((candidate) => `<tr><td><div class="person"><div class="person-avatar">${initials(candidate.name)}</div><div><strong>${esc(candidate.name)}</strong><span>${esc(candidate.email)}</span></div></div></td><td><strong>${esc(candidate.role)}</strong><br><span class="empty-value">${esc(candidate.site)}</span></td><td>${statusBadge(candidate.status)}</td><td><div class="progress"><div class="progress-track"><span style="width:${candidate.progress}%"></span></div><small>${candidate.progress}%</small></div></td>${compact ? '' : `<td>${esc(candidate.updated)}</td>`}<td><div class="row-actions">${candidateAction(candidate)}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function candidateAction(candidate) {
  if (candidate.status === 'Report ready') return `<button class="row-button" data-report="${candidate.id}">Open report</button>`;
  if (candidate.status === 'In progress') return `<button class="row-button" data-runner="${candidate.id}">Continue test</button>`;
  if (candidate.status === 'Invitation sent' || candidate.status === 'Email failed') return `<button class="row-button" data-resend="${candidate.id}">Resend</button>`;
  return `<button class="row-button" data-select-send="${candidate.id}">Select to send</button>`;
}

function renderImport() {
  const csv = state.csv;
  const mappings = csv?.headers?.map((header, index) => {
    const lower = header.toLowerCase();
    const target = lower.includes('name') ? 'name' : lower.includes('mail') ? 'email' : lower.includes('phone') || lower.includes('mobile') ? 'phone' : lower.includes('role') || lower.includes('opening') ? 'role' : lower.includes('site') || lower.includes('location') ? 'site' : 'ignore';
    return [header, target, csv.rows[0]?.[index] || ''];
  }) || [['Full Name', 'name', 'Nia Brooks'], ['Email Address', 'email', 'nia.brooks@example.com'], ['Mobile', 'phone', '+502 5550 0166'], ['Opening', 'role', 'Bilingual Customer Care'], ['Location', 'site', 'Guatemala City']];
  return `${pageIntro('CSV import', 'Import candidates', 'Upload a CSV, verify the field mapping, then add clean candidate records.', '')}
    <div class="grid grid-2"><section class="card card-body"><div class="dropzone">${icon('upload')}<div><h3>${csv ? esc(csv.name) : 'Choose a candidate CSV'}</h3><p>${csv ? `${csv.rows.length} rows detected. Review the mapping before import.` : 'CSV only · first row must contain column names'}</p><label class="button button-secondary" for="csv-file">${csv ? 'Choose another file' : 'Browse files'}</label><input class="file-input" id="csv-file" type="file" accept=".csv,text/csv"></div></div></section>
    <section class="card"><div class="card-header"><div><h3>Import checks</h3><p>Required fields and quality rules.</p></div>${icon('shield')}</div><div class="card-body guardrail-list"><div class="guardrail"><div><strong>Name and email</strong><span>Required for every candidate.</span></div><span class="badge badge-teal">Required</span></div><div class="guardrail"><div><strong>Duplicate handling</strong><span>Existing email addresses will be skipped.</span></div><span class="badge badge-neutral">On</span></div><div class="guardrail"><div><strong>Protected data</strong><span>Do not import sensitive demographic fields into scoring.</span></div><span class="badge badge-orange">Guardrail</span></div></div></section></div>
    <section class="card"><div class="card-header"><div><h3>Column mapping</h3><p>Source columns are mapped to candidate fields.</p></div><button class="button button-primary" data-action="confirm-import">${icon('check')}Import ${csv ? csv.rows.length : 1} candidate${csv?.rows?.length === 1 ? '' : 's'}</button></div><div class="card-body mapping-list">${mappings.map(([source, target, sample], index) => `<div class="mapping-row"><div class="source-column"><strong>${esc(source)}</strong><small>Sample: ${esc(sample)}</small></div><span>→</span><select class="select mapping-select" data-column="${index}"><option value="name" ${target === 'name' ? 'selected' : ''}>Candidate name</option><option value="email" ${target === 'email' ? 'selected' : ''}>Email</option><option value="phone" ${target === 'phone' ? 'selected' : ''}>Phone</option><option value="role" ${target === 'role' ? 'selected' : ''}>Role</option><option value="site" ${target === 'site' ? 'selected' : ''}>Site</option><option value="ignore" ${target === 'ignore' ? 'selected' : ''}>Ignore</option></select></div>`).join('')}</div></section>`;
}

function renderSend() {
  const available = state.candidates.filter((candidate) => ['Ready to send', 'Email failed'].includes(candidate.status));
  return `${pageIntro('Assessment delivery', 'Send Tenure Prediction Test', 'Confirm the real job conditions before asking candidates whether the role fits.', `<button class="button button-primary" data-action="send-selected" ${state.selectedToSend.length ? '' : 'disabled'}>${icon('send')}Send ${state.selectedToSend.length || ''} invitation${state.selectedToSend.length === 1 ? '' : 's'}</button>`)}
    <div class="stack"><section class="card test-summary"><div class="test-main"><p class="eyebrow">Candidate-facing name</p><h3>Tenure Prediction Test</h3><p>Measures work-history signals, reliability traits, job-reality fit, and intention to stay. Results create a 1–5 tenure-confidence score with dimension-level explanations.</p><div class="notice"><strong>Internal name:</strong> Tenure Prediction Test — Expanded Stability Model. Never show turnover-risk language to candidates.</div></div><div class="test-facts"><div class="fact"><span>Estimated time</span><strong>10–12 minutes</strong></div><div class="fact"><span>Production item count</span><strong>24 questions</strong></div><div class="fact"><span>Decision mode</span><strong>Human review only</strong></div><div class="fact"><span>Recommended cadence</span><strong>Revalidate every 6–12 months</strong></div></div></section>
    <section class="card"><div class="card-header"><div><h3>Realistic job preview</h3><p>These conditions appear before the test begins.</p></div><span class="badge badge-teal">Required</span></div><div class="card-body reality-list">${reality('calendar', 'Schedule', 'Rotating evening or weekend shifts; schedule confirmed before offer.')} ${reality('headphones', 'Work intensity', 'Back-to-back customer conversations with quality and productivity targets.')} ${reality('briefcase', 'Work setting', 'Site and remote eligibility vary by account and training phase.')} ${reality('dollar', 'Compensation', 'Recruiter must confirm base pay, variable pay, and attendance requirements.')}</div></section>
    <section class="card"><div class="card-header"><div><h3>Select candidates</h3><p>Ready candidates and failed deliveries can be included.</p></div><span class="badge badge-neutral">${available.length} available</span></div><div class="card-body stack">${available.length ? available.map((candidate) => `<label class="candidate-check"><input type="checkbox" data-send-check="${candidate.id}" ${state.selectedToSend.includes(candidate.id) ? 'checked' : ''}><div class="person"><div class="person-avatar">${initials(candidate.name)}</div><div><strong>${esc(candidate.name)}</strong><span>${esc(candidate.email)} · ${esc(candidate.status)}</span></div></div></label>`).join('') : '<div class="notice">No candidates are waiting for an invitation.</div>'}</div></section></div>`;
}

function reality(iconName, title, text) { return `<div class="reality-item">${icon(iconName)}<div><strong>${title}</strong><span>${text}</span></div></div>`; }

function renderProgress() {
  const active = state.candidates.filter((candidate) => candidate.invitation !== 'Not sent');
  return `${pageIntro('Candidate completion', 'Test progress', 'Track delivery, resume the candidate experience, and resend invitations.', `<button class="button button-secondary" data-action="candidate-preview">${icon('file')}Preview candidate test</button>`)}
    <section class="grid grid-3"><article class="card metric"><div class="metric-top"><span>Delivered</span>${icon('send')}</div><strong>${active.filter((c) => c.invitation === 'Delivered').length}</strong><small>Invitation reached candidate</small></article><article class="card metric"><div class="metric-top"><span>In progress</span>${icon('clock')}</div><strong>${active.filter((c) => c.status === 'In progress').length}</strong><small>Partial assessment saved</small></article><article class="card metric"><div class="metric-top"><span>Needs attention</span>${icon('alert')}</div><strong>${active.filter((c) => c.status === 'Email failed').length}</strong><small>Delivery failed or expired</small></article></section>
    <section class="card"><div class="card-header"><div><h3>Invitation activity</h3><p>Use the actions to exercise the complete prototype flow.</p></div></div>${candidateTable(active, true)}</section>`;
}

function renderReports() {
  const ready = state.candidates.filter((candidate) => candidate.status === 'Report ready');
  const candidate = ready.find((item) => item.id === state.reportCandidateId) || ready[0];
  return `${pageIntro('Explainable evidence', 'Results & reports', 'Review individual tenure-confidence signals and the evidence plan for the pilot.', '')}
    <section class="card"><div class="tabs"><button class="tab ${state.reportTab === 'individual' ? 'active' : ''}" data-report-tab="individual">Individual report</button><button class="tab ${state.reportTab === 'pilot' ? 'active' : ''}" data-report-tab="pilot">Pilot & fairness</button></div><div class="card-body">${state.reportTab === 'individual' ? renderIndividualReport(candidate, ready) : renderPilot()}</div></section>`;
}

function renderIndividualReport(candidate, ready) {
  if (!candidate) return '<div class="notice">No report is ready yet. Complete a candidate test to generate one.</div>';
  const dimensions = candidate.dimensions || { history: candidate.score, traits: candidate.score, fit: candidate.score, intent: candidate.score };
  const label = candidate.score >= 4 ? 'Strong tenure confidence' : candidate.score >= 3 ? 'Moderate tenure confidence' : 'Review job conditions';
  return `<div class="stack"><div class="toolbar"><select class="select" id="report-candidate" aria-label="Choose report">${ready.map((item) => `<option value="${item.id}" ${candidate.id === item.id ? 'selected' : ''}>${esc(item.name)} · ${esc(item.role)}</option>`).join('')}</select><button class="button button-secondary" data-action="print-report">Print report</button></div><div class="report-shell"><aside class="card report-profile"><div class="score-ring" style="--score-angle:${candidate.score / 5 * 360}deg"><div><strong>${candidate.score.toFixed(1)}</strong><span>out of 5</span></div></div><h3>${esc(candidate.name)}</h3><p>${esc(candidate.role)} · ${esc(candidate.site)}</p><span class="badge badge-teal">${label}</span><div class="confidence">This score is a structured signal, not a prediction, promise, or automatic hiring decision.</div></aside><div class="report-main"><div class="card card-body"><h3>Dimension profile</h3>${dimensionBar('Work history', dimensions.history)}${dimensionBar('Reliability traits', dimensions.traits)}${dimensionBar('Job reality fit', dimensions.fit)}${dimensionBar('Intention to stay', dimensions.intent)}</div><div class="grid grid-2"><div class="report-block"><h4>Positive signals</h4><ul><li>Job conditions and schedule appear workable based on current responses.</li><li>Responses indicate steady follow-through during repetitive work.</li><li>Candidate shows interest in building relevant role experience.</li></ul></div><div class="report-block"><h4>Conditions to confirm</h4><ul><li>Confirm exact shift window and weekend rotation.</li><li>Review base and variable compensation before offer.</li><li>Validate comfort with back-to-back customer interactions.</li></ul></div><div class="report-block"><h4>Recommended interview prompts</h4><ul><li>What conditions helped you stay and perform well in a previous role?</li><li>Which part of this schedule would be hardest to sustain for six months?</li></ul></div><div class="report-block"><h4>Onboarding support</h4><ul><li>Set clear first-week expectations.</li><li>Assign one consistent coach during training.</li><li>Check schedule and role expectations before day one.</li></ul></div></div><div class="notice"><strong>Human review required.</strong> Combine this report with structured interview evidence, job simulation, role requirements, and local validation. Do not use the score alone to hire, reject, or rank a candidate.</div></div></div></div>`;
}

function dimensionBar(label, value) { return `<div class="dimension-score"><span>${label}</span><div class="progress-track"><span style="width:${value / 5 * 100}%"></span></div><strong>${value.toFixed(1)}</strong></div>`; }

function renderPilot() {
  const cohorts = [
    ['Current hiring baseline', 'Current process', 'Not started', '90 / 180-day retention'],
    ['Assessment only', 'Tenure Prediction Test', 'Design ready', 'Incremental validity'],
    ['Assessment + job preview', 'Test plus realistic preview', 'Design ready', 'Expectation-match lift'],
    ['Internal predictive model', 'Local historical data', 'Future phase', 'Local benchmark'],
  ];
  return `<div class="stack"><div class="notice"><strong>Pilot principle:</strong> compare outcomes before choosing cut scores. Do not turn the prototype score into a pass/fail rule until local evidence supports it.</div><div class="grid grid-4">${metric('90-day retention', 'Pending', 'Primary outcome', 'calendar')}${metric('180-day retention', 'Pending', 'Secondary outcome', 'calendar')}${metric('Quality of hire', 'Pending', 'QA + attendance', 'chart')}${metric('Adverse impact', 'Pending', 'Selection-rate checks', 'shield')}</div><section class="card"><div class="card-header"><div><h3>Controlled pilot cohorts</h3><p>Recommended comparison structure for the 90-day pilot.</p></div></div><div class="table-scroll"><table class="pilot-table"><thead><tr><th>Cohort</th><th>Intervention</th><th>Status</th><th>Primary analysis</th></tr></thead><tbody>${cohorts.map((row) => `<tr>${row.map((cell, index) => `<td>${index === 2 ? `<span class="badge badge-${cell === 'Design ready' ? 'teal' : 'neutral'}">${cell}</span>` : cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section><div class="grid grid-2"><section class="card"><div class="card-header"><div><h3>Fairness guardrails</h3><p>Run only on lawful demographic data kept outside scoring.</p></div></div><div class="card-body guardrail-list"><div class="guardrail"><div><strong>Selection-rate ratio</strong><span>Initial screen for group differences; investigate below 0.80.</span></div><span class="badge badge-neutral">No data</span></div><div class="guardrail"><div><strong>Score distribution</strong><span>Review by country, site, role, and legally permitted groups.</span></div><span class="badge badge-neutral">No data</span></div><div class="guardrail"><div><strong>Sample sufficiency</strong><span>Do not interpret small groups as stable evidence.</span></div><span class="badge badge-orange">Required</span></div></div></section><section class="card"><div class="card-header"><div><h3>Validity checklist</h3><p>Evidence required before operational cut scores.</p></div></div><div class="card-body guardrail-list">${checkline('Outcome definitions', 'Voluntary resignation at 90 and 180 days.', true)}${checkline('Role segmentation', 'Analyze by account, site, language, and role family.', true)}${checkline('Criterion analysis', 'Relate scores to tenure and quality outcomes.', false)}${checkline('Independent review', 'Document limitations and approve operational use.', false)}</div></section></div></div>`;
}

function checkline(title, text, done) { return `<div class="guardrail"><div><strong>${title}</strong><span>${text}</span></div><span class="badge badge-${done ? 'teal' : 'neutral'}">${done ? 'Ready' : 'Open'}</span></div>`; }

function renderSettings() {
  const s = state.settings;
  return `${pageIntro('Workspace configuration', 'Settings', 'Keep production settings narrow: organization, delivery, governance, and security.', `<button class="button button-primary" data-action="save-settings">${icon('check')}Save settings</button>`)}
    <div class="grid grid-2"><section class="card settings-card"><h3>Company profile</h3><p>Defaults used for imports, invitations, and reports.</p><div class="form-grid"><div class="field"><label for="company-name">Company name</label><input class="input setting-input" id="company-name" data-setting="company" value="${esc(s.company)}"></div><div class="field"><label for="default-role">Default role</label><input class="input setting-input" id="default-role" data-setting="defaultRole" value="${esc(s.defaultRole)}"></div><div class="field"><label for="default-site">Default site</label><input class="input setting-input" id="default-site" data-setting="site" value="${esc(s.site)}"></div><div class="field"><label for="assessment-language">Assessment language</label><select class="select setting-input" id="assessment-language" data-setting="assessmentLanguage"><option ${s.assessmentLanguage === 'English' ? 'selected' : ''}>English</option><option ${s.assessmentLanguage === 'Spanish' ? 'selected' : ''}>Spanish</option></select></div></div></section><section class="card settings-card"><h3>Email delivery</h3><p>Production invitations require a verified company sender.</p>${settingLine('Provider', 'Not connected', 'badge badge-orange', 'Action needed')}${settingLine('Sender identity', 'assessment@company.com', 'badge badge-neutral', 'Unverified')}${settingLine('Domain authentication', 'SPF, DKIM, and DMARC', 'badge badge-neutral', 'Pending')}</section><section class="card settings-card"><h3>Assessment governance</h3><p>Controls that constrain how results are used.</p>${toggleLine('Human review required', 'Prevents score-only decisions.', 'humanReview', s.humanReview)}${toggleLine('Fairness monitoring', 'Tracks selection-rate and score differences.', 'fairnessMonitoring', s.fairnessMonitoring)}${toggleLine('Automatic rejection', 'Must remain off during the pilot.', 'autoReject', s.autoReject, true)}</section><section class="card settings-card"><h3>Basic security</h3><p>Minimum controls before real candidate data is used.</p>${settingLine('Access roles', 'Admin, recruiter, read-only reviewer', 'badge badge-teal', 'Defined')}${settingLine('Audit events', 'Imports, sends, report access', 'badge badge-teal', 'Enabled')}${settingLine('Data retention', 'Policy and deletion window', 'badge badge-orange', 'Set policy')}</section></div>`;
}

function settingLine(title, text, badgeClass, badgeText) { return `<div class="setting-line"><div><strong>${title}</strong><span>${text}</span></div><span class="${badgeClass}">${badgeText}</span></div>`; }
function toggleLine(title, text, key, value, locked = false) { return `<div class="setting-line"><div><strong>${title}</strong><span>${text}</span></div><button class="toggle ${value ? 'on' : ''}" data-toggle="${key}" aria-label="Toggle ${title}" aria-pressed="${value}" ${locked ? 'disabled title="Disabled during pilot"' : ''}></button></div>`; }

function renderRunner() {
  const candidate = state.candidates.find((item) => item.id === runner.candidateId) || state.candidates[1];
  if (runner.stage === 'intro') return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="runner-title"><div class="modal-header"><div><p class="eyebrow">Candidate preview</p><h2 id="runner-title">Tenure Prediction Test</h2></div><button class="button button-secondary icon-button" data-runner-action="close" aria-label="Close test">${icon('x')}</button></div><div class="modal-body"><span class="badge badge-teal">About 10–12 minutes</span><h3 class="question-text">Welcome, ${esc(candidate.name.split(' ')[0])}.</h3><p>This assessment asks about your work preferences and how well the actual conditions of the role fit what you want. There are no trick questions. Answer based on what is realistic for you today.</p><div class="card card-body stack"><strong>Role conditions shown before you begin</strong><div class="reality-list">${reality('calendar', 'Schedule', 'Rotating evening or weekend shifts.')} ${reality('headphones', 'Work pattern', 'Back-to-back customer conversations and measured targets.')}</div></div><label class="consent"><input type="checkbox" id="runner-consent" ${runner.consent ? 'checked' : ''}><span>I understand how the assessment will be used and that a person will review the result with other hiring information.</span></label></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="close">Cancel</button><button class="button button-primary" data-runner-action="start" ${runner.consent ? '' : 'disabled'}>Begin assessment</button></div></section></div>`;
  const question = testQuestions[runner.index];
  const value = runner.answers[question.id];
  const labels = ['Not at all', 'Slightly', 'Somewhat', 'Very', 'Completely'];
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="question-title"><div class="modal-header"><div><p class="eyebrow">Tenure Prediction Test</p><h2>${esc(candidate.role)}</h2></div><button class="button button-secondary icon-button" data-runner-action="close" aria-label="Close test">${icon('x')}</button></div><div class="modal-body"><div class="test-progress"><div class="progress-track"><span style="width:${(runner.index + 1) / testQuestions.length * 100}%"></span></div><span>${runner.index + 1} of ${testQuestions.length}</span></div><div class="question-kicker">${question.dimension}</div><h3 class="question-text" id="question-title">${question.text}</h3><div class="answer-scale">${labels.map((label, index) => `<button class="answer-option ${value === index + 1 ? 'selected' : ''}" data-answer="${index + 1}"><strong>${index + 1}</strong><span>${label}</span></button>`).join('')}</div></div><div class="modal-footer"><button class="button button-secondary" data-runner-action="back" ${runner.index === 0 ? 'disabled' : ''}>Back</button><button class="button button-primary" data-runner-action="next" ${value ? '' : 'disabled'}>${runner.index === testQuestions.length - 1 ? 'Complete assessment' : 'Continue'}</button></div></section></div>`;
}

function calculateScores(answers) {
  const average = (prefix) => {
    const values = Object.entries(answers).filter(([key]) => key.startsWith(prefix)).map(([, value]) => value);
    return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  };
  const dimensions = { history: average('history_'), traits: average('traits_'), fit: average('fit_'), intent: average('intent_') };
  const score = dimensions.history * .25 + dimensions.traits * .25 + dimensions.fit * .30 + dimensions.intent * .20;
  return { score: Math.round(score * 10) / 10, dimensions };
}

function completeRunner() {
  const results = calculateScores(runner.answers);
  state.candidates = state.candidates.map((candidate) => candidate.id === runner.candidateId ? { ...candidate, status: 'Report ready', progress: 100, score: results.score, dimensions: results.dimensions, updated: 'Just now' } : candidate);
  state.reportCandidateId = runner.candidateId;
  state.reportTab = 'individual';
  state.view = 'reports';
  runner = null;
  persist();
  render();
  toast('Assessment completed. The explainable report is ready for human review.');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (character === '"' && quoted && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field.trim()); field = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return { headers: rows[0] || [], rows: rows.slice(1).filter((item) => item.some(Boolean)) };
}

function confirmImport() {
  if (!state.csv) {
    const candidate = { id: Math.max(...state.candidates.map((item) => item.id)) + 1, name: 'Nia Brooks', email: 'nia.brooks@example.com', phone: '+502 5550 0166', role: state.settings.defaultRole, site: state.settings.site, status: 'Ready to send', invitation: 'Not sent', progress: 0, score: null, updated: 'Just now' };
    if (!state.candidates.some((item) => item.email === candidate.email)) state.candidates.push(candidate);
    state.view = 'candidates'; persist(); render(); toast('Candidate imported and ready to send.'); return;
  }
  const selects = [...document.querySelectorAll('.mapping-select')];
  const mapping = selects.map((select) => select.value);
  const existing = new Set(state.candidates.map((item) => item.email.toLowerCase()));
  let imported = 0;
  state.csv.rows.forEach((row) => {
    const record = {};
    mapping.forEach((target, index) => { if (target !== 'ignore') record[target] = row[index] || ''; });
    if (!record.name || !record.email || existing.has(record.email.toLowerCase())) return;
    state.candidates.push({ id: Math.max(0, ...state.candidates.map((item) => item.id)) + 1, name: record.name, email: record.email, phone: record.phone || '', role: record.role || state.settings.defaultRole, site: record.site || state.settings.site, status: 'Ready to send', invitation: 'Not sent', progress: 0, score: null, updated: 'Just now' });
    existing.add(record.email.toLowerCase()); imported += 1;
  });
  state.csv = null; state.view = 'candidates'; persist(); render(); toast(`${imported} candidate${imported === 1 ? '' : 's'} imported.`);
}

function sendSelected() {
  const selected = new Set(state.selectedToSend);
  state.candidates = state.candidates.map((candidate) => selected.has(candidate.id) ? { ...candidate, status: 'Invitation sent', invitation: 'Delivered', updated: 'Just now' } : candidate);
  state.selectedToSend = []; state.view = 'progress'; persist(); render(); toast('Invitations sent in the prototype workspace.');
}

function render() {
  const views = { home: renderHome, candidates: renderCandidates, import: renderImport, send: renderSend, progress: renderProgress, reports: renderReports, settings: renderSettings };
  document.getElementById('app').innerHTML = shell((views[state.view] || renderHome)());
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => setState({ view: button.dataset.nav })));
  document.getElementById('mobile-menu')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'import') setState({ view: 'import' });
    if (action === 'send-view') setState({ view: 'send' });
    if (action === 'open-settings') setState({ view: 'settings' });
    if (action === 'pilot-review') setState({ view: 'reports', reportTab: 'pilot' });
    if (action === 'confirm-import') confirmImport();
    if (action === 'send-selected') sendSelected();
    if (action === 'candidate-preview') { runner = { candidateId: 2, stage: 'intro', consent: false, index: 0, answers: {} }; render(); }
    if (action === 'print-report') window.print();
    if (action === 'save-settings') { persist(); toast('Workspace settings saved.'); }
  }));
  document.getElementById('candidate-search')?.addEventListener('input', (event) => { state.search = event.target.value; render(); });
  document.getElementById('status-filter')?.addEventListener('change', (event) => setState({ statusFilter: event.target.value }));
  document.getElementById('csv-file')?.addEventListener('change', (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { const parsed = parseCsv(reader.result); state.csv = { name: file.name, ...parsed }; render(); toast(`${parsed.rows.length} CSV rows detected.`); }; reader.readAsText(file);
  });
  document.querySelectorAll('[data-send-check]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const id = Number(checkbox.dataset.sendCheck); const selected = new Set(state.selectedToSend); checkbox.checked ? selected.add(id) : selected.delete(id); setState({ selectedToSend: [...selected] });
  }));
  document.querySelectorAll('[data-resend]').forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.resend); state.candidates = state.candidates.map((candidate) => candidate.id === id ? { ...candidate, status: 'Invitation sent', invitation: 'Delivered', updated: 'Just now' } : candidate); persist(); render(); toast('Invitation resent.');
  }));
  document.querySelectorAll('[data-select-send]').forEach((button) => button.addEventListener('click', () => { const id = Number(button.dataset.selectSend); setState({ view: 'send', selectedToSend: [...new Set([...state.selectedToSend, id])] }); }));
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => setState({ view: 'reports', reportTab: 'individual', reportCandidateId: Number(button.dataset.report) })));
  document.querySelectorAll('[data-runner]').forEach((button) => button.addEventListener('click', () => { runner = { candidateId: Number(button.dataset.runner), stage: 'intro', consent: false, index: 0, answers: {} }; render(); }));
  document.querySelectorAll('[data-report-tab]').forEach((button) => button.addEventListener('click', () => setState({ reportTab: button.dataset.reportTab })));
  document.getElementById('report-candidate')?.addEventListener('change', (event) => setState({ reportCandidateId: Number(event.target.value) }));
  document.querySelectorAll('.setting-input').forEach((input) => input.addEventListener('change', () => { state.settings[input.dataset.setting] = input.value; }));
  document.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => { const key = button.dataset.toggle; state.settings[key] = !state.settings[key]; persist(); render(); }));
  if (runner) bindRunner();
}

function bindRunner() {
  document.getElementById('runner-consent')?.addEventListener('change', (event) => { runner.consent = event.target.checked; render(); });
  document.querySelectorAll('[data-answer]').forEach((button) => button.addEventListener('click', () => { runner.answers[testQuestions[runner.index].id] = Number(button.dataset.answer); render(); }));
  document.querySelectorAll('[data-runner-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.runnerAction;
    if (action === 'close') { runner = null; render(); }
    if (action === 'start' && runner.consent) { runner.stage = 'questions'; render(); }
    if (action === 'back' && runner.index > 0) { runner.index -= 1; render(); }
    if (action === 'next' && runner.answers[testQuestions[runner.index].id]) { runner.index === testQuestions.length - 1 ? completeRunner() : (runner.index += 1, render()); }
  }));
}

render();
