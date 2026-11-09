---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-09
spec_sha: 2c586a5ee032
plan_sha: 468d396d39e6
tasks_sha: b79f339d30c0
---

# Análisis · 018 Base de tests, integración continua y autenticación

## Resumen
Resultado `fail`: no hay hallazgos críticos, pero el usuario decidió corregir antes de implementar los 4 altos y los 4 medios de orden o secuencia. Los demás quedan aceptados como notas. La revisión independiente reportó 34 hallazgos; 33 se sostienen tras verificarlos en los archivos citados y uno se descartó.
Conteo: CRÍTICA 0 · ALTA 4 · MEDIA 22 · BAJA 7

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 10 (CA4 es una restricción, sin tarea de implementación) |
| Amenazas con control y test | 5 / 5 nominales; los controles declarados no están probados por completo (A18, A20, A21, A22) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Cobertura | ALTA | `plan.md` Estrategia; T006, T012, T029 | 003 CA5 y CA6 dependen de condiciones que solo están en SQL (`auth.repository.js:87,127`), y la base simulada no las ejecuta. | La prueba falla si se retira el intervalo de 15 minutos, la condición de expiración o las de estado y contraseña del texto de la consulta (decisión del usuario, 2026-11-09). `/plan --fix`, `/tasks --fix` |
| A2 | Inconsistencia | ALTA | spec `CA2`; 003 CA2 y CA3; `plan.md` Estrategia; T012 | Simular `email.service` oculta el contenido enviado. Además 003 CA3 dice "sin enlace", y el código envía un enlace a `/login`. | Cuenta solo de Google: correo con enlace a iniciar sesión y sin enlace de restablecer. Cuenta normal: correo con enlace de restablecer con token (decisión del usuario, 2026-11-09). Test sobre el contenido generado. `/specify --edit 003`, `/plan --fix`, `/tasks --fix` |
| A3 | Cobertura | ALTA | `plan.md` Trazabilidad CA7; T015, T021 | Jest aísla cada archivo, así que `red.test.js` no ve las salidas de `tests/auth/*`. | Una salida externa forzada en cualquier archivo de prueba hace fallar ese archivo. `/plan --fix`, `/tasks --fix` |
| A4 | Cobertura | MEDIA | spec `CA6`; T014, T020 | "Entorno" no está definido: el guardián mira variables, y `.env` no se carga porque `dotenv` solo se usa en `server.js`. | Ver Aceptados. |
| A5 | Inconsistencia | MEDIA | `plan.md` Cambios por módulo; T004, T013 | El linter revisará archivos de prueba que usan globales sin declarar. | Ver Aceptados. |
| A6 | Inconsistencia | MEDIA | spec `CA4`; T027 | El `git diff` no cubre las dependencias de producción en los lockfiles. | Ver Aceptados. |
| A7 | Constitución | MEDIA | P11; T095 | La comprobación antes de liberar no incluye `trivy`. | Ver Aceptados. |
| A8 | Constitución | ALTA | P3; T017 | P3 es comprobable y se verifica solo a mano; T017 no detecta una dependencia de producción nueva. | Test que falla si `dependencies` de backend o frontend contiene un paquete no registrado. `/plan --fix`, `/tasks --fix` |
| A9 | Inconsistencia | MEDIA | T023, T024, T025 | T025 puede correr antes de T024, con `cadena-suministro` en rojo. | T025 sigue a T024. `/tasks --fix` |
| A10 | Inconsistencia | MEDIA | T006↔T010, T007↔T016 | El "hecho" de T006 y T007 depende de tareas que dependen de ellas. | Ninguna tarea requiere para terminar otra que dependa de ella. `/tasks --fix` |
| A11 | Inconsistencia | MEDIA | T010–T012, T020, T021 | Las pruebas de autenticación correrían antes del guardián y del bloqueo de red. | T010 a T012 dependen de T020 y T021. `/tasks --fix` |
| A12 | Inconsistencia | MEDIA | `plan.md` Rollout y Riesgos; T026 | El plan ordena `/chore` → PR, y T026 abre un PR borrador antes. | Una sola secuencia; el job de dependencias queda en verde en el PR que se integra. `/plan --fix`, `/tasks --fix` |
| A13 | Inconsistencia | MEDIA | `plan.md` Estrategia; T003 | El entorno de prueba no fija las variables obligatorias: `JWTFactory` exige 32 caracteres en producción. | Ver Aceptados. |
| A14 | Inconsistencia | MEDIA | `plan.md` Estrategia; T013 | `GoogleLogin` lanza error sin su proveedor y el plan no lo prevé. | Ver Aceptados. |
| A15 | Cobertura | MEDIA | T011 | Una simulación que siempre rechaza pasa aunque se elimine `audience`. | Ver Aceptados. |
| A16 | Cobertura | MEDIA | spec `CA2`, `CA3` | La presencia de los 28 identificadores se revisa solo a mano. | Ver Aceptados. |
| A17 | Inconsistencia | MEDIA | spec `CA5`; T010–T012, T029 | Los recuentos fijos no admiten defectos descubiertos. | Ver Aceptados. |
| A18 | Cobertura | MEDIA | spec `CA8`; T016 | T016 solo revisa `fixtures.js` y acepta cualquier dominio `.test`. | Ver Aceptados. |
| A19 | Inconsistencia | MEDIA | spec `CA1`, `CA6`; T023 | Con producción detectada, el frontend correría igual. | Ver Aceptados. |
| A20 | Cobertura | MEDIA | TM1; T003, T006 | "`config/db` siempre simulado" no tiene tarea ni test. | Ver Aceptados. |
| A21 | Cobertura | MEDIA | TM2; T015, T021, T005 | "Claves eliminadas" y el bloqueo de `fetch` del frontend no tienen test. | Ver Aceptados. |
| A22 | Cobertura | MEDIA | TM4; T017, T022 | `--omit=dev` solo aplica al backend; el build del frontend instala herramientas, aunque la imagen final no las incluye. | Ver Aceptados. |
| A23 | Ambigüedad | MEDIA | spec `CA10`; T026 | No se dice si los problemas previos de un archivo tocado bloquean. | Ver Aceptados. |
| A25 | Cobertura de riesgos | MEDIA | spec Cobertura; T091, T098 | RD8.b aparece a la vez dentro y fuera. | Ver Aceptados. |
| A26 | Cobertura de riesgos | MEDIA | `plan.md` Decisiones | El plan depende del `/chore` de vulnerabilidades sin declarar alcance y destino. | Ver Aceptados. |
| A27 | Constitución | MEDIA | P20 | El lint de estilos que P20 asigna al objetivo 1 no figura en el roadmap. | Ver Aceptados. |
| A28 | Constitución | BAJA | spec Decisiones | La fila cita P3, que solo cubre producción; la fuente real es RD8.a. | Ver Aceptados. |
| A29 | Inconsistencia | BAJA | `plan.md` Impacto; T090 | T090 es condicional y el plan exige cambios concretos. | Ver Aceptados. |
| A30 | Inconsistencia | BAJA | `plan.md` Cambios; T028 | `docs/roadmap.md` no figura en el plan ni en la cobertura. | Ver Aceptados. |
| A31 | Inconsistencia | BAJA | `plan.md` Rollout; T096, T097 | No se indica qué se hace en producción. | Ver Aceptados. |
| A32 | Ambigüedad | BAJA | T017, T024 | No se precisa a qué aplica el límite de 5 minutos. | Ver Aceptados. |
| A33 | Seguridad | BAJA | ADR 0004; T002 | `@testing-library/dom` 10.4.2 es peer obligatorio y no figura en el ADR. | Ver Aceptados. |
| A34 | Constitución | BAJA | `docs/constitution.md` | La constitución sigue en `draft`. | Ver Aceptados. |

Descartado: A24 (supuestos de la spec sin confirmar). El usuario aprobó la spec tras recibir esos tres supuestos por escrito.

## Decisiones pendientes del usuario
Ninguna. Resueltas el 2026-11-09: A1, A2, tratamiento de los altos y de los medios y bajos.

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
