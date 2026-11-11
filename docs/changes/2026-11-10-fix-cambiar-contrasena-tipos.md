---
lane: fix
status: released
released: v1.1.1 (2026-11-11)
base: 2ba6154
relates: [003]
covers: [CA8]
escalated_to: null
---

# Fix: cambiar contraseña con valores que no son texto responde 500

## Problema
`PUT /api/v1/auth/cambiarContrasena` con una `contrasena_actual` que no es texto (un número, un
objeto o una lista) responde 500 en lugar de rechazar la petición con 400 (003 CA8). Detectado en
la revisión ligera de la ficha `2026-11-09-fix-login-sin-contrasena` y anotado en el roadmap al
liberar v1.1.0.

## Reproducción
`backend/tests/auth/contrasenas.test.js`, `003 CA8 · una contraseña actual que es un número / un
objeto / una lista responde 400 y no se actualiza`: antes del arreglo, `Expected: 400, Received: 500`
en los tres casos.

## Causa raíz
`cambiarContrasena` solo comprueba que los campos no estén vacíos. Un valor no vacío que no es texto
pasa esa guarda y llega a `bcrypt.compare`, que lanza un error no operacional al recibir algo que no
es `string`; `errorHandler` lo convierte en 500. Las demás entradas a bcrypt (`login`, `register`,
`restablecerContrasena` y la contraseña nueva aquí) ya validan el tipo antes.

## Cambio
`backend/src/modules/auth/auth.service.js`: en `cambiarContrasena`, si `contrasena_actual` no es
texto se responde 400 "La contraseña actual es incorrecta", el mismo mensaje que con una contraseña
equivocada. Prueba nueva en `backend/tests/auth/contrasenas.test.js`. Commit
`fix(fix-cambiar-contrasena-tipos): rechazar contraseña actual que no es texto`.

## Escalado
Al empezar y al cerrar, `lane-check` marca `seguridad?` por el nombre de `auth.service.js`. El
cambio solo rechaza entradas mal formadas antes de bcrypt; no toca sesión, permisos ni rutas. Se
mantiene en el carril (ver Decisiones).

## Verificación
- La prueba nueva falla con el arreglo revertido (3 fallos) y pasa con él.
- Suite del backend: 103 pasan, 5 pendientes (`todo`), 0 fallos; línea base 100 + 5.
- Lint del backend: los 4 errores previos de siempre; los archivos tocados sin errores.
- Revisión ligera: sin bloqueantes. La causa explica el síntoma y el arreglo la ataca; los demás
  caminos a bcrypt están cubiertos. Un hallazgo menor aceptado y uno fuera de alcance (Decisiones).
- Liberada en v1.1.1 (2026-11-11), aprobada por el usuario. En producción: servicios arriba, `DELETE /api/v1/citas/1` responde 404 "Cannot DELETE", agendar, crear y cancelar funcionan y sin errores 500 en los logs.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-10 | supuesto | ¿Escalar por tocar autenticación (`seguridad?`)? | Vía ligera, como en las correcciones del 2026-11-09 | usuario |
| 2026-11-10 | supuesto | Con `contrasena_actual` no textual, un usuario inexistente o una cuenta de Google ya no reciben 404 / "usa Google", sino 400 genérico (revisión ligera) | Aceptado: solo afecta a entradas mal formadas y no revela nada nuevo | /fix |
| 2026-11-10 | brecha | En `register`, un `correo` que no es texto llega a `pool.query` y probablemente da 500 (revisión ligera) | Fuera de esta ficha; queda para una ficha nueva | /fix |
