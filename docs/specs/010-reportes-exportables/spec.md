---
id: 010
slug: reportes-exportables
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 010 · Reportes exportables

## Problema
La clínica necesita conocer su actividad por periodo y conservarla en archivos. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como personal, quiero un reporte de citas y de pacientes nuevos por rango de fechas, y exportarlo.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado un rango válido, entonces el reporte de citas devuelve total, completadas, pendientes y canceladas.
- [ ] CA2 · Dado un rango válido, entonces el reporte de pacientes devuelve el total y los pacientes nuevos.
- [ ] CA3 · Dado un rango, entonces ambos reportes se exportan a Excel y a PDF.
- [ ] CA4 · Dadas fechas ausentes o sin formato `YYYY-MM-DD`, entonces responde 400.
- [ ] CA5 · Dada una fecha inicial mayor que la final, entonces responde 400.
- [ ] CA6 · Dado un rango mayor a 366 días, entonces responde 400.
- [ ] CA7 · (abuso) Solo Administrador y Asistente acceden; un paciente recibe rechazo.
- [ ] CA8 · (abuso) Cada exportación queda auditada. **HOY NO SE CUMPLE:** no hay auditoría (OB1).

## Fuera de alcance
- Reportes programados.

## Seguridad y privacidad
- Datos sensibles involucrados: nombre, correo, citas y motivo.
- Quién puede hacer qué: Administrador y Asistente.
- Casos de abuso:
  - Como personal, exporto datos de pacientes en masa → debe quedar registrado (CA8).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| OB1.a — Crear la tabla de auditoría de solo anexado con retención de 5 años | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.b — Auditar logins y accesos denegados | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.c — Auditar lecturas de historial clínico y datos de paciente | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.d — Auditar altas y cambios de pacientes e historial clínico | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.e — Auditar cambios de roles, acciones administrativas y exportaciones | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB1.f — Exponer la consulta solo al Administrador y auditar cada lectura | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/reportes/*`, `frontend/src/pages/admin/Adminreportes.jsx`
- Tests: sin tests

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
