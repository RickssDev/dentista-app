---
lane: fix
status: done
base: 7978d70
relates: [001]
covers: []
escalated_to: null
---

# Fix: el build de Docker del frontend no recibe el client ID de Google

## Problema
Una imagen del frontend construida desde el repositorio sale sin el client ID de Google: en el
JavaScript generado no aparece ningún `*.apps.googleusercontent.com` (comprobado en la imagen local
el 2026-11-17). El botón "Continuar con Google" del login arranca sin ID y no funciona en el
contenedor local. En producción funciona solo porque el servidor tiene un cambio local, sin
commitear, en `frontend/Dockerfile`. Un `git pull` o un servidor nuevo lo pierde.

## Reproducción
`frontend/tests/dockerfile-variables.test.js` recorre `frontend/src`, reúne cada
`import.meta.env.VITE_*` y exige que el `Dockerfile` la declare con `ARG` y la pase a `ENV`. Antes
del arreglo:
`× VITE_GOOGLE_CLIENT_ID se declara como ARG y se pasa a ENV` (`expected '# Etapa 1: …' to match
/^ARG VITE_GOOGLE_CLIENT_ID(=|\s|$)/m`).

## Causa raíz
Vite sustituye `import.meta.env.VITE_*` por su valor **al construir**. Dentro de Docker no hay
`.env`, porque `.dockerignore` lo excluye y así debe ser. El valor solo puede llegar como argumento
de build. `docker-compose.prod.yml` pasa `VITE_GOOGLE_CLIENT_ID` en `build.args`, pero el
`Dockerfile` solo declaraba `ARG VITE_API_URL`. Docker descarta los argumentos que no se declaran y
el build vio la variable vacía.

## Cambio
- `frontend/Dockerfile`: `ARG VITE_GOOGLE_CLIENT_ID` y `ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID`
  antes de `npm run build`, igual que `VITE_API_URL`. Es un ID público (va en el JavaScript del
  navegador), no un secreto.
- `frontend/tests/dockerfile-variables.test.js`: el test de reproducción. `VITE_ASSETS_URL` queda como
  opcional con su motivo: sin ella, `api.js` usa el mismo origen de la API, que es lo correcto
  detrás de nginx.

## Escalado
`aidd.py lane-check` al empezar y al cerrar: "Escalar: sí — seguridad: rutas protegidas
(`frontend/Dockerfile`)". 3 archivos, 1 de código. El usuario aceptó seguir en el carril (ver
Decisiones). No cambia comportamiento especificado: el login con Google ya debía funcionar (spec
001), y el cambio solo hace que el build lo reciba.

## Verificación
- El test falla antes del arreglo (arriba) y pasa después, 4/4 en dos ejecuciones.
- Imagen construida con `--build-arg VITE_GOOGLE_CLIENT_ID=<de frontend/.env>`: el bundle contiene
  `apps.googleusercontent.com`. Sin el argumento no lo contiene, como se espera.
- `npm test`: frontend 100/100 (14 archivos), backend 256 + 5 `todo`. Lint del test limpio.
  `node scripts/probar-nginx.mjs`: 22/22.
- Review ligera: con el código del arreglo revertido (el `Dockerfile` de `base`), el test falla por
  la razón del bug; con el arreglo, pasa. La causa explica el síntoma: producción solo funcionaba
  por el parche local del servidor. No hay otros `Dockerfile` del frontend con el mismo defecto.
- **Al desplegar:** en el servidor, el cambio local de `frontend/Dockerfile` choca con este. Se
  revisa su `git diff` y, si solo añade estas dos líneas, se descarta
  (`git checkout -- ../frontend/Dockerfile`) antes del `git pull`.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-17 | brecha | ¿Arreglarlo antes de la spec 023? | Sí: `/fix` del Dockerfile antes de implementar la 023 (análisis 023 A8) | usuario |
| 2026-11-17 | supuesto | `frontend/Dockerfile` es ruta protegida; `lane-check` pide escalar | Seguir en el carril: el usuario pidió este `/fix` concreto | usuario |
| 2026-11-17 | implícita | `VITE_ASSETS_URL` tampoco llega al build | Opcional: el respaldo (mismo origen) es el comportamiento correcto en el contenedor | `frontend/src/services/api.js:18-21` |
