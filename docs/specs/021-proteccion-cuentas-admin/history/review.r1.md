---
spec: 021-proteccion-cuentas-admin
verdict: changes_requested
round: 1
date: 2026-11-12
base: 1e8d678
head: fc91933
human_signoff: pending
---

# Review · 021 Protección de las cuentas del personal

## Resumen
La implementación cumple los once criterios y sus controles, sin bloqueantes. Hay tres
hallazgos importantes que el usuario decidió corregir antes de liberar: el id de la ruta sin validar
debilita la regla del último Administrador (R1), falta probar la edición con el correo de otra
cuenta (R2) y un error de red llega al aviso en inglés (R3). También se corrigen cuatro menores
baratos; el resto va al roadmap.
Conteo: bloqueante 0 · importante 3 · menor 17

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (backend) | ✅ 241 pasan, 5 `todo` (línea base 180 + 5) |
| `npm test` (frontend, dos veces) | ✅ 15/15 en ambas ejecuciones |
| `npm run lint --prefix backend` | ✅ 4 errores previos, ninguno en archivos tocados |
| `npm run lint --prefix frontend` | ✅ 15 problemas previos, ninguno en archivos tocados |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/021-proteccion-cuentas-admin` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `backend/tests/usuarios/datos-cuenta.test.js::CA1`, `rutas-usuarios.test.js::CA1` | ✅ | |
| CA2 | `datos-cuenta.test.js::CA2` | ✅ | Un nombre de solo espacios cuenta como lleno (R5) |
| CA3 | `datos-cuenta.test.js::CA3` | ✅ | En edición solo se prueba la contraseña corta (R7) |
| CA4 | `datos-cuenta.test.js::CA4` | ⚠ | Sin test de edición con el correo de otra cuenta ni de `1062` al editar (R2) |
| CA5 | `datos-cuenta.test.js::CA5` | ✅ | Rol inexistente en edición sin test (R7) |
| CA6 | `datos-cuenta.test.js::CA6`, `rutas-usuarios.test.js` | ✅ | |
| CA7 | `ultimo-admin.test.js::CA7` | ⚠ | Un id no numérico salta la regla (R1) |
| CA8 | `ultimo-admin.test.js::CA8` | ✅ | |
| CA9 | `ultimo-admin.test.js::CA9` | ✅ | Imagen del único Administrador sin test (R7) |
| CA10 | `ultimo-admin-concurrencia.test.js` | ✅ | El bloqueo real de InnoDB solo con verificación manual (T041) |
| CA11 | `frontend/tests/usuarios-avisos.test.jsx`, `modal-confirmacion.test.jsx` | ⚠ | Un error de red se muestra en inglés (R3) |

## Conformidad con el plan
- Cambios fuera del plan: `frontend/src/components/ModalFormulario.jsx` (T052, ampliada con decisión del usuario).
- Partes del plan sin implementar: ninguna (`scope.md`: 0 archivos sin tarea, 0 tareas sin diff).

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1 Spec antes de implementar | ✅ | Spec y plan aprobados; commits con ID de tarea |
| P2 Tests por feature | ✅ | Cada CA con test; huecos en R2 y R7 |
| P3 Dependencias con ADR | ➖ | Sin dependencias nuevas (`deps.stat` vacío) |
| P4 Arquitectura | ✅ | `docs/architecture.md` actualizado (T090) |
| P5–P7 | ➖ | Sin despliegue ni migraciones en la review |
| P8 Autorización en el servidor | ✅ | `user.routes.js` sin cambios; regla en el servicio |
| P9 Entrada validada y SQL parametrizado | ⚠ | Lista blanca y `?` correctos (`consultas-usuarios.test.js`); el id de la ruta no se valida (R1) |
| P10 Secretos | ✅ | Sin secretos en el diff |
| P11 Vulnerabilidades | ✅ | `npm audit` sin altas ni críticas |
| P12 Modelo de amenazas | ✅ | TM1–TM5 con control y test |
| P13 Auditoría | ❌ aceptado | Excepción hasta el objetivo 3 (usuario, 2026-11-11) |
| P14 Correlación | ❌ aceptado | Excepción hasta el objetivo 3 (usuario, 2026-11-11) |
| P15 Logs sin datos sensibles | ✅ | `rutas-usuarios.test.js` espía `console.*` en 400, 409 y `1062` |
| P16 Accesibilidad | ⚠ | Descripción accesible correcta; texto en inglés ante error de red (R3) |
| P17 Sin lógica en vistas | ✅ | La vista solo muestra el mensaje |
| P18–P19 | ➖ | Sin rutas públicas |
| P20 Sistema de diseño | ✅ | Sin estilos ni literales nuevos |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks) | no ejecutado en local (no instalado); corre en CI |
| SAST | no-aplica (`.ai/project.yaml`) |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 · media: 20 + 1 baja (backend, previas); frontend 0 |
| Contenedores (trivy) | no ejecutado en local (no instalado); corre en CI |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ⚠ | Rutas con `authorizeRoles("Administrador")`; regla del último Administrador débil ante id no numérico (R1) |
| A01:2025 · API3 Asignación masiva | ✅ | `user.validacion.js` lista blanca; imagen solo de `req.file` |
| A03:2025 Inyección | ✅ | Consultas con `?`; `SET` dinámico con nombres de `fieldMap` |
| A04:2025 Diseño (concurrencia) | ✅ | `FOR UPDATE` en la misma `conn`; carrera de tres peticiones como deuda (R8) |
| A09:2025 Logs | ✅ | Mensajes sin valores; `1062` sustituido sin el correo |
| Archivos subidos | ❌ menor | Imagen huérfana tras 400/409 (R4); extensiones (R18, previo, RS5) |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica (excepción P13 hasta el objetivo 3).
- Datos sensibles en logs del código tocado: ninguno (`rutas-usuarios.test.js`, P15).
- `request_id` presente en los logs nuevos: no hay logs nuevos (excepción P14).

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `backend/src/modules/users/user.service.js` (`exigirOtroAdministradorActivo`, `updateUsuario`, `deleteUsuario`) | El id de la ruta llega sin validar: con `/usuarios/5abc`, MySQL encuentra la cuenta 5 pero `Number('5abc')` es `NaN`, la cuenta no se excluye y la regla del último Administrador pasa; la escritura depende del `sql_mode` | Id entero positivo o 400, y usar el id de la cuenta encontrada en la regla y las escrituras (test HTTP con `/usuarios/5abc`) |
| R2 | importante | `backend/tests/usuarios/datos-cuenta.test.js` (CA4) | Sin test de edición con el correo de otra cuenta (`exigirCorreoLibre(correo, id)`) ni de `1062` al editar | Tests de edición: correo de otra cuenta → 400 sin escribir ni datos de esa cuenta y llamada con `(correo, 5)`; `1062` → 400 |
| R3 | importante | `frontend/src/pages/admin/AdminUsuarios.jsx` (`confirmarEliminar`) | Un fallo de red muestra "Failed to fetch" (inglés, técnico) como descripción del aviso | El motivo se muestra solo si viene de la API; con error de red, el texto genérico en español (test con `TypeError`) |
| R4 | menor | `backend/src/modules/users/user.controller.js` | La imagen que multer ya guardó queda huérfana si el alta o la edición se rechazan | Borrar el archivo subido cuando el servicio lanza (test HTTP con archivo y 400) |
| R5 | menor | `backend/src/modules/users/user.validacion.js` (`vacio`) | Un texto de solo espacios cuenta como lleno | Tratar como vacío el texto que solo tiene espacios (test de alta con nombre `'   '`) |
| R6 | menor | `backend/src/modules/users/user.repository.js` (`conTransaccion`) | Si `rollback()` lanza, se pierde el error original | Relanzar siempre el error original (test con rollback que falla) |
| R7 | menor | `datos-cuenta.test.js`, `ultimo-admin.test.js`, `usuarios-avisos.test.jsx` | Aserciones `toHaveBeenCalled()` débiles; faltan casos de edición (rol inexistente, contraseña > 72 bytes), imagen del único Administrador, desactivar y cambiar rol en el mismo PUT, y la lista sin recargar al guardar con 400 | Aserciones con argumentos y los casos que faltan |
| R8 | menor | `user.service.js` (`updateUsuario`, `deleteUsuario`) | La decisión de abrir la transacción usa la cuenta leída fuera del bloqueo; con tres peticiones simultáneas podría quedar cero | Releer la cuenta con `FOR UPDATE` dentro de la transacción |
| R9 | menor | `user.validacion.js` | Importa todo `auth.service` solo por `validarContrasena` | Mover la validación de contraseña a `src/utils/` |
| R10 | menor | `backend/tests/usuarios/*.test.js` | Fábrica de mocks del repositorio y tabla de roles duplicadas en cuatro archivos | Extraer a `tests/support/` |
| R11 | menor | `ultimo-admin.test.js` ("sobre su propia cuenta") | Repite casos anteriores: el servicio no recibe quién actúa | Probarlo por HTTP con el JWT de la propia cuenta |
| R12 | menor | `usuarios-avisos.test.jsx` (eliminar) | `pedidasDeLista()` ya se cumplía antes del cambio | Dejarlo como regresión |
| R13 | menor | `user.service.js` (`eliminarODesactivar(undefined)`) | Depende del valor por defecto con `undefined`; cuesta leerlo | Llamar sin argumento |
| R14 | menor (previo) | `frontend/src/components/ModalFormulario.jsx` | Al cerrar, el foco no vuelve al disparador; sin trampa de foco | Restaurar el foco y atraparlo dentro del modal |
| R15 | menor (previo) | `ModalFormulario.jsx` | Con dos modales apilados, Escape cierra los dos | Cerrar solo el superior |
| R16 | menor (previo) | `ModalFormulario.jsx`, `AdminUsuarios.jsx` | Un segundo error con el mismo texto no se vuelve a anunciar; el error no se asocia al campo; la confirmación de eliminar se cierra antes de la petición | Limpiar el error al reenviar; mantener la confirmación hasta la respuesta |
| R17 | menor | `ModalConfirmacion.jsx` | `mensaje` debe ser texto para describir el diálogo; un nodo con bloques sería HTML inválido en `<p>` | Documentarlo |
| R18 | menor (previo) | `backend/src/utils/upload.js` | Extensión del nombre original y filtro solo por `mimetype` declarado | Ya registrado como RS5.a/RS5.b |
| R19 | menor | `ultimo-admin-concurrencia.test.js` | El bloqueo real de InnoDB no tiene prueba automática contra MySQL | Verificación manual de T041 registrada; test de integración cuando exista una BD de pruebas |
| R20 | menor | `ModalConfirmacion.jsx` | `aria-describedby` se pone aunque el mensaje esté vacío (no ocurre hoy con el diálogo abierto) | Solo con mensaje no vacío |

## Preparación para release
- Rollback factible: sí; sin migraciones ni flags (`git checkout` y reconstruir, `docs/deployment.md`).
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Docs actualizadas (architecture, deployment): `architecture.md` sí (T090); `deployment.md` sin cambios necesarios (T091).
- Riesgos: RS1.b y RS1.c implementados y probados; su estado en `docs/security.md` lo cambia `/release`.

## Tareas añadidas
- T070 ← R1, R4
- T071 ← R2, R5, R7
- T072 ← R7
- T073 ← R6
- T074 ← R3, R7
- T080 ← R1, R13
- T081 ← R4
- T082 ← R5
- T083 ← R6
- T084 ← R3

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-12:
- **R8** → roadmap: carrera con tres peticiones simultáneas; releer la cuenta con `FOR UPDATE` dentro de la transacción.
- **R9** → roadmap: mover `validarContrasena` a `src/utils/` y quitar la dependencia `users` → `auth.service`.
- **R10** → roadmap: extraer la fábrica de mocks del repositorio de usuarios a `tests/support/`.
- **R11** → roadmap: probar "sobre su propia cuenta" por HTTP con el JWT de la cuenta.
- **R12** → roadmap: la aserción de lista sin recargar al eliminar es de regresión.
- **R14** → roadmap: foco de los modales (restaurar al cerrar, trampa de foco), previo.
- **R15** → roadmap: Escape cierra dos modales apilados, previo.
- **R16** → roadmap: anuncio repetido del error, error asociado al campo y confirmación de eliminar, previo.
- **R17** → roadmap: documentar que `mensaje` de `ModalConfirmacion` debe ser texto.
- **R18** → roadmap: extensiones de las subidas, ya en RS5.a/RS5.b.
- **R19** → roadmap: test de integración del bloqueo contra una BD de pruebas.
- **R20** → roadmap: `aria-describedby` solo con mensaje no vacío.
