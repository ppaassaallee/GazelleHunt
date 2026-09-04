/**
 * RYVO runtime — audit events.
 * Table name unchanged: audit_events (Gazelle production schema).
 * Move-only extraction from server-worker.js. Do not improve.
 */
async function audit(env, actor, type, entityType, entityId, payload) {
  await env.DB.prepare(`INSERT INTO audit_events (id, actor_email, event_type, entity_type, entity_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), actor || null, type, entityType, entityId, JSON.stringify(payload || {}), new Date().toISOString())
    .run();
}
