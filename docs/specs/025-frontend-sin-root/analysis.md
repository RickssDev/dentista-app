---
result: pass
round: 3
mode: delta
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 18b7e2042cb5
plan_sha: c99d936d75aa
tasks_sha: 13a348e2cc8b
---

# Análisis · 025 Servicio del sitio sin privilegios de administrador

## Resumen
`pass`. El único cambio de diseño es la decisión A5: por excepción del usuario, solo esta vez, la
imagen de nginx (publicada el 2026-11-18) se fija el 2026-11-22 en lugar de esperar a que cumpla
los 7 días de `security.agent.min_package_age_days`. El motivo queda escrito: es la imagen que ya
resuelve `nginx:alpine` sin fijar (comprobado en local). Spec (Decisiones e Historial), plan
(§Contratos y §Decisiones) y tareas (T020 desbloqueada) dicen lo mismo. El resto del diff son
tareas marcadas y sus notas, que no invalidan el análisis. Modo delta sin subagente (diff de pocas
líneas).
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 0 · BAJA 0

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 8 / 8 |
| Amenazas con control y test | 6 / 6 |
| Principios de la constitución evaluados | 20 / 20 (sin cambios; P3 sigue ✅: la regla de antigüedad es del agente, no de la constitución) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A5 | MEDIA | resuelto (decisión cambiada por el usuario) | spec §Decisiones e Historial; plan §Contratos y §Decisiones; T020 `nota: desbloqueada 2026-11-22` |
| A1–A4, A6, A7, A13 | — | resueltos en la ronda 2 | `history/analysis.r2.md` |

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
