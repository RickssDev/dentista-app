---
spec: 026-logs-seguros-correlacion
verdict: approved
round: 3
date: 2026-11-22
base: 59318ce
head: a8b25b9
human_signoff: pending
---

# Review · 026 Logs seguros y correlación por petición

## Resumen
Ronda 3 (`--rerun`), de `59318ce` a `a8b25b9`. R18, R20, R22 y R23 están corregidos y probados, y
no aparecen hallazgos nuevos. Sin bloqueantes ni importantes: el veredicto es `approved`. La
definición de terminado de la constitución pide que una persona revise el cambio, así que
`human_signoff` queda `pending` hasta que el usuario lo confirme.
Conteo: bloqueante 0 · importante 0 · menor 0

El code.diff ocupa 4.7 KB (`logger.js`, `logger.test.js`, `recordatorios.test.js`), por debajo de
~30 KB. Por eso la revisión se hizo sin subagente, releyendo los archivos desde cero (modo
`--rerun`).

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (dos corridas) | ✅ backend: 32 suites, 389 pruebas y 5 `todo`; frontend: 24 archivos y 220 pruebas, en las dos |
| `npm run lint --prefix backend` | ✅ solo los 2 errores previos (`faqs.service.js:4`, `images.service.js:20`) |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1–CA8, CA12 | sin cambios desde la ronda 2 | ✅ | |
| CA9 | `tests/logs/logger.test.js` («R18 un valor con forma de marco…») | ✅ | R18 corregido |
| CA10 | `tests/logs/logger.test.js` («las claves técnicas se conservan») | ✅ | R20 corregido; la lista cubre las 19 claves que emite `src` |
| CA11 | `tests/services/recordatorios.test.js` («tras el fallo al marcar, la ejecución se detiene…») | ✅ | R22 y R23 corregidos |

## Conformidad con el plan
- Cambios fuera del plan: ninguno. Los 3 archivos del rango tienen tarea: T035, T036 y T045.
- Partes del plan sin implementar: ninguna. Las 32 tareas de trabajo están hechas.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1–P20 | ✅ sin violaciones | Sin dependencias nuevas (`deps.stat` vacío) |
| P15 (sin datos sensibles en logs) | ✅ | `resumirError` quita el mensaje entero antes de tomar los marcos (`logger.js:71-75`) |
| P5 (producción con aprobación humana) | ➖ | Corresponde a `/release` (T096) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos: gitleaks v8.21.2 sobre `git log -p 49825d5..HEAD` | ✅ 0 hallazgos |
| SAST | ➖ no aplica (decisión del usuario, 2026-11-08) |
| SCA: `npm audit --audit-level=high` | ✅ backend sin críticas ni altas (20 medias, de desarrollo y previas); frontend 0 |
| Contenedores: trivy | ➖ no se ejecutó en local, porque no está instalado; corre en CI. El diff no toca Dockerfiles ni compose |

| Tema OWASP (Top 10:2025) | Resultado | Evidencia |
|---|---|---|
| A04 Datos sensibles | ✅ | R18 corregido: el valor citado ya no puede imitar un marco. Quedan R19 y R21, aceptados |
| A09 Registro y alertas | ✅ | El corte del cron tras «Recordatorio no marcado» queda fijado por una prueba |
| Resto | ➖ | Sin cambios respecto de la ronda 2 |

Nota de la revisión, sin hallazgo: si el `message` de un error de MySQL se reasignara después de
construirlo, `indexOf` no lo encontraría y se volvería al filtro de marcos de R1. mysql2 no lo
hace, y el caso sigue sin dejar el texto del mensaje en la primera línea.

## Observabilidad
- Eventos de auditoría de la spec: no aplica (OB1 queda para las specs 027 y 028).
- Datos sensibles en logs del código tocado: ninguno. Los huecos de defensa restantes (R19, R21) están aceptados y van al roadmap.
- `request_id` presente en los logs nuevos: sí; `job_id` en el cron.

## Seguimiento de la ronda 2
| ID | Estado | Evidencia |
|---|---|---|
| R18 | corregido | `logger.js:71-75` corta el `stack` tras el `message` y luego filtra `/^\s+at /`; la prueba con `\n    at centinela-de-marco` falla sin el corte (nota de T045) |
| R20 | corregido | `logger.test.js`: `conservadas` con las 19 claves de `src`; falla si se añaden términos amplios (nota de T035) |
| R22 | corregido | `recordatorios.test.js:111,129` usan `mockRejectedValueOnce`; `getPacienteWhatsApp` se reinicia en `beforeEach` (línea 40) |
| R23 | corregido | Caso con dos citas: un envío, «Recordatorio no marcado» de la primera y «fin de ejecución» con `revisadas: 1, enviadas: 1`; falla sin el `break` (nota de T036) |

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|

Sin hallazgos nuevos en esta ronda.

## Preparación para release
- Rollback factible: sí. Solo cambia el backend, sin migraciones ni variables obligatorias (`LOG_LEVEL` es opcional). Basta con desplegar la imagen anterior, según `docs/deployment.md`.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Feature flags: el plan no pide ninguno.
- Docs actualizadas: `architecture.md` (T090), y `deployment.md` y `observability.md` (T091). OB2.a–OB4.b siguen «pendiente (resuelta por la spec 026, sin liberar)», una por una, y `/release` las pasa a mitigadas (T098).
- SCA: sin críticas ni altas.

## Tareas añadidas
Ninguna en esta ronda.

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-22:
- **R14** → roadmap: `/health` se registra en `debug` (decisión del plan); falta alinear el texto de CA8 en la próxima spec que lo toque.
- **R16** → roadmap: `server.js` sin manejadores de `unhandledRejection` ni `uncaughtException` que pasen por el logger (previo a la spec).
- **R17** → roadmap: regla de no interpolar datos del usuario en los mensajes de `AppError`, o enmascarar valores en el `message` de los 4xx operacionales.
- **R19** → roadmap: `resumirError` conserva `message` y `stack` de los errores de red de la base (host y puerto) en «Recordatorio no marcado» y «Aviso de WhatsApp no preparado».
- **R21** → roadmap: `redactar` sin tratamiento de `Map` y `Set`, sin tope de claves por objeto y sin recorte del `Error` anidado.
