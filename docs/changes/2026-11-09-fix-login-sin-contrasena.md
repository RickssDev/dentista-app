---
lane: fix
status: done
base: 49cf01a
relates: [001]
covers: [CA6]
escalated_to: null
---

# Fix: login sin contraseña responde 500

## Problema
Un inicio de sesión sin contraseña o con un valor que no es texto responde 500 en lugar de rechazar las credenciales (001 CA6).

## Reproducción
`backend/tests/auth/registro-login.test.js`, `001 CA6 · un login sin contraseña responde 401`: antes del arreglo, `Expected: 401, Received: 500`.

## Causa raíz
`login` pasa `contrasena` a `bcrypt.compare` sin validar su tipo; con `undefined` bcrypt lanza un error no operacional y `errorHandler` responde 500.

## Cambio
Validación del tipo de `correo` y `contrasena` al inicio de `exports.login`, con la misma respuesta 401 genérica.

## Escalado
`lane-check` marca sospecha de seguridad por el nombre del archivo. Se mantiene en el carril por decisión del usuario.

## Verificación
La prueba falla sin el arreglo y pasa con él. Suite completa, lint y build correctos. Revisión ligera sin bloqueantes.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | supuesto | ¿Escalar por tocar autenticación? | Vía ligera para todas las correcciones | usuario |
| 2026-11-09 | supuesto | `cambiarContrasena` tiene el mismo patrón con tipos inválidos (revisión ligera) | Queda como deuda; no se pidió aquí | /fix |
