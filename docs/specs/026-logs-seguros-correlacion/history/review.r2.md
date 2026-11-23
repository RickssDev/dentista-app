---
spec: 026-logs-seguros-correlacion
verdict: changes_requested
round: 2
date: 2026-11-22
base: 75afdf6
head: 59318ce
human_signoff: pending
---

# Review · 026 Logs seguros y correlación por petición

## Resumen
Ronda 2 (`--rerun`), del `head` de la ronda 1 a `59318ce`. Los 14 hallazgos abiertos (R1–R13 y
R15) están corregidos y probados. Aparecen 6 menores nuevos, sin bloqueantes ni importantes. El
usuario decidió corregir R18, R20, R22 y R23 antes de liberar; R19 y R21 quedan aceptados y van al
roadmap. R14, R16 y R17 siguen aceptados desde la ronda 1.
Conteo: bloqueante 0 · importante 0 · menor 6

Revisor único con contexto limpio (`opus`), con los encargos A, C+D y S sobre
`.ai/cache/review/026-logs-seguros-correlacion/`: code.diff de 32 KB, rango `75afdf6..59318ce`.

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (dos corridas) | ✅ backend: 32 suites, 387 pruebas y 5 `todo`; frontend: 24 archivos y 220 pruebas, en las dos corridas. El fallo único sin identificar que registró T092 no se repitió (27 corridas en total) |
| `npm run lint --prefix backend` | ✅ solo los 2 errores previos |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1, CA2, CA5, CA6 | sin cambios desde la ronda 1 | ✅ | |
| CA3 | `tests/logs/request-id.test.js` | ✅ | R8 corregido |
| CA4 | `tests/logs/correlacion.test.js` | ✅ | R13 corregido |
| CA7 | `tests/logs/silencio.test.js`, `tests/logs/logger.test.js` | ✅ | R9 corregido |
| CA8 | `tests/logs/correlacion.test.js` | ✅ | R2 corregido; el caso abortado corta cuando la petición ya llegó, no por tiempo |
| CA9 | `tests/logs/sin-datos.test.js`, `tests/logs/logger.test.js` | ⚠ | R1 y R5 corregidos; el filtro de marcos todavía se puede eludir (R18) |
| CA10 | `tests/logs/logger.test.js` | ⚠ | R4 corregido; la prueba de claves conservadas no cubre todas las que se usan (R20) |
| CA11 | `tests/services/recordatorios.test.js` | ⚠ | R3 corregido; falta fijar que el cron se detiene tras el fallo al marcar (R23) |
| CA12 | `tests/logs/logger.test.js` | ✅ | R6 corregido |

## Conformidad con el plan
- Cambios fuera del plan: ninguno. Los 14 archivos de código del rango tienen tarea (`scope.md`).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1–P20 | ✅ sin violaciones | Sin dependencias nuevas (`deps.stat` vacío) |
| P2 (código tocado con test) | ✅ | R12 corregido: `borrarArchivo` y `db.js` tienen prueba |
| P15 (sin datos sensibles en logs) | ✅ con un hueco menor | R18 |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos: gitleaks v8.21.2 sobre `git log -p 49825d5..HEAD` | ✅ 0 hallazgos |
| SAST | ➖ no aplica (decisión del usuario, 2026-11-08) |
| SCA: `npm audit --audit-level=high` | ✅ backend sin críticas ni altas (20 medias, de desarrollo y previas); frontend 0 |
| Contenedores: trivy | ➖ no se ejecutó en local, porque no está instalado; corre en CI. El diff no toca Dockerfiles ni compose |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A02 Configuración | ✅ | Sin cambios en rutas protegidas |
| A03 Cadena de suministro | ✅ | Sin cambios en lockfiles |
| A04 Datos sensibles | ⚠ | R1, R4 y R5 corregidos. Quedan R18 (eludir el filtro de marcos) y R19 (host de la base en errores de red, que no es dato personal) |
| A06 Diseño inseguro | ✅ | Los controles TM1–TM11 siguen con su test |
| A09 Registro y alertas | ✅ | R2 y R3 corregidos: la petición abortada y el servicio que falló quedan registrados como lo que son |
| A10 Errores y condiciones excepcionales | ✅ | R6 y R7 corregidos; restos menores en R21 |
| A01, A05, A07, A08, SSRF | ➖ | Sin cambios respecto de la ronda 1 |

## Observabilidad
- Eventos de auditoría de la spec: no aplica (OB1 queda para las specs 027 y 028).
- Datos sensibles en logs del código tocado: ninguno en los llamadores actuales; huecos de defensa en R18 y R19.
- `request_id` presente en los logs nuevos: sí. «Recordatorio no marcado» lleva `job_id`, y «Aviso de WhatsApp no preparado», el `request_id` de la petición.

## Seguimiento de la ronda 1
| ID | Estado | Evidencia |
|---|---|---|
| R1 | corregido (efecto nuevo → R18) | `logger.js:70` conserva solo `/^\s+at /`; `logger.test.js` con centinela de varias líneas |
| R2 | corregido | `registroPeticion.js`: `!res.writableFinished` deja `aborted`, `status: null` y `warn`; la prueba falla con el código anterior |
| R3 | corregido | `citas.service.js:31-39` (`enviarAviso`), `avisoNoPreparado` en las 4 llamadas; `reminder.service.js:52-57` |
| R4 | corregido (efecto nuevo → R20) | `logger.js:16-21,41`; ninguna clave de contexto actual queda oculta |
| R5 | corregido (mismo patrón en otros logs → R19) | `config/db.js:20-24` |
| R6 | corregido | `logger.js:29-33`; sin el oyente, la prueba falla |
| R7 | corregido (restos → R21) | `logger.js:94-122` |
| R8, R9, R10, R11, R12, R13, R15 | corregido | Ver `history/review.r1.md` y las notas de T033, T034, T043 y T044 |

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R18 | menor | `backend/src/utils/logger.js:70` | Si el valor citado en un mensaje de MySQL lleva `\n    at …`, esa línea pasa el filtro como si fuera un marco. El revisor lo comprobó con un correo en el valor duplicado. TM6 se puede eludir, aunque hace falta un valor del usuario con salto de línea | Quitar del `stack` el prefijo exacto `${name}: ${message}` antes de tomar los marcos; probarlo con `\n    at centinela` |
| R19 | menor | `backend/src/services/reminder.service.js:55`, `backend/src/modules/citas/citas.service.js:26` | «Recordatorio no marcado» y «Aviso de WhatsApp no preparado» usan `resumirError`: en un error de red de mysql2 sin `sqlState` salen `message` y `stack`, con el host y el puerto de la base. No son datos personales | Aceptado → roadmap |
| R20 | menor | `backend/tests/logs/logger.test.js:512,521-527` | La lista `conservadas` no incluye claves que se emiten hoy (`id_proveedor`, `duration_ms`, `revisadas`, `enviadas`, `errno`, `stack`, `message`, `aborted`, `code`, `error`, `port`). Un término nuevo demasiado amplio las ocultaría sin que falle nada | Añadir todas las claves de contexto que emite `src` |
| R21 | menor | `backend/src/utils/logger.js:100,114-117` | `Map` y `Set` salen como `{}`; los objetos no tienen tope de claves; un `Error` anidado no pasa por el recorte de texto | Aceptado → roadmap |
| R22 | menor | `backend/tests/services/recordatorios.test.js:727` | `marcarRecordatorioEnviado.mockRejectedValue` no se deshace: `restoreAllMocks` no restaura los `jest.fn` del automock y `clearAllMocks` no borra implementaciones, así que el resultado depende del orden | `mockRejectedValueOnce` |
| R23 | menor | `backend/tests/services/recordatorios.test.js:725-740`; `backend/src/services/reminder.service.js:56` | El `break` conserva el flujo de antes, pero ninguna prueba lo fija: con una sola cita, nada comprueba que la segunda no se envíe ni que «fin de ejecución» siga saliendo | Caso con dos citas |

## Preparación para release
- Rollback factible: sí. Solo cambia el backend, sin migraciones; basta con la imagen anterior, según `docs/deployment.md`.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Docs actualizadas: sin cambios desde la ronda 1. OB2.a–OB4.b siguen «pendiente (resuelta por la spec 026, sin liberar)».
- SCA: sin críticas ni altas.

## Tareas añadidas
- T035 ← R18, R20 (test)
- T036 ← R22, R23 (test)
- T045 ← R18

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-22:
- **R14** → roadmap: `/health` se registra en `debug` (decisión del plan); falta alinear el texto de CA8 en la próxima spec que lo toque.
- **R16** → roadmap: `server.js` sin manejadores de `unhandledRejection` ni `uncaughtException` que pasen por el logger (previo a la spec).
- **R17** → roadmap: regla de no interpolar datos del usuario en los mensajes de `AppError`, o enmascarar valores en el `message` de los 4xx operacionales.
- **R19** → roadmap: `resumirError` conserva `message` y `stack` de los errores de red de la base (host y puerto) en «Recordatorio no marcado» y «Aviso de WhatsApp no preparado».
- **R21** → roadmap: `redactar` sin tratamiento de `Map` y `Set`, sin tope de claves por objeto y sin recorte del `Error` anidado.
