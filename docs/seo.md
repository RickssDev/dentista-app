---
status: inferred
updated: 2026-11-12
---

# SEO técnico de Dentissa

Fuente de verdad de lo que un buscador puede rastrear, indexar e interpretar del sitio público y de
cómo se ve al compartirlo (`shared/contract.md` → "SEO técnico"). Los temas que se comprueban están
en `shared/seo-checklist.md`; aquí van las reglas del sitio, el estado de cada ruta y las brechas.
No incluye palabras clave, estrategia de contenido ni enlaces externos.

## Reglas del sitio
- URL canónica: https://sistema.dentissa.app (confirmado por el usuario, 2026-11-08) · variante única: sin `www`, sin barra final (las demás redirigen con `301`/`308`).
- Idiomas: es.
- Renderizado: spa — todas las rutas reciben el mismo `index.html`; el contenido lo pinta JavaScript.
- No se indexa: 404, `/login`, `/restablecer-contrasena`, `/admin/*`, `/paciente/*` y cualquier entorno que no sea producción (decisión del usuario, 2026-11-08) — mecanismo: `noindex`; hoy no existe.
- Páginas de error: 404 propia en `frontend/src/pages/Legal.jsx`, servida con código 200; rutas privadas sin sesión → redirección en cliente a `/login`.
- Archivos generados: `robots.txt` y `sitemap.xml` no existen.
- Compartir: Open Graph no existe.
- Íconos: `favicon.jpeg` propio; `theme-color` `#0f766e`.
- Datos estructurados: ninguno.
- Presupuesto: Lighthouse SEO 100 en las rutas indexables (decisión del usuario, 2026-11-12); la constitución no fija presupuesto de JavaScript.

## Inventario de rutas
| Ruta | Indexable | Título | Descripción | Canónica | `h1` | Open Graph | Datos estructurados | Evidencia |
|---|---|---|---|---|---|---|---|---|
| `/` | sí | ❌ genérico | ❌ genérica | ❌ | ❌ | ❌ | ❌ | `frontend/dist/index.html`, producción |
| `/nosotros` | sí | ❌ repetido | ❌ repetida | ❌ | ❌ | ❌ | ❌ | mismo HTML de la SPA |
| `/galeria` | sí | ❌ repetido | ❌ repetida | ❌ | ❌ | ❌ | ❌ | mismo HTML de la SPA |
| `/contacto` | sí | ❌ repetido | ❌ repetida | ❌ | ❌ | ❌ | ❌ | mismo HTML de la SPA |
| `/aviso-de-privacidad` | sí | ❌ repetido | ❌ repetida | ❌ | ❌ | ❌ | ❌ | mismo HTML de la SPA |
| `/terminos-de-servicio` | sí | ❌ repetido | ❌ repetida | ❌ | ❌ | ❌ | ❌ | mismo HTML de la SPA |
| `/login` | no (inicio de sesión) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | sin `noindex` en `dist/index.html` |
| `/restablecer-contrasena` | no (flujo privado) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | sin `noindex` en `dist/index.html` |
| `/admin/*` | no (requiere sesión) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | producción: `GET /admin` → 200 |
| `/paciente/*` | no (requiere sesión) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | sin `noindex` en `dist/index.html` |
| URL inexistente | no (404) | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | producción: `GET /ruta-inexistente-aidd` → 200 |

Auditado sobre la build local (`npm run build`) y producción el 2026-11-08, con 5 peticiones `GET` sin sesión.
Re-auditado el 2026-11-12 sobre la build local servida con `vite preview` (mismo fallback que nginx): `index.html` ya tiene un título ("Dentissa | Clínica Dental") y una descripción generales, iguales en todas las rutas. Lighthouse 13.6.0, categoría SEO: **92**; única comprobación fallida: `robots-txt` ("robots.txt is not valid": `/robots.txt` devuelve el HTML de la SPA).

## Brechas

### SE1 · alta — SPA: el renderizado deja todas las rutas con el mismo HTML
Evidencia: `frontend/dist/index.html` no tiene contenido, solo `<div id="root">`, y producción
devuelve el mismo documento de 1140 bytes para `/`, `/admin` y una URL inexistente. El rastreador
sin JavaScript no ve título, descripción ni contenido propios de cada ruta.
Correcciones:
- SE1.a Prerenderizar o renderizar en servidor las 6 rutas públicas, con ADR — estado: pendiente
- SE1.b Título y descripción únicos por ruta indexable — estado: pendiente

### SE2 · media — Sin `robots.txt` ni sitemap
Evidencia: `GET /robots.txt` y `GET /sitemap.xml` responden 200 con `Content-Type: text/html` (la SPA). Lighthouse lo marca como `robots.txt is not valid` y es lo único que baja la categoría SEO a 92 (2026-11-12).
Correcciones:
- SE2.a Generar `robots.txt` con la URL absoluta del sitemap — estado: pendiente
- SE2.b Generar `sitemap.xml` con las 6 rutas indexables — estado: pendiente

### SE3 · media — 404 blando y rutas privadas indexables
Evidencia: una URL inexistente y `/admin` responden 200 sin sesión; el HTML no lleva `noindex` y
el servidor no envía `X-Robots-Tag`.
Correcciones:
- SE3.a Responder 404 real a las URL inexistentes — estado: pendiente
- SE3.b Aplicar `noindex` a login, restablecer contraseña, `/admin/*`, `/paciente/*` y a la 404 — estado: pendiente

### SE4 · media — Sin canónica
Evidencia: no hay `<link rel="canonical">` en `frontend/dist/index.html`.
Correcciones:
- SE4.a Canónica absoluta por ruta desde `seo.site_url` — estado: pendiente

### SE5 · baja — Sin Open Graph ni imagen para compartir
Evidencia: no hay metaetiquetas `og:*` en `frontend/dist/index.html`.
Correcciones:
- SE5.a Open Graph por ruta indexable — estado: pendiente
- SE5.b Imagen general de 1200×630 — estado: pendiente

### SE6 · baja — Sin datos estructurados
Evidencia: no hay JSON-LD en `frontend/dist/index.html`.
Correcciones:
- SE6.a Añadir datos de negocio local de la clínica en la portada — estado: pendiente

### SE7 · baja — Íconos incompletos
Evidencia: solo `favicon.jpeg`; sin ícono PNG/SVG ni `apple-touch-icon`.
Correcciones:
- SE7.a Añadir íconos PNG (`favicon-32.png`, 192, 512) y `apple-touch-icon.png` — estado: pendiente
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

## Exclusiones deliberadas

## Pendientes operativos
- Alta del sitio en Google Search Console (propiedad `https://sistema.dentissa.app`) y envío del sitemap, cuando exista — lo hace el usuario.
- Perfil de Google Business de la clínica con el mismo nombre, dirección, teléfono y horario que el sitio — lo hace el usuario; es lo que más pesa al buscar "dentissa".
- Confirmar la dirección y el teléfono reales de la clínica (hoy `frontend/src/data/site.js` tiene valores provisionales).
- Dominio: el sitio público sigue en `sistema.dentissa.app` (decisión del usuario, 2026-11-12).

## Historial
| Fecha | Cambio | Origen |
|---|---|---|
| 2026-11-08 | Documento creado | /init |
| 2026-11-12 | SE7 separada: PNG en SE7.a y SVG en SE7.b (no hay logo vectorial) | /analyze 022 A7 |
| 2026-11-12 | Re-auditoría: título y descripción generales presentes; Lighthouse SEO 92 por `robots.txt`; pendientes operativos de Search Console y Google Business | /seo audit |
