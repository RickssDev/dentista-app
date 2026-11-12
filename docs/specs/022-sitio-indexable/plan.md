---
spec: 022-sitio-indexable
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-12
---

# Plan · 022 Sitio indexable

## Enfoque técnico
Una tabla única de metadatos por ruta pública (`frontend/src/seo/rutas.js`) alimenta todo: el
prerender, `robots.txt`, `sitemap.xml` y la actualización del `<head>` al navegar en el cliente. El
build hace un segundo build de Vite con `--ssr` y un script de Node prerenderiza las seis rutas
públicas y la 404 con `prerenderToNodeStream` y `StaticRouter`, sin dependencias nuevas
([ADR 0009](../../adr/0009-prerender-rutas-publicas.md); prueba de concepto del 2026-11-12). Cada
HTML lleva su título, descripción, canónica, Open Graph y, en la portada, los datos de la clínica
en JSON-LD generados desde `site.js`. Las rutas privadas reciben un armazón con `noindex`, y nginx
deja de mandar todo a `index.html`: sirve cada archivo por su ruta y responde 404 real al resto. En
el navegador, `hydrateRoot` toma el HTML ya pintado.

## Constitution Check
Constitución 1.0.0, en `draft` (aún no aprobada por el usuario): el check se hace contra ella.

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 022 `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada CA con test automático; lo de nginx con una prueba sobre el contenedor (decisión del usuario, 2026-11-12) | test: `frontend/tests/seo-*.test.js(x)` y `frontend/scripts/probar-nginx.mjs` en local y en CI |
| P3 Dependencias nuevas con ADR | ➖ | Sin dependencias nuevas: React 19 y React Router 7 ya traen lo necesario | — |
| P4 Arquitectura con ADR | ✅ | El renderizado pasa de SPA a prerender de las rutas públicas | manual: ADR 0009 y T090 |
| P5 Producción solo con aprobación humana | ✅ | Se libera con `/release` | manual: puerta de `/release` |
| P6 Rollback documentado | ✅ | Rollout: volver al commit anterior y reconstruir la imagen del frontend; sin datos | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | No cambia ningún endpoint; las rutas privadas siguen protegidas por la API | — |
| P9 Entrada validada y SQL parametrizado | ➖ | Sin entradas nuevas | — |
| P10 Secretos fuera del repositorio | ✅ | El prerender solo usa variables `VITE_*` públicas | test: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Sin dependencias nuevas; línea base 2026-11-12 sin altas | test: `npm audit` en CI y `/release` |
| P12 Modelo de amenazas | ✅ | Sección "Modelo de amenazas" | manual: `/analyze`, `/review` |
| P13 Auditoría de datos sensibles | ➖ | No toca datos sensibles ni permisos | — |
| P14 Correlación por petición | ➖ | No añade logs ni peticiones a la API | — |
| P15 Logs sin datos sensibles | ➖ | No añade logs | — |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | Sin cambios visuales; el HTML prerenderizado es el mismo que pinta React | test: suite del frontend; manual: navegación por teclado en T061 |
| P17 Sin lógica de negocio en las vistas | ✅ | Metadatos y datos de la clínica en módulos `src/seo/`; las vistas no cambian | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Título, descripción y canónica absoluta únicos desde `seo.site_url` | test: `seo-rutas.test.js` y `seo-prerender.test.js` sobre el HTML generado; el script de prerender falla el build si falta alguno |
| P19 Noindex fuera de lo público | ✅ | `app.html` y `404.html` con `noindex`, sin canónica, Open Graph ni JSON-LD; `X-Robots-Tag` en las privadas; fuera del sitemap. No hay entornos no productivos públicos (sin staging, `docs/deployment.md`) | test: `seo-prerender.test.jsx`, `seo-archivos.test.js` y `probar-nginx.mjs` |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Sin estilos nuevos en pantallas; la plantilla de la imagen para compartir usa los colores de los tokens | manual: `/review` del diff |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `frontend/src/seo/rutas.js` (nuevo) | Tabla de las seis rutas públicas: `ruta`, `titulo`, `descripcion`; `SITIO = 'https://sistema.dentissa.app'`; `canonica(ruta)`; rutas no indexables | — |
| `frontend/src/seo/archivos.js` (nuevo) | `generarRobots()` y `generarSitemap()` desde la tabla | — |
| `frontend/src/seo/negocioLocal.js` (nuevo) | JSON-LD `Dentist` desde `CLINIC` y `HOURS` de `site.js`: `PostalAddress` con los campos separados, teléfono, URL, `image` y horario convertido a `openingHoursSpecification`; lanza un error si un horario no se puede interpretar; texto escapado para `<script>` | Horario en texto libre ("8:00 AM - 4:00 PM") |
| `frontend/src/data/site.js` | `CLINIC.direccion` con `calle`, `ciudad`, `estado`, `codigoPostal` y `pais` (valores provisionales actuales); `address` se conserva para lo que se muestra | Duplicar la dirección: `address` se arma desde los campos |
| `frontend/src/seo/cabecera.js` (nuevo) | `construirPagina(plantilla, { cuerpo, ruta, noindex })`: inserta el HTML en `#root` y título, descripción, canónica, Open Graph, `twitter:card`, `robots` y JSON-LD en el `<head>` | Inyección por texto en la plantilla |
| `frontend/src/entry-prerender.jsx` (nuevo) | `render(url)` con `StaticRouter` y `AppRoutes`, usando `prerenderToNodeStream` | — |
| `frontend/scripts/prerender.mjs` (nuevo) | Recorre la tabla, escribe `dist/<ruta>/index.html`, `dist/404.html`, `dist/app.html`, `robots.txt` y `sitemap.xml`; añade a cada página los `<link rel="stylesheet">` de los chunks de su ruta según el manifiesto de Vite; falla si una ruta no tiene `h1`, título, descripción de 70–160 caracteres, canónica o su CSS | Build más largo |
| `frontend/vite.config.js` | `build.manifest: true` para conocer el CSS de cada página | — |
| `frontend/src/App.jsx` | Separar `AppRoutes` (las rutas) de `App` (`BrowserRouter` + `AppRoutes`) | Ninguno (mismo árbol) |
| `frontend/src/main.jsx` | `hydrateRoot` si `#root` ya tiene contenido; `createRoot` si no | Avisos de hidratación |
| `frontend/src/components/home/Metadatos.jsx` (nuevo) y `Layout.jsx` | Al navegar en el cliente, actualiza título, descripción y canónica desde la tabla (en un efecto; no pinta nada) | — |
| `frontend/src/services/api.js` | `BASE_ORIGIN` sin `window` al cargar el módulo (fuera del navegador, un origen fijo propio del módulo, sin depender de `seo/rutas.js`) | Ninguno en el navegador |
| `frontend/src/components/home/Footer.jsx` | El año del pie no rompe la hidratación cuando cambia (`suppressHydrationWarning` en ese texto) | — |
| `frontend/tests/setup.js` | Las API simuladas del navegador solo se definen si hay `window`, para que las suites en entorno node arranquen | Ninguno en jsdom |
| `frontend/src/components/home/SmartImage.jsx` | `fetchpriority` → `fetchPriority` (aviso de React al prerenderizar) | — |
| `frontend/index.html` | Íconos PNG (32, 192, 512) y `apple-touch-icon` (180) | — |
| `frontend/public/` | `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` desde `favicon.jpeg`; `og-dentissa.jpg` de 1200×630 con el logo y `hero-dentissa.webp` | Recursos binarios |
| `frontend/scripts/og/plantilla.html` (nuevo) | Plantilla de la imagen para compartir, capturada una vez con Chrome sin cabeza | — |
| `frontend/package.json` | `build`: `vite build && vite build --ssr src/entry-prerender.jsx --outDir dist-ssr && node scripts/prerender.mjs` | CI y Docker usan `npm run build` |
| `frontend/nginx.conf` | Rutas públicas en `location =` exactos → su `index.html` (sin redirección por directorio); `/login`, `/restablecer-contrasena`, `/admin*`, `/paciente*` → `app.html` con `X-Robots-Tag: noindex`; barra final → `301` relativo sin barra (`absolute_redirect off`); archivos y `/api`, `/uploads` como hoy; resto → `404.html` con código 404 | Un error de configuración dejaría rutas sin servir |
| `frontend/scripts/probar-nginx.mjs` (nuevo) | Construye la imagen del frontend con Docker, la levanta en un puerto local y comprueba códigos, cabeceras y redirecciones de nginx; termina con error si algo no coincide | Necesita Docker |
| `.github/workflows/ai-dd.yml` | Paso que ejecuta `probar-nginx.mjs` en el CI | Ruta protegida: tarea aprobada |
| `frontend/eslint.config.js` | Ignorar `dist-ssr` y revisar `scripts/**/*.mjs` con globals de Node | — |
| `frontend/.gitignore` | `dist-ssr` | — |
| `frontend/tests/seo-*.test.js(x)` (nuevos) | Pruebas de tabla, archivos, negocio local, prerender, íconos e imagen | — |

## Contratos y datos
Sin cambios de API ni de esquema. Archivos públicos nuevos:

| Recurso | Contenido |
|---|---|
| `/robots.txt` | `User-agent: *`, `Allow: /`, `Sitemap: https://sistema.dentissa.app/sitemap.xml` (sin `Disallow` de rutas privadas: deben poder leer su `noindex`) |
| `/sitemap.xml` | `urlset` con las seis rutas públicas en URL absoluta, sin barra final |
| `/<ruta>/index.html` | HTML prerenderizado: título, descripción, canónica, Open Graph, contenido; la portada con JSON-LD |
| `/app.html` | Armazón de la SPA con `<meta name="robots" content="noindex">` |
| `/404.html` | Página "no encontrada" prerenderizada con `noindex`, servida con código 404 |

Rutas indexables (tabla): `/`, `/nosotros`, `/galeria`, `/contacto`, `/aviso-de-privacidad`,
`/terminos-de-servicio`. Títulos con "Dentissa"; descripciones de 70–160 caracteres; los textos los
propone `/implement` a partir del contenido de cada página.

## Estrategia de pruebas
- **Unidad (Vitest, entorno node):** `seo-rutas.test.js` (CA3, CA4), `seo-archivos.test.js` (CA5,
  CA6, CA8), `seo-negocio-local.test.js` (CA7, TM3).
- **Prerender (Vitest, entorno node):** `seo-prerender.test.jsx` renderiza cada ruta con
  `entry-prerender.jsx` y `construirPagina`: `h1` y textos propios (CA2), metadatos (CA3, CA4,
  CA11), `noindex` en `app.html` y `404.html` (CA8), y que no aparezcan textos de pantallas
  privadas ni datos del panel (CA10).
- **Hidratación (Vitest, jsdom):** `seo-hidratacion.test.jsx` pone el HTML prerenderizado de cada
  ruta en el documento, hidrata con `hydrateRoot` y falla ante cualquier error recuperable o de
  hidratación, también con el reloj en otro año (CA13).
- **Comprobaciones de Lighthouse SEO sobre el HTML (Vitest):** en `seo-prerender.test.jsx`, `lang`,
  `viewport`, imágenes con `alt`, enlaces con `href` rastreable y texto, y los `<link>` del CSS de
  cada página (CA1, A5).
- **nginx (Docker):** `scripts/probar-nginx.mjs` en local y en el CI: seis rutas → 200 sin
  redirección; `/nosotros/` → 301 a `/nosotros` en un salto; `/no-existe` → 404 con "Página no
  encontrada"; `/robots.txt` `text/plain`; `/sitemap.xml` XML; `/login`, `/admin`, `/paciente` →
  la app con `X-Robots-Tag: noindex`; `/assets/*`, `/images/*` y el ícono → 200 (CA5, CA8, CA9).
- **Recursos (Vitest):** `seo-recursos.test.js` lee las cabeceras de los PNG y del JPEG para
  comprobar 32/180/192/512 px y 1200×630 (CA11, CA12).
- **Build:** `npm run build` falla si el script de prerender detecta una ruta sin metadatos (CI
  "Lint y build").
- **Verificación manual:** sobre el contenedor local del frontend, Lighthouse 13.6.0 SEO 100 en
  las seis rutas, con el resultado registrado por ruta (CA1), y Rendimiento de la portada antes y
  después con el mismo contenedor (RNF).
- La suite existente del frontend sigue en verde (CA13).

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Divulgación: el prerender incluye contenido de pantallas privadas o datos del sistema | A01:2025 | `scripts/prerender.mjs`, `entry-prerender.jsx` | Solo se prerenderizan las rutas de la tabla; el prerender no llama a la API (las secciones con datos quedan en su estado inicial) | `seo-prerender.test.jsx` (CA10) |
| TM2 | Divulgación: rutas privadas indexadas y mostradas en resultados | A01:2025 | `nginx.conf`, `app.html` | `noindex` en `app.html` y `X-Robots-Tag` en las rutas privadas; fuera del sitemap | `seo-prerender.test.jsx`, `seo-archivos.test.js`, `probar-nginx.mjs` (CA8) |
| TM3 | Manipulación: un dato de `site.js` con `</script>` rompe el JSON-LD e inyecta HTML | A03:2025 Injection | `negocioLocal.js`, `cabecera.js` | Escapar `<` como `<` al serializar el JSON-LD y escapar atributos de las metaetiquetas | `seo-negocio-local.test.js` con un valor que contiene `</script>` |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: Lighthouse SEO 100 en las seis rutas | todos | `seo-prerender.test.jsx` "comprobaciones de Lighthouse SEO sobre el HTML de cada ruta"; `probar-nginx.mjs` (códigos y robots) · verificación manual: Lighthouse 13.6.0 sobre el contenedor local, SEO = 100 en las seis rutas, registrado por ruta |
| CA2: contenido propio sin JavaScript | `entry-prerender.jsx`, `prerender.mjs`, `App.jsx`, `api.js`, `SmartImage.jsx` | `seo-prerender.test.jsx` "cada ruta pública tiene su h1 y textos propios en el HTML" |
| CA3: título y descripción únicos | `seo/rutas.js`, `cabecera.js`, `Metadatos.jsx` | `seo-rutas.test.js` "títulos y descripciones únicos, con Dentissa, 70–160"; `seo-prerender.test.jsx` "el HTML de cada ruta lleva su título y descripción" |
| CA4: canónica absoluta sin barra final | `seo/rutas.js`, `cabecera.js` | `seo-rutas.test.js` "canónica absoluta en sistema.dentissa.app sin barra"; `seo-prerender.test.jsx` |
| CA5: robots.txt válido con sitemap | `seo/archivos.js`, `prerender.mjs`, `nginx.conf` | `seo-archivos.test.js` "robots con Allow y Sitemap absoluto" |
| CA6: sitemap con exactamente las seis rutas | `seo/archivos.js`, `prerender.mjs` | `seo-archivos.test.js` "sitemap con las seis rutas y nada más" |
| CA7: datos de la clínica en la portada | `seo/negocioLocal.js`, `cabecera.js`, `site.js` | `seo-negocio-local.test.js` "JSON válido; Dentist con PostalAddress separada, teléfono, horario, URL e image desde site.js"; "un horario no interpretable lanza error"; `seo-prerender.test.jsx` "la portada lleva el JSON-LD" |
| CA8: noindex en privadas y 404, fuera del sitemap | `prerender.mjs`, `cabecera.js`, `nginx.conf` | `seo-prerender.test.jsx` "app.html y 404.html con noindex y sin canónica, Open Graph ni JSON-LD"; `seo-archivos.test.js` "el sitemap no lista rutas privadas"; `probar-nginx.mjs` "`X-Robots-Tag: noindex` en /login, /admin y /paciente" |
| CA9: 404 real con la página propia | `nginx.conf`, `prerender.mjs` | `probar-nginx.mjs` "`/no-existe` → 404 con Página no encontrada", "`/nosotros` → 200 sin redirección", "`/nosotros/` → 301 a `/nosotros` en un salto" |
| CA10 (abuso): nada privado en lo generado | `prerender.mjs`, `entry-prerender.jsx` | `seo-prerender.test.jsx` "el HTML generado no contiene textos de login, panel ni portal" |
| CA11: vista previa al compartir | `cabecera.js`, `public/og-dentissa.jpg` | `seo-prerender.test.jsx` "og:title, og:description, og:url, og:image y twitter:card"; `seo-recursos.test.js` "og-dentissa.jpg mide 1200×630" |
| CA12: íconos PNG | `index.html`, `public/*.png` | `seo-recursos.test.js` "íconos de 32, 180, 192 y 512 px enlazados en index.html" |
| CA13: sin regresiones | `App.jsx`, `main.jsx`, `Layout.jsx`, `Footer.jsx`, `setup.js` | suite existente del frontend; `seo-hidratacion.test.jsx` "cada ruta hidrata sin errores, también en otro año"; `probar-nginx.mjs` "assets e imágenes siguen sirviéndose" · verificación manual: navegar login, paneles y contacto en el contenedor local |
| RNF: descubribilidad | `seo/*`, `nginx.conf` | los tests de CA3–CA8 |
| RNF: rendimiento no empeora | todos, `prerender.mjs` (CSS por ruta) | `seo-prerender.test.jsx` "cada página enlaza su CSS" · verificación manual: Lighthouse Rendimiento de la portada antes y después con el mismo contenedor de nginx y el mismo equipo |
| RNF: accesibilidad sin regresiones | — | suite existente · verificación manual: teclado en la portada y el menú |
| TM1 | `prerender.mjs` | `seo-prerender.test.jsx` (CA10) |
| TM2 | `nginx.conf`, `app.html` | `seo-prerender.test.jsx`, `seo-archivos.test.js`, `probar-nginx.mjs` |
| TM3 | `negocioLocal.js`, `cabecera.js` | `seo-negocio-local.test.js` |

## Observabilidad
No aplica: la spec no toca datos sensibles, autenticación ni permisos, ni añade logs. Tras el
deploy se comprueba con `/seo verify` (robots, sitemap, 404, `noindex`) y con Lighthouse sobre
producción.

## Descubribilidad
| Ruta | Indexable | Título | Descripción | Canónica | Sitemap | Datos estructurados | Test |
|---|---|---|---|---|---|---|---|
| `/` | sí | propio con "Dentissa" | propia | `https://sistema.dentissa.app/` | sí | `Dentist` | `seo-prerender.test.jsx` |
| `/nosotros` | sí | propio | propia | `https://sistema.dentissa.app/nosotros` | sí | — | `seo-prerender.test.jsx` |
| `/galeria` | sí | propio | propia | `https://sistema.dentissa.app/galeria` | sí | — | `seo-prerender.test.jsx` |
| `/contacto` | sí | propio | propia | `https://sistema.dentissa.app/contacto` | sí | — | `seo-prerender.test.jsx` |
| `/aviso-de-privacidad` | sí | propio | propia | `https://sistema.dentissa.app/aviso-de-privacidad` | sí | — | `seo-prerender.test.jsx` |
| `/terminos-de-servicio` | sí | propio | propia | `https://sistema.dentissa.app/terminos-de-servicio` | sí | — | `seo-prerender.test.jsx` |
| `/login`, `/restablecer-contrasena`, `/admin/*`, `/paciente/*` | no (privadas) | — | — | — | no | — | `seo-prerender.test.jsx` (`app.html` con `noindex`) |
| 404 | no | "Página no encontrada" | — | — | no | — | `seo-prerender.test.jsx` (`404.html` con `noindex`) |

- Renderizado de las rutas nuevas: cambio de `spa` a `hybrid` (ADR 0009).
- Imagen para compartir: general, `og-dentissa.jpg` de 1200×630 hecha con el logo y la foto de portada.
- Brechas `SE` que atiende: SE1.a, SE1.b, SE2.a, SE2.b, SE3.a, SE3.b, SE4.a, SE5.a, SE5.b, SE6.a y SE7.a dentro; SE7.b fuera (sin logo vectorial).

## Rollout
- Feature flag: no aplica. Es el armazón del sitio, sin flujo de usuario nuevo; el rollback es
  volver a la imagen anterior del frontend.
- Orden de despliegue: solo el frontend (imagen de nginx con `dist` y `nginx.conf`); el backend no
  cambia.
- Compatibilidad: el backend y la API no cambian; las rutas privadas siguen sirviendo la SPA.
- Rollback: `git checkout <commit anterior>` y `docker compose … up -d --build` (`docs/deployment.md`).
  Sin datos que revertir.
- Métricas a vigilar tras el deploy: `/robots.txt` y `/sitemap.xml` con 200 y su tipo; una URL
  inexistente con 404; `/admin` con `noindex`; Lighthouse SEO 100 en producción; en Search Console,
  la cobertura de las seis páginas en los días siguientes.

## Decisiones (→ ADR si son arquitectónicas)
- **Cómo prerenderizar** → [ADR 0009](../../adr/0009-prerender-rutas-publicas.md). Opciones: plugin o
  navegador sin cabeza (dependencia nueva), meta-framework (reescritura), API de React 19 con
  `--ssr` de Vite (sin dependencias). Decisión: la última; comprobado con una prueba de concepto el
  2026-11-12 (las seis rutas y la 404 con su `h1` y contenido; detectó `window` en `api.js` y
  `fetchpriority` en `SmartImage.jsx`).
- **Hidratación:** `hydrateRoot` cuando `#root` trae contenido (rutas prerenderizadas) y
  `createRoot` en `app.html`, para no repintar la página.
- **`<head>` al navegar en el cliente:** un efecto en `Layout` actualiza título, descripción y
  canónica desde la tabla; el prerender los inyecta por texto, sin duplicarlos en el cuerpo.
- **Rutas privadas:** `app.html` con `noindex` en lugar de `Disallow` en `robots.txt`, para que el
  buscador pueda leer el `noindex`.
- **Íconos e imagen para compartir:** generados una vez con herramientas del sistema (PowerShell
  para redimensionar el favicon y Chrome sin cabeza para la imagen de 1200×630) y guardados en
  `public/`; sin dependencias.
- **Datos de la clínica:** provisionales de `site.js` (decisión del usuario, 2026-11-12), con la
  dirección separada para `PostalAddress` (decisión del usuario, 2026-11-12, /analyze A6); el
  JSON-LD se genera desde ahí y el build se detiene si el horario no se puede interpretar.
- **Prueba de nginx automática con Docker** en local y en el CI (decisión del usuario,
  2026-11-12, /analyze A2).
- **Entornos no productivos:** no existen públicamente (sin staging, `docs/deployment.md`); el entorno local no
  se publica. Si se crea staging, deberá llevar `noindex` (P19).
- **Correcciones de /analyze ronda 1:** A1–A12 aplicadas con `/plan --fix`.

## Impacto en arquitectura
- `docs/architecture.md`: renderizado del frontend (prerender de las rutas públicas y armazón SPA
  para las privadas), build en dos pasos y `nginx.conf` (T090).
- `.ai/project.yaml`: `seo.rendering: hybrid` (T090).
- `docs/seo.md`: reglas del sitio (renderizado, archivos generados, compartir, íconos) y estado de
  SE1–SE7 al liberar (`/release`).
- `docs/deployment.md`: sin cambios de pasos (el frontend se reconstruye como siempre).

## Riesgos y mitigaciones
- **Errores de hidratación** si el HTML prerenderizado y el del navegador difieren (p. ej. algo que
  depende de la hora o de `localStorage`). Mitigación: el prerender no llama a la API y las páginas
  públicas no leen `window` al pintar; el año del pie no rompe la hidratación; prueba automática de
  hidratación por ruta (CA13). React 19 se recupera repintando si ocurre.
- **Configuración de nginx**: un error dejaría rutas sin servir. Mitigación: verificación con el
  contenedor local antes de liberar (CA9, CA13) y rollback inmediato.
- **Datos provisionales** en el JSON-LD y en el sitio: los buscadores pueden mostrarlos hasta que se
  corrijan en `site.js` (pendiente operativo).
- **Build más largo** en CI y en el servidor: dos builds de Vite y el prerender (segundos).
