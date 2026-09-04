# Dominios — Meikapen

## Destino

Un solo Worker / D1 (`gazelle-assessment`). Gazelle Hunt **no** se monta en otro sitio.

| Superficie | URL destino | Path |
|---|---|---|
| **Prod canónico** | https://gazellehunt.meikapen.com | `/` = Gazelle app |
| Shell | …/ryvo/ | Meikapen app |
| Recupero / Recupera | …/recupero · …/recupera | marketing landing (hermanas Axelrod-style) |
| Gazelle alias | …/gazellehunt | **app** en este host (mismo que `/`) |
| Assets marketing | …/marketing/* | CSS/JS/heroes embebidos |
| Fallback | `gazelle-assessment.gazellehunt.workers.dev` | mismo Worker |
| Apex | `meikapen.com` / `www` | `/` = Meikapen marketing; `/gazellehunt` = marketing; app en gazellehunt.meikapen.com |

## Hosts

- **`gazellehunt.meikapen.com`:** `/` y `/gazellehunt` = Gazelle Hunt app (`MEIKAPEN_PLATFORM_ROOT=false`). `/recupero` y `/recupera` = landings.
- **`meikapen.com` / `www` (o `MEIKAPEN_PLATFORM_ROOT=true`):** `/` = Meikapen marketing; `/gazellehunt` = Gazellehunt marketing; `/recupero` = Recupero marketing.
- **workers.dev:** mismo código; login avisa el dominio nuevo.
- **Local:** `MEIKAPEN_PLATFORM_ROOT=true` → landings en `/`.

## Cutover

Ver `docs/spec/cutover-cloudflare.md`.

| Puerta local | URL |
|---|---|
| Meikapen | http://127.0.0.1:8787/ |
| Shell | http://127.0.0.1:8787/ryvo/ |
| Gazellehunt marketing* | http://127.0.0.1:8787/gazellehunt |
| Recupero | http://127.0.0.1:8787/recupero |
| Contact API | `POST /api/marketing/contact` |

\* Con `MEIKAPEN_PLATFORM_ROOT=true`. Sin el flag, `/gazellehunt` sirve la app Gazelle.
