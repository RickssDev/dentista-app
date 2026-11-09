---
id: 011
slug: dashboard-resumen
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 011 · Resumen del panel

## Problema
El personal necesita ver de un vistazo la actividad del día.

## Historias de usuario
- Como personal, quiero ver las citas de hoy y los pendientes al entrar al panel.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado personal autenticado, cuando consulta `/dashboard/resumen`, entonces obtiene citas de hoy, citas de los próximos 7 días, pacientes nuevos del mes y comentarios pendientes.
- [ ] CA2 · Dado el resumen, entonces incluye la agenda de citas pendientes del día.
- [ ] CA3 · Dada cualquier hora, entonces "hoy" se calcula en la zona `America/Mexico_City`.
- [ ] CA4 · (abuso) Solo Administrador y Asistente acceden; un paciente recibe rechazo.

## Fuera de alcance
- Reportes por rango (010).

## Seguridad y privacidad
- Datos sensibles involucrados: nombres de pacientes y servicios de la agenda.
- Quién puede hacer qué: Administrador y Asistente.
- Casos de abuso:
  - Como paciente, intento ver la agenda → se rechaza (CA4).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/dashboard/*`, `frontend/src/pages/admin/AdminInicio.jsx`
- Tests: sin tests

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
