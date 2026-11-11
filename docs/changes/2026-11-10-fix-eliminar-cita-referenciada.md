---
lane: fix
status: done                 # open → done → released · escalated (→ escalated_to)
base: ef297b6
relates: [006]
covers: []
escalated_to: null
---

# Fix: eliminar una cita con información asociada responde 500

> **Sustituida** por la ficha `2026-11-10-fix-retirar-eliminar-cita`: el mismo día, el usuario
> decidió retirar `DELETE /citas/:id` (la web no lo usa; las citas solo se cancelan), así que el
> 409 descrito aquí ya no existe en el código.

## Problema
`DELETE /api/v1/citas/:id` (solo Administrador; la web no lo usa) responde 500 cuando la cita tiene
filas que la referencian. Hoy pasa con un comentario o testimonio ligado a la cita
(`fk_comentario_cita`); con la maqueta (spec 019) pasaría también con sus registros. Detectado por
/analyze 019 (A26) y anotado en el roadmap.

## Reproducción
`backend/tests/citas/eliminar-cita.test.js`, `una cita con información asociada responde 409 con un
mensaje claro`: antes del arreglo el error de MySQL (errno 1451) sale tal cual, sin `statusCode`, y
`errorHandler` responde 500 "Error interno del servidor".

## Causa raíz
`deleteCita` borra la fila sin contemplar las llaves foráneas que apuntan a `citas`. Si existe un
comentario de esa cita (`fk_comentario_cita`), MySQL rechaza el borrado con el error 1451 y nadie lo
traduce a un error de negocio. Servicios y usuarios ya lo hacen; citas no.

## Cambio
`backend/src/modules/citas/citas.service.js`: `deleteCita` atrapa `errno 1451` /
`ER_ROW_IS_REFERENCED_2` (la misma detección que `servicios.service.js` y `user.service.js`) y
responde 409 "La cita tiene información asociada y no se puede eliminar; cancélala en su lugar".
Cualquier otro error se relanza igual. Prueba nueva en `backend/tests/citas/eliminar-cita.test.js`.
Commit `fix(fix-eliminar-cita-referenciada): responder 409 al eliminar una cita con información
asociada`.

## Escalado
`lane-check` al cerrar: "Escalar: no. El cambio cabe en el carril". 1 archivo de código.

## Verificación
- La prueba nueva falla con el arreglo revertido (1 fallo) y pasa con él (3 casos).
- Suite del backend: 127 pasan, 5 pendientes (`todo`), 0 fallos.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes. Un AppError 409 llega al cliente por `catchAsync` y
  `errorHandler`; `fk_comentario_cita` es la única llave hacia `citas` y `citas.repository.js` es
  el único borrado. Hallazgos menores en Decisiones.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | implícita | ¿409 o retirar la ruta? | 409 con un mensaje claro, como ya hacen servicios y usuarios ante el error 1451. Retirar la ruta cambiaría el contrato de la API: fuera del carril | síntoma |
| 2026-11-10 | supuesto | Servicios y usuarios se desactivan y responden 200; aquí se responde 409 (revisión ligera) | Se mantiene: una cita no tiene "desactivar"; su equivalente es cancelarla, y el mensaje lo dice | /fix |
| 2026-11-10 | brecha | Con un id inexistente `deleteCita` responde 200 "eliminada"; los otros servicios dan 404 (revisión ligera, previo) | Fuera de esta ficha; queda como deuda | /fix |
| 2026-11-10 | brecha | `errorHandler.js` tiene la función duplicada y anidada con un `module.exports` muerto (revisión ligera, previo; ya en el roadmap) | Fuera de esta ficha; `/refactor` aparte | /fix |
