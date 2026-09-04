# Probar Meikapen / Recupera en local

**Importante:** no uses el D1 de producción. Siempre `--local`.

## 1. Worker (API Gazelle + Recupera)

```bash
cd /Users/alejandropascual/Ryvo
pnpm build

# vars locales (no se commitean)
cat > apps/worker/.dev.vars <<'EOF'
RECUPERA_ENABLED=true
RECUPERA_MARK_PAID_ENABLED=true
AUTH_PEPPER=local-dev-pepper-at-least-32-characters-long
EOF

# Ver apps/worker/.dev.vars.example para todos los flags Recupera.

cd apps/worker
pnpm exec wrangler dev --local --port 8787
```

Abre la URL que imprime wrangler (suele ser `http://127.0.0.1:8787`).

1. Regístrate / inicia sesión (Gazelle auth).
2. **Recupera self-serve** (solo local): con `RECUPERA_SELF_SERVE=true`, registra con `playbookIntent: "recupera"` en el body (o `?playbookIntent=recupera`) — crea company + admin activo + install sin aprobación.
3. Si es el primer owner, usa el bootstrap con `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_BOOTSTRAP_TOKEN` si aplica.
4. Confirma que eres admin (o `ryvo_staff`).

## 2. Shell React (UI Meikapen)

### Opción A — Vite dev (recomendado para iterar UI)

En otra terminal:

```bash
cd /Users/alejandropascual/Ryvo
pnpm dev:web
```

Abre `http://127.0.0.1:5173/ryvo/` (Vite sirve con `base: /ryvo/`). El proxy manda `/api` → `:8787`.

### Opción B — Shell embebido en el Worker

Para probar el build de producción sin Vite:

```bash
cd /Users/alejandropascual/Ryvo
pnpm build:web
pnpm build
```

Añade a `apps/worker/.dev.vars`:

```text
RYVO_SHELL_ENABLED=true
```

Arranca el worker (`wrangler dev --local --port 8787`) y abre:

- Hub Meikapen: `http://127.0.0.1:8787/` (`MEIKAPEN_PLATFORM_ROOT=true`)
- Gazelle Hunt: `http://127.0.0.1:8787/gazellehunt`
- Shell autenticado: `http://127.0.0.1:8787/ryvo/` (misma cookie que Gazelle; **preferir esto** frente a Vite para sesión)
- Recupera landing: `http://127.0.0.1:8787/recupera`

Vite (`:5173`) sirve para UI sin cookie compartida: el AuthGate redirige el login al Worker.

Añade a `apps/worker/.dev.vars`:

```text
RYVO_SHELL_ENABLED=true
MEIKAPEN_PLATFORM_ROOT=true
RECUPERA_ENABLED=true
APP_BASE_URL=http://127.0.0.1:8787
```

Flujo:
1. Playbooks → **Recupera**
2. **Instalar Recupera**
3. Agregar una obligación o pegar CSV (**Importar CSV**; columnas tipo `name,email,amount,due_date,reference`; `due_date` / `dueDate` / `vence` OK)
4. **Activar seguimiento** (crea candidato + journey email-only + enrollment)
5. **Marcar pagado** (demo local; requiere `RECUPERA_MARK_PAID_ENABLED=true`) detiene el journey por `payment_received`
6. **Link de pago** en cada obligación → copia URL `/p/TOKEN` (portal público del pagador)

## 3. Portal del pagador (`/p/TOKEN`)

Tras crear un link de pago desde la UI (o `POST /api/recupera/obligations/:id/portal-link`):

```text
http://127.0.0.1:8787/p/<token>
```

Acciones públicas (sin sesión):
- **Pagar** — registra intención (modo manual hasta Recurrente)
- **Ya pagué** — crea pago `pending_verification` (o `completed` si `RECUPERA_PORTAL_INSTANT_PAY=true`)
- **Prometer pago** — `POST /p/:token/promise`
- **Tengo un problema** — `POST /p/:token/dispute`

JSON: `curl -H 'Accept: application/json' http://127.0.0.1:8787/p/TOKEN`

## 4. Feature flag

Recupera API responde solo si:
- `RECUPERA_ENABLED=true` en `.dev.vars`, **o**
- la company tiene `"recupera"` en `playbooks_enabled_json` (el install lo escribe)

Si ves `playbook_disabled` / 404 → falta el flag o la sesión.

`activate_disabled` → `RECUPERA_ACTIVATE_ENABLED=false`.  
`mark_paid_disabled` → falta `RECUPERA_MARK_PAID_ENABLED=true`.

`RECUPERA_PORTAL_INSTANT_PAY=true` → "Ya pagué" cierra la obligación al instante (solo local/demo).

`RECUPERA_ROCIO_INBOUND=true` → clasifica respuestas WhatsApp entrantes (Infobip) para candidatos Recupera con journey `stop_on_reply=0`. Sin LLM; heurísticas en español/inglés.

`RECUPERA_SELF_SERVE=true` → signup con `playbookIntent=recupera` crea org + admin activo + install Recupera sin cola de aprobación (solo local/demo).

`RECUPERA_PAYMENTS_ENABLED=true` + `RECUPERA_PAYMENTS_WEBHOOK_SECRET` → pagos (stub local o Recurrente real):

**Sin Recurrente** (sin `RECURRENTE_SECRET_KEY`):
- Admin: `POST /api/recupera/obligations/:id/payment-link` → link stub + URL del portal
- Webhook stub: `POST /api/recupera/payments/webhook` con header `X-Recupera-Payments-Secret` y body `{ obligationId, amountCents, providerPaymentId, status: "completed" }`

**Con Recurrente** (`RECURRENTE_SECRET_KEY` + opcional `RECURRENTE_PUBLIC_KEY`):
- Admin payment-link y portal **Pagar** crean checkout en `https://app.recurrente.com/api/checkouts` y devuelven `{ url: checkout_url }`
- Webhook Svix (público): `POST /api/recupera/payments/recurrente/webhook` con headers `svix-id`, `svix-timestamp`, `svix-signature` y secret `RECURRENTE_WEBHOOK_SECRET` (`whsec_...`)
- Tabla `recupera_checkouts` mapea `checkout_id` → `obligation_id` (migración `0024_recupera_checkouts.sql`)

Cron diario (medianoche UTC): `recuperaRecomputeStages` avanza buckets DPD; `recuperaSweepBrokenPromises` marca promesas vencidas como `broken` y restaura stage desde `due_date`.

En la UI Recupera, **Simular respuesta** permite probar sin WhatsApp:
- **Clasificar** → `POST /api/recupera/rocio/classify`
- **Aplicar** → `POST /api/recupera/obligations/:id/inbound-message` (crea job + aplica si confianza ≥ 80 %)

## 5. Qué NO hacer

- `wrangler deploy` sin OK explícito
- `wrangler dev` **sin** `--local` (apuntaría al D1 de producción)
- mezclar cookies de producción con local
