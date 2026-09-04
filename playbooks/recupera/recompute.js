/**
 * Recupera stage recompute — plain script for Worker concat (after stage.js).
 * Daily-ish: advances DPD buckets for open obligations based on due_date.
 */
const RECUPERA_RECOMPUTE_PROTECTED_STAGES = new Set(['PROMISE', 'DISPUTE', 'PAID', 'LEGAL', 'CLOSED']);

async function recuperaRecomputeShouldRun(env) {
  if (env.RECUPERA_ENABLED === 'true') return true;
  try {
    const row = await env.DB.prepare(`
      SELECT 1 AS ok FROM playbook_installations WHERE playbook_key = ? AND status = 'active' LIMIT 1
    `).bind('recupera').first();
    return Boolean(row?.ok);
  } catch {
    return false;
  }
}

async function recuperaRecomputeStages(env) {
  if (!(await recuperaRecomputeShouldRun(env))) return { updated: 0 };
  let rows;
  try {
    rows = await env.DB.prepare(`
      SELECT id, company_id, due_date, stage_key FROM obligations WHERE status = 'open'
    `).all();
  } catch {
    return { updated: 0 };
  }
  const now = new Date();
  const nowIso = now.toISOString();
  const updates = [];
  for (const row of rows.results || []) {
    if (RECUPERA_RECOMPUTE_PROTECTED_STAGES.has(row.stage_key)) continue;
    const newStage = recuperaStageFromDueDate(row.due_date, now);
    if (newStage === row.stage_key) continue;
    updates.push({ id: row.id, companyId: row.company_id, from: row.stage_key, to: newStage });
  }
  if (!updates.length) return { updated: 0 };
  const statements = updates.map((entry) => env.DB.prepare(`
    UPDATE obligations SET stage_key = ?, updated_at = ? WHERE id = ?
  `).bind(entry.to, nowIso, entry.id));
  await env.DB.batch(statements);
  // TODO: re-enroll journey when stage crosses DPD bucket boundaries (e.g. DPD_1_7 → DPD_8_15).
  await audit(env, 'recupera-cron', 'recupera_stages_recomputed', 'company', updates[0].companyId, {
    updatedCount: updates.length,
    changes: updates.slice(0, 50).map((entry) => ({ obligationId: entry.id, from: entry.from, to: entry.to })),
  });
  return { updated: updates.length };
}
