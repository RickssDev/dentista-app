---
spec: 026-logs-seguros-correlacion
verdict: changes_requested
round: 1
date: 2026-11-22
base: 49825d5
head: 75afdf6
human_signoff: pending
---

# Review · 026 Logs seguros y correlación por petición

## Resumen
No hay bloqueantes: los tests, el lint, el build y el validador pasan, y cada control del modelo de
amenazas existe con su test. Hay 4 importantes, y el usuario decidió corregirlos antes de liberar:
R1, cuando un mensaje de MySQL tiene varias líneas, de la segunda en adelante quedan en la pila;
R2, una petición abortada queda registrada como 200; R3, los fallos de la base de datos se
atribuyen a WhatsApp; R4, la lista de claves sensibles no incluye variantes en español. También se
corrigen ahora los menores baratos; R14, R16 y R17 quedan aceptados y van al roadmap.
Conteo: bloqueante 0 · importante 4 · menor 13

Revisores con contexto limpio: A (spec) y S (seguridad) con `opus`, C+D (constitución y calidad)
con `sonnet`, sobre `.ai/cache/review/026-logs-seguros-correlacion/` (code.diff de 87 KB). Sin
revisor de accesibilidad ni de SEO: el diff no toca el frontend.

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend: 32 suites, 355 pruebas y 5 `todo`; frontend: 24 archivos y 220 pruebas (línea base: sin fallos) |
| `npm run lint --prefix backend` | ✅ solo los 2 errores previos (`faqs.service.js:4`, `images.service.js:20`); la línea base del plan tenía 4 |
| `npm run lint --prefix frontend` | ➖ 7 errores y 5 avisos, todos previos: el diff no toca el frontend |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate` | ✅ 0 errores |
| Tests asíncronos nuevos, dos ejecuciones | ✅ `tests/logs` y las dos suites migradas pasan en las dos ejecuciones (120/120), sin intermitencias |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `tests/logs/request-id.test.js` | ✅ | |
| CA2 | `tests/logs/request-id.test.js` | ✅ | Por diseño se acepta un id válido que llega del cliente (ver Seguridad) |
| CA3 | `tests/logs/request-id.test.js` | ⚠ | 2 de los 6 casos no detectarían una regresión (R8) |
| CA4 | `tests/logs/correlacion.test.js` | ⚠ | Solo se prueban los envíos con éxito; las líneas de error del proveedor no (R13) |
| CA5 | `tests/logs/correlacion.test.js`, `tests/services/recordatorios.test.js` | ✅ | |
| CA6 | `tests/logs/logger.test.js`, `tests/logs/lint.test.js` | ✅ | |
| CA7 | `tests/logs/logger.test.js`, `tests/logs/silencio.test.js` | ⚠ | Un caso de `silencio.test.js` pasa por construcción (R9) |
| CA8 | `tests/logs/correlacion.test.js`, `tests/logs/error-registro.test.js` | ❌ | Una petición abortada queda como 200 `info` (R2). `/health` en `debug` lo decidió el plan (R14) |
| CA9 | `tests/logs/sin-datos.test.js`, `tests/usuarios/rutas-usuarios.test.js` | ⚠ | El resto de un mensaje de MySQL de varias líneas queda en la pila (R1) |
| CA10 | `tests/logs/logger.test.js` | ❌ | «y sus variantes»: faltan `clave`, `apellido`, `celular`, `pass`, `apikey`… (R4) |
| CA11 | `tests/logs/sin-datos.test.js`, `tests/services/recordatorios.test.js` | ❌ | Un fallo de la base de datos se registra como fallo de WhatsApp (R3) |
| CA12 | `tests/logs/logger.test.js`, `tests/logs/request-id.test.js` | ⚠ | Un error asíncrono de stdout (EPIPE) no se cubre (R6) |

## Conformidad con el plan
- Cambios fuera del plan: ninguno. Los 25 archivos de código están citados por alguna tarea (`scope.md`).
- Partes del plan sin implementar: ninguna. No hay tareas sin diff.
- Menor fuera de alcance: T025 borró el encabezado «RECUPERACIÓN DE CONTRASEÑA» de `email.service.js` (R11).

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1–P20 | ✅ sin violaciones | Revisor C+D sobre el diff. No hay dependencias nuevas (`deps.stat` vacío) y el ADR 0011 está `accepted` |
| P2 (código tocado con test) | ⚠ | `borrarArchivo` y el log de `db.js` no tienen prueba (R5, R12) |
| P14 (correlación) | ✅ | `request-id.test.js` y `correlacion.test.js` |
| P15 (sin datos sensibles en logs) | ✅ con huecos | `lint.test.js` (`no-console`) falla si se quita la regla; `sin-datos.test.js`. Huecos: R1, R4 |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos: gitleaks v8.21.2 sobre `git log -p 49825d5..HEAD` | ✅ 0 hallazgos |
| SAST | ➖ no aplica (decisión del usuario, 2026-11-08, `docs/security.md`) |
| SCA: `npm audit --audit-level=high` | ✅ backend crít: 0 · alta: 0 · media: 20 (de desarrollo, previas); frontend 0 |
| Contenedores: trivy | ➖ no se ejecutó en local, porque no está instalado; corre en CI. El diff no toca Dockerfiles ni compose |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A01 Control de acceso | ➖ | No cambian rutas ni autorización. `actor_id` sale de `req.user.id`, que fija `verifyToken` tras verificar el JWT |
| A02 Configuración | ✅ | Ninguna ruta protegida en el diff. En producción el piso es `info` y no se baja con `LOG_LEVEL` (`logger.js:32-43`). El stack no sale en las respuestas de producción |
| A03 Cadena de suministro | ✅ | Sin cambios en lockfiles; logger propio (ADR 0011) |
| A04 Criptografía y datos sensibles | ⚠ | Se retiraron los `console.*` con teléfono, cuerpo de Meta, correo y enlace. Huecos: R1 (resto del mensaje de MySQL en la pila) y R4 (variantes de claves) |
| A05 Inyección | ➖ | Sin SQL nuevo. Inyección en logs: `X-Request-Id` con lista blanca `^[A-Za-z0-9_-]{8,64}$` y `JSON.stringify` en todas las líneas |
| A06 Diseño inseguro | ✅ | TM1–TM11 con control y test; S comprobó que cada test falla sin su control |
| A07 Autenticación | ➖ | Solo cambia cómo se registran los fallos de Google y de correo |
| A08 Integridad | ➖ | |
| A09 Registro y alertas | ⚠ | JSON de una línea con `request_id`, `job_id` y `actor_id`. Atribución errónea en R3 y petición abortada en R2 |
| A10 Errores y condiciones excepcionales | ✅ con matices | Un 4xx no operacional solo deja `error_name` y `type` (TM11), y la escritura va dentro de `try/catch`. Matices: R6 y R7 |
| SSRF | ➖ | |

Aceptado por diseño, sin hallazgo: un `X-Request-Id` válido que llega del cliente se reutiliza
(CA2). Alguien podría repetir un id visto en otra respuesta, pero solo mezclaría sus propias
líneas; no ve las ajenas.

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica (OB1 queda para las specs 027 y 028).
- Datos sensibles en logs del código tocado: ninguno en los llamadores actuales; huecos de defensa en R1 y R4.
- `request_id` presente en los logs nuevos: sí en las peticiones y `job_id` en el cron. Las líneas de error de proveedor dentro de una petición no tienen test de correlación (R13).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `backend/src/utils/logger.js:56` | En los errores de MySQL, `resumirError` solo descarta la primera línea del `stack`. Si el mensaje tiene varias líneas (un valor citado con `\n` en ER_DUP_ENTRY, ER_TRUNCATED_WRONG_VALUE o ER_PARSE_ERROR), de la segunda en adelante llegan al log del 5xx. Así se elude TM6, y el test solo usa mensajes de una línea | Conservar solo las líneas de marco (`/^\s+at /`) y probarlo con un centinela de varias líneas |
| R2 | importante | `backend/src/middlewares/registroPeticion.js:27,42` | Si el cliente aborta, `close` registra `status: res.statusCode` (200 por defecto) como `info`, aunque no se envió respuesta. Lo comprobó el revisor A con un script | En `close` sin respuesta terminada, `aborted: true`, `status: null` y `warn`, con un test que aborte |
| R3 | importante | `backend/src/services/reminder.service.js:26,50-58`; `backend/src/modules/citas/citas.service.js:200-220,517-537` | `citaEnCurso` no se limpia después del envío: un fallo de `marcarRecordatorioEnviado` se registra como «Aviso de WhatsApp no enviado» con `servicio: 'whatsapp'`. En `citas.service`, un fallo de `getPacienteWhatsApp` o `getServicioById` cae en el mismo `catch`. CA11 pide decir qué servicio falló | Separar los fallos de la base de datos con su propio mensaje y `resumirError` |
| R4 | importante | `backend/src/utils/logger.js:13-16` | A los términos sensibles les faltan variantes de CA10 («y sus variantes»): `clave`, `apellido` (no contiene «name»), `celular`, `movil`, `pass`, `pwd`, `apikey`, `*key`, `jwt`, `bearer`, `session`, `destinatario` | Añadirlas, con su prueba positiva y la de que no hay falsos positivos |
| R5 | menor | `backend/src/config/db.js:19` | El comentario dice que no se registra el mensaje de MySQL, pero un error de red (`ECONNREFUSED`) no trae `sqlState` y se registra con `message` y `stack` (host y puerto) | Registrar solo `error_name`, `code` y `errno`, con test |
| R6 | menor | `backend/src/utils/logger.js:115` | El `try/catch` no cubre un `error` asíncrono de `process.stdout` (EPIPE): sin oyente, el proceso cae | Registrar un oyente de `error` vacío al cargar |
| R7 | menor | `backend/src/utils/logger.js:78-92` | `redactar` no tiene límites de ancho. Un `bigint` hace perder la línea en silencio, `Buffer`, `Date`, `Map` y `Set` salen mal, y un objeto compartido entre ramas sale como `[circular]` | Límites de 50 elementos y 4096 caracteres; tratar `Buffer`, `bigint` y `Date`; marcar solo los ciclos reales |
| R8 | menor | `backend/tests/logs/request-id.test.js:100-111` | En los casos con `"}` y con tabulador, `not.toContain(valor)` sobre la línea cruda siempre pasa, porque `JSON.stringify` escapa el valor | Buscar sobre las líneas ya parseadas |
| R9 | menor | `backend/tests/logs/silencio.test.js` (2.º caso) | Dentro de `__capturar()` el logger nunca escribe en stdout: la aserción es verdadera por construcción | Comprobar el nivel efectivo en producción sin captura |
| R10 | menor | `backend/tests/logs/error-handler-caracterizacion.test.js:6,37` | Comentarios de antes de T022 y un espía de `console.error` que ya no sirve | Quitarlos |
| R11 | menor | `backend/src/services/email.service.js` | T025 borró el encabezado «RECUPERACIÓN DE CONTRASEÑA», sin relación con la spec | Restaurarlo |
| R12 | menor | `backend/src/utils/borrarArchivo.js:24` | La línea de log nueva no tiene prueba | Test con `EACCES` y `ENOENT` |
| R13 | menor | `backend/tests/logs/correlacion.test.js:192` | CA4 incluye «los de error y los de envíos»; solo se prueban los envíos con éxito | Caso con el proveedor fallando y `todas.every(request_id)` |
| R14 | menor | `backend/src/middlewares/registroPeticion.js:10` | `/health` va en `debug` y en producción no deja línea, aunque CA8 dice «toda petición». Lo decidió el plan (Observabilidad) | Aceptado: reflejarlo en la spec que toque CA8 |
| R15 | menor | `backend/tests/support/env.js` | `LOG_LEVEL=silent` solo se aplica si la variable no viene del shell | Forzarlo |
| R16 | menor | `backend/server.js` | No hay `unhandledRejection` ni `uncaughtException`: un error fuera de una petición lo imprime Node con `util.inspect`, incluidos `sql` y `sqlMessage`. Es previo a la spec | Aceptado → roadmap |
| R17 | menor | `backend/src/middlewares/errorHandler.js:85-86` | Un 4xx operacional registra el `message` de `AppError` tal cual. Hoy son literales, pero nada impide interpolar datos del usuario en uno nuevo | Aceptado → roadmap: regla en `AGENTS.md` o enmascarar valores |

## Preparación para release
- Rollback factible: sí. Solo cambia el backend, sin migraciones ni variables obligatorias (`LOG_LEVEL` es opcional). Basta con desplegar la imagen anterior, según `docs/deployment.md`.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Feature flags: el plan no pide ninguno.
- Docs actualizadas: `architecture.md` (T090) y `deployment.md` y `observability.md` (T091). OB2.a–OB4.b siguen «pendiente (resuelta por la spec 026, sin liberar)», una por una; OB1 y OB5, pendientes. Ninguna figura como mitigada antes de `/release`.
- SCA: sin críticas ni altas.

## Tareas añadidas
- T030 ← R1, R4, R6, R7 (test)
- T031 ← R2, R13 (test)
- T032 ← R3 (test)
- T033 ← R8, R9, R10
- T034 ← R5, R12 (test)
- T040 ← R1, R4, R6, R7
- T041 ← R2
- T042 ← R3
- T043 ← R5, R11, R12
- T044 ← R15

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-22:
- **R14** → roadmap: `/health` se registra en `debug` (decisión del plan); falta alinear el texto de CA8 en la próxima spec que lo toque.
- **R16** → roadmap: `server.js` sin manejadores de `unhandledRejection` ni `uncaughtException` que pasen por el logger (previo a la spec).
- **R17** → roadmap: regla de no interpolar datos del usuario en los mensajes de `AppError`, o enmascarar valores en el `message` de los 4xx operacionales.
