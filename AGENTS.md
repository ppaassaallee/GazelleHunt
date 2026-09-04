# RYVO — reglas para agentes

RYVO es una plataforma de Playbooks ejecutables sobre un runtime propio extraído de Gazelle Hunt.
Playbooks: gazelle-hunt (contratación, en producción) y recupera (cobranza, AI Employee Rocío).
PLAYBOOK ≠ WORKFLOW. Objetivo Recupera: Excel → "Rocío está trabajando" en minutos.

## Regla cero

Gazelle Hunt está en producción con usuarios reales. Ningún cambio en `packages/runtime` o `apps/worker`
puede alterar su comportamiento sin un test que lo demuestre. `pnpm test` verde antes de cualquier PR.

## Antes de cualquier feature

1. Lee la rule del glob que tocas (no todas).
2. Lee solo el doc de spec del prompt.
3. Busca en `packages/runtime` antes de escribir: casi todo ya existe con otro nombre.
4. Busca proveedor antes de construir infraestructura.
5. Scope exacto.
6. Implementa → tests → seguridad → Apple Design Review si hay UI.

## Anti-Frankenstein

NO amplíes scope. NO refactorices lo que no toca el prompt. NO crees abstracciones sin caso.
NO reescribas lo que Gazelle ya resuelve: journeys, templates, portal links, ai_jobs, audit, auth.
NO conviertas RYVO en CRM/ERP/workflow builder/contact center/pasarela.

## Stack cerrado

Cloudflare Workers (un solo Worker) · D1 vía Drizzle · cron + journey_events · R2
· Brevo (email) · Infobip (WhatsApp, SMS) · OpenAI/Gemini tras AIProvider · Retell (voz) · Recurrente (pagos)
· React + Vite + Tailwind + Radix + Lucide servido por el Worker.

Sin: Next, Vercel, Supabase, WorkOS, Trigger.dev, Resend, Chatwoot, n8n, microservicios, segundo Worker.

## Límites

- `playbooks/*` → solo `packages/runtime` interfaces + `packages/ui`.
- `packages/runtime` nunca contiene "candidate", "assessment", "payer", "obligation".
- SDKs externos solo en `*/providers/*`.
- Toda query tenant pasa por `orgScoped()`.
- Nunca emails hardcodeados en migraciones ni en código de autorización.

## IA

IA interpreta. Política decide. RYVO ejecuta. Structured output obligatorio (patrón ai_jobs).
LLM nunca es source of truth financiero. Sin descuentos ni amenazas legales autónomas.

## Copy

Términos internos (subject, journey, enrollment, DPD, playbook) nunca en UI. Ver `docs/spec/copy.md`.

## Decisión ante cualquier propuesta nueva

"¿Esto mejora Recupera o Gazelle Hunt, o estamos construyendo software porque podemos?"

## RYVO NO ES

CRM · ERP · n8n · Zapier · BPM · accounting · payment processor · call center ·
omnichannel inbox genérico · legal practice management · dashboard builder · generic AI agent builder.
