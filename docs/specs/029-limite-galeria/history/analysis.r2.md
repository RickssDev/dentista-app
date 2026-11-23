---
result: fail
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-23
spec_sha: ec5ed65e2620
plan_sha: c9fe3a230f16
tasks_sha: c0a303acff06
---

# Análisis · 029 Límite de 15 imágenes en la galería

## Resumen
No pasa por un hallazgo ALTO (A18): la corrección de A3 suponía que `release()` cierra la conexión,
pero solo la devuelve al pool, así que un `RELEASE_LOCK` fallido dejaría el bloqueo tomado y todas
las altas en 503. A1 quedó cerrado para el alta; la edición (`PUT`) tenía el mismo hueco (A17).
Modo delta con subagente, porque el diff pasaba de 30 KB.
Conteo (nuevos): CRÍTICA 0 · ALTA 1 · MEDIA 2 · BAJA 3

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 9 |
| Amenazas con control y test | 6 / 6 |
| Principios de la constitución evaluados | solo los afectados por el diff (P9, P13, P15, P20) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | CRÍTICA | resuelto con efecto nuevo (→ A17, A20) | plan «Cambios por módulo» (controller y service), P9, TM6; T010, T012, T021 |
| A2 | ALTA | resuelto | plan «Contratos y datos»; T012 |
| A3 | ALTA | resuelto con efecto nuevo (→ A18) | plan repository y Decisiones; T011, T020 |
| A4 | ALTA | resuelto | plan P20; design.md; T013, T022 |
| A5 | ALTA | abierto en parte (→ A19) | la fila de `system.md` en «Cambios por módulo» seguía diciendo «parcial» |
| A6 | ALTA | resuelto (nota → A22) | spec Auditoría, Decisiones, Cobertura de riesgos; plan P13 |
| A7 | MEDIA | resuelto | spec «Cobertura de riesgos»; plan Riesgos |
| A8 | MEDIA | resuelto | plan P20; design.md |
| A9 | MEDIA | resuelto | plan Contratos; T010, T012 |
| A10 | MEDIA | resuelto | spec Decisiones; plan Contratos |
| A11 | BAJA | resuelto | T011 |
| A12 | BAJA | resuelto | plan: 13 páginas (10 del panel + 3 del portal), confirmado en el código |
| A13 | BAJA | resuelto con efecto nuevo (→ A21) | T012 |
| A14 | BAJA | resuelto | plan Cambios y Estrategia; T013, T023 |
| A15 | BAJA | resuelto | plan TM4 |
| A16 | BAJA | resuelto | spec CA5; plan; T013, T023 |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A17 | Seguridad | MEDIA | plan TM6, P9; `images.controller.js` `updateImagen` | `PUT /imagenes/:id` sin archivo acepta `imagen` del cuerpo: una imagen puede apuntar a `/uploads/<archivo ajeno>` y `deleteImagen` lo borraría (código previo, spec 014) | Decisión del usuario: se corrige aquí. Al editar, la ruta sale solo del archivo subido. Test en `rutas-galeria.test.js`: un `PUT` sin archivo y con `imagen` ajena no guarda esa ruta → `/specify --edit` (CA3), `/plan --fix`, `/tasks --fix` |
| A18 | Inconsistencia técnica | ALTA | plan Decisiones, repository, TM4; T011, T020 | `release()` devuelve la conexión al pool sin cerrarla, y `GET_LOCK` es reentrante: tras un `RELEASE_LOCK` fallido, el bloqueo queda tomado y todas las altas dan 503 hasta reiniciar | Tras un fallo de `RELEASE_LOCK`, la conexión que conserva el bloqueo no vuelve al pool (se cierra) y el alta guardada sigue en `creada: true`. Test en `limite-galeria-concurrencia.test.js`: `RELEASE_LOCK` lanza tras el `INSERT` → `{ creada: true, id }` y la conexión falsa queda cerrada, no devuelta → `/plan --fix`, `/tasks --fix` |
| A19 | Inconsistencia | MEDIA | plan «Cambios por módulo», fila `docs/design/system.md` | Dice «DS10 pasa a parcial», en contra del resto del plan, design.md y T001 | La fila dice que DS10 sigue pendiente y lista lo mismo que T001 → `/plan --fix` |
| A20 | Cobertura (TM6) | BAJA | plan Estrategia; T012 | Los casos de TM6 no fijan su código y pasan en vacío (falta de archivo → 400 antes del repositorio); ningún caso prueba que, con archivo subido, se guarda la ruta de ese archivo y no la del cuerpo | Cada caso fija su código. Caso nuevo: con archivo subido e `imagen` ajena en el cuerpo, el repositorio recibe la ruta del archivo y, con 15, `borrarArchivo` recibe solo esa → `/plan --fix`, `/tasks --fix` |
| A21 | Inconsistencia | BAJA | plan P15; T012 | P15 promete que los logs del 409 no contienen el título ni el nombre del archivo; T012 solo comprueba el título | T012 comprueba los dos → `/tasks --fix` |
| A22 | Constitución (P13) | BAJA | spec Decisiones; plan P13 | La excepción P13 está registrada en la spec 021; nadie confirmó que se extienda a la 029 | Decisión del usuario: se extiende. Se registra en la spec con fuente `usuario` → `/specify --edit` (Decisiones) |

## Decisiones pendientes del usuario
Respondidas por el usuario el 2026-11-23:
- **A17:** se corrige en esta spec: al editar, la ruta de la imagen sale solo del archivo subido.
- **A22:** la excepción P13 (2026-11-11) se extiende a la galería hasta el objetivo 3 (specs 027
  y 028).

## Aceptados
Ninguno se acepta sin corregir: los 6 van a `/specify --edit` (A17, A22), `/plan 029 --fix` (A17–A20)
y `/tasks 029 --fix` (A17, A18, A20, A21). Después, `/analyze 029` en modo delta.
