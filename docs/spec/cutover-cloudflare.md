# Cutover Cloudflare — Gazelle → Meikapen Worker

**Regla:** un solo Worker / D1 Gazelle. Sin segundo deploy.

## Estado live (2026-09-04)

| Pieza | Valor |
|---|---|
| Worker | `gazelle-assessment` |
| **Prod Gazelle** | **https://gazellehunt.meikapen.com** |
| Fallback | `https://gazelle-assessment.gazellehunt.workers.dev` |
| `APP_BASE_URL` | `https://gazellehunt.meikapen.com` |
| Shell `/ryvo/` | on |
| **Recupera** | **`RECUPERA_ENABLED=true`** |
| Auth reset | Forgot password + admin Brevo |

## Checklist

- [x] Deploy monorepo al Worker Gazelle
- [x] Custom domain `gazellehunt.meikapen.com`
- [x] `APP_BASE_URL` nuevo host
- [x] Smoke paths + password reset
- [x] Aviso login en workers.dev
- [x] **Recupera encendido en prod**
- [ ] Apex `meikapen.com` + `www` → Custom Domain en dashboard (DNS NS ya Cloudflare; attach wrangler 409)
- [ ] Infobip webhook + botón WA → host nuevo
- [ ] Brevo webhook → host nuevo
- [ ] Google OAuth redirect (si aplica candidatos)

## Apex (tú en dashboard, 2 min)

1. Workers → `gazelle-assessment` → Domains → **Add Custom Domain**
2. Añade `meikapen.com` y `www.meikapen.com`
3. Si falla: DNS de la zona → borra A/CNAME conflictivos del apex/`www`, reintenta
4. Con apex live, `/` en `meikapen.com` = hub Meikapen (hostname-aware)

## Providers (manual)

| Provider | Acción |
|---|---|
| Infobip webhook | `https://gazellehunt.meikapen.com/api/infobip/webhook` |
| Infobip/Meta botón | `https://gazellehunt.meikapen.com/candidate?invite={{1}}` |
| Brevo webhook | mismo origen canónico |
| Google OAuth | `${APP_BASE_URL}/api/candidate/auth/google/callback` |

## Recupera

Flag global on. Entrar: https://gazellehunt.meikapen.com/ryvo/ → Recupera (onboarding 5 pasos).

## Rollback

Worker Deployments → versión anterior. Flag: `RECUPERA_ENABLED=false` + redeploy.
