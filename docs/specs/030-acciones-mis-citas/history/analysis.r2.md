---
result: fail
round: 2
mode: full
constitution_version: 1.0.0
date: 2026-11-23
spec_sha: 6faf8c55d867
plan_sha: 90d6e7c287ba
tasks_sha: 38be6b2900a6
---

# Análisis · 030 Reprogramar y cancelar desde «Mis citas»

## Resumen
No pasa. Los 17 hallazgos de la ronda 1 están resueltos; 7 de ellos con algún efecto nuevo. Hay dos
hallazgos graves:
- **A18 (crítico):** los botones de Inicio que se reutilizan no cumplen el contraste AA (deudas
  DS4, DS5 y DS6) y no había excepción.
- **A19 (alto):** el rechazo de CA10 rompe los mocks de dos tests existentes.
Hubo modo completo porque el plan y las tareas se reescribieron.
Conteo (nuevos): CRÍTICA 1 · ALTA 1 · MEDIA 4 · BAJA 5

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 10 / 10 |
| Amenazas con control y test | 3 / 3 |
| Principios de la constitución evaluados | 20 / 20 (P16 incumplido, P20 parcial y P9 sin verificación viable) |

## Seguimiento de rondas anteriores
| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| A1 | ALTA | resuelto | spec Auditoría y Decisiones; plan P13 |
| A2 | ALTA | resuelto | plan P8; T010 |
| A3 | ALTA | resuelto con efecto nuevo (→ A23) | `ancho` como prop; test de T012 |
| A4 | ALTA | resuelto con efecto nuevo (→ A24) | destino «Agendar nueva cita», con el foco global `:focus-visible` (`global.css:104-108`) |
| A5 | MEDIA | resuelto con efecto nuevo (→ A24) | secuencia en `design.md`; T012 |
| A6 | MEDIA | resuelto con efecto nuevo (→ A21) | CA1, CA2, T010 |
| A7 | MEDIA | resuelto con efecto nuevo (→ A21) | T010 con `Date` |
| A8 | MEDIA | resuelto con efecto nuevo (→ A19, A20) | CA10, T010, T020 |
| A9–A16 | BAJA | resuelto | plan y tareas |
| A17 | BAJA | resuelto con efecto nuevo (→ A26) | T090 |

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A18 | Constitución (P16) | CRÍTICA | plan P16; design; spec K1; T022 | Los botones que se reutilizan no cumplen el contraste: `.mf-btn-prin` blanco sobre `#e94b6a`→`#f0708a` da 3.70–2.84:1 (DS4); `mf-btn-peligro` `#e63946` da 4.17:1 (DS5); el borde de `.mf-btn-sec` da 1.48:1 (DS6). No había excepción | Decisión del usuario: excepción P16 temporal para esos botones hasta una spec que corrija DS4, DS5 y DS6 en todo el panel; medir el contraste en T022 y en `/review` → `/plan --fix`, roadmap |
| A19 | Cobertura | ALTA | T020; `tests/citas/horario-paciente.test.js`, `tipos-paciente.test.js` | Sus mocks de `getCitaConUsuario` no traen fecha, hora ni duración: el rechazo de CA10 los rompería, o empujaría a un código que deja pasar las citas a las que les faltan datos | Tarea de test nueva que actualiza esos mocks antes de T020; T010 fija qué pasa si falta la duración → `/tasks --fix` |
| A20 | Cobertura de riesgos | MEDIA | plan (`getCitaConUsuario`); T020 | `comen.service` también usa `getCitaConUsuario`; un `INNER JOIN` con `servicio` y una `duracion` NULL cambiarían su respuesta o darían 500 | `LEFT JOIN`; `duracion` NULL cuenta como 0; `tests/comentarios` en verde; caso de NULL en T010 → `/plan --fix`, `/tasks --fix` |
| A21 | Ambigüedad | MEDIA | plan Estrategia; T010, T020 | Con la CI en UTC, los casos de ±1 minuto no detectan un error de zona; no se fija el instante exacto; comparar textos de hora falla en el límite | `fechaComoTexto` y minutos numéricos con el límite de `getProximaCita`; T010 a las 23:30 de México, con «empieza ahora» y «termina ahora» → `/plan --fix`, `/tasks --fix` |
| A22 | Inconsistencia | MEDIA | plan P9; T010 | Con el repositorio simulado no se puede comprobar el SQL | Bloque con el repositorio real y `jest.spyOn(pool, 'query')` → `/tasks --fix` |
| A23 | Constitución (P20) | MEDIA | plan P20; T022 | `ancho={500}` en «Mis citas» es un literal nuevo en una pantalla modificada | Decisión del usuario: el mismo 500 que Inicio, como deuda DS2; el test de T012 prohíbe además `style=` en el componente → `/plan --fix`, `/tasks --fix` |
| A24 | Ambigüedad | BAJA | design; T022 | No se fija cómo se da el foco al botón del encabezado ni a dónde va si la recarga falla | Mecanismo y casos fijados; test → `design --fix`, `/tasks --fix` |
| A25 | Cobertura | BAJA | T011, T012 | El `textarea` es `required`: el caso «sin motivo» debe usar espacios | Motivo `"   "` |
| A26 | Inconsistencia | BAJA | T090 | `architecture.md` no tiene lista de componentes del portal | Mencionarlo en §Frontend |
| A27 | Duplicación | BAJA | T021 | Tercera copia de `formatearFecha` y `formatearHora` | El componente recibe el subtítulo ya formateado |
| A28 | Ambigüedad | BAJA | spec CA9 | Dos citas del mismo servicio el mismo día tendrían el mismo nombre accesible | Decisión del usuario: se añade la hora → `/specify --edit` |

## Decisiones pendientes del usuario
Respondidas por el usuario el 2026-11-23:
- **A18:** excepción P16 temporal para los botones `.mf-btn-prin`, `.mf-btn-sec` y `mf-btn-peligro`
  en «Mis citas», como ya están en Inicio, hasta una spec que corrija DS4, DS5 y DS6 en todo el panel.
- **A23:** «Mis citas» usa el mismo ancho que Inicio (500), anotado como deuda DS2.
- **A28:** el nombre accesible incluye la hora.

## Aceptados
Ninguno se acepta sin corregir. Después, `/analyze 030` delta.
