---
spec: 021-proteccion-cuentas-admin
plan: plan.md
impl_base: 1e8d678
status: approved
---

# Tareas · 021 Protección de las cuentas del personal

Formato:
`- [ ] T### [P] <verbo + qué> — <archivos> — hecho cuando: <criterio> — cubre: CA# — depende: T###`
- T001–T089: trabajo. T090–T099: reservadas.
- `[P]` = paralelizable con las demás `[P]` de su grupo una vez cumplidas sus dependencias (no
  comparte archivos con otra tarea abierta).
- `[-]` = obsoleta (`— obsoleta: <motivo> (AAAA-MM-DD)`): no cuenta como abierta ni como hecha.
- Bajo una tarea: `  - nota: …`, `  - bloqueo: AAAA-MM-DD — <qué falta> — <skill a ejecutar>`.
- La comprobación a mano va en la tarea que construye la pieza.

## Constitution Check
Revisión del desglose contra `plan.md` (constitución 1.0.0).

| Principio | Resultado | Justificación / ajuste | Cómo se verifica |
|---|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan `approved` | manual: `aidd.py validate` |
| P2 Tests por feature | ✅ | Cada tarea de implementación depende de su tarea de test, escrita antes | test: T010, T011, T012, T030, T031, T050, T053 |
| P3 Dependencias nuevas con ADR | ➖ | Ninguna tarea añade dependencias | — |
| P4 Arquitectura con ADR | ✅ | Dependencia `users` → `auth` sin contradecir la arquitectura; T090 actualiza la fila de `users` y su "Depende de" | manual: T090 |
| P5 Producción solo con aprobación humana | ✅ | T096 se mantiene | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; sin migraciones | manual: T096 |
| P7 Migraciones compatibles | ➖ | Ninguna tarea cambia el esquema | — |
| P8 Autorización en el servidor | ✅ | Rutas sin cambios; regla en el servicio (T041) | test: `permisos.test.js` en T060, T030 |
| P9 Entrada validada y SQL parametrizado | ✅ | Lista blanca (T020); consultas nuevas con `?` (T021, T040) | test: T010, T012 (SQL capturado: los valores van en los parámetros) |
| P10 Secretos fuera del repositorio | ✅ | Ninguna tarea toca secretos | test: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Comprobado en T060 | test: `npm audit --audit-level=high` en T060 |
| P12 Modelo de amenazas | ✅ | TM1–TM5 con tarea de test y de control | manual: `/analyze` |
| P13 Auditoría | ❌ aceptado: hasta el objetivo 3 — aprobado por el usuario el 2026-11-11 | Ninguna tarea emite eventos de auditoría | — |
| P14 Correlación por petición | ❌ aceptado: hasta el objetivo 3 — aprobado por el usuario el 2026-11-11 | Ninguna tarea añade logs | — |
| P15 Logs sin datos sensibles | ✅ | Ninguna tarea añade logs; T011 espía `console.*` en la capa HTTP | test: T011 |
| P16 Accesibilidad | ✅ | Aviso del formulario por rol; `ModalConfirmacion` con descripción accesible (T052) | test: T050, T053; manual: T051 |
| P17 Sin lógica de negocio en las vistas | ✅ | T051 solo muestra el mensaje de la API | manual: `/review` |
| P18 Metadatos por ruta indexable | ➖ | No toca rutas públicas | — |
| P19 Noindex fuera de lo público | ➖ | No toca rutas | — |
| P20 Sistema de diseño | ✅ | T051 y T052 no añaden estilos ni literales | manual: `/review` del diff |

## Preparación
- [x] T001 Exportar `validarContrasena` sin cambiar su lógica — `backend/src/modules/auth/auth.service.js` — hecho cuando: `module.exports.validarContrasena` existe y `npx jest tests/auth` sigue en verde

## Historia 1: datos válidos en alta y edición

### Tests (antes de implementar)
- [x] T010 [P] Escribir las pruebas de datos de la cuenta con el repositorio simulado — `backend/tests/usuarios/datos-cuenta.test.js` — hecho cuando: falla por la razón esperada (hoy se aceptan los datos) en: campos ajenos (`google_id`, `fecha_registro`, `id_usuario`, `imagen` en el cuerpo) ignorados en alta y edición; alta sin cada obligatorio → 400 que lo nombra; contraseña corta o de más de 72 bytes → 400 en alta y edición; correo sin formato → 400; correo de otra cuenta → 400 "El correo ya está registrado" sin nombre, id ni rol de esa cuenta; `errno 1062` en carrera → 400; una cuenta con correo guardado inválido: cambiar solo el teléfono → se guarda, cambiar el correo a otro inválido → 400; rol inexistente o no entero → 400; `id_rol` en texto numérico (`'1'`) → se acepta; estado fuera de activo/inactivo → 400; objeto, lista o texto más largo que la columna → 400 y nunca 500; en el máximo de cada columna de `backend/db/schema.sql` (55, 55, 100, 20) → se acepta y en máximo + 1 → 400 — cubre: CA1, CA2, CA3, CA4, CA5, CA6
  - nota: falla 30 de 31 por la razón esperada; "cambiar solo el teléfono se guarda" pasa desde el principio y se comprueba rompiendo la validación en T020
- [x] T011 [P] Escribir las pruebas HTTP de usuarios con supertest y el repositorio simulado — `backend/tests/usuarios/rutas-usuarios.test.js` — hecho cuando: falla por la razón esperada en: `POST` y `PUT` con datos inválidos → 400 con `message`; `imagen` en el cuerpo sin archivo no llega al repositorio; con archivo subido, llega `/uploads/<archivo>`; con `console.*` espiado, ninguna respuesta 400 o 409 ni un `errno 1062` escribe el correo o la contraseña — cubre: CA1, CA6
  - nota: falla 6 de 7 por la razón esperada; "con archivo subido llega /uploads/<archivo>" pasa desde el principio y se comprueba rompiendo el controller en T023. `upload` se simula sin escribir en disco

- [x] T012 [P] Escribir la prueba de SQL parametrizado de las consultas nuevas con una conexión falsa — `backend/tests/usuarios/consultas-usuarios.test.js` — hecho cuando: falla por la razón esperada (las funciones aún no existen) y comprueba que `getRolById`, `findOtroUsuarioPorCorreo` y `bloquearAdministradoresActivos` llevan los valores enviados solo en los parámetros, nunca en el texto del SQL — cubre: CA4, CA5, CA10
  - nota: A12 — también captura el SQL de `updateUsuario`, `deleteUsuario` y `desactivarUsuario` con valores marcados
  - nota: A13 — la conexión falsa se pasa como último argumento (`conn`) a cada función del repositorio, sin `fake-db.js`; fila P2 del Constitution Check con T012 y T053
  - nota: falla 6 de 6 por la razón esperada (funciones inexistentes; las existentes ignoran `conn`)

### Implementación
- [x] T020 Crear la validación de la cuenta (`limpiarAlta`, `limpiarEdicion`) — `backend/src/modules/users/user.validacion.js` — hecho cuando: los casos de T010 de campos ajenos, obligatorios, contraseña, formato de correo, estado, tipos y largos pasan (nombre y apellido ≤ 55, correo ≤ 100, teléfono ≤ 20; `email` se acepta como alias de `correo`; `estado` solo en edición; `id_rol` como número o texto numérico; en edición recibe la cuenta guardada y solo valida el formato de lo que difiere de ella) — cubre: CA1, CA2, CA3, CA4, CA5, CA6 — depende: T001, T010
  - nota: los casos de T010 se ejecutan al integrarla en el servicio (T022); en edición devuelve `{ cambios, recibidos }` para distinguir "nada cambió" (200 sin escribir) de "no llegó ningún campo" (400, como hoy)
- [x] T021 Añadir `getRolById` y `findOtroUsuarioPorCorreo` con parámetros `?` — `backend/src/modules/users/user.repository.js` — hecho cuando: la parte de T012 sobre estas dos consultas pasa — cubre: CA4, CA5 — depende: T010, T012
  - nota: comprobado rompiendo: con el id interpolado en el SQL de `getRolById`, su caso de T012 falla; restaurado pasa
- [x] T022 Usar la validación en `createUsuario` y `updateUsuario`: rol existente, correo libre, `1062` → 400, imagen como argumento aparte — `backend/src/modules/users/user.service.js` — hecho cuando: T010 pasa completo — cubre: CA1, CA2, CA3, CA4, CA5, CA6 — depende: T020, T021
  - nota: T010 pasa completo (31/31). Comprobado rompiendo: (1) validar el correo aunque no cambie hace fallar "cambiar solo el teléfono se guarda"; (2) reenviar el cuerpo al repositorio (TM2) hace fallar "en el alta"; (3) poner el id de la otra cuenta en el aviso (TM5) hace fallar su caso. Restaurado, todo pasa
  - nota: si el panel guarda sin cambios, responde con la cuenta guardada sin escribir; un PUT sin ningún campo sigue respondiendo 400 "No hay campos para actualizar"
- [x] T023 Pasar la imagen del archivo subido como argumento y dejar de escribirla en `req.body` — `backend/src/modules/users/user.controller.js` — hecho cuando: T011 pasa — cubre: CA1 — depende: T011, T022
  - nota: T011 pasa salvo "último Administrador (409)", que es de T041. Comprobado rompiendo: tomar la imagen del cuerpo hace fallar los dos casos de imagen (incluido el que pasaba desde el principio); restaurado pasan

## Historia 2: último Administrador activo

### Tests (antes de implementar)
- [x] T030 [P] Escribir las pruebas del último Administrador con el repositorio simulado — `backend/tests/usuarios/ultimo-admin.test.js` — hecho cuando: falla por la razón esperada en: eliminar, desactivar y cambiar el rol al único Administrador activo → 409 "Debe quedar al menos un Administrador activo" sin escribir nada, también sobre su propia cuenta; con otro activo, las tres acciones se permiten; editar nombre o contraseña del único → se permite; reactivar un Administrador inactivo → se permite; editar al único con el payload exacto del panel (todos los campos, `id_rol: '1'`, `estado: 'activo'`) → se permite; eliminar con `1451` del único → 409 sin desactivar; con dos Administradores activos, eliminar con `1451` desactiva usando la conexión de la transacción y la imagen se borra solo tras el commit — cubre: CA7, CA8, CA9
  - nota: falla 9 de 12 por la razón esperada; los 3 de CA9 pasan desde el principio (hoy todo se permite) y se comprueban rompiendo la regla en T041
- [x] T031 [P] Escribir las pruebas de concurrencia del último Administrador — `backend/tests/usuarios/ultimo-admin-concurrencia.test.js` — hecho cuando: falla por la razón esperada en: con un repositorio simulado que serializa las transacciones, de dos degradaciones cruzadas simultáneas solo una pasa y la otra recibe 409; con una conexión falsa propia (inyectada a las funciones del repositorio, sin pasar por `tests/support/fake-db.js`, que rechaza el SQL no simulado) que captura el SQL, la prueba falla si el conteo de Administradores activos no lleva `FOR UPDATE`, si bloqueo y escritura no usan la misma `conn`, o si el orden no es begin → … → commit con rollback ante 409 (comprobado rompiéndolo) — cubre: CA10
  - nota: falla 5 de 5 por la razón esperada (hoy las dos degradaciones cruzadas pasan y quedan cero Administradores; `conTransaccion` no existe). La conexión falsa propia llega como segundo argumento de `conTransaccion` (origen de conexiones), sin `fake-db.js`

### Implementación
- [x] T040 Añadir `conTransaccion`, `bloquearAdministradoresActivos` (`SELECT … FOR UPDATE` sobre rol `Administrador` y estado `activo`) y `conn` opcional en `updateUsuario`, `deleteUsuario` y `desactivarUsuario` — `backend/src/modules/users/user.repository.js` — hecho cuando: la parte de T031 sobre el SQL capturado y la de T012 sobre `bloquearAdministradoresActivos` pasan, y las llamadas existentes sin `conn` siguen funcionando — cubre: CA10 — depende: T012, T021, T031
  - nota: pasan las partes de T012 y del repositorio real de T031. Comprobado rompiendo: sin `FOR UPDATE` y sin rollback fallan esos 3 casos; restaurado pasan. Las llamadas existentes sin `conn` usan `pool` por defecto
- [x] T041 Aplicar la regla del último Administrador en `updateUsuario` y `deleteUsuario` dentro de la transacción — `backend/src/modules/users/user.service.js` — hecho cuando: T030 y T031 pasan · verificación manual: con la API y el MySQL de Docker local, dos peticiones simultáneas de degradación cruzada entre los dos únicos Administradores dejan uno activo y la otra responde 409 — cubre: CA7, CA8, CA9, CA10 — depende: T022, T030, T040
  - nota: T030 y T031 pasan (81/81 en `tests/usuarios`). Comprobado rompiendo: tratar cualquier edición de un Administrador como cambio de puesto hace fallar los casos de edición de CA9; quitar la regla hace fallar los 5 de CA7. "Reactivar" no puede romperse con la regla: un inactivo nunca entra en ella
  - nota: verificación manual OK 2026-11-11 (ejecutada con el usuario, Docker local): con las dos cuentas de prueba como únicos Administradores activos, dos PUT simultáneos de degradación cruzada → 200 y 409 "Debe quedar al menos un Administrador activo"; queda 1 activo. Se restauró el Administrador local y se borraron las cuentas de prueba

## Panel

### Tests (antes de implementar)
- [x] T050 [P] Escribir las pruebas de los avisos de la pantalla de usuarios — `frontend/tests/usuarios-avisos.test.jsx` — hecho cuando: falla por la razón esperada en "eliminar con 409 muestra el motivo de la API como descripción accesible del diálogo y no vuelve a pedir la lista" (hoy muestra el texto genérico y no lo anuncia) y pasa "guardar con 400 muestra el mensaje en un `role=alert` y conserva lo escrito" — cubre: CA11
  - nota: "eliminar con 409" falla por la razón esperada (el diálogo no tiene la descripción accesible); "guardar con 400" pasa desde el principio y se comprobó rompiendo el mensaje del formulario (falla) y restaurando (pasa). Ejecutadas dos veces

- [x] T053 [P] Escribir la prueba de regresión de `ModalConfirmacion` — `frontend/tests/modal-confirmacion.test.jsx` — hecho cuando: falla por la razón esperada (el diálogo no tiene descripción accesible) y comprueba que una confirmación con título y mensaje expone el mensaje como descripción accesible del diálogo, con ids únicos si hay dos abiertas, y que sus botones siguen funcionando — cubre: CA11
  - nota: los dos casos de descripción accesible fallan por la razón esperada; "los botones siguen funcionando" es de regresión y pasa desde el principio. Además se detectó que `ModalFormulario` usa un id fijo (`mf-titulo`): con dos diálogos abiertos, ambos se nombran con el primer título

### Implementación
- [x] T052 Exponer el mensaje de `ModalConfirmacion` como descripción accesible del diálogo, sin cambio visual — `frontend/src/components/ModalConfirmacion.jsx`, `frontend/src/components/ModalFormulario.jsx` — hecho cuando: T053 pasa y `npm test --prefix frontend` sigue en verde — cubre: CA11 — depende: T053
  - nota: archivo extra `ModalFormulario.jsx` (decisión del usuario, 2026-11-11): id único del título con `useId` (antes fijo `mf-titulo`, repetido con dos modales abiertos) y `aria-describedby` opcional; sin cambio visual
  - nota: A11 — T053 pasa y el resto de la suite del frontend sigue en verde salvo "eliminar con 409" de T050, pendiente hasta T051 (14/15, ejecutada dos veces)
- [x] T051 Mostrar el mensaje de la API en el aviso de eliminar (texto genérico solo si no hay) — `frontend/src/pages/admin/AdminUsuarios.jsx` — hecho cuando: T050 pasa · verificación manual: en el navegador a 390 y 1440 px, alta con correo repetido y eliminación del único Administrador muestran su aviso, se leen y se cierran con teclado, y el contraste del aviso cumple `docs/design/system.md` — cubre: CA11 — depende: T050, T052
  - nota: T050 pasa; suite del frontend 15/15, ejecutada dos veces
  - nota: verificación manual OK 2026-11-11 (usuario): en el navegador a 390 y 1440 px, alta con correo repetido y eliminación del único Administrador muestran su aviso, se leen y se cierran con teclado; contraste correcto

## Integración y documentación
- [x] T060 Correr la suite completa, el lint de lo tocado y la auditoría de dependencias — hecho cuando: `npm test` en verde; `npx eslint` sin errores nuevos en los archivos tocados de backend y frontend; `npm --prefix backend audit --audit-level=high` y `npm --prefix frontend audit --audit-level=high` sin altas ni críticas · verificación manual: alta y edición de una cuenta desde el panel funcionan como antes — depende: T023, T041, T051, T052
  - nota: backend 241 pasan (5 `todo`), frontend 15/15; lint: los 4 errores previos del backend y los 15 problemas previos del frontend, ninguno en archivos tocados; `npm audit --audit-level=high` sin altas ni críticas en ambos (una primera ejecución falló por red y repetida dio 0); build del frontend correcto; gitleaks no está instalado en local (corre en CI). Verificación manual OK 2026-11-11 (usuario): alta y edición desde el panel funcionan como antes
- [x] T090 Actualizar `docs/architecture.md`: fila del módulo `users` ("valida campos permitidos y protege al último Administrador activo") y su columna "Depende de" (añadir `auth`)
  - nota: fila de `users`: responsabilidad y dependencia de `auth.service`
- [x] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: sin cambios: no hay variables, entornos, pasos de deploy, logs, eventos de auditoría ni métricas nuevos
- [x] T092 Marcar spec como `implemented`

## Despliegue (lo ejecuta `/release`)
- [ ] T095 Desplegar a staging y verificar criterios de aceptación
  - nota: no hay staging (`docs/deployment.md`); las verificaciones manuales se hacen en local (T041, T051, T060)
- [ ] T096 Aprobación humana para producción
- [ ] T097 Desplegar a producción y vigilar métricas del plan (Rollout)
  - el único Administrador activo intenta desactivar su cuenta y recibe el aviso; sin errores 500 nuevos en `/api/v1/usuarios`
- [ ] T098 Marcar spec como `released`

## Cobertura
| Criterio | Tarea(s) de test | Tarea(s) de implementación |
|---|---|---|
| CA1 | T010, T011 | T020, T022, T023 |
| CA2 | T010 | T020, T022 |
| CA3 | T010 | T020, T022 |
| CA4 | T010, T012 | T020, T021, T022 |
| CA5 | T010, T012 | T020, T021, T022 |
| CA6 | T010, T011 | T020, T022 |
| CA7 | T030 | T041 |
| CA8 | T030 | T041 |
| CA9 | T030 | T041 |
| CA10 | T031, T012 | T040, T041 |
| CA11 | T050, T053 | T051, T052 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T041 | T030 |
| TM2 | T020, T023 | T010, T011 |
| TM3 | T020, T021, T040 | T010, T012 |
| TM4 | T040, T041 | T031 |
| TM5 | T022 | T010 |

| Cambio del plan (módulo) | Tarea(s) |
|---|---|
| `backend/src/modules/users/user.validacion.js` | T020 |
| `backend/src/modules/auth/auth.service.js` | T001 |
| `backend/src/modules/users/user.service.js` | T022, T041 |
| `backend/src/modules/users/user.repository.js` | T021, T040 |
| `backend/src/modules/users/user.controller.js` | T023 |
| `frontend/src/pages/admin/AdminUsuarios.jsx` | T051 |
| `frontend/src/components/ModalConfirmacion.jsx` | T052 |
| `backend/tests/usuarios/` | T010, T011, T012, T030, T031 |
| `frontend/tests/` | T050, T053 |
| `docs/architecture.md` | T090 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Aviso anunciado a lectores de pantalla y con contraste AA | T050, T053 · verificación manual en T051 |
| Ningún aviso revela datos de otra cuenta | T010 |
