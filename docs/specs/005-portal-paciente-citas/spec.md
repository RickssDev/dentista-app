---
id: 005
slug: portal-paciente-citas
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 005 · Citas del paciente

## Problema
Los pacientes necesitan agendar y administrar sus citas sin llamar a la clínica.

## Historias de usuario
- Como paciente, quiero ver los horarios disponibles y agendar una cita.
- Como paciente, quiero reprogramar o cancelar mis citas pendientes.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada una fecha y un servicio, entonces `/citas/horarios-disponibles` devuelve bloques por hora entre 8:00 y 16:00 que no se traslapan con otras citas según su duración.
- [ ] CA2 · Dado el día de hoy, entonces solo se ofrecen horarios a partir de la hora actual de México.
- [ ] CA3 · Dado un paciente sin perfil, cuando agenda, entonces responde 404 con el aviso de completar perfil.
- [ ] CA4 · Dada una fecha u hora pasada, entonces responde 400.
- [ ] CA5 · Dado un horario que se traslapa, entonces responde 400.
- [ ] CA6 · Dada una solicitud válida, entonces se crea la cita `pendiente`.
- [ ] CA7 · Dado un paciente, entonces consulta sus citas y su próxima cita.
- [ ] CA8 · Dada una cita propia `pendiente`, cuando reprograma con fecha, hora y motivo, entonces se actualiza y se reactiva su recordatorio.
- [ ] CA9 · Dada una cita propia `pendiente`, cuando cancela con motivo, entonces pasa a `cancelada`.
- [ ] CA10 · (abuso) Una cita de otro paciente responde 404 al modificarla o cancelarla.
- [ ] CA11 · (abuso) Solo se aceptan fecha, hora y motivo al reprogramar; otros campos se ignoran.

## Fuera de alcance
- Gestión de citas por el personal (006) y recordatorios (007).

## Seguridad y privacidad
- Datos sensibles involucrados: citas y motivo.
- Quién puede hacer qué: cada paciente, solo sobre sus citas `pendiente`.
- Casos de abuso:
  - Como paciente, intento alterar la cita de otro → se responde 404 (CA10).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/citas/citas.service.js:347-593`, `citas.routes.js`, `frontend/src/pages/paciente/CitasPaciente.jsx`, `InicioPaciente.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- **Horario contradictorio:** el agendado ofrece 8:00–16:00 todos los días, domingo incluido, y `frontend/src/data/site.js` publica lunes a viernes 9:00–19:00, sábado 9:00–14:00 y domingo cerrado.
- Las rutas de paciente solo exigen token: el personal también puede usarlas si tiene perfil.
- Las citas canceladas liberan su horario: `getCitasDelDia` las excluye.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
