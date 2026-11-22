---
spec: 026-logs-seguros-correlacion
plan: plan.md
status: draft
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

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0, en `draft`).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados antes de T001 | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Las pruebas T010–T015 se escriben antes que T020–T027, y cada tarea de implementación depende de la suya. T001 caracteriza `errorHandler.js` antes de tocarlo | test: T001, T010–T015 en T028 |
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
| P15 Logs sin datos sensibles | ✅ | T010, T013 → T020, T022–T026; `no-console` en T027 | test: T010, T013; lint: T014, T027 |
| P16–P20 | ➖ | Sin interfaz, vistas ni rutas públicas | — |

## Preparación
- [ ] T001 Escribir la prueba de caracterización de `errorHandler` — `tests/logs/error-handler-caracterizacion.test.js` — hecho cuando: **pasa** sobre el código actual y fija estado y cuerpo de: JWT expirado (401), JWT inválido (401), sin token (401), cuenta desactivada (401), falta de identidad (401), `LIMIT_FILE_SIZE` (400, «La imagen supera el tamaño máximo permitido de 6 MB.»), `AppError` 404 y error no operacional (500, «Error interno del servidor», sin `stack`) con `NODE_ENV=production`
- [ ] T002 Silenciar los logs en la suite — `tests/support/env.js` — hecho cuando: define `LOG_LEVEL=silent` si no viene del entorno y `npm test --prefix backend` sigue verde

## Tests (antes de implementar)
- [ ] T010 [P] Escribir las pruebas unitarias del logger — `tests/logs/logger.test.js` — hecho cuando: falla por la razón esperada (no existe `src/utils/logger.js`) y comprueba: una línea JSON con `time` ISO, `level`, `msg`, `request_id`/`job_id` y `user_id` dentro de un contexto, sin ellos fuera (CA6); `debug` no sale con `NODE_ENV=production` ni con `LOG_LEVEL=debug` en producción, sí en local, y `LOG_LEVEL=warn` filtra `info` (CA7); `correo`, `Email`, `telefono_paciente`, `PASSWORD`, `access-token`, `authorization`, `credential`, `nombre_usuario`, `direccion` y una clave sensible a 3 niveles quedan como `"[oculto]"`, y las demás se conservan (CA10); un destino que lanza no propaga la excepción (CA12); `resumirErrorExterno` con un error de axios simulado (con `config.headers.Authorization`, `response.data` con teléfono y `error.code` de Meta) da solo `servicio`, `status` y `codigo` (CA11, TM4); `resumirError` de un `ER_DUP_ENTRY` con un correo en el mensaje y `sql` no contiene el correo ni el SQL (TM6); sin contexto, escribe en `process.stdout` (RNF) — cubre: CA6, CA7, CA10, CA11, CA12
- [ ] T011 [P] Escribir las pruebas de `X-Request-Id` — `tests/logs/request-id.test.js` — hecho cuando: falla por la razón esperada (sin cabecera) y comprueba con `createApp()`: cabecera en 200 (`/api/v1/servicios/publicos`), 401 (ruta protegida sin token), 404, 429 (once logins fallidos), 500 (ruta de prueba que lanza, montada solo en la prueba) y `/health`, distinta en dos peticiones (CA1); eco de `abc12345-XYZ_9` (CA2); con 65 caracteres, con `\n`, con espacio y con `;` → cabecera distinta del valor enviado y ninguna línea capturada lo contiene (CA3, TM1, TM2); con el destino del logger forzado a lanzar, la respuesta de `/health` es la misma (CA12) — cubre: CA1, CA2, CA3, CA12
- [ ] T012 [P] Escribir las pruebas de correlación — `tests/logs/correlacion.test.js` — hecho cuando: falla por la razón esperada y comprueba: confirmar una cita con WhatsApp activo y `axios.post` simulado deja todas las líneas de la petición, incluida la del aviso, con el mismo `request_id` que la cabecera (CA4, TM8); dos ejecuciones del callback capturado de `cron.schedule` en `reminder.service.js` → `job_id` común dentro de cada una y distinto entre ellas (CA5); la línea «Petición atendida» lleva `method`, `route` sin `?busqueda=…`, `status` y `duration_ms`, con `info` en 200, `warn` sin `stack` en 401 y `error` con `stack` en 500, y `/health` en `debug` (CA8, TM7); con sesión de prueba lleva `user_id` numérico y no el correo — cubre: CA4, CA5, CA6, CA8
- [ ] T013 [P] Escribir las pruebas de datos centinela — `tests/logs/sin-datos.test.js` — hecho cuando: falla por la razón esperada (aparecen centinelas: «RESPUESTA META», «Para:», `Resend respondió`…) y recorre con los centinelas del plan, con éxito y con error del proveedor simulado: avisos de WhatsApp de confirmación, reprogramación, cancelación y recordatorio; correos de recuperación, contraseña actualizada y cuenta de Google con `RESEND_API_KEY` ficticia y `fetch` simulado (`NODE_ENV=development` y `production`); verificación de Google fallida; login fallido; un 4xx y un 5xx (error de MySQL `ER_DUP_ENTRY` simulado) con cuerpo centinela. Exige que ningún centinela aparezca en lo capturado y que cada línea de error externo lleve `servicio`, `status` y `codigo`, y la de correo `tipo` (CA9, CA11, TM3, TM5, TM6, TM7) — cubre: CA9, CA11
- [ ] T014 [P] Escribir la prueba de la regla de lint — `tests/logs/lint.test.js` — hecho cuando: falla por la razón esperada (ESLint acepta `console.log` en `src/`) y comprueba con la API de ESLint y `lintText` que `console.log('x')` con nombre de archivo `src/modules/x/x.service.js` y `server.js` da error `no-console`, y en `src/utils/logger.js` no (TM10)
- [ ] T015 [P] Escribir la prueba de silencio de la suite — `tests/logs/silencio.test.js` — hecho cuando: falla por la razón esperada y comprueba que, con `LOG_LEVEL=silent` y sin captura, una petición a `/health` y a una ruta que da 500 no llama a `process.stdout.write` (RNF)

## Implementación
- [ ] T020 Implementar el contexto y el logger — `src/utils/contexto.js`, `src/utils/logger.js` — hecho cuando: T010 pasa; sin dependencias nuevas en `package.json` — cubre: CA6, CA7, CA10, CA11, CA12 — depende: T010
- [ ] T021 Implementar el identificador y la línea por petición — `src/middlewares/requestId.js`, `src/middlewares/registroPeticion.js`, `src/config/app.js` — hecho cuando: T011 pasa y la parte de CA8 de T012 pasa; ambos middlewares son los primeros de `createApp()`, antes de `helmet` — cubre: CA1, CA2, CA3, CA4, CA8, CA12 — depende: T011, T012, T020
- [ ] T022 Rehacer `errorHandler` sin anidamiento y con log por estado — `src/middlewares/errorHandler.js` — hecho cuando: T001 sigue verde sin tocarla, T012 (niveles de 4xx y 5xx) y la parte de 4xx y 5xx de T013 pasan; un solo `normalizeJwtError`, un solo `errorHandler` y un solo `module.exports` — cubre: CA8, CA9 — depende: T001, T020
- [ ] T023 [P] Pasar el cron de recordatorios al logger con contexto propio — `src/services/reminder.service.js` — hecho cuando: la parte de CA5 de T012 y la de recordatorios de T013 pasan; sin «RESPUESTA META» ni volcado de `error.response.data` — cubre: CA5, CA9, CA11 — depende: T012, T013, T020
- [ ] T024 [P] Pasar los avisos de WhatsApp de citas al logger — `src/modules/citas/citas.service.js` — hecho cuando: la parte de CA4 de T012 y la de confirmación, reprogramación y cancelación de T013 pasan; los mensajes llevan `id_cita` y `plantilla` — cubre: CA4, CA9, CA11 — depende: T012, T013, T020
- [ ] T025 [P] Quitar el destinatario y el contenido de los correos — `src/services/email.service.js` — hecho cuando: la parte de correos de T013 pasa en `development` y `production`; `enviarCorreo` recibe `tipo` desde sus tres funciones exportadas y el error de Resend lleva estado y `name`, no el cuerpo — cubre: CA9, CA11 — depende: T013, T020
- [ ] T026 [P] Pasar los errores de autenticación al logger — `src/modules/auth/auth.service.js` — hecho cuando: la parte de Google y de correos de T013 pasa y las pruebas de `tests/auth/` siguen verdes — cubre: CA9, CA11 — depende: T013, T020
- [ ] T027 [P] Pasar los `console.*` restantes al logger — `src/config/db.js`, `src/utils/borrarArchivo.js`, `server.js` — hecho cuando: `grep -rn "console\." src server.js` solo encuentra `src/utils/logger.js`; el arranque local (`npm run dev --prefix backend` con la base de Docker) escribe en JSON «Base de datos conectada» y «Servidor escuchando» — cubre: CA6 — depende: T020
- [ ] T028 Activar `no-console` y correr la verificación completa — `eslint.config.js` — hecho cuando: T014 pasa; `npm test` (backend y frontend) en verde, con T001 y T010–T015 incluidas; `npm run lint --prefix backend` sin errores nuevos, solo los 5 previos; `npm --prefix backend audit --audit-level=high` sin altas · verificación manual: `docker compose up -d --build` en local, una petición con `X-Request-Id: verificacion-026-local` y `docker compose logs backend` muestra su línea JSON legible (RNF) — cubre: CA6 — depende: T014, T021, T022, T023, T024, T025, T026, T027

## Integración y documentación
- [ ] T090 Actualizar `docs/architecture.md` — `docs/architecture.md` — hecho cuando: Backend describe el logger JSON propio, el contexto por petición y `X-Request-Id`, con enlace al ADR 0011, y lista los cuatro transversales nuevos — depende: T028
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` — `docs/deployment.md`, `docs/observability.md` — hecho cuando: `LOG_LEVEL` está en Variables de entorno con su piso en producción; en Observabilidad, Resumen marca logs y correlación «en uso», Logs y Correlación quitan «Hoy no existe/no se cumple», y OB2.a, OB2.b, OB2.c, OB3.a, OB3.b, OB4.a y OB4.b pasan a «mitigada (spec 026)», cada una por separado; OB1 y OB5 siguen pendientes; deployment.md → Verificación post-deploy añade la comprobación del `request_id` del plan — depende: T028
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen en local en T028
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout): solo backend; `curl -sI` con `X-Request-Id: verificacion-026-a1` devuelve el mismo valor y `docker compose logs backend` tiene su línea con `status` 200; en la primera hora, sin líneas fuera de JSON salvo el arranque de Node, sin correos ni teléfonos (`grep -E '@|[0-9]{10}'`), sin más `"level":"error"` que el día anterior y con `job_id` en el cron
- [ ] T098 Marcar spec como `released`

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
| CA8 | T012 | T021, T022 |
| CA9 | T013 | T022, T023, T024, T025, T026 |
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
| TM6 | T020, T022 | T010, T013 |
| TM7 | T021 | T012, T013 |
| TM8 | T020, T021, T023 | T012 |
| TM9 | T020 | T010 |
| TM10 | T028 | T014 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `src/utils/contexto.js` | T020 |
| `src/utils/logger.js` | T020 |
| `src/middlewares/requestId.js` | T021 |
| `src/middlewares/registroPeticion.js` | T021 |
| `src/config/app.js` | T021 |
| `src/middlewares/errorHandler.js` | T001, T022 |
| `src/services/reminder.service.js` | T023 |
| `src/modules/citas/citas.service.js` | T024 |
| `src/services/email.service.js` | T025 |
| `src/modules/auth/auth.service.js` | T026 |
| `src/config/db.js`, `src/utils/borrarArchivo.js`, `server.js` | T027 |
| `eslint.config.js` | T028 |
| `tests/support/env.js` | T002 |
| `tests/logs/` | T001, T010, T011, T012, T013, T014, T015 |
| `docs/deployment.md`, `docs/observability.md`, `docs/architecture.md` | T090, T091 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Salida por stdout legible con `docker compose logs` | T010; verificación manual en T028 |
| La suite no imprime logs | T002, T015 |
