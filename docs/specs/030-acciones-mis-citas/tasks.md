---
spec: 030-acciones-mis-citas
plan: plan.md
status: draft
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
- **P8:** T010 prueba las rutas por rol antes de cambiarlas (T020). ✅
- **P17:** el servidor decide `modificable` y el rechazo (T020) antes de que la vista los use (T022). ✅
- **P20:** ninguna tarea toca hojas de estilo; T012 comprueba que `ModalAccionCita` no tiene valores visuales literales. ✅
- **P7, P13, P18, P19:** ➖, como en el plan. ➖

## Preparación
Sin tareas: no hay dependencias, configuración ni migraciones.

## Tests (antes de implementar)
- [ ] T010 [P] Tests del servidor: `modificable`, rechazo de citas terminadas y permisos por rol — `backend/tests/citas/mis-citas-modificable.test.js` — hecho cuando: fallan por la razón esperada los casos nuevos (no hay `modificable`, `id_servicio` ni rechazo). Repositorios simulados con `fecha_agendada` como `Date` y la hora fijada con `jest.useFakeTimers`: — cubre: CA1, CA2, CA7, CA8, CA10
  - la hora se fija a las 23:30 de México (fecha UTC del día siguiente) y `fecha_agendada` es un `Date` a medianoche local, como el driver;
  - `modificable` verdadero para una pendiente de mañana y para una de hoy que empieza dentro de un minuto; falso para una que empieza justo ahora, para una de hoy que empezó hace un minuto (sin terminar), para una de ayer y para una completada o cancelada futura;
  - cada cita incluye `id_servicio`;
  - `PUT /api/v1/citas/mias/:id` y `PATCH /api/v1/citas/mias/:id/cancelar` sobre una pendiente propia que terminó hace un minuto → 400 con el cuerpo exacto `{ success: false, status: "fail", message: "Esta cita ya pasó y no se puede modificar." }`, sin actualizar; sobre una que termina justo ahora, también 400; sobre una en curso, se procesa; cancelar una pendiente futura con `duracion` NULL, se procesa;
  - `GET /api/v1/citas/miscitas` sin token → 401; con token de Paciente, Administrador y Asistente, cada uno recibe solo las citas de su propio perfil;
  - `PUT` y `PATCH` sobre una cita de otro → 404 sin actualizar, con token de Paciente y de Asistente; cancelar una completada propia → 400;
  - un bloque con el repositorio real y `jest.spyOn(pool, 'query')`: el SQL de `getMisCitas` y de `getCitaConUsuario` lleva `?` y el id va en los parámetros, no en el texto.
  Los casos que ya se cumplen se comprueban rompiendo lo que protegen
- [ ] T011 [P] Test de caracterización de Inicio — `frontend/tests/inicio-paciente.test.jsx` — hecho cuando: pasa antes del cambio, con `api` simulado. Comprueba: — cubre: CA7
  - al montarse pide `/citas/proximacita`;
  - la tarjeta «Próxima cita» muestra «Reprogramar» y «Cancelar cita»;
  - el formulario de reprogramar tiene «Nueva fecha», «Nueva hora» y «Motivo», y pide los horarios con el `id_servicio` de la próxima cita;
  - confirmar manda `PUT /citas/mias/<id_cita>` con fecha, hora y motivo, y muestra el aviso «Cita reprogramada» / «Tu cita se reprogramó correctamente.»;
  - cancelar manda `PATCH /citas/mias/<id_cita>/cancelar` con el motivo, y muestra «Cita cancelada» / «Tu cita se canceló correctamente.»;
  - con un motivo de solo espacios (`"   "`), sale el error del formulario.
  Se comprueba rompiendo un texto
- [ ] T012 [P] Tests de las acciones en «Mis citas» — `frontend/tests/mis-citas-acciones.test.jsx` — hecho cuando: fallan por la razón esperada (no hay botones ni componente). Con `api` simulado: — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9
  - una pendiente con `modificable: true` muestra «Reprogramar» y «Cancelar cita», con nombre accesible «Reprogramar cita de <servicio> del dd/mm/aaaa a las hh:mm AM/PM» y «Cancelar cita de <servicio> del dd/mm/aaaa a las hh:mm AM/PM»;
  - una pendiente con `modificable: false` y una completada no los muestran, y la completada conserva «Dejar comentario». Los casos que ya pasan se comprueban rompiendo lo que protegen;
  - reprogramar pide los horarios con el `id_servicio` de esa cita, exige el motivo, manda `PUT /citas/mias/<id de esa tarjeta>`, vuelve a pedir `/citas/miscitas`, la tarjeta muestra la nueva fecha y sale «Cita reprogramada» / «Tu cita se reprogramó correctamente.»;
  - cancelar manda `PATCH /citas/mias/<id>/cancelar`; la tarjeta queda cancelada sin botones y sale «Cita cancelada» / «Tu cita se canceló correctamente.»;
  - un rechazo del servidor sale en el `role="alert"` del formulario y la tarjeta conserva sus datos; un motivo de solo espacios muestra el error del formulario;
  - con dos pendientes, la llamada va al id de la elegida y la otra conserva sus botones;
  - foco: cerrar sin guardar lo devuelve al botón que abrió el formulario; tras «Aceptar» en el aviso de reprogramar, va al botón «Reprogramar» de esa tarjeta; tras el de cancelar, a «Agendar nueva cita»; si la recarga de la lista falla, también a «Agendar nueva cita»;
  - `src/components/ModalAccionCita.jsx` no contiene colores, medidas con unidad, un valor numérico de `ancho` ni `style=`, con un control positivo que detecta un literal de ejemplo.
  Dos corridas iguales

- [ ] T013 Dar fecha, hora y duración futuras a los mocks de `getCitaConUsuario` de los tests existentes — `backend/tests/citas/horario-paciente.test.js`, `backend/tests/citas/tipos-paciente.test.js` — hecho cuando: siguen en verde antes del cambio y sus mocks devuelven una pendiente futura con `fecha_agendada` como `Date`, `hora` y `duracion`, para que el rechazo de CA10 no los rompa (/analyze A19) — cubre: CA7

## Implementación
- [ ] T020 Añadir `id_servicio` y `modificable` a «Mis citas» y rechazar las citas terminadas — `backend/src/modules/citas/citas.repository.js`, `backend/src/modules/citas/citas.service.js` — hecho cuando: pasa T010 y siguen en verde `tests/citas` y `tests/comentarios`. Cambios: — cubre: CA1, CA2, CA7, CA8, CA10 — depende: T010, T013
  - `getMisCitas` añade `c.id_servicio` a la consulta; el servicio calcula `modificable` (pendiente y fecha + hora de inicio posteriores a la hora de `America/Mexico_City`);
  - `getCitaConUsuario` añade `c.fecha_agendada`, `c.hora` y `s.duracion` con un `LEFT JOIN` a `servicio`;
  - las dos reglas usan `fechaComoTexto` y minutos numéricos, con el límite de `getProximaCita` (no modificable si inicio ≤ ahora; rechazada si fin ≤ ahora), y una `duracion` NULL cuenta como 0;
  - `obtenerCitaPropia`, después de la propiedad y del estado, lanza `AppError("Esta cita ya pasó y no se puede modificar.", 400)` si el inicio + duración ya pasó;
  - no devuelve la duración al cliente.
- [ ] T021 Extraer el formulario de Inicio a `ModalAccionCita` y usarlo en Inicio — `frontend/src/components/ModalAccionCita.jsx`, `frontend/src/pages/paciente/InicioPaciente.jsx` — hecho cuando: T011 sigue en verde sin cambiar ninguna de sus aserciones. El componente: — cubre: CA3, CA4, CA5, CA7 — depende: T011
  - recibe `cita` (`id`, `id_servicio`), `subtitulo` ya formateado, `accion`, `ancho`, `onCerrar` y `onHecho(accion)`;
  - tiene los mismos títulos, campos, textos y validación del motivo;
  - carga los horarios con `cita.id_servicio` y llama a `PUT` o `PATCH` con `cita.id`;
  - muestra en `error` el mensaje del servidor o el de respaldo;
  - no gestiona el foco ni tiene valores visuales literales.
  Inicio le pasa `{ ...proximaCita, id: proximaCita.id_cita }`, su subtítulo de hoy y `ancho={500}`, y en `onHecho` recarga y muestra su aviso como hoy
- [ ] T022 Mostrar «Reprogramar» y «Cancelar cita» en «Mis citas» — `frontend/src/pages/paciente/CitasPaciente.jsx` — hecho cuando: pasa T012 y siguen en verde `inicio-paciente.test.jsx` y los demás tests del frontend. En las tarjetas con `modificable`: — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9 — depende: T012, T020, T021
  - los dos botones (`.mf-btn .mf-btn-prin` y `.mf-btn .mf-btn-sec`, con sus íconos) dentro de `.cita-acciones`, con `aria-label` de la cita;
  - abren `ModalAccionCita` con el mismo `ancho` que Inicio (500, deuda DS2) y el subtítulo «servicio · fecha · hora»;
  - en `onHecho`, vuelven a pedir `/citas/miscitas` y muestran el aviso de Inicio;
  - el foco sigue `design.md`: referencia al botón que abrió el formulario y, para «Agendar nueva cita», el botón del encabezado buscado dentro del contenedor de la pantalla.
  · verificación manual: capturas de «Mis citas» e Inicio a 390 y 1440 px antes y después, comparadas con `design.md` (K1, K2); con lector de pantalla y teclado, cada botón se anuncia con su cita y el foco llega a un control con foco visible al cerrar, anotando el destino (K3); contraste de los botones medido en navegador y anotado (excepción P16, /analyze A18)

## Integración y documentación
- [ ] T090 Actualizar `docs/architecture.md` y la spec 005 — `docs/architecture.md`, `docs/specs/005-portal-paciente-citas/spec.md` — hecho cuando: §Frontend menciona `ModalAccionCita` como componente compartido por Inicio y «Mis citas»; la 005 tiene en su Historial que la 030 extiende `/miscitas` y añade el rechazo de las citas terminadas, y su CA10 marcado `[x]` con el test de T010
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
| CA7 | T010, T011, T013 | T020, T021 |
| CA8 | T010 | T020 |
| CA9 | T012 | T022 |
| CA10 | T010 | T020 |

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
| Mensajes en español sin detalles internos | T010, T012 |
| Reglas en el servidor | T010, T012 |
