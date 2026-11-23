---
result: pass
round: 4
mode: delta
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 2fc85329ee99
plan_sha: 27e796bd434e
tasks_sha: 56657869d6b6
---

# Análisis · 025 Servicio del sitio sin privilegios de administrador

## Resumen
`pass`. Durante `/implement`, T023 encontró dos cosas, y el usuario decidió cada una:
- `trivy image`: CVE-2026-86144 (alta) en `libxml2` de la imagen de nginx fijada. Se actualiza el
  paquete al construir: T025 es la prueba y falla primero, T026 hace el cambio.
- `trivy fs`: AVD-DS-0002 en `backend/Dockerfile`, la imagen de desarrollo. En `/release` la
  excepción queda acotada a ese archivo (T098).

Spec (Fuera de alcance aclarado, Decisiones e Historial), plan (Cambios, TM6, Trazabilidad,
Decisiones) y tareas (T025, T026, `depende` de T023, T098 y Cobertura) son coherentes. CA5 ya
preveía "actualizarlas o aceptarlas como excepción", y las imágenes base siguen siendo las
fijadas. Modo delta sin subagente: diff pequeño y sin cambios estructurales (sin criterio ni
módulo nuevos).
Conteo: CRÍTICA 0 · ALTA 0 · MEDIA 0 · BAJA 0

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 8 / 8 (CA5: T010, T023, T025 / T021, T026, T098) |
| Amenazas con control y test | 6 / 6 (TM6: control T026 y escaneo; test T025 y `trivy image`) |
| Principios de la constitución evaluados | 20 / 20 (P11 se refuerza: la imagen queda sin altas) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1–A7, A13 | — | resueltos en rondas 2 y 3 | `history/analysis.r2.md`, `history/analysis.r3.md` |

## Hallazgos nuevos
Ninguno. Revisado: T025 va antes que T026 y falla con la imagen de T021; T026 solo toca
`frontend/Dockerfile` (ruta protegida, tarea aprobada); T023 depende de T026, así que se repite
con la imagen corregida; T098 ya no dice que la fila desaparece, sino que se acota a desarrollo.

## Decisiones pendientes del usuario
Ninguna (las dos se tomaron el 2026-11-22).

## Aceptados
Aceptados por el usuario el 2026-11-22 (ronda 1):
- **A3** → nota de T021: `apk add --no-cache --virtual`, y trivy config sobre `frontend/Dockerfile` sin hallazgos altos ni críticos
- **A8** → nota de T022: igualdad = sin diferencias de píxeles fuera de las zonas de terceros (teselas del mapa y botón de Google); una diferencia también presente entre dos capturas de v1.5.0 es ruido
- **A9** → nota de T011: `CapEff` se compara como número (`parseInt(valor, 16) === 0x400`)
- **A10** → nota de T001, T023: tiempo de build como mediana de 3 `docker build --no-cache`
- **A11** → nota de T020, T021: `npm test` desde la raíz en verde, incluidos `cadena-suministro`, `seguridad-cabeceras` y `dockerfile-variables`
- **A12** → roadmap: añadir Docker Hub y el CDN de Alpine a los dominios de red del agente en `docs/security.md`
