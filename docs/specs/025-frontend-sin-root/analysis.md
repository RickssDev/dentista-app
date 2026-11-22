---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-22
spec_sha: 221f0719e499
plan_sha: b4d99279eb08
tasks_sha: b95a9bfad102
---

# Análisis · 025 Servicio del sitio sin privilegios de administrador

## Resumen
`fail`: dos hallazgos ALTOS que el usuario decide corregir. A1: ningún escaneo revisa los CVEs de
las imágenes base fijadas, y la spec dice que el escáner corre "en cada PR". A2: el paquete de
build `libcap-setcap` y las imágenes base no tienen registrada la verificación de origen. Además
hay tres medios que piden corregir spec, plan o tareas (A4, A5, A7, A13) y una confirmación de
supuestos (A6, ya respondida). El resto se acepta como notas de tarea. Revisor independiente
(subagente, perfil `critical`); hallazgos verificados en los archivos.
Conteo: CRÍTICA 0 · ALTA 2 · MEDIA 6 · BAJA 5

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 8 / 8 (CA4 en producción solo en T097, sin fila en Cobertura: A13) |
| Amenazas con control y test | 5 / 5 (TM2 no cubre CVEs de la imagen: A1) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Cobertura de riesgos / Seguridad | ALTA | spec.md §Seguridad (2.º abuso), §Decisiones; plan.md §Riesgos, TM2; `.github/workflows/ai-dd.yml:99-110` | Trivy no corre en los PR: el job semanal es informativo (`continue-on-error`) y `trivy fs` no revisa los paquetes de Alpine de las imágenes `FROM`. Nada detecta un CVE de las versiones fijadas, que es justo lo que dispara la política de actualización. La spec dice "en cada PR y cada semana" | `/specify --edit`: abuso y decisión con un escaneo de la **imagen construida** en `/implement` (T023) y en cada `/release`, que detiene el release con una alta o crítica (decisión del usuario). `/plan --fix`: TM nuevo o TM2 ampliado con ese control y su test (`trivy image` sin altas ni críticas en T023) |
| A2 | Seguridad (agent-security §2) | ALTA | plan.md §Cambios por módulo, §Contratos y datos; T021 | `libcap-setcap` (paquete de build que corre como root antes del `apk del`) y las dos imágenes base no tienen registrados el origen, la versión ni la antigüedad | `/plan --fix`: registrar el origen (repositorio `main` de Alpine 3.24; Docker Official Images `docker.io/library`), la versión y la antigüedad; T021 anota la versión instalada |
| A3 | Constitución (P11) | MEDIA | plan.md §Cambios por módulo; T021 | Sin `--no-cache` en `apk add`, trivy marca AVD-DS-0025 (alta) y CA5 fallaría después de cerrar T021 | Nota de T021 |
| A4 | Inconsistencia (P6, CA8) | MEDIA | spec CA8; plan §Rollout; T024; `docs/deployment.md` §Rollback | Tres descripciones distintas del rollback: deployment.md (todo el repo y todos los servicios), el plan (solo `frontend`) y CA8 | `/plan --fix` y `/tasks --fix`: T091 actualiza §Rollback de `deployment.md` con el procedimiento del plan, y T024 verifica ese mismo procedimiento |
| A5 | Ambigüedad | MEDIA | plan §Contratos, §Decisiones; T020 | T020 admite dos soluciones ("el digest anterior de la misma serie", que puede no existir) | `/plan --fix` y `/tasks --fix`: T020 queda bloqueada hasta el 2026-11-25 y fija el digest del 2026-11-18 (decisión del usuario) |
| A6 | Ambigüedad | MEDIA | spec §Decisiones (dos `supuesto`) | Dos supuestos que afectan al diseño, pendientes de revisión del usuario | Confirmados por el usuario el 2026-11-22: `/specify --edit` cambia la fuente a `usuario` |
| A7 | Cobertura de riesgos | MEDIA | spec §Cobertura de riesgos; tasks.md, tabla de módulos | Retirar AVD-DS-0002 de `docs/security.md` no tiene tarea con criterio | `/tasks --fix`: sub-punto de T098 con "la fila AVD-DS-0002 ya no está en `docs/security.md`" |
| A8 | Ambigüedad | MEDIA | T022, T001; plan §Trazabilidad CA3 | "Iguales a las de T001" sin criterio de igualdad; el mapa y el botón de Google cambian entre corridas | Nota de T022 |
| A9 | Ambigüedad | BAJA | plan §Estrategia; T011 | `CapEff` aparece como `0000000000000400`; compararlo como texto con `0x400` falla | Nota de T011 |
| A10 | Ambigüedad | BAJA | spec RNF build; T001, T023 | Una sola medición del tiempo de build no es estable (red) | Nota de T001, T023 |
| A11 | Duplicación / conflicto | BAJA | `backend/tests/seguridad/cadena-suministro.test.js:41`, `frontend/tests/seguridad-cabeceras.test.js:130`, `frontend/tests/dockerfile-variables.test.js` | Tres tests leen el `Dockerfile` y se romperían con `FROM docker.io/library/nginx…` o `COPY --chown` | Nota de T020, T021 |
| A12 | Seguridad | BAJA | `docs/security.md` §Permisos del agente | El build necesita Docker Hub y el CDN de Alpine, que no están en la lista de dominios del agente | Roadmap |
| A13 | Inconsistencia | BAJA | plan vs tasks, Constitution Check (P3, P16); Cobertura CA4; plan §Cambios por módulo | P3 y P16 cambian entre plan y tareas; CA4 sin T097 en Cobertura; `docs/deployment.md` (T091) falta en "Cambios por módulo" | `/plan --fix` y `/tasks --fix` |

## Decisiones pendientes del usuario
Respondidas el 2026-11-22:
- A1: escaneo de la imagen construida en T023 y en cada `/release`, sin tocar el CI.
- A5: T020 espera al 2026-11-25 y fija el digest del 2026-11-18.
- A6: se confirman los dos supuestos.

## Aceptados
Aceptados por el usuario el 2026-11-22:
- **A3** → nota de T021: `apk add --no-cache --virtual`, y trivy config sobre `frontend/Dockerfile` sin hallazgos altos ni críticos
- **A8** → nota de T022: igualdad = sin diferencias de píxeles fuera de las zonas de terceros (teselas del mapa y botón de Google); una diferencia también presente entre dos capturas de v1.5.0 es ruido
- **A9** → nota de T011: `CapEff` se compara como número (`parseInt(valor, 16) === 0x400`)
- **A10** → nota de T001, T023: tiempo de build como mediana de 3 `docker build --no-cache`
- **A11** → nota de T020, T021: `npm test` desde la raíz en verde, incluidos `cadena-suministro`, `seguridad-cabeceras` y `dockerfile-variables`
- **A12** → roadmap: añadir Docker Hub y el CDN de Alpine a los dominios de red del agente en `docs/security.md`
