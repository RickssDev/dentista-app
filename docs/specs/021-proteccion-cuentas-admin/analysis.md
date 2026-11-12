---
result: pass
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-11
spec_sha: 82182a883989
plan_sha: f211520383d5
tasks_sha: 6c05fb077acf
---

# Análisis · 021 Protección de las cuentas del personal

## Resumen
Los diez hallazgos de la ronda 1 quedaron resueltos sin efectos nuevos graves. La revisión delta
(con subagente, el diff superaba ~30 KB) encontró tres hallazgos de redacción de tareas, uno medio
y dos bajos, que el usuario aceptó como notas para `/implement`. Resultado `pass`.
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 1 · BAJA 2

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 11 / 11 |
| Amenazas con control y test | 5 / 5 |
| Principios de la constitución evaluados | 20 / 20 (ronda 1; sin cambio de versión) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto | `plan.md` Cambios y Regla ("cambiar" = valor distinto del guardado); T010 acepta `id_rol: '1'`; T030 "payload exacto del panel → se permite" |
| A2 | ALTA | resuelto con efecto nuevo (→ A11) | `plan.md` P16 y Cambios (`ModalConfirmacion.jsx`); T053, T052, T050, T051 |
| A3 | ALTA | resuelto con efecto nuevo (→ A12) | T012 `consultas-usuarios.test.js`; P9 de plan y tareas |
| A4 | MEDIA | resuelto | T031 declara una conexión falsa propia y comprueba misma `conn` y begin/commit/rollback |
| A5 | MEDIA | resuelto | T011 espía `console.*` en 400, 409 y `1062`; P15 apunta a T011 |
| A6 | MEDIA | resuelto | `spec.md` CA7 ("modifica 004 CA5"); T030 cubre `1451` con uno y con dos Administradores |
| A7 | MEDIA | resuelto | T090 añade `auth` a "Depende de"; P4 en plan y tareas |
| A8 | MEDIA | resuelto | `spec.md` CA4 y Decisiones; T010; T020; Riesgos del plan |
| A9 | BAJA | resuelto | `spec.md` CA11; T050 "no vuelve a pedir la lista" |
| A10 | BAJA | resuelto | `plan.md` Contratos: `estado` en el alta se ignora |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A11 | Inconsistencia | MEDIA | T052, T050 | T052 exige `npm test --prefix frontend` en verde, pero T050 sigue en rojo hasta T051 | El criterio de T052 se cumple con T053 en verde y el resto de la suite del frontend en verde salvo las pruebas de T050 aún pendientes (test: `npm test --prefix frontend` con la lista de fallos esperados) — nota de T052 |
| A12 | Constitución P9 / TM3 | BAJA | T012, T040 | T012 no captura las consultas que modifica T040 (`updateUsuario` arma el SQL de forma dinámica, `deleteUsuario`, `desactivarUsuario`), y `bloquearAdministradoresActivos` no recibe valores del usuario | Las consultas modificadas llevan los valores del usuario solo en los parámetros (test: T012 captura el SQL de `updateUsuario` con valores marcados y comprueba que no aparecen en el texto) — nota de T012 |
| A13 | Ambigüedad | BAJA | T012; `tasks.md` Constitution Check P2 | T012 no dice cómo llega la conexión falsa a `getRolById` y `findOtroUsuarioPorCorreo` (usan el pool, sustituido por `fake-db.js`); la fila P2 no lista T012 ni T053 | T012 declara cómo inyecta la conexión falsa, como T031; la fila P2 lista todas las tareas de test — nota de T012 |

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
Aceptados por el usuario el 2026-11-11:
- **A11** → nota de T052: el criterio de hecho excluye las pruebas de T050 que siguen pendientes hasta T051.
- **A12** → nota de T012: capturar también el SQL de `updateUsuario`, `deleteUsuario` y `desactivarUsuario` con valores marcados.
- **A13** → nota de T012: declarar cómo se inyecta la conexión falsa en las consultas que usan el pool, y añadir T012 y T053 a la fila P2 del Constitution Check al marcarla.
