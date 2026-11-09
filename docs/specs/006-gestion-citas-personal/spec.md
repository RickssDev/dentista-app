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
- [ ] CA9 · (abuso) Solo el Administrador elimina citas; un Asistente recibe rechazo.
- [ ] CA10 · (abuso) Un paciente no accede a las rutas del personal.

## Fuera de alcance
- Citas gestionadas por el paciente (005).

## Seguridad y privacidad
- Datos sensibles involucrados: paciente, servicio y motivo de la cita.
- Quién puede hacer qué: Administrador y Asistente gestionan; solo Administrador elimina.
- Casos de abuso:
  - Como paciente, intento consultar la agenda → se rechaza (CA10).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/citas/citas.service.js:31-345`, `citas.routes.js`, `frontend/src/pages/admin/CitasAdmin.jsx`, `frontend/src/components/CalendarioMes.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- Al crear, el personal solo choca con la misma fecha y hora exactas: no se validan traslapes por duración ni fechas pasadas, a diferencia del paciente.
- `getCitaById` lanza `Error` y no `AppError` con un ID inválido, y responde 500.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
