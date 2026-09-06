# Dominios — Meikapen

## Destino

Un solo Worker / D1 (`gazelle-assessment`). Las plataformas **operativas** son independientes; la entrada pública es siempre por landings en `meikapen.com`.

| Superficie | URL | Notas |
|---|---|---|
| Marketing Meikapen | https://meikapen.com/ | Landing corporativa (admin / marca) |
| Landing Recupero | https://meikapen.com/recupero | **Única puerta pública a Recupero** (alias `/recupera`) |
| Landing Gazellehunt | https://meikapen.com/gazellehunt | **Única puerta pública a Gazelle Hunt** |
| Auth Recupero | https://meikapen.com/?auth=login&playbook=recupera | Misma host → cookie `__Host-` |
| Auth Gazelle | https://meikapen.com/?auth=login&playbook=gazellehunt | Misma host → cookie `__Host-` |
| App Recupero | https://meikapen.com/ryvo/?open=recupera | Shell aislado (sin mezclar Gazelle) |
| App Gazelle | https://meikapen.com/ryvo/?open=gazellehunt → `/app` | Workspace Gazelle en la misma host |
| Plataforma Meikapen | https://meikapen.com/ryvo/ | **Solo administradores** (`ryvoStaff` / `super_admin`) |
| Fallback Worker | https://gazelle-assessment.gazellehunt.workers.dev | Mismo Worker |
| Legacy host | https://gazellehunt.meikapen.com | Compat; la entrada canónica es `meikapen.com/gazellehunt` |

## Reglas de producto

1. Entrada pública: solo `/recupero` y `/gazellehunt`.
2. Auth y apps en `meikapen.com` (no mandar CTAs a `gazellehunt.meikapen.com`).
3. Recupero y Gazelle **no se mezclan** en la misma UI operativa.
4. `meikapen.com/ryvo/` sin `open=` es plataforma admin, no el producto del cliente.

## Hosts

- **`meikapen.com` / `www`:** landings, auth (`/?auth=`), `/ryvo/`, `/app` (Gazelle).
- **`gazellehunt.meikapen.com`:** compatibilidad Gazelle; `/recupera` → 301 a apex.
- **Local:** `MEIKAPEN_PLATFORM_ROOT=true` → landings en `/`.

## Cutover

Ver `docs/spec/cutover-cloudflare.md`.
