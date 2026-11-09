---
result: pass
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-09
spec_sha: 2c586a5ee032
plan_sha: 137785368a03
tasks_sha: 68f70dec2ccb
---

# Análisis · 018 Base de tests, integración continua y autenticación

## Resumen
Resultado `pass`: los 8 hallazgos abiertos de la ronda 1 quedaron resueltos, y los 2 nuevos son de severidad baja y se aceptan como notas. Análisis delta, sin subagente: 53 líneas cambiadas, sin cambio estructural.
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 0 · BAJA 2

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 10 (CA4 es una restricción, sin tarea de implementación) |
| Amenazas con control y test | 5 / 5 |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto | `plan.md` Estrategia y Decisiones; T006, T012: condiciones en el texto del SQL, y las pruebas fallan al retirarlas |
| A2 | ALTA | resuelto | 003 CA3 corregido; `plan.md` Estrategia; T012 lee el correo generado |
| A3 | ALTA | resuelto con efecto nuevo (→ A35) | `plan.md` Trazabilidad CA7 y TM2; T015, T021 |
| A8 | ALTA | resuelto con efecto nuevo (→ A36) | P3 con test; T017 y `dependencias-produccion.json` |
| A9 | MEDIA | resuelto | T025 depende de T023 y T024 |
| A10 | MEDIA | resuelto | T006 y T007 tienen criterio de hecho propio |
| A11 | MEDIA | resuelto | T010 a T012 dependen de T020 y T021 |
| A12 | MEDIA | resuelto | `plan.md` Rollout y Riesgos; T026 con la misma secuencia |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A35 | Seguridad | BAJA | T015 | La prueba se ejecuta una vez antes de que exista el bloqueo de red, de modo que la salida forzada se intentaría de verdad. | El caso usa un dominio reservado que no resuelve a ningún servicio. Ver Aceptados. |
| A36 | Inconsistencia | BAJA | T017; `plan.md` Decisiones | "Iguales a la lista registrada" no dice si incluye versiones; compararlas haría fallar la prueba con el `/chore`. | La comparación es por nombre de paquete. Ver Aceptados. |

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
Aceptados por el usuario el 2026-11-09:
- **A4** → nota de T014: "entorno" significa las variables del proceso; la prueba también comprueba que un `.env` con host externo no se carga.
- **A5** → nota de T004, T013: los archivos de prueba pasan el linter de su paquete, con globales de Jest declaradas solo para `tests/` e importación explícita en Vitest.
- **A6** → nota de T027: comprobar también que el árbol de dependencias de producción no cambió respecto a `impl_base`.
- **A7** → nota de T095: añadir `trivy` a las comprobaciones previas a la liberación.
- **A13** → nota de T003: `env.js` define `JWT_SECRET` de al menos 32 caracteres y `GOOGLE_CLIENT_ID`.
- **A14** → nota de T013: controlar `GoogleLogin` y comprobar las tres redirecciones sin cargar Google.
- **A15** → nota de T011: 002 CA1 falla si `verifyIdToken` no recibe `GOOGLE_CLIENT_ID` como `audience`.
- **A16** → nota de T029: comprobar que los 28 identificadores existen en las pruebas.
- **A17** → nota de T010, T011, T012, T029: un criterio con defecto confirmado queda `[ ]`, con `test.todo` y línea en el roadmap, y los recuentos se ajustan.
- **A18** → nota de T016: recorrer todos los archivos de prueba de ambos paquetes y exigir `@example.test`.
- **A19** → nota de T023: la comprobación de entorno corre antes de ambas suites.
- **A20** → nota de T006: la simulación de `config/db` es global; cualquier archivo que lo cargue recibe el pool simulado.
- **A21** → nota de T015: probar con claves presentes en el entorno, y que `fetch` del frontend esté bloqueado.
- **A22** → nota de T017: comprobar lockfile, `--omit=dev` y `.dockerignore`; el build del frontend instala herramientas de desarrollo y su imagen final no las incluye.
- **A23** → nota de T024: por la Definición de terminado, un archivo tocado debe quedar limpio; solo los no tocados no bloquean.
- **A25** → nota de T098: tras liberar, RD8.b sigue en curso con destino a la spec 019.
- **A26** → roadmap: RS3.a y RS3.b ya figuran en Pendientes y las atiende el `/chore`.
- **A27** → roadmap: registrar el lint de estilos que exige P20.
- **A28** → spec: corregir la fuente en la próxima edición de la spec 018.
- **A29** → nota de T090: añadir la sección de pruebas y quitar del backend la deuda, conservando la de lint del frontend.
- **A30** → nota de T028: `docs/roadmap.md` es parte del cambio.
- **A31** → nota de T097: no hay cambio funcional; solo se integra.
- **A32** → nota de T017, T024: el límite de 5 minutos aplica al paso de pruebas, y T017 comprueba su valor.
- **A33** → nota de T002: instalar y registrar en el ADR `@testing-library/dom` 10.4.2.
- **A34** → roadmap: el usuario debe aprobar la constitución.
- **A35** → nota de T015: el caso de salida forzada usa un dominio reservado que no resuelve a ningún servicio.
- **A36** → nota de T017: la lista de dependencias de producción se compara por nombre, no por versión.
