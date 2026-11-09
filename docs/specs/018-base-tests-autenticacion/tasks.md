---
spec: 018-base-tests-autenticacion
plan: plan.md
status: approved
impl_base: e3d311c
---

# Tareas · 018 Base de tests, integración continua y autenticación

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.

Las pruebas de T010 a T013 caracterizan código que ya existe y no se modifica, así que pasan al escribirlas. Las de T014, T015 y T017 sí fallan hasta que exista su control.

## Constitution Check
Referencia: `plan.md`. Se revisa lo que el desglose podría romper.

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados | manual: `aidd.py status` |
| P2 Tests por feature | ✅ | Las pruebas son el entregable | test: T025 |
| P3 Dependencias nuevas con ADR | ✅ | T001 y T002 instalan solo lo del ADR 0004 | test: T017 falla si `dependencies` contiene un paquete no registrado |
| P4 Arquitectura con ADR | ➖ | No se contradice la arquitectura | — |
| P5 Producción solo con aprobación humana | ✅ | T096 se mantiene | manual: T096 |
| P6 Rollback documentado | ✅ | Según Rollout del plan | manual: `plan.md` |
| P7 Migraciones compatibles | ➖ | Sin migraciones | — |
| P8 Autorización en el servidor | ➖ | Sin cambios de endpoints; T027 lo comprueba | — |
| P9 Entrada validada y SQL parametrizado | ➖ | Sin cambios de código de producción; T027 lo comprueba | — |
| P10 Secretos fuera del repositorio | ✅ | T007 define datos ficticios | test: T016 · lint: gitleaks en el workflow |
| P11 Sin vulnerabilidades críticas o altas | ✅ | `/chore` previo a la liberación | test: `npm audit --audit-level=high`, sub-punto de T095 |
| P12 Modelo de amenazas | ✅ | Cada `TM#` tiene test y control | manual: `/analyze` |
| P13 Auditoría de datos sensibles | ➖ | Sin cambios de flujos | — |
| P14 Correlación por petición | ➖ | Sin cambios de peticiones | — |
| P15 Logs sin datos sensibles | ➖ | Sin logs de producción nuevos | — |
| P16 Accesibilidad WCAG 2.1 AA | ➖ | Sin cambios de interfaz | — |
| P17 Sin lógica de negocio en las vistas | ➖ | Sin cambios de interfaz | — |
| P18 Metadatos por ruta indexable | ➖ | Sin rutas nuevas | — |
| P19 Noindex fuera de lo público | ➖ | Sin rutas nuevas | — |
| P20 La interfaz usa solo el sistema de diseño | ➖ | Sin cambios de estilos | — |

## Preparación
- [x] T001 [P] Instalar en el backend las dependencias de desarrollo del ADR 0004 con `--before=2026-11-02` y añadir los scripts `test` y `lint` — `backend/package.json`, `backend/package-lock.json` — hecho cuando: `npm ls jest supertest eslint @eslint/js globals` muestra las versiones del ADR, todas en `devDependencies`
  - nota: instaladas con versión exacta y --before=2026-11-02.
- [x] T002 [P] Instalar en el frontend las dependencias de desarrollo del ADR 0004 con `--before=2026-11-02` y añadir el script `test` — `frontend/package.json`, `frontend/package-lock.json` — hecho cuando: `npm ls vitest jsdom @testing-library/react @testing-library/user-event` muestra las versiones del ADR, todas en `devDependencies`
  - nota: A33 — instalado @testing-library/dom 10.4.2 y registrado en el ADR 0004.
- [x] T003 Configurar Jest y las variables ficticias del entorno de pruebas — `backend/jest.config.js`, `backend/tests/support/env.js` — hecho cuando: `npm test -- --passWithNoTests` termina en 0 dentro de `backend` — depende: T001
  - nota: A13 — env.js define JWT_SECRET de más de 32 caracteres y GOOGLE_CLIENT_ID.
- [x] T004 [P] Configurar ESLint para Node y CommonJS en el backend — `backend/eslint.config.js` — hecho cuando: `npm run lint` analiza `backend/` sin errores de configuración — cubre: CA10 — depende: T001
  - nota: A5 — globales de Jest declaradas solo para tests/. `npm run lint` analiza 71 archivos y reporta 5 errores previos en backend/src, que no bloquean porque CI solo revisa los archivos cambiados.
- [x] T005 [P] Configurar Vitest y la preparación del entorno simulado con `ResizeObserver`, `scrollTo` y `fetch` bloqueado — `frontend/vitest.config.js`, `frontend/tests/setup.js` — hecho cuando: `npm test -- --passWithNoTests` termina en 0 y `npm run build` sigue pasando en `frontend` — depende: T002
- [x] T006 [P] Crear la base simulada que responde solo a las consultas conocidas de autenticación, conserva el texto de cada consulta y lanza error ante cualquier otra — `backend/tests/support/fake-db.js` — hecho cuando: al ejecutar directamente el módulo, una consulta desconocida lanza error y el texto de las consultas queda disponible — cubre: CA2 — depende: T003
  - nota: A20 — la simulación es global por moduleNameMapper en backend/jest.config.js (configurado en T003).
  - nota: Comprobado ejecutando el módulo: una consulta desconocida lanza `SQL no simulado` y queda registrada en sqlRecibido.
- [x] T007 [P] Crear los datos de prueba con correos `@example.test` y secretos de prueba evidentes — `backend/tests/support/fixtures.js` — hecho cuando: el archivo solo contiene correos `@example.test` y ningún secreto imita una credencial real — cubre: CA8

## Tests (antes de implementar)
- [x] T010 [P] Escribir las pruebas de 001 CA1 a CA7, el caso de SQL no simulado y los pendientes de 001 CA9 y CA10 — `backend/tests/auth/registro-login.test.js` — hecho cuando: pasan y los pendientes aparecen como `todo` en el resumen — cubre: CA2, CA3 — depende: T006, T007, T020, T021
  - nota: A17 — no se confirmó ningún defecto; ningún criterio pasó a pendiente.
  - nota: Comprobado rompiendo cada regla de producción de 001 CA1 a CA7: las pruebas fallan; código restaurado (T027).
- [x] T011 [P] Escribir las pruebas de 002 CA1 a CA7 y el pendiente de 002 CA8 — `backend/tests/auth/google.test.js` — hecho cuando: pasan y el pendiente aparece como `todo` en el resumen — cubre: CA2, CA3 — depende: T006, T007, T020, T021
  - nota: A15 — 002 CA1 falla si se retira `audience`, comprobado rompiéndolo.
  - nota: A17 — no se confirmó ningún defecto.
  - nota: Comprobado rompiendo cada regla de 002 CA1 a CA7; código restaurado (T027).
- [x] T012 [P] Escribir las pruebas de 003 CA1 a CA8 y los pendientes de 003 CA9 y CA10, con 003 CA2 y CA3 leyendo el correo generado y 003 CA5 y CA6 exigiendo en el texto del SQL el intervalo de 15 minutos y las condiciones de expiración, estado y contraseña — `backend/tests/auth/contrasenas.test.js` — hecho cuando: pasan, los pendientes aparecen como `todo` en el resumen y las de 003 CA5 y CA6 fallan al retirar temporalmente cada condición de la consulta (se restaura; lo confirma T027) — cubre: CA2, CA3 — depende: T006, T007, T020, T021
  - nota: A17 — no se confirmó ningún defecto.
  - nota: Comprobado rompiendo cada regla de 003 CA1 a CA8 y cada condición de SQL (intervalo, expiración, estado y contraseña): las pruebas fallan; código restaurado (T027).
  - nota: La rotura del formato del token sobrevivió al principio; la prueba ahora exige el rechazo antes de consultar la base.
- [x] T013 [P] Escribir la prueba de 001 CA8 con las tres redirecciones tras iniciar sesión — `frontend/tests/login-redireccion.test.jsx` — hecho cuando: pasa — cubre: CA2 — depende: T005
  - nota: A5 — importación explícita de Vitest; pasa el linter del frontend.
  - nota: A14 — GoogleLogin simulado; las tres redirecciones pasan sin cargar Google.
  - nota: Comprobado rompiendo las reglas de redirección; ejecutada dos veces sin diferencias.
- [x] T014 [P] Escribir la prueba de que la suite se niega a correr con `NODE_ENV=production` y con `DB_HOST` externo — `backend/tests/seguridad/guard.test.js` — hecho cuando: falla porque aún no existe el guardián — cubre: CA6 — depende: T003
  - nota: A4 — "entorno" son las variables del proceso; una prueba comprueba que un `.env` con host externo no se carga.
  - nota: Comprobado rompiendo el guardián: la prueba falla.
- [x] T015 [P] Escribir la prueba que lanza Jest sobre un caso con una salida externa forzada y comprueba que ese archivo falla — `backend/tests/seguridad/red.test.js`, `backend/tests/seguridad/casos/salida-forzada.caso.js` — hecho cuando: falla porque aún no existe el bloqueo de red — cubre: CA7 — depende: T003
  - nota: A21 — probado con claves presentes en el entorno; el bloqueo de `fetch` del frontend se prueba en `frontend/tests/red.test.js`.
  - nota: A35 — el caso usa el dominio reservado `servicio-externo.invalid`.
  - nota: Archivo adicional: `backend/tests/seguridad/casos/claves-eliminadas.caso.js`, necesario para A21.
  - nota: Comprobado rompiendo el fallo por archivo y el borrado de claves: las pruebas fallan.
- [x] T016 [P] Escribir la prueba de que todo correo de los datos de prueba termina en `.test` — `backend/tests/seguridad/fixtures.test.js` — hecho cuando: pasa — cubre: CA8 — depende: T007
  - nota: A18 — recorre todos los archivos de prueba de ambos paquetes y exige `@example.test`.
  - nota: Comprobado con un correo real temporal: la prueba falla.
  - nota: gitleaks no está instalado localmente; se ejecuta en CI.
- [x] T017 [P] Escribir las pruebas de cadena de suministro y workflow: herramientas solo en `devDependencies`, `dependencies` de backend y frontend iguales a la lista registrada, permisos de solo lectura, sin `pull_request_target`, paso de pruebas y linter del backend en archivos cambiados — `backend/tests/seguridad/cadena-suministro.test.js`, `backend/tests/seguridad/dependencias-produccion.json` — hecho cuando: falla solo por los pasos que faltan en el workflow — cubre: CA9, CA10 — depende: T003
  - nota: A22 — comprueba lockfile, `--omit=dev` y `.dockerignore`; la imagen final del frontend solo recibe la build.
  - nota: A32 — el límite aplica al paso de pruebas y su valor exacto se comprueba: la rotura a 50 minutos sobrevivió al principio y se corrigió el patrón.
  - nota: A36 — la lista de dependencias se compara por nombre.
  - nota: Comprobado rompiendo permisos, disparador, comando de pruebas, filtro del linter, `.dockerignore` y añadiendo una dependencia: las pruebas fallan.

## Implementación
- [x] T020 Crear el guardián y registrarlo como `globalSetup` — `backend/tests/support/guard.js`, `backend/jest.config.js` — hecho cuando: T014 pasa — cubre: CA6 — depende: T014
  - nota: Comprobado rompiendo el control: T014 falla.
- [x] T021 Crear el bloqueo de red, que registra cada intento y hace fallar el archivo tras cada prueba, y registrarlo en la preparación de Jest — `backend/tests/support/net.js`, `backend/jest.config.js` — hecho cuando: T015 pasa — cubre: CA7 — depende: T015, T020
  - nota: Comprobado rompiendo el control: T015 falla.
- [x] T022 [P] Excluir las pruebas de la imagen de producción del backend — `backend/.dockerignore` — hecho cuando: `tests` y `coverage` figuran en el archivo — depende: T003
- [x] T023 Crear el comando único que ejecuta ambas suites, informa cada resultado y falla si alguna falla — `package.json`, `scripts/test-all.mjs` — hecho cuando: `npm test` en la raíz muestra el resultado de cada paquete y termina en 1 si uno falla · verificación manual: salida con una prueba forzada a fallar — cubre: CA1 — depende: T010, T011, T012, T013, T021
  - nota: A19 — la comprobación de entorno corre antes de ambas suites: con NODE_ENV=production no se ejecuta ninguna y termina en 1.
  - nota: verificación manual OK 2026-11-09 (agente): con una prueba forzada, la salida muestra `backend: FALLÓ`, `frontend: aprobó` y termina en 1.
- [x] T024 Añadir al workflow las pruebas con límite de 5 minutos y el linter del backend sobre archivos cambiados (ruta protegida, aprobada en esta tarea) — `.github/workflows/ai-dd.yml` — hecho cuando: T017 pasa — cubre: CA9, CA10 — depende: T017, T023
  - nota: A23 — por la Definición de terminado, un archivo tocado debe quedar limpio; los no tocados no bloquean.
  - nota: A32 — `timeout-minutes: 5` en el paso de pruebas.

## Integración y documentación
- [ ] T025 Ejecutar dos veces `npm test` desde un checkout limpio, sin archivos `.env` — `package.json` — hecho cuando: ambas pasan con el mismo resultado y tardan menos de 5 minutos — cubre: CA1 — depende: T023, T024
- [ ] T026 Comprobar el workflow en un PR borrador — `.github/workflows/ai-dd.yml` — hecho cuando: verificación manual: el job "Lint y build" pasa en el PR, falla con una prueba forzada que luego se revierte, y no falla por código previo del backend; el job de dependencias puede fallar, y el PR sigue en borrador hasta que el `/chore` en esta misma rama lo deje en verde — cubre: CA9, CA10 — depende: T024
- [ ] T027 Comprobar que no cambió el código de producción — `backend/src`, `backend/server.js`, `frontend/src` — hecho cuando: `git diff --exit-code <impl_base> -- backend/src backend/server.js frontend/src` termina en 0 — cubre: CA4 — depende: T025
- [ ] T028 Registrar en el roadmap los defectos hallados, cada uno con su prueba pendiente — `docs/roadmap.md` — hecho cuando: cada defecto tiene `test.todo` y línea en "Pendientes y deuda", o una nota de esta tarea dice que no hubo — cubre: CA5 — depende: T025
- [ ] T029 Marcar `[x]` los 23 criterios cubiertos — `docs/specs/001-auth-registro-login/spec.md`, `docs/specs/002-auth-google/spec.md`, `docs/specs/003-auth-contrasenas/spec.md` — hecho cuando: esos criterios están marcados y los 5 incumplidos siguen `[ ]` — cubre: CA2 — depende: T025
- [ ] T030 Actualizar comandos de prueba (ruta protegida, aprobada en esta tarea), CHANGELOG y verificación — `AGENTS.md`, `CHANGELOG.md`, `.ai/project.yaml` — hecho cuando: `AGENTS.md` documenta `npm test`, y `.ai/project.yaml` registra el resultado real de T025 — depende: T025
- [ ] T090 Actualizar `docs/architecture.md` si cambió la estructura
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: en `docs/deployment.md`, RD8.a y RD8.c → en curso (spec 018); RD8.b → en curso (spec 018, solo autenticación; citas → spec 019). RD8 no queda mitigado.
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - No hay staging ni cambio funcional que desplegar (`plan.md` → Rollout).
  - Antes de liberar: `/chore` de dependencias hecho y `npm audit --audit-level=high` sin hallazgos en `backend` y `frontend`.
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T025 | T023 |
| CA2 | T010, T011, T012, T013 | T006, T029 |
| CA3 | T010, T011, T012 | T006 |
| CA4 | T027 | Ninguna: es una restricción, no se cambia código de producción |
| CA5 | T028 | T028 |
| CA6 | T014 | T020 |
| CA7 | T015 | T021 |
| CA8 | T016 | T007 |
| CA9 | T017, T026 | T024 |
| CA10 | T017, T026 | T004, T024 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020 | T014 |
| TM2 | T021 | T015 |
| TM3 | T007 | T016 |
| TM4 | T001, T002, T022 | T017 |
| TM5 | T024 | T017 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `package.json` (raíz) | T023 |
| `scripts/test-all.mjs` | T023 |
| `backend/package.json`, `package-lock.json` | T001 |
| `backend/jest.config.js` | T003, T020, T021 |
| `backend/eslint.config.js` | T004 |
| `backend/.dockerignore` | T022 |
| `backend/tests/support/` | T003, T006, T007, T020, T021 |
| `backend/tests/auth/` | T010, T011, T012 |
| `backend/tests/seguridad/` | T014, T015, T016, T017 |
| `frontend/package.json`, `package-lock.json` | T002 |
| `frontend/vitest.config.js` | T005 |
| `frontend/tests/` | T005, T013 |
| `.github/workflows/ai-dd.yml` | T024, T026 |
| `docs/specs/001`, `002`, `003` | T029 |
| `AGENTS.md`, `CHANGELOG.md`, `.ai/project.yaml` | T030 |
| `docs/architecture.md` | T090 |
| `docs/deployment.md` | T091 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| La suite termina en menos de 5 minutos | T024, T025 |
| Dos ejecuciones consecutivas dan el mismo resultado | T025 |
