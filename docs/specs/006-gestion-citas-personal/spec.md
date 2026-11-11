---
id: 006
slug: gestion-citas-personal
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 006 · Gestión de citas por el personal

## Problema
El personal necesita ver y administrar la agenda completa de la clínica.

## Historias de usuario
- Como personal, quiero crear, reprogramar, filtrar y cancelar citas para organizar la agenda.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado personal autenticado, entonces puede listar citas y filtrarlas por estado, por paciente y por periodo `diaria`, `semanal` o `mensual`.
- [ ] CA2 · Dado un alta sin paciente, fecha, hora o servicio, entonces responde 400.
- [ ] CA3 · Dada una cita en la misma fecha y hora que otra, entonces responde 400.
- [ ] CA4 · Dada una cita cancelada, cuando se edita, entonces responde 400.
- [ ] CA5 · Dada una reprogramación sin motivo, entonces responde 400.
- [ ] CA6 · Dada una reprogramación a fecha pasada o con traslape, entonces responde 400.
- [ ] CA7 · Dada una cancelación sin motivo, entonces responde 400.
- [ ] CA8 · Dada una cita ya cancelada, cuando se cancela de nuevo, entonces responde 400.
- [x] CA9 · (abuso) Las citas no se eliminan, solo se cancelan: no existe ruta para borrarlas, ni para el Administrador.
- [ ] CA10 · (abuso) Un paciente no accede a las rutas del personal.
- [x] CA11 · Dada una cita nueva o reprogramada fuera del horario de atención (lunes a viernes 8:00–16:00, sábado 8:00–14:00, domingo cerrado, según la duración del servicio), entonces responde 400; es la misma regla que para el paciente (005).

## Fuera de alcance
- Citas gestionadas por el paciente (005).

## Seguridad y privacidad
- Datos sensibles involucrados: paciente, servicio y motivo de la cita.
- Quién puede hacer qué: Administrador y Asistente gestionan; nadie elimina citas.
- Casos de abuso:
  - Como paciente, intento consultar la agenda → se rechaza (CA10).
  - Como personal, intento borrar una cita y su historial → no hay ruta (CA9).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | brecha | `DELETE /citas/:id` existía sin uso en la web | Se retira: las citas solo se cancelan (ficha `2026-11-10-fix-retirar-eliminar-cita`) | usuario |
| 2026-11-10 | brecha | ¿Validar el horario de atención al crear o reprogramar como personal? | No: solo al paciente (005); el personal puede agendar fuera de horario | usuario |
| 2026-11-11 | contradicción | El panel nunca ofreció horas fuera de horario, pero la API las aceptaba al personal | Sustituye a la decisión anterior: nadie agenda fuera de horario (CA11, ficha `2026-11-11-fix-horario-cita-personal`) | usuario |

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/citas/citas.service.js:31-345`, `citas.routes.js`, `frontend/src/pages/admin/CitasAdmin.jsx`, `frontend/src/components/CalendarioMes.jsx`
- Tests: `backend/tests/citas/eliminar-cita.test.js` (CA9), `backend/tests/citas/horario-paciente.test.js` (CA11), `backend/tests/citas/tipos-paciente.test.js`

## Observaciones (solo si status=inferred)
- Al crear, el personal solo choca con la misma fecha y hora exactas: no se validan traslapes por duración ni fechas pasadas, a diferencia del paciente. El horario de atención sí se valida (CA11).
- `getCitaById` con un ID inválido responde 400 (corregido en la ficha `2026-11-10-fix-tipos-entrada-paciente`).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-10 | CA9: las citas ya no se eliminan, solo se cancelan | Ficha fix-retirar-eliminar-cita, decisión del usuario |
| 2026-11-11 | CA11: el personal tampoco agenda fuera del horario de atención | Ficha fix-horario-cita-personal, decisión del usuario |
