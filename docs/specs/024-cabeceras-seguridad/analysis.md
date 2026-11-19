---
result: pass
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-19
spec_sha: 4aec545c3fae
plan_sha: 1ffa038d95ed
tasks_sha: a62e82e80da1
---

# Análisis · 024 Protecciones del navegador en todo el sitio

## Resumen
Ronda 2 en modo delta sobre el diff de `aidd.py changes` (30 KB, sin cambio estructural). La hice
sin subagente, releyendo las secciones afectadas. Los doce hallazgos de la ronda 1 quedan resueltos.
Hay dos nuevos de severidad baja, aceptados como notas de T013 y T025. Resultado: `pass`.

Conteo (nuevos): CRÍTICA 0 · ALTA 0 · MEDIA 0 · BAJA 2

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 9 |
| Amenazas con control y test | 7 / 7 |
| Principios de la constitución evaluados | 20 / 20 (P2 con la decisión del usuario sobre los paneles, A6) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | CRÍTICA | resuelto | plan, Contratos: `img-src 'self' data: blob:` con su motivo; T010 lo exige; T023 sube una imagen en los cuatro formularios |
| A2 | ALTA | resuelto | plan: marcador propio (`api.js`, `sin-imagen.svg`) e inventario de orígenes de imágenes; T013 (test) y T025 (cambio) |
| A3 | ALTA | resuelto | plan (Estrategia, P19, CA8) y T011: la 404 conserva su `<meta>` `noindex`, sin exigir cabecera |
| A4 | MEDIA | resuelto | HSTS de 1 año en Contratos, TM4, CA2, Rollout y Riesgos; decisión en la spec; `curl -sI` a `/` y a `/api/` en T097 (Trazabilidad) |
| A5 | MEDIA | resuelto | TM6 acotado a lo que sirve nginx; `/uploads/` con helmet, fuera de alcance |
| A6 | MEDIA | resuelto | `seguridad-recursos.test.js` en CI; recorrido de los paneles manual por decisión del usuario (P2 del plan y de las tareas) |
| A7 | MEDIA | resuelto | tabla de módulos: `security.md` en `/release` (Paso 7, T098), fuera de T090 |
| A8 | BAJA | resuelto | "seis cabeceras" |
| A9 | BAJA | resuelto | P12 cita TM1–TM7 |
| A10 | BAJA | resuelto | T010: `max-age=31536000` exacto |
| A11 | BAJA | resuelto | filas de TM7 y del RNF separadas |
| A12 | BAJA | resuelto | plan: `VITE_ASSETS_URL` sin definir en `Dockerfile` ni compose; cambiarlo exige tocar `img-src` |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A13 | Constitución (P20) | BAJA | T025 | El SVG del marcador no dice de dónde salen sus colores | Usar los valores de los tokens `--tint` (fondo) y `--muted` (figura) de `docs/design/system.md`; se revisa en `/review` → nota de T025 |
| A14 | Ambigüedad | BAJA | plan, Estrategia ("lista conocida de enlaces y datos"); T013 | El plan da ejemplos, no la lista cerrada | La prueba fija la lista con un motivo por entrada (p. ej. `localhost` como respaldo de desarrollo y `w3.org` como espacio de nombres de SVG); una URL nueva fuera de ella falla → nota de T013 |

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
Aceptados por el usuario el 2026-11-19 (corrección "más pequeña" en `/implement`):
- **A13** → nota de T025: colores del SVG con los valores de `--tint` y `--muted`
- **A14** → nota de T013: lista cerrada de URLs con un motivo por entrada
