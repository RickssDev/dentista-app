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
el servicio: la cita es `pendiente` y su inicio (fecha + hora) es posterior a la hora actual de
México (decisión del usuario, /analyze A6). Así la regla vive en el servidor (P17).

Además, el servidor rechaza reprogramar o cancelar una pendiente que ya **terminó**, es decir, con
inicio + duración del servicio pasados (CA10; decisión del usuario, /analyze A8). Se mide por el
fin para que la «Próxima cita» de Inicio, que muestra la cita en curso, siga igual (CA7).

En el frontend, el formulario de Inicio se extrae a un componente `ModalAccionCita`, que usan Inicio
(sin cambio visible) y «Mis citas». El foco tras cerrar lo gestiona cada pantalla.

## Constitution Check
| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 030 y `design.md` `approved` | manual: `aidd.py status` antes de `/implement` |
| P2 Tests por feature | ✅ | Cada CA con test (Trazabilidad) | test: `backend/tests/citas/mis-citas-modificable.test.js`, `frontend/tests/mis-citas-acciones.test.jsx`, `frontend/tests/inicio-paciente.test.jsx` |
| P3 Dependencias nuevas con ADR | ➖ | Ninguna | — |
| P4 Arquitectura con ADR | ✅ | Mismos módulos; un componente nuevo | manual: `/review` |
| P5 Producción solo con aprobación humana | ✅ | `/release` | manual: T096 |
| P6 Rollback documentado | ✅ | Sin migración; ver Rollout | manual: Rollout |
| P7 Migraciones compatibles | ➖ | Sin cambios de esquema | — |
| P8 Autorización en el servidor | ✅ | Las rutas de citas del paciente siguen con `verifyToken` y la propiedad verificada en el servicio. Cualquier cuenta con perfil de paciente opera solo sobre sus citas (decisión del usuario, /analyze A2) | test: `mis-citas-modificable.test.js` → sin token 401; con token de Paciente, Administrador y Asistente, `GET /miscitas` solo devuelve las citas de su propio perfil, y `PUT`/`PATCH` sobre una cita ajena → 404 |
| P9 Entrada validada y SQL parametrizado | ✅ | Las consultas solo ganan columnas; los ids siguen en `?` | test: `mis-citas-modificable.test.js` → ids en los parámetros |
| P10 Secretos fuera del repositorio | ✅ | Ninguno | lint: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | `npm audit --omit=dev` sin altas (2026-11-23); en desarrollo, la excepción vigente GHSA-fc5q (`docs/security.md`, hasta 2027-01-31) | test: npm audit y trivy en CI y en `/release` |
| P12 Modelo de amenazas en datos sensibles | ✅ | Citas del paciente (confidenciales): modelo abajo | manual: `/analyze` |
| P13 Auditoría de datos sensibles | ❌ aceptado: reprogramar y cancelar citas del paciente no se auditan; la excepción P13 del 2026-11-11 se extiende a estas acciones hasta el objetivo 3 — aprobado por el usuario el 2026-11-23 (/analyze A1) | Sin evento nuevo; destino: specs 027 y 028 | — (llega con las specs 027 y 028) |
| P14 Correlación por petición | ✅ | Sin cambio: spec 026 | test: existentes en `tests/logs/` |
| P15 Logs sin datos sensibles | ✅ | Sin logs nuevos | — (sin logs nuevos) |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | Nombre accesible por cita; foco a controles con foco visible del sistema; sin colores nuevos, así que el contraste es el de `.mf-btn` | test: `mis-citas-acciones.test.jsx` → rol y nombre, foco tras cerrar y tras el aviso; manual: lector de pantalla y teclado, con el destino del foco anotado |
| P17 Sin lógica de negocio en las vistas | ✅ | `modificable` y el rechazo de CA10 los decide el servidor | test: `mis-citas-modificable.test.js` (reglas); `mis-citas-acciones.test.jsx` (sin botones si `modificable` es falso aunque la cita sea pendiente) |
| P18 Metadatos por ruta indexable | ➖ | Ruta privada | — |
| P19 Noindex fuera de lo público | ➖ | Sin cambios | — |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Sin estilos nuevos. `ModalAccionCita` no lleva valores visuales: el ancho lo pasa cada pantalla, como hoy hace Inicio (`ancho={500}`, valor previo, deuda DS2) | test: `mis-citas-acciones.test.jsx` → `ModalAccionCita.jsx` no contiene colores, medidas con unidad ni números de ancho (control positivo) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/modules/citas/citas.repository.js` | `getMisCitas` añade `c.id_servicio`; `getCitaConUsuario` añade `c.fecha_agendada`, `c.hora` y `s.duracion` (join con `servicio`) | bajo |
| `backend/src/modules/citas/citas.service.js` | `getMisCitas` devuelve además `id_servicio` y `modificable` (pendiente e inicio posterior a la hora de México). `obtenerCitaPropia` rechaza con 400 «Esta cita ya pasó y no se puede modificar.» la pendiente cuyo inicio + duración ya pasó, después de la comprobación de propiedad y de estado | medio: afecta también a Inicio solo para citas ya terminadas, que Inicio no muestra |
| `frontend/src/components/ModalAccionCita.jsx` (nuevo) | El formulario de reprogramar o cancelar de Inicio, con los mismos textos y campos. Recibe `cita` (`id`, `id_servicio`, `nombre_servicio`, `fecha_agendada`, `hora`), `accion`, `ancho`, `onCerrar` y `onHecho`. Carga los horarios, valida el motivo, llama a `PUT /citas/mias/:id` o `PATCH /citas/mias/:id/cancelar` y muestra el error del servidor. No gestiona el foco | medio: Inicio pasa a usarlo |
| `frontend/src/pages/paciente/InicioPaciente.jsx` | Usa `ModalAccionCita` con `ancho={500}`; mismos textos, avisos y comportamiento | medio: lo cubre la caracterización |
| `frontend/src/pages/paciente/CitasPaciente.jsx` | En las tarjetas con `modificable`, «Reprogramar» y «Cancelar cita» con `aria-label` de la cita; abre `ModalAccionCita`; tras el éxito vuelve a pedir `/citas/miscitas` y muestra el aviso de Inicio; gestiona el foco según `design.md` | bajo |

## Contratos y datos
**`GET /api/v1/citas/miscitas`**: cada cita gana dos campos, sin quitar ninguno. Se mantienen en
snake_case, como el resto de los campos de este endpoint (`fecha_agendada`, `nombre_servicio`),
en lugar de la convención camelCase general (/analyze A11).

| Campo | Tipo | Significado |
|---|---|---|
| `id_servicio` | número | servicio de la cita, para pedir horarios |
| `modificable` | booleano | `estado = 'pendiente'` y fecha + hora de inicio posteriores a la hora actual de México |

**`PUT /citas/mias/:id`** y **`PATCH /citas/mias/:id/cancelar`**: nueva respuesta para una
pendiente propia que ya terminó (inicio + duración pasados):
`400 { success: false, status: "fail", message: "Esta cita ya pasó y no se puede modificar." }`.
El resto no cambia. Orden de las comprobaciones: id válido (400), propiedad (404), estado (400) y,
después, cita terminada (400). Sin migración.

**Pantalla «Mis citas»:**

| Estado de la tarjeta | Qué se ve |
|---|---|
| `modificable` | «Reprogramar» y «Cancelar cita» |
| completada | «Dejar comentario» o «Comentario enviado», como hoy |
| cualquier otra | sin acciones |

## Estrategia de pruebas
- **Backend (Jest):** `backend/tests/citas/mis-citas-modificable.test.js`, con los repositorios de
  citas y pacientes simulados y `fecha_agendada` como `Date`, igual que el driver (/analyze A7).
  La hora se fija con `jest.useFakeTimers`.
  - `modificable`:
    - verdadero para una pendiente de mañana y para una de hoy que empieza dentro de un minuto;
    - falso para una de hoy que empezó hace un minuto, aunque no haya terminado;
    - falso para una de ayer y para una completada o cancelada futura;
    - incluye `id_servicio`.
  - Rechazo de CA10:
    - `PUT` y `PATCH` sobre una pendiente propia terminada hace un minuto → 400 con el mensaje;
    - sobre una en curso (empezó y no ha terminado) → se procesa.
  - Por HTTP:
    - sin token → 401;
    - con token de Paciente, Administrador y Asistente, cada uno ve solo sus citas;
    - cita de otro → 404 sin actualizar;
    - cancelar una completada → 400.
  - Los ids van en los parámetros.
- **Frontend (Vitest + Testing Library):** `frontend/tests/mis-citas-acciones.test.jsx`, con `api`
  simulado.
  - Botones solo en las `modificable`, con su nombre accesible; una pendiente no modificable y una
    completada sin botones; la completada con «Dejar comentario». Los casos que ya pasan se
    comprueban rompiendo lo que protegen (/analyze A13).
  - Reprogramar y cancelar, con las llamadas al id de la tarjeta elegida.
  - Textos literales de los avisos, iguales a los de Inicio (/analyze A14).
  - Rechazo del servidor en el `role="alert"`; con dos pendientes, solo cambia la elegida y la otra
    conserva sus botones.
  - Foco:
    - cerrar sin guardar devuelve el foco al botón;
    - tras el aviso de reprogramar, al botón «Reprogramar» de esa tarjeta;
    - tras el de cancelar, a «Agendar nueva cita».
  - `ModalAccionCita.jsx` sin valores visuales literales, con un control positivo.
- **No regresión de Inicio:** `frontend/tests/inicio-paciente.test.jsx`, de caracterización y escrito
  antes del cambio. Comprueba:
  - la tarjeta y sus dos botones;
  - el formulario con sus campos y textos;
  - el `PUT` o `PATCH` con el `id_cita`;
  - los textos literales de los avisos;
  - el error sin motivo;
  - que al montarse pide `/citas/proximacita` (/analyze A12).
- **Manual:** capturas de «Mis citas» e Inicio a 390 y 1440 px, antes y después (K1, K2); lector de
  pantalla y teclado en «Mis citas», anotando el destino del foco (K3).

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Elevation: reprogramar o cancelar la cita de otro paciente con su id | A01:2025 Broken Access Control | `citas.service` (existente) | Propiedad verificada en el servidor, 404 sin revelar (spec 005) | `mis-citas-modificable.test.js` (CA8, por rol) |
| TM2 | Tampering: forzar por la API la acción sobre una cita no pendiente o ya terminada | A06:2025 Insecure Design | `citas.service` | Rechazo de no pendientes (spec 005) y de terminadas (CA10, nuevo) | `mis-citas-modificable.test.js` (completada → 400; terminada → 400; en curso → se procesa) |
| TM3 | Information disclosure: la lista expone citas de otra cuenta | A01:2025 | `citas.service` | Solo las citas del perfil de la sesión; los campos nuevos no son sensibles | `mis-citas-modificable.test.js` (sin token 401; cada rol ve solo las suyas) |

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: pendientes que aún no empiezan con acciones | `citas.service`, `citas.repository`, `CitasPaciente.jsx` | `mis-citas-modificable.test.js` «modificable verdadero»; `mis-citas-acciones.test.jsx` «botones en las modificables» · verificación manual: capturas a 390 y 1440 px (K1) |
| CA2: las demás sin acciones; completadas como hoy | `citas.service`, `CitasPaciente.jsx` | `mis-citas-modificable.test.js` «falso si empezó, pasada o no pendiente»; `mis-citas-acciones.test.jsx` «sin botones y comentario intacto» |
| CA3: reprogramar con el formulario de Inicio | `ModalAccionCita.jsx`, `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «reprogramar» |
| CA4: cancelar con motivo | `ModalAccionCita.jsx`, `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «cancelar» |
| CA5: rechazo visible, tarjeta intacta | `ModalAccionCita.jsx` | `mis-citas-acciones.test.jsx` «rechazo» |
| CA6: solo cambia la elegida | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «dos pendientes» |
| CA7: Inicio igual | `InicioPaciente.jsx`, `ModalAccionCita.jsx`, `citas.service` (CA10 solo afecta a terminadas) | `inicio-paciente.test.jsx` (caracterización); `mis-citas-modificable.test.js` «en curso se procesa» · verificación manual: capturas de Inicio antes y después (K2) |
| CA8 (abuso): cita de otro paciente | `citas.service` (sin cambios) | `mis-citas-modificable.test.js` «404 por rol» |
| CA9: nombre accesible, teclado y foco | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` «nombre accesible», «foco» · verificación manual: lector de pantalla y teclado (K3) |
| CA10 (abuso): el servidor rechaza las pendientes terminadas | `citas.service`, `citas.repository` | `mis-citas-modificable.test.js` «terminada → 400; en curso se procesa» |
| TM1 | `citas.service` | `mis-citas-modificable.test.js` |
| TM2 | `citas.service` | `mis-citas-modificable.test.js` |
| TM3 | `citas.service` | `mis-citas-modificable.test.js` |
| RNF: WCAG 2.1 AA | `CitasPaciente.jsx` | `mis-citas-acciones.test.jsx` · verificación manual en T022 |
| RNF: mensajes en español sin detalles internos | `citas.service`, `ModalAccionCita.jsx` | `mis-citas-modificable.test.js` (cuerpo exacto del 400); `mis-citas-acciones.test.jsx` «rechazo» |
| RNF: reglas en el servidor | `citas.service` | `mis-citas-modificable.test.js`; `mis-citas-acciones.test.jsx` «pendiente no modificable sin botones» |

## Observabilidad
Sin logs ni eventos nuevos (P13 con excepción). El 400 de CA10 queda en la línea «Petición atendida»
con su `request_id` (spec 026).

## Descubribilidad
No aplica: ruta privada del portal del paciente, con `noindex`.

## Rollout
- Feature flag: no aplica.
- Orden de despliegue: backend y frontend en el mismo `up -d --build`.
- Compatibilidad:
  - El frontend anterior ignora los campos nuevos y solo ofrece acciones en la «Próxima cita»,
    que no está terminada: el rechazo de CA10 no le afecta.
  - El frontend nuevo contra el backend anterior no ve `modificable` y no muestra botones, así
    que falla de forma segura.
- Rollback:
  1. `git checkout <commit anterior> -- ../backend/src/modules/citas ../frontend`.
  2. Reconstruir backend y frontend.
  Sin efecto en datos.
- Métricas a vigilar: errores en `/api/v1/citas/miscitas` y en `/citas/mias/*`; respuestas 400 de
  CA10 inesperadas en los logs.

## Decisiones (→ ADR si son arquitectónicas)
- **`modificable` lo calcula el servidor**, hasta el inicio de la cita (decisión del usuario, A6), con
  la hora de México. Alternativa descartada: calcularlo en el navegador.
- **Rechazo de pendientes terminadas en el servidor** (decisión del usuario, A8). Se mide por el
  fin (inicio + duración) para no cambiar Inicio (CA7). Va en `obtenerCitaPropia`, después de la
  propiedad (no revela nada de citas ajenas) y del estado.
- **Extraer `ModalAccionCita`**: una sola versión de los textos y validaciones (CA3). El riesgo sobre
  Inicio lo cubre la caracterización. El foco y el ancho los deciden las pantallas (A3, A5).
- **Tras el éxito, volver a pedir la lista**: el servidor es la fuente de la nueva fecha y de
  `modificable`.
- **Campos nuevos en snake_case**, como el resto del endpoint (A11).

## Impacto en arquitectura
- `docs/architecture.md`: en T090, `ModalAccionCita` entre los componentes del portal del paciente.
- `docs/specs/005-portal-paciente-citas/spec.md` (inferida): en T090, añadir al Historial que la 030
  extiende su contrato (campos de `/miscitas` y rechazo de las terminadas) y marcar `[x]` CA10 de la
  005 con su test nuevo (/analyze A17).

## Riesgos y mitigaciones
- **Regresión en Inicio al extraer el formulario:** caracterización antes de la extracción.
- **El rechazo de CA10 alcanza a Inicio:** solo para citas terminadas, que Inicio no muestra; un test
  fija que la cita en curso se procesa.
- **Diferencia de reloj entre navegador y servidor:** las dos reglas viven en el servidor.
- **Riesgos documentados:** la spec no cita ninguno. La auditoría queda fuera por la excepción P13
  extendida.
