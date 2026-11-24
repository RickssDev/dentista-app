---
spec: 030-acciones-mis-citas
verdict: approved
round: 2
date: 2026-11-23
base: 9ac0f54
head: 77e27df
human_signoff: pending
---

# Review · 030 Reprogramar y cancelar desde «Mis citas»

## Resumen
`approved`. Las tareas T030–T033 corrigen los dos hallazgos importantes y los ocho menores
acordados de la ronda 1, y el diff desde entonces no introduce hallazgos nuevos. Ronda `--rerun`
sin subagentes: el diff de código desde `9ac0f54` ocupa 19 KB y se releyó desde cero.
Conteo (nuevos): bloqueante 0 · importante 0 · menor 0

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 38 suites, 472 pasan y 5 `todo`, ahora en UTC; frontend 30 archivos y 268 pruebas |
| Tests de UI tocados (`mis-citas-acciones`, `inicio-paciente`) dos veces | ✅ 23/23 en las dos corridas |
| `npm run lint --prefix backend` | ✅ 1 error previo |
| `npm run lint --prefix frontend` | ✅ 12 problemas previos (7 errores) |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/030-acciones-mis-citas` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1–CA2 | `mis-citas-modificable.test.js`, `mis-citas-acciones.test.jsx` | ✅ | |
| CA3 | `mis-citas-acciones.test.jsx::reprogramar`, `::R2` | ✅ | R2 resuelto |
| CA4–CA6 | `mis-citas-acciones.test.jsx` (incluye los casos de R5) | ✅ | |
| CA7 | `inicio-paciente.test.jsx`, `mis-citas-modificable.test.js::en curso`, `::R11` | ✅ | |
| CA8 | `mis-citas-modificable.test.js::otro → 404` con los tres roles | ✅ | R4 resuelto |
| CA9 | `mis-citas-acciones.test.jsx::foco`, `::R1` | ✅ | R1 resuelto |
| CA10 | `mis-citas-modificable.test.js::CA10`, `::duración NULL` | ✅ | R13 resuelto |

## Conformidad con el plan
- Cambios fuera del plan: `tests/support/guard.js`, que fija `TZ=UTC` (justificado en T031), y un caso
  de caracterización de `getProximaCita` (T033).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P8 | ✅ | 404 sobre una cita ajena con los tres roles |
| P16 | ❌ aceptado / ✅ | excepción de contraste (A18); foco corregido (R1) |
| Resto | sin cambios desde la ronda 1 | ver [ronda 1](history/review.r1.md) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks, `en-ci`) | se ejecuta en el CI del PR |
| SAST | ➖ `no-aplica` |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 |
| Contenedores (trivy, `en-ci`) | se ejecuta en el CI del PR |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ✅ | sin cambios en las comprobaciones; tests por rol completos |
| A06:2025 Diseño inseguro | ✅ | reglas de tiempo en un solo cálculo (`ahoraEnMexico`) |

## Observabilidad
- Sin cambios: no hay logs ni eventos nuevos.

## Hallazgos
Seguimiento de la ronda 1:

| ID | Estado | Evidencia |
|---|---|---|
| R1 | resuelto | T030 (aviso con la recarga pendiente y aviso posterior) y T032 (destino guardado con su aviso, consumido al cerrar) |
| R2 | resuelto | T030 y T032 (recarga `silenciosa`) |
| R3 | aceptado | → roadmap |
| R4 | resuelto | T031 |
| R5 | resuelto | T030 |
| R6, R7 | aceptado | → roadmap |
| R8 | resuelto | T032 |
| R9 | resuelto | T032 (`key` por apertura, sin efecto de reinicio) |
| R10 | resuelto | T032 |
| R11 | resuelto | T033 |
| R12 | resuelto | T031 (`globalSetup` con `TZ=UTC`; comprobado con el cálculo roto) |
| R13 | resuelto | T031 |
| R14, R15, R16 | aceptado | → roadmap |

Hallazgos nuevos: ninguno.

## Preparación para release
- Rollback factible: sí, sin migración.
- Docs: `architecture.md` y la spec 005 (T090); `deployment.md` sin cambios.
- Excepciones vigentes que aplican: P13 (auditoría) y P16 (contraste DS4–DS6), aprobadas por el usuario.

## Tareas añadidas
Ninguna en esta ronda.

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-23 (ronda 1):
- **R3** → roadmap: «Mis citas» no recalcula `modificable` si la página sigue abierta cuando la cita empieza; el servidor rechaza las ya terminadas.
- **R6** → roadmap: test automatizado de que Inicio muestra la próxima cita actualizada al volver a abrirlo.
- **R7** → roadmap: pruebas de teclado (Tab, Enter, Escape) en «Mis citas».
- **R14** → roadmap: enlazar el subtítulo del formulario con `aria-describedby` en `ModalFormulario`.
- **R15** → roadmap: medir en navegador el objetivo de toque de `.mf-btn` a 390 px.
- **R16** → roadmap: unificar `formatearFecha`, `formatearHora` y `datosDe` en utilidades compartidas (`/refactor`).
