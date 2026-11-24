---
lane: fix
status: released
released: v1.8.1 (2026-11-23)
base: 8472975
relates: [013]
covers: []
escalated_to: null
---

# Fix: la foto subida queda huérfana si falla el alta o la edición de una promoción

## Problema
En `POST /api/v1/promociones` y `PUT /api/v1/promociones/:id` con archivo, si la operación falla
(400 por campos faltantes o estado inválido, 404 o error del repositorio), la foto que multer ya
guardó queda en `uploads/` sin que ninguna promoción la use. La ruta de la imagen ya sale solo del
archivo subido: ese hueco no existe aquí. Detectado al corregir la galería (ficha
2026-11-23-fix-foto-huerfana-edicion-galeria).

## Reproducción
`backend/tests/promociones/imagen-promociones.test.js`: sin el arreglo fallan los 5 casos de error (`Number of calls: 0` para la foto subida); los 2 de comportamiento actual pasan.

## Causa raíz
multer escribe la foto antes de que el servicio valide, y `promo.service` no tenía limpieza ante errores.

## Cambio
- `promo.service.js`: helper `borrarSubidaSiFalla` envuelve el alta y la parte de la edición anterior al guardado; ante un error borra la foto subida y relanza. La anterior solo se borra tras guardar.
- `backend/tests/promociones/imagen-promociones.test.js` (nuevo): 7 casos.

## Escalado
`lane-check` sin motivos (1 archivo de código).

## Verificación
- `tests/promociones` 7/7; lint limpio en lo tocado.
- Review ligera (subagente): sin bloqueantes; revirtiendo el servicio (hash comprobado) fallan 5, restaurado 7/7. Menores de estilo aceptados: sangría del callback del alta y el nombre `exists`/`actual` en la edición.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | implícita | ¿Qué pasa con la foto subida si el alta o la edición fallan? | Se borra; nunca la que ya referencia la base | spec 029 TM3 y decisión del usuario /analyze A10 |
