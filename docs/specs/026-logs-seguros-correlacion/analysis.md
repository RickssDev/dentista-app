---
result: fail
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 0fcf42166319
plan_sha: f9a698ae65a9
tasks_sha: 4d4b24939c65
---

# Análisis · 026 Logs seguros y correlación por petición

## Resumen
`fail` por un hallazgo ALTO: T022 y T021 dependían una de la otra (A22). De la ronda 1 se resolvieron
los 21 hallazgos; cuatro correcciones tuvieron un efecto nuevo, recogido en A22–A26. Lo hizo un
subagente independiente con el diff de `aidd.py changes` (45 KB); cada hallazgo se comprobó contra
los artefactos.

Conteo: CRÍTICA 0 · ALTA 1 · MEDIA 2 · BAJA 2

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 12 / 12 |
| Amenazas con control y test | 11 / 11 |
| Principios de la constitución evaluados | 20 / 20 (solo los afectados por el diff) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto con efecto nuevo (→ A22) | CA8, plan (`registroPeticion` escribe la única línea con `res.locals.errorRegistro`), T012 y T021 coinciden |
| A2 | ALTA | resuelto con efecto nuevo (→ A23) | T029 y la fila del plan migran `recordatorios.test.js` |
| A3 | ALTA | resuelto | Plan → «Reglas comunes»; `__capturar({ nivel })`; T010–T013 con líneas > 0 |
| A4 | ALTA | resuelto | T011: `\n` y `\r` sobre el validador; por HTTP, valores que Node transmite |
| A5 | ALTA | resuelto | TM11 en plan y Trazabilidad; T013 con JSON mal formado |
| A6 | ALTA | resuelto (matiz → A25) | Excepción `error_name` y `type` en plan y T010 |
| A7 | MEDIA | resuelto | Plan → reglas de cómo se obtiene cada estado; T011 |
| A8 | MEDIA | resuelto | T013 exige `id_cita`, `plantilla`, `tipo` e `id_proveedor` |
| A9 | MEDIA | resuelto | T012 con recuperación de contraseña |
| A10 | MEDIA | resuelto | T028 y plan nombran los dos errores previos |
| A11 | MEDIA | resuelto | Sin restos de `time`, `msg` ni `user_id` en plan, ADR, spec ni tareas |
| A12 | MEDIA | resuelto | Plan → Decisiones; T090 y T091 |
| A13 | BAJA | resuelto | `lintText` en plan y T014 |
| A14 | BAJA | resuelto | T090 retira la deuda |
| A15 | BAJA | resuelto con efecto nuevo (→ A26) | T091 y T098 |
| A16 | BAJA | resuelto | T029 migra `rutas-usuarios.test.js` |
| A17 | BAJA | resuelto | T012 y T013 |
| A18 | BAJA | resuelto | T001 |
| A19 | BAJA | resuelto | Spec → Problema |
| A20 | BAJA | resuelto | Supuestos con fuente `usuario` |
| A21 | BAJA | resuelto con efecto nuevo (→ A24) | Plan y T010 |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A22 | Inconsistencia | ALTA | T021, T022 | El «hecho cuando» de T022 exige T021, y T021 depende de T022. Como `errorHandler` ya no escribe líneas, la parte de T013 sobre 4xx y 5xx no puede pasar con T022 sola | T022 se verifica solo con lo que controla: T001 en verde y una prueba del contenido de `res.locals.errorRegistro` por tipo de error. Las partes de T013 pasan a T021 → `/tasks --fix` |
| A23 | Cobertura | MEDIA | T029; plan → reglas comunes | Con WhatsApp apagado no se escribe nada, así que la regla de «primero que existan líneas» no se puede cumplir en los casos de apagado | Cada caso de apagado lleva un control positivo en la misma captura, y la prueba falla si vuelve el aviso «enviado» (test: `recordatorios.test.js`) → `/plan --fix`, `/tasks --fix` |
| A24 | Ambigüedad | MEDIA | Plan → `LOG_LEVEL` y `__capturar`; T001, T013, T015 | Si en producción se ignora `silent`, las pruebas con `NODE_ENV=production` escribirían en stdout, y no está definido si la captura pasa por encima del piso | La captura fija su nivel por encima del piso; toda prueba en producción captura; la suite no escribe en stdout (test: `silencio.test.js`) → `/plan --fix`, `/tasks --fix` |
| A25 | Ambigüedad | BAJA | Plan → reemplazo; T010 | No se precisa si la excepción compara la clave tal cual o normalizada | La clave se compara tal cual; `Error_Name` sigue oculto (test: T010) → `/plan --fix`, `/tasks --fix` |
| A26 | Inconsistencia | BAJA | T091, T098; `docs/observability.md` | «Implementada» no es un estado del vocabulario de `observability.md`, que solo usa `pendiente` y `mitigada (vX)` | Usar los estados existentes: `pendiente` con nota hasta T098 → `/tasks --fix` |

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
