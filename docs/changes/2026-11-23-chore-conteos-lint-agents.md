---
lane: chore
status: released
released: v1.8.1 (2026-11-23)
base: a0b2d1e
relates: []
escalated_to: null
---

# Chore: conteos de errores de lint previos en AGENTS.md

## Problema
`AGENTS.md` decía 5 errores previos de lint en el backend y 10 en el frontend; hoy son 1 (`faqs.service.js`) y 7 (12 problemas).

## Cambio
`AGENTS.md`: comentarios de los comandos de lint actualizados.

## Escalado
Solo documentación; sin motivos.

## Verificación
`npm run lint`: backend 1 error, frontend 12 problemas (7 errores), comprobado el 2026-11-23.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
