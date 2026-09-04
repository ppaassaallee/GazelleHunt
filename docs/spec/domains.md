# Dominios — Meikapen

## Destino

Un solo Worker / D1 (hoy `gazelle-assessment`). Gazelle Hunt **no** se monta en otro sitio: se toma el control del Worker existente y se sirve junto a Recupera bajo Meikapen.

| Superficie | URL destino | Path en el Worker |
|---|---|---|
| Plataforma madre | `meikapen.com` | `/` cuando `MEIKAPEN_PLATFORM_ROOT=true` |
| Shell (app) | `meikapen.com` → Entrar | `/ryvo/` (histórico; UI = Meikapen) |
| Recupera | `meikapen.com/recupera` | `/recupera` |
| Gazelle Hunt | `meikapen.com/gazellehunt` | `/gazellehunt` (+ `/` mientras el host sea Gazelle) |
| Prod Gazelle actual | `gazelle-assessment.gazellehunt.workers.dev` | `/` = Gazelle hasta cutover DNS |

**Prod canónico hoy:** infra Gazelle —  
`https://gazelle-assessment.gazellehunt.workers.dev`  
(mismo Worker, misma D1, mismos providers). **No zona Cloudflare nueva.**

Marca / dominio futuro `meikapen.com` (GoDaddy): no bloquea el producto; ver
`docs/spec/cutover-cloudflare.md`.

## Hosts

- **Host Gazelle (workers.dev):** `/` = Gazelle Hunt (`MEIKAPEN_PLATFORM_ROOT=false`).
- **Local / hub flag:** `MEIKAPEN_PLATFORM_ROOT=true` → `/` hub; Gazelle en `/gazellehunt`.
- **Hostname `meikapen.com`:** solo si algún día apunta al **mismo** Worker (sin zona nueva obligatoria).

## Cutover

1. [x] Deploy al Worker Gazelle `gazelle-assessment` (Recupera off).
2. Paths: `/`, `/ryvo/`, `/recupera`, `/gazellehunt` en el origen existente.
3. Redirect dominio marketing Gazelle → `/gazellehunt` cuando digas OK.

## Cutover

Ver `docs/spec/cutover-cloudflare.md`. Sin deploy prod sin OK.

| Puerta | URL |
|---|---|
| Meikapen (madre) | http://127.0.0.1:8787/ (`MEIKAPEN_PLATFORM_ROOT=true`) |
| Shell app | http://127.0.0.1:8787/ryvo/ o Vite http://127.0.0.1:5173/ryvo/ |
| Gazelle Hunt | http://127.0.0.1:8787/gazellehunt |
| Recupera landing | http://127.0.0.1:8787/recupera |
