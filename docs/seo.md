---
status: inferred
updated: 2026-11-17
---

# SEO técnico de Dentissa

Fuente de verdad de lo que un buscador puede rastrear, indexar e interpretar del sitio público y de
cómo se ve al compartirlo (`shared/contract.md` → "SEO técnico"). Los temas que se comprueban están
en `shared/seo-checklist.md`; aquí van las reglas del sitio, el estado de cada ruta y las brechas.
No incluye palabras clave, estrategia de contenido ni enlaces externos.

## Reglas del sitio
- URL canónica: https://sistema.dentissa.app (confirmado por el usuario, 2026-11-08) · variante única: sin `www`, sin barra final (las demás redirigen con `301`/`308`).
- Idiomas: es.
- Renderizado: SPA con prerenderizado en el build. Las 6 páginas públicas llegan con su HTML propio
  (spec 022, v1.3.0); `/login` llega pintado en `login.html`, con `noindex`, sin canónica, sin Open Graph
  y fuera del sitemap (spec 023). Las demás rutas privadas reciben el armazón `app.html`.
- No se indexa: 404, `/login`, `/restablecer-contrasena`, `/admin/*`, `/paciente/*` y cualquier entorno que no sea producción (decisión del usuario, 2026-11-08) — mecanismo: `<meta name="robots" content="noindex">` y `X-Robots-Tag: noindex` desde nginx (spec 022).
- Páginas de error: 404 propia (`NotFound` en `frontend/src/pages/Legal.jsx`, prerenderizada en `404.html`) servida con código **404**; rutas privadas sin sesión → redirección en cliente a `/login`.
- Archivos generados en el build: `robots.txt` (con la URL absoluta del sitemap) y `sitemap.xml` con las 6 rutas indexables (spec 022).
- Compartir: cada ruta indexable lleva `og:title`, `og:description`, `og:url`, `og:image` (1200×630) con `og:image:alt`, y `twitter:card` `summary_large_image` (spec 022). El login no lleva Open Graph.
- Íconos: `favicon.jpeg`, PNG de 32, 192 y 512 y `apple-touch-icon.png` (spec 022); sin `favicon.svg` (SE7.b).
- Datos estructurados: negocio local de la clínica en la portada (spec 022).
- Presupuesto: Lighthouse SEO 100 en las rutas indexables (decisión del usuario, 2026-11-12); la constitución no fija presupuesto de JavaScript.

## Inventario de rutas
| Ruta | Indexable | Título | Descripción | Canónica | `h1` | Open Graph | Datos estructurados | Evidencia |
|---|---|---|---|---|---|---|---|---|
| `/` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ✅ negocio local | `dist/index.html` (spec 022) |
| `/nosotros` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ➖ | `dist/nosotros/index.html` |
| `/galeria` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ➖ | `dist/galeria/index.html` |
| `/contacto` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ➖ | `dist/contacto/index.html` |
| `/aviso-de-privacidad` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ➖ | `dist/aviso-de-privacidad/index.html` |
| `/terminos-de-servicio` | sí | ✅ propio | ✅ propia | ✅ | ✅ | ✅ | ➖ | `dist/terminos-de-servicio/index.html` |
| `/login` | no (inicio de sesión) | ✅ "Iniciar sesión \| Dentissa" | ➖ | ➖ | ✅ | ➖ (sin Open Graph) | ➖ | `dist/login.html` con `noindex` y `X-Robots-Tag` (spec 023) |
| `/restablecer-contrasena` | no (flujo privado) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | `app.html` con `noindex` y `X-Robots-Tag` (spec 022) |
| `/admin/*` | no (requiere sesión) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | `app.html` con `noindex` y `X-Robots-Tag` |
| `/paciente/*` | no (requiere sesión) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | `app.html` con `noindex` y `X-Robots-Tag` |
| URL inexistente | no (404) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | `404.html` con código 404 y `noindex` (spec 022; producción, 2026-11-17) |

Auditado sobre la build local (`npm run build`) y producción el 2026-11-08, con 5 peticiones `GET` sin sesión.
Re-auditado el 2026-11-12 sobre la build local servida con `vite preview` (mismo fallback que nginx): `index.html` ya tiene un título ("Dentissa | Clínica Dental") y una descripción generales, iguales en todas las rutas. Lighthouse 13.6.0, categoría SEO: **92**; única comprobación fallida: `robots-txt` ("robots.txt is not valid": `/robots.txt` devuelve el HTML de la SPA).
Estado actual (2026-11-17, tras las specs 022 y 023): inventario de arriba, comprobado por las guardas del build (`frontend/scripts/prerender.mjs`) y en producción (Lighthouse SEO 100).

## Brechas

### SE1 · alta — SPA: el renderizado deja todas las rutas con el mismo HTML
Evidencia: `frontend/dist/index.html` no tiene contenido, solo `<div id="root">`, y producción
devuelve el mismo documento de 1140 bytes para `/`, `/admin` y una URL inexistente. El rastreador
sin JavaScript no ve título, descripción ni contenido propios de cada ruta.
Correcciones:
- SE1.a Prerenderizar o renderizar en servidor las 6 rutas públicas, con ADR — estado: mitigada (v1.3.0)
- SE1.b Título y descripción únicos por ruta indexable — estado: mitigada (v1.3.0)

### SE2 · media — Sin `robots.txt` ni sitemap
Evidencia: `GET /robots.txt` y `GET /sitemap.xml` responden 200 con `Content-Type: text/html` (la SPA). Lighthouse lo marca como `robots.txt is not valid` y es lo único que baja la categoría SEO a 92 (2026-11-12).
Correcciones:
- SE2.a Generar `robots.txt` con la URL absoluta del sitemap — estado: mitigada (v1.3.0)
- SE2.b Generar `sitemap.xml` con las 6 rutas indexables — estado: mitigada (v1.3.0)

### SE3 · media — 404 blando y rutas privadas indexables
Evidencia: una URL inexistente y `/admin` responden 200 sin sesión; el HTML no lleva `noindex` y
el servidor no envía `X-Robots-Tag`.
Correcciones:
- SE3.a Responder 404 real a las URL inexistentes — estado: mitigada (v1.3.0)
- SE3.b Aplicar `noindex` a login, restablecer contraseña, `/admin/*`, `/paciente/*` y a la 404 — estado: mitigada (v1.3.0)

### SE4 · media — Sin canónica
Evidencia: no hay `<link rel="canonical">` en `frontend/dist/index.html`.
Correcciones:
- SE4.a Canónica absoluta por ruta desde `seo.site_url` — estado: mitigada (v1.3.0)

### SE5 · baja — Sin Open Graph ni imagen para compartir
Evidencia: no hay metaetiquetas `og:*` en `frontend/dist/index.html`.
Correcciones:
- SE5.a Open Graph por ruta indexable — estado: mitigada (v1.3.0)
- SE5.b Imagen general de 1200×630 — estado: mitigada (v1.3.0)

### SE6 · baja — Sin datos estructurados
Evidencia: no hay JSON-LD en `frontend/dist/index.html`.
Correcciones:
- SE6.a Añadir datos de negocio local de la clínica en la portada — estado: mitigada (v1.3.0)

### SE7 · baja — Íconos incompletos
Evidencia: solo `favicon.jpeg`; sin ícono PNG/SVG ni `apple-touch-icon`.
Correcciones:
- SE7.a Añadir íconos PNG (`favicon-32.png`, 192, 512) y `apple-touch-icon.png` — estado: mitigada (v1.3.0)
- SE7.b Añadir `favicon.svg` desde un logo vectorial — estado: pendiente (no hay logo vectorial; decisión del usuario, 2026-11-12)

## Brechas por confirmar
- Redirecciones de la variante con `www` y de HTTP a HTTPS — depende de: configuración de Cloudflare — cómo confirmarla: consultar esas variantes.
- Si `https://dentissa.app` existe y compite con la canónica — depende de: dominios de la clínica — cómo confirmarla: el usuario.

## Verificación en producción
| Fecha | Comprobación | Resultado | Evidencia |
|---|---|---|---|
| 2026-11-08 | robots.txt y sitemap.xml responden 200 | ❌ | Responden 200 con HTML de la SPA |
| 2026-11-08 | Producción sin noindex en rutas indexables | ✅ | Sin `noindex` en `/` ni `X-Robots-Tag` |
| 2026-11-08 | URL inexistente responde 404 | ❌ | `/ruta-inexistente-aidd` → 200 |
| 2026-11-17 | robots.txt (`text/plain`) y sitemap.xml válidos | ✅ | Usuario: `curl -sI` tras caducar la caché de Cloudflare; Search Console: sitemap "Correcto" |
| 2026-11-17 | URL inexistente responde 404 con página propia | ✅ | Usuario: `/no-existe` → "Página no encontrada" |
| 2026-11-17 | Lighthouse SEO en producción | ✅ | Usuario: 100 |
| 2026-11-17 | Páginas públicas con HTML propio; privadas funcionan al recargar | ✅ | Usuario: "Ver código fuente" y navegación; contenedor con las carpetas por ruta |
| 2026-11-17 | v1.4.0: `/login` prerenderizado con `noindex` y sin fuentes ni recursos externos | ✅ | Usuario: contenedor con `login.html` tras `build --no-cache frontend`; "ya se ve lo esperado" |

## Exclusiones deliberadas
- Rutas privadas (`/login`, `/restablecer-contrasena`, `/admin/*`, `/paciente/*`) responden **200** con `X-Robots-Tag: noindex`, no 401/404. `/login` recibe `login.html` (prerenderizado, spec 023); las demás, el armazón `app.html`; los dos llevan `<meta name="robots" content="noindex">`. Motivo: la SPA necesita ese HTML para abrirlas o recargarlas, y la sesión se valida en el cliente y en la API. Decidido en el plan de la spec 022 y registrado en su review (R9).

## Pendientes operativos
- ~~Alta del sitio en Google Search Console y envío del sitemap~~ — hecho por el usuario el 2026-11-17 (verificación por archivo HTML, indexación solicitada).
- Perfil de Google Business de la clínica con el mismo nombre, dirección, teléfono y horario que el sitio — lo hace el usuario; es lo que más pesa al buscar "dentissa".
- Confirmar la dirección y el teléfono reales de la clínica (hoy `frontend/src/data/site.js` tiene valores provisionales).
- Dominio: el sitio público sigue en `sistema.dentissa.app` (decisión del usuario, 2026-11-12).

## Historial
| Fecha | Cambio | Origen |
|---|---|---|
| 2026-11-08 | Documento creado | /init |
| 2026-11-12 | SE7 separada: PNG en SE7.a y SVG en SE7.b (no hay logo vectorial) | /analyze 022 A7 |
| 2026-11-12 | Re-auditoría: título y descripción generales presentes; Lighthouse SEO 92 por `robots.txt`; pendientes operativos de Search Console y Google Business | /seo audit |
| 2026-11-12 | Exclusión deliberada de las rutas privadas (200 con `noindex`) y etiquetas para compartir de la spec 022 | /review 022 R9, R16 |
| 2026-11-17 | SE1.a–SE7.a mitigadas en v1.3.0; verificación en producción; Search Console dado de alta | /release 022 |
