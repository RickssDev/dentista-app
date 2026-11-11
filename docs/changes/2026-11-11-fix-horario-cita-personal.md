---
lane: fix
status: done                 # open → done → released · escalated (→ escalated_to)
base: 0dc9518
relates: [006]
covers: []
escalated_to: null
---

# Fix: el personal puede agendar o reprogramar fuera del horario de atención por la API

## Problema
Desde la v1.1.0 el panel del personal solo ofrece horas dentro del horario de atención (usa
`/citas/horarios-disponibles`), pero `POST /citas` y `PUT /citas/:id` aceptan cualquier día y hora
si se llama a la API directamente. La ficha `2026-11-10-fix-horario-cita-paciente` dejó al personal
fuera a propósito; al probar el PR #67, el usuario decidió que **nadie** agende fuera de horario.

## Reproducción
`backend/tests/citas/horario-paciente.test.js`, `006 · el personal tampoco agenda fuera de horario`:
antes del arreglo fallan 19 casos (crear y reprogramar fuera de horario se aceptaban; servicio
inexistente sin 404; cambiar solo la hora de una cita con fecha pasada se aceptaba).

## Causa raíz
`createCita` y `updateCita` nunca aplicaban el horario de atención: solo lo hacían las rutas del
paciente, porque la spec 006 dejaba al personal sin esa regla. Además, `updateCita` toma la fecha
guardada cuando solo cambia la hora, y mysql2 (sin `dateStrings`) la entrega como `Date`: comparada
con un texto, la comprobación de "fecha pasada" nunca saltaba.

## Cambio
`backend/src/modules/citas/citas.service.js`:
- `createCita` busca el servicio (404 si no existe) y aplica `validarHorarioDeAtencion`.
- `updateCita` la aplica cuando cambian fecha u hora, para el personal y para el paciente (vía
  `updateMiCita`, que ya no la duplica). Editar solo el motivo no revisa el horario.
- `fechaComoTexto` convierte la fecha guardada (`Date`) a `AAAA-MM-DD` antes de validar el horario
  y la fecha pasada.

Spec 006: CA11 nuevo, decisión, observaciones e historial. Commit
`fix(fix-horario-cita-personal): aplicar el horario de atención también al personal`.

## Escalado
`lane-check` al cerrar: "Escalar: no. El cambio cabe en el carril" (1 archivo de código). Cambia lo
especificado en 006: resuelto por el usuario (Decisiones) y reflejado en la spec.

## Verificación
- Las pruebas fallan con el código revertido (19) y pasan con él (41 casos en el archivo).
- Suite del backend: 180 pasan, 5 pendientes (`todo`), 0 fallos.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes en el código final. Detectó el 400 falso con la fecha `Date`
  (corregido con prueba) y la fecha pasada no detectada (previo, misma causa; corregido con prueba).
  El panel envía `AAAA-MM-DD` y horas de `/horarios-disponibles`: sin regresiones.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-11 | contradicción | La spec 006 dejaba al personal sin validación de horario; el panel nunca ofreció horas fuera de horario | Nadie agenda ni reprograma fuera de horario: misma regla para paciente y personal. Se actualiza la spec 006 | usuario |
| 2026-11-11 | supuesto | Una fecha con formato ISO completo ("2026-11-11T00:00:00.000Z") recibe el mensaje "fuera del horario de atención" (revisión ligera) | Aceptado: la web envía `AAAA-MM-DD`; un mensaje de formato propio queda como mejora menor | /fix |
