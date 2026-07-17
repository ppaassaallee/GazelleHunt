(function candidatePortalModule(global) {
  const copy = {
    en: {
      loading: 'Preparing your candidate portal', errorTitle: 'We could not open your portal', retry: 'Try again',
      welcome: 'Welcome to', hello: 'Hello', intro: 'We are glad you are here. Find a quiet place and reserve at least 10 minutes before starting your assessment. Don\'t worry, we simply want to get to know you better.',
      quiet: 'Quiet place', time: 'At least 10 minutes', honest: 'Be yourself',
      next: 'Your next step', assessmentReady: 'Your assessment is ready', assessmentBody: 'Complete it when you can focus without interruptions. Your answers will be reviewed by a person as part of the wider hiring process.',
      start: 'Start assessment', continue: 'Continue assessment', complete: 'Completed', attempts: 'attempts remaining',
      progress: 'Your hiring progress', current: 'Current stage', latest: 'Latest update', noMessages: 'There are no additional messages yet. New updates will appear here.',
      account: 'Keep your portal with you', accountBody: 'Create a password or use Google to return anytime without searching for your invitation link.',
      create: 'Create account', signIn: 'Sign in', signOut: 'Sign out', google: 'Continue with Google', password: 'Password', email: 'Email',
      createTitle: 'Create your candidate account', signInTitle: 'Sign in to GazelleHunt', passwordRule: 'Use at least 12 characters.', cancel: 'Cancel',
      refer: 'Refer someone and earn $100', referBody: 'Know someone who would be a strong fit? Share their details and follow the referral here. The reward is paid after the referral qualifies under the hiring program.',
      friendName: 'Full name', friendEmail: 'Email address', friendPhone: 'Phone (optional)', submitReferral: 'Submit referral', referralProgress: 'Your referrals',
      submitted: 'Submitted', reviewing: 'In review', qualified: 'Qualified', paid: 'Paid', language: 'Language', profile: 'Candidate profile', application: 'Application',
      member: 'Account active', guest: 'Invitation access', saved: 'Your preference was saved.', portalOnly: 'Sign in or use your latest assessment invitation to continue.',
    },
    es: {
      loading: 'Preparando tu portal de candidato', errorTitle: 'No pudimos abrir tu portal', retry: 'Intentar de nuevo',
      welcome: 'Bienvenido a', hello: 'Hola', intro: 'Nos alegra que estés aquí. Busca un lugar tranquilo y reserva al menos 10 minutos antes de comenzar tu evaluación. No te preocupes, simplemente queremos conocerte mejor.',
      quiet: 'Lugar tranquilo', time: 'Al menos 10 minutos', honest: 'Sé tú mismo',
      next: 'Tu siguiente paso', assessmentReady: 'Tu evaluación está lista', assessmentBody: 'Complétala cuando puedas concentrarte sin interrupciones. Una persona revisará tus respuestas como parte de todo el proceso de contratación.',
      start: 'Comenzar evaluación', continue: 'Continuar evaluación', complete: 'Completada', attempts: 'intentos disponibles',
      progress: 'Tu avance de contratación', current: 'Etapa actual', latest: 'Última actualización', noMessages: 'Aún no hay mensajes adicionales. Las nuevas actualizaciones aparecerán aquí.',
      account: 'Lleva tu portal contigo', accountBody: 'Crea una contraseña o usa Google para regresar cuando quieras sin buscar el enlace de invitación.',
      create: 'Crear cuenta', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión', google: 'Continuar con Google', password: 'Contraseña', email: 'Correo electrónico',
      createTitle: 'Crea tu cuenta de candidato', signInTitle: 'Ingresa a GazelleHunt', passwordRule: 'Usa al menos 12 caracteres.', cancel: 'Cancelar',
      refer: 'Refiere a alguien y gana $100', referBody: '¿Conoces a alguien que podría encajar muy bien? Comparte sus datos y sigue el referido aquí. La recompensa se paga cuando el referido califica según el programa de contratación.',
      friendName: 'Nombre completo', friendEmail: 'Correo electrónico', friendPhone: 'Teléfono (opcional)', submitReferral: 'Enviar referido', referralProgress: 'Tus referidos',
      submitted: 'Enviado', reviewing: 'En revisión', qualified: 'Calificado', paid: 'Pagado', language: 'Idioma', profile: 'Perfil de candidato', application: 'Solicitud',
      member: 'Cuenta activa', guest: 'Acceso por invitación', saved: 'Tu preferencia fue guardada.', portalOnly: 'Inicia sesión o usa tu invitación de evaluación más reciente para continuar.',
    },
  };

  const state = { loading: true, error: '', formError: '', referralError: '', data: null, locale: 'en', authMode: null, busy: false };
  const params = new URLSearchParams(location.search);
  const invite = params.get('invite') || '';

  function t(key) { return copy[state.locale]?.[key] || copy.en[key] || key; }
  function esc(value = '') { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[character]); }
  function firstName(name = '') { return name.trim().split(/\s+/)[0] || ''; }
  function money(cents) { return new Intl.NumberFormat(state.locale === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(cents || 10000) / 100); }
  function date(value) { return value ? new Intl.DateTimeFormat(state.locale === 'es' ? 'es' : 'en', { dateStyle: 'medium' }).format(new Date(value)) : ''; }
  function icon(path) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`; }
  const icons = {
    check: '<path d="m20 6-11 11-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M7.5 8C5 8 4 4 6.5 4 9 4 12 8 12 8M16.5 8C19 8 20 4 17.5 4 15 4 12 8 12 8"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>', shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  };

  async function request(url, options) {
    const response = await fetch(url, { ...options, headers: { 'content-type': 'application/json', ...(options?.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(body.error || 'The request could not be completed.'); error.code = body.code; throw error; }
    return body;
  }

  async function load() {
    state.loading = true; state.error = ''; state.formError = ''; state.referralError = ''; render();
    try {
      const query = invite ? `?invite=${encodeURIComponent(invite)}` : '';
      state.data = await request(`/api/candidate/portal${query}`);
      const stored = localStorage.getItem('gazelle_candidate_locale');
      state.locale = stored === 'es' || stored === 'en' ? stored : state.data.suggestedLocale === 'es' ? 'es' : 'en';
      document.documentElement.lang = state.locale;
      if (params.get('oauth') === 'success') history.replaceState({}, '', '/candidate');
    } catch (error) { state.error = error.message; }
    finally { state.loading = false; render(); }
  }

  function languageControl() {
    return `<div class="cp-language" role="group" aria-label="${t('language')}"><button data-locale="en" class="${state.locale === 'en' ? 'active' : ''}">EN</button><button data-locale="es" class="${state.locale === 'es' ? 'active' : ''}">ES</button></div>`;
  }

  function timeline(application) {
    return `<ol class="cp-timeline">${application.stages.map((stage) => {
      const active = Number(stage.stage_order) === Number(application.current_stage_order);
      const done = Number(stage.stage_order) < Number(application.current_stage_order);
      return `<li class="${active ? 'active' : done ? 'done' : ''}"><span>${done ? icon(icons.check) : ''}</span><div><strong>${esc(state.locale === 'es' ? stage.name_es : stage.name_en)}</strong>${active ? `<small>${t('current')}</small>` : ''}</div></li>`;
    }).join('')}</ol>`;
  }

  function assessmentPanel(application) {
    const test = application.tests[0];
    if (!test) return `<section class="cp-action-panel"><div class="cp-section-icon">${icon(icons.clock)}</div><div><p class="cp-kicker">${t('next')}</p><h2>${t('portalOnly')}</h2></div></section>`;
    const complete = test.status === 'completed';
    return `<section class="cp-action-panel"><div class="cp-section-icon">${icon(complete ? icons.check : icons.clock)}</div><div class="cp-action-copy"><p class="cp-kicker">${t('next')}</p><h2>${complete ? t('complete') : t('assessmentReady')}</h2><p>${t('assessmentBody')}</p><div class="cp-test-meta"><span>${esc(state.locale === 'es' ? test.name_es : test.name_en)}</span><span>${Number(test.estimated_minutes || 15)} min</span><span>${test.attempts_remaining} ${t('attempts')}</span></div></div>${complete ? `<span class="cp-complete-badge">${icon(icons.check)}${t('complete')}</span>` : `<button class="cp-button cp-primary" data-start-test="${esc(test.id)}" data-direct="${test.direct_access ? '1' : '0'}">${t('start')}${icon(icons.arrow)}</button>`}</section>`;
  }

  function messages(application) {
    const updates = application.communications || [];
    return `<section class="cp-section"><div class="cp-section-heading"><div>${icon(icons.message)}<div><p class="cp-kicker">${t('latest')}</p><h2>${esc(state.locale === 'es' ? application.current_stage_name_es : application.current_stage_name_en)}</h2></div></div><time>${date(application.pipeline_updated_at)}</time></div><p class="cp-status-message">${esc(state.locale === 'es' ? application.status_message_es : application.status_message_en)}</p>${updates.length ? `<div class="cp-message-list">${updates.slice(0, 4).map((message) => `<article><strong>${esc(state.locale === 'es' ? message.subject_es || t('latest') : message.subject_en || t('latest'))}</strong><p>${esc(state.locale === 'es' ? message.message_es : message.message_en)}</p><time>${date(message.created_at)}</time></article>`).join('')}</div>` : `<p class="cp-muted">${t('noMessages')}</p>`}</section>`;
  }

  function accountPanel() {
    const account = state.data.account;
    if (account) return `<section class="cp-account-summary">${icon(icons.shield)}<div><strong>${t('member')}</strong><span>${esc(account.email)}</span></div><button class="cp-text-button" data-signout>${t('signOut')}</button></section>`;
    return `<section class="cp-account-panel"><div class="cp-section-icon">${icon(icons.user)}</div><div><h2>${t('account')}</h2><p>${t('accountBody')}</p><div class="cp-account-actions"><button class="cp-button cp-primary" data-auth="signup">${t('create')}</button><button class="cp-button cp-secondary" data-auth="login">${t('signIn')}</button></div></div></section>`;
  }

  function referralPanel(application) {
    const referrals = state.data.referrals || [];
    const bonus = money(application.referral_bonus_cents);
    return `<section class="cp-referral cp-section"><div class="cp-referral-head"><div>${icon(icons.gift)}<div><p class="cp-kicker">GazelleHunt referrals</p><h2>${t('refer').replace('$100', bonus)}</h2></div></div><span>${bonus}</span></div><p>${t('referBody')}</p>${state.referralError ? `<p class="cp-inline-error">${esc(state.referralError)}</p>` : ''}${state.data.account ? `<form id="cp-referral-form" class="cp-referral-form"><input type="hidden" id="cp-referral-application" value="${esc(application.id)}"><label><span>${t('friendName')}</span><input id="cp-referral-name" required maxlength="140"></label><label><span>${t('friendEmail')}</span><input id="cp-referral-email" type="email" required maxlength="254"></label><label><span>${t('friendPhone')}</span><input id="cp-referral-phone" type="tel" maxlength="40"></label><button class="cp-button cp-primary" ${state.busy ? 'disabled' : ''}>${t('submitReferral')}${icon(icons.arrow)}</button></form>` : `<button class="cp-button cp-secondary" data-auth="signup">${t('create')}</button>`}${referrals.length ? `<div class="cp-referrals"><h3>${t('referralProgress')}</h3>${referrals.map((referral) => `<div class="cp-referral-row"><div><strong>${esc(referral.name)}</strong><span>${date(referral.created_at)}</span></div><span class="cp-referral-status status-${esc(referral.status)}">${t(referral.status)}</span></div>`).join('')}</div>` : ''}</section>`;
  }

  function authDialog() {
    if (!state.authMode) return '';
    const signup = state.authMode === 'signup';
    const email = state.data.applications[0]?.email || '';
    const googleUrl = `/api/candidate/auth/google?invite=${encodeURIComponent(invite)}&locale=${state.locale}`;
    return `<div class="cp-dialog-backdrop"><section class="cp-dialog" role="dialog" aria-modal="true"><div class="cp-dialog-head"><div><p class="cp-kicker">GazelleHunt</p><h2>${signup ? t('createTitle') : t('signInTitle')}</h2></div><button class="cp-dialog-close" data-close-auth aria-label="${t('cancel')}">×</button></div>${state.formError ? `<p class="cp-inline-error">${esc(state.formError)}</p>` : ''}${state.data.googleConfigured ? `<a class="cp-google" href="${googleUrl}"><span>G</span>${t('google')}</a><div class="cp-or"><span></span>or<span></span></div>` : ''}<form id="cp-auth-form" data-mode="${state.authMode}"><label><span>${t('email')}</span><input id="cp-auth-email" type="email" value="${esc(email)}" ${signup ? 'readonly' : ''} required></label><label><span>${t('password')}</span><input id="cp-auth-password" type="password" minlength="12" maxlength="128" autocomplete="${signup ? 'new-password' : 'current-password'}" required><small>${signup ? t('passwordRule') : ''}</small></label><button class="cp-button cp-primary" ${state.busy ? 'disabled' : ''}>${signup ? t('create') : t('signIn')}</button></form></section></div>`;
  }

  function portal() {
    const application = state.data.applications[0];
    const brand = application.candidate_brand_name || 'Allied Global';
    return `<div class="candidate-portal"><header class="cp-header"><a class="cp-brand" href="/candidate"><span>G</span><strong>GazelleHunt</strong><i>for ${esc(brand)}</i></a><div class="cp-header-actions">${languageControl()}<span class="cp-access">${state.data.account ? t('member') : t('guest')}</span></div></header><main><section class="cp-hero"><div class="cp-hero-copy"><p>${t('application')} · ${esc(application.role)}</p><h1>${t('welcome')} ${esc(brand)}, ${esc(firstName(application.name))}</h1><p>${t('intro')}</p><div class="cp-ready-list"><span>${icon(icons.volume)}${t('quiet')}</span><span>${icon(icons.clock)}${t('time')}</span><span>${icon(icons.user)}${t('honest')}</span></div></div></section><div class="cp-layout"><div class="cp-main-column">${assessmentPanel(application)}${messages(application)}${accountPanel()}${referralPanel(application)}</div><aside class="cp-sidebar"><section><p class="cp-kicker">${t('progress')}</p><h2>${esc(state.locale === 'es' ? application.current_stage_name_es : application.current_stage_name_en)}</h2>${timeline(application)}</section><section class="cp-profile">${icon(icons.user)}<div><strong>${esc(application.name)}</strong><span>${esc(application.role)}</span><span>${esc(application.email)}</span></div></section></aside></div></main>${authDialog()}</div>`;
  }

  function render() {
    const app = document.getElementById('app');
    if (state.loading) app.innerHTML = `<main class="cp-state"><div class="cp-loader"></div><h1>${t('loading')}</h1></main>`;
    else if (state.error) app.innerHTML = `<main class="cp-state cp-error"><div>!</div><h1>${t('errorTitle')}</h1><p>${esc(state.error)}</p><button class="cp-button cp-primary" data-retry>${t('retry')}</button></main>`;
    else app.innerHTML = portal();
    bind();
  }

  async function setLocale(locale) {
    state.locale = locale === 'es' ? 'es' : 'en';
    localStorage.setItem('gazelle_candidate_locale', state.locale);
    document.documentElement.lang = state.locale;
    render();
    if (state.data.account) await request('/api/candidate/locale', { method: 'POST', body: JSON.stringify({ locale: state.locale }) }).catch(() => {});
  }

  async function startTest(button) {
    const application = state.data.applications[0];
    const test = application.tests.find((entry) => entry.id === button.dataset.startTest);
    if (!test) return;
    if (button.dataset.direct === '1' && invite) {
      sessionStorage.setItem('gazelle_candidate_return', location.href);
      location.assign(`/assessment?invite=${encodeURIComponent(invite)}`);
      return;
    }
    if (!state.data.account) { state.authMode = state.data.accountExists ? 'login' : 'signup'; render(); return; }
    state.busy = true; button.disabled = true;
    try {
      const response = await request(`/api/candidate/invitations/${encodeURIComponent(test.id)}/start`, { method: 'POST', body: '{}' });
      sessionStorage.setItem('gazelle_candidate_return', '/candidate');
      location.assign(response.assessmentPath);
    } catch (error) { state.error = error.message; state.busy = false; render(); }
  }

  async function submitAuth(event) {
    event.preventDefault(); state.busy = true; render();
    const signup = event.currentTarget.dataset.mode === 'signup';
    try {
      await request(`/api/candidate/auth/${signup ? 'signup' : 'login'}`, { method: 'POST', body: JSON.stringify({ token: invite, locale: state.locale, email: document.getElementById('cp-auth-email').value, password: document.getElementById('cp-auth-password').value }) });
      state.authMode = null; await load();
    } catch (error) { state.formError = error.message; state.busy = false; render(); }
  }

  async function submitReferral(event) {
    event.preventDefault(); state.busy = true;
    try {
      state.data = await request('/api/candidate/referrals', { method: 'POST', body: JSON.stringify({ applicationId: document.getElementById('cp-referral-application').value, name: document.getElementById('cp-referral-name').value, email: document.getElementById('cp-referral-email').value, phone: document.getElementById('cp-referral-phone').value }) });
      state.busy = false; render();
    } catch (error) { state.referralError = error.message; state.busy = false; render(); }
  }

  function bind() {
    document.querySelector('[data-retry]')?.addEventListener('click', load);
    document.querySelectorAll('[data-locale]').forEach((button) => button.addEventListener('click', () => setLocale(button.dataset.locale)));
    document.querySelectorAll('[data-auth]').forEach((button) => button.addEventListener('click', () => { state.authMode = button.dataset.auth; state.formError = ''; render(); }));
    document.querySelector('[data-close-auth]')?.addEventListener('click', () => { state.authMode = null; state.formError = ''; render(); });
    document.querySelectorAll('[data-start-test]').forEach((button) => button.addEventListener('click', () => startTest(button)));
    document.getElementById('cp-auth-form')?.addEventListener('submit', submitAuth);
    document.getElementById('cp-referral-form')?.addEventListener('submit', submitReferral);
    document.querySelector('[data-signout]')?.addEventListener('click', async () => { await request('/api/candidate/auth/logout', { method: 'POST', body: '{}' }).catch(() => {}); location.assign(invite ? `/candidate?invite=${encodeURIComponent(invite)}` : '/candidate'); });
  }

  global.GazelleCandidatePortal = { start: load };
}(globalThis));
