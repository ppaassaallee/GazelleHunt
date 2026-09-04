/**
 * Meikapen runtime — candidate portal links.
 * Table name unchanged: candidate_portal_links (Gazelle production schema).
 * Move-only extraction from server-worker.js. Do not improve.
 */
async function createCandidatePortalLink(env, candidateId, origin) {
  const token = randomToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(`INSERT INTO candidate_portal_links (id, candidate_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), candidateId, await sha256(token), expiresAt, now.toISOString()).run();
  return { link: `${origin}/candidate?invite=${encodeURIComponent(token)}`, expiresAt };
}
