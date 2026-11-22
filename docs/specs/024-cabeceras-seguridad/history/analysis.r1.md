---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-19
spec_sha: 1a8a15c86f3f
plan_sha: 2e2ec807bd88
tasks_sha: 528a7240c832
---

# Análisis · 024 Protecciones del navegador en todo el sitio

## Resumen
El análisis independiente lo hizo un subagente de solo lectura sin contexto previo. Después verifiqué
cada hallazgo en el código. Resultado: `fail` por A1. La CSP del plan bloquea las vistas previas
`blob:` de cuatro formularios del panel, lo que contradice CA7, y T010 fijaría ese valor. A2 y A3
también producirían código o pruebas incorrectos.

Todo se corrige con `/plan 024 --fix` y `/tasks 024 --fix`. Las dos decisiones del usuario (A4 y A6)
ya están tomadas.

Conteo: CRÍTICA 1 · ALTA 2 · MEDIA 4 · BAJA 5

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 9 |
| Amenazas con control y test | 6 / 7 (TM6 sin test real: A5) |
| Principios de la constitución evaluados | 20 / 20 |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Seguridad / Inconsistencia | CRÍTICA | plan.md, Contratos (`img-src 'self' data:`); T010; `Admingaleria.jsx:99`, `AdminPromociones.jsx:115`, `AdminServicios.jsx:76`, `AdminUsuarios.jsx:103` | Las vistas previas de imagen usan `URL.createObjectURL` en un `<img>` (`blob:`); la CSP no permite `blob:` en `img-src`, y T010 fijaría ese valor | La CSP permite las vistas previas locales sin abrir orígenes externos. Test: `seguridad-cabeceras.test.js` (`img-src` admite `blob:`) y T023 subiendo una imagen en los 4 formularios, con la consola sin bloqueos → `/plan --fix`, `/tasks --fix` |
| A2 | Seguridad / Cobertura | ALTA | `frontend/src/services/api.js:132` (`getImageUrl`, `https://via.placeholder.com/60`) | Sin imagen, se pide un marcador a un servicio externo (que además ya no funciona); `img-src` lo bloquea. El plan no inventaría los orígenes de imágenes de los paneles | Ninguna imagen del código sale de un origen fuera de la CSP. Test automático sobre `frontend/src` (A6) y T023 con un registro sin foto → `/plan --fix`, `/tasks --fix` |
| A3 | Inconsistencia | ALTA | plan.md (Estrategia, P19); T011; `nginx.conf:73-76` | La 404 nunca tuvo `X-Robots-Tag`; su `noindex` es el `<meta>` del HTML (022). T011 exige la cabecera y fallaría siempre | La 404 conserva su `noindex` como lo tenía (`<meta>`); `probar-nginx.mjs` lo comprueba en el cuerpo → `/plan --fix`, `/tasks --fix` |
| A4 | Seguridad / Ambigüedad | MEDIA | plan.md (Contratos, Rollout, Riesgos); `backend/src/config/app.js:26` | `/api/` ya manda HSTS de 1 año con `includeSubDomains` desde el mismo host: el plazo efectivo alterna entre 180 y 365 días | Decisión del usuario: 1 año también en las páginas. Plazo real escrito en Rollout y Riesgos. Test: valor exacto en T010; `curl -sI` a `/` y a `/api/…` en T097 → `/plan --fix`, `/tasks --fix` |
| A5 | Cobertura (TM) | MEDIA | plan.md TM6; tasks.md Cobertura | TM6 habla de archivos subidos (`/uploads/`, helmet), que `probar-nginx.mjs` no puede probar sin backend | TM6 se acota a lo que sirve nginx; `/uploads/` queda con helmet (fuera de alcance) → `/plan --fix` |
| A6 | Constitución (P2) / Cobertura | MEDIA | plan.md (Estrategia); T012, T023 | CA5–CA7 solo se comprueban fuera de CI; ahí estaban A1 y A2 | Decisión del usuario: CI cubre lo detectable en el código (la CSP admite `blob:`; las URLs absolutas de `frontend/src` están en una lista conocida o en la CSP); el recorrido de los paneles queda manual (T023) → `/plan --fix`, `/tasks --fix` |
| A7 | Cobertura de riesgos | MEDIA | tasks.md, tabla de módulos (T090 ↔ `security.md`) | Se asigna `security.md` a T090, pero su criterio no lo menciona | RS6.a y RS6.b se marcan mitigadas en `/release` (Paso 7), sin T090 → `/tasks --fix` |
| A8 | Inconsistencia | BAJA | plan.md, Cambios por módulo | "Siete cabeceras"; el contrato tiene seis | Seis → `/plan --fix` |
| A9 | Inconsistencia | BAJA | plan.md, Constitution Check P12 | "TM1–TM6"; el modelo tiene TM1–TM7 | TM1–TM7 → `/plan --fix` |
| A10 | Inconsistencia | BAJA | T010 | HSTS con "valor exacto" y a la vez "`max-age` ≥" | Valor exacto (A4) → `/tasks --fix` |
| A11 | Formato | BAJA | plan.md, Trazabilidad | Las filas de TM7 y del RNF de rendimiento están en la misma línea | Separarlas → `/plan --fix` |
| A12 | Ambigüedad | BAJA | spec.md, Notas para /plan; plan.md | No se responde si `VITE_ASSETS_URL` puede apuntar a otro origen | Fijar que no se define en el `Dockerfile` ni en el compose (las imágenes son del mismo origen) y que cambiarlo exige actualizar la CSP → `/plan --fix` |

## Decisiones pendientes del usuario
Resueltas el 2026-11-19:
- **A4:** HSTS de 1 año también en las páginas, igual que la API, sin subdominios de `dentissa.app`.
- **A6:** CI cubre lo detectable en el código; el recorrido de los paneles queda manual en T023.

## Aceptados
Ninguno: todos se corrigen en el plan y las tareas.
