---
lane: chore
status: released
released: v1.1.0 (2026-11-09)
base: 49cf01a
relates: []
covers: []
escalated_to: null
---

# Chore: esquema versionado y respaldos programables

## Problema
El esquema de MySQL no estaba versionado (RD1.a) y los respaldos eran manuales (RD2.a).

## Cambio
`backend/db/schema.sql` solo con estructura, con su excepción en `.gitignore`, y `backend/scripts/respaldo.sh`, que respalda MySQL y `uploads/` y borra los de más de 14 días. La contraseña no pasa por la línea de comandos.

## Escalado
`lane-check`: no escala.

## Verificación
Esquema restaurado en una base temporal local: 12 de 12 tablas. Respaldo local íntegro, con y sin archivo de entorno. Falta programarlo en el servidor y probarlo con datos reales. Copias fuera del servidor pendientes (RD2.b).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

