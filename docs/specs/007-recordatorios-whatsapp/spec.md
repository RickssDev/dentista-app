---
id: 007
slug: recordatorios-whatsapp
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 007 · Avisos y recordatorios por WhatsApp

## Problema
Los pacientes deben enterarse de sus citas y de sus cambios para reducir las inasistencias. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como paciente, quiero un recordatorio el día anterior a mi cita.
- Como paciente, quiero saber cuándo se confirma, reprograma o cancela mi cita.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada una cita `pendiente` para mañana sin recordatorio, cuando corre el cron de cada minuto, entonces envía la plantilla `cita_recordatorio`.
- [ ] CA2 · Dado un paciente sin teléfono, entonces se omite el envío.
- [ ] CA3 · Dada una cita creada, reprogramada o cancelada, entonces se envía la plantilla correspondiente.
- [ ] CA4 · Dado un fallo de WhatsApp, entonces la operación de la cita no falla.
- [ ] CA5 · Dado `WHATSAPP_ENABLED` distinto de `true`, entonces no se llama a WhatsApp y no se lanza error.
- [x] CA6 · Dado un aviso que no se pudo enviar, entonces la cita no queda marcada como enviada.
- [ ] CA7 · (abuso) Los logs de los envíos no contienen el teléfono del paciente. **HOY NO SE CUMPLE:** se imprime la respuesta completa de WhatsApp (OB2).

## Fuera de alcance
- Correo electrónico transaccional (003).

## Seguridad y privacidad
- Datos sensibles involucrados: teléfono, nombre, fecha de la cita, servicio.
- Quién puede hacer qué: proceso interno; sin punto de entrada externo.
- Casos de abuso:
  - Como operador, consulto los logs → no deben contener el teléfono. Ver OB2.

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| OB2.a — Dejar de imprimir respuestas completas de WhatsApp | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB2.b — No imprimir destinatario ni cuerpo de correos, tampoco en desarrollo | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB2.c — Revisar y sanear los `console.*` restantes, incluidos los stack de `errorHandler` | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB6.a — Distinguir "no enviado" de "enviado" en logs y en `recordatorio_enviado` | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RD6.a — Añadir un bloqueo o separar el cron en su propio proceso antes de escalar | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-08 | brecha | ¿Está activo WhatsApp en producción? | Apagado: no se paga plan de mensajería; encendido en desarrollo cuando se necesita | usuario |

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/services/reminder.service.js`, `backend/src/services/whatp.service.js`, `backend/src/modules/citas/citas.repository.js:231-249`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- Con WhatsApp apagado en producción, ningún paciente recibe avisos y los logs dicen "Recordatorio enviado" (OB6).
- Si se activa WhatsApp, las citas ya marcadas no recibirán recordatorio.
- El cron se ejecutaría por réplica (RD6).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-09 | CA6 cumplido y `axios` importado | Fichas fix-recordatorios-apagado y fix-whatsapp-axios |
