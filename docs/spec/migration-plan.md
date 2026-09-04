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

Patrón: script plano en `packages/runtime/src/*` y `playbooks/recupera/{stage,api}.js`, concatenado en `build.mjs` antes del legacy server (orden: audit → messaging → contactability → journeys → templates → portal → ai → webhooks → recupera stage → recupera api → server). Cero cambios de esquema. Sin deploy a producción de Gazelle sin OK explícito.

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
- [x] Recupera `payment_received` goal path (obligation link + payments check in `journeyGoalReached`)
- [ ] Journey-por-etapa / playbook-specific stop events from `stop_events_json`

## §8.E — Recupera scaffold (en progreso)

**Entregable:** paquete declarativo `playbooks/recupera/` + tablas `playbook_installations` (`0019`) y obligaciones Recupera (`0020`).
API HTTP mínima detrás de feature flag; sin UI ni cablear Recupera en producción sin `RECUPERA_ENABLED` o tenant habilitado.

**En progreso:**

- [x] `playbooks/recupera/` — manifest, states, strategies, policies (datos declarativos)
- [x] `playbooks/gazelle-hunt/manifest.js` — documenta Gazelle como Playbook #1
- [x] Migración `0019_playbook_installations.sql` + `schemaStatements` / `runtimeColumnMigrations`
- [x] Test `playbooks/recupera/tests/manifest.test.mjs` en `pnpm test`
- [x] Migración `0020_recupera_obligations.sql` — `obligations`, `promises`, `disputes`, `payments` + `schemaStatements`
- [x] `playbooks/recupera/engine.js` — funciones puras de etapa (DPD, promesa, pago)
- [x] Test `playbooks/recupera/tests/engine.test.mjs` en `pnpm test`
- [x] `journeyGoalReached` stub `payment_received` (sin tocar SELECT Gazelle)
- [x] `playbooks/recupera/stage.js` + `playbooks/recupera/api.js` — API HTTP detrás de feature flag (`RECUPERA_ENABLED` o `playbooks_enabled_json`)
- [x] Rutas: `POST /api/recupera/install`, `GET /api/recupera/installation`, `GET /api/recupera/obligations`, `POST /api/recupera/obligations/import`
- [x] Test `apps/worker/tests/recupera-api.test.mjs` en `pnpm test`
- [x] Migración `0021_obligation_journey_links.sql` — enlaza obligación ↔ enrollment sin romper UNIQUE Gazelle
- [x] `POST /api/recupera/obligations/:id/activate` — candidato + lista Recupera + journey email-only + enrollment (`RECUPERA_ACTIVATE_ENABLED` ≠ `false`)
- [x] `POST /api/recupera/obligations/:id/mark-paid` — demo local (`RECUPERA_MARK_PAID_ENABLED=true`)
- [x] `journeyGoalReached` `payment_received` — pagos vía `obligation_journey_links` o `subject_candidate_id`
- [x] `test_recupera_obligation` catalog seed + `executableTest` acepta `recupera_obligation`
- [x] UI Recupera: Activar seguimiento / Marcar pagado
- [x] Migración `0023_rocio_intent_jobs.sql` — jobs de intención Rocío + `schemaStatements`
- [x] `playbooks/recupera/rocio.js` — clasificador heurístico v1 (sin LLM) + `rocioProcessInbound`
- [x] API: `POST /api/recupera/rocio/classify`, `POST /api/recupera/obligations/:id/inbound-message`
- [x] Infobip webhook hook opcional (`RECUPERA_ROCIO_INBOUND=true`) para candidatos Recupera con `stop_on_reply=0`
- [x] UI Recupera: simular respuesta (clasificar / aplicar)
- [x] Test `playbooks/recupera/tests/rocio.test.mjs` en `pnpm test`
- [x] `GET /api/recupera/insights` — analytics (pending, recovered, aging, Rocío jobs)
- [x] `playbooks/recupera/recompute.js` — recomputo diario de etapas DPD (cron UTC 00:00)
- [x] Test `playbooks/recupera/tests/recompute.test.mjs` en `pnpm test`
- [x] UI Insights (`InsightsPage`) — hero pendiente + antigüedad + Rocío
- [x] Home hero con `pendingCents` desde insights
- [ ] Rocío LLM / voz

## §8.F — Shell React (scaffold)

**Entregable:** `apps/web` — Vite + React 19 + TypeScript + Tailwind v4, paquete `@ryvo/web`.
Shell mínimo (rail desktop, tab bar móvil, tokens light/dark). Sin integración Worker aún.

**En progreso:**

- [x] Scaffold `apps/web` (`pnpm dev:web`, `pnpm build:web`)
- [x] Nav: Inicio, Playbooks, Trabajo, Insights (+ Ajustes solo desktop)
- [x] Stubs: Playbooks (Recupera / Sube / Monetiza); Home e Insights con datos Recupera
- [x] UI Recupera: instalar + listar + agregar obligación (`/api/recupera/*`, proxy Vite → `:8787`)
- [x] UI Recupera: activar seguimiento + marcar pagado (demo)
- [x] Import CSV/paste + `autoActivate` en `POST /api/recupera/obligations/import` (`playbooks/recupera/csv.js`)
- [x] `GET /api/recupera/exceptions` — pendientes (promesas rotas, reclamos, pagos por verificar, Rocío needs_human, aging DPD_60+/LEGAL)
- [x] `POST /api/recupera/exceptions/:type/:id/resolve` — confirmar pago, descartar promesa/reclamo
- [x] UI Trabajo (`WorkPage`) — lista Pendientes + hero total; Home muestra total si fetch OK
- [x] UI Recupera: simular respuesta Rocío (clasificar / aplicar)
- [x] UI Insights (`InsightsPage`) — hero pendiente + antigüedad + Rocío; Home con `pendingCents`
- [ ] Servir desde Worker / strangler sobre `app.js`
- [ ] Auth unificada en UI (hoy: cookies Gazelle vía proxy)

**DO NOT:** Cambiar `wrangler` ni reemplazar Gazelle `app.js` hasta fase H.

## §8.G–H

Pagos + Rocío texto → Voz + Control → Gazelle al shell React.

Ver Master Brief v3 completo en el prompt de producto / `docs/spec/` (añadir cuando se archive el brief).
