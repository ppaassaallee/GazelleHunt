# Dominios — Meikapen

## Destino

Un solo Worker / D1 (`gazelle-assessment`). Gazelle Hunt **no** se monta en otro sitio.

| Superficie | URL destino | Path |
|---|---|---|
| **Prod canónico** | https://gazellehunt.meikapen.com | `/` = Gazelle |
| Shell | …/ryvo/ | Meikapen app |
| Recupera | …/recupera | landing |
| Gazelle alias | …/gazellehunt | same as `/` hoy |
| Fallback | `gazelle-assessment.gazellehunt.workers.dev` | mismo Worker |
| Apex futuro | `meikapen.com` | pendiente DNS |

## Hosts

- **`gazellehunt.meikapen.com`:** `/` = Gazelle Hunt (`MEIKAPEN_PLATFORM_ROOT=false`).
- **workers.dev:** mismo código; login avisa el dominio nuevo.
- **Local:** `MEIKAPEN_PLATFORM_ROOT=true` → hub en `/`.

## Cutover

Ver `docs/spec/cutover-cloudflare.md`.

| Puerta local | URL |
|---|---|
| Hub | http://127.0.0.1:8787/ |
| Shell | http://127.0.0.1:8787/ryvo/ |
| Gazelle | http://127.0.0.1:8787/gazellehunt |
| Recupera | http://127.0.0.1:8787/recupera |
