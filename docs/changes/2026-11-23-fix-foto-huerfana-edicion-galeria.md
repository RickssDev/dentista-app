---
lane: fix
status: done
base: a8e1ddf
relates: [014, 029]
covers: []
escalated_to: null
---

# Fix: la foto nueva queda huérfana si falla la edición de una imagen de la galería

## Problema
Un `PUT /api/v1/imagenes/:id` con archivo nuevo que falla (404 imagen no encontrada o error del
repositorio al guardar; el 400 «No hay campos» no es alcanzable con archivo) deja la foto subida en `uploads/` sin que ninguna imagen la use.
Deuda 029/R9 del roadmap (review de la spec 029, 2026-11-23). Es el mismo defecto que la spec 029
corrigió en el alta (TM3), pero en la edición.

## Reproducción
`backend/tests/galeria/rutas-galeria.test.js` → «fix · PUT con archivo nuevo que falla», antes del arreglo:
`× imagen inexistente (404): se borra la foto subida — Expected: "/uploads/subida-q29.jpg", Number of calls: 0`
y lo mismo en «error del repositorio al guardar». El tercer caso (sin archivo, no se borra nada) pasa antes y después.

## Causa raíz
multer escribe la foto en disco antes de que el servicio valide nada. `updateImagen` solo gestionaba
archivos en el camino feliz (borrar la foto anterior tras guardar). Si lanzaba un 404 o fallaba el
repositorio, la foto nueva quedaba sin referencia. La spec 029 dio ese manejo al alta (TM3) y no a
la edición.

## Cambio
- `backend/src/modules/images/images.service.js`: `updateImagen` envuelve la lectura, la validación
  y el guardado en `try/catch`. Ante un error borra `data.imagen` y lo relanza: por el controller de
  la spec 029, `data.imagen` solo puede venir de `req.file`. Lo posterior al guardado (borrar la foto
  anterior y releer) queda fuera, así que nunca se borra una foto que la base ya referencia. Se
  corrige la sangría de la línea siguiente del bloque.
- `backend/tests/galeria/rutas-galeria.test.js`: tres casos (404 y error del repositorio con archivo, y sin archivo).
- Commit `fix(fix-foto-huerfana-edicion-galeria): borrar la foto subida si falla la edición`.

## Escalado
- Al empezar: `lane-check` sin motivos (1 archivo de código).
- Al cerrar: sin motivos (1 de código, 1 de tests y la ficha).

## Verificación
- Tests: `tests/galeria` 39/39; backend completo 35 suites, 428 pasan y 5 `todo` (línea base 425).
- Lint: solo el error previo de `faqs.service.js`.
- Review ligera (subagente): sin bloqueantes.
  - Revirtiendo solo `images.service.js` (comprobado con hash), fallan los dos casos con archivo; restaurado, pasan.
  - Confirma que no puede borrar algo ajeno, por el filtro del controller y por `borrarArchivo` limitado a `uploads/`.
  - Confirma que tampoco borra después de guardar.
  - Hallazgos menores: la mención del 400 en el Problema (corregida), la sangría (corregida), la carrera entre leer y guardar (aceptada, ver Decisiones) y un caso inverso en usuarios (va a la ficha de los otros módulos).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | implícita | ¿Qué debe pasar con la foto subida si la edición falla? | Se borra, como en el alta: ninguna imagen la usa | síntoma; spec 029 TM3 y decisión del usuario /analyze A10 (borrar en todo rechazo) |
| 2026-11-23 | supuesto | Review: si la fila se borra entre la lectura y el guardado, el `UPDATE` afecta 0 filas sin error y la foto nueva queda huérfana | Aceptado: carrera muy improbable con dos roles del personal y anterior a este fix | review ligera |
| 2026-11-23 | brecha | El mismo defecto está en servicios y promociones (y en servicios, además, la ruta llega del cuerpo); usuarios borra la foto también si falla la lectura posterior al guardado | Fichas `/fix` aparte, una por módulo | usuario |
