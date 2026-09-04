/**
 * RYVO runtime — messaging (Brevo / Infobip / SMS / WhatsApp).
 * Move-only extraction from server-worker.js. Do not improve.
 */
function emailConfig(env) {
  const apiKey = String(env.BREVO_API_KEY || '');
  const senderEmail = cleanEmail(env.BREVO_SENDER_EMAIL);
  const senderName = cleanText(env.BREVO_SENDER_NAME, 140) || 'Gazelle Assessment';
  const webhookToken = String(env.BREVO_WEBHOOK_TOKEN || '');
  const smtpKey = String(env.BREVO_SMTP_KEY || '');
  const smtpLogin = cleanText(env.BREVO_SMTP_LOGIN, 180);
  const smtpHost = cleanText(env.BREVO_SMTP_HOST, 180) || 'smtp-relay.brevo.com';
  const configuredPort = Number(env.BREVO_SMTP_PORT || 587);
  const smtpPort = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535 ? configuredPort : 587;
  const requestedTransport = cleanText(env.BREVO_EMAIL_TRANSPORT, 20).toLowerCase();
  const transport = requestedTransport === 'smtp' ? 'smtp' : 'api';
  const apiConfigured = Boolean(apiKey && senderEmail);
  const smtpConfigured = Boolean(smtpKey && smtpLogin && senderEmail);
  const sendingConfigured = transport === 'smtp' ? smtpConfigured : apiConfigured;
  return {
    configured: Boolean(sendingConfigured && webhookToken.length >= 24),
    sendingConfigured,
    webhookConfigured: webhookToken.length >= 24,
    apiConfigured,
    smtpConfigured,
    transport,
    senderEmail,
    senderName,
    apiKey,
    webhookToken,
    smtpKey,
    smtpLogin,
    smtpHost,
    smtpPort,
  };
}

function contactabilityConfig(env) {
  const email = emailConfig(env);
  const whatsappProvider = cleanText(env.WHATSAPP_PROVIDER, 30).toLowerCase() === 'infobip' ? 'infobip' : 'brevo';
  const requestedSmsProvider = cleanText(env.SMS_PROVIDER, 30).toLowerCase();
  const smsProvider = requestedSmsProvider === 'infobip' ? 'infobip' : requestedSmsProvider === 'custom_http' ? 'custom_http' : 'brevo';
  const infobip = infobipConfig(env);
  const customSms = customSmsConfig(env);
  const whatsappSenderNumber = cleanText(env.BREVO_WHATSAPP_SENDER_NUMBER, 40).replace(/[^\d+]/g, '');
  const whatsappTemplateId = cleanText(env.BREVO_WHATSAPP_TEMPLATE_ID, 80);
  const smsSender = cleanText(env.BREVO_SMS_SENDER, 40);
  const defaultCountryCode = cleanText(env.DEFAULT_PHONE_COUNTRY_CODE, 8).replace(/[^\d]/g, '') || '502';
  const whatsappConfigured = whatsappProvider === 'infobip'
    ? Boolean(infobip.configured && infobip.whatsappSender && infobip.whatsappTemplateName)
    : Boolean(email.apiKey && whatsappSenderNumber);
  const smsConfigured = smsProvider === 'infobip'
    ? Boolean(infobip.configured && infobip.smsSender)
    : smsProvider === 'custom_http'
      ? customSms.configured
    : Boolean(email.apiKey && smsSender);
  return {
    defaultCountryCode,
    email: {
      configured: email.configured,
      sendingConfigured: email.sendingConfigured,
      provider: 'Brevo',
      transport: email.transport,
    },
    whatsapp: {
      configured: whatsappConfigured,
      apiConfigured: whatsappProvider === 'infobip' ? infobip.configured : Boolean(email.apiKey),
      providerKey: whatsappProvider,
      senderNumber: whatsappProvider === 'infobip' ? infobip.whatsappSender || null : whatsappSenderNumber || null,
      templateId: whatsappProvider === 'infobip' ? infobip.whatsappTemplateId || null : whatsappTemplateId || null,
      templateName: whatsappProvider === 'infobip' ? infobip.whatsappTemplateName || null : null,
      templateLanguage: whatsappProvider === 'infobip' ? infobip.whatsappTemplateLanguage : null,
      linkPlacement: whatsappProvider === 'infobip' ? infobip.whatsappLinkPlacement : 'body',
      provider: whatsappProvider === 'infobip' ? 'Infobip WhatsApp' : 'Brevo WhatsApp',
      missing: whatsappProvider === 'infobip'
        ? [!infobip.apiKey ? 'INFOBIP_API_KEY' : '', !infobip.baseUrl ? 'INFOBIP_BASE_URL' : '', !infobip.whatsappSender ? 'INFOBIP_WHATSAPP_SENDER' : '', !infobip.whatsappTemplateName ? 'INFOBIP_WHATSAPP_TEMPLATE_NAME' : ''].filter(Boolean)
        : [!email.apiKey ? 'BREVO_API_KEY' : '', !whatsappSenderNumber ? 'BREVO_WHATSAPP_SENDER_NUMBER' : ''].filter(Boolean),
    },
    sms: {
      configured: smsConfigured,
      apiConfigured: smsProvider === 'infobip' ? infobip.configured : smsProvider === 'custom_http' ? Boolean(customSms.endpoint && customSms.apiKey) : Boolean(email.apiKey),
      providerKey: smsProvider,
      sender: smsProvider === 'infobip' ? infobip.smsSender || null : smsProvider === 'custom_http' ? customSms.sender || null : smsSender || null,
      provider: smsProvider === 'infobip' ? 'Infobip SMS' : smsProvider === 'custom_http' ? 'Custom SMS Provider' : 'Brevo Transactional SMS',
      missing: smsProvider === 'infobip'
        ? [!infobip.apiKey ? 'INFOBIP_API_KEY' : '', !infobip.baseUrl ? 'INFOBIP_BASE_URL' : '', !infobip.smsSender ? 'INFOBIP_SMS_SENDER' : ''].filter(Boolean)
        : smsProvider === 'custom_http'
          ? [!customSms.endpoint ? 'CUSTOM_SMS_ENDPOINT' : '', !customSms.apiKey ? 'CUSTOM_SMS_API_KEY' : '', !customSms.sender ? 'CUSTOM_SMS_SENDER' : ''].filter(Boolean)
        : [!email.apiKey ? 'BREVO_API_KEY' : '', !smsSender ? 'BREVO_SMS_SENDER' : ''].filter(Boolean),
    },
  };
}

function infobipConfig(env) {
  const apiKey = String(env.INFOBIP_API_KEY || '');
  let baseUrl = cleanText(env.INFOBIP_BASE_URL, 220).replace(/\/+$/, '');
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) baseUrl = `https://${baseUrl}`;
  const language = cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_LANGUAGE, 20).toLowerCase();
  return {
    configured: Boolean(apiKey && baseUrl),
    apiKey,
    baseUrl,
    smsSender: cleanText(env.INFOBIP_SMS_SENDER, 40),
    whatsappSender: cleanText(env.INFOBIP_WHATSAPP_SENDER, 40).replace(/[^\d+]/g, ''),
    whatsappTemplateName: cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_NAME, 120),
    whatsappTemplateId: cleanText(env.INFOBIP_WHATSAPP_TEMPLATE_ID, 120),
    whatsappTemplateLanguage: language === 'spanish' ? 'es' : language || 'es',
    whatsappLinkPlacement: cleanText(env.INFOBIP_WHATSAPP_LINK_PLACEMENT, 20).toLowerCase() === 'body' ? 'body' : 'button',
    webhookToken: String(env.INFOBIP_WEBHOOK_TOKEN || ''),
  };
}

function customSmsConfig(env) {
  const endpoint = cleanText(env.CUSTOM_SMS_ENDPOINT, 500);
  return {
    configured: Boolean(endpoint && env.CUSTOM_SMS_API_KEY && cleanText(env.CUSTOM_SMS_SENDER, 40)),
    endpoint,
    apiKey: String(env.CUSTOM_SMS_API_KEY || ''),
    authHeader: cleanText(env.CUSTOM_SMS_AUTH_HEADER, 80) || 'Authorization',
    authScheme: cleanText(env.CUSTOM_SMS_AUTH_SCHEME, 40) || 'Bearer',
    sender: cleanText(env.CUSTOM_SMS_SENDER, 40),
  };
}

function normalizeContactPhone(value, defaultCountryCode = '502') {
  const original = String(value || '').slice(0, 80);
  let digits = original.normalize('NFKC').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  digits = digits.replace(/\D/g, '');
  const countryCode = String(defaultCountryCode || '502').replace(/\D/g, '') || '502';
  if (digits.length === 8 && countryCode) digits = `${countryCode}${digits}`;
  const valid = digits.length >= 8 && digits.length <= 15;
  return { phone: valid ? digits : '', valid, corrected: valid && digits !== original.replace(/\D/g, ''), original };
}
async function sendBrevoApi(config, message) {
  const invitationId = cleanText(message.invitationId, 100);
  const idempotencyKey = cleanText(message.idempotencyKey, 100) || invitationId || crypto.randomUUID();
  const tag = cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment';
  const headers = { idempotencyKey };
  if (invitationId) headers['X-Mailin-custom'] = `invitation_id:${invitationId}`;
  const response = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      to: [{ email: message.to, name: cleanText(message.toName, 140) || undefined }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html,
      tags: [tag],
      headers,
    }),
  }, 25000);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('brevo_rejected');
    error.providerStatus = response.status;
    const providerCode = cleanText(body.code, 120);
    const providerMessage = cleanText(body.message || body.error || body.error_description, 300);
    error.providerMessage = cleanText([providerMessage, providerCode ? `Brevo code: ${providerCode}` : ''].filter(Boolean).join(' '), 420) || 'Brevo rejected the request.';
    throw error;
  }
  const messageId = cleanText(body.messageId, 300);
  if (!messageId) throw new Error('brevo_missing_message_id');
  return { id: messageId, transport: 'api', message: 'Brevo accepted the transactional email API request.' };
}

function smtpHeader(value) {
  return cleanText(value, 500).replace(/[\r\n]+/g, ' ').trim();
}

function base64Utf8(value) {
  const bytes = new TextEncoder().encode(String(value || ''));
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function foldedBase64(value) {
  return base64Utf8(value).match(/.{1,76}/g)?.join('\r\n') || '';
}

function encodedEmailHeader(value) {
  const text = smtpHeader(value);
  return /[^\x20-\x7E]/.test(text) ? `=?UTF-8?B?${base64Utf8(text)}?=` : text;
}

function smtpMessage(config, message, messageId) {
  const boundary = `gazelle-${crypto.randomUUID()}`;
  const tag = smtpHeader(message.tag).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment';
  const invitationId = smtpHeader(message.invitationId);
  const toName = encodedEmailHeader(message.toName || message.to);
  const fromName = encodedEmailHeader(config.senderName);
  const headers = [
    `From: ${fromName} <${config.senderEmail}>`,
    `To: ${toName} <${message.to}>`,
    `Subject: ${encodedEmailHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    `X-Mailin-Tag: ${tag}`,
    invitationId ? `X-Mailin-custom: invitation_id:${invitationId}` : '',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);
  return `${headers.join('\r\n')}\r\n\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldedBase64(message.text)}\r\n--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldedBase64(message.html)}\r\n--${boundary}--\r\n`;
}

async function smtpReadReply(state, timeoutMs = 15000) {
  const lines = [];
  while (true) {
    const newline = state.buffer.indexOf('\n');
    if (newline >= 0) {
      const line = state.buffer.slice(0, newline + 1).replace(/[\r\n]+$/, '');
      state.buffer = state.buffer.slice(newline + 1);
      if (line) lines.push(line);
      const match = line.match(/^(\d{3})([ -])/);
      if (match?.[2] === ' ') return { code: Number(match[1]), lines, text: lines.join(' | ') };
      continue;
    }
    let timer;
    const chunk = await Promise.race([
      state.reader.read(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('brevo_smtp_timeout')), timeoutMs); }),
    ]).finally(() => clearTimeout(timer));
    if (chunk.done) throw new Error('brevo_smtp_disconnected');
    state.buffer += state.decoder.decode(chunk.value, { stream: true });
  }
}

async function smtpCommand(writer, state, command, allowedCodes) {
  await writer.write(new TextEncoder().encode(`${command}\r\n`));
  const reply = await smtpReadReply(state);
  if (!allowedCodes.includes(reply.code)) {
    const error = new Error(reply.code === 535 ? 'brevo_smtp_authentication_failed' : 'brevo_smtp_rejected');
    error.providerStatus = reply.code === 535 ? 401 : 502;
    error.providerMessage = cleanText(reply.text, 400) || 'Brevo SMTP rejected the command.';
    throw error;
  }
  return reply;
}

async function sendBrevoSmtp(config, message) {
  let socket;
  let reader;
  let writer;
  const messageId = `<${crypto.randomUUID()}@gazellehunt.com>`;
  try {
    socket = connectSocket({ hostname: config.smtpHost, port: config.smtpPort }, { secureTransport: 'starttls', allowHalfOpen: false });
    await socket.opened;
    reader = socket.readable.getReader();
    writer = socket.writable.getWriter();
    let state = { reader, decoder: new TextDecoder(), buffer: '' };
    const greeting = await smtpReadReply(state);
    if (greeting.code !== 220) throw new Error('brevo_smtp_greeting_rejected');
    await smtpCommand(writer, state, 'EHLO gazellehunt.com', [250]);
    await smtpCommand(writer, state, 'STARTTLS', [220]);
    reader.releaseLock();
    writer.releaseLock();
    socket = socket.startTls();
    await socket.opened;
    reader = socket.readable.getReader();
    writer = socket.writable.getWriter();
    state = { reader, decoder: new TextDecoder(), buffer: '' };
    await smtpCommand(writer, state, 'EHLO gazellehunt.com', [250]);
    await smtpCommand(writer, state, 'AUTH LOGIN', [334]);
    await smtpCommand(writer, state, btoa(config.smtpLogin), [334]);
    await smtpCommand(writer, state, btoa(config.smtpKey), [235]);
    await smtpCommand(writer, state, `MAIL FROM:<${config.senderEmail}>`, [250]);
    await smtpCommand(writer, state, `RCPT TO:<${message.to}>`, [250, 251]);
    await smtpCommand(writer, state, 'DATA', [354]);
    const mime = smtpMessage(config, message, messageId).replace(/\r?\n\./g, '\r\n..');
    await writer.write(new TextEncoder().encode(`${mime}.\r\n`));
    const accepted = await smtpReadReply(state, 30000);
    if (accepted.code !== 250) {
      const error = new Error('brevo_smtp_message_rejected');
      error.providerStatus = 502;
      error.providerMessage = cleanText(accepted.text, 400);
      throw error;
    }
    await smtpCommand(writer, state, 'QUIT', [221]).catch(() => null);
    const queuedId = accepted.text.match(/<[^>]+>/)?.[0] || messageId;
    return { id: queuedId, transport: 'smtp', message: 'Brevo SMTP relay accepted the transactional email.' };
  } finally {
    try { reader?.releaseLock(); } catch {}
    try { writer?.releaseLock(); } catch {}
    try { socket?.close(); } catch {}
  }
}

async function sendBrevo(env, message) {
  const config = emailConfig(env);
  if (!config.sendingConfigured) throw new Error('email_not_configured');
  if (!cleanEmail(message.to)) {
    const error = new Error('invalid_email');
    error.providerStatus = 422;
    error.providerMessage = 'The candidate email address is invalid. Correct it before sending.';
    throw error;
  }
  return config.transport === 'smtp' ? sendBrevoSmtp(config, message) : sendBrevoApi(config, message);
}
const BREVO_TRANSACTIONAL_EVENTS = Object.freeze([
  'sent', 'delivered', 'hardBounce', 'softBounce', 'blocked', 'spam', 'invalid', 'deferred', 'unsubscribed',
]);

function brevoWebhookPayload(config, webhookUrl) {
  return {
    description: 'Gazelle Assessment transactional delivery events',
    url: webhookUrl,
    events: BREVO_TRANSACTIONAL_EVENTS,
    type: 'transactional',
    batched: false,
    headers: [{ key: 'X-Gazelle-Webhook-Token', value: config.webhookToken }],
  };
}

async function brevoApiRequest(config, path, options = {}) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method: options.method || 'GET',
    headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('brevo_configuration_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.code || 'Brevo rejected the configuration request.', 400);
    throw error;
  }
  return body;
}

async function infobipApiRequest(config, path, options = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: { Accept: 'application/json', Authorization: `App ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('infobip_configuration_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.requestError?.serviceException?.text || body.message || body.error || 'Infobip rejected the messaging request.', 400);
    throw error;
  }
  return body;
}

function infobipTemplateRecords(value, records = []) {
  if (!value || typeof value !== 'object') return records;
  if (!Array.isArray(value)) {
    const templateName = cleanText(value.name || value.templateName, 120);
    const status = cleanText(value.status || value.state || value.registrationStatus, 80);
    if (templateName || status) records.push(value);
  }
  const values = Array.isArray(value) ? value : Object.values(value);
  for (const item of values) {
    if (item && typeof item === 'object') infobipTemplateRecords(item, records);
  }
  return records;
}

function normalizedTemplateStatus(template) {
  return cleanText(template?.status || template?.state || template?.registrationStatus, 80).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function isInfobipTemplateSendable(template) {
  const status = normalizedTemplateStatus(template);
  if (!status) return false;
  if (/(REJECTED|PENDING|IN_REVIEW|PAUSED|DISABLED|DELETED|ARCHIVED)/.test(status)) return false;
  return /(APPROVED|ACTIVE)/.test(status);
}

function findInfobipTemplate(body, templateName, language) {
  const expectedName = cleanText(templateName, 120).toLowerCase();
  const expectedLanguage = cleanText(language, 20).toLowerCase();
  return infobipTemplateRecords(body).find((template) => {
    const name = cleanText(template.name || template.templateName, 120).toLowerCase();
    const id = cleanText(template.id || template.templateId, 120).toLowerCase();
    const templateLanguage = cleanText(template.language || template.locale, 20).toLowerCase();
    return (name === expectedName || id === expectedName) && (!expectedLanguage || !templateLanguage || templateLanguage === expectedLanguage);
  }) || null;
}

async function infobipWhatsAppTemplateStatus(env, templateName = null, language = null) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  const sender = contact.whatsapp.senderNumber;
  const wantedName = cleanText(templateName, 120) || contact.whatsapp.templateName;
  const wantedLanguage = cleanText(language, 20) || contact.whatsapp.templateLanguage || 'es';
  if (!config.configured || !sender || !wantedName) {
    return {
      configured: false,
      sendable: false,
      templateName: wantedName || null,
      language: wantedLanguage,
      status: null,
      missing: contact.whatsapp.missing,
      error: 'Infobip WhatsApp template validation is not configured.',
    };
  }
  const body = await infobipApiRequest(config, `/whatsapp/2/senders/${encodeURIComponent(sender)}/templates`);
  const template = findInfobipTemplate(body, wantedName, wantedLanguage);
  return {
    configured: true,
    sendable: Boolean(template && isInfobipTemplateSendable(template)),
    templateName: wantedName,
    language: wantedLanguage,
    status: template ? normalizedTemplateStatus(template) || null : null,
    missing: [],
    error: template ? null : 'The configured WhatsApp template was not found for this sender and language.',
  };
}

function compactMessage(value, max = 420) {
  return cleanText(value, max).replace(/\s+/g, ' ').trim();
}

function textInvitationCopy(candidate, locale, link) {
  const brand = candidate.candidate_brand_name || 'Allied Global';
  const name = candidate.name || (locale === 'es' ? 'candidato' : 'candidate');
  const role = candidate.role || (locale === 'es' ? 'la posición' : 'the role');
  if (locale === 'es') {
    return compactMessage(`Hola ${name}, ${brand} te invita a completar tu evaluación para ${role}. Toma unos 10 minutos. Entra aquí: ${link}`, 320);
  }
  return compactMessage(`Hi ${name}, ${brand} invited you to complete your assessment for ${role}. It takes about 10 minutes. Open it here: ${link}`, 320);
}

function templateInvitationMessage(candidate, locale, link, step = {}) {
  const safeStep = step || {};
  const template = cleanText(locale === 'es' ? safeStep.message_es : safeStep.message_en, 800);
  if (!template) return textInvitationCopy(candidate, locale, link);
  return compactMessage(template
    .replaceAll('{{name}}', candidate.name || '')
    .replaceAll('{{brand}}', candidate.candidate_brand_name || 'Allied Global')
    .replaceAll('{{role}}', candidate.role || '')
    .replaceAll('{{link}}', link), 800);
}

async function sendBrevoSms(env, message) {
  const config = emailConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured) {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'Brevo SMS'} before SMS journeys can send.`;
    throw error;
  }
  const body = await brevoApiRequest(config, '/transactionalSMS/send', {
    method: 'POST',
    body: {
      sender: contact.sms.sender,
      recipient: message.toPhone,
      content: compactMessage(message.text, 640),
      type: 'transactional',
      tag: cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment',
    },
  });
  const messageId = cleanText(body.messageId || body.reference || body.id, 300) || `brevo-sms-${crypto.randomUUID()}`;
  return { id: messageId, transport: 'sms', message: 'Brevo accepted the transactional SMS request.' };
}

async function sendBrevoWhatsApp(env, message) {
  const config = emailConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.whatsapp.configured) {
    const error = new Error('whatsapp_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.whatsapp.missing.join(', ') || 'Brevo WhatsApp'} before WhatsApp journeys can send.`;
    throw error;
  }
  const payload = {
    senderNumber: contact.whatsapp.senderNumber,
    contactNumbers: [message.toPhone],
  };
  const templateId = cleanText(message.templateId, 80) || contact.whatsapp.templateId;
  if (templateId) payload.templateId = Number.isFinite(Number(templateId)) ? Number(templateId) : templateId;
  else payload.text = compactMessage(message.text, 900);
  const body = await brevoApiRequest(config, '/whatsapp/sendMessage', { method: 'POST', body: payload });
  const messageId = cleanText(body.messageId || body.reference || body.id, 300) || `brevo-whatsapp-${crypto.randomUUID()}`;
  return { id: messageId, transport: 'whatsapp', message: 'Brevo accepted the WhatsApp request.' };
}

async function sendInfobipSms(env, message) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured || contact.sms.providerKey !== 'infobip') {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'Infobip SMS'} before SMS journeys can send.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const body = await infobipApiRequest(config, '/sms/2/text/advanced', {
    method: 'POST',
    body: {
      messages: [{
        from: contact.sms.sender,
        destinations: [{ to: message.toPhone, messageId: providerMessageId }],
        text: compactMessage(message.text, 640),
      }],
    },
  });
  const responseMessage = Array.isArray(body.messages) ? body.messages[0] || {} : {};
  assertInfobipAccepted(responseMessage, 'SMS');
  const messageId = cleanText(responseMessage.messageId || body.bulkId || providerMessageId, 300);
  return { id: messageId, transport: 'sms', message: 'Infobip accepted the SMS request.' };
}

async function sendCustomHttpSms(env, message) {
  const config = customSmsConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.sms.configured || contact.sms.providerKey !== 'custom_http') {
    const error = new Error('sms_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.sms.missing.join(', ') || 'custom SMS provider'} before SMS journeys can send.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const headers = { accept: 'application/json', 'content-type': 'application/json' };
  headers[config.authHeader] = `${config.authScheme} ${config.apiKey}`.trim();
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: config.sender,
      to: message.toPhone,
      text: compactMessage(message.text, 640),
      messageId: providerMessageId,
      tag: cleanText(message.tag, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'gazelle-assessment',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('custom_sms_rejected');
    error.providerStatus = response.status;
    error.providerMessage = cleanText(body.message || body.error || body.code || 'The custom SMS provider rejected the request.', 400);
    throw error;
  }
  const messageId = cleanText(body.messageId || body.id || body.reference || providerMessageId, 300);
  return { id: messageId, transport: 'sms', message: 'The custom SMS provider accepted the request.' };
}

async function sendInfobipWhatsApp(env, message) {
  const config = infobipConfig(env);
  const contact = contactabilityConfig(env);
  if (!contact.whatsapp.configured || contact.whatsapp.providerKey !== 'infobip') {
    const error = new Error('whatsapp_not_configured');
    error.providerStatus = 503;
    error.providerMessage = `Configure ${contact.whatsapp.missing.join(', ') || 'Infobip WhatsApp'} before WhatsApp journeys can send.`;
    throw error;
  }
  const templateName = cleanText(message.templateName, 120) || cleanText(message.templateId, 120) || contact.whatsapp.templateName;
  const language = cleanText(message.templateLanguage, 20) || contact.whatsapp.templateLanguage || 'es';
  const buttonToken = cleanText(message.buttonToken, 500) || cleanText(message.link || '', 500);
  const bodyPlaceholders = [
    cleanText(message.candidate?.name || '', 120),
    cleanText(message.candidate?.candidate_brand_name || 'Allied Global', 120),
    cleanText(message.candidate?.role || '', 120),
  ];
  if (config.whatsappLinkPlacement === 'body') bodyPlaceholders.push(cleanText(message.link || '', 500));
  const templateStatus = await infobipWhatsAppTemplateStatus(env, templateName, language).catch((error) => ({
    configured: contact.whatsapp.configured,
    sendable: null,
    validationUnavailable: true,
    templateName,
    language,
    status: null,
    missing: [],
    error: cleanText(error.providerMessage || error.message || 'Infobip template status could not be checked before sending.', 300),
  }));
  if (!templateStatus.sendable) {
    const error = new Error(templateStatus.validationUnavailable ? 'whatsapp_template_validation_unavailable' : 'whatsapp_template_not_approved');
    error.providerStatus = 422;
    error.providerMessage = templateStatus.validationUnavailable
      ? `Infobip template ${templateName} could not be validated before sending: ${templateStatus.error || 'validation unavailable'}.`
      : `Infobip template ${templateName} is ${templateStatus.status || 'not approved'} and cannot be sent yet.`;
    throw error;
  }
  const providerMessageId = cleanText(message.idempotencyKey, 100) || crypto.randomUUID();
  const body = await infobipApiRequest(config, '/whatsapp/1/message/template', {
    method: 'POST',
    body: {
      messages: [{
        from: contact.whatsapp.senderNumber,
        to: message.toPhone,
        messageId: providerMessageId,
        content: {
          templateName,
          templateData: {
            body: {
              placeholders: bodyPlaceholders,
            },
            ...(config.whatsappLinkPlacement === 'button' ? { buttons: [{ type: 'URL', parameter: buttonToken }] } : {}),
          },
          language,
        },
      }],
    },
  });
  const responseMessage = Array.isArray(body.messages) ? body.messages[0] || {} : {};
  assertInfobipAccepted(responseMessage, 'WhatsApp');
  const messageId = cleanText(responseMessage.messageId || body.bulkId || providerMessageId, 300);
  return { id: messageId, transport: 'whatsapp', message: 'Infobip accepted the WhatsApp template request.' };
}

function assertInfobipAccepted(message, channelLabel) {
  const groupName = cleanText(message?.status?.groupName, 80).toUpperCase();
  const statusName = cleanText(message?.status?.name, 120);
  const description = cleanText(message?.status?.description, 300);
  if (/(REJECTED|UNDELIVERABLE|EXPIRED)/.test(groupName)) {
    const error = new Error(`infobip_${channelLabel.toLowerCase()}_rejected`);
    error.providerStatus = 422;
    error.providerMessage = [statusName, description].filter(Boolean).join(': ') || `Infobip rejected the ${channelLabel} message.`;
    throw error;
  }
}

async function sendSms(env, message) {
  const provider = contactabilityConfig(env).sms.providerKey;
  if (provider === 'infobip') return sendInfobipSms(env, message);
  if (provider === 'custom_http') return sendCustomHttpSms(env, message);
  return sendBrevoSms(env, message);
}

async function sendWhatsApp(env, message) {
  return contactabilityConfig(env).whatsapp.providerKey === 'infobip'
    ? sendInfobipWhatsApp(env, message)
    : sendBrevoWhatsApp(env, message);
}

async function brevoDiagnosticRequest(config, path) {
  try {
    return { ok: true, body: await brevoApiRequest(config, path), error: null };
  } catch (error) {
    return {
      ok: false,
      body: null,
      error: {
        code: cleanText(error.message, 100) || 'brevo_request_failed',
        message: cleanText(error.providerMessage, 300) || 'Brevo could not complete the diagnostic request.',
        status: Number(error.providerStatus || 0) || null,
      },
    };
  }
}

function normalizedProviderMessageId(value) {
  return cleanText(value, 400).replace(/^</, '').replace(/>$/, '').trim();
}

async function brevoBlockedRecipient(config, email) {
  const recipient = cleanEmail(email);
  if (!recipient) return { checked: false, blocked: false, reason: null, senderEmail: null };
  let offset = 0;
  let total = 0;
  let checked = 0;
  for (let page = 0; page < 20; page += 1) {
    const body = await brevoApiRequest(config, `/smtp/blockedContacts?limit=100&offset=${offset}&sort=desc`);
    const contacts = body.contacts || [];
    total = Number(body.count || contacts.length);
    checked += contacts.length;
    const match = contacts.find((contact) => {
      if (cleanEmail(contact.email) !== recipient) return false;
      const blockedSender = cleanEmail(contact.senderEmail);
      return !blockedSender || blockedSender === config.senderEmail;
    });
    if (match) {
      return {
        checked: true,
        blocked: true,
        reason: cleanText(match.reason?.message || match.reason?.code, 240) || 'Blocked or unsubscribed',
        reasonCode: cleanText(match.reason?.code, 100) || null,
        senderEmail: cleanEmail(match.senderEmail) || null,
        blockedAt: cleanText(match.blockedAt, 80) || null,
      };
    }
    offset += contacts.length;
    if (!contacts.length || offset >= total) break;
  }
  return { checked: true, blocked: false, reason: null, senderEmail: null, checkedContacts: checked, totalContacts: total };
}
function isRetryableProviderError(error) {
  const status = Number(error?.providerStatus || 0);
  const code = cleanText(error?.message, 120);
  if (['provider_timeout', 'brevo_smtp_timeout', 'brevo_smtp_disconnected', 'brevo_missing_message_id'].includes(code)) return true;
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500 || (!status && !['invalid_email', 'email_not_configured', 'attempt_limit_reached'].includes(code));
}
function batchDeliveryStatus(batch) {
  const persistedStatus = cleanText(batch.status, 80);
  if (['queued', 'processing', 'failed'].includes(persistedStatus)) return persistedStatus;
  const accepted = Number(batch.accepted_count || 0);
  const failed = Number(batch.failed_count || 0);
  const providerConfirmed = Number(batch.provider_confirmed_count || 0);
  const delivered = Number(batch.delivered_count || 0);
  if (!accepted) return failed ? 'failed' : persistedStatus;
  if (delivered >= accepted) return failed ? 'delivered_with_errors' : 'delivered';
  if (providerConfirmed >= accepted) return failed ? 'provider_confirmed_with_errors' : 'provider_confirmed';
  if (providerConfirmed > 0) return 'partially_confirmed';
  return 'provider_unconfirmed';
}
function normalizedBrevoEvent(value) {
  return cleanText(value, 80).replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[ -]+/g, '_').toLowerCase() || 'unknown';
}

function brevoInvitationId(eventData) {
  const custom = cleanText(eventData['X-Mailin-custom'] || eventData['x-mailin-custom'], 500);
  return cleanText(custom.match(/(?:^|\|)invitation_id:([^|]+)/)?.[1], 100) || null;
}

function brevoInvitationStatus(eventType) {
  if (['request', 'requests', 'sent'].includes(eventType)) return 'accepted';
  if (eventType === 'delivered') return 'delivered';
  if (['deferred', 'soft_bounce', 'soft_bounces'].includes(eventType)) return 'deferred';
  if (['hard_bounce', 'hard_bounces'].includes(eventType)) return 'hard_bounce';
  if (['invalid', 'invalid_email'].includes(eventType)) return 'invalid_email';
  if (['spam', 'spam_reports'].includes(eventType)) return 'complained';
  if (['blocked', 'unsubscribed', 'error'].includes(eventType)) return eventType;
  return null;
}

function brevoDeliverySummary(events, blockedRecipient, messageFound) {
  const normalizedEvents = (events || []).map((event) => ({
    event: normalizedBrevoEvent(event.event),
    date: cleanText(event.date, 80) || null,
    reason: cleanText(event.reason || event.code, 240) || null,
  }));
  const latest = [...normalizedEvents].sort((left, right) => Date.parse(right.date || 0) - Date.parse(left.date || 0))[0] || null;
  const delivered = normalizedEvents.find((event) => event.event === 'delivered');
  const failure = normalizedEvents.find((event) => ['hard_bounce', 'hard_bounces', 'invalid', 'invalid_email', 'blocked', 'spam', 'spam_reports', 'unsubscribed', 'error'].includes(event.event));
  const deferred = normalizedEvents.find((event) => ['deferred', 'soft_bounce', 'soft_bounces'].includes(event.event));
  if (blockedRecipient?.blocked) return { status: 'blocked', reason: blockedRecipient.reason || failure?.reason || 'Recipient is blocklisted in Brevo.' };
  if (delivered) return { status: 'delivered', reason: null };
  if (failure) return { status: brevoInvitationStatus(failure.event) || 'failed', reason: failure.reason || 'Brevo reported a delivery failure.' };
  if (deferred) return { status: 'deferred', reason: deferred.reason || 'The recipient server temporarily delayed the message.' };
  if (messageFound || normalizedEvents.some((event) => ['request', 'requests', 'sent'].includes(event.event))) return { status: 'pending', reason: latest?.reason || null };
  return { status: 'not_found', reason: null };
}
function infobipInboundEvents(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.messages)) return body.messages;
  if (Array.isArray(body?.events)) return body.events;
  return body && typeof body === 'object' ? [body] : [];
}
