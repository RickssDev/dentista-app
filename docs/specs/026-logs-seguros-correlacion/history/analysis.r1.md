---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 5164929af09d
plan_sha: 19474d3c97e5
tasks_sha: 89371d32af28
---

# Análisis · 026 Logs seguros y correlación por petición

## Resumen
`fail` por cinco hallazgos ALTOS, que obligarían a rehacer trabajo en `/implement`:
- la pila de un 5xx está en dos sitios distintos entre spec, plan y tareas (A1);
- unas pruebas existentes de OB6 quedarían vacías (A2);
- las pruebas pueden pasar sin capturar ninguna línea (A3);
- un caso de T011 es imposible de enviar (A4);
- hay una vía de fuga por errores de parseo sin amenaza en el modelo (A5).

Además, la regla de reemplazo ocultaría `error_name` (A6). No hay críticos ni violaciones de la
constitución. Lo hizo un subagente independiente; cada hallazgo se comprobó contra el código.

Conteo: CRÍTICA 0 · ALTA 6 · MEDIA 6 · BAJA 9

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 12 / 12 (CA3, CA4, CA8 y CA11 con test incompleto: A4, A9, A1, A8) |
| Amenazas con control y test | 10 / 10 (falta una amenaza: A5) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Inconsistencia | ALTA | spec CA8; plan → Observabilidad; T012, T021 | La spec y T012 ponen la pila del 5xx en la línea «Petición atendida». El plan la pone en otra línea de `errorHandler`. T021 debe pasar CA8 sin depender de T022 | Un 5xx deja exactamente una línea «Petición atendida» con nivel `error` y `stack`, y ninguna otra línea con `stack`. Un 4xx deja una sola línea, `warn` y sin `stack` (test: T012). Orden de T021 y T022 coherente → `/plan --fix`, `/tasks --fix` |
| A2 | Cobertura | ALTA | `backend/tests/services/recordatorios.test.js:34,58,70-72`; plan → Riesgos; T023, T024 | Las pruebas de OB6.a espían `console.log`. Tras la migración, las de «encendido» fallan y las de «apagado» pasan sin comprobar nada | Con WhatsApp apagado, ninguna línea capturada dice «enviado». Encendido, hay una línea de aviso con `id_cita` y `plantilla` (test: `recordatorios.test.js` migrado a la captura). Hace falta una tarea que lo haga → `/tasks --fix` |
| A3 | Cobertura | ALTA | T002, T011 (CA12), T013; plan → Estrategia de pruebas | Con `LOG_LEVEL=silent`, la captura puede quedar vacía: T013 pasaría con cero líneas, y el destino que lanza de CA12 nunca se invocaría en `/health` (`debug`) | Cada prueba de `tests/logs/` comprueba que existen las líneas esperadas (por `msg`, con número > 0) antes de comprobar que faltan los centinelas. En CA12, que el destino que lanza se invocó al menos una vez → `/plan --fix`, `/tasks --fix` |
| A4 | Ambigüedad | ALTA | T011 («con `\n`»); plan → Estrategia de pruebas | El cliente HTTP de Node no envía `\n` en una cabecera (`ERR_INVALID_CHAR`, comprobado). El caso no se puede probar por HTTP | `\n` y `\r` se prueban sobre el validador. Por HTTP van valores que Node sí transmite (`"}`, tabulador, 65 caracteres) (test: T011) → `/tasks --fix` |
| A5 | Seguridad | ALTA | plan → Cambios por módulo (`errorHandler`), Modelo de amenazas; T013 | Un JSON mal formado da un `SyntaxError` 400 con `err.body` crudo, y su `message` puede incluir un fragmento del cuerpo. Ninguna amenaza ni regla lo cubre | Un cuerpo mal formado con centinelas no deja ninguno en lo capturado. Se define qué se registra de un 4xx no operacional (test: T013). Hace falta una amenaza nueva en el modelo → `/plan --fix`, `/tasks --fix` |
| A6 | Inconsistencia | ALTA | plan → Contratos y datos (reemplazo) | `name` oculta toda clave que lo contenga, incluida `error_name`, que el plan dice conservar | `error_name` se conserva y `name` y `nombre_usuario` se ocultan (test: T010) → `/plan --fix`, `/tasks --fix` |
| A7 | Cobertura | MEDIA | T011, T012; `backend/tests/support/fake-db.js` | La base simulada solo cubre el SQL de auth: `servicios/publicos` da 500, y una ruta añadida después de `createApp()` salta `errorHandler` | Cada tarea dice cómo obtiene cada estado (repositorios simulados con `jest.mock`, o una ruta de prueba que pasa por `errorHandler`) → `/tasks --fix` |
| A8 | Cobertura | MEDIA | spec CA11; T013, T024 | Ningún test comprueba `id_cita` en los avisos ni `id_proveedor` y `tipo` en el correo enviado | T013 los exige → `/tasks --fix` |
| A9 | Cobertura | MEDIA | spec CA4; T012 | CA4 solo se prueba con WhatsApp, no con correo | T012 añade un flujo de correo con el mismo `request_id` → `/tasks --fix` |
| A10 | Ambigüedad | MEDIA | T028 («solo los 5 previos») | Hoy hay 4 errores de lint: dos en `errorHandler.js` (que T022 reescribe), uno en `faqs.service.js` y uno en `images.service.js` | Ningún error fuera de `faqs.service.js:4` e `images.service.js:20` (test: `npm run lint` en T028) → `/tasks --fix` |
| A11 | Inconsistencia | MEDIA | `docs/observability.md` → Logs; plan → Contratos; ADR 0011; T091 | El documento usa `timestamp`, `actor_id` y `message`. El plan y el ADR usan `time`, `user_id` y `msg` | Un solo juego de nombres en plan, ADR y T091 → `/plan --fix`, `/tasks --fix` |
| A12 | Duplicación y conflicto | MEDIA | plan → Decisiones (coordinación con 025) | La 025 también edita `docs/architecture.md` y la verificación post-deploy de `docs/deployment.md`. «No comparte archivos» es falso para los docs | Corregir la nota y fijar el orden de fusión → decisión del usuario, después `/plan --fix` |
| A13 | Inconsistencia | BAJA | plan → Estrategia de pruebas (lint); T014 | El plan habla de un «archivo temporal» y T014 usa `lintText` | Unificar con T014 → `/plan --fix` |
| A14 | Cobertura | BAJA | `docs/roadmap.md`, `docs/architecture.md` → deuda; T090 | La deuda de la duplicación de `errorHandler.js` no se retira | T090 la retira → `/tasks --fix` |
| A15 | Inconsistencia | BAJA | plan → Decisiones («mitigadas al liberar»); T091 | T091 las marca mitigadas antes de la aprobación a producción | T091 las marca «implementada (spec 026)» y T098 las pasa a «mitigada (vX)» → `/tasks --fix` |
| A16 | Cobertura | BAJA | `backend/tests/usuarios/rutas-usuarios.test.js:64` | Las comprobaciones de privacidad sobre espías de `console` quedan vacías tras la migración | Pasarlas a la captura del logger → `/tasks --fix` |
| A17 | Ambigüedad | BAJA | T012, T013; `citas.service.js` (`createCita`, `createCitaPaciente`) | El aviso «de confirmación» se envía al crear la cita, y hay dos entradas: personal y paciente | Hablar de «crear cita» y cubrir las dos entradas → `/tasks --fix` |
| A18 | Ambigüedad | BAJA | T001; `errorHandler.js:155,165` | El `module.exports` interno se reasigna en la primera llamada. Con `NODE_ENV=production`, `createApp()` exige `FRONTEND_URL` | T001 toma la referencia una vez y define `FRONTEND_URL` → `/tasks --fix` |
| A19 | Ambigüedad | BAJA | spec → Problema | «Atiende OB1 y OB5 parcialmente (no cubre ninguna)» se contradice | → spec (redacción, sin cambio de alcance) |
| A20 | Ambigüedad | BAJA | spec → Decisiones (supuestos) | Formato 8–64, `/health` en `debug` y solo `user_id` tienen como fuente al agente | → decisión del usuario |
| A21 | Ambigüedad | BAJA | plan → Contratos (`LOG_LEVEL`) | Nada impide `LOG_LEVEL=silent` en producción, que apagaría todos los logs | → decisión del usuario, después `/plan --fix` (test: T010) |

## Decisiones pendientes del usuario
Resueltas por el usuario el 2026-11-22:
- A12: se fusiona primero la que termine antes; la otra se rebasa sobre `main` antes de su T090 y T091.
- A20: confirma los tres supuestos (formato 8–64, `/health` en `debug`, solo `user_id`).
- A21: `LOG_LEVEL=silent` se ignora con `NODE_ENV=production`; el piso sigue siendo `info`.

## Aceptados
Aceptados por el usuario el 2026-11-22:
- **A19** → spec: redacción del Problema, sin cambio de alcance (se corrige junto con las filas de A20 en «Decisiones»)
- **A20** → spec: filas de «Decisiones» con fuente `usuario` (/analyze A20)
