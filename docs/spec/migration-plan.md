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
| journeys / messaging / templates / portal / ai | pendiente |

Patrón: script plano en `packages/runtime/src/*`, concatenado en `build.mjs` antes del legacy server (mismo mecanismo que engine/AI). Cero cambios de esquema. Sin deploy a producción de Gazelle sin OK explícito.

## §8.C — Drizzle + gaps del motor

Retry, contactabilidad, batch size, `ryvo_staff`.

## §8.D — Generalizar

`subjects`, goal/stop configurables, journey-por-etapa, vistas de compatibilidad.

## §8.E–H

Recupera core → Pagos + Rocío texto → Voz + Control → Gazelle al shell React.

Ver Master Brief v3 completo en el prompt de producto / `docs/spec/` (añadir cuando se archive el brief).
