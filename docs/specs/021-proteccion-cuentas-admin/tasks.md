---
spec: 021-proteccion-cuentas-admin
plan: plan.md
status: draft
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
| P2 Tests por feature | ✅ | Cada tarea de implementación depende de su tarea de test, escrita antes | test: T010, T011, T030, T031, T050 |
| P3 Dependencias nuevas con ADR | ➖ | Ninguna tarea añade dependencias | — |
| P4 Arquitectura con ADR | ➖ | Sin cambios de arquitectura; T090 actualiza la fila de `users` | — |
| P5 Producción solo con aprobación humana | ✅ | T096 se mantiene | manual: T096 |
| P6 Rollback documentado | ✅ | Rollout del plan; sin migraciones | manual: T096 |
| P7 Migraciones compatibles | ➖ | Ninguna tarea cambia el esquema | — |
| P8 Autorización en el servidor | ✅ | Rutas sin cambios; regla en el servicio (T041) | test: `permisos.test.js` en T060, T030 |
| P9 Entrada validada y SQL parametrizado | ✅ | Lista blanca (T020); consultas nuevas con `?` (T021, T040) | test: T010; manual: T060 busca interpolación en `user.repository.js` |
| P10 Secretos fuera del repositorio | ✅ | Ninguna tarea toca secretos | test: gitleaks en CI |
| P11 Sin vulnerabilidades críticas o altas | ✅ | Comprobado en T060 | test: `npm audit --audit-level=high` en T060 |
| P12 Modelo de amenazas | ✅ | TM1–TM5 con tarea de test y de control | manual: `/analyze` |
| P13 Auditoría | ❌ aceptado: hasta el objetivo 3 — aprobado por el usuario el 2026-11-11 | Ninguna tarea emite eventos de auditoría | — |
| P14 Correlación por petición | ❌ aceptado: hasta el objetivo 3 — aprobado por el usuario el 2026-11-11 | Ninguna tarea añade logs | — |
| P15 Logs sin datos sensibles | ✅ | Ninguna tarea añade logs; T010 espía `console.*` | test: T010 |
| P16 Accesibilidad | ✅ | Avisos existentes consultados por rol | test: T050; manual: T051 |
| P17 Sin lógica de negocio en las vistas | ✅ | T051 solo muestra el mensaje de la API | manual: `/review` |
| P18 Metadatos por ruta indexable | ➖ | No toca rutas públicas | — |
| P19 Noindex fuera de lo público | ➖ | No toca rutas | — |
| P20 Sistema de diseño | ✅ | T051 no añade estilos ni literales | manual: `/review` del diff |

## Preparación
- [ ] T001 Exportar `validarContrasena` sin cambiar su lógica — `backend/src/modules/auth/auth.service.js` — hecho cuando: `module.exports.validarContrasena` existe y `npx jest tests/auth` sigue en verde

## Historia 1: datos válidos en alta y edición

### Tests (antes de implementar)
- [ ] T010 [P] Escribir las pruebas de datos de la cuenta con el repositorio simulado — `backend/tests/usuarios/datos-cuenta.test.js` — hecho cuando: falla por la razón esperada (hoy se aceptan los datos) en: campos ajenos (`google_id`, `fecha_registro`, `id_usuario`, `imagen` en el cuerpo) ignorados en alta y edición; alta sin cada obligatorio → 400 que lo nombra; contraseña corta o de más de 72 bytes → 400 en alta y edición; correo sin formato → 400; correo de otra cuenta → 400 "El correo ya está registrado" sin nombre, id ni rol de esa cuenta; `errno 1062` en carrera → 400; rol inexistente o no entero → 400; estado fuera de activo/inactivo → 400; objeto, lista o texto más largo que la columna → 400 y nunca 500; con `console.*` espiado, ningún rechazo escribe el correo ni la contraseña — cubre: CA1, CA2, CA3, CA4, CA5, CA6
- [ ] T011 [P] Escribir las pruebas HTTP de usuarios con supertest y el repositorio simulado — `backend/tests/usuarios/rutas-usuarios.test.js` — hecho cuando: falla por la razón esperada en: `POST` y `PUT` con datos inválidos → 400 con `message`; `imagen` en el cuerpo sin archivo no llega al repositorio; con archivo subido, llega `/uploads/<archivo>` — cubre: CA1, CA6

### Implementación
- [ ] T020 Crear la validación de la cuenta (`limpiarAlta`, `limpiarEdicion`) — `backend/src/modules/users/user.validacion.js` — hecho cuando: los casos de T010 de campos ajenos, obligatorios, contraseña, formato de correo, estado, tipos y largos pasan (nombre y apellido ≤ 55, correo ≤ 100, teléfono ≤ 20; `email` se acepta como alias de `correo`; `estado` solo en edición) — cubre: CA1, CA2, CA3, CA4, CA5, CA6 — depende: T001, T010
- [ ] T021 Añadir `getRolById` y `findOtroUsuarioPorCorreo` con parámetros `?` — `backend/src/modules/users/user.repository.js` — hecho cuando: ambas consultas existen con `?` y sin interpolación — cubre: CA4, CA5 — depende: T010
- [ ] T022 Usar la validación en `createUsuario` y `updateUsuario`: rol existente, correo libre, `1062` → 400, imagen como argumento aparte — `backend/src/modules/users/user.service.js` — hecho cuando: T010 pasa completo — cubre: CA1, CA2, CA3, CA4, CA5, CA6 — depende: T020, T021
- [ ] T023 Pasar la imagen del archivo subido como argumento y dejar de escribirla en `req.body` — `backend/src/modules/users/user.controller.js` — hecho cuando: T011 pasa — cubre: CA1 — depende: T011, T022

## Historia 2: último Administrador activo

### Tests (antes de implementar)
- [ ] T030 [P] Escribir las pruebas del último Administrador con el repositorio simulado — `backend/tests/usuarios/ultimo-admin.test.js` — hecho cuando: falla por la razón esperada en: eliminar, desactivar y cambiar el rol al único Administrador activo → 409 "Debe quedar al menos un Administrador activo" sin escribir nada, también sobre su propia cuenta; con otro activo, las tres acciones se permiten; editar nombre o contraseña del único → se permite; reactivar un Administrador inactivo → se permite; eliminar con `1451` del único → 409 sin desactivar — cubre: CA7, CA8, CA9
- [ ] T031 [P] Escribir las pruebas de concurrencia del último Administrador — `backend/tests/usuarios/ultimo-admin-concurrencia.test.js` — hecho cuando: falla por la razón esperada en: con un repositorio simulado que serializa las transacciones, de dos degradaciones cruzadas simultáneas solo una pasa y la otra recibe 409; con una conexión falsa que captura el SQL, la prueba falla si el conteo de Administradores activos no lleva `FOR UPDATE` o no se hace sobre la `conn` de la transacción (comprobado rompiéndolo) — cubre: CA10

### Implementación
- [ ] T040 Añadir `conTransaccion`, `bloquearAdministradoresActivos` (`SELECT … FOR UPDATE` sobre rol `Administrador` y estado `activo`) y `conn` opcional en `updateUsuario`, `deleteUsuario` y `desactivarUsuario` — `backend/src/modules/users/user.repository.js` — hecho cuando: la parte de T031 sobre el SQL capturado pasa y las llamadas existentes sin `conn` siguen funcionando — cubre: CA10 — depende: T021, T031
- [ ] T041 Aplicar la regla del último Administrador en `updateUsuario` y `deleteUsuario` dentro de la transacción — `backend/src/modules/users/user.service.js` — hecho cuando: T030 y T031 pasan · verificación manual: con la API y el MySQL de Docker local, dos peticiones simultáneas de degradación cruzada entre los dos únicos Administradores dejan uno activo y la otra responde 409 — cubre: CA7, CA8, CA9, CA10 — depende: T022, T030, T040

## Panel

### Tests (antes de implementar)
- [ ] T050 [P] Escribir las pruebas de los avisos de la pantalla de usuarios — `frontend/tests/usuarios-avisos.test.jsx` — hecho cuando: falla por la razón esperada en "eliminar con 409 muestra el motivo de la API" (hoy muestra el texto genérico) y pasa "guardar con 400 muestra el mensaje en un `role=\"alert\"` y conserva lo escrito" — cubre: CA11

### Implementación
- [ ] T051 Mostrar el mensaje de la API en el aviso de eliminar (texto genérico solo si no hay) — `frontend/src/pages/admin/AdminUsuarios.jsx` — hecho cuando: T050 pasa · verificación manual: en el navegador a 390 y 1440 px, alta con correo repetido y eliminación del único Administrador muestran su aviso, se leen y se cierran con teclado, y el contraste del aviso cumple `docs/design/system.md` — cubre: CA11 — depende: T050

## Integración y documentación
- [ ] T060 Correr la suite completa, el lint de lo tocado y la auditoría de dependencias — hecho cuando: `npm test` en verde; `npx eslint` sin errores nuevos en los archivos tocados de backend y frontend; `npm --prefix backend audit --audit-level=high` y `npm --prefix frontend audit --audit-level=high` sin altas ni críticas; `user.repository.js` sin SQL interpolado con valores del usuario · verificación manual: alta y edición de una cuenta desde el panel funcionan como antes — depende: T023, T041, T051
- [ ] T090 Actualizar `docs/architecture.md`: fila del módulo `users` ("valida campos permitidos y protege al último Administrador activo")
- [ ] T091 Actualizar `docs/deployment.md` y `docs/observability.md` si cambiaron variables, entornos, pasos de deploy, logs, eventos de auditoría o métricas
  - nota: el plan no cambia ninguno; registrar "sin cambios" al cerrar
- [ ] T092 Marcar spec como `implemented`

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
| CA4 | T010 | T020, T021, T022 |
| CA5 | T010 | T020, T021, T022 |
| CA6 | T010, T011 | T020, T022 |
| CA7 | T030 | T041 |
| CA8 | T030 | T041 |
| CA9 | T030 | T041 |
| CA10 | T031 | T040, T041 |
| CA11 | T050 | T051 |

| Amenaza (TM#) | Tarea(s) de control | Tarea(s) de test |
|---|---|---|
| TM1 | T041 | T030 |
| TM2 | T020, T023 | T010, T011 |
| TM3 | T020 | T010 |
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
| `backend/tests/usuarios/` | T010, T011, T030, T031 |
| `frontend/tests/usuarios-avisos.test.jsx` | T050 |
| `docs/architecture.md` | T090 |

| Requisito no funcional | Tarea(s) de test o verificación manual (T095) |
|---|---|
| Aviso anunciado a lectores de pantalla y con contraste AA | T050 · verificación manual en T051 |
| Ningún aviso revela datos de otra cuenta | T010 |
