---
lane: fix
status: done
base: 49cf01a
relates: [007]
covers: [CA6]
escalated_to: null
---

# Fix: los avisos apagados se registran como enviados

## Problema
Con WhatsApp apagado, el cron marca cada cita como recordada y los logs afirman envíos que no ocurrieron (OB6).

## Reproducción
`backend/tests/services/recordatorios.test.js`, `007 CA6` y `OB6`: antes del arreglo, la cita se marcaba y el log decía "enviado".

## Causa raíz
El cron y los servicios asumen que `sendTemplateMessage` envió, pero devuelve `null` sin enviar cuando WhatsApp está apagado.

## Cambio
El cron no hace nada con WhatsApp apagado, y los mensajes de log de envío solo se escriben con WhatsApp encendido.

## Escalado
`lane-check`: no escala.

## Verificación
Las pruebas fallan sin el arreglo y pasan con él. Suite completa, lint y build correctos. Revisión ligera sin bloqueantes.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

