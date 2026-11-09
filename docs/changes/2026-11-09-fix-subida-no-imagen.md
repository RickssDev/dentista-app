---
lane: fix
status: done
base: 49cf01a
relates: [014]
covers: []
escalated_to: null
---

# Fix: subir un archivo que no es imagen responde 500

## Problema
Al subir un archivo que no es imagen, la API responde 500 con un mensaje genérico en lugar de indicar el error.

## Reproducción
`backend/tests/utils/upload.test.js`: antes del arreglo, `Expected: 400, Received: 500`.

## Causa raíz
`fileFilter` rechaza con un `Error` común, que `errorHandler` trata como no operacional y convierte en 500.

## Cambio
`fileFilter` usa `AppError` con estado 400.

## Escalado
`lane-check`: no escala.

## Verificación
La prueba falla sin el arreglo y pasa con él. Suite completa, lint y build correctos. Revisión ligera sin bloqueantes.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | implícita | ¿Qué debe responder? | Error de validación 400 | El síntoma: el filtro ya define el mensaje |
