---
result: pass
round: 2
mode: delta
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 4590afc02d0b
plan_sha: ddd146c8ffa7
tasks_sha: bcad66177ab4
---

# Análisis · 025 Servicio del sitio sin privilegios de administrador

## Resumen
`pass`. Los siete hallazgos abiertos de la ronda 1 están resueltos, y las líneas cambiadas no
introducen problemas nuevos. Modo delta sin subagente: el diff ocupa unos 25 KB y no tiene cambios
estructurales (ningún criterio, módulo ni contrato nuevo; CA5 se amplía y se añade TM6). Se revisó
releyendo desde cero el diff de `aidd.py changes`. La ronda 1, completa y con revisor independiente,
está en `history/analysis.r1.md`.
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 0 · BAJA 0

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 8 / 8 |
| Amenazas con control y test | 6 / 6 (TM6 nueva) |
| Principios de la constitución evaluados | 20 / 20 (sin cambios fuera de P3, P11 y P16) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto | spec CA5 y caso de abuso (sin "en cada PR"); plan TM6, Estrategia de pruebas y Decisiones (`trivy image` en T023 y `/release`); tasks T023 (`--exit-code 1`) y sub-punto de T098 |
| A2 | ALTA | resuelto | plan §Contratos y datos: origen (Docker Official Images; Alpine `main` 3.24, firmado), versión y antigüedad de las imágenes y de `libcap-setcap` 2.78-r0 (2026-04-09); T021 anota la versión instalada |
| A4 | MEDIA | resuelto | Un solo procedimiento en spec CA8, plan §Rollout, T091 ("Rollback" de `deployment.md`) y T024 (lo prueba, `depende: T091`) |
| A5 | MEDIA | resuelto | T020 con un solo resultado (digest del 2026-11-18) y `bloqueo:` hasta el 2026-11-25; plan §Decisiones |
| A6 | MEDIA | resuelto | spec §Decisiones: los dos supuestos pasan a `brecha` con fuente `usuario` |
| A7 | MEDIA | resuelto | T098, sub-punto: la fila AVD-DS-0002 ya no está en `docs/security.md` y trivy no la reporta |
| A13 | BAJA | resuelto | P3 y P16 iguales en plan y tareas; Cobertura CA4 con T097; `docs/deployment.md` en "Cambios por módulo" y en la tabla de módulos |
| A3, A8–A11 | MEDIA/BAJA | aceptados | Notas de tarea (sin cambios; ver "Aceptados") |
| A12 | BAJA | aceptado | Roadmap |

## Hallazgos nuevos
Ninguno.

## Decisiones pendientes del usuario
Ninguna.

## Aceptados
Aceptados por el usuario el 2026-11-22 (ronda 1):
- **A3** → nota de T021: `apk add --no-cache --virtual`, y trivy config sobre `frontend/Dockerfile` sin hallazgos altos ni críticos
- **A8** → nota de T022: igualdad = sin diferencias de píxeles fuera de las zonas de terceros (teselas del mapa y botón de Google); una diferencia también presente entre dos capturas de v1.5.0 es ruido
- **A9** → nota de T011: `CapEff` se compara como número (`parseInt(valor, 16) === 0x400`)
- **A10** → nota de T001, T023: tiempo de build como mediana de 3 `docker build --no-cache`
- **A11** → nota de T020, T021: `npm test` desde la raíz en verde, incluidos `cadena-suministro`, `seguridad-cabeceras` y `dockerfile-variables`
- **A12** → roadmap: añadir Docker Hub y el CDN de Alpine a los dominios de red del agente en `docs/security.md`
