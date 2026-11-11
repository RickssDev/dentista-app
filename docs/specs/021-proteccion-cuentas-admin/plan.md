---
spec: 021-proteccion-cuentas-admin
status: draft   # draft | approved | blocked
constitution_version: 1.0.0
created: 2026-11-11
---

# Plan · 021 Protección de las cuentas del personal

## Enfoque técnico
Toda la regla vive en el servicio de usuarios del backend (P17). Un módulo nuevo de validación
toma del cuerpo **solo** los campos de la cuenta (lista blanca por operación), valida tipo, largo y
valores permitidos, y devuelve un objeto limpio; el servicio ya no reenvía `req.body`. La imagen
deja de leerse del cuerpo: solo llega del archivo subido. Para el último Administrador, las
operaciones que pueden quitarle el puesto (eliminar, desactivar, cambiar rol) se ejecutan dentro
de una transacción que bloquea las filas de los Administradores activos (`SELECT … FOR UPDATE`),
cuenta cuántos quedan y rechaza con 409 si la operación dejaría cero. Al editar, "cambiar" significa
un valor distinto del guardado: el panel reenvía siempre todos los campos. En el frontend, el diálogo
de eliminar muestra el motivo que devuelve la API, y `ModalConfirmacion` expone su mensaje como
descripción accesible del diálogo en todas sus pantallas. Sin migraciones ni dependencias
nuevas.

## Constitution Check
Constitución 1.0.0, en `draft` (aún no aprobada por el usuario): el check se hace contra ella.

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec 021 `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada CA y TM con test en Trazabilidad | test: suites de `backend/tests/usuarios/` y `frontend/tests/usuarios-avisos.test.jsx` |
| P3 Dependencias nuevas con ADR | ➖ | No se añade ninguna dependencia | — |
| P4 Arquitectura con ADR | ✅ | Sigue routes → controller → service → repository; las transacciones ya existen en `auth.repository.js` y `historial.service.js`. Dependencia nueva `users` → `auth` (función de validación), sin contradecir `docs/architecture.md`; se anota en T090 | manual: T090 actualiza la columna "Depende de" |
| P5 Producción solo con aprobación humana | ✅ | Se libera con `/release` | manual: puerta de aprobación de `/release` |
| P6 Rollback documentado | ✅ | Sección Rollout: sin datos que revertir | manual: Rollout de este plan |
| P7 Migraciones compatibles | ➖ | Sin cambios de esquema | — |
| P8 Autorización en el servidor | ✅ | Rutas sin cambios: `verifyToken` + `authorizeRoles("Administrador")`; la regla del último Administrador vive en el servicio | test: `tests/usuarios/permisos.test.js` (existente, sigue en verde) y `ultimo-admin.test.js` |
| P9 Entrada validada y SQL parametrizado | ✅ | Lista blanca de campos por operación y validación de valores (`user.validacion.js`); consultas nuevas con `?` | test: `datos-cuenta.test.js` (campos extra, tipos, largos); `consultas-usuarios.test.js` captura el SQL de las consultas nuevas y falla si el valor enviado aparece en el texto |
| P10 Secretos fuera del repositorio | ✅ | No se tocan secretos | test: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Línea base 2026-11-11: `npm audit --audit-level=high` sin altas ni críticas | test: `npm audit` en CI y en `/release` |
| P12 Modelo de amenazas en datos sensibles | ✅ | Sección "Modelo de amenazas" | manual: `/analyze` y `/review` |
| P13 Auditoría de datos sensibles | ❌ aceptado: el registro de auditoría no existe; los cambios de rol y las acciones administrativas se auditan con el objetivo 3 (OB1.a, OB1.e) — aprobado por el usuario el 2026-11-11 | Excepción temporal | — |
| P14 Correlación por petición | ❌ aceptado: `X-Request-Id` no existe en la API; llega con el objetivo 3. Esta spec no añade logs — aprobado por el usuario el 2026-11-11 | Excepción temporal | — |
| P15 Logs sin datos sensibles | ✅ | No se añaden logs; los rechazos no se registran con datos de la cuenta | test: `rutas-usuarios.test.js` espía `console.*` en respuestas 400, 409 y ante un `1062`, y comprueba que no aparece el correo ni la contraseña |
| P16 Accesibilidad WCAG 2.1 AA | ✅ | El aviso del formulario ya usa `role="alert"`; `ModalConfirmacion` expone su mensaje como descripción accesible del diálogo (decisión del usuario, 2026-11-11), sin cambio visual | test: `usuarios-avisos.test.jsx` consulta el aviso por rol y el diálogo por su descripción accesible; `modal-confirmacion.test.jsx` (regresión de otra confirmación); manual: foco y teclado; contraste sin cambios (no hay estilos nuevos) |
| P17 Sin lógica de negocio en las vistas | ✅ | Validación y regla del último Administrador en el servicio; la vista solo muestra el mensaje | manual: `/review` |
| P18 Metadatos por ruta indexable | ➖ | No toca rutas públicas | — |
| P19 Noindex fuera de lo público | ➖ | No toca rutas ni su indexación | — |
| P20 La interfaz usa solo el sistema de diseño | ✅ | Sin estilos nuevos: cambian el texto del aviso y atributos de accesibilidad | manual: `/review` del diff de `AdminUsuarios.jsx` y `ModalConfirmacion.jsx` (sin CSS ni literales) |

## Cambios por módulo
| Módulo | Cambio | Riesgo |
|---|---|---|
| `backend/src/modules/users/user.validacion.js` (nuevo) | `limpiarAlta(body)` y `limpiarEdicion(body)`: lista blanca (`nombre`, `apellido`, `correo` —alias `email`—, `telefono`, `password`, `id_rol`; en edición además `estado`), tipos texto, largos según `backend/db/schema.sql` (nombre y apellido ≤ 55, correo ≤ 100 y formato, teléfono ≤ 20), `estado` ∈ {activo, inactivo}, `id_rol` entero positivo como número o como texto numérico (el panel envía `FormData`: `"1"`); en edición recibe la cuenta guardada y solo valida el formato de los campos cuyo valor difiere del guardado; contraseña con `validarContrasena` de auth. Lanza `AppError(…, 400)` | Rechazar algo que el panel envía hoy (mitigado: el panel envía exactamente esos campos) |
| `backend/src/modules/auth/auth.service.js` | Exportar `validarContrasena` (sin cambiar su lógica) | Ninguno |
| `backend/src/modules/users/user.service.js` | `createUsuario(body, imagen)` y `updateUsuario(id, body, imagen)` usan la validación; comprueban que el rol exista y que el correo no lo use otra cuenta; `updateUsuario` y `deleteUsuario` aplican la regla del último Administrador dentro de una transacción | Bloqueo de filas en un flujo poco concurrido |
| `backend/src/modules/users/user.repository.js` | `conTransaccion(fn)`; `bloquearAdministradoresActivos(conn)` (`SELECT … FOR UPDATE`); `getRolById(id)`; `findOtroUsuarioPorCorreo(correo, idExcluido)`; `updateUsuario`, `deleteUsuario` y `desactivarUsuario` aceptan `conn` opcional (por defecto `pool`) | Cambiar la firma sin romper llamadas (parámetro opcional al final) |
| `backend/src/modules/users/user.controller.js` | Pasa la imagen del archivo subido como argumento aparte; ya no la escribe en `req.body` | Ninguno |
| `frontend/src/pages/admin/AdminUsuarios.jsx` | En `confirmarEliminar`, el aviso de error muestra `error.message` (texto genérico solo si no hay) | Ninguno |
| `frontend/src/components/ModalConfirmacion.jsx` | El mensaje pasa a ser la descripción accesible del diálogo (`aria-describedby` con un id único), sin cambio visual | Se usa en 32 lugares: prueba de regresión |
| `backend/tests/usuarios/` (nuevos) | `datos-cuenta.test.js`, `ultimo-admin.test.js`, `ultimo-admin-concurrencia.test.js`, `rutas-usuarios.test.js`, `consultas-usuarios.test.js` | — |
| `frontend/tests/` (nuevos) | `usuarios-avisos.test.jsx` (avisos del formulario y del diálogo), `modal-confirmacion.test.jsx` (regresión) | — |

## Contratos y datos
Rutas sin cambios (`/api/v1/usuarios`, solo Administrador). Cambian las respuestas de error:

| Operación | Caso | Antes | Ahora |
|---|---|---|---|
| `POST /usuarios` | Falta nombre, apellido, correo, contraseña o rol | 500 o cuenta incompleta | 400 "Faltan campos obligatorios: …" (nombra los que faltan) |
| `POST` / `PUT` | Contraseña fuera de las reglas de 001 CA3 | se guardaba | 400 con el mensaje de `validarContrasena` |
| `POST` / `PUT` | Correo con formato inválido | se guardaba | 400 "El correo no es válido" |
| `POST` / `PUT` | Correo de otra cuenta | 500 (`errno 1062`) | 400 "El correo ya está registrado" (también si la carrera llega a `1062`) |
| `POST` / `PUT` | `id_rol` inexistente o no entero | 500 (FK) | 400 "El rol no es válido" |
| `PUT` | `estado` fuera de activo/inactivo | 500 (enum) | 400 "El estado no es válido" |
| `POST` / `PUT` | Dato no textual o demasiado largo | 500 | 400 con el campo |
| `POST` / `PUT` | Campos ajenos (`google_id`, `fecha_registro`, `id_usuario`, `imagen` en el cuerpo…) | ignorados en parte; `imagen` del cuerpo se guardaba | ignorados; la imagen solo llega del archivo |
| `PUT` / `DELETE` | Quitar rol, desactivar o eliminar al último Administrador activo | se permitía | 409 "Debe quedar al menos un Administrador activo" y sin cambios (tampoco se desactiva ante `1451`) |
| `POST` | `estado` en el alta | ignorado (la cuenta nace activa) | ignorado, igual que hoy |

Formato de respuesta igual que hoy (`HandleResponse` / `errorHandler`). Sin cambios de esquema;
los roles se leen de la tabla `roles` (no se fijan ids en código). "Último Administrador" =
cuentas con rol `Administrador` y `estado = 'activo'`.

Regla en `updateUsuario`: si la cuenta es Administrador activa y el cambio la deja sin rol de
Administrador o inactiva —comparando con lo guardado: un `id_rol` o un `estado` iguales a los
actuales no son un cambio—, se valida dentro de la transacción. En `deleteUsuario`, si la cuenta es
Administrador activa, la eliminación (y su respaldo de desactivar ante `1451`) va dentro de la
transacción. Una cuenta que ya no es Administrador activo no entra en la regla (CA9).

**Qué ve cada rol:** sin cambios. Administrador: gestiona cuentas con las nuevas validaciones.
Asistente y Paciente: 403 en `/usuarios` (004 CA7, ya cubierto).

## Estrategia de pruebas
- **Unidad del servicio (Jest, repositorio simulado):** `datos-cuenta.test.js` (CA1–CA6),
  `ultimo-admin.test.js` (CA7–CA9).
- **Concurrencia (Jest):** `ultimo-admin-concurrencia.test.js` (CA10) con dos piezas: un
  repositorio simulado que serializa la transacción y comprueba que solo una de dos degradaciones
  cruzadas pasa; y una conexión falsa propia (inyectada a las funciones del repositorio, sin pasar
  por `tests/support/fake-db.js`, que rechaza el SQL no simulado) que captura el SQL y falla si el
  conteo no lleva `FOR UPDATE`, si bloqueo y escritura no usan la misma `conn`, o si el orden no es
  begin → … → commit, con rollback ante 409 (comprobado rompiéndolo).
- **SQL parametrizado (Jest):** `consultas-usuarios.test.js` llama a las consultas nuevas con una
  conexión falsa y comprueba que los valores enviados van en los parámetros y no en el texto. Verificación manual contra el
  MySQL de Docker local: dos peticiones simultáneas de degradación cruzada dejan un Administrador.
- **HTTP (supertest, repositorio simulado):** `rutas-usuarios.test.js` comprueba códigos (400,
  409), que la imagen del cuerpo se ignora, que el controller pasa la del archivo y, con `console.*`
  espiado, que ninguna respuesta 400/409 ni un `1062` deja el correo o la contraseña en los logs.
- **Frontend (Vitest + Testing Library):** `usuarios-avisos.test.jsx` (CA11) y
  `modal-confirmacion.test.jsx` (regresión del componente compartido).
- La suite existente (`permisos.test.js`) sigue en verde.

## Modelo de amenazas
| ID | Amenaza (STRIDE) | Categoría OWASP | Componente | Control | Test |
|---|---|---|---|---|---|
| TM1 | Elevación / DoS lógico: con una sesión de Administrador robada o por error, eliminar, desactivar o degradar al último Administrador deja la clínica sin gestión | A01:2025 Broken Access Control | `user.service` | Regla del último Administrador en el servidor, también sobre la propia cuenta | `ultimo-admin.test.js` (CA7) |
| TM2 | Manipulación: asignación masiva de campos ajenos (`google_id`, `fecha_registro`, `imagen` con ruta de otro archivo) | A01:2025 · API3:2023 Mass Assignment | `user.validacion`, `user.controller` | Lista blanca por operación; imagen solo del archivo subido | `datos-cuenta.test.js` (CA1), `rutas-usuarios.test.js` |
| TM3 | Manipulación / DoS: tipos inesperados, valores fuera del enum o textos largos provocan errores 500 o datos corruptos | A03:2025 Injection · A04:2025 | `user.validacion`, `user.repository` | Validación de tipo, largo y dominio antes del repositorio; SQL con `?` | `datos-cuenta.test.js` (CA5, CA6), `consultas-usuarios.test.js` |
| TM4 | Condición de carrera: dos degradaciones cruzadas simultáneas dejan cero Administradores | A04:2025 Insecure Design | `user.repository` (transacción) | Transacción con `SELECT … FOR UPDATE` sobre los Administradores activos y la operación en la misma `conn` | `ultimo-admin-concurrencia.test.js` (CA10) |
| TM5 | Divulgación: el aviso de correo repetido revela datos de la otra cuenta | A01:2025 | `user.service` | Mensaje fijo "El correo ya está registrado", sin nombre, id ni rol de la otra cuenta | `datos-cuenta.test.js` (CA4) |

Repudio (quién cambió un rol): sin control en esta spec; excepción P13 hasta el objetivo 3.

## Trazabilidad
| Criterio de aceptación | Cambio(s) | Test(s) |
|---|---|---|
| CA1: campos ajenos se ignoran | `user.validacion`, `user.controller` | unidad `datos-cuenta.test.js` "ignora campos ajenos en alta y edición"; HTTP `rutas-usuarios.test.js` "la imagen del cuerpo se ignora" |
| CA2: alta sin obligatorios → aviso que nombra lo que falta | `user.validacion` | unidad `datos-cuenta.test.js` "alta sin <campo> → 400 que lo nombra" |
| CA3: contraseña fuera de las reglas de 001 CA3 | `user.validacion`, `auth.service` (export) | unidad `datos-cuenta.test.js` "contraseña corta o > 72 bytes → 400 en alta y edición" |
| CA4: correo inválido o de otra cuenta; editar otros datos de una cuenta con correo antiguo inválido se permite | `user.validacion`, `user.service`, `user.repository` | unidad `datos-cuenta.test.js` "correo inválido → 400", "correo de otra cuenta → 400 sin datos de esa cuenta", "1062 en carrera → 400", "cuenta con correo antiguo inválido: cambiar solo el teléfono → se guarda; cambiar el correo a otro inválido → 400" |
| CA5: rol o estado inexistentes | `user.validacion`, `user.service` | unidad `datos-cuenta.test.js` "rol inexistente → 400", "estado inválido → 400", "`id_rol` en texto numérico (`'1'`) → se acepta" |
| CA6 (abuso): tipos y largos | `user.validacion` | unidad `datos-cuenta.test.js` "objeto, lista o texto largo → 400, nunca 500", "en el máximo de cada columna → se acepta; máximo + 1 → 400" |
| CA7: último Administrador no se elimina, desactiva ni degrada (incluso él mismo) | `user.service`, `user.repository` | unidad `ultimo-admin.test.js` "eliminar / desactivar / cambiar rol al único activo → 409 sin cambios", "también sobre la propia cuenta", "eliminar con `1451` al único → 409 sin desactivar" |
| CA8: con dos o más se permite | `user.service`, `user.repository` | unidad `ultimo-admin.test.js` "con otro activo, las tres acciones se permiten", "con dos activos, eliminar con `1451` desactiva usando la conexión de la transacción y borra la imagen solo tras el commit" |
| CA9: editar otros datos del único y reactivar se permite | `user.service` | unidad `ultimo-admin.test.js` "editar nombre o contraseña del único → 200", "editar al único con el payload exacto del panel (todos los campos, `id_rol: '1'`, `estado: 'activo'`) → 200", "reactivar un Administrador inactivo → 200" |
| CA10 (abuso): degradaciones cruzadas simultáneas | `user.repository`, `user.service` | concurrencia `ultimo-admin-concurrencia.test.js` "solo una pasa", "el conteo usa FOR UPDATE en la conn de la transacción", "bloqueo y escritura en la misma conn; begin → commit, rollback ante 409" · verificación manual: dos peticiones simultáneas contra el MySQL de Docker local dejan un Administrador activo |
| CA11: el panel muestra el aviso anunciado, conserva el formulario y la lista no cambia | `AdminUsuarios.jsx`, `ModalConfirmacion.jsx` | frontend `usuarios-avisos.test.jsx` "guardar con 400 muestra el mensaje en `role=alert` y conserva lo escrito", "eliminar con 409 muestra el motivo como descripción accesible del diálogo y no vuelve a pedir la lista" · verificación manual: en el navegador a 390 y 1440 px, el aviso se lee y se cierra con teclado |
| RNF: aviso anunciado a lectores y con contraste AA | `ModalFormulario` (existente), `ModalConfirmacion.jsx` | frontend `usuarios-avisos.test.jsx` (rol y descripción accesible), `modal-confirmacion.test.jsx` (regresión) · contraste: sin estilos nuevos, se conserva el del sistema; verificación manual en T051 |
| RNF: ningún aviso revela datos de otra cuenta | `user.service` | unidad `datos-cuenta.test.js` (CA4) |
| TM1 | `user.service` | `ultimo-admin.test.js` |
| TM2 | `user.validacion`, `user.controller` | `datos-cuenta.test.js`, `rutas-usuarios.test.js` |
| TM3 | `user.validacion`, `user.repository` | `datos-cuenta.test.js`, `consultas-usuarios.test.js` |
| TM4 | `user.repository` | `ultimo-admin-concurrencia.test.js` |
| TM5 | `user.service` | `datos-cuenta.test.js` |

## Observabilidad
- Logs nuevos: ninguno. Los rechazos son respuestas 400/409 de negocio y no se registran con
  datos de la cuenta (P15).
- Eventos de auditoría: ninguno en esta spec (excepción P13 aceptada; objetivo 3, OB1.e).
- Métricas y alertas: sin cambios.
- Cómo se verifica tras el deploy: en producción, el Administrador intenta desactivar su propia
  cuenta siendo el único activo y recibe el aviso; en los logs del backend no aparecen errores 500
  nuevos en `/usuarios`.

## Descubribilidad
No aplica: la spec no crea ni cambia rutas públicas; solo toca la pantalla de usuarios del panel,
que es privada.

## Rollout
- Feature flag: no aplica. El cambio solo rechaza entradas inválidas y operaciones que dejarían a
  la clínica sin Administrador; no hay un flujo válido que deje de funcionar y el rollback es
  inmediato.
- Orden de despliegue: backend y frontend juntos (mismo `docker compose up -d --build`).
- Compatibilidad: el frontend anterior sigue funcionando con el backend nuevo (solo cambian
  mensajes de error, que ya muestra en el formulario).
- Rollback: `git checkout <commit anterior>` y reconstruir (`docs/deployment.md`). Sin datos que
  revertir: no hay migración.
- Métricas a vigilar tras el deploy: errores 500 en `/api/v1/usuarios` (deben bajar a cero) y
  quejas de altas rechazadas.

## Decisiones (→ ADR si son arquitectónicas)
- **Dónde validar.** Opciones: (a) en el repositorio (ya filtra con `fieldMap` al editar),
  (b) un módulo de validación usado por el servicio, (c) una librería de esquemas. Decisión: (b),
  sin dependencias, siguiendo `citas`/`auth` que validan en el servicio; el `fieldMap` del
  repositorio se mantiene como segunda barrera. Cubre RS1.b.
- **Cómo evitar la carrera del último Administrador.** Opciones: (a) contar y luego actualizar sin
  transacción, (b) transacción con `SELECT … FOR UPDATE` sobre los Administradores activos,
  (c) `UPDATE … WHERE (SELECT COUNT…) > 1` en una sola sentencia (MySQL no permite leer la misma
  tabla en la subconsulta). Decisión: (b), el mismo patrón que `resetPasswordWithToken`. Cubre RS1.c.
- **Código HTTP del último Administrador:** 409 (conflicto con el estado actual), y 400 para datos
  inválidos y correo repetido, igual que el registro (`El correo ya está registrado`).
- **Reglas de la contraseña:** reutilizar `validarContrasena` exportándola de `auth.service.js`, sin
  moverla, para no tocar el flujo de registro (cambio mínimo).
- **Excepciones P13 y P14** hasta el objetivo 3 (decisión del usuario, 2026-11-11).
- **Aviso de eliminar accesible:** arreglar `ModalConfirmacion` para todas sus pantallas en lugar de
  solo la de usuarios (decisión del usuario, 2026-11-11, /analyze A2).
- **Edición:** se valida solo lo que difiere de lo guardado; `id_rol` acepta texto numérico
  (decisión del usuario, 2026-11-11, /analyze A1 y A8).
- **Correcciones de /analyze ronda 1:** A1, A2, A3, A5, A7, A8 y A10 aplicadas con `/plan --fix`.
- **Por corrección:** RS1.a y RS1.d ya mitigadas en v1.1.0; RS1.b y RS1.c dentro de esta spec, pendientes hasta liberarla.
- Sin decisiones → ADR: no hay dependencias nuevas ni cambios de arquitectura.

## Impacto en arquitectura
- `docs/architecture.md`, fila del módulo `users`: añadir "valida campos permitidos y protege al
  último Administrador activo" y, en "Depende de", `auth` (validación de contraseña) (tarea T090).
- `docs/security.md`: RS1.b y RS1.c pasan a mitigadas al liberar (lo hace `/release`).

## Riesgos y mitigaciones
- **Rechazar algo que el panel envía hoy.** Mitigación: la lista blanca coincide con
  `FORM_INICIAL` de `AdminUsuarios.jsx` (`nombre`, `apellido`, `correo`, `password`, `telefono`,
  `estado`, `id_rol`, `imagen` como archivo); prueba manual del alta y la edición en el panel.
- **Cuentas antiguas con datos que no pasarían la validación** (correo sin formato, nombres
  largos): el panel reenvía siempre todos los campos, así que la edición solo valida el formato de
  los que difieren de lo guardado (decisión del usuario, 2026-11-11, /analyze A8). Los tipos
  inválidos (objetos, listas) se rechazan siempre.
- **Bloqueo de filas:** la transacción solo se abre cuando la cuenta afectada es Administrador
  activo; el bloqueo dura una consulta y una escritura.
- **Repudio** (no queda registro de quién cambió un rol) hasta el objetivo 3 (excepción P13).
