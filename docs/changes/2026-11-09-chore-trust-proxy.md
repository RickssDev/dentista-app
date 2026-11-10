---
lane: chore
status: done
base: 49cf01a
relates: []
covers: []
escalated_to: null
---

# Chore: TRUST_PROXY según el túnel

## Problema
`TRUST_PROXY=1` hacía que los limitadores vieran la IP del túnel y no la del cliente (RS4.a, RS4.b).

## Cambio
Producción cambiada a `TRUST_PROXY=2` por el usuario el 2026-11-09: el túnel apunta a `http://frontend:80`, comprobado en los logs de `cloudflared`. `backend/tests/seguridad/proxy.test.js` documenta el cálculo y `docs/deployment.md` recoge la cadena real y los comandos con `--env-file`.

## Escalado
`lane-check`: no escala.

## Verificación
El contenedor en producción devuelve `2` y queda `healthy` (usuario). Suite completa correcta.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

