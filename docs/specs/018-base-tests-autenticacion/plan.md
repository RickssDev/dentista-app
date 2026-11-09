---
spec: 018-base-tests-autenticacion
status: approved   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-09
---

# Plan · 018 Base de tests, integración continua y autenticación

## Enfoque técnico
Se añaden pruebas sin tocar `backend/src`, `backend/server.js` ni `frontend/src`. En el backend, Jest y Supertest recorren la API real (`createApp()`), los servicios y los repositorios sobre un pool de MySQL simulado en memoria, con correo, Google y red externa bloqueados. En el frontend, Vitest con jsdom y Testing Library verifica la redirección tras el login. Un guardián detiene la suite si el entorno apunta a producción, y un comando en la raíz ejecuta ambas suites e informa cada resultado. El workflow existente añade pruebas y linter del backend en los archivos cambiados. La cobertura se rastrea por el identificador de criterio en el nombre de cada prueba.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 018 aprobada | manual: `aidd.py status` antes de `/implement` |
| P2 Tests por feature | ✅ | Es el objeto de la spec | test: suite completa con `npm test` en CI |
| P3 Dependencias nuevas con ADR | ✅ | ADR 0004 con la verificación de cada paquete | test: `cadena-suministro` falla si `dependencies` contiene un paquete no registrado |
| P4 Arquitectura con ADR | ➖ | No contradice `docs/architecture.md`: añade pruebas sin cambiar capas | — |
| P5 Producción solo con aprobación humana | ✅ | Sin cambios en el despliegue; `/release` conserva la aprobación | manual: aprobación registrada en `/release` |
| P6 Rollback documentado | ✅ | Ver Rollout | manual: sección Rollout |
| P7 Migraciones compatibles | ➖ | No hay cambios de esquema | — |
| P8 Autorización en el servidor | ➖ | No crea ni cambia endpoints | — |
| P9 Entrada validada y SQL parametrizado | ➖ | No cambia código de producción | — |
| P10 Secretos fuera del repositorio | ✅ | Secretos de prueba de baja entropía; datos ficticios | test: `fixtures ficticias` · lint: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Las previas se resuelven con `/chore` antes de liberar (decisión del usuario, 2026-11-09) | test: `npm audit --audit-level=high` en CI al cambiar lockfiles |
| P12 Modelo de amenazas | ✅ | Incluido en este plan | manual: `/analyze` y `/review` |
| P13 Auditoría de datos sensibles | ➖ | No cambia flujos; objetivo 3 del roadmap | — |
| P14 Correlación por petición | ➖ | No cambia el manejo de peticiones | — |
| P15 Logs sin datos sensibles | ➖ | No añade logs de producción; las pruebas solo usan datos ficticios | — |
| P16 Accesibilidad WCAG 2.1 AA | ➖ | Sin cambios de interfaz | — |
| P17 Sin lógica de negocio en las vistas | ➖ | Sin cambios de interfaz | — |
| P18 Metadatos por ruta indexable | ➖ | No crea ni cambia rutas | — |
| P19 Noindex fuera de lo público | ➖ | No crea ni cambia rutas | — |
| P20 La interfaz usa solo el sistema de diseño | ➖ | Sin cambios de estilos | — |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `package.json` (nuevo, raíz) | Script `test`, sin dependencias ni workspaces | Bajo |
| `scripts/test-all.mjs` (nuevo) | Ejecuta ambas suites, informa cada resultado y falla si alguna falla | Bajo |
| `backend/package.json`, `package-lock.json` | Scripts `test` y `lint`; dependencias de desarrollo | Medio: cambia lockfile |
| `backend/jest.config.js` (nuevo) | Configuración, guardián y preparación | Bajo |
| `backend/eslint.config.js` (nuevo) | Reglas recomendadas para Node y CommonJS | Bajo |
| `backend/.dockerignore` | Excluye `tests/` de la imagen | Bajo |
| `backend/tests/support/` (nuevo) | `guard.js`, `env.js`, `net.js`, `fake-db.js`, `fixtures.js` | Medio: la simulación puede desviarse |
| `backend/tests/auth/` (nuevo) | `registro-login`, `google`, `contrasenas` | Bajo |
| `backend/tests/seguridad/` (nuevo) | `guard`, `red`, `fixtures`, `cadena-suministro`, `casos/salida-forzada.caso.js` y `dependencias-produccion.json` (lista de paquetes de producción registrados) | Bajo |
| `frontend/package.json`, `package-lock.json` | Script `test`; dependencias de desarrollo | Medio: cambia lockfile |
| `frontend/vitest.config.js` (nuevo) | Configuración separada de `vite.config.js` | Bajo |
| `frontend/tests/` (nuevo) | `setup.js` y `login-redireccion.test.jsx` | Bajo |
| `.github/workflows/ai-dd.yml` | Pruebas con límite de 5 minutos y linter del backend en archivos cambiados | Medio: ruta protegida |
| `docs/specs/001`, `002`, `003` | Marcar `[x]` los criterios cubiertos | Bajo |
| `AGENTS.md`, `docs/architecture.md`, `docs/deployment.md`, `CHANGELOG.md`, `.ai/project.yaml` | Comandos, sección de pruebas, estado de RD8 y verificación | Bajo: `AGENTS.md` es ruta protegida |

**No se modifica** `backend/src`, `backend/server.js` ni `frontend/src` (spec CA4).

## Contratos y datos
No cambia la API ni el esquema. Contratos nuevos, solo de desarrollo:
- `npm test` en la raíz: resultado por paquete; termina con error si alguno falla.
- `npm test` y `npm run lint` en `backend`; `npm test` en `frontend`.
- Convención: el nombre de cada prueba empieza con su criterio, por ejemplo `001 CA1 · …`.
- Los pendientes se escriben con `test.todo('001 CA9 · …')`.
- `fake-db.js` responde solo a las consultas conocidas de autenticación y **lanza error ante cualquier SQL no simulado**. Conserva el texto de cada consulta recibida para que las pruebas verifiquen sus condiciones.
- Datos de prueba: correos en el dominio reservado `@example.test`.

## Estrategia de pruebas
- **Integración HTTP (backend):** Supertest sobre `createApp()` para las specs 001 a 003, con bcrypt y JWT reales.
- **Reglas que viven en SQL (A1):** las pruebas de 003 CA5 y CA6 exigen que las consultas contengan `INTERVAL 15 MINUTE`, `fecha_expiracion > NOW()`, `u.estado = 'activo'` y `u.contrasena IS NOT NULL`, y fallan si se retira alguna condición. Comprueban el texto, no su ejecución en MySQL.
- **Contenido de los correos (A2):** `email.service` se ejecuta real, con una clave ficticia y un doble de `fetch` que captura el mensaje sin salir a la red. Las pruebas leen el correo generado: enlace de restablecer con token en cuentas normales (003 CA2) y enlace a iniciar sesión sin enlace de restablecer en cuentas solo de Google (003 CA3).
- **Simulados:** `config/db` y `google-auth-library`. `rateLimiters` se sustituye por paso directo: los límites son justo lo pendiente en CA3, y sin esto los fallos de una prueba contarían para la siguiente.
- **Variantes por entorno:** 001 CA3 carga el servicio con `NODE_ENV=production` en un módulo aislado.
- **Componente (frontend):** render de `login.jsx` con router en memoria y `api` simulado. `setup.js` aporta `ResizeObserver` y `scrollTo`, ausentes en jsdom, y bloquea `fetch`.
- **Estabilidad:** `/implement` y `/review` ejecutan la suite dos veces.

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Information disclosure: la suite corre contra producción y lee o altera datos reales | A02:2025 | Entorno de pruebas | `guard.js` como `globalSetup`: detiene con `NODE_ENV=production` o `DB_HOST` no local; además `config/db` siempre simulado | `backend/tests/seguridad/guard.test.js` |
| TM2 | Spoofing: se envían correos o mensajes reales a pacientes | A02:2025 | Integraciones | `net.js` bloquea conexiones no locales y `fetch`, registra cada intento y hace fallar el archivo donde ocurre; `fetch` de correo sustituido por un doble; claves reales eliminadas del entorno | `backend/tests/seguridad/red.test.js` |
| TM3 | Information disclosure: datos reales o credenciales en el repositorio | A02:2025 | Datos de prueba | Solo `@example.test`; secretos de prueba evidentes; gitleaks en CI | `backend/tests/seguridad/fixtures.test.js` |
| TM4 | Tampering: dependencia comprometida llega a producción | A03:2025 | Cadena de suministro | Solo dependencias de desarrollo, versiones de más de 7 días, lockfile versionado, imagen con `--omit=dev` | `backend/tests/seguridad/cadena-suministro.test.js` |
| TM5 | Elevation of privilege: un PR obtiene secretos o permisos de escritura en CI | A08:2025 | Workflow | `permissions: contents: read`; sin `pull_request_target` ni secretos | `backend/tests/seguridad/cadena-suministro.test.js` |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: comando único informa cada suite | `package.json`, `scripts/test-all.mjs`, configuración de Jest y Vitest | Ejecución de `npm test` sin `.env` en CI; verificación manual: salida con el resultado de cada paquete |
| CA2: criterios vigentes cubiertos y marcados | `backend/tests/auth/*`, `frontend/tests/login-redireccion.test.jsx`, specs 001 a 003 | 23 pruebas nombradas `001 CA1` … `003 CA8`; 001 CA8 en frontend; 003 CA5 y CA6 comprueban el texto del SQL; 003 CA2 y CA3 leen el correo generado; verificación manual: cada criterio marcado `[x]` |
| CA3: incumplidos como pendientes | `backend/tests/auth/*` | `test.todo` de 001 CA9 y CA10, 002 CA8, 003 CA9 y CA10, visibles en el resumen |
| CA4: sin cambio de comportamiento | Ninguno en código de producción | Verificación manual: `git diff --exit-code <impl_base> -- backend/src backend/server.js frontend/src` sin diferencias |
| CA5: defectos como pendientes y en roadmap | `docs/roadmap.md` si aparecen | Verificación manual: en `/review`, cada defecto tiene `test.todo` y línea en el roadmap |
| CA6 (abuso): se niega a correr contra producción | `backend/tests/support/guard.js` | `seguridad/guard.test.js`: proceso con `NODE_ENV=production` y otro con `DB_HOST` externo terminan con error y mensaje |
| CA7 (abuso): sin comunicaciones reales | `net.js`, simulados | `seguridad/red.test.js`: lanza Jest sobre `casos/salida-forzada.caso.js` y comprueba que termina con error; la comprobación corre tras cada prueba de cada archivo |
| CA8 (abuso): datos ficticios | `fixtures.js` | `seguridad/fixtures.test.js`: todo correo en `.test`; gitleaks en CI |
| CA9: pruebas en cada propuesta de cambio | `.github/workflows/ai-dd.yml` | `seguridad/cadena-suministro.test.js` comprueba el paso; verificación manual: PR borrador con el job "Lint y build" en verde y con una prueba forzada en fallo |
| CA10: linter solo en archivos cambiados | `.github/workflows/ai-dd.yml`, `backend/eslint.config.js` | `seguridad/cadena-suministro.test.js` comprueba el paso; verificación manual: PR borrador que no falla por código previo |
| RNF: suite en menos de 5 minutos | Workflow con `timeout-minutes: 5` | CI falla al superar el límite |
| RNF: resultados estables | Pruebas sin red ni reloj real | Verificación manual: dos ejecuciones seguidas en `/implement` y `/review` |
| TM1 | `guard.js` | `seguridad/guard.test.js` |
| TM2 | `net.js`, simulados | `seguridad/red.test.js` |
| TM3 | `fixtures.js` | `seguridad/fixtures.test.js` |
| TM4 | `package.json` de cada paquete, `dependencias-produccion.json` | `seguridad/cadena-suministro.test.js`: herramientas solo en `devDependencies`, y `dependencies` coincide con la lista registrada |
| TM5 | Workflow | `seguridad/cadena-suministro.test.js`: permisos de solo lectura y sin `pull_request_target` |

## Observabilidad
No aplica: la spec no cambia código de producción, flujos ni acceso a datos. La verificación es el resultado de la suite en cada PR.

## Descubribilidad
No aplica: la spec no crea ni cambia rutas públicas.

## Rollout
- Feature flag: no aplica; no cambia código de producción.
- Orden de despliegue: no requiere despliegue funcional. Secuencia única: implementar 018 → abrir PR en borrador y comprobar solo el job "Lint y build" (T026) → `/chore` de dependencias en la misma rama → con el job de dependencias en verde, marcar el PR como listo → integrar.
- Compatibilidad: total; la imagen del backend instala con `--omit=dev` y excluye `tests/`, y el build del frontend no lee `vitest.config.js`.
- Rollback: revertir el commit de integración; no hay datos ni esquema implicados.
- Métricas a vigilar tras el deploy: duración y fallos de la suite en CI.

## Decisiones (→ ADR si son arquitectónicas)
- **Herramientas (→ [ADR 0004](../../adr/0004-herramientas-de-pruebas.md)):** Jest y Supertest en backend; Vitest, jsdom y Testing Library en frontend (decisión del usuario, 2026-11-09). Comprobado con una prueba de concepto el 2026-11-09.
- **Datos:** base simulada en memoria; no se usa MySQL real (decisión del usuario, 2026-11-09).
- **Reglas en SQL:** se verifican sobre el texto de la consulta y 003 CA5 y CA6 cuentan como cubiertos con esa limitación (decisión del usuario, 2026-11-09).
- **Correo de cuentas solo de Google:** lleva enlace a iniciar sesión y no a restablecer (decisión del usuario, 2026-11-09). Captura del correo real y fallo por archivo comprobados con una prueba de concepto el 2026-11-09.
- **Dependencias de producción:** se contrastan con una lista registrada; añadir un paquete exige actualizarla junto con su ADR.
- **Vulnerabilidades previas de dependencias** (`docs/security.md`): se atienden con `/chore` después de implementar y antes de liberar; la spec no toca dependencias de producción (decisión del usuario, 2026-11-09).
- **Comando único:** `package.json` en la raíz solo con scripts, sobre un script Node compatible con Windows y Linux. Opción descartada: encadenar con `&&`, que omite la segunda suite si falla la primera.
- **Riesgos que atiende:** RD8.a, RD8.c y la parte de autenticación de RD8.b; la parte de citas de RD8.b queda pendiente → spec 019.
- **Linter:** misma versión de ESLint que el frontend, solo sobre archivos cambiados en CI.

## Impacto en arquitectura
- `docs/architecture.md`: añadir la sección de pruebas y quitar "Sin tests ni linter en el backend" de la deuda.

## Riesgos y mitigaciones
- **El SQL real no se ejecuta:** un error de MySQL pasaría las pruebas; las condiciones críticas de caducidad y estado se comprueban solo como texto. Aceptado por el usuario; se reduce cuando exista un esquema versionado.
- **La simulación se desvía del código:** `fake-db.js` falla ante SQL desconocido, de modo que un cambio de consulta se nota.
- **Los límites de intentos no se ejercitan:** pendientes visibles en CA3.
- **El job de dependencias estará en rojo en el PR borrador:** se activa al cambiar lockfiles y encontrará las vulnerabilidades previas. Mitigación: el PR no se integra hasta que el `/chore` lo deje en verde, según la secuencia de Rollout.
- **Versiones de Node distintas:** local 24, CI y Docker 22. La CI es la referencia.
- **El guardián depende de variables conocidas:** cubre `NODE_ENV` y `DB_HOST`, y la base siempre está simulada como segunda barrera.
