---
id: 0011
status: accepted
date: 2026-11-22
---

# ADR 0011 · Logger JSON propio y contexto por petición

## Contexto
El backend registra con unas 30 llamadas a `console.*` en texto libre: sin niveles, sin forma de
relacionar los mensajes de una petición, y algunas imprimen teléfonos, correos o enlaces de
recuperación (OB2, OB3, OB4 de `docs/observability.md`). La constitución exige logs sin datos
sensibles (P15) y `X-Request-Id` en cada log (P14). Cada dependencia de producción nueva amplía la
superficie sobre datos de salud (P3). Spec 026.

## Decisión
- Un módulo propio, `backend/src/utils/logger.js`, sin dependencias. Escribe una línea JSON por
  mensaje en stdout (`timestamp`, `level`, `message`, `request_id` o `job_id`, `actor_id`, `context`, los nombres de `docs/observability.md`), con
  niveles `debug`/`info`/`warn`/`error`, piso `info` en producción y reemplazo por nombre de los
  campos sensibles. El mismo formato en todos los entornos.
- Contexto por petición y por trabajo con `AsyncLocalStorage` de `node:async_hooks`
  (`backend/src/utils/contexto.js`). Lo abre el middleware `requestId` y el cron en cada ejecución.
  El logger lo lee al escribir.
- Ningún código de `backend/src` usa `console.*` fuera del logger (regla de ESLint `no-console`).

## Alternativas consideradas
- `pino` — es rápido y conocido, pero su redacción solo cubre rutas fijas de campos, así que el
  reemplazo por nombre a cualquier profundidad igual necesitaría código propio. Además añade una
  dependencia de producción. Se descartó (decisión del usuario, 2026-11-22).
- `winston` — más pesado y con más dependencias transitivas, por la misma razón.
- Pasar `req` o el identificador por parámetro — obliga a cambiar las firmas de los servicios de
  WhatsApp, correo y citas, y se pierde en cualquier llamada que no lo propague.
- Texto legible en local y JSON en producción — dos formatos que mantener y que probar. Se descartó
  (decisión del usuario, 2026-11-22).

## Consecuencias
- Sin cambios en la cadena de suministro. El mantenimiento del logger (~80 líneas) es del proyecto.
- En la consola de desarrollo los logs son JSON, menos cómodos de leer. Se pueden filtrar con `jq`.
- Toda llamada de log nueva pasa por el logger y su redactor. `/review` revisa que los mensajes sean
  literales y que los datos vayan en `context`.
- Si en el futuro se necesitan transportes (envío a un agregador), se reevalúa `pino` con un ADR
  nuevo que reemplace este.
