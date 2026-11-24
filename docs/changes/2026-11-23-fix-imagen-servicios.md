---
lane: fix
status: done
base: 8d9a58b
relates: [012]
covers: []
escalated_to: null
---

# Fix: la imagen de un servicio puede apuntar a un archivo ajeno y deja fotos huérfanas

## Problema
En `POST /api/v1/servicios` y `PUT /api/v1/servicios/:id`, si no llega archivo, el controller deja pasar
`imagen` del cuerpo de la petición (`servicios.controller.js`). Alguien del personal puede apuntar un
servicio a cualquier archivo de `uploads/` (por ejemplo, la foto de perfil de un paciente) y, al
eliminar o cambiar la imagen del servicio, ese archivo se borra. Además, si el alta o la edición con
archivo fallan (400, 404 o error del repositorio), la foto subida queda en disco sin uso. Detectado
al corregir la galería (ficha 2026-11-23-fix-foto-huerfana-edicion-galeria; spec 029, A1 y A17).

## Reproducción
`backend/tests/servicios/imagen-servicios.test.js`, antes del arreglo: 6 de 9 fallan por el bug.
- La ruta del cuerpo se guarda: `expect(...imagen ?? null).toBeNull()` recibe `/uploads/foto-de-perfil-ajena.jpg`.
- La foto subida no se borra en el 400 por campos, el 400 por nombre repetido, el 404 ni el error del repositorio (`Number of calls: 0`).

## Causa raíz
El controller pasaba `req.body` tal cual al servicio y solo sobrescribía `imagen` cuando llegaba un
archivo, así que sin archivo valía la ruta que mandara el cliente. El servicio, además, no tenía
limpieza ante errores: multer ya escribió la foto antes de validar, y nadie la borraba si el alta
o la edición fallaban. Usuarios (spec 021) y galería (spec 029) ya tenían las dos protecciones;
servicios no.

## Cambio
- `backend/src/modules/servicios/servicios.controller.js`: `conImagenSubida` descarta `imagen` del
  cuerpo y solo la pone desde `req.file`, en el alta y en la edición.
- `backend/src/modules/servicios/servicios.service.js`: `createServicio` y la parte de
  `updateServicio` anterior al guardado van en `try/catch`. Ante un error borran `data.imagen` (que
  ya solo puede ser la subida) y lo relanzan. La foto anterior se borra solo tras un guardado
  correcto. Se ordena la sangría del bloque.
- `backend/tests/servicios/imagen-servicios.test.js` (nuevo): 9 casos.
- Commit `fix(fix-imagen-servicios): la imagen de un servicio solo sale del archivo subido y no queda huérfana`.

## Escalado
- Al empezar y al cerrar: `lane-check` sin motivos (2 archivos de código). El cambio corrige un
  defecto de seguridad sin tocar permisos, contratos ni datos. El usuario confirmó seguir en el
  carril (ver Decisiones).

## Verificación
- `tests/servicios` 9/9; backend completo 36 suites, 437 pasan y 5 `todo`; lint solo con el error previo.
- Review ligera (subagente): sin bloqueantes.
  - Revirtiendo los dos archivos de `src` (comprobado con hash), fallan los 6 casos del bug; restaurados, 9/9.
  - Confirma que no puede borrar nada ajeno ni la foto ya guardada.
  - El panel (`AdminServicios.jsx`) nunca manda `imagen` como texto, así que no le afecta.
  - No hay otros consumidores del servicio.
  - Hallazgos menores: la ficha incompleta (completada); posibles datos ya manipulados en producción (consulta de solo lectura → roadmap); y un 500 si falla la relectura final tras guardar (previo, no cambia).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | implícita | ¿De dónde debe salir la imagen de un servicio? | Solo del archivo subido en la petición, como usuarios (spec 021 CA1) y galería (spec 029 CA3) | `docs/specs/021-proteccion-cuentas-admin/spec.md`, `docs/specs/029-limite-galeria/spec.md` |
| 2026-11-23 | implícita | ¿Qué pasa con la foto subida si el alta o la edición fallan? | Se borra; nunca la que ya referencia la base | spec 029 TM3 y decisión del usuario /analyze A10 |
| 2026-11-23 | supuesto | ¿Corrige un defecto de seguridad en el carril ligero? | Sí: `lane-check` sin motivos, sin cambio de permisos, contratos ni datos; el mismo arreglo que usuarios y galería | usuario |
| 2026-11-23 | brecha | Review: si alguien aprovechó el defecto, algún `servicio.imagen` podría apuntar ya a un archivo ajeno | Revisar en producción con una consulta de solo lectura → roadmap | review ligera |
