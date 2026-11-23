---
id: 014
slug: galeria-imagenes
status: inferred
confidence: media
created: 2026-11-08
extends: []
---

# 014 · Galería

## Problema
La clínica muestra fotografías de sus instalaciones y su trabajo.

## Historias de usuario
- Como personal, quiero subir y ocultar imágenes de la galería.
- Como visitante, quiero ver la galería.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada un alta sin título, imagen o visibilidad, entonces responde 400.
- [ ] CA2 · Dada una imagen de más de 6 MB, entonces responde 400 con el mensaje del límite.
- [ ] CA3 · Dada una imagen eliminada o reemplazada, entonces el archivo anterior se borra del disco.
- [ ] CA4 · Dado un visitante, entonces `/imagenes/publicas` alimenta la página `/galeria`.
- [ ] CA5 · (abuso) Solo Administrador y Asistente escriben o consultan el listado completo.

## Fuera de alcance
- Álbumes.

## Seguridad y privacidad
- Datos sensibles involucrados: No aplica: imágenes públicas. Si muestran pacientes, requieren su consentimiento.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/images/*`, `backend/src/utils/upload.js`, `frontend/src/utils/validarImagen.js`, `frontend/src/pages/Gallery.jsx`, `frontend/src/pages/admin/Admingaleria.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- El límite de 6 MB coincide en backend y frontend; `errorHandler.js` lo traduce correctamente a 400 (comprobado al ejecutarlo el 2026-11-08).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-23 | Corregido por la ficha 2026-11-23-hotfix-limite-subida-nginx en v1.7.1 (CA2) | /release |
| 2026-11-23 | Comportamiento modificado por 029 en v1.8.0: máximo 15 imágenes en el alta, la imagen solo del archivo subido y borrado de la foto en los rechazos | /release |
