---
spec: 030-acciones-mis-citas
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-23
---

# Plan · 030 Reprogramar y cancelar desde «Mis citas»

## Enfoque técnico
El servidor ya reprograma y cancela las citas propias `pendiente` (spec 005). A «Mis citas» le
faltan dos datos de cada cita: su servicio, para pedir los horarios disponibles, y si todavía se
puede modificar. `GET /citas/miscitas` añade `id_servicio` y `modificable`. `modificable` lo calcula
el servicio con la misma regla de «Próxima cita»: pendiente y su fin (hora + duración del servicio)
aún no llega en la hora de México. Así la regla vive en el servidor (P17) y no se repite en la
vista. En el frontend, el formulario de Inicio se extrae a un componente `ModalAccionCita`, que
usan Inicio (sin cambio visible) y «Mis citas».

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 030 `approved`; `design.md` por aprobar | manual: `aidd.py status` antes de `/implement` |
| P2 Tests por feature | ✅ | Cada CA con test (Trazabilidad) | test: `backend/tests/citas/mis-citas-modificable.test.js`, `frontend/tests/mis-citas-acciones.test.jsx`, `frontend/tests/inicio-paciente.test.jsx` |
| P3 Dependencias nuevas con ADR | ➖ | Ninguna | — |
| P4 Arquitectura con ADR | ✅ | Sigue los módulos de siempre; se añade un componente | manual: `/review` |
| P5 Producción solo con aprobación humana | ✅ | `/release` | manual: T096 |
| P6 Rollback documentado | ✅ | Sin migración; ver Rollout | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin cambios de esquema | — |
| P8 Autorización en el servidor | ✅ | `GET /miscitas`, `PUT /mias/:id` y `PATCH /mias/:id/cancelar` no cambian de control: `verifyToken` y propiedad verificada en el servicio. Ningún endpoint nuevo | test: `mis-citas-modificable.test.js` → sin token 401; cita de otro paciente 404 al reprogramar y al cancelar (CA8) |
| P9 Entrada validada y SQL parametrizado | ✅ | La consulta de `getMisCitas` solo gana columnas; el id del paciente sigue en `?` | test: `mis-citas-modificable.test.js` → el id en los parámetros |
| P10 Secretos fuera del repositorio | ✅ | Ninguno | lint: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | `npm audit`: 0 altas y 0 críticas (2026-11-23) | test: npm audit y trivy en CI |
| P12 Modelo de amenazas en datos sensibles | ✅ | Toca citas del paciente (datos de salud): modelo abajo | manual: `/analyze` |
| P13 Auditoría de datos sensibles | ❌ aceptado: reprogramar y cancelar no se auditan hoy; la excepción P13 cubre las acciones existentes hasta el objetivo 3 — aprobado por el usuario el 2026-11-11 (`docs/specs/021-proteccion-cuentas-admin/plan.md`) | Sin evento nuevo; la spec no añade acciones, solo otro punto de entrada en la interfaz | — (specs 027 y 028) |
| P14 Correlación por petición | ✅ | Sin cambio: los middlewares de la spec 026 | test: existente en `tests/logs/` |
| P15 Logs sin datos sensibles | ✅ | Sin logs nuevos | — (sin logs nuevos) |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | Botones con nombre accesible por cita, foco devuelto al cerrar, sin estilos nuevos | test: `mis-citas-acciones.test.jsx` por rol y nombre, y foco tras cerrar; manual: lector de pantalla y teclado |
| P17 Sin lógica de negocio en las vistas | ✅ | `modificable` lo calcula el servicio; la vista solo lo lee | test: `mis-citas-modificable.test.js` (regla); `mis-citas-acciones.test.jsx` (la vista no muestra acciones si `modificable` es falso aunque la cita sea pendiente) |
| P18 Metadatos por ruta indexable | ➖ | Ruta privada | — |
| P19 Noindex fuera de lo público | ➖ | Sin cambios | — |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Sin estilos nuevos: clases existentes | test: `mis-citas-acciones.test.jsx` → `MisCitas.css` y `adminpanel.css` sin cambios en el diff (manual en `/review`) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/modules/citas/citas.repository.js` | `getMisCitas` añade `c.id_servicio` y `s.duracion` a la consulta | bajo |
| `backend/src/modules/citas/citas.service.js` | `getMisCitas` devuelve además `id_servicio` y `modificable` (pendiente y su fin aún no llega en `America/Mexico_City`, la misma regla que `getProximaCita`) | bajo |
| `frontend/src/components/ModalAccionCita.jsx` (nuevo) | El formulario de reprogramar o cancelar de Inicio, sin cambios de texto ni de campos: recibe `cita` (`id`, `id_servicio`, `nombre_servicio`, `fecha_agendada`, `hora`), `accion`, `onCerrar` y `onHecho`; carga los horarios, valida el motivo, llama a `PUT /citas/mias/:id` o `PATCH /citas/mias/:id/cancelar` y muestra el error del servidor | medio: Inicio pasa a usarlo |
| `frontend/src/pages/paciente/InicioPaciente.jsx` | Usa `ModalAccionCita` en lugar de su formulario propio; mismos textos, avisos y comportamiento | medio: lo cubre el test de no regresión |
| `frontend/src/pages/paciente/CitasPaciente.jsx` | En las tarjetas con `modificable`, los botones «Reprogramar» y «Cancelar cita» con `aria-label` de la cita; abre `ModalAccionCita`; tras el éxito vuelve a pedir `/citas/miscitas` y muestra el mismo aviso que Inicio; el foco vuelve al botón (o al título de la tarjeta si ya no hay botones) | bajo |

## Contratos y datos
**`GET /api/v1/citas/miscitas`** (paciente): cada cita gana dos campos, sin quitar ninguno:

| Campo | Tipo | Significado |
|---|---|---|
| `id_servicio` | número | servicio de la cita, para pedir horarios |
| `modificable` | booleano | `estado = 'pendiente'` y la fecha más hora más duración del servicio aún no llega en la hora de México |

`PUT /citas/mias/:id` y `PATCH /citas/mias/:id/cancelar` no cambian. Sin migración.

**Pantalla «Mis citas»:**

| Estado de la tarjeta | Qué se ve |
|---|---|
| `modificable` | «Reprogramar» y «Cancelar cita» |
| completada | «Dejar comentario» o «Comentario enviado», como hoy |
| cualquier otra | sin acciones |

## Estrategia de pruebas
- **Backend (Jest):** `backend/tests/citas/mis-citas-modificable.test.js`, con el repositorio de
  citas y el de pacientes simulados.
  - `modificable` es verdadero para una pendiente de mañana y para una de hoy cuyo fin aún no llega.
  - Es falso para una pendiente de hoy ya terminada, para una de ayer, y para una completada o
    cancelada futura. Se fija la hora con `jest.useFakeTimers`.
  - Incluye `id_servicio`.
  - Por HTTP: sin token 401; reprogramar y cancelar una cita de otro paciente → 404 sin cambios (CA8).
  - El id del paciente va en los parámetros de la consulta.
- **Frontend (Vitest + Testing Library):** `frontend/tests/mis-citas-acciones.test.jsx`, con `api`
  simulado.
  - Las tarjetas `modificable` muestran los dos botones con nombre accesible «Reprogramar cita de
    X del dd/mm/aaaa»; una pendiente con `modificable: false` y una completada no los muestran, y
    la completada conserva «Dejar comentario».
  - Reprogramar: pide horarios con el `id_servicio` de la cita, exige motivo, manda el `PUT`,
    actualiza solo esa tarjeta y muestra «Tu cita se reprogramó correctamente.».
  - Cancelar: el `PATCH`; la tarjeta pasa a cancelada sin botones.
  - Un rechazo del servidor sale en el `role="alert"` y la tarjeta no cambia.
  - Con dos pendientes, solo cambia la elegida.
  - Al cerrar, el foco vuelve al botón.
- **No regresión de Inicio:** `frontend/tests/inicio-paciente.test.jsx`. Antes del cambio
  (caracterización): la tarjeta «Próxima cita», sus dos botones, el formulario con sus campos y
  textos, la llamada `PUT`/`PATCH` y el aviso de éxito. Debe seguir en verde tras la extracción.
- **Manual:** capturas de «Mis citas» e Inicio a 390 y 1440 px antes y después (K1, K2); lector de
  pantalla y teclado en «Mis citas» (K3).

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Elevation: reprogramar o cancelar la cita de otro paciente con su id | A01:2025 Broken Access Control | `citas.service` (existente) | Propiedad verificada en el servidor, 404 sin revelar (spec 005) | `mis-citas-modificable.test.js` (CA8) |
| TM2 | Tampering: forzar la acción sobre una cita no modificable (pasada o no pendiente) llamando a la API aunque la vista no muestre los botones | A06:2025 Insecure Design | `citas.service` (existente) | El servidor rechaza las no pendientes (spec 005 CA8, CA9) y la fecha nueva pasada (CA4). Una pendiente pasada sí se puede reprogramar desde la API a una fecha futura, como hoy: no es una vía nueva | `mis-citas-modificable.test.js`: cancelar una completada → rechazo |
| TM3 | Information disclosure: la lista expone datos de citas | A01:2025 | `citas.service` | Solo las citas del paciente de la sesión; los campos nuevos no son sensibles | `mis-citas-modificable.test.js` (sin token 401; solo su `id_paciente`) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: pendientes futuras con acciones | `citas.service`, `citas.repository`, `CitasPaciente.jsx` | `mis-citas-modificable.test.js` «modificable verdadero»; `mis-citas-acciones.test.jsx` «botones en las modificables» · verificación manual: capturas a 390 y 1440 px (K1) |
| CA2: las demás sin acciones; las completadas como hoy | `citas.service`, `CitasPaciente.jsx` | `mis-citas-modificable.test.js` «falso para pasadas y no pendientes»; `mis-citas-acciones.test.jsx` «sin botones y comentario intacto» |
| CA3: reprogramar con el formulario de Inicio | `ModalAccionCita.jsx`, `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «reprogramar» |
| CA4: cancelar con motivo | `ModalAccionCita.jsx`, `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «cancelar» |
| CA5: rechazo del servidor visible, tarjeta intacta | `ModalAccionCita.jsx` | `mis-citas-acciones.test.jsx` «rechazo» |
| CA6: solo cambia la cita elegida | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «dos pendientes» |
| CA7: Inicio igual | `InicioPaciente.jsx`, `ModalAccionCita.jsx` | `inicio-paciente.test.jsx` (caracterización) · verificación manual: capturas de Inicio antes y después (K2) |
| CA8 (abuso): cita de otro paciente | `citas.service` (sin cambios) | `mis-citas-modificable.test.js` «404 al reprogramar y cancelar la de otro» |
| CA9: nombre accesible y teclado | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «nombre accesible» y «foco vuelve al botón» · verificación manual: lector de pantalla y teclado (K3) |
| TM1 | `citas.service` | `mis-citas-modificable.test.js` |
| TM2 | `citas.service` | `mis-citas-modificable.test.js` |
| TM3 | `citas.service` | `mis-citas-modificable.test.js` |
| RNF: WCAG 2.1 AA | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` · verificación manual en la tarea de la pantalla |
| RNF: mensajes en español sin detalles internos | `ModalAccionCita.jsx` | `mis-citas-acciones.test.jsx` «rechazo» (muestra el mensaje del servidor) |
| RNF: reglas en el servidor | `citas.service` | `mis-citas-modificable.test.js`; `mis-citas-acciones.test.jsx` «pendiente no modificable sin botones» |

## Observabilidad
Sin cambios: no hay logs ni eventos nuevos (P13 con excepción). Las peticiones siguen dejando su
línea «Petición atendida» con `request_id` (spec 026).

## Descubribilidad
No aplica: ruta privada del portal del paciente, con `noindex`.

## Rollout
- Feature flag: no aplica.
- Orden de despliegue: backend y frontend en el mismo `up -d --build`.
- Compatibilidad: los dos campos nuevos son adicionales. El frontend anterior los ignora; el nuevo
  contra el backend anterior no ve `modificable` y no muestra botones (falla de forma segura).
- Rollback: `git checkout <commit anterior> -- ../backend/src/modules/citas ../frontend` y
  reconstruir backend y frontend; sin efecto en datos.
- Métricas a vigilar: errores en `/api/v1/citas/miscitas` y en `/citas/mias/*` en los logs.

## Decisiones (→ ADR si son arquitectónicas)
- **`modificable` lo calcula el servidor** con la regla de `getProximaCita`. Así la vista no decide
  la regla (P17) y «aún no pasa» usa la hora de México, no la del navegador. Alternativa
  descartada: calcularlo en el navegador.
- **Extraer `ModalAccionCita`** en lugar de copiar el formulario en «Mis citas»: una sola versión
  de los textos y validaciones (CA3: «el mismo formulario»). El riesgo sobre Inicio se cubre con un
  test de caracterización escrito antes de la extracción.
- **Tras el éxito, volver a pedir la lista** en vez de editar la tarjeta en memoria, porque el
  servidor es la fuente de la nueva fecha y del nuevo `modificable`. CA3 y CA4 piden «sin recargar
  la página», no sin petición.

## Impacto en arquitectura
- `docs/architecture.md`: nada estructural. En T090, mencionar `ModalAccionCita` en los componentes
  del portal del paciente.

## Riesgos y mitigaciones
- **Regresión en Inicio al extraer el formulario:** el test de caracterización va antes de la extracción.
- **Diferencia de reloj entre navegador y servidor:** la regla vive en el servidor.
- **Riesgos documentados:** la spec no cita ninguno. La auditoría sigue fuera por la excepción P13 (objetivo 3).
