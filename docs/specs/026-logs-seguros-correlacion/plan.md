---
spec: 026-logs-seguros-correlacion
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-22
---

# Plan · 026 Logs seguros y correlación por petición

## Enfoque técnico
Un **logger propio** en `backend/src/utils/logger.js` escribe una línea JSON por mensaje en
stdout, con nivel, fecha y el reemplazo de campos sensibles. No usa dependencias
([ADR 0011](../../adr/0011-logger-propio-json.md)). Un **contexto por petición** con
`AsyncLocalStorage` de Node guarda el identificador de la petición y la referencia a `req`. Así el
logger lo encuentra solo en cualquier punto de la cadena asíncrona, también en los envíos de
WhatsApp y de correo, sin pasarlo como parámetro. El cron de recordatorios abre su propio contexto
en cada ejecución. Un middleware al inicio de la app asigna `X-Request-Id`, y otro escribe la línea
de resultado de cada petición. Las ~30 llamadas a `console.*` de `backend/src` y `server.js` pasan
al logger con mensajes que no llevan datos. Una regla de lint `no-console` impide que vuelvan.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 026 `approved` | manual: `aidd.py validate` y hook |
| P2 Tests por feature | ✅ | Cada criterio tiene test en `backend/tests/logs/` | test: suite `tests/logs/*` en CI |
| P3 Dependencias nuevas con ADR | ✅ | No hay dependencias nuevas: logger propio y `AsyncLocalStorage`, `crypto.randomUUID` de Node. ADR 0011 registra la decisión | test: `tests/seguridad/cadena-suministro.test.js` (lista de dependencias de producción sin cambios) |
| P4 Arquitectura con ADR | ✅ | Logs estructurados y contexto por petición son una pieza transversal nueva → ADR 0011 | manual: `/review` comprueba ADR `accepted` y `architecture.md` (T090) |
| P5 Producción solo con aprobación humana | ✅ | `/release` normal | manual: `/release` registra la aprobación |
| P6 Rollback documentado | ✅ | Sin datos ni esquema: revertir el commit (ver Rollout) | manual: sección Rollout |
| P7 Migraciones compatibles | ➖ | No hay cambios de esquema | — |
| P8 Autorización en el servidor | ➖ | No hay endpoints nuevos ni cambian permisos; la cabecera se añade a todas las rutas sin cambiar su control de acceso | — |
| P9 Entrada validada y SQL parametrizado | ✅ | La única entrada nueva es la cabecera `X-Request-Id`, validada con lista blanca de caracteres y longitud; sin SQL nuevo | test: `request-id.test.js` (CA2, CA3) |
| P10 Secretos fuera del repositorio | ✅ | El logger reemplaza `authorization`, `token`, `password`… y los errores de axios no se registran enteros (llevan la cabecera `Bearer` en `config`) | test: `sin-datos.test.js`; gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-22: frontend 0; backend 2 moderadas de desarrollo (`glob`, `minimatch` vía Jest), ninguna alta | test: `npm audit --audit-level=high` en CI y `/release` |
| P12 Modelo de amenazas en datos sensibles | ✅ | Ver "Modelo de amenazas" (los logs hoy contienen datos personales y credenciales) | manual: `/analyze` y `/review` sobre la sección |
| P13 Auditoría de datos sensibles | ➖ | La spec no cambia accesos; la auditoría es de las specs 027 y 028 | — |
| P14 Correlación por petición | ✅ | Middleware `requestId` y contexto propagado a cada log | test: `request-id.test.js`, `correlacion.test.js` |
| P15 Logs sin datos sensibles | ✅ | Redactor por nombre de campo, mensajes sin datos, errores externos y de BD resumidos, nivel `info` en producción | test: `logger.test.js` (redactor y niveles), `sin-datos.test.js`; lint: `no-console` en `backend/src` |
| P16 Accesibilidad WCAG 2.1 AA | ➖ | Sin interfaz | — |
| P17 Sin lógica de negocio en las vistas | ➖ | Sin vistas | — |
| P18 Metadatos por ruta indexable | ➖ | No cambia rutas públicas | — |
| P19 Noindex fuera de lo público | ➖ | No cambia rutas ni HTML | — |
| P20 La interfaz usa solo el sistema de diseño | ➖ | Sin interfaz | — |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/utils/contexto.js` (nuevo) | `AsyncLocalStorage` con `ejecutarConContexto(datos, fn)` y `contextoActual()`; el contexto guarda `requestId` o `jobId` y la referencia a `req` | Bajo |
| `backend/src/utils/logger.js` (nuevo) | `logger.debug/info/warn/error(mensaje, contexto?)`; JSON en una línea; nivel mínimo; reemplazo de campos sensibles; destino inyectable para pruebas; nunca lanza (CA12). Helpers `resumirErrorExterno(servicio, error)` y `resumirError(error)` | Medio: un error aquí afecta todo log |
| `backend/src/middlewares/requestId.js` (nuevo) | Valida o genera el identificador, lo pone en `res` antes de todo lo demás y abre el contexto | Bajo |
| `backend/src/middlewares/registroPeticion.js` (nuevo) | En `finish`/`close` escribe la **única** línea «Petición atendida» con método, ruta sin query, estado y duración, más el resumen del error que dejó `errorHandler` en `res.locals` (si lo hay). Nivel por estado; `/health` en `debug` | Bajo |
| `backend/src/config/app.js` | Montar `requestId` y `registroPeticion` como **primeros** middlewares, antes de `helmet`, `cors`, el estático y `/health` | Bajo |
| `backend/src/middlewares/errorHandler.js` | Deshacer el anidamiento: una sola `normalizeJwtError`, que conserva el caso `LIMIT_FILE_SIZE`, un solo `errorHandler` y un solo `module.exports`, con prueba de caracterización previa (ver Decisiones). **No escribe líneas propias**: deja en `res.locals.errorRegistro` el resumen del error, que `registroPeticion` añade a su línea (A1). El resumen es:
- 5xx: `resumirError` (pila sí; en errores de MySQL, sin `sql`, `sqlMessage` ni valores).
- 4xx operacional (`AppError` y los normalizados): `error_name` y el mensaje que ya se devuelve al cliente.
- 4xx no operacional (p. ej. `SyntaxError` de un JSON mal formado, que trae `body` crudo y un fragmento en `message`): solo `error_name` y `type` (A5).
- En ningún caso pila, `body` ni `message` original. | Medio: archivo con código muerto; respuesta al cliente no debe cambiar |
| `backend/src/services/reminder.service.js` | Cada ejecución corre en `ejecutarConContexto({ jobId })`; quitar «RESPUESTA META» y el volcado de `error.response.data`; mensajes con `id_cita` | Bajo |
| `backend/src/modules/citas/citas.service.js` | 3 avisos de éxito y 4 de error de WhatsApp → logger con `id_cita` y `resumirErrorExterno('whatsapp', error)` | Bajo |
| `backend/src/services/email.service.js` | Quitar el bloque que imprime «Para», «Asunto» y texto; registrar tipo de correo e id de Resend; el error de Resend lleva estado y `name` del cuerpo, no el cuerpo | Medio: la firma de `enviarCorreo` recibe un `tipo` nuevo |
| `backend/src/modules/auth/auth.service.js` | 4 `console.error` → logger con `resumirErrorExterno('correo'|'google', error)` y el tipo de correo | Bajo |
| `backend/src/config/db.js`, `backend/src/utils/borrarArchivo.js`, `backend/server.js` | `console.*` → logger, sin rutas absolutas ni objetos de error completos | Bajo |
| `backend/eslint.config.js` | `no-console: error` en `src/**` y `server.js`, excepto `src/utils/logger.js` | Bajo: de los 4 errores previos, los 2 de `errorHandler.js` desaparecen con la reescritura; quedan `faqs.service.js:4` e `images.service.js:20` |
| `backend/tests/support/env.js` | `LOG_LEVEL=silent` por defecto en pruebas (RNF) | Bajo |
| `backend/tests/services/recordatorios.test.js`, `backend/tests/usuarios/rutas-usuarios.test.js` | Migrar de espiar `console.*` a la captura del logger, sin perder lo que comprueban. En la comprobación de avisos apagados (ficha 2026-11-09-fix-recordatorios-apagado): apagado, ninguna línea «enviado»; encendido, una línea de aviso con `id_cita` y `plantilla`. En usuarios: ningún correo ni contraseña en lo capturado, comprobando primero que hay líneas (A2, A16) | Medio: si se migran mal, las pruebas pasan vacías |
| `backend/tests/logs/` (nuevo) | Pruebas de esta spec | — |
| `docs/deployment.md`, `docs/observability.md`, `docs/architecture.md` | Variable `LOG_LEVEL`, estado de OB2–OB4, sección Backend (T090) | — |

## Contratos y datos
**Cabecera `X-Request-Id`** (entrada y salida, en todas las respuestas del backend):
- Válido: `/^[A-Za-z0-9_-]{8,64}$/`. Si llega válido se devuelve igual; si falta o no es válido, se
  genera con `crypto.randomUUID()`.
- No cambia el cuerpo de ninguna respuesta. No se añade a `exposedHeaders` de CORS: mostrarlo en la
  interfaz está fuera de alcance.

**Línea de log** (una por mensaje, JSON, `\n` al final):
```json
{"timestamp":"2026-11-22T08:15:30.123Z","level":"info","message":"Petición atendida","request_id":"…","actor_id":12,"context":{"method":"GET","route":"/api/v1/citas","status":200,"duration_ms":14}}
```
- Los nombres de campo son los de `docs/observability.md` → Logs: `timestamp`, `level`,
  `request_id`, `actor_id`, `message`, `context`, más `job_id` en el cron (A11).
- `request_id` en peticiones; `job_id` en el cron; `actor_id` solo si `req.user` existe (lo pone
  `verifyToken`, leído desde el contexto en el momento de escribir).
- Niveles: `debug` < `info` < `warn` < `error`; `silent` solo para pruebas. Por defecto `info` con
  `NODE_ENV=production` y `debug` en otro caso. `LOG_LEVEL` puede subirlo. Con
  `NODE_ENV=production` el nivel efectivo nunca baja de `info`: `debug` y `silent` se ignoran
  (CA7; decisión del usuario, 2026-11-22, /analyze A21).
- Reemplazo (CA10): recorre `context` hasta 5 niveles; una clave cuyo nombre normalizado (sin
  mayúsculas, guiones ni `_`) contiene `correo`, `email`, `telefono`, `phone`, `password`,
  `contrasena`, `token`, `authorization`, `credential`, `credencial`, `secret`, `cookie`, `nombre`,
  `name`, `direccion` o `address` → valor `"[oculto]"`. **Excepción:** las claves `error_name` y
  `type` comparadas tal cual, sin normalizar, se conservan; solo las produce `resumirError` (A6,
  A25). `type` se lista por claridad: no contiene ningún término. `Error_Name` sigue oculto.
- `resumirErrorExterno(servicio, error)` → `{ servicio, status, codigo }`. `status` sale de
  `error.response?.status` o `error.status`; `codigo` del código de error del proveedor (Meta:
  `error.response.data.error.code`; Resend: `name`). Nunca `config`, `request`, `data` ni `message`
  del proveedor.
- `resumirError(error)` → `{ error_name, message, stack }`. Para errores de MySQL (`error.sqlState`
  presente): `{ error_name, code, errno, stack }` con la primera línea de la pila reemplazada,
  porque `ER_DUP_ENTRY` incluye el valor duplicado (p. ej. un correo).

**`enviarCorreo`**: recibe además `tipo` (`recuperacion`, `aviso_contrasena`, `bienvenida_google`…),
que es lo único que se registra del correo.

**Variable nueva:** `LOG_LEVEL` (opcional; `debug|info|warn|error`), en `docs/deployment.md`.

Sin migraciones ni endpoints nuevos.

## Estrategia de pruebas
Jest + supertest (ADR 0004), con `createApp()` y la base simulada de `tests/support/fake-db.js`. El
logger acepta un destino en memoria: `logger.__capturar({ nivel = 'debug' })` fija el nivel durante
la captura, sin importar `LOG_LEVEL=silent` ni el piso de producción, devuelve las líneas y
restaura stdout y el nivel al terminar. Fuera de una captura, el piso de producción se aplica
siempre. Las pruebas leen JSON, no texto.

Reglas comunes a `tests/logs/` (A3, A7):
- Toda prueba que exige que **falte** algo (un centinela, una pila) comprueba primero que **existen**
  las líneas esperadas de ese flujo, por `message` y con número > 0. Si el flujo no escribe nada por
  diseño (WhatsApp apagado), la misma prueba incluye un control positivo: la acción equivalente con
  WhatsApp encendido deja su línea en la misma captura (A23).
- Toda prueba que pone `NODE_ENV=production` corre dentro de `__capturar()`, porque en producción
  `silent` se ignora y si no escribiría en stdout (A24). La caracterización de `errorHandler`
  llama al middleware directamente, sin `createApp()`, así que no genera líneas.
- El resumen que deja `errorHandler` en `res.locals.errorRegistro` se prueba aparte, llamando al
  middleware con un `res` simulado (`tests/logs/error-registro.test.js`). Así T022 se verifica sin
  `registroPeticion` (A22).
- Los estados se obtienen así: rutas de auth con la base simulada; `servicios/publicos`, citas y
  usuarios con `jest.mock` de sus repositorios, como en `tests/services/recordatorios.test.js`; el
  500 y el `ER_DUP_ENTRY` con un repositorio simulado que lanza, de modo que pasan por el
  `errorHandler` de `createApp()`. No se añaden rutas después de `createApp()`.
- **Unitarias** `tests/logs/logger.test.js`: formato y campos (CA6), niveles y piso en producción
  (CA7), reemplazo de campos y variantes (CA10), un destino que lanza no propaga (CA12),
  `resumirErrorExterno` y `resumirError` con un error de axios real simulado y uno de MySQL
  (`ER_DUP_ENTRY`).
- **Integración** `tests/logs/request-id.test.js`: cabecera en 200, 401, 404, 429 (limitador de
  login), 500 (repositorio que lanza) y `/health` (CA1); eco del válido (CA2); inválidos que Node
  sí transmite (65 caracteres, con espacio, con `;`, con `"}` y con tabulador) → otro valor y
  ausente de las líneas (CA3). `\n` y `\r` no se pueden enviar por HTTP (el cliente de Node lanza
  `ERR_INVALID_CHAR`): se prueban sobre el validador exportado por `requestId.js` (A4).
- **Integración** `tests/logs/correlacion.test.js`: crear una cita (aviso de confirmación) con
  WhatsApp simulado (`axios` con `jest.spyOn`) deja todas sus líneas, incluida la del aviso, con el
  mismo `request_id`, y lo mismo una solicitud de recuperación de contraseña con `fetch` simulado
  (CA4, A9); dos ejecuciones del trabajo de recordatorios (callback de `cron.schedule` capturado
  con un mock) → `job_id` común dentro de cada una y distinto entre ellas (CA5). Una petición deja
  **exactamente una** línea «Petición atendida» con el nivel de su estado. En un 500 esa línea
  lleva `stack` y ninguna otra línea de la petición lo lleva; en un 4xx no hay `stack` en ninguna
  (CA8, A1). La ruta va sin query, y con sesión se registra `actor_id`.
- **Integración** `tests/logs/sin-datos.test.js` (CA9, CA11): datos centinela (`5512345678`,
  `centinela@example.test`, `Nombre Centinela`, `Calle Centinela`, token de recuperación
  `tok-centinela…`, contraseña `Clave-Centinela-1`, `Bearer centinela`, credencial de Google
  `cred-centinela`) recorren cada flujo de la lista de CA9 con éxito y con error del proveedor
  simulado, más un cuerpo JSON mal formado que contiene centinelas (A5). Se concatena todo lo
  capturado y se exige que no aparezca ningún centinela. Además, las líneas de error externo llevan
  `servicio`, `status` y `codigo`; las de aviso, `id_cita` y `plantilla`; y la de correo enviado,
  `tipo` e `id_proveedor` (CA11, A8). El aviso de confirmación se recorre por sus dos entradas,
  `createCita` y `createCitaPaciente` (A17).
- **Lint**: `tests/logs/lint.test.js` usa `ESLint#lintText` con `filePath` (respeta `files` e
  `ignores` de la configuración plana) y comprueba que `console.log` da `no-console` en
  `src/**` y `server.js`, y no en `src/utils/logger.js` (A13).
- **Pruebas existentes**: `tests/services/recordatorios.test.js` y
  `tests/usuarios/rutas-usuarios.test.js` pasan a la captura del logger, con las mismas
  comprobaciones y la regla de «primero que existan» (A2, A16).
- **RNF**: con `LOG_LEVEL=silent` la suite no escribe en stdout (`tests/logs/silencio.test.js`
  espía `process.stdout.write` en una petición). Con `NODE_ENV=production` dentro de
  `__capturar()` tampoco (A24).

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Tampering: identificador con `\n` o JSON para inyectar líneas falsas en el log | A09:2025 Security Logging and Alerting Failures | `requestId.js` | Lista blanca `[A-Za-z0-9_-]{8,64}`; si no cumple, se genera otro; JSON escapa cualquier valor | `request-id.test.js` (CA3) |
| TM2 | DoS: identificador enorme para inflar cada línea | A06:2025 Insecure Design | `requestId.js` | Máximo 64 caracteres | `request-id.test.js` (CA3) |
| TM3 | Information disclosure: teléfono y nombre en las respuestas de Meta y en los parámetros de la plantilla | A09:2025 | `reminder.service.js`, `citas.service.js` | Solo `resumirErrorExterno`; mensajes con `id_cita` | `sin-datos.test.js` (CA9) |
| TM4 | Information disclosure: token de WhatsApp en `error.config.headers` de axios si se registra el error completo | A09:2025 · A02:2025 | logger | Nunca se registra un error externo entero; reemplazo de `authorization` | `logger.test.js`, `sin-datos.test.js` |
| TM5 | Information disclosure: destinatario y enlace de recuperación del correo | A09:2025 · A07:2025 | `email.service.js` | Se registra solo `tipo` e id del proveedor; el error de Resend sin cuerpo | `sin-datos.test.js` (CA9, CA11) |
| TM6 | Information disclosure: valores en errores de MySQL (`ER_DUP_ENTRY` con el correo, `err.sql` con los parámetros) en la pila de un 5xx | A09:2025 | `errorHandler.js` | `resumirError` sin `sql`, `sqlMessage` ni primera línea | `logger.test.js`, `sin-datos.test.js` (5xx con cuerpo) |
| TM7 | Information disclosure: cuerpos de petición o query con datos (búsqueda de pacientes por nombre) | A09:2025 | `registroPeticion.js` | Ruta sin query; nunca se registra `req.body` ni cabeceras | `correlacion.test.js` (CA8), `sin-datos.test.js` |
| TM8 | Repudiation: sin poder atar mensajes a una petición o usuario | A09:2025 | contexto | `request_id`, `job_id` y `actor_id` en cada línea | `correlacion.test.js` (CA4, CA5) |
| TM9 | DoS: un fallo de escritura del log tumba la petición | A06:2025 | logger | `try/catch` en la escritura; nunca lanza | `logger.test.js` (CA12) |
| TM10 | Information disclosure: un `console.*` nuevo con datos que esquiva el logger | A09:2025 | `backend/src` | Regla `no-console` | `lint.test.js` |
| TM11 | Information disclosure: errores de parseo o de librerías (body-parser, multer) que llevan la entrada en `body` o en un fragmento de `message`, p. ej. un JSON mal formado con datos | A09:2025 | `errorHandler.js` | De un 4xx no operacional solo se registran `error_name` y `type`; nunca `body` ni el `message` original (A5) | `sin-datos.test.js` (cuerpo mal formado con centinelas) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: `X-Request-Id` en toda respuesta, distinto en cada una | `requestId.js`, `app.js` | integración `request-id.test.js` |
| CA2: eco del identificador válido | `requestId.js` | integración `request-id.test.js` |
| CA3: (abuso) identificador inválido se ignora y no se registra | `requestId.js` | integración `request-id.test.js` |
| CA4: todos los mensajes de una petición con su identificador | `contexto.js`, `logger.js`, `citas.service.js` | integración `correlacion.test.js` |
| CA5: identificador propio por ejecución del cron | `reminder.service.js`, `contexto.js` | integración `correlacion.test.js` |
| CA6: línea estructurada con fecha, nivel, texto, identificador y `actor_id` | `logger.js` | unitaria `logger.test.js`; integración `correlacion.test.js` |
| CA7: sin `debug` en producción, sí en local | `logger.js` | unitaria `logger.test.js` |
| CA8: línea por petición con nivel por estado | `registroPeticion.js`, `errorHandler.js` | integración `correlacion.test.js`; unitaria `error-registro.test.js` |
| CA9: (abuso) sin datos personales ni credenciales en los flujos listados | `email.service.js`, `auth.service.js`, `citas.service.js`, `reminder.service.js`, `errorHandler.js` | integración `sin-datos.test.js` |
| CA10: reemplazo de campos de nombre sensible | `logger.js` | unitaria `logger.test.js` |
| CA11: errores externos con servicio, estado y código; correo solo con tipo e id | `logger.js`, `email.service.js`, `auth.service.js`, `citas.service.js` | integración `sin-datos.test.js`; unitaria `logger.test.js` |
| CA12: un fallo del log no cambia la respuesta | `logger.js` | unitaria `logger.test.js`; integración con destino que lanza en `request-id.test.js` |
| RNF: salida por stdout legible con `docker compose logs` | `logger.js` | unitaria `logger.test.js` (escribe en `process.stdout`); verificación manual: `docker compose logs backend` en local tras levantar el stack |
| RNF: la suite no imprime logs | `tests/support/env.js` | `silencio.test.js` |
| TM1–TM2 | `requestId.js` | `request-id.test.js` |
| TM3, TM5, TM7 | servicios, `registroPeticion.js` | `sin-datos.test.js`, `correlacion.test.js` |
| TM4, TM6 | `logger.js`, `errorHandler.js` | `logger.test.js`, `sin-datos.test.js`, `error-registro.test.js` |
| TM8 | `contexto.js` | `correlacion.test.js` |
| TM9 | `logger.js` | `logger.test.js` |
| TM10 | `eslint.config.js` | `lint.test.js` |
| TM11 | `errorHandler.js` | `sin-datos.test.js`, `error-registro.test.js` |

## Observabilidad
- Logs nuevos:
  - «Petición atendida», una sola línea por petición → `info`/`warn`/`error` según estado (`debug` en `/health`) → `method`, `route`, `status`, `duration_ms` y, si hubo error, `error` con el resumen de `errorHandler` (`stack` solo en 5xx). Contenido de `error` en Cambios por módulo → `errorHandler.js` (A1).
  - «Aviso de WhatsApp enviado» / «no enviado» → `info`/`error` → `plantilla`, `id_cita`, y en error `servicio`, `status`, `codigo`.
  - «Correo enviado» / «Correo no enviado» → `info`/`error` → `tipo`, `id_proveedor` o `servicio`, `status`, `codigo`.
  - «Recordatorios: inicio/fin de ejecución» → `debug`/`info` → `job_id`, `revisadas`, `enviadas`.
  - Todas con `request_id` o `job_id`, sin datos sensibles.
- Eventos de auditoría: no aplica (specs 027 y 028).
- Métricas y alertas: ninguna nueva. La línea por petición deja preparado el conteo de 5xx de OB5.b.
- Cómo se verifica tras el deploy: `curl -sI https://sistema.dentissa.app/api/v1/servicios/publicos -H "X-Request-Id: verificacion-026-a1"` devuelve la misma cabecera; en el servidor, `docker compose logs backend | grep verificacion-026-a1` muestra la línea JSON de esa petición con `status` 200. Además, `docker compose logs backend --since 10m | grep -E '@|[0-9]{10}'` no muestra correos ni teléfonos.

## Descubribilidad
No aplica: no crea ni cambia rutas públicas ni su HTML.

## Rollout
- Feature flag: no aplica. No cambia flujos ni respuestas, solo el formato de los logs y una cabecera nueva. Un flag mantendría dos caminos de log y la fuga de datos en uno de ellos.
- Orden de despliegue: solo backend (`docker compose ... up -d --build backend`). El frontend no cambia.
- Compatibilidad: total. La cabecera es nueva y ningún cliente depende de ella; los cuerpos no cambian.
- Rollback: revertir el commit de la versión en el servidor y reconstruir el backend según `docs/deployment.md` → Rollback. No hay datos ni esquema que revertir. Los logs ya escritos en JSON siguen legibles.
- Métricas a vigilar tras el deploy: durante la primera hora, `docker compose logs backend` sin líneas fuera de JSON (salvo las de Node al arrancar), sin aumento de líneas `"level":"error"` respecto al día anterior y el cron de recordatorios con `job_id`.

## Decisiones (→ ADR si son arquitectónicas)
- **Logger propio sin dependencia** frente a `pino`: `pino` solo reemplaza rutas fijas de campos, así que CA10 igual pide código propio, y añadiría una dependencia de producción sobre datos de salud. → [ADR 0011](../../adr/0011-logger-propio-json.md) (decisión del usuario, 2026-11-22).
- **JSON también en local**: un solo formato, y las pruebas validan lo mismo que corre en producción (decisión del usuario, 2026-11-22).
- **Contexto con `AsyncLocalStorage`** frente a pasar `req` o `requestId` por parámetro: llega a los servicios que no reciben `req`, como WhatsApp y el correo, sin cambiar firmas. Viene en Node 22 y es estable. Se incluye en el ADR 0011.
- **Identificador generado con `crypto.randomUUID()`**: sin dependencia y con 36 caracteres que cumplen el formato válido.
- **No se reutiliza `cf-ray` de Cloudflare**: no siempre llega (local, pruebas) y su formato es del proveedor. El cliente o Cloudflare pueden mandar `X-Request-Id` si se quiere encadenar.
- **Nivel por estado**: 2xx y 3xx `info`, 4xx `warn`, 5xx `error`, y `/health` `debug` (supuesto de la spec).
- **`actor_id` leído al escribir**, no al abrir el contexto: `verifyToken` pone `req.user` después del middleware de identificador, y la referencia a `req` lo ve.
- **`LOG_LEVEL` con piso `info` en producción**: permite silenciar en pruebas y subir a `warn` si hace falta. En producción `silent` y `debug` se ignoran (decisión del usuario, 2026-11-22, /analyze A21).
- **Una sola línea por petición**: el error de la petición va dentro de «Petición atendida», no en una línea aparte. Así se cumple CA8 tal como está escrito y se correlaciona sin cruzar líneas (/analyze A1).
- **Nombres de campo de `docs/observability.md`** (`timestamp`, `message`, `actor_id`) en lugar de `time`, `msg` y `user_id` (/analyze A11).
- **Errores de MySQL sin la primera línea de la pila**: `ER_DUP_ENTRY` incluye el valor (OB2.c, TM6).
- **Limpiar el código anidado de `errorHandler.js`** dentro de esta spec, porque hay que tocar el archivo. La primera `normalizeJwtError` (líneas 6–169) no se cierra hasta el final. Dentro lleva otra `normalizeJwtError`, otro `errorHandler`, un `module.exports` que se reasigna en cada llamada y el caso `LIMIT_FILE_SIZE`. Lo exportado y usado es el `errorHandler` de nivel superior (línea 183). Hoy el caso de 6 MB sí se aplica, pero ningún test lo cubre. Por eso, **antes** de limpiar, una prueba de caracterización (`tests/logs/error-handler-caracterizacion.test.js`) fija las respuestas actuales: JWT expirado, JWT inválido, sin token, cuenta desactivada, `LIMIT_FILE_SIZE` → 400 con su mensaje, `AppError` 4xx y error 500 sin detalle en producción. La prueba debe seguir verde después sin tocarla.
- Coordinación con la spec 025 (`frontend-sin-root`): no comparte código, pero las dos editan `docs/architecture.md` y la verificación post-deploy de `docs/deployment.md`. Se fusiona primero la que termine antes; la otra se rebasa sobre `main` antes de su T090 y T091 (decisión del usuario, 2026-11-22, /analyze A12).
- Correcciones: OB2.a, OB2.b, OB2.c, OB3.a, OB3.b, OB4.a y OB4.b quedan dentro y se marcan mitigadas al liberar. OB1.a–f siguen pendientes → specs 027 y 028; OB5.a y OB5.b → Pendientes y deuda.

## Impacto en arquitectura
- `docs/architecture.md` → Backend: «Observabilidad: solo `console.*`» pasa a logger JSON propio con contexto por petición y `X-Request-Id`; transversales nuevos `utils/logger.js`, `utils/contexto.js`, `middlewares/requestId.js` y `middlewares/registroPeticion.js`.
- `docs/observability.md`: Resumen (logs y correlación «en uso»), estado de OB2.a–c, OB3.a–b y OB4.a–b.
- `docs/deployment.md`: variable `LOG_LEVEL`.

## Riesgos y mitigaciones
- **Un mensaje con datos que el redactor no reconoce** (texto libre en `message`): los mensajes son literales fijos y los datos van en `context`. La prueba `sin-datos.test.js` con centinelas detecta las fugas en los flujos conocidos, y `/review` revisa cada llamada nueva.
- **Pérdida del contexto en callbacks que no son promesas** (p. ej. `node-cron` o eventos de `res`): el cron abre su propio contexto en el callback, y `registroPeticion` captura el `requestId` al montar el listener, no al dispararse.
- **Cambiar `errorHandler.js` cambia una respuesta sin querer**: la prueba de caracterización se escribe y pasa antes del cambio, y las pruebas existentes de auth y citas deben seguir verdes sin tocarlas. Las únicas pruebas existentes que se modifican son las que espiaban `console.*` (ver Cambios por módulo).
- **Logs más largos en disco** por el JSON: sin rotación configurada (brecha por confirmar en `docs/observability.md`). El volumen es bajo (una clínica), y la rotación queda fuera de alcance.
- **Jest imprime ruido si el logger escribe en pruebas**: `LOG_LEVEL=silent` en `tests/support/env.js`.
