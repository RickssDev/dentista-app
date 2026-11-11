---
lane: fix
status: released
released: v1.1.1 (2026-11-11)
base: 5327dce
relates: [006]
covers: []
escalated_to: null
---

# Fix: retirar la eliminación de citas, que nadie usa

## Problema
`DELETE /api/v1/citas/:id` (solo Administrador) borra la cita de la base de datos, pero la web no lo
usa: el personal y el paciente solo **cancelan**, lo que conserva el historial. Es una superficie
que borra datos de salud sin necesidad; además respondía 500 con información asociada (ficha
`2026-11-10-fix-eliminar-cita-referenciada`) y 200 "eliminada" con un id que no existe.

## Reproducción
`backend/tests/citas/eliminar-cita.test.js`, `006 · las citas se cancelan, no se eliminan`: antes
del cambio, `DELETE /api/v1/citas/1` llega al borrado con el Administrador (`Expected: 404,
Received: 500` en la base simulada) y da 403 al Asistente: la ruta existe.

## Causa raíz
La ruta de borrado venía del CRUD inicial, pero el negocio nunca la adoptó: la web del personal y
el portal del paciente solo cancelan (`PATCH /citas/:id/cancelar`, `/citas/mias/:id/cancelar`).
Quedó como superficie sin uso que borra datos de salud y su historial.

## Cambio
Se retira `deleteCita` de `citas.routes.js`, `citas.controller.js`, `citas.service.js` y
`citas.repository.js` (incluido el 409 de la ficha `2026-11-10-fix-eliminar-cita-referenciada`).
La prueba de esa ficha se sustituye por una que exige el 404 de Express para Administrador y
Asistente sin ningún `DELETE FROM citas`. Spec 006: CA9 reescrito, seguridad, decisiones e
historial. Commit `fix(fix-retirar-eliminar-cita): retirar la eliminación de citas sin uso`.

## Escalado
`lane-check` al cerrar: "Escalar: no. El cambio cabe en el carril" (4 archivos de código). Retirar
una ruta cambia el contrato de la API; se mantiene en el carril por decisión del usuario.

## Verificación
- La prueba falla con el código anterior (2 fallos) y pasa ahora.
- Suite del backend: 126 pasan, 5 pendientes (`todo`), 0 fallos.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- `aidd.py validate`: 0 errores.
- Revisión ligera: sin bloqueantes. El frontend no llama a DELETE de citas; no quedan referencias.
  Dos menores corregidos: la prueba exige "Cannot DELETE" y la ficha anterior indica que se sustituye.
- Liberada en v1.1.1 (2026-11-11), aprobada por el usuario. En producción: servicios arriba, `DELETE /api/v1/citas/1` responde 404 "Cannot DELETE", agendar, crear y cancelar funcionan y sin errores 500 en los logs.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | supuesto | ¿409 al borrar una cita con información asociada, o retirar la ruta? | Retirarla si la web no la usa; la lógica es cancelar. Sustituye al 409 de la ficha `2026-11-10-fix-eliminar-cita-referenciada` | usuario |
| 2026-11-10 | supuesto | Retirar una ruta cambia el contrato de la API (lane-check §3, motivo 2) | Se mantiene en el carril por decisión del usuario; spec 006 se actualiza (CA9) | usuario |
