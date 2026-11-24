---
spec: 030-acciones-mis-citas
plan: plan.md
impl_base: 12a80fe
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
- **P8:** T010 prueba las rutas por rol antes de cambiarlas (T020). ✅
- **P17:** el servidor decide `modificable` y el rechazo (T020) antes de que la vista los use (T022). ✅
- **P20:** ninguna tarea toca hojas de estilo; T012 comprueba que `ModalAccionCita` no tiene valores visuales literales. ✅
- **P7, P13, P18, P19:** ➖, como en el plan. ➖

## Preparación
Sin tareas: no hay dependencias, configuración ni migraciones.

## Tests (antes de implementar)
- [x] T010 [P] Tests del servidor: `modificable`, rechazo de citas terminadas y permisos por rol — `backend/tests/citas/mis-citas-modificable.test.js` — hecho cuando: fallan por la razón esperada los casos nuevos (no hay `modificable`, `id_servicio` ni rechazo). Repositorios simulados con `fecha_agendada` como `Date` y la hora fijada con `jest.useFakeTimers`: — cubre: CA1, CA2, CA7, CA8, CA10
  - la hora se fija a las 23:30 de México (fecha UTC del día siguiente) y `fecha_agendada` es un `Date` a medianoche local, como el driver;
  - `modificable` verdadero para una pendiente de mañana y para una de hoy que empieza dentro de un minuto; falso para una que empieza justo ahora, para una de hoy que empezó hace un minuto (sin terminar), para una de ayer y para una completada o cancelada futura;
  - cada cita incluye `id_servicio`;
  - `PUT /api/v1/citas/mias/:id` y `PATCH /api/v1/citas/mias/:id/cancelar` sobre una pendiente propia que terminó hace un minuto → 400 con el cuerpo exacto `{ success: false, status: "fail", message: "Esta cita ya pasó y no se puede modificar." }`, sin actualizar; sobre una que termina justo ahora, también 400; sobre una en curso, se procesa; cancelar una pendiente futura con `duracion` NULL, se procesa;
  - `GET /api/v1/citas/miscitas` sin token → 401; con token de Paciente, Administrador y Asistente, cada uno recibe solo las citas de su propio perfil;
  - `PUT` y `PATCH` sobre una cita de otro → 404 sin actualizar, con token de Paciente y de Asistente; cancelar una completada propia → 400;
  - un bloque con el repositorio real y `jest.spyOn(pool, 'query')`: el SQL de `getMisCitas` y de `getCitaConUsuario` lleva `?` y el id va en los parámetros, no en el texto.
  Los casos que ya se cumplen se comprueban rompiendo lo que protegen
  - nota: 16 de 25 fallan por la razón esperada (no hay `modificable`, `id_servicio` ni rechazo de terminadas)
  - nota: comprobados rompiendo lo protegido los que ya pasan: sin `verifyToken` en `/miscitas` falla el 401; sin la comprobación de propiedad fallan los 3 de «otro»; sin la de estado falla «completada propia»; con el id interpolado en el SQL falla P9. Restaurado, pasan
  - nota: al comprobar la propiedad se vio que los 404 por HTTP pasaban por otra razón (`getCitaById` sin simular); se simula una cita actualizable para que el 404 solo pueda venir de la propiedad
  - nota: «en curso» y «duración NULL» pasan hoy porque no hay rechazo; se comprueban rompiendo la regla en T020
- [x] T011 [P] Test de caracterización de Inicio — `frontend/tests/inicio-paciente.test.jsx` — hecho cuando: pasa antes del cambio, con `api` simulado. Comprueba: — cubre: CA7
  - al montarse pide `/citas/proximacita`;
  - la tarjeta «Próxima cita» muestra «Reprogramar» y «Cancelar cita»;
  - el formulario de reprogramar tiene «Nueva fecha», «Nueva hora» y «Motivo», y pide los horarios con el `id_servicio` de la próxima cita;
  - confirmar manda `PUT /citas/mias/<id_cita>` con fecha, hora y motivo, y muestra el aviso «Cita reprogramada» / «Tu cita se reprogramó correctamente.»;
  - cancelar manda `PATCH /citas/mias/<id_cita>/cancelar` con el motivo, y muestra «Cita cancelada» / «Tu cita se canceló correctamente.»;
  - con un motivo de solo espacios (`"   "`), sale el error del formulario.
  Se comprueba rompiendo un texto
  - nota: caracterización: 4/4 antes del cambio, dos corridas iguales. Comprobada rompiendo el texto del aviso de reprogramar y el id del PATCH: falla; restaurado, pasa. La barra lateral va simulada (no es parte de lo que se caracteriza)
- [x] T012 [P] Tests de las acciones en «Mis citas» — `frontend/tests/mis-citas-acciones.test.jsx` — hecho cuando: fallan por la razón esperada (no hay botones ni componente). Con `api` simulado: — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9
  - una pendiente con `modificable: true` muestra «Reprogramar» y «Cancelar cita», con nombre accesible «Reprogramar cita de <servicio> del dd/mm/aaaa a las hh:mm AM/PM» y «Cancelar cita de <servicio> del dd/mm/aaaa a las hh:mm AM/PM»;
  - una pendiente con `modificable: false` y una completada no los muestran, y la completada conserva «Dejar comentario». Los casos que ya pasan se comprueban rompiendo lo que protegen;
  - reprogramar pide los horarios con el `id_servicio` de esa cita, exige el motivo, manda `PUT /citas/mias/<id de esa tarjeta>`, vuelve a pedir `/citas/miscitas`, la tarjeta muestra la nueva fecha y sale «Cita reprogramada» / «Tu cita se reprogramó correctamente.»;
  - cancelar manda `PATCH /citas/mias/<id>/cancelar`; la tarjeta queda cancelada sin botones y sale «Cita cancelada» / «Tu cita se canceló correctamente.»;
  - un rechazo del servidor sale en el `role="alert"` del formulario y la tarjeta conserva sus datos; un motivo de solo espacios muestra el error del formulario;
  - con dos pendientes, la llamada va al id de la elegida y la otra conserva sus botones;
  - foco: cerrar sin guardar lo devuelve al botón que abrió el formulario; tras «Aceptar» en el aviso de reprogramar, va al botón «Reprogramar» de esa tarjeta; tras el de cancelar, a «Agendar nueva cita»; si la recarga de la lista falla, también a «Agendar nueva cita»;
  - `src/components/ModalAccionCita.jsx` no contiene colores, medidas con unidad, un valor numérico de `ancho` ni `style=`, con un control positivo que detecta un literal de ejemplo.
  Dos corridas iguales
  - nota: 11 de 13 fallan por la razón esperada (no hay botones; `ModalAccionCita.jsx` no existe, ENOENT); dos corridas iguales. Pasan el control positivo del patrón y el caso negativo (pendiente no modificable y completada sin botones), que se comprueba rompiendo la condición en T022

- [x] T013 Dar fecha, hora y duración futuras a los mocks de `getCitaConUsuario` de los tests existentes — `backend/tests/citas/horario-paciente.test.js`, `backend/tests/citas/tipos-paciente.test.js` — hecho cuando: siguen en verde antes del cambio y sus mocks devuelven una pendiente futura con `fecha_agendada` como `Date`, `hora` y `duracion`, para que el rechazo de CA10 no los rompa (/analyze A19) — cubre: CA7
  - nota: A19: los dos mocks devuelven una pendiente del 2030-01-07 a las 10:00 con duración de 1 h (`Date` a medianoche local, como el driver). 50/50 en verde antes del cambio

## Implementación
- [x] T020 Añadir `id_servicio` y `modificable` a «Mis citas» y rechazar las citas terminadas — `backend/src/modules/citas/citas.repository.js`, `backend/src/modules/citas/citas.service.js` — hecho cuando: pasa T010 y siguen en verde `tests/citas` y `tests/comentarios`. Cambios: — cubre: CA1, CA2, CA7, CA8, CA10 — depende: T010, T013
  - `getMisCitas` añade `c.id_servicio` a la consulta; el servicio calcula `modificable` (pendiente y fecha + hora de inicio posteriores a la hora de `America/Mexico_City`);
  - `getCitaConUsuario` añade `c.fecha_agendada`, `c.hora` y `s.duracion` con un `LEFT JOIN` a `servicio`;
  - las dos reglas usan `fechaComoTexto` y minutos numéricos, con el límite de `getProximaCita` (no modificable si inicio ≤ ahora; rechazada si fin ≤ ahora), y una `duracion` NULL cuenta como 0;
  - `obtenerCitaPropia`, después de la propiedad y del estado, lanza `AppError("Esta cita ya pasó y no se puede modificar.", 400)` si el inicio + duración ya pasó;
  - no devuelve la duración al cliente.
  - nota: pasa T010 (25/25) y siguen en verde `tests/citas` y `tests/comentarios` (85/85). `ahoraEnMexico` (fecha con `toLocaleDateString` en `America/Mexico_City` y minuto del día), `aunNoEmpieza` y `yaTermino` con `fechaComoTexto` y minutos numéricos
  - nota: comprobado rompiendo cada regla: sin el rechazo fallan 3 casos de CA10; rechazando por el inicio falla «en curso»; sin la guarda de duración NULL falla su caso; con `>=` en el inicio falla «empieza justo ahora»; con la fecha UTC fallan 2 casos de modificable. Restaurado, pasan
  - nota: archivo extra justificado (test de T010): el caso de duración NULL usaba una cita de mañana y no llegaba a mirar la duración; ahora es de hoy y más tarde
- [x] T021 Extraer el formulario de Inicio a `ModalAccionCita` y usarlo en Inicio — `frontend/src/components/ModalAccionCita.jsx`, `frontend/src/pages/paciente/InicioPaciente.jsx` — hecho cuando: T011 sigue en verde sin cambiar ninguna de sus aserciones. El componente: — cubre: CA3, CA4, CA5, CA7 — depende: T011
  - recibe `cita` (`id`, `id_servicio`), `subtitulo` ya formateado, `accion`, `ancho`, `onCerrar` y `onHecho(accion)`;
  - tiene los mismos títulos, campos, textos y validación del motivo;
  - carga los horarios con `cita.id_servicio` y llama a `PUT` o `PATCH` con `cita.id`;
  - muestra en `error` el mensaje del servidor o el de respaldo;
  - no gestiona el foco ni tiene valores visuales literales.
  Inicio le pasa `{ ...proximaCita, id: proximaCita.id_cita }`, su subtítulo de hoy y `ancho={500}`, y en `onHecho` recarga y muestra su aviso como hoy
  - nota: T011 sigue 4/4 en dos corridas sin tocar sus aserciones. `ModalAccionCita` recibe `cita`, `subtitulo`, `accion`, `ancho`, `onCerrar` y `onHecho`; Inicio le pasa `{ ...proximaCita, id: id_cita }`, su subtítulo y `ancho={500}`
  - nota: archivo extra justificado: `src/utils/avisosCita.js` con los avisos de éxito, porque exportar una constante desde el archivo del componente rompe `react-refresh/only-export-components`; así las dos pantallas comparten los mismos textos (A14)
  - nota: lint: al simplificar Inicio, el analizador de React marcó `set-state-in-effect` en su carga inicial (antes no la marcaba). Se difiere con `Promise.resolve().then(cargarTodo)`; Inicio queda con la misma advertencia previa que tenía. A27: queda una copia de `formatearHora` en el componente para las opciones de horario
- [x] T022 Mostrar «Reprogramar» y «Cancelar cita» en «Mis citas» — `frontend/src/pages/paciente/CitasPaciente.jsx` — hecho cuando: pasa T012 y siguen en verde `inicio-paciente.test.jsx` y los demás tests del frontend. En las tarjetas con `modificable`: — cubre: CA1, CA2, CA3, CA4, CA5, CA6, CA9 — depende: T012, T020, T021
  - los dos botones (`.mf-btn .mf-btn-prin` y `.mf-btn .mf-btn-sec`, con sus íconos) dentro de `.cita-acciones`, con `aria-label` de la cita;
  - abren `ModalAccionCita` con el mismo `ancho` que Inicio (500, deuda DS2) y el subtítulo «servicio · fecha · hora»;
  - en `onHecho`, vuelven a pedir `/citas/miscitas` y muestran el aviso de Inicio;
  - el foco sigue `design.md`: referencia al botón que abrió el formulario y, para «Agendar nueva cita», el botón del encabezado buscado dentro del contenedor de la pantalla.
  · verificación manual: capturas de «Mis citas» e Inicio a 390 y 1440 px antes y después, comparadas con `design.md` (K1, K2); con lector de pantalla y teclado, cada botón se anuncia con su cita y el foco llega a un control con foco visible al cerrar, anotando el destino (K3); contraste de los botones medido en navegador y anotado (excepción P16, /analyze A18)
  - nota: código y tests listos: T012 13/13 en dos corridas; frontend 30 archivos y 262 pruebas; build en verde; lint con los 7 errores previos. Comprobados rompiéndolos: botones solo con `modificable`, foco al cerrar sin guardar y foco tras el aviso
  - nota: desbloqueada 2026-11-23 — el usuario hizo la verificación manual
  - nota: verificación manual OK 2026-11-23 (usuario): backend y frontend de la rama en local (Docker y Vite en :8080, con la API en `127.0.0.1:3000`), cuenta de paciente con dos citas futuras. Se ven las acciones en las pendientes, se reprograma una y se cancela otra, Inicio igual, y con el Narrador cada botón se anuncia con su cita y el foco vuelve al cerrar, a 1440 y 390 px. Contraste de los botones: el de Inicio, sin cambios (excepción P16, A18: 3.70–2.84:1 en `.mf-btn-prin`, 4.17:1 en el rojo de cancelar, 1.48:1 en el borde de `.mf-btn-sec`)

## Correcciones de /review (ronda 1)
- [x] T030 Tests de las correcciones de «Mis citas»: foco y aviso tras la recarga, y casos que faltaban — `frontend/tests/mis-citas-acciones.test.jsx` — hecho cuando: fallan por la razón esperada los de R1 y R2 y pasan los de R5 — cubre: CA3, CA4, CA5, CA6, CA9
  - R1: con la recarga de `/citas/miscitas` pendiente, pulsar «Aceptar» en el aviso deja el foco en el destino (el botón «Reprogramar» de esa tarjeta o «Agendar nueva cita»), no en `body`; un aviso posterior sin acción (p. ej. el del comentario) no mueve el foco a ese destino
  - R2: si la recarga posterior a reprogramar falla, se sigue viendo «Tu cita se reprogramó correctamente.» y la lista conserva sus tarjetas
  - R5: reprogramar con dos pendientes cambia solo la elegida (la otra conserva fecha, hora y botones); la cancelada no muestra ni «Reprogramar» ni «Cancelar cita»; un rechazo al cancelar sale en el `role="alert"` y la tarjeta queda intacta
  - nota: añadida por /review: R1, R2, R5
  - nota: 3 fallan por la razón esperada en dos corridas: el foco cae en `body` con la recarga pendiente (R1), el aviso posterior desvía el foco al botón de la cita reprogramada (R1) y el error de recarga tapa el aviso de éxito (R2). Los 3 de R5 pasan (el comportamiento ya era correcto). La recarga se puede retener desde el test para reproducir la carrera
- [x] T031 Tests del servidor que faltaban — `backend/tests/citas/mis-citas-modificable.test.js` — hecho cuando: pasan, y los que ya se cumplen se comprueban rompiendo lo que protegen — cubre: CA8, CA10
  - R4: el 404 sobre una cita ajena también con el rol Administrador
  - R12: el archivo fija `process.env.TZ = 'UTC'` antes de cargar nada, para que el caso de las 23:30 detecte un error de zona en cualquier máquina
  - R13: una pendiente de hoy que empezó a las 23:00 con `duracion` NULL → 400 (NULL cuenta como 0)
  - nota: añadida por /review: R4, R12, R13
  - nota: R4: 404 también con el rol Administrador; comprobado sin la verificación de propiedad, falla. R13: pendiente empezada a las 23:00 con duración NULL → 400; comprobado contando NULL como NaN, falla
  - nota: R12: fijar `process.env.TZ` dentro del archivo no tiene efecto en Jest (el cálculo con la zona del proceso seguía pasando). Archivo extra justificado: `tests/support/guard.js` (`globalSetup`) fija `TZ=UTC` antes de crear los procesos de prueba; ahora el cálculo roto falla en local (2 casos) y la suite completa pasa en UTC (38 suites, 471 pruebas)
- [x] T032 Corregir el foco y el aviso tras reprogramar o cancelar, y reiniciar el formulario por apertura — `frontend/src/pages/paciente/CitasPaciente.jsx`, `frontend/src/components/ModalAccionCita.jsx`, `frontend/src/pages/paciente/InicioPaciente.jsx` — hecho cuando: pasa T030 y siguen en verde `inicio-paciente.test.jsx` y el resto del frontend; lint sin errores nuevos — cubre: CA3, CA7, CA9 — depende: T030
  - R1: el destino del foco se fija antes de abrir el aviso y solo vale para ese aviso
  - R2: la recarga posterior a una acción no muestra su propio aviso ni vacía la lista si falla; el destino pasa a «Agendar nueva cita»
  - R10: al cerrar el formulario sin guardar, el foco vuelve al botón directamente, sin `setTimeout`
  - R9: las dos pantallas montan `ModalAccionCita` con una `key` por apertura y el componente quita su efecto de reinicio
  - R8: el comentario de `Promise.resolve().then(cargarTodo)` en Inicio dice que es por un falso positivo de `react-hooks/set-state-in-effect`
  - nota: añadida por /review: R1, R2, R8, R9, R10
  - nota: pasa T030 (19/19 en dos corridas) y sigue `inicio-paciente.test.jsx` (4/4); frontend 30 archivos y 268 pruebas; build en verde; lint con los 7 errores previos
  - nota: R1: el destino se guarda antes de abrir el aviso junto al aviso al que pertenece, y cerrar cualquier aviso lo consume. R2: la recarga tras una acción es `silenciosa`: si falla, no muestra su aviso ni vacía la lista, y el destino pasa a «Agendar nueva cita». R10: al cerrar el formulario se enfoca el botón directamente. R9: las dos pantallas montan `ModalAccionCita` con `key` por apertura; el componente ya no tiene efecto de reinicio. R8: comentario del `Promise.resolve` en Inicio
  - nota: comprobados rompiéndolos: sin `silenciosa` falla R2; sin consumir el destino falla el aviso posterior de R1. Restaurado, pasan
- [x] T033 Reutilizar el cálculo de la hora de México — `backend/src/modules/citas/citas.service.js` — hecho cuando: `getProximaCita` usa `ahoraEnMexico()` y `getMisCitas` lo calcula una vez por lista; siguen en verde `tests/citas` y `tests/comentarios` — cubre: CA1, CA10 — depende: T031
  - nota: añadida por /review: R11
  - nota: R11: `ahoraEnMexico` devuelve también la hora en texto; `getProximaCita` lo usa y `getMisCitas` lo calcula una vez por lista. `tests/citas` y `tests/comentarios` 88/88; backend 472
  - nota: archivo extra justificado: `getProximaCita` no tenía test. Se añade un caso de caracterización en `mis-citas-modificable.test.js` (fecha y hora de México que recibe el repositorio): pasa con la versión anterior y con la nueva, y falla si se rompe el parámetro

## Integración y documentación
- [x] T090 Actualizar `docs/architecture.md` y la spec 005 — `docs/architecture.md`, `docs/specs/005-portal-paciente-citas/spec.md` — hecho cuando: §Frontend menciona `ModalAccionCita` como componente compartido por Inicio y «Mis citas»; la 005 tiene en su Historial que la 030 extiende `/miscitas` y añade el rechazo de las citas terminadas, y su CA10 marcado `[x]` con el test de T010
  - nota: §Frontend de `architecture.md` menciona `ModalAccionCita` y `modificable`; la 005 tiene la entrada en su Historial y su CA10 en `[x]` (A17, A26)
- [x] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas — hecho cuando: confirmado que no cambian, anotado como nota
  - nota: sin cambios: no hay variables, entornos, pasos de despliegue, logs, eventos de auditoría ni métricas nuevos
- [x] T092 Marcar spec como `implemented`
  - nota: 10 de 10 criterios marcados con su test en verde: backend 38 suites, 469 pruebas y 5 `todo`; frontend 30 archivos y 262 pruebas; build en verde; lint con los errores previos (backend 1, frontend 7). gitleaks lo ejecuta el CI del PR
  - nota: tras las tareas de /review (T030–T033): backend 38 suites, 472 pruebas y 5 `todo` (en UTC); frontend 30 archivos y 268 pruebas; build en verde; lint con los errores previos (backend 1, frontend 7)

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones se hacen en local en T022
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout): backend y frontend en el mismo `up -d --build`; «Mis citas» muestra las acciones en una pendiente futura; sin errores en `/api/v1/citas/miscitas` ni en `/citas/mias/*`
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010, T012 | T020, T022, T033 |
| CA2 | T010, T012 | T020, T022 |
| CA3 | T012, T030 | T021, T022, T032 |
| CA4 | T012, T030 | T021, T022 |
| CA5 | T012, T030 | T021, T022 |
| CA6 | T012, T030 | T022 |
| CA7 | T010, T011, T013 | T020, T021, T032 |
| CA8 | T010, T031 | T020 |
| CA9 | T012, T030 | T022, T032 |
| CA10 | T010, T031 | T020, T033 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T020 | T010 |
| TM2 | T020 | T010 |
| TM3 | T020 | T010 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `backend/src/modules/citas/citas.repository.js` | T020 |
| `backend/src/modules/citas/citas.service.js` | T020, T033 |
| `frontend/src/components/ModalAccionCita.jsx` | T021, T032 |
| `frontend/src/pages/paciente/InicioPaciente.jsx` | T021, T032 |
| `frontend/src/pages/paciente/CitasPaciente.jsx` | T022, T032 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| WCAG 2.1 AA en las acciones y el formulario | T012 · verificación manual en T022 |
| Mensajes en español sin detalles internos | T010, T012 |
| Reglas en el servidor | T010, T012 |
