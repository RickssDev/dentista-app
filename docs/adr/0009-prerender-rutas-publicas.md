---
id: 0009
status: proposed
date: 2026-11-12
---

# ADR 0009 · Prerender de las rutas públicas en el build

Complementa a [ADR 0003](0003-frontend-spa-react-vite.md), que ya anticipaba esta decisión.

## Contexto
La SPA entrega el mismo `index.html` vacío para todas las rutas (brecha SE1 de `docs/seo.md`). Los
buscadores sin JavaScript no ven el contenido, título ni descripción de cada página pública, y
nginx responde 200 a cualquier ruta, también a `/robots.txt` y a las URL inexistentes. La spec 022
pide HTML propio por página pública, `noindex` en las privadas y un 404 real.

## Decisión
Generar en el build un HTML por cada una de las seis rutas públicas y por la página 404, con las
API que ya trae el proyecto: `prerenderToNodeStream` de `react-dom/static` (React 19) y
`StaticRouter` de React Router 7, a partir de un segundo build de Vite con `--ssr`. Un script de
Node escribe `dist/<ruta>/index.html`, `dist/404.html`, `dist/app.html` (el armazón de la SPA, con
`noindex`, para las rutas privadas), `robots.txt` y `sitemap.xml`. En el navegador, `hydrateRoot`
toma el HTML prerenderizado; nginx sirve cada archivo por su ruta y responde 404 real al resto.

Sin dependencias nuevas: comprobado con una prueba de concepto el 2026-11-12, que generó las seis
páginas públicas y la 404 con su `h1` y su contenido.

## Alternativas consideradas
- Plugin o herramienta de prerender (p. ej. un plugin de Vite o un navegador sin cabeza): añade
  dependencias y, en el caso del navegador, un build más lento y frágil.
- Migrar a un meta-framework con renderizado en servidor: reescribe el enrutado y el despliegue; no
  se justifica para seis páginas.
- Seguir como SPA y confiar en el renderizado de JavaScript de Google: no resuelve el 404 blando ni
  la vista previa al compartir, y otros buscadores y redes no ejecutan JavaScript.

## Consecuencias
- `npm run build` hace dos builds de Vite y el prerender; tarda algo más.
- Los componentes de las páginas públicas no pueden usar `window`, `document` ni `localStorage`
  durante el render (solo en efectos o manejadores).
- Las secciones que piden datos a la API se completan en el navegador, como hoy.
- `frontend/nginx.conf` deja de mandar toda ruta a `index.html`.
- `seo.rendering` pasa de `spa` a `hybrid`.
