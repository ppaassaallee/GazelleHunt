# Recupera — Seguimiento guiado (cuenta × estrategia × etapa)

**Fecha:** 2026-09-06  
**Referencia:** OneSource *Cobranza de Alto Desempeño* + playbook de cobranza inteligente.  
**Decisión producto:** A confirmado · B decidido aquí · C interpretado al estilo OneSource (no n8n por deuda).

## Principio

PLAYBOOK ≠ workflow builder. El operador elige **tono + Rocío**; el sistema elige **secuencia y plantillas** según atraso. El canvas es detalle avanzado.

## A — Tono progresivo (OneSource)

| Banda UI | Etapas internas | Objetivo | Tono | Canales tipicos |
|---|---|---|---|---|
| Preventivo | PRE_DUE, DUE | Evitar mora | Informativo / servicio | WA + email |
| Temprano | 1–30 días | Normalizar | Empático estructurado | WA + email + SMS; Rocío si aplica |
| Medio | 31–60 | Recuperar | Firme / directo | Más frecuencia; Rocío antes |
| Avanzado | 60+ | Contener | Contractual / consecuencia | Advertencia → humano / legal |

Estrategia del portafolio o de la cuenta (**Amable / Equilibrada / Firme**) **modula** delays y cuándo entra Rocío, no inventa un grafo libre.

## B — Etapas activas (decisión)

- Las  etapas del portafolio existen siempre (sistema).
- El operador **no** arma un subset arbitrario de 8 grafos.
- Único switch guiado: **Incluir recordatorios antes de vencer** (on por defecto).
  - Off → al activar una cuenta pre-vencida, arranca en “Día de vencimiento”.
- Pausar una etapa del portafolio queda en Studio avanzado (Activo/Pausa), no en el wizard de la cuenta.

## C — “Grafo distinto por cuenta” (OneSource, no Frankenstein)

Cada cuenta **corre** el grafo de su `(estrategia × etapa actual)`:

- Mia (promesa) ≠ Arturo (+30) ≠ Auri (90+) porque **el estado difiere**, no porque alguien dibujó nodos distintos a mano.
- Nombre interno de journey: `Recupera · {AMABLE|EQUILIBRADA|FIRME} · {stage}`.
- Override por cuenta: `strategyKey` + `rocioMode` + `includePreventive`.
- Studio: duplicar-y-editar plantilla de etapa del **portafolio**; no grafo custom 1:1 por deuda en v1.

## Rocío (modos UI)

| UI | Comportamiento |
|---|---|
| No interviene | Sin pasos de voz |
| Solo si no responden | Voz al final de la secuencia de la etapa |
| En esta etapa | Voz incluida según banda (más pronto en Firme / mora alta) |

## UX primaria

1. Abrir cuenta → **Cómo cobrar** (wizard).
2. Preview humano de los próximos pasos.
3. Activar.
4. “Ver pasos” / “Flujos y plantillas” = avanzado.

## Fuera de scope v1

- Grafo xyflow distinto editable por cada obligación.
- Descuentos / amenazas legales autónomas (política Meikapen).
- Renombrar tablas `candidates` (deuda técnica aparte).
