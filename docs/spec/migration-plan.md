# RYVO migration plan (Master Brief v3 §8)

Fuente de verdad para el strangler de Gazelle Hunt → RYVO Runtime + Playbooks.

## Principio

Cada fase termina con Gazelle Hunt en producción, tests verdes y una migración D1 aplicada.
Nunca hay una rama "RYVO" que viva meses separada.

## §8.A — Monorepo (esta fase)

**Entregable:** `ryvo/` con `apps/worker` = Gazelle tal cual; esbuild produce `dist/server/index.js` equivalente;
tests movidos y verdes; footer/login/OG "Gazelle Hunt · by RYVO".

**Acceptance:**

- [x] `pnpm test` verde
- [x] `wrangler deploy --dry-run` OK desde `apps/worker`
- [x] Diff funcional = 0 (mismo Worker, mismas rutas, mismo esquema)
- [x] Branding: Gazelle Hunt · by RYVO en login, shell brand y OG

Completado 2026-09-04 en este monorepo.

**DO NOT:** Recupera, cambios de esquema, refactor de funciones en `server-worker.js`.

## §8.B — Extraer runtime sin renombrar

Partir `server-worker.js` en módulos de `packages/runtime` con los mismos nombres de tabla.

**En progreso (módulo a módulo):**

| Módulo | Estado |
|---|---|
| `audit` (`audit_events`) | extraído + test |
| `messaging` (Brevo / Infobip / SMS / WhatsApp) | extraído + test |
| `journeys` (contact_journeys, enrollments, events) | extraído + test |
| `templates` (message_templates) | extraído + test |
| `portal` (candidate_portal_links) | extraído + test |
| `ai` (OpenAI / Gemini provider layer) | extraído + test |
| `webhooks` (Brevo / Infobip inbound) | extraído + test |

Patrón: script plano en `packages/runtime/src/*`, concatenado en `build.mjs` antes del legacy server (orden: audit → messaging → contactability → journeys → templates → portal → ai → webhooks → server). Cero cambios de esquema. Sin deploy a producción de Gazelle sin OK explícito.

## §8.C — Drizzle + gaps del motor

Retry, contactabilidad, batch size, `ryvo_staff`.

**7.1 Journey event retry**

- [x] `contact_journey_events.next_retry_at` + retry index (`0016`)
- [x] `processDueJourneyEvent` requeues with backoff 5m / 30m / 2h (max 3 attempts)
- [x] `processDueJourneyEvents` respects `next_retry_at` in due query

**7.2 Contactability**

- [x] Candidate columns: `do_not_contact`, `opt_out_channels_json`, `quiet_hours_*`, `timezone`
- [x] `packages/runtime/src/contactability.js` (`canContact`)
- [x] Wired before send in `processDueJourneyEvent` (skip / requeue)

**7.3 Batch size**

- [x] `JOURNEY_BATCH_SIZE` env (default 25, max 100) in `processDueJourneyEvents`
- [ ] Cloudflare Queues for journey dispatch (later)

**7.4 RYVO staff flag (`ryvo_staff`)**

- [x] `users.ryvo_staff` column + backfill for active `super_admin` rows (`0017`)
- [x] Drop legacy email-allowlist SQLite triggers (`0017`)
- [x] `isSuperAdmin()` checks `ryvo_staff` (table-driven; no hard-coded emails in runtime)
- [x] Owner bootstrap sets `ryvo_staff = 1` on first `SUPER_ADMIN_EMAIL` signup
- [x] `runtimeColumnMigrations` entry for `users.ryvo_staff` (ensureSchema parity)

## §8.D — Generalizar

`subjects`, goal/stop configurables, journey-por-etapa, vistas de compatibilidad.

**En progreso (parcial):**

- [x] `contact_journeys.stop_on_reply` (default 1) + `stop_events_json` (`0018`)
- [x] `goal_event` on journeys (default `assessment_completed`; column since `0012`, runtime parity via `runtimeColumnMigrations`)
- [x] `journeyGoalReached()` switch in `packages/runtime/src/journeys.js` (`assessment_completed` path = current Gazelle behavior)
- [x] `processDueJourneyEvents` SELECT includes `goal_event`, `stop_on_reply`, `stop_events_json`
- [x] Infobip inbound respects per-journey `stop_on_reply` (0 = store message, keep enrollment active)
- [ ] Rename `candidates` → `subjects` + compatibility views
- [ ] Recupera `payment_received` goal path
- [ ] Journey-por-etapa / playbook-specific stop events from `stop_events_json`

## §8.E–H

Recupera core → Pagos + Rocío texto → Voz + Control → Gazelle al shell React.

Ver Master Brief v3 completo en el prompt de producto / `docs/spec/` (añadir cuando se archive el brief).
