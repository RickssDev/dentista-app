---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-12
spec_sha: fc435c5d193d
plan_sha: 73a2a3d4783d
tasks_sha: 73958f819dcd
---

# Análisis · 022 Sitio indexable

## Resumen
Sin críticos. Dos altos que el usuario decidió corregir: las suites en entorno node no arrancan con
el `setup.js` actual (A1) y lo de nginx solo se verifica a mano, contra P2 (A2). Seis medios y cinco
bajos, todos con corrección localizada en spec, plan o tareas.
Conteo: CRÍTICA 0 · ALTA 2 · MEDIA 6 · BAJA 5

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 11 / 13 (CA1 y CA9 solo manuales) |
| Amenazas con control y test | 3 / 3 (TM2 parcial: `X-Robots-Tag` manual) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Realizabilidad | ALTA | T010–T013; `frontend/vitest.config.js`, `frontend/tests/setup.js` | `setup.js` ejecuta `window.scrollTo = …` al cargar; en entorno node lanza `ReferenceError` y las suites fallan antes de empezar. Ninguna tarea lo toca | Las suites en entorno node arrancan sin `window` (test: T013 falla solo porque `entry-prerender` no existe) — `/plan --fix A1`, `/tasks --fix A1` |
| A2 | Constitución P2 | ALTA | Trazabilidad CA8/CA9; T029 | 404 real, 301 de la barra final, `X-Robots-Tag` y tipo de `robots.txt` solo con verificación manual | Prueba automática sobre el contenedor del frontend, en local y en CI (decisión del usuario, 2026-11-12) — `/plan --fix A2`, `/tasks --fix A2` |
| A3 | Realizabilidad | MEDIA | `nginx.conf`; T029 | Con `dist/nosotros/` nginx puede redirigir `/nosotros` → `/nosotros/` y chocar con la regla contraria (bucle); detrás de Caddy, un `Location` absoluto saldría con `http://` | `/nosotros` → 200 sin redirección; `/nosotros/` → 301 en un salto hacia la ruta sin barra (test: la prueba de nginx de A2) |
| A4 | Hidratación / CA13 | MEDIA | `Footer.jsx:71`; plan "Riesgos" | `new Date().getFullYear()` difiere entre build y navegador al cambiar el año: React repinta la raíz. El plan no exige el mismo árbol de providers en el prerender | Hidratar el HTML prerenderizado de cada ruta sin errores recuperables, también con otro año (test automático) |
| A5 | Rendimiento / CA13 | MEDIA | `About.jsx`, `Gallery.jsx`, `Contact.jsx` | Su CSS va en chunks lazy: el HTML prerenderizado se pinta sin estilos un momento (CLS) | El HTML de cada ruta enlaza todo su CSS (test sobre la página construida; CLS en Lighthouse) |
| A6 | Ambigüedad CA7 | MEDIA | T012; `site.js` | Dirección en un solo texto y horario en texto libre: insuficiente para la ficha enriquecida; parseo frágil | `PostalAddress` con campos separados en `site.js` (decisión del usuario, 2026-11-12); T012 valida el JSON y un horario mal escrito — `/specify --edit`, `/plan --fix A6`, `/tasks --fix A6` |
| A7 | Riesgos SE7 | MEDIA | spec "Cobertura de riesgos"; plan | SE7.a "dentro" aunque `favicon.svg` queda fuera | Separar: PNG dentro y SVG fuera, con destino en `docs/seo.md` — `/specify --edit` |
| A8 | Cobertura CA1 | MEDIA | Trazabilidad CA1; T060 | Lighthouse SEO 100 solo a mano; enlaces rastreables, `alt` y código HTTP sin test | Las comprobaciones de Lighthouse SEO que el código puede romper con test automático; Lighthouse manual registrado por ruta |
| A9 | Orden | BAJA | T001 frente a T020 | T001 usaría `SITIO` de `rutas.js`, que nace en T020 | `api.js` no depende de `rutas.js` |
| A10 | RNF | BAJA | T002 frente a T060 | Línea base con `vite preview`, después con nginx | Medir antes y después con el mismo servidor |
| A11 | P19 | BAJA | T013 | No se comprueba que `app.html` y `404.html` vayan sin canónica, Open Graph ni JSON-LD; entornos no productivos sin decidir | Añadirlo a T013; registrar que no hay entornos no productivos públicos (RD4) |
| A12 | Lint | BAJA | `eslint.config.js` | No ignora `dist-ssr`; `scripts/*.mjs` sin globals de Node ni revisión | Los archivos nuevos pasan lint con globals de Node |
| A13 | Extends 017 | BAJA | spec 022 | No declara que resuelve 017 CA6 ni que modifica 017 CA5 (404 real) | Declararlo en la spec — `/specify --edit` |

## Decisiones pendientes del usuario
Resueltas el 2026-11-12:
- A2: prueba automática de nginx con Docker, en local y en CI.
- A6: dirección separada en `site.js` para `PostalAddress`.

## Aceptados
Ninguno: se corrigen todos en esta vuelta.
