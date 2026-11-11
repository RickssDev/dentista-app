---
lane: fix
status: released
released: v1.1.0 (2026-11-09)
base: 49cf01a
relates: [007]
covers: [CA1, CA3]
escalated_to: null
---

# Fix: WhatsApp falla al enviar porque falta importar axios

## Problema
`whatp.service.js` usa `axios` sin importarlo: con WhatsApp encendido, todo envío falla con ReferenceError.

## Reproducción
`backend/tests/services/whatsapp.test.js`, `007 CA1`: antes del arreglo, `ReferenceError: axios is not defined`.

## Causa raíz
El commit `a2c3aba` eliminó `require("axios")`. No se notó porque producción tiene WhatsApp apagado y los envíos están dentro de `try/catch`.

## Cambio
Se restaura el `require` de `axios`.

## Escalado
`lane-check`: no escala.

## Verificación
La prueba falla sin el arreglo y pasa con él. Suite completa, lint y build correctos. Revisión ligera sin bloqueantes.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

