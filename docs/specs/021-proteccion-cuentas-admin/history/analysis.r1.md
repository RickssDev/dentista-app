---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-11
spec_sha: ca8e0f9dff10
plan_sha: 375d8221821f
tasks_sha: 9eb789938529
---

# Análisis · 021 Protección de las cuentas del personal

## Resumen
Sin hallazgos críticos. Tres altos que conviene corregir antes de implementar: el tipo de `id_rol`
y el reenvío completo del panel romperían la edición (A1), el aviso de eliminar no se anuncia a
lectores de pantalla (A2) y la prohibición de SQL interpolado solo se verifica a mano (A3). El
usuario decidió corregirlos, así que el resultado es `fail` hasta la siguiente ronda.
Conteo: CRÍTICA 0 · ALTA 3 · MEDIA 5 · BAJA 2

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 11 / 11 |
| Amenazas con control y test | 5 / 5 (TM4 débil en lo automático, A4) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Inconsistencia | ALTA | `plan.md` Cambios (`user.validacion`: "`id_rol` entero positivo"), Contratos; T010, T020, T030 | El panel envía `FormData`: `id_rol` llega como texto ("1") y, al editar, reenvía siempre `nombre`, `apellido`, `correo`, `estado` e `id_rol` aunque no cambien. Exigir número o tratar la mera presencia como cambio rompe el panel y CA9 | Un `id_rol` numérico en texto se acepta; "cambiar rol o estado" significa un valor distinto del guardado (test: T010 acepta `id_rol: "1"`; T030 edita al único Administrador con el payload exacto del panel → 200) — `/plan 021 --fix A1`, `/tasks 021 --fix A1` |
| A2 | Constitución P16 | ALTA | `plan.md` P16, Trazabilidad RNF; T050, T051 | El aviso "No se pudo eliminar" usa `ModalConfirmacion`, cuyo mensaje (`<p class="mf-mensaje">`) no tiene `role="alert"` ni es descripción accesible del diálogo: el motivo no se anuncia. El componente se usa en 32 lugares y no está en Cambios por módulo | El mensaje de `ModalConfirmacion` se anuncia como descripción accesible del diálogo en todas sus pantallas (decisión del usuario, 2026-11-11), sin cambio visual (test: T050 consulta el diálogo por su descripción accesible con el motivo del 409; prueba de regresión de otra confirmación) — `/plan 021 --fix A2`, `/tasks 021 --fix A2` |
| A3 | Constitución P9 | ALTA | `plan.md` P9; T060 | La prohibición de SQL interpolado solo se verifica a mano | Las consultas nuevas llevan los valores del usuario solo en los parámetros (test: capturar el SQL de `getRolById`, `findOtroUsuarioPorCorreo`, `bloquearAdministradoresActivos` y comprobar que el texto no contiene el valor enviado) — `/plan 021 --fix A3`, `/tasks 021 --fix A3` |
| A4 | Cobertura | MEDIA | T031, T040 | `jest.config.js` sustituye `config/db` por `tests/support/fake-db.js`, que rechaza cualquier SQL no simulado y comparte `query` en `getConnection()`: `conTransaccion` y `FOR UPDATE` no se pueden ejercitar sin extenderlo o sin una conexión propia; no figura en el plan | Lo automatizable de CA10 se prueba: bloqueo con `FOR UPDATE`, misma conexión para bloquear y escribir, orden begin/commit/rollback y rollback ante 409 (test: T031 con una conexión falsa o `fake-db.js` extendido, declarado en la tarea) — `/tasks 021 --fix A4` |
| A5 | Constitución P15 | MEDIA | T010 | Espiar `console.*` en la prueba del servicio no detecta nada: el único log de un rechazo es `errorHandler` en la capa HTTP, y un `1062` sin convertir lleva el correo en su mensaje | Ninguna respuesta 400/409 ni un `1062` deja el correo o la contraseña en `console.*` (test: T011, con supertest) — `/plan 021 --fix A5`, `/tasks 021 --fix A5` |
| A6 | Inconsistencia (`extends`) | MEDIA | `spec.md` CA7 | CA7 también cambia 004 CA5 (eliminar al último Administrador con información asociada ya no lo desactiva: 409) y solo declara "Reemplaza 004 CA8". La rama de CA8 con `1451` dentro de la transacción no tiene test | La spec declara que modifica 004 CA5 (`/specify --edit 021`); con dos Administradores, eliminar con `1451` desactiva usando la conexión de la transacción y la imagen se borra solo tras el commit (test: T030) — `/tasks 021 --fix A6` |
| A7 | Constitución P4 | MEDIA | `plan.md` Impacto en arquitectura; T090 | `users` pasa a depender de `auth.service`; `docs/architecture.md` dice que depende de `utils` | T090 actualiza también la columna "Depende de" — `/plan 021 --fix A7`, `/tasks 021 --fix A7` |
| A8 | Ambigüedad | MEDIA | `plan.md` Riesgos ("Cuentas antiguas") | El panel reenvía siempre correo, nombre y apellido: una cuenta con un dato antiguo inválido no se podría editar en nada | Al editar se valida solo lo que cambia respecto a lo guardado (decisión del usuario, 2026-11-11) (test: T010 edita una cuenta con correo antiguo inválido cambiando solo el teléfono → 200; cambiar el correo a otro inválido → 400) — `/plan 021 --fix A8`, `/tasks 021 --fix A8` |
| A9 | Cobertura | BAJA | T050; `spec.md` CA11 | No se comprueba "la lista de cuentas no cambia"; el aviso de eliminar aparece en otro diálogo, no "en el propio diálogo" | T050: tras un 409 no se vuelve a pedir la lista; CA11 dice "en un aviso" — `/specify --edit 021`, `/tasks 021 --fix A9` |
| A10 | Inconsistencia | BAJA | `plan.md` Contratos | En el alta el panel envía `estado` y se ignora (la cuenta nace activa, como hoy) | Indicarlo en el plan como comportamiento esperado — `/plan 021 --fix A10` |

Descartados al verificar: largos sin fuente (`backend/db/schema.sql` está versionado: 55, 55, 100,
20) y P14 sin decisión registrada (está en Decisiones del plan, decisión del usuario 2026-11-11).

## Decisiones pendientes del usuario
Resueltas el 2026-11-11:
- A2: arreglar `ModalConfirmacion` para todas sus pantallas.
- A8: al editar, validar solo lo que cambia.

## Aceptados
Ninguno: el usuario decidió corregir todos en esta vuelta.
