# Probar RYVO / Recupera en local

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

cd apps/worker
pnpm exec wrangler dev --local --port 8787
```

Abre la URL que imprime wrangler (suele ser `http://127.0.0.1:8787`).

1. Regístrate / inicia sesión (Gazelle auth).
2. Si es el primer owner, usa el bootstrap con `SUPER_ADMIN_EMAIL` + `SUPER_ADMIN_BOOTSTRAP_TOKEN` si aplica.
3. Confirma que eres admin (o `ryvo_staff`).

## 2. Shell React (UI RYVO)

En otra terminal:

```bash
cd /Users/alejandropascual/Ryvo
pnpm dev:web
```

Abre `http://127.0.0.1:5173` (Vite). El proxy manda `/api` → `:8787`.

Flujo:
1. Playbooks → **Recupera**
2. **Instalar Recupera**
3. Agregar una obligación
4. **Activar seguimiento** (crea candidato + journey email-only + enrollment)
5. **Marcar pagado** (demo local; requiere `RECUPERA_MARK_PAID_ENABLED=true`) detiene el journey por `payment_received`

## 3. Feature flag

Recupera API responde solo si:
- `RECUPERA_ENABLED=true` en `.dev.vars`, **o**
- la company tiene `"recupera"` en `playbooks_enabled_json` (el install lo escribe)

Si ves `playbook_disabled` / 404 → falta el flag o la sesión.

`activate_disabled` → `RECUPERA_ACTIVATE_ENABLED=false`.  
`mark_paid_disabled` → falta `RECUPERA_MARK_PAID_ENABLED=true`.

## 4. Qué NO hacer

- `wrangler deploy` sin OK explícito
- `wrangler dev` **sin** `--local` (apuntaría al D1 de producción)
- mezclar cookies de producción con local
