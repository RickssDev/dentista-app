---
spec: 022-sitio-indexable
plan: plan.md
impl_base: 720ed03
status: approved
---

# Tareas · 022 Sitio indexable

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- Lo generado por un comando cuenta como un archivo: `public/*.png (generado por <comando>)`.
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza.

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada tarea de implementación depende de su tarea de test, escrita antes; nginx con prueba automática | test: T010–T017 |
| P3 Dependencias nuevas con ADR | ➖ | Ninguna tarea añade dependencias; T025 solo cambia el script `build` | — |
| P4 Arquitectura con ADR | ✅ | ADR 0009 aceptado; T090 actualiza la arquitectura | manual: T090 |
| P5 Producción solo con aprobación humana | ✅ | T096 se mantiene | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; sin datos | manual: T096 |
| P7 Migraciones compatibles | ➖ | Sin esquema | — |
| P8 Autorización en el servidor | ➖ | Sin endpoints | — |
| P9 Entrada validada | ➖ | Sin entradas nuevas | — |
| P10 Secretos | ✅ | Solo variables `VITE_*` públicas en el build | test: gitleaks en CI |
| P11 Vulnerabilidades | ✅ | Sin dependencias nuevas | test: `npm audit` en T060 |
| P12 Modelo de amenazas | ✅ | TM1–TM3 con tarea de test y de control | manual: `/analyze` |
| P13–P15 | ➖ | Sin datos sensibles ni logs | — |
| P16 Accesibilidad | ✅ | Sin cambios visuales | test: suite del frontend en T060; manual: teclado en T060 |
| P17 Sin lógica en las vistas | ✅ | Metadatos y datos de la clínica en `src/seo/` | manual: `/review` |
| P18 Metadatos por ruta indexable | ✅ | Tabla única y prerender que falla sin metadatos | test: T010, T013; build: T025 |
| P19 Noindex fuera de lo público | ✅ | `app.html`, `404.html` y cabecera en nginx | test: T011, T013, T017 |
| P20 Sistema de diseño | ✅ | Sin estilos nuevos en pantallas; la plantilla de la imagen usa colores de los tokens | manual: `/review` |

## Preparación
- [x] T001 Separar `AppRoutes` de `App`, quitar el uso de `window` al cargar `api.js` (fuera del navegador, un origen fijo propio del módulo, sin depender de `seo/rutas.js`) y corregir `fetchPriority` — `frontend/src/App.jsx`, `frontend/src/services/api.js`, `frontend/src/components/home/SmartImage.jsx` — hecho cuando: `npm test --prefix frontend` y `npm run build --prefix frontend` pasan sin cambios de comportamiento (mismo árbol de rutas; `BASE_ORIGIN` igual en el navegador)
  - nota: suite del frontend 17/17 y build correctos; los 2 errores de lint de SmartImage.jsx son previos (mismo conteo antes del cambio)
- [x] T002 Medir la línea base de Lighthouse Rendimiento de la portada sobre la build actual — sin archivos — hecho cuando: el valor (Lighthouse 13.6.0 contra el contenedor de nginx del frontend actual, mismo equipo) queda anotado como nota de esta tarea
  - nota: añadida por /analyze A10 la medición con el mismo servidor que en T060
  - nota: línea base 2026-11-12: Lighthouse 13.6.0 contra la imagen de nginx del frontend actual (`docker run --add-host backend:127.0.0.1`, A14), portada, 3 corridas en este equipo: Rendimiento 62/75/75 (mediana 75), SEO 92, CLS 0, LCP 6.1–6.3 s
- [x] T003 Permitir suites en entorno node con el setup de pruebas — `frontend/tests/setup.js` — hecho cuando: las API simuladas del navegador solo se definen si hay `window`; la suite del frontend sigue en verde y un archivo con `// @vitest-environment node` arranca sin `ReferenceError`
  - nota: añadida por /analyze A1
  - nota: suite jsdom 17/17; un archivo con `// @vitest-environment node` arranca y ve `window` indefinido
- [x] T004 Ignorar `dist-ssr` y revisar `scripts/**/*.mjs` con globals de Node — `frontend/eslint.config.js`, `frontend/.gitignore` — hecho cuando: `npm run lint --prefix frontend` no revisa `dist-ssr` y sí `scripts/*.mjs` sin errores de globals; `git check-ignore frontend/dist-ssr` lo ignora
  - nota: añadida por /analyze A12
  - nota: `dist-ssr` ignorado por ESLint y git; un `scripts/*.mjs` de prueba acepta `process` y marca una variable indefinida

## Tests (antes de implementar)
- [x] T010 [P] Escribir las pruebas de la tabla de rutas públicas — `frontend/tests/seo-rutas.test.js` — hecho cuando: falla por la razón esperada (el módulo no existe) y comprueba: exactamente las seis rutas públicas; títulos únicos que contienen "Dentissa"; descripciones únicas de 70–160 caracteres; canónica `https://sistema.dentissa.app<ruta>` sin barra final (la portada `https://sistema.dentissa.app/`); las rutas privadas no están en la tabla — cubre: CA3, CA4
  - nota: falla por la razón esperada (`seo/rutas.js` no existe)
- [x] T011 [P] Escribir las pruebas de `robots.txt` y `sitemap.xml` — `frontend/tests/seo-archivos.test.js` — hecho cuando: falla por la razón esperada y comprueba: robots con `User-agent: *`, `Allow: /`, `Sitemap:` absoluto y sin `Disallow` de rutas privadas; sitemap XML válido con exactamente las seis URL absolutas y ninguna privada ni de error — cubre: CA5, CA6, CA8
  - nota: falla por la razón esperada (`seo/archivos.js` no existe)
- [x] T012 [P] Escribir las pruebas de los datos de la clínica (JSON-LD) — `frontend/tests/seo-negocio-local.test.js` — hecho cuando: falla por la razón esperada y comprueba: el JSON-LD es JSON válido; `@type` `Dentist` con nombre, URL, `image` absoluta, teléfono, `address` `PostalAddress` con `streetAddress`, `addressLocality`, `addressRegion`, `postalCode` y `addressCountry` desde `CLINIC.direccion`, y horario (lunes a viernes 08:00–16:00, sábado 08:00–14:00, domingo sin horario) desde `HOURS`; un horario no interpretable lanza un error; un valor con `</script>` sale escapado y no cierra la etiqueta — cubre: CA7
  - nota: falla por la razón esperada (`seo/negocioLocal.js` no existe)
- [x] T013 [P] Escribir las pruebas del prerender y de la página generada (entorno node) — `frontend/tests/seo-prerender.test.jsx` — hecho cuando: falla por la razón esperada y comprueba: cada ruta pública renderiza su `h1` y textos propios; `construirPagina` pone en el `<head>` el título, la descripción, la canónica, `og:title`, `og:description`, `og:url`, `og:image` absoluta y `twitter:card`; la portada lleva el JSON-LD; `app.html` y `404.html` llevan `noindex` y no llevan canónica, Open Graph ni JSON-LD; `construirPagina` añade los `<link rel="stylesheet">` que recibe para la ruta; cada página tiene `lang="es"`, `viewport`, imágenes con `alt` y enlaces con `href` rastreable y texto; ningún HTML generado contiene textos de login, panel ni portal del paciente — cubre: CA1, CA2, CA3, CA4, CA7, CA8, CA10, CA11 — depende: T003
  - nota: falla por la razón esperada (`entry-prerender.jsx` no existe); corre en entorno node gracias a T003
  - nota: A16 — comprueba con un manifiesto de Vite de prueba que `estilosDeRuta` da el CSS del chunk y sus importaciones, que `construirPagina` lo enlaza en el <head> y que /nosotros, /galeria y /contacto declaran su módulo; el CSS real de cada ruta lo vigila además la guarda del build (T025)
- [x] T014 [P] Escribir las pruebas de los íconos y de la imagen para compartir — `frontend/tests/seo-recursos.test.js` — hecho cuando: falla por la razón esperada y comprueba, leyendo las cabeceras de los archivos: `favicon-32.png` 32×32, `apple-touch-icon.png` 180×180, `icon-192.png` 192×192, `icon-512.png` 512×512, `og-dentissa.jpg` 1200×630; `index.html` enlaza los íconos — cubre: CA11, CA12
  - nota: falla por la razón esperada (los íconos y la imagen no existen)
- [x] T015 [P] Escribir la prueba de los metadatos al navegar en el cliente — `frontend/tests/seo-metadatos.test.jsx` — hecho cuando: falla por la razón esperada y comprueba que al pasar de `/` a `/nosotros` en el router cambian `document.title`, la descripción y la canónica a las de la tabla — cubre: CA3, CA13
  - nota: falla por la razón esperada (`Metadatos.jsx` no existe)
- [x] T016 [P] Escribir la prueba de hidratación de las páginas prerenderizadas — `frontend/tests/seo-hidratacion.test.jsx` — hecho cuando: falla por la razón esperada (no existe `entry-prerender`) y comprueba que el HTML prerenderizado de cada ruta pública se hidrata con `hydrateRoot` sin errores recuperables ni de hidratación, también con el reloj simulado en otro año; ejecutada dos veces — cubre: CA13 — depende: T003
  - nota: añadida por /analyze A4
  - nota: falla por la razón esperada (`entry-prerender.jsx` no existe)
  - nota: el HTML se genera en un proceso aparte con `tests/support/prerenderizar.mjs` (Vite `ssrLoadModule`): prerenderizar e hidratar en el mismo proceso deja el contexto del enrutador del servidor en el cliente ("Router inside Router"), cosa que no ocurre en el build real. Con eso, las seis rutas hidratan sin errores y "otro año" falla por la razón esperada (2026 frente a 2027 en el pie)
- [x] T017 [P] Escribir la prueba automática de nginx con Docker — `frontend/scripts/probar-nginx.mjs` — hecho cuando: construye la imagen del frontend, la levanta en un puerto local, la detiene al terminar y comprueba: las seis rutas públicas → 200 sin redirección; `/nosotros/` → 301 con `Location: /nosotros` en un salto; `/no-existe` → 404 con "Página no encontrada"; `/robots.txt` → `text/plain`; `/sitemap.xml` → XML; `/login`, `/admin` y `/paciente` → 200 con `X-Robots-Tag: noindex`; `/favicon.jpeg`, un `/assets/*` y `/images/hero-dentissa.webp` → 200; contra la imagen actual falla por la razón esperada (`/no-existe` → 200) — cubre: CA5, CA8, CA9, CA13
  - nota: añadida por /analyze A2, A3
  - nota: contra la imagen actual fallan las 13 comprobaciones nuevas por la razón esperada (sin HTML propio, `/no-existe` → 200, sin robots/sitemap ni noindex); las 3 de regresión (favicon, imágenes, assets) pasan
  - nota: A14 — la imagen se levanta con `--add-host backend:127.0.0.1` para que nginx resuelva el upstream sin backend real

## Implementación
- [x] T020 Crear la tabla de rutas públicas y la canónica — `frontend/src/seo/rutas.js` — hecho cuando: T010 pasa — cubre: CA3, CA4 — depende: T010
  - nota: T010 pasa (5/5)
- [x] T021 Generar `robots.txt` y `sitemap.xml` desde la tabla — `frontend/src/seo/archivos.js` — hecho cuando: T011 pasa — cubre: CA5, CA6, CA8 — depende: T011, T020
  - nota: T011 pasa
- [x] T022 Generar el JSON-LD de la clínica desde `site.js`, con el escape de `</script>` — `frontend/src/seo/negocioLocal.js` — hecho cuando: T012 pasa · comprobado rompiendo el escape — cubre: CA7 — depende: T012, T030
  - nota: T012 pasa (6/6). Comprobado rompiendo: sin escapar `<`, el caso TM3 falla; restaurado pasa
  - nota: corregida la aserción de T012 que buscaba el texto escapado: el archivo tenía `\u003c` interpretado por JavaScript como `<`; ahora construye la barra invertida con `String.fromCharCode(92)` (no debilita la prueba: exige el texto escapado literal)
- [x] T023 Construir la página: cuerpo en `#root` y metadatos, Open Graph, `robots` y JSON-LD en el `<head>`, con atributos escapados — `frontend/src/seo/cabecera.js` — hecho cuando: los casos de `construirPagina` de T013 pasan — cubre: CA3, CA4, CA7, CA8, CA11 — depende: T013, T020, T022
  - nota: los casos de `construirPagina` de T013 pasan (T013 completo 32/32). Comprobado rompiendo: sin el meta `noindex`, fallan los casos de `app.html` y `404.html`; restaurado pasan
  - nota: ajustada la comprobación de enlaces de T013 al cálculo de Lighthouse: el nombre accesible de un enlace incluye el `alt` de su imagen (el logo); no la debilita
- [x] T024 Crear la entrada de prerender con `StaticRouter` y `prerenderToNodeStream` — `frontend/src/entry-prerender.jsx` — hecho cuando: los casos de render de T013 pasan (incluido CA10) · comprobado rompiendo: prerenderizar `/login` hace fallar el caso de textos privados — cubre: CA2, CA10 — depende: T001, T013
  - nota: los casos de render de T013 pasan, incluido CA10. Comprobado rompiendo: prerenderizar `/login` produce los textos privados que T013 detecta
  - nota: `StaticRouter` se importa de `react-router-dom` (el mismo paquete que la app); desde `react-router` las pruebas cargaban dos copias del enrutador. Se usa `prerender` (flujos web) en lugar de `prerenderToNodeStream` para correr igual en Node y en jsdom
- [x] T025 Escribir el script de prerender e integrarlo en el build — `frontend/scripts/prerender.mjs`, `frontend/package.json`, `frontend/vite.config.js` — hecho cuando: `npm run build --prefix frontend` genera `dist/index.html`, `dist/<ruta>/index.html` para las otras cinco, `dist/404.html`, `dist/app.html`, `dist/robots.txt` y `dist/sitemap.xml`; cada página enlaza el CSS de su ruta según el manifiesto de Vite; el build falla si una ruta no tiene `h1`, título, descripción de 70–160, canónica o su CSS (comprobado rompiendo una descripción) — cubre: CA1, CA2, CA5, CA6, CA8, CA10 — depende: T004, T021, T023, T024
  - nota: A5 (CSS por ruta) añadido por /analyze
  - nota: `npm run build` genera las seis páginas, `404.html`, `app.html` (`noindex`), `robots.txt` y `sitemap.xml`; /nosotros, /galeria y /contacto enlazan su CSS sin repetir el de la plantilla. Comprobado rompiendo: una descripción corta detiene el build con "Prerender incompleto"
  - nota: el manifiesto de Vite (`dist/.vite`) se borra tras el prerender para no publicarlo; volver a ejecutar el script sin build avisa en lugar de duplicar contenido
- [ ] T026 Hidratar el HTML prerenderizado y actualizar los metadatos al navegar — `frontend/src/main.jsx`, `frontend/src/components/home/Metadatos.jsx`, `frontend/src/components/home/Layout.jsx` — hecho cuando: T015 y T016 pasan (T016 ejecutada dos veces) y la suite del frontend sigue en verde — cubre: CA3, CA13 — depende: T015, T016, T020, T025, T031
- [ ] T027 Generar los íconos PNG desde el favicon y enlazarlos — `frontend/public/*.png (generado por PowerShell System.Drawing desde favicon.jpeg)`, `frontend/index.html` — hecho cuando: la parte de íconos de T014 pasa — cubre: CA12 — depende: T014
- [ ] T028 Crear la imagen para compartir de 1200×630 — `frontend/scripts/og/plantilla.html`, `frontend/public/og-dentissa.jpg (generado por Chrome sin cabeza desde la plantilla)` — hecho cuando: la parte de la imagen de T014 pasa · verificación manual: la imagen muestra el logo y la foto de portada, legible y sin recortes raros — cubre: CA11 — depende: T014
- [ ] T029 Servir cada archivo por su ruta, `noindex` en las privadas y 404 real en nginx — `frontend/nginx.conf` — hecho cuando: `node frontend/scripts/probar-nginx.mjs` pasa (T017) · comprobado rompiendo la regla del 404 · verificación manual: `/api/*` y `/uploads/*` siguen respondiendo con el backend levantado — cubre: CA5, CA8, CA9 — depende: T017, T025
- [x] T030 Separar la dirección de la clínica para los buscadores — `frontend/src/data/site.js` — hecho cuando: `CLINIC.direccion` tiene `calle`, `ciudad`, `estado`, `codigoPostal` y `pais` con los valores provisionales actuales; `CLINIC.address` se arma desde ellos y el sitio la muestra igual; la suite del frontend sigue en verde — cubre: CA7 — depende: T012
  - nota: añadida por /analyze A6
  - nota: `CLINIC.address` se arma desde `CLINIC.direccion` y queda idéntica; las 17 pruebas previas siguen en verde (los fallos restantes son solo las suites de SEO pendientes)
- [ ] T031 Evitar que el año del pie rompa la hidratación — `frontend/src/components/home/Footer.jsx` — hecho cuando: el caso "otro año" de T016 pasa con el resto del HTML prerenderizado — cubre: CA13 — depende: T016
  - nota: añadida por /analyze A4
- [ ] T032 Ejecutar la prueba de nginx en el CI — `.github/workflows/ai-dd.yml` — hecho cuando: el workflow ejecuta `node frontend/scripts/probar-nginx.mjs` en cada PR y el job queda en verde en el PR de esta spec — cubre: CA9 — depende: T029
  - nota: añadida por /analyze A2 (ruta protegida, tarea aprobada)

## Integración y documentación
- [ ] T060 Verificar el sitio completo — sin archivos — hecho cuando: `npm test` en verde; lint sin errores nuevos en los archivos tocados; `npm run build` correcto; `npm audit --audit-level=high` sin altas ni críticas · verificación manual con el contenedor local: Lighthouse 13.6.0 SEO = 100 en las seis rutas, con el resultado anotado por ruta (CA1); Rendimiento de la portada igual o mayor que la línea base de T002, con el mismo contenedor (RNF); login, paneles y contacto funcionan como antes (CA13); teclado en la portada y el menú (RNF) — cubre: CA1, CA13 — depende: T022, T025, T026, T027, T028, T029, T032
- [ ] T090 Actualizar `docs/architecture.md` (renderizado del frontend, build en dos pasos, `nginx.conf`) y `.ai/project.yaml` (`seo.rendering: hybrid`)
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: el plan no cambia ninguno (el frontend se reconstruye como siempre); registrar "sin cambios" al cerrar
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones manuales se hacen con el contenedor local (T029, T060)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - `/seo verify` en producción: robots, sitemap, 404, `noindex`; Lighthouse SEO 100 en producción
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T013, T060 | T020, T021, T023, T025, T029 |
| CA2 | T013 | T024, T025 |
| CA3 | T010, T013, T015 | T020, T023, T026 |
| CA4 | T010, T013 | T020, T023 |
| CA5 | T011, T017 | T021, T025, T029 |
| CA6 | T011 | T021, T025 |
| CA7 | T012, T013 | T022, T023, T030 |
| CA8 | T011, T013, T017 | T021, T023, T025, T029 |
| CA9 | T017 | T029, T032 |
| CA10 | T013 | T024, T025 |
| CA11 | T013, T014 | T023, T028 |
| CA12 | T014 | T027 |
| CA13 | T015, T016, T017, T060 | T026, T031 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T024, T025 | T013 |
| TM2 | T023, T025, T029 | T011, T013, T017 |
| TM3 | T022, T023 | T012 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `frontend/src/seo/rutas.js` | T020 |
| `frontend/src/seo/archivos.js` | T021 |
| `frontend/src/seo/negocioLocal.js` | T022 |
| `frontend/src/seo/cabecera.js` | T023 |
| `frontend/src/entry-prerender.jsx` | T024 |
| `frontend/scripts/prerender.mjs`, `package.json`, `vite.config.js` | T025 |
| `frontend/tests/setup.js` | T003 |
| `frontend/eslint.config.js`, `.gitignore` | T004 |
| `frontend/src/data/site.js` | T030 |
| `frontend/src/components/home/Footer.jsx` | T031 |
| `frontend/scripts/probar-nginx.mjs` | T017 |
| `.github/workflows/ai-dd.yml` | T032 |
| `frontend/src/App.jsx`, `services/api.js`, `SmartImage.jsx` | T001 |
| `frontend/src/main.jsx`, `Metadatos.jsx`, `Layout.jsx` | T026 |
| `frontend/index.html`, `frontend/public/*.png` | T027 |
| `frontend/scripts/og/plantilla.html`, `public/og-dentissa.jpg` | T028 |
| `frontend/nginx.conf` | T029 |
| `frontend/tests/seo-*.test.js(x)` | T010, T011, T012, T013, T014, T015, T016 |
| `docs/architecture.md`, `.ai/project.yaml` | T090 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Descubribilidad | T010, T011, T013 |
| Rendimiento no empeora | T013 (CSS por ruta), T002 (línea base), T060 (verificación manual) |
| Accesibilidad sin regresiones | T060 (suite y teclado) |
