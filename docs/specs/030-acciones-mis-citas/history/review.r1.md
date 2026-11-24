---
spec: 030-acciones-mis-citas
verdict: changes_requested
round: 1
date: 2026-11-23
base: 12a80fe
head: 9ac0f54
human_signoff: pending
---

# Review · 030 Reprogramar y cancelar desde «Mis citas»

## Resumen
`changes_requested`. No hay bloqueantes: los diez criterios y los tres controles del modelo de
amenazas están implementados y probados. Hay dos hallazgos importantes en el manejo del aviso tras
reprogramar o cancelar en «Mis citas»: el foco se pierde si se cierra el aviso antes de que
termine la recarga (R1), y una recarga fallida tapa el aviso de éxito (R2). El usuario decidió
corregirlos junto con 8 menores (T030–T033); los otros 6 van al roadmap.
Revisores independientes: spec (A), constitución y calidad (C+D), seguridad (S) y accesibilidad.
Plan y alcance (B), en el agente principal. El plugin `design` de Anthropic no está en esta sesión.
Conteo: bloqueante 0 · importante 2 · menor 14

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 38 suites, 469 pasan y 5 `todo`; frontend 30 archivos y 262 pruebas (línea base: 444 y 245) |
| Tests nuevos de UI (`mis-citas-acciones`, `inicio-paciente`) dos veces | ✅ 17/17 en las dos corridas |
| `npm run lint --prefix backend` | ✅ 1 error previo (`faqs.service.js`) |
| `npm run lint --prefix frontend` | ✅ 12 problemas previos (7 errores) |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/030-acciones-mis-citas` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `backend/tests/citas/mis-citas-modificable.test.js::modificable`, `frontend/tests/mis-citas-acciones.test.jsx::una modificable` | ✅ | Verificación manual del usuario (T022) |
| CA2 | `mis-citas-modificable.test.js::no es modificable`, `mis-citas-acciones.test.jsx::modificable: false` | ✅ | `modificable` no se recalcula con la página abierta (R3) |
| CA3 | `mis-citas-acciones.test.jsx::reprogramar` | ⚠ | Una recarga fallida tapa el aviso de éxito (R2) |
| CA4 | `mis-citas-acciones.test.jsx::cancelar` | ✅ | El test no comprueba la ausencia de «Reprogramar» (R5) |
| CA5 | `mis-citas-acciones.test.jsx::rechazo` | ✅ | Sin caso de rechazo al cancelar (R5) |
| CA6 | `mis-citas-acciones.test.jsx::dos pendientes` | ✅ | Solo cubre cancelar (R5) |
| CA7 | `inicio-paciente.test.jsx` (caracterización), `mis-citas-modificable.test.js::en curso` | ✅ | «Inicio al volver» se verificó a mano (R6) |
| CA8 | `mis-citas-modificable.test.js::otro → 404` | ✅ | Falta el rol Administrador (R4) |
| CA9 | `mis-citas-acciones.test.jsx::foco`, nombre accesible | ⚠ | Carrera del foco con la recarga (R1); teclado verificado a mano (R7) |
| CA10 | `mis-citas-modificable.test.js::CA10` | ✅ | El caso de duración NULL no distingue 0 de NaN (R13) |

## Conformidad con el plan
- Cambios fuera del plan:
  - `frontend/src/utils/avisosCita.js`, justificado en la nota de T021;
  - `Promise.resolve().then(cargarTodo)` en Inicio, por el lint (R8).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P8 | ✅ | rutas con `verifyToken` y propiedad en el servicio; 404 probado con Paciente y Asistente (R4: falta Administrador) |
| P9 | ✅ | bloque con el repositorio real y `jest.spyOn(pool, 'query')` |
| P13 | ❌ aceptado | excepción del usuario (2026-11-11, extendida el 2026-11-23) |
| P16 | ❌ aceptado / ⚠ | excepción de contraste (A18); foco: R1 |
| P17 | ✅ | `modificable` y CA10 en el servidor |
| P20 | ✅ | sin estilos nuevos; test sin literales en `ModalAccionCita` |
| Resto | ✅ / ➖ | como en el plan |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks, `en-ci`) | se ejecuta en el CI del PR |
| SAST | ➖ `no-aplica` |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 (backend 20 moderadas previas; frontend 0) |
| Contenedores (trivy, `en-ci`) | se ejecuta en el CI del PR |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso (TM1, TM3) | ✅ | 404 antes del estado y de CA10; `/miscitas` solo con el perfil de la sesión |
| A05:2025 Inyección | ✅ | parámetros `?`; test con el repositorio real |
| A06:2025 Diseño inseguro (TM2) | ✅ | CA10 en el servidor; las rutas sin la regla son del personal (`authorizeRoles`) |
| A10:2025 Condiciones excepcionales | ✅ | mensajes fijos en español; cuerpo exacto probado |
| Proceso | ✅ | sin rutas protegidas tocadas ni instrucciones a agentes |

Nota informativa (S): entre comprobar y escribir hay una ventana de milisegundos, sin bloqueo. Es el
patrón previo de la spec 005, de impacto bajo; no se cambia.

## Observabilidad
- Eventos de auditoría: no hay (excepción P13).
- Datos sensibles en logs: ninguno nuevo.
- `request_id`: el 400 de CA10 queda en «Petición atendida» (spec 026).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `frontend/src/pages/paciente/CitasPaciente.jsx:118-133` | El destino del foco se asigna después de `await cargarCitas()`. Si se cierra el aviso antes, el foco cae en `body`. Además, la ref queda guardada y desvía el foco del siguiente aviso | Destino fijado antes de abrir el aviso y válido solo para ese aviso; test con la recarga pendiente al pulsar «Aceptar» |
| R2 | importante | `CitasPaciente.jsx:84-88, 118-124` | Si la recarga posterior a la acción falla, el aviso de error sustituye al de éxito y la lista queda vacía | Tras una acción, la recarga no pisa el aviso de éxito ni vacía la lista; test que lo afirma |
| R3 | menor | `citas.service.js` / `CitasPaciente.jsx` | `modificable` no se recalcula si la página sigue abierta cuando la cita empieza | → roadmap: límite conocido; el servidor rechaza las terminadas |
| R4 | menor | `mis-citas-modificable.test.js:158` | El 404 sobre una cita ajena no prueba el rol Administrador | Añadir el rol 1 |
| R5 | menor | `mis-citas-acciones.test.jsx:122-170` | CA6 solo cubre cancelar; CA4 no afirma la ausencia de «Reprogramar»; CA5 sin rechazo al cancelar | Completar los casos |
| R6 | menor | `inicio-paciente.test.jsx` | «Inicio al volver» sin test automatizado | → roadmap (verificado a mano en T022) |
| R7 | menor | `mis-citas-acciones.test.jsx` | Sin pruebas de teclado (Tab, Enter, Escape) | → roadmap (verificado a mano en T022; botones nativos) |
| R8 | menor | `InicioPaciente.jsx:82` | El comentario de `Promise.resolve().then(cargarTodo)` no dice que es por el lint | Que el comentario lo explique |
| R9 | menor | `ModalAccionCita.jsx:40-45` | Reinicio del formulario con un efecto: un render con el estado anterior | Montar el componente con `key` por apertura y quitar el efecto |
| R10 | menor | `CitasPaciente.jsx:97, 115` | `setTimeout` innecesario al cerrar el formulario | Enfocar directo al cerrar; el destino tras el aviso, con R1 |
| R11 | menor | `citas.service.js:74-83, 586-593` | `ahoraEnMexico` duplica el cálculo de `getProximaCita` y se recalcula en cada fila | Reutilizarlo y calcularlo una vez por lista |
| R12 | menor | `mis-citas-modificable.test.js:24` | El caso de las 23:30 solo detecta un error de zona si el proceso no corre en hora de México | Fijar `TZ=UTC` en ese archivo |
| R13 | menor | `mis-citas-modificable.test.js:116` | El caso de duración NULL no distingue 0 de `NaN` | Pendiente empezada con duración NULL → 400 |
| R14 | menor | `ModalAccionCita.jsx` / `ModalFormulario.jsx` | El subtítulo «servicio · fecha · hora» no está enlazado al diálogo | → roadmap (toca `ModalFormulario`, compartido) |
| R15 | menor | `CitasPaciente.jsx:339-355` | Objetivo de toque de `.mf-btn` sin medir | → roadmap |
| R16 | menor | `ModalAccionCita.jsx:21-30` | `formatearHora` y `datosDe` copiados en tres archivos | → roadmap (`/refactor`) |

## Preparación para release
- Rollback factible: sí. Sin migración; revertir citas y frontend, y reconstruir.
- Migraciones: no hay.
- Docs: `architecture.md` y la spec 005 (T090); `deployment.md` sin cambios (T091).
- Cobertura de riesgos: sin riesgos `RS`/`OB`/`RD`/`SE` dentro de alcance.

## Tareas añadidas
- T030 ← R1, R2, R5
- T031 ← R4, R12, R13
- T032 ← R1, R2, R8, R9, R10
- T033 ← R11

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-23:
- **R3** → roadmap: «Mis citas» no recalcula `modificable` si la página sigue abierta cuando la cita empieza; el servidor rechaza las ya terminadas.
- **R6** → roadmap: test automatizado de que Inicio muestra la próxima cita actualizada al volver a abrirlo.
- **R7** → roadmap: pruebas de teclado (Tab, Enter, Escape) en «Mis citas».
- **R14** → roadmap: enlazar el subtítulo del formulario con `aria-describedby` en `ModalFormulario`.
- **R15** → roadmap: medir en navegador el objetivo de toque de `.mf-btn` a 390 px.
- **R16** → roadmap: unificar `formatearFecha`, `formatearHora` y `datosDe` en utilidades compartidas (`/refactor`).
