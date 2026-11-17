---
lane: chore
status: done
base: e2c7493
relates: [022]
covers: []
escalated_to: null
---

# Chore: archivo de verificación de Google Search Console

## Problema
Para dar de alta `https://sistema.dentissa.app` en Google Search Console (pendiente operativo de
`docs/seo.md`, tras la spec 022), Google pide publicar en la raíz del sitio el archivo
`google7cfa08437e46fc40.html` con el texto `google-site-verification: google7cfa08437e46fc40.html`.
Es la forma de verificar la propiedad sin tocar el DNS de Cloudflare, que administra un tercero.

## Cambio
- `frontend/public/google7cfa08437e46fc40.html`: el archivo tal como lo da Google. Vite lo copia
  a `dist/` y nginx lo sirve por `location / { try_files $uri =404; }`, sin cambios de configuración.
- No es un secreto: solo prueba que quien controla el sitio controla la cuenta de Search Console.

## Escalado
`aidd.py lane-check` al empezar y al cerrar (ver Verificación). Sin contratos, datos, seguridad ni
rutas protegidas.

## Verificación
- `aidd.py lane-check`: 1 archivo, "Escalar: no".
- `npm run build`: `dist/google7cfa08437e46fc40.html` con el texto exacto; prerender sin cambios.
- `node scripts/probar-nginx.mjs`: 22/22. En la misma imagen, `GET /google7cfa08437e46fc40.html`
  → `200`, `text/html`, `google-site-verification: google7cfa08437e46fc40.html`.
- Sin dependencias ni código de la app: no aplican suite, SAST ni SCA. Review ligera de chore no requerida.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-16 | implícita | Método de verificación de Search Console | Archivo HTML en la raíz: la propiedad por dominio exige DNS en Cloudflare, que no administra el usuario | usuario |
