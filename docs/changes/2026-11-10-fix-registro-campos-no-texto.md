---
lane: fix
status: done                 # open → done → released · escalated (→ escalated_to)
base: 8d19798
relates: [001]
covers: [CA2]
escalated_to: null
---

# Fix: el registro acepta nombre, apellido o correo que no son texto

## Problema
`POST /api/v1/auth/register` con un `correo`, `nombre_usuario` o `apellido` que no es texto (un
objeto, una lista o un número) no se rechaza. En MySQL real, mysql2 expande un objeto o una lista
dentro de la consulta: la consulta falla con 500, o se guarda un valor distinto del enviado (una
lista de un elemento se convierte en ese texto). Debería responder 400 como cualquier campo
inválido (001 CA2). Detectado en la revisión ligera de la ficha
`2026-11-10-fix-cambiar-contrasena-tipos`.

## Reproducción
`backend/tests/auth/registro-login.test.js`, `001 CA2 · con <campo> que no es texto (<valor>)
responde 400 y no crea el usuario`: antes del arreglo, los 4 casos dan `Expected: 400, Received: 201`
(la base simulada no reproduce el error de mysql2, pero sí que el registro se acepta).

## Causa raíz
`register` solo comprueba que los campos no estén vacíos y valida el tipo de la contraseña
(`validarContrasena`), pero nunca el de nombre, apellido y correo. Un valor no vacío que no es
texto pasa directo a `findUserByEmail` y `createUser`, donde mysql2 lo convierte en SQL.

## Cambio
`backend/src/modules/auth/auth.service.js`: en `register`, tras comprobar los obligatorios, si
`nombre_usuario`, `apellido` o `correo` no son texto se responde 400 "Nombre, apellido y correo
deben ser texto", antes de cualquier consulta. Prueba nueva en
`backend/tests/auth/registro-login.test.js`. Commit `fix(fix-registro-campos-no-texto): rechazar
nombre, apellido o correo que no son texto en el registro`.

## Escalado
Al empezar y al cerrar, `lane-check` marca `seguridad?` por el nombre de `auth.service.js`. El
cambio solo rechaza entradas mal formadas antes de la base de datos; no toca sesión ni permisos.
Se mantiene en el carril (ver Decisiones).

## Verificación
- La prueba nueva falla con el arreglo revertido (4 fallos, `Received: 201`) y pasa con él.
- Suite del backend: 130 pasan, 5 pendientes (`todo`), 0 fallos. Un primer intento usó un correo
  fuera de `@example.test` y lo detectó la prueba de seguridad CA8; corregido.
- Lint del backend: los 4 errores previos; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes. Los endpoints públicos de auth ya validan el tipo. La prueba
  ahora también comprueba el mensaje (mejora menor). Hallazgos fuera de alcance en Decisiones.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | supuesto | ¿Escalar por tocar autenticación (`seguridad?`)? | Vía ligera, como en las correcciones del 2026-11-09 | usuario |
| 2026-11-10 | brecha | Mismo patrón con sesión iniciada (revisión ligera): `pacientes.service.js` `createPaciente` y `updatePerfil`, `comen.service.js` `createComentario`, y `fecha_agendada`/`id_servicio`/`motivo` en las citas del paciente | Fuera de esta ficha; se propone una ficha aparte | /fix |
| 2026-11-10 | brecha | El registro no normaliza el correo (sin `trim` ni minúsculas), a diferencia de la recuperación | Comportamiento previo; fuera de esta ficha | /fix |
