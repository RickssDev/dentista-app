---
lane: fix
status: released
released: v1.1.1 (2026-11-11)
base: 6582970
relates: [005]
covers: []
escalated_to: null
---

# Fix: el paciente puede agendar o reprogramar fuera del horario de atención

## Problema
El portal solo ofrece horas dentro del horario de atención (005 CA1: lunes a viernes 8:00–16:00,
sábado 8:00–14:00, domingo cerrado), pero `POST /citas/paciente` y `PUT /citas/mias/:id` aceptan
cualquier hora si se llama a la API directamente: un domingo, antes de las 8:00, una cita que
termina después del cierre o una hora mal escrita. Detectado en la revisión ligera de la ficha
`2026-11-09-fix-horario-sitio`.

## Reproducción
`backend/tests/citas/horario-paciente.test.js`, `005 · el paciente solo agenda dentro del horario
de atención`: antes del arreglo, los 16 casos fuera de horario (8 al agendar y 8 al reprogramar)
fallan con `Received promise resolved instead of rejected`; con una hora que no es texto, con un
`TypeError` que llega como 500.

## Causa raíz
El horario de atención solo existía dentro de `getHorariosDisponibles`, que decide qué horas se
*ofrecen*. `createCitaPaciente` y `updateMiCita` validaban fecha pasada y traslape, pero nunca el
horario, así que la API guardaba cualquier hora que se le enviara directamente.

## Cambio
`backend/src/modules/citas/citas.service.js`:
- `jornadaLaboral(fecha)` concentra el horario (lunes a viernes 8–16, sábado 8–14, domingo cerrado);
  `getHorariosDisponibles` la usa sin cambiar su comportamiento.
- `validarHorarioDeAtencion(fecha, hora, duracion)` responde 400 si la fecha no existe, la hora no
  es `HH:MM` válida, el día está cerrado o la cita empieza antes de abrir o termina después de cerrar.
- Se llama en `createCitaPaciente` y en `updateMiCita`; `createCita` y `updateCita` (personal) no
  cambian.

Prueba nueva en `backend/tests/citas/horario-paciente.test.js`, que también fija que el personal sigue
sin validación de horario. Commit `fix(fix-horario-cita-paciente): validar el horario de atención al
agendar y reprogramar como paciente`.

## Escalado
`lane-check` al cerrar: "Escalar: no. El cambio cabe en el carril". 1 archivo de código.

## Verificación
- La prueba nueva falla con el arreglo revertido (16 fallos) y pasa con él (21 casos).
- `backend/tests/services/horarios.test.js` sigue en verde (005 CA1).
- Suite del backend: 124 pasan, 5 pendientes (`todo`), 0 fallos.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes. El frontend envía `YYYY-MM-DD` y `HH:MM` tomadas de
  horarios-disponibles, así que no hay falsos 400. Hallazgos menores en Decisiones.
- Liberada en v1.1.1 (2026-11-11), aprobada por el usuario. En producción: servicios arriba, `DELETE /api/v1/citas/1` responde 404 "Cannot DELETE", agendar, crear y cancelar funcionan y sin errores 500 en los logs.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | implícita | Ningún criterio de 005 dice que la API rechace horas fuera de horario; solo define las que se ofrecen (CA1) | Un paciente no debe poder guardar lo que el portal nunca le ofrece: 400 | síntoma |
| 2026-11-10 | brecha | ¿A quién bloquear? | Solo al paciente (agendar y reprogramar en el portal). El personal sigue sin validación de horario, como dice 006 | usuario |
| 2026-11-10 | supuesto | Fechas imposibles (2030-02-31) y horas como 10:75 pasaban como válidas (revisión ligera) | Corregido en esta ficha: 400 | /fix |
| 2026-11-10 | supuesto | Se aceptan horas que no son en punto (08:30) aunque el portal ofrece bloques por hora (revisión ligera) | Se mantiene: ningún criterio lo exige y no sale del horario | /fix |
| 2026-11-10 | supuesto | `updateMiCita` hace una consulta extra de la cita y el servicio; con fecha pasada y fuera de horario sale el mensaje de horario (revisión ligera) | Aceptado: costo mínimo y ambos son 400 | /fix |
