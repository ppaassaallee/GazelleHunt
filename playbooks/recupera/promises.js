/**
 * Recupera broken promise sweeper — plain script for Worker concat (after recompute.js).
 * Marks overdue open promises as broken and restores obligation stage from due_date.
 */
async function recuperaSweepBrokenPromises(env) {
  if (!(await recuperaRecomputeShouldRun(env))) return { broken: 0, stagesUpdated: 0 };
  let rows;
  try {
    rows = await env.DB.prepare(`
      SELECT p.id, p.company_id, p.obligation_id, o.due_date, o.stage_key
      FROM promises p
      INNER JOIN obligations o ON o.id = p.obligation_id
      WHERE p.status = 'open' AND p.promise_date < date('now')
    `).all();
  } catch {
    return { broken: 0, stagesUpdated: 0 };
  }
  const broken = rows.results || [];
  if (!broken.length) return { broken: 0, stagesUpdated: 0 };

  const now = new Date();
  const nowIso = now.toISOString();
  const statements = [];
  const stageChanges = [];

  for (const row of broken) {
    statements.push(env.DB.prepare(`
      UPDATE promises SET status = 'broken', updated_at = ? WHERE id = ?
    `).bind(nowIso, row.id));
    if (row.stage_key === 'PROMISE') {
      const newStage = recuperaNextStageAfterBrokenPromise({ due_date: row.due_date }, now);
      if (newStage !== row.stage_key) {
        stageChanges.push({
          obligationId: row.obligation_id,
          promiseId: row.id,
          from: row.stage_key,
          to: newStage,
        });
        statements.push(env.DB.prepare(`
          UPDATE obligations SET stage_key = ?, updated_at = ? WHERE id = ?
        `).bind(newStage, nowIso, row.obligation_id));
      }
    }
  }

  await env.DB.batch(statements);
  await audit(env, 'recupera-cron', 'recupera_promises_broken', 'company', broken[0].company_id, {
    brokenCount: broken.length,
    stagesUpdated: stageChanges.length,
    changes: broken.slice(0, 50).map((row) => ({
      promiseId: row.id,
      obligationId: row.obligation_id,
      stageFrom: row.stage_key,
      stageTo: stageChanges.find((entry) => entry.promiseId === row.id)?.to ?? null,
    })),
  });
  return { broken: broken.length, stagesUpdated: stageChanges.length };
}
