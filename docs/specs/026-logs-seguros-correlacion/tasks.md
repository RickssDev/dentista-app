---
spec: 026-logs-seguros-correlacion
plan: plan.md
impl_base: 49825d5
status: approved
---

# Tareas · 026 Logs seguros y correlación por petición

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- Todas las rutas de código son relativas a `backend/`, salvo los documentos.
- Las pruebas de `tests/logs/` leen las líneas JSON que captura el logger (`logger.__capturar()`,
  plan → Estrategia de pruebas). Hasta T020 fallan porque el módulo no existe.
- Corregidas por `/analyze` ronda 1: T001, T010–T013, T021–T023, T028, T090, T091, T098 y las tablas de Cobertura; nueva T029.
- Corregidas por `/analyze` ronda 2: T001, T010, T013, T015, T021, T022, T029, T091, T098; nueva T016.

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0, en `draft`).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados antes de T001 | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Las pruebas T010–T016 se escriben antes que T020–T027, y cada tarea de implementación depende de la suya. T001 caracteriza `errorHandler.js` antes de tocarlo. T029 migra las pruebas existentes de avisos apagados sin perder su comprobación | test: T001, T010–T016 y T029 en T028 |
| P3 Dependencias con ADR | ✅ | Ninguna tarea instala dependencias; ADR 0011 ya `accepted` | test: `tests/seguridad/cadena-suministro.test.js` en T028 |
| P4 Arquitectura con ADR | ✅ | ADR 0011; T090 actualiza `architecture.md` | manual: T090 |
| P5 Producción con aprobación humana | ✅ | T096 | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; T097 incluye la verificación post-deploy | manual: T097 |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints nuevos | — |
| P9 Entrada validada | ✅ | T011 prueba la validación de la cabecera; T021 la implementa | test: T011 |
| P10 Secretos | ✅ | T013 prueba que no salen `Bearer`, contraseñas ni tokens | test: T013; gitleaks en CI |
| P11 Vulnerabilidades | ✅ | Sin dependencias nuevas; `npm audit` en T028 | test: `npm audit --audit-level=high` en T028 |
| P12 Modelo de amenazas | ✅ | Cada `TM#` con tarea de test y de control (Cobertura) | test: T010–T014 |
| P13 Auditoría | ➖ | Specs 027 y 028 | — |
| P14 Correlación | ✅ | T011, T012 → T020, T021, T023 | test: T011, T012 |
| P15 Logs sin datos sensibles | ✅ | T010, T013, T029 → T020, T022–T026; `no-console` en T028 | test: T010, T013, T029; lint: T014, T028 |
| P16–P20 | ➖ | Sin interfaz, vistas ni rutas públicas | — |

## Preparación
- [x] T001 Escribir la prueba de caracterización de `errorHandler` — `tests/logs/error-handler-caracterizacion.test.js` — hecho cuando: **pasa** sobre el código actual y fija estado y cuerpo de: JWT expirado (401), JWT inválido (401), sin token (401), cuenta desactivada (401), falta de identidad (401), `LIMIT_FILE_SIZE` (400, «La imagen supera el tamaño máximo permitido de 6 MB.»), `AppError` 404 y error no operacional (500, «Error interno del servidor», sin `stack`) con `NODE_ENV=production`. Llama al middleware directamente con `req` y `res` simulados, sin `createApp()`, así que no genera líneas de log (A24). Toma la referencia de `errorHandler` **una sola vez** al cargar el archivo, como `app.js`, porque el `module.exports` interno se reasigna en la primera llamada (A18). Hasta T022 silencia `console.error` con un espía sin comprobarlo
  - nota: 9 casos en verde sobre el código actual, dos ejecuciones. Comprobado rompiendo el mensaje de 6 MB, el del 500 y el de JWT inválido: cada uno hace fallar su caso. Se compara el cuerpo serializado (lo que recibe el cliente), porque en producción el objeto lleva `stack: undefined`
- [x] T002 Silenciar los logs en la suite — `tests/support/env.js` — hecho cuando: define `LOG_LEVEL=silent` si no viene del entorno y `npm test --prefix backend` sigue verde
  - nota: suite del backend en verde: 25 archivos, 265 pruebas y 5 pendientes

## Tests (antes de implementar)
- [x] T010 [P] Escribir las pruebas unitarias del logger — `tests/logs/logger.test.js` — hecho cuando: falla por la razón esperada (no existe `src/utils/logger.js`) y comprueba:
  - CA6: una línea JSON con `timestamp` ISO, `level`, `message`, `request_id`/`job_id` y `actor_id` dentro de un contexto, y sin ellos fuera.
  - CA7: `debug` no sale con `NODE_ENV=production`, ni siquiera con `LOG_LEVEL=debug`, y sí sale en local; con `NODE_ENV=production` y `LOG_LEVEL=silent`, `info` sí sale (A21); `LOG_LEVEL=warn` filtra `info`.
  - CA10: `correo`, `Email`, `telefono_paciente`, `PASSWORD`, `access-token`, `authorization`, `credential`, `nombre_usuario`, `name`, `direccion` y una clave sensible a 3 niveles quedan como `"[oculto]"`; `error_name` y `type` se conservan (A6), `Error_Name` queda oculto (A25), y las demás claves se conservan.
  - CA12: un destino que lanza se invoca y no propaga la excepción.
  - CA11 y TM4: `resumirErrorExterno` con un error de axios simulado (con `config.headers.Authorization`, `response.data` con teléfono y `error.code` de Meta) da solo `servicio`, `status` y `codigo`.
  - TM6: `resumirError` de un `ER_DUP_ENTRY` con un correo en el mensaje y `sql` no contiene el correo ni el SQL.
  - `__capturar()` captura en `debug` aunque `LOG_LEVEL=silent` y aunque `NODE_ENV=production`, y restaura el nivel al terminar (A3, A24); fuera de la captura, con producción, `debug` no sale.
  - RNF: sin captura, escribe en `process.stdout`.
  — cubre: CA6, CA7, CA10, CA11, CA12
  - nota: falla por la razón esperada: no existe `src/utils/logger`. La captura expone además `crudas` (las líneas tal como se escriben), para comprobar que cada una es JSON de una sola línea. Se añadió un caso de referencia circular: escribirla no debe lanzar (CA12)
- [x] T011 [P] Escribir las pruebas de `X-Request-Id` — `tests/logs/request-id.test.js` — hecho cuando: falla por la razón esperada (sin cabecera) y comprueba con `createApp()`, obteniendo cada estado como dice el plan → Estrategia de pruebas (A7):
  - CA1: cabecera en 200 (`/api/v1/servicios/publicos` con el repositorio simulado), 401 (ruta protegida sin token), 404, 429 (once logins fallidos), 500 (repositorio simulado que lanza, a través del `errorHandler` de `createApp()`) y `/health`, distinta en dos peticiones.
  - CA2: eco de `abc12345-XYZ_9`.
  - CA3, TM1 y TM2 por HTTP: con 65 caracteres, con espacio, con `;`, con `"}` y con tabulador → cabecera distinta del valor enviado; se comprueba que hay líneas capturadas de la petición y que ninguna contiene el valor.
  - CA3 unitario: el validador exportado por `requestId.js` rechaza valores con `\n` y con `\r` (A4).
  - CA12: con el destino del logger forzado a lanzar y la captura en `debug`, se comprueba que el destino se invocó al menos una vez y que la respuesta de `/health` y de un 404 es la misma (A3).
  — cubre: CA1, CA2, CA3, CA12
  - nota: falla por la razón esperada: no existe `src/utils/logger`, que la prueba usa para la captura. Los estados salen de un `spyOn` sobre `servicios.repository` (200 y 500) y del limitador real (429)
- [x] T012 [P] Escribir las pruebas de correlación — `tests/logs/correlacion.test.js` — hecho cuando: falla por la razón esperada y comprueba, siempre con líneas capturadas > 0 antes de cada ausencia (A3):
  - CA4 y TM8: crear una cita (aviso de confirmación, `createCita`) con WhatsApp activo y `axios.post` simulado deja todas las líneas de la petición, incluida la del aviso, con el mismo `request_id` que la cabecera; lo mismo una solicitud de recuperación de contraseña con `fetch` simulado (A9).
  - CA5: dos ejecuciones del callback capturado de `cron.schedule` en `reminder.service.js` → `job_id` común dentro de cada una y distinto entre ellas.
  - CA8, TM7 y A1: cada petición deja **exactamente una** línea «Petición atendida», con `method`, `route` sin `?busqueda=…`, `status` y `duration_ms`. Su nivel es `info` en 200; `warn` y sin `stack` en 401; `error` con `error.stack` en 500, y en ese 500 ninguna otra línea lleva `stack`. `/health` va en `debug`.
  - CA6: con sesión de prueba se registra `actor_id` numérico y no el correo.
  — cubre: CA4, CA5, CA6, CA8
  - nota: falla por la razón esperada: no existe `src/utils/logger`. Los repositorios de citas, servicios y pacientes están simulados con `jest.mock` y el callback del cron se captura de `node-cron`
- [x] T013 [P] Escribir las pruebas de datos centinela — `tests/logs/sin-datos.test.js` — hecho cuando: falla por la razón esperada (aparecen centinelas: «RESPUESTA META», «Para:», `Resend respondió`…) y recorre con los centinelas del plan, con éxito y con error del proveedor simulado:
  - avisos de WhatsApp de confirmación, por sus dos entradas `createCita` y `createCitaPaciente` (A17), de reprogramación, de cancelación y de recordatorio;
  - correos de recuperación, contraseña actualizada y cuenta de Google, con `RESEND_API_KEY` ficticia y `fetch` simulado, en `NODE_ENV=development` y en `production`;
  - verificación de Google fallida y login fallido;
  - un 4xx y un 5xx (error de MySQL `ER_DUP_ENTRY` simulado) con cuerpo centinela;
  - un cuerpo JSON mal formado que contiene centinelas (TM11, A5).
  Las pruebas con `NODE_ENV=production` corren dentro de `__capturar()` (A24). Para cada flujo comprueba primero que existen sus líneas esperadas (por `message`, número > 0) (A3). Exige que ningún centinela aparezca en lo capturado y que cada línea lleve sus campos: error externo con `servicio`, `status` y `codigo`; aviso de WhatsApp con `id_cita` y `plantilla`; correo enviado con `tipo` e `id_proveedor` (A8). Cubre TM3, TM5, TM6, TM7 y TM11 — cubre: CA9, CA11
  - nota: falla por la razón esperada: no existe `src/utils/logger`. Hoy las fugas van a `console`, que esta prueba no lee; la prueba de que cada control funciona se hace rompiéndolo en T020–T026. Los correos se recorren por HTTP (`olvide-contrasena` y `restablecer-contrasena`) y los avisos de WhatsApp llamando al servicio directamente
- [x] T014 [P] Escribir la prueba de la regla de lint — `tests/logs/lint.test.js` — hecho cuando: falla por la razón esperada (ESLint acepta `console.log` en `src/`) y comprueba con la API de ESLint y `lintText` que `console.log('x')` con nombre de archivo `src/modules/x/x.service.js` y `server.js` da error `no-console`, y en `src/utils/logger.js` no (TM10)
  - nota: falla por la razón esperada: 4 casos sin `no-console`; el del logger pasa. La configuración se pasa ya cargada con `overrideConfig`, porque ESLint la importa con `import()` y Jest no lo admite sin `--experimental-vm-modules`
- [x] T015 [P] Escribir la prueba de silencio de la suite — `tests/logs/silencio.test.js` — hecho cuando: falla por la razón esperada y comprueba que, con `LOG_LEVEL=silent` y sin captura, una petición a `/health` y a una ruta que da 500 no llama a `process.stdout.write`, y que con `NODE_ENV=production` dentro de `__capturar()` tampoco (RNF, A24)
  - nota: falla por la razón esperada: no existe `src/utils/logger`
- [x] T016 [P] Escribir la prueba del resumen de error para el registro — `tests/logs/error-registro.test.js` — hecho cuando: falla por la razón esperada (`res.locals.errorRegistro` no existe) y, llamando a `errorHandler` con un `res` simulado, comprueba: un 5xx deja `error_name`, `message` y `stack`; un `ER_DUP_ENTRY` con un correo deja `error_name`, `code` y `errno`, sin el correo ni `sql`; un `AppError` 404 deja `error_name` y el mismo mensaje que la respuesta, sin `stack`; un `SyntaxError` de body-parser con `body` centinela deja solo `error_name` y `type`, sin `body` ni el `message` original (A22, TM6, TM11) — cubre: CA8, CA9
  - nota: falla por la razón esperada: `res.locals.errorRegistro` no existe (5 casos)

## Implementación
- [ ] T020 Implementar el contexto y el logger — `src/utils/contexto.js`, `src/utils/logger.js` — hecho cuando: T010 pasa; sin dependencias nuevas en `package.json` — cubre: CA6, CA7, CA10, CA11, CA12 — depende: T010
- [ ] T021 Implementar el identificador y la línea por petición — `src/middlewares/requestId.js`, `src/middlewares/registroPeticion.js`, `src/config/app.js` — hecho cuando: T011 pasa, T012 (CA8) pasa, incluida la pila del 500 dentro de «Petición atendida», y pasan las partes de T013 sobre 4xx, 5xx con `ER_DUP_ENTRY` y JSON mal formado (A22). Ambos middlewares son los primeros de `createApp()`, antes de `helmet`, y `requestId.js` exporta su validador — cubre: CA1, CA2, CA3, CA4, CA8, CA12 — depende: T011, T012, T013, T020, T022
- [ ] T022 Rehacer `errorHandler` sin anidamiento y con el resumen del error para el registro — `src/middlewares/errorHandler.js` — hecho cuando: T001 sigue verde sin tocarla y T016 pasa. `errorHandler` no escribe líneas propias: deja en `res.locals.errorRegistro` el resumen definido en el plan. Queda un solo `normalizeJwtError`, un solo `errorHandler` y un solo `module.exports` (A22) — cubre: CA8, CA9 — depende: T001, T016, T020
- [ ] T023 [P] Pasar el cron de recordatorios al logger con contexto propio — `src/services/reminder.service.js` — hecho cuando: la parte de CA5 de T012 y la de recordatorios de T013 pasan; sin «RESPUESTA META» ni volcado de `error.response.data`; con WhatsApp apagado no se escribe ninguna línea «enviado» (ficha 2026-11-09-fix-recordatorios-apagado) — cubre: CA5, CA9, CA11 — depende: T012, T013, T020
- [ ] T024 [P] Pasar los avisos de WhatsApp de citas al logger — `src/modules/citas/citas.service.js` — hecho cuando: la parte de CA4 de T012 y la de confirmación, reprogramación y cancelación de T013 pasan; los mensajes llevan `id_cita` y `plantilla` — cubre: CA4, CA9, CA11 — depende: T012, T013, T020
- [ ] T025 [P] Quitar el destinatario y el contenido de los correos — `src/services/email.service.js` — hecho cuando: la parte de correos de T013 pasa en `development` y `production`; `enviarCorreo` recibe `tipo` desde sus tres funciones exportadas y el error de Resend lleva estado y `name`, no el cuerpo — cubre: CA9, CA11 — depende: T013, T020
- [ ] T026 [P] Pasar los errores de autenticación al logger — `src/modules/auth/auth.service.js` — hecho cuando: la parte de Google y de correos de T013 pasa y las pruebas de `tests/auth/` siguen verdes — cubre: CA9, CA11 — depende: T013, T020
- [ ] T027 [P] Pasar los `console.*` restantes al logger — `src/config/db.js`, `src/utils/borrarArchivo.js`, `server.js` — hecho cuando: `grep -rn "console\." src server.js` solo encuentra `src/utils/logger.js`; el arranque local (`npm run dev --prefix backend` con la base de Docker) escribe en JSON «Base de datos conectada» y «Servidor escuchando» — cubre: CA6 — depende: T020
- [ ] T028 Activar `no-console` y correr la verificación completa — `eslint.config.js` — hecho cuando: T014 pasa; `npm test` (backend y frontend) en verde, con T001, T010–T016 y las pruebas migradas en T029; `npm run lint --prefix backend` sin errores fuera de los dos previos (`src/modules/faqs/faqs.service.js:4` y `src/modules/images/images.service.js:20`, `no-unused-vars`) (A10); `npm --prefix backend audit --audit-level=high` sin altas · verificación manual: `docker compose up -d --build` en local, una petición con `X-Request-Id: verificacion-026-local` y `docker compose logs backend` muestra su línea JSON legible (RNF) — cubre: CA6 — depende: T014, T021, T022, T023, T024, T025, T026, T027, T029
- [ ] T029 Migrar las pruebas existentes que espiaban `console.*` — `tests/services/recordatorios.test.js`, `tests/usuarios/rutas-usuarios.test.js` — hecho cuando: las dos usan la captura del logger, con las mismas comprobaciones y la regla de «primero que existan». En recordatorios, cada caso «apagado» lleva un control positivo en la misma captura (la misma acción con WhatsApp encendido deja su línea) (A23): con WhatsApp apagado no hay línea «enviado» y la cita no se marca; encendido, los avisos de confirmación, reprogramación y cancelación dejan su línea con `id_cita` y `plantilla`. En usuarios: hay líneas capturadas y ninguna contiene el correo ni la contraseña. Las dos pasan, y fallan si se reintroduce un aviso «enviado» con WhatsApp apagado (A2, A16) — cubre: CA9 — depende: T020, T023, T024

## Integración y documentación
- [ ] T090 Actualizar `docs/architecture.md` y la deuda resuelta — `docs/architecture.md`, `docs/roadmap.md` — hecho cuando: la sección Backend describe el logger JSON propio, el contexto por petición y `X-Request-Id`, con enlace al ADR 0011, y lista los cuatro transversales nuevos. La deuda de la duplicación de `errorHandler.js` sale de «Deuda técnica» de `architecture.md` y de «Pendientes y deuda» del roadmap (A14). Antes, si la 025 ya está en `main`, se rebasa sobre ella (A12) — depende: T028
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` — `docs/deployment.md`, `docs/observability.md` — hecho cuando, en `docs/deployment.md`: `LOG_LEVEL` está en «Variables de entorno», con el piso `info` en producción (`silent` y `debug` se ignoran), y «Verificación post-deploy» añade la comprobación del `request_id` del plan. En `docs/observability.md`: el Resumen marca logs y correlación «en uso»; la sección Logs lista los campos reales (`timestamp`, `level`, `request_id`, `job_id`, `actor_id`, `message`, `context`) (A11); Logs y Correlación quitan «Hoy no existe» y «Hoy no se cumple»; OB2.a, OB2.b, OB2.c, OB3.a, OB3.b, OB4.a y OB4.b siguen en «pendiente» hasta T098, con la nota «resuelta por la spec 026, sin liberar», cada una por separado; OB1 y OB5 siguen pendientes (A15, A26). Antes, si la 025 ya está en `main`, se rebasa sobre ella (A12) — depende: T028
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen en local en T028
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout): solo backend; `curl -sI` con `X-Request-Id: verificacion-026-a1` devuelve el mismo valor y `docker compose logs backend` tiene su línea con `status` 200; en la primera hora, sin líneas fuera de JSON salvo el arranque de Node, sin correos ni teléfonos (`grep -E '@|[0-9]{10}'`), sin más `"level":"error"` que el día anterior y con `job_id` en el cron
- [ ] T098 Marcar spec como `released`, y en `docs/observability.md` pasar OB2.a, OB2.b, OB2.c, OB3.a, OB3.b, OB4.a y OB4.b de «pendiente» a «mitigada (vX.Y.Z)» y quitar su nota (A15, A26)

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T011 | T021 |
| CA2 | T011 | T021 |
| CA3 | T011 | T021 |
| CA4 | T012 | T020, T021, T024 |
| CA5 | T012 | T020, T023 |
| CA6 | T010, T012 | T020, T027, T028 |
| CA7 | T010 | T020 |
| CA8 | T012, T016 | T021, T022 |
| CA9 | T013, T016, T029 | T022, T023, T024, T025, T026 |
| CA10 | T010 | T020 |
| CA11 | T010, T013 | T020, T023, T024, T025, T026 |
| CA12 | T010, T011 | T020, T021 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T021 | T011 |
| TM2 | T021 | T011 |
| TM3 | T023, T024 | T013 |
| TM4 | T020 | T010, T013 |
| TM5 | T025 | T013 |
| TM6 | T020, T022 | T010, T013, T016 |
| TM7 | T021 | T012, T013 |
| TM8 | T020, T021, T023 | T012 |
| TM9 | T020 | T010 |
| TM10 | T028 | T014 |
| TM11 | T022 | T013, T016 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `src/utils/contexto.js` | T020 |
| `src/utils/logger.js` | T020 |
| `src/middlewares/requestId.js` | T021 |
| `src/middlewares/registroPeticion.js` | T021 |
| `src/config/app.js` | T021 |
| `src/middlewares/errorHandler.js` | T001, T016, T022 |
| `src/services/reminder.service.js` | T023 |
| `src/modules/citas/citas.service.js` | T024 |
| `src/services/email.service.js` | T025 |
| `src/modules/auth/auth.service.js` | T026 |
| `src/config/db.js`, `src/utils/borrarArchivo.js`, `server.js` | T027 |
| `eslint.config.js` | T028 |
| `tests/support/env.js` | T002 |
| `tests/logs/` | T001, T010, T011, T012, T013, T014, T015, T016 |
| `tests/services/recordatorios.test.js`, `tests/usuarios/rutas-usuarios.test.js` | T029 |
| `docs/deployment.md`, `docs/observability.md`, `docs/architecture.md`, `docs/roadmap.md` | T090, T091, T098 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Salida por stdout legible con `docker compose logs` | T010; verificación manual en T028 |
| La suite no imprime logs | T002, T015 |
