# Cutover Cloudflare — Gazelle → Meikapen Worker

**Regla:** usar **solo** la infra Gazelle ya en producción.  
**No** crear zona Cloudflare nueva. **No** segundo Worker. **No** otra D1.

Objetivo: el Worker existente `gazelle-assessment`
(`https://gazelle-assessment.gazellehunt.workers.dev`) sirve el monorepo
Meikapen (Gazelle + Recupera + shell).

## Qué ya es de Gazelle (reutilizar)

| Pieza | Valor prod |
|---|---|
| Worker | `gazelle-assessment` |
| URL | `https://gazelle-assessment.gazellehunt.workers.dev` |
| Account | mismo OAuth / account ID Gazelle |
| D1 | `gazelle-assessment-production` (`2097c7fc-…`) |
| Cron | `*/1 * * * *` (journeys) |
| Email / WA / SMS | Brevo + Infobip (secrets existentes) |
| Auth / journeys / templates / portal / ai_jobs | runtime Gazelle |

## Preflight

- [x] Acceso Cloudflare al Worker `gazelle-assessment`
- [x] `wrangler whoami` OK
- [x] `pnpm test` verde
- [x] Deploy al **mismo** Worker (sin routes custom_domain nuevas)

## Flags primer cutover

| Var | Valor |
|---|---|
| `MEIKAPEN_PLATFORM_ROOT` | `false` (`/` = Gazelle en workers.dev) |
| `RYVO_SHELL_ENABLED` | `true` (`/ryvo/`) |
| `RECUPERA_ENABLED` | `false` hasta OK cobros |
| `APP_BASE_URL` | `https://gazelle-assessment.gazellehunt.workers.dev` |

## DNS / dominios

| Paso | Estado |
|---|---|
| Custom domain live | **`gazellehunt.meikapen.com`** → Worker `gazelle-assessment` |
| Apex `meikapen.com` | Aún parking / NS públicos GoDaddy — no usar todavía |
| `APP_BASE_URL` | `https://gazellehunt.meikapen.com` |

Smoke OK: `/`, `/ryvo/`, `/gazellehunt`, `/recupera` en el subdomain.

## Rollback

Cloudflare → Worker → Deployments → versión anterior.

## Smoke

```bash
curl -sI https://gazelle-assessment.gazellehunt.workers.dev/
curl -sI https://gazelle-assessment.gazellehunt.workers.dev/ryvo/
curl -sI https://gazelle-assessment.gazellehunt.workers.dev/gazellehunt
curl -sI https://gazelle-assessment.gazellehunt.workers.dev/recupera
```
