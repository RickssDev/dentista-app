---
lane: hotfix
status: released
released: v1.7.1 (2026-11-23)
base: 03542f4
relates: [014]
covers: [CA2]
escalated_to: null
---

# Hotfix: nginx rechaza imágenes de más de 1 MB

## Problema
En producción, subir una imagen de más de 1 MB (galería y cualquier otro formulario con imagen)
falla, aunque el límite de la aplicación es 6 MB (`backend/src/utils/upload.js`,
`frontend/src/utils/validarImagen.js`; spec 014, CA2). Reportado por el usuario el 2026-11-23.

## Reproducción
- `frontend/tests/subida-nginx.test.js` (vitest, lee `nginx.conf`), antes del arreglo:
  `× /api/ fija client_max_body_size — AssertionError: expected undefined to be defined` (3 de 4 en rojo).
- `frontend/scripts/probar-nginx.mjs` (nginx real en Docker), comprobación nueva:
  `✘ /api/ con una imagen de 6 MB → 502 sin backend (nginx no la corta) — respondió 413, se esperaba 502`.

## Causa raíz
En producción las peticiones siguen Cloudflare → Caddy → nginx del contenedor `frontend` → Express.
`frontend/nginx.conf` nunca fijó `client_max_body_size`, así que nginx aplica su valor por defecto
de 1 MB y responde 413 a cualquier formulario más grande, antes de que Express aplique su propio
límite de 6 MB (multer) y su mensaje. Caddy no limita el cuerpo por defecto y Cloudflare admite más.

Por qué antes sí funcionaba con 6 MB: **no determinado**. El repositorio nunca tuvo esta directiva
(`git log -S client_max_body_size`) y el Caddyfile no ha cambiado desde el 2026-11-05. La causa
probable es algo fuera del repo, en el servidor: un parche local, el destino del túnel o pruebas
hechas solo en local con Vite, sin nginx.

## Cambio
- `frontend/nginx.conf`: `client_max_body_size 7m;` solo en `location ^~ /api/` (6 MB de imagen más
  los campos del formulario). El resto del sitio conserva 1 MB.
- `frontend/tests/subida-nginx.test.js`: límite presente en `/api/`, mayor que `MAX_IMAGEN_BYTES`,
  no mayor de 8 MB y ausente fuera de `/api/`.
- `frontend/scripts/probar-nginx.mjs`: imagen de 6 MB por `/api/` → 502 sin backend (no 413), y
  cuerpo de 7,5 MB → 413.
- Commit `fix(hotfix-limite-subida-nginx): nginx admite imágenes de hasta 6 MB en /api/`.

## Escalado
- Al empezar: `lane-check` → escalar por `seguridad: rutas protegidas` (`frontend/nginx.conf`).
  El usuario aceptó seguir en el carril (ver Decisiones).
- Al cerrar: el mismo y único motivo; 2 archivos de código.

## Verificación
- Línea base: backend 389 pasan (5 todo), frontend 224 pasan.
- Después: backend 389 pasan (5 todo), frontend 228 pasan (4 nuevas en `subida-nginx.test.js`).
- `node scripts/probar-nginx.mjs` (Docker): todas las comprobaciones pasan, dos ejecuciones seguidas.
- Lint: los archivos tocados están limpios. `npm run lint --prefix frontend` da 7 errores, todos previos
  (AGENTS.md anota 10).
- Review ligera (subagente): sin bloqueantes. Revirtiendo solo la directiva, el test da `3 failed | 1 passed`;
  restaurada, `4 passed`. Confirma la causa raíz: Caddy, Cloudflare, `express.json` y multer no cortan
  entre 1 y 6 MB. Las 8 rutas con `upload` (imágenes, promociones, servicios, usuarios) pasan por
  `/api/`, así que no hay otro sitio con el defecto.
  - Hallazgo 3 (el test cortaba el bloque en la primera `}`): corregido, ahora cuenta llaves y va anclado.
  - Hallazgo 4 (posible ECONNRESET en la prueba de 413): corregido, cuerpo de 7,5 MB y error explícito.
  - Hallazgos 1 y 2: aceptados (ver Decisiones).
- Liberación: PR #94 (CI en verde), fusionado en `main` (6342ffe). Aprobado por RickssDev el
  2026-11-23 («desplegar v1.7.1 a producción») para v1.7.1. Desplegado por el usuario en el servidor;
  el usuario confirmó que la subida de imágenes de más de 1 MB funciona en producción.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-23 | supuesto | `lane-check` pide escalar: `nginx.conf` es ruta protegida | Seguir en el carril: una directiva de tamaño solo en `/api/`, sin tocar cabeceras ni CSP; Express sigue limitando a 6 MB | usuario |
| 2026-11-23 | supuesto | ¿Desde qué commit sale la rama del hotfix? No hay tags | `main` en 03542f4 (cierre de v1.7.0), que es lo desplegado | deployment.md → Hotfix; historial |
| 2026-11-23 | supuesto | Review, hallazgo 1: por encima de 7 MiB nginx responde un 413 en HTML, no el 400 de multer | Aceptado: `validarImagen.js` rechaza las imágenes de más de 6 MB antes de enviarlas, y entre 6 y 7 MiB llega el 400 con el mensaje de CA2 | review ligera |
| 2026-11-23 | supuesto | Review, hallazgo 2: el límite de 7 MiB aplica a todo `/api/`, también a rutas públicas | Aceptado: no abre una vía de acceso; Express descarta los cuerpos JSON de más de 100 kb. Restringirlo a las rutas de subida sería un endurecimiento aparte | review ligera |
