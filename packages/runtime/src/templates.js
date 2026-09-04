/**
 * Meikapen runtime — message templates (CRUD, defaults).
 * Table name unchanged: message_templates (Gazelle production schema).
 * Move-only extraction from server-worker.js. Do not improve.
 */
async function ensureDefaultMessageTemplates(env, companyId) {
  const now = new Date().toISOString();
  const contact = contactabilityConfig(env);
  const statements = [
    env.DB.prepare(`
      INSERT OR IGNORE INTO message_templates
        (id, company_id, channel, provider, name, provider_template_name, provider_template_id, language, status, subject_en, subject_es, message_en, message_es, created_at, updated_at)
      VALUES (?, ?, 'email', 'brevo', 'Default assessment invitation email', 'gazelle_email_invitation', NULL, 'es', 'active',
        'Your assessment is ready', 'Tu evaluación está lista',
        'Hi {{name}}, {{brand}} invites you to complete your assessment for {{role}}. It takes about 10 minutes. Open it here: {{link}}',
        'Hola {{name}}, {{brand}} te invita a completar tu evaluación para {{role}}. Toma unos 10 minutos. Entra aquí: {{link}}',
        ?, ?)
    `).bind(`tpl_email_default_${companyId}`, companyId, now, now),
  ];
  if (contact.whatsapp.providerKey === 'infobip' && contact.whatsapp.templateName) {
    statements.push(env.DB.prepare(`
      INSERT OR IGNORE INTO message_templates
        (id, company_id, channel, provider, name, provider_template_name, provider_template_id, language, status, subject_en, subject_es, message_en, message_es, created_at, updated_at)
      VALUES (?, ?, 'whatsapp', 'infobip', 'Gazelle assessment invitation WhatsApp', ?, ?, ?, 'approved', NULL, NULL,
        'Hi {{name}}, {{brand}} invites you to complete your assessment for {{role}}. Open it here: {{link}}',
        'Hola {{name}}, {{brand}} te invita a completar tu evaluación para {{role}}. Entra aquí: {{link}}',
        ?, ?)
    `).bind(`tpl_whatsapp_${companyId}_${contact.whatsapp.templateName}`, companyId, contact.whatsapp.templateName, contact.whatsapp.templateId || null, contact.whatsapp.templateLanguage || 'es', now, now));
  }
  await env.DB.batch(statements);
}

async function listMessageTemplates(env, user) {
  const scope = companyAssetScope(user, 'mt');
  const rows = await env.DB.prepare(`
    SELECT mt.*, c.name AS company_name, u.name AS created_by_name
    FROM message_templates mt
    JOIN companies c ON c.id = mt.company_id
    LEFT JOIN users u ON u.id = mt.created_by_user_id
    WHERE ${scope.sql}
    ORDER BY mt.channel, mt.status = 'active' DESC, mt.status = 'approved' DESC, mt.updated_at DESC
  `).bind(...scope.bindings).all();
  return rows.results || [];
}

async function messageTemplateByReference(env, user, companyId, channel, reference, language = 'es') {
  const cleanReference = cleanText(reference, 140);
  if (!cleanReference) return null;
  const scope = companyAssetScope(user, 'mt');
  return env.DB.prepare(`
    SELECT mt.* FROM message_templates mt
    WHERE mt.company_id = ? AND mt.channel = ? AND ${scope.sql}
      AND mt.status IN ('approved', 'active')
      AND (mt.id = ? OR mt.provider_template_name = ? OR mt.provider_template_id = ? OR mt.name = ?)
      AND (? = '' OR mt.language = ? OR mt.language = 'es')
    ORDER BY mt.status = 'active' DESC, mt.updated_at DESC LIMIT 1
  `).bind(companyId, channel, ...scope.bindings, cleanReference, cleanReference, cleanReference, cleanReference, cleanText(language, 20), cleanText(language, 20)).first();
}

async function createMessageTemplate(request, env, user) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Admin access is required to manage templates.', code: 'admin_required' }, 403);
  const body = await request.json().catch(() => ({}));
  const channel = ['email', 'whatsapp', 'sms'].includes(body.channel) ? body.channel : '';
  const requestedProvider = ['brevo', 'infobip', 'custom'].includes(body.provider) ? body.provider : 'custom';
  const provider = channel === 'email' ? 'brevo' : channel === 'whatsapp' ? 'infobip' : requestedProvider;
  const companyId = isSuperAdmin(user) ? cleanText(body.companyId || user.companyId, 100) : user.companyId;
  const company = await env.DB.prepare(`SELECT id FROM companies WHERE id = ? AND status = 'active'`).bind(companyId).first();
  const name = cleanText(body.name, 140);
  const language = body.language === 'en' ? 'en' : 'es';
  const requestedStatus = cleanText(body.status, 30);
  const status = ['draft', 'approved', 'active', 'paused', 'rejected'].includes(requestedStatus) ? requestedStatus : channel === 'whatsapp' ? 'draft' : 'active';
  const providerTemplateName = cleanText(body.providerTemplateName, 140) || (channel === 'email' ? cleanText(body.name, 140).toLowerCase().replace(/[^a-z0-9]+/g, '_') : '');
  const providerTemplateId = cleanText(body.providerTemplateId, 140) || null;
  const messageEn = cleanText(body.messageEn, 1200);
  const messageEs = cleanText(body.messageEs, 1200);
  if (!company || !channel || !name || !messageEn || !messageEs) return json({ error: 'Company, channel, name, English message, and Spanish message are required.', code: 'invalid_template' }, 422);
  if (channel === 'whatsapp' && provider !== 'infobip') return json({ error: 'WhatsApp templates must use Infobip in this workspace.', code: 'invalid_whatsapp_provider' }, 422);
  if (channel === 'whatsapp' && !providerTemplateName) return json({ error: 'WhatsApp requires the approved Infobip template name.', code: 'whatsapp_template_name_required' }, 422);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  try {
    await env.DB.prepare(`
      INSERT INTO message_templates
        (id, company_id, channel, provider, name, provider_template_name, provider_template_id, language, status, subject_en, subject_es, message_en, message_es, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, company.id, channel, provider, name, providerTemplateName || null, providerTemplateId, language, status, cleanText(body.subjectEn, 180) || null, cleanText(body.subjectEs, 180) || null, messageEn, messageEs, user.id, now, now).run();
  } catch {
    return json({ error: 'A template with that provider name and language already exists for this company.', code: 'template_exists' }, 409);
  }
  await audit(env, user.email, 'message_template_created', 'message_template', id, { companyId: company.id, channel, provider, status, providerTemplateName });
  return json({ templateId: id, templates: await listMessageTemplates(env, user) }, 201);
}

async function updateMessageTemplate(request, env, user, templateId) {
  if (!canManageCompanyAssets(user)) return json({ error: 'Admin access is required to manage templates.', code: 'admin_required' }, 403);
  const scope = companyAssetScope(user, 'mt');
  const template = await env.DB.prepare(`SELECT mt.* FROM message_templates mt WHERE mt.id = ? AND ${scope.sql}`).bind(templateId, ...scope.bindings).first();
  if (!template) return json({ error: 'Template not found.', code: 'template_not_found' }, 404);
  const body = await request.json().catch(() => ({}));
  const status = ['draft', 'approved', 'active', 'paused', 'rejected', 'archived'].includes(body.status) ? body.status : template.status;
  const now = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE message_templates
    SET name = ?, provider_template_name = ?, provider_template_id = ?, language = ?, status = ?,
      subject_en = ?, subject_es = ?, message_en = ?, message_es = ?, updated_at = ?
    WHERE id = ?
  `).bind(
    cleanText(body.name ?? template.name, 140),
    cleanText(body.providerTemplateName ?? template.provider_template_name, 140) || null,
    cleanText(body.providerTemplateId ?? template.provider_template_id, 140) || null,
    body.language === 'en' ? 'en' : body.language === 'es' ? 'es' : template.language,
    status,
    cleanText(body.subjectEn ?? template.subject_en, 180) || null,
    cleanText(body.subjectEs ?? template.subject_es, 180) || null,
    cleanText(body.messageEn ?? template.message_en, 1200) || template.message_en,
    cleanText(body.messageEs ?? template.message_es, 1200) || template.message_es,
    now,
    template.id,
  ).run();
  await audit(env, user.email, 'message_template_updated', 'message_template', template.id, { status });
  return json({ templates: await listMessageTemplates(env, user) });
}
