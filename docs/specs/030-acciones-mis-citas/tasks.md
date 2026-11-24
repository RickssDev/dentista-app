---
spec: 030-acciones-mis-citas
plan: plan.md
status: approved
---

# Tareas · 030 Reprogramar y cancelar desde «Mis citas»

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza:
  `hecho cuando: T010 pasa · verificación manual: <qué, dónde, contra qué>`.

## Constitution Check
Revisado contra el Constitution Check de [plan.md](plan.md):
- **P2:** cada implementación depende de su test, y la caracterización de Inicio (T011) va antes de la extracción (T021). ✅
- **P3:** ninguna tarea toca `package.json`. ✅
- **P8 y P17:** el servidor calcula `modificable` (T020) antes de que la vista lo use (T022). ✅
- **P20:** ninguna tarea toca hojas de estilo. ✅
- **P7, P13, P18, P19:** ➖, como en el plan. ➖

## Preparación
Sin tareas: no hay dependencias, configuración ni migraciones.

## Tests (antes de implementar)
- [ ] T010 [P] Tests del servidor de «Mis citas» — `backend/tests/citas/mis-citas-modificable.test.js` — hecho cuando: fallan por la razón esperada (no hay `modificable` ni `id_servicio`). Casos con los repositorios simulados y la hora fijada con `jest.useFakeTimers`:
  - `modificable` es verdadero para una pendiente de mañana y para una de hoy cuyo fin (hora + duración) aún no llega en la hora de México;
  - es falso para una pendiente de hoy ya terminada, para una de ayer y para una completada o cancelada futura;
  - cada cita incluye `id_servicio`, y el id del paciente va en los parámetros de la consulta.
  Por HTTP: `GET /api/v1/citas/miscitas` sin token → 401; `PUT /api/v1/citas/mias/:id` y `PATCH /api/v1/citas/mias/:id/cancelar` sobre una cita de otro paciente → 404 sin llamar a la actualización; cancelar una cita completada propia → rechazo. Los casos que ya se cumplen se comprueban rompiendo lo que protegen — cubre: CA1, CA2, CA8
- [ ] T011 [P] Test de caracterización de Inicio — `frontend/tests/inicio-paciente.test.jsx` — hecho cuando: pasa antes del cambio, con `api` simulado. Comprueba que la tarjeta «Próxima cita» muestra «Reprogramar» y «Cancelar cita»; que el formulario de reprogramar tiene «Nueva fecha», «Nueva hora» y «Motivo» y pide los horarios con el `id_servicio` de la próxima cita; que confirmar manda `PUT /citas/mias/:id` con fecha, hora y motivo y muestra «Tu cita se reprogramó correctamente.»; que cancelar manda `PATCH /citas/mias/:id/cancelar` con el motivo y muestra «Tu cita se canceló correctamente.»; y que sin motivo sale el error del formulario. Se comprueba rompiendo un texto — cubre: CA7
- [ ] T012 [P] Tests de las acciones en «Mis citas» — `frontend/tests/mis-citas-acciones.test.jsx` — hecho cuando: fallan por la razón esperada (no hay botones). Casos con `api` simulado:
  - una pendiente con `modificable: true` muestra «Reprogramar» y «Cancelar cita», con nombre accesible «Reprogramar cita de <servicio> del dd/mm/aaaa» y «Cancelar cita de <servicio> del dd/mm/aaaa»;
  - una pendiente con `modificable: false` y una completada no los muestran, y la completada conserva «Dejar comentario»;
  - reprogramar pide los horarios con el `id_servicio` de esa cita, exige el motivo, manda `PUT /citas/mias/<id>`, vuelve a pedir `/citas/miscitas`, la tarjeta muestra la nueva fecha y sale «Tu cita se reprogramó correctamente.»;
  - cancelar manda `PATCH /citas/mias/<id>/cancelar` y la tarjeta queda cancelada, sin botones;
  - un rechazo del servidor sale en el `role="alert"` del formulario y la tarjeta conserva sus datos;
  - con dos pendientes, solo cambia la elegida;
  - al cerrar el formulario, el foco vuelve al botón que lo abrió, o al título de la tarjeta si la cita quedó cancelada.
  Dos corridas iguales — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9

## Implementación
- [ ] T020 Añadir `id_servicio` y `modificable` a «Mis citas» — `backend/src/modules/citas/citas.repository.js`, `backend/src/modules/citas/citas.service.js` — hecho cuando: pasa T010 y siguen en verde `tests/citas`. La consulta de `getMisCitas` añade `c.id_servicio` y `s.duracion`; el servicio calcula `modificable` con la fecha y hora de `America/Mexico_City`, como `getProximaCita` (pendiente y fecha mayor que hoy, o de hoy con hora + duración mayor que la hora actual), y no devuelve la duración — cubre: CA1, CA2, CA8 — depende: T010
- [ ] T021 Extraer el formulario de Inicio a `ModalAccionCita` y usarlo en Inicio — `frontend/src/components/ModalAccionCita.jsx`, `frontend/src/pages/paciente/InicioPaciente.jsx` — hecho cuando: T011 sigue en verde sin cambiar ninguna de sus aserciones. El componente recibe `cita`, `accion`, `onCerrar` y `onHecho(accion)`; tiene los mismos títulos, campos, textos y validación del motivo; carga los horarios con `cita.id_servicio`; llama a `PUT` o `PATCH` con `cita.id`, y muestra en `error` el mensaje del servidor o el de respaldo. Inicio le pasa la próxima cita con `id: id_cita` y, en `onHecho`, recarga y muestra su aviso como hoy — cubre: CA3, CA4, CA5, CA7 — depende: T011
- [ ] T022 Mostrar «Reprogramar» y «Cancelar cita» en «Mis citas» — `frontend/src/pages/paciente/CitasPaciente.jsx` — hecho cuando: pasa T012 y siguen en verde `inicio-paciente.test.jsx` y los demás tests del frontend. En las tarjetas con `modificable`, los dos botones (`.mf-btn .mf-btn-prin` y `.mf-btn .mf-btn-sec`, con sus íconos) dentro de `.cita-acciones`, con `aria-label` de la cita. Abren `ModalAccionCita`; en `onHecho`, vuelven a pedir `/citas/miscitas` y muestran el aviso de Inicio («Cita reprogramada» o «Cita cancelada»). Al cerrar, el foco vuelve al botón que lo abrió, o al título de la tarjeta si ya no tiene botones · verificación manual: capturas de «Mis citas» e Inicio a 390 y 1440 px antes y después, comparadas con `design.md` (K1, K2); con lector de pantalla y teclado, cada botón se anuncia con su cita y el foco vuelve al cerrar (K3) — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9 — depende: T012, T020, T021

## Integración y documentación
- [ ] T090 Actualizar `docs/architecture.md` si cambió la estructura — `docs/architecture.md` — hecho cuando: `ModalAccionCita` figura entre los componentes del portal del paciente, y «Mis citas» como consumidora de `id_servicio` y `modificable`
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas — hecho cuando: confirmado que no cambian, anotado como nota
- [ ] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen en local en T022
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout): backend y frontend en el mismo `up -d --build`; «Mis citas» muestra las acciones en una pendiente futura; sin errores en `/api/v1/citas/miscitas` ni en `/citas/mias/*`
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010, T012 | T020, T022 |
| CA2 | T010, T012 | T020, T022 |
| CA3 | T012 | T021, T022 |
| CA4 | T012 | T021, T022 |
| CA5 | T012 | T021, T022 |
| CA6 | T012 | T022 |
| CA7 | T011 | T021 |
| CA8 | T010 | T020 |
| CA9 | T012 | T022 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020 | T010 |
| TM2 | T020 | T010 |
| TM3 | T020 | T010 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `backend/src/modules/citas/citas.repository.js` | T020 |
| `backend/src/modules/citas/citas.service.js` | T020 |
| `frontend/src/components/ModalAccionCita.jsx` | T021 |
| `frontend/src/pages/paciente/InicioPaciente.jsx` | T021 |
| `frontend/src/pages/paciente/CitasPaciente.jsx` | T022 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| WCAG 2.1 AA en las acciones y el formulario | T012 · verificación manual en T022 |
| Mensajes en español sin detalles internos | T012 |
| Reglas en el servidor | T010, T012 |
