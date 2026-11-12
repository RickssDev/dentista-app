---
result: pass
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-12
spec_sha: 8eddad670fa3
plan_sha: 08df3f652f69
tasks_sha: 093ab24c6b35
---

# Análisis · 022 Sitio indexable

## Resumen
Los trece hallazgos de la ronda 1 quedaron resueltos (A2 y A12 con un efecto nuevo menor). La
revisión delta, con subagente porque el diff superaba ~30 KB, encontró un hallazgo medio y cuatro
bajos de realización de tareas, que el usuario aceptó como notas para `/implement`. Resultado
`pass`.
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 1 · BAJA 4

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 13 / 13 |
| Amenazas con control y test | 3 / 3 |
| Principios de la constitución evaluados | 20 / 20 (ronda 1; sin cambio de versión) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto | T003 (`setup.js` solo con `window`); T013 y T016 dependen de T003 |
| A2 | ALTA | resuelto con efecto nuevo (→ A14, A15) | T017 (`probar-nginx.mjs`) y T032 (CI) |
| A3 | MEDIA | resuelto | Plan: `location =` exactos y `absolute_redirect off`; T017 prueba 200 sin redirección y 301 en un salto |
| A4 | MEDIA | resuelto (→ A17) | T016 con otro año; T031 en el pie |
| A5 | MEDIA | resuelto parcialmente (→ A16) | T025 enlaza el CSS por ruta y la guarda del build |
| A6 | MEDIA | resuelto | T030 (`site.js`), T012 (`PostalAddress`, JSON válido, horario no interpretable); CA7 |
| A7 | MEDIA | resuelto | SE7.b fuera en spec, plan, `docs/seo.md` y roadmap |
| A8 | MEDIA | resuelto | T013 (comprobaciones de Lighthouse SEO sobre el HTML), T017, T060 registrado por ruta |
| A9 | BAJA | resuelto | T001 sin dependencia de `seo/rutas.js` |
| A10 | BAJA | resuelto | T002 y T060 con el mismo contenedor |
| A11 | BAJA | resuelto | T013 (sin canónica, Open Graph ni JSON-LD en `app.html` y `404.html`); Decisiones del plan |
| A12 | BAJA | resuelto con efecto nuevo (→ A15) | T004 |
| A13 | BAJA | resuelto | Decisiones de la spec |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A14 | Realizabilidad | MEDIA | T017, T032, T002; `frontend/nginx.conf` | `proxy_pass http://backend:3000`: un contenedor suelto sin host `backend` resoluble no arranca | La prueba levanta la imagen con el upstream resoluble sin backend real (test: T017 contra la imagen actual falla solo por `/no-existe` → 200) — nota de T017 y T002 |
| A15 | Inconsistencia | BAJA | `.github/workflows/ai-dd.yml` (lint) frente a T004 | El lint del CI solo revisa `*.js` y `*.jsx`: los `.mjs` nuevos no se revisan en CI | Los `.mjs` cambiados se revisan en CI — nota de T032 |
| A16 | Cobertura RNF | BAJA | T013 | Solo se prueba que `construirPagina` inserta los `<link>` recibidos, no que cada ruta lazy recibe el suyo | El HTML construido de `/nosotros`, `/galeria` y `/contacto` enlaza el CSS de su chunk (test) — nota de T013 |
| A17 | Orden | BAJA | T031 | T031 depende de que T016 pase, que necesita `entry-prerender` (T024) | Hacer T031 después de T024 — nota de T031 |
| A18 | Seguridad (proceso) | BAJA | T029 | `frontend/nginx.conf` es ruta protegida y la tarea no lo marca | Marcar T029 como ruta protegida con tarea aprobada — nota de T029 |

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
Aceptados por el usuario el 2026-11-12:
- **A14** → nota de T017, T002: levantar la imagen con el host `backend` resoluble (sin backend real) para que nginx arranque.
- **A15** → nota de T032: que el CI también pase el lint por los `.mjs` cambiados.
- **A16** → nota de T013: comprobar que el HTML construido de `/nosotros`, `/galeria` y `/contacto` enlaza el CSS de su chunk lazy.
- **A17** → nota de T031: ejecutarla después de T024.
- **A18** → nota de T029: `frontend/nginx.conf` es ruta protegida; se modifica con esta tarea aprobada.
