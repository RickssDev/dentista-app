---
spec: 022-sitio-indexable
verdict: changes_requested
round: 1
date: 2026-11-12
base: 720ed03
head: 17efa2e
human_signoff: pending
---

# Review · 022 Sitio indexable

## Resumen
El objetivo se cumple: SEO = 100 en las seis páginas públicas, la página se prerenderiza, y robots,
sitemap, JSON-LD, la 404 real y el `noindex` de las privadas funcionan. Queda un bloqueante de
accesibilidad: el título se queda viejo al navegar a la 404 o a una ruta privada (WCAG 2.4.2).
Hay además varios importantes: un open redirect en nginx, el contenido de la portada y de contacto
oculto en el HTML prerenderizado, y huecos en las pruebas que dejarían pasar regresiones.
Conteo: bloqueante 1 · importante 8 · menor 14

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 256 + 5 `todo`; frontend 78/78 (13 archivos). Las pruebas `seo-*`, 61, en dos ejecuciones |
| `npm run lint --prefix frontend` (archivos tocados) | ✅ limpio; el total del repo baja de 15 a 13 por la corrección de `SmartImage` |
| `npm run build --prefix frontend` | ✅ con prerender (CI verde en 17efa2e) |
| `node scripts/probar-nginx.mjs` | ✅ 16 comprobaciones (CI) |
| `aidd.py validate docs/specs/022-sitio-indexable` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | Lighthouse 13.6.0 manual (T060) · `seo-prerender.test.jsx` (subconjunto) | ✅ | 100 en las seis rutas. La prueba automática cubre solo una parte de la auditoría (R20) |
| CA2 | `seo-prerender.test.jsx` | ⚠ | El `<h1>` existe, pero en la portada y en contacto queda en `<div hidden>`, fuera de `<main>` (R3) |
| CA3 | `seo-rutas.test.js`, `seo-prerender.test.jsx` | ✅ | |
| CA4 | `seo-prerender.test.jsx` | ✅ | Falta comprobar que haya una sola canónica (R7) |
| CA5 | `seo-archivos.test.js`, `probar-nginx` | ✅ | |
| CA6 | `seo-archivos.test.js`, `probar-nginx` | ✅ | |
| CA7 | `seo-negocio-local.test.js` | ✅ | `<` escapado; horario y dirección correctos |
| CA8 | `seo-prerender.test.jsx`, `probar-nginx` | ⚠ | No prueba `/restablecer-contrasena` ni rutas anidadas (R5) |
| CA9 | `probar-nginx` | ✅ | |
| CA10 | `seo-prerender.test.jsx` | ✅ | Sin `localhost` ni texto privado en el HTML |
| CA11 | `seo-prerender.test.jsx`, `seo-recursos.test.js` | ✅ | |
| CA12 | `seo-recursos.test.js`, `probar-nginx` | ✅ | |
| CA13 | `seo-hidratacion.test.jsx` · verificación manual del usuario | ⚠ | Título viejo al navegar en el cliente (R1). El filtro de la prueba de hidratación oculta errores recuperables (R6) |

## Conformidad con el plan
- Cambios fuera del plan: `SmartImage.jsx`, una corrección de lint sin cambio de comportamiento que exigió el CI (nota en tasks.md). Ninguno más.
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P3 dependencias | ✅ | Sin paquetes nuevos: `react-dom/static` y `StaticRouter` ya estaban |
| P4 ADR | ✅ | `docs/adr/0009-prerender-rutas-publicas.md` |
| P18 metadatos por ruta | ✅ | `seo-prerender.test.jsx` falla si falta el título, la descripción o la canónica |
| P19 privadas fuera del índice | ✅ | `app.html` y `404.html` con `noindex`; `X-Robots-Tag` en las privadas (`probar-nginx`) |
| P20 tokens de diseño | ✅ | `scripts/og/plantilla.html` usa `--primary-700` |
| WCAG AA | ❌ | Título de página incorrecto al navegar a la 404 o a privadas (R1) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| gitleaks (CI) | ✅ 0 hallazgos |
| SCA (`npm audit --audit-level=high`) | ✅ sin altas ni críticas; el PR no cambia lockfiles |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01 Control de acceso | ✅ | El prerender no incluye datos privados (CA10). Las privadas siguen protegidas por la API |
| A03 Inyección (XSS en JSON-LD) | ✅ | `serializarJsonLd` escapa `<` (`seo-negocio-local.test.js`) |
| A05 Configuración (nginx) | ❌ | Open redirect con `/%5Cevil.com/` → `Location: /\evil.com` (R2, reproducido en local) |
| A05 Cabeceras de seguridad | ➖ | No hay ninguna; deuda previa, no la introduce esta spec (R22) |

## Observabilidad
- Eventos de auditoría de la spec: no aplica (sin datos sensibles ni acciones del personal).
- Datos sensibles en logs del código tocado: ninguno; los scripts de build solo registran rutas.
- `request_id`: no aplica (sin logs de la API nuevos).

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| 1. Contenido sin JavaScript | ⚠ | `dist/index.html` y `dist/contacto/index.html` con `<template id="B:0">` y el contenido en `<div hidden id="S:0">` (R3) |
| 2. Códigos de estado y 404 | ✅ | `/no-existe` responde 404 con la página propia; `/nosotros/` hace 301 a `/nosotros` |
| 3. Indexación y canónica | ✅ | Canónica absoluta por ruta; `noindex` solo en privadas, `app.html` y 404 |
| 4. robots y sitemap | ✅ | `robots.txt` sin `Disallow`, `Sitemap` absoluto; sitemap con las seis rutas |
| 5. Títulos y descripciones | ✅ | Propios en cada ruta |
| 6. Datos estructurados | ✅ | `Dentist` con `PostalAddress` y horario |
| 7. Vista previa al compartir | ✅ | `og:image` absoluta de 1200×630. Falta `og:image:alt` (R16) |
| 12. Íconos | ✅ | PNG de 32, 180, 192 y 512 |
- Sección "Descubribilidad" del plan aplicada: sí, en las seis rutas públicas.

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | bloqueante | frontend/src/components/home/Metadatos.jsx:24 | Al navegar en el cliente a una ruta fuera de la tabla, se quedan el título y la canónica de la página anterior. Ejemplos: la 404 dentro del Layout, y `/login`, donde Metadatos se desmonta. `/nosotros` → "Agendar cita" → `/login` sigue con el título "Nosotros". Incumple WCAG 2.4.2 y es una regresión de CA13 | Sin datos en la ruta: título "Página no encontrada \| Dentissa" en la 404 y el título por defecto al salir del Layout (limpieza del efecto); quitar la canónica. Con prueba en `seo-metadatos.test.jsx` |
| R2 | importante | frontend/nginx.conf:27-28 | Open redirect: `GET /%5Cevil.com/` → `301 Location: /\evil.com`, y el navegador lo trata como `//evil.com`. Reproducido en el contenedor local | Limitar la captura a caracteres seguros de ruta y añadir el caso a `probar-nginx.mjs` |
| R3 | importante | frontend/src/entry-prerender.jsx:8 · frontend/tests/seo-prerender.test.jsx:28 | En la portada y en contacto, el hero y el `<h1>` salen en `<div hidden>` después del footer, y dentro de `<main>` queda solo el loader. Sin JavaScript la página parece vacía (contra la intención de CA2), y puede retrasar el LCP. El test no lo detecta | Que el prerender espere todo el contenido (sin límites de Suspense pendientes). Que el test exija el `<h1>` dentro de `<main>` y la ausencia de `<div hidden id="S:` y de `$RC(` |
| R4 | importante | frontend/nginx.conf:28 | `return 301 $1` pierde la query string: `/contacto/?utm=1` → `/contacto` | `return 301 $1$is_args$args;` y un caso en `probar-nginx.mjs` |
| R5 | importante | frontend/scripts/probar-nginx.mjs:53 · frontend/src/seo/rutas.js:52 | `noindex` se prueba solo en `/login`, `/admin` y `/paciente`, sin `/restablecer-contrasena` ni rutas anidadas. `RUTAS_NO_INDEXABLES` solo la usa un test que se compara consigo mismo | Que `probar-nginx` recorra `RUTAS_NO_INDEXABLES` más `/admin/usuarios` y `/paciente/perfil` |
| R6 | importante | frontend/tests/seo-hidratacion.test.jsx:53 | El filtro por regex descarta los errores de `onRecoverableError` que no digan hydrat/mismatch. Por ejemplo, "Switched to client rendering" pasaría | Que cualquier `onRecoverableError` haga fallar el test |
| R7 | importante | frontend/scripts/prerender.mjs:48 · frontend/src/seo/cabecera.js:59-61 | La guarda del build valida la tabla, no el HTML. Si la regex de la plantilla deja de casar, se publica la descripción genérica sin error, y no se comprueba que haya una sola canónica | `construirPagina` lanza un error si no reemplaza el título o la descripción; la guarda lee el HTML final y exige una sola canónica |
| R8 | importante | frontend/nginx.conf:33-38 · frontend/src/App.jsx · frontend/scripts/probar-nginx.mjs:30 | La lista de rutas públicas está copiada en la tabla, nginx, App.jsx y `probar-nginx`, y nada detecta si se separan: una ruta nueva sin su `location =` da 404 en producción | `probar-nginx` importa `RUTAS_PUBLICAS`, y un test compara los `location =` de `nginx.conf` con la tabla |
| R9 | importante | docs/seo.md | Las rutas privadas responden 200 con `noindex`, una decisión del plan que `seo.md` no registra como exclusión deliberada | Añadirla a "Exclusiones deliberadas" con su motivo |
| R10 | menor | frontend/src/seo/cabecera.js:59,61,77 | `String.replace` con cadena interpreta `$&`, `` $` `` y `$'` del contenido | Usar una función como reemplazo |
| R11 | menor | frontend/scripts/prerender.mjs:57-66 | `404.html` no pasa por la guarda (h1, título, CSS) | Aplicarle `exigir` |
| R12 | menor | frontend/nginx.conf:46-48 | `/index.html`, `/nosotros/index.html` y `/app.html` responden 200 (la canónica evita el duplicado) | Redirigir o dar 404 |
| R13 | menor | frontend/nginx.conf:46-48 | `/Nosotros` ahora da 404; antes la SPA lo servía | Documentarlo en `seo.md` |
| R14 | menor | frontend/tests/seo-hidratacion.test.jsx:40-46 | Hidrata `MemoryRouter + AppRoutes`, no el árbol de `main.jsx` | Compartir el árbol raíz con el test |
| R15 | menor | frontend/tests/seo-metadatos.test.jsx:15 | Solo prueba `/` → `/nosotros` | Se cubre con la prueba de R1 |
| R16 | menor | frontend/src/seo/cabecera.js · docs/seo.md | Sin `og:image:alt`; `twitter:card` no está en `seo.md` | Añadir ambos |
| R17 | menor | Footer, Header, index.html, public/ | Salto de encabezados a h3 en el footer, logo sin `width`/`height`, `theme-color` distinto del token, `vite.svg` publicado | Spec de rendimiento o deuda de diseño |
| R18 | menor | frontend/scripts/prerender.mjs:26,42 | Lógica de `estilosNuevos` repetida, y los dos scripts tienen estilos distintos | Reutilizar la función y unificar el estilo |
| R19 | menor | frontend/eslint.config.js:54 | `tests/support/*.mjs` sin reglas de lint | Patrón `{scripts,tests}/**/*.mjs` |
| R20 | menor | frontend/tests/seo-prerender.test.jsx:98 | El nombre "comprobaciones de Lighthouse SEO" promete más de lo que cubre | Renombrarlo a "subconjunto" |
| R21 | menor | frontend/scripts/probar-nginx.mjs:67-79 | Puerto ocupado o build fallido sin mensaje propio | Mensaje claro y `exit(1)` |
| R22 | menor | frontend/nginx.conf | Sin cabeceras de seguridad, y `add_header` en la ubicación privada anula las del server. Deuda previa | Roadmap (seguridad) |
| R23 | menor | Layout, PageLoader, galería | Accesibilidad previa: foco al navegar en la SPA, texto del loader, `aria-hidden` del skeleton | Roadmap (accesibilidad) |

## Preparación para release
- Rollback factible: sí. Basta reconstruir el frontend con el tag anterior; no hay migraciones ni cambios en la API.
- Migraciones compatibles: no hay.
- Docs actualizadas: `architecture.md` (T090), `deployment.md` y `observability.md` sin cambios (T091), ADR 0009 y `seo.md`.

## Tareas añadidas
Decisión del usuario (2026-11-12): corregir el bloqueante, los importantes y los menores baratos.
- T033 ← R1, R15
- T034 ← R3, R7, R20
- T035 ← R2, R4, R5, R8
- T036 ← R5, R8
- T037 ← R6
- T038 ← R7, R10, R11, R16
- T040 ← R1
- T041 ← R3
- T042 ← R2, R4
- T043 ← R7, R10, R11, R16
- T044 ← R9, R16, R19

## Aceptados sin tarea
- **R12** → roadmap: `/index.html`, `/<ruta>/index.html` y `/app.html` responden 200 (la canónica evita el duplicado)
- **R13** → roadmap: las rutas con mayúsculas (`/Nosotros`) dan 404; documentarlo o redirigirlas
- **R14** → roadmap: la prueba de hidratación no usa el árbol raíz de `main.jsx`
- **R17** → roadmap: salto a h3 en el footer, logo sin `width`/`height`, `theme-color` fuera de los tokens, `vite.svg` publicado (spec de rendimiento o deuda de diseño)
- **R18** → roadmap: lógica de `estilosNuevos` repetida y estilos distintos entre los scripts de `frontend/scripts`
- **R21** → roadmap: `probar-nginx.mjs` sin mensaje propio con el puerto ocupado
- **R22** → roadmap: sin cabeceras de seguridad en nginx; `add_header` en la ubicación privada anula las del server
- **R23** → roadmap: accesibilidad previa (foco al navegar en la SPA, texto del loader, `aria-hidden` del skeleton)
