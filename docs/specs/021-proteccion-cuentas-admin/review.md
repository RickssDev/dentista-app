---
spec: 021-proteccion-cuentas-admin
verdict: approved
round: 2
date: 2026-11-12
base: fc91933
head: 159e2dc
human_signoff: pending
---

# Review · 021 Protección de las cuentas del personal

## Resumen
Ronda 2 (`--rerun`, sin subagentes: `code.diff` de 15.8 KB, releído desde cero). Las tareas
T070–T084 corrigen R1–R7 y cada corrección tiene su test, comprobado rompiendo lo que protege. Sin
hallazgos nuevos. Aprobada; falta la revisión humana del PR que exige la definición de terminado.
Conteo: bloqueante 0 · importante 0 · menor 0 (nuevos); abiertos de la ronda 1: 0

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (backend) | ✅ 256 pasan, 5 `todo` (ronda 1: 241 + 5) |
| `npm test` (frontend, dos veces) | ✅ 17/17 en ambas ejecuciones |
| `npm run lint --prefix backend` | ✅ 4 errores previos, ninguno en archivos tocados |
| `npm run lint --prefix frontend` | ✅ 15 problemas previos, ninguno en archivos tocados |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/021-proteccion-cuentas-admin` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `datos-cuenta.test.js::CA1`, `rutas-usuarios.test.js::CA1, R4` | ✅ | Imagen subida se borra si se rechaza (R4) |
| CA2 | `datos-cuenta.test.js::CA2, R5` | ✅ | Solo espacios cuenta como vacío (R5) |
| CA3 | `datos-cuenta.test.js::CA3, R7` | ✅ | Edición con > 72 bytes probada |
| CA4 | `datos-cuenta.test.js::CA4, R2` | ✅ | Edición con correo de otra cuenta y `1062` al editar probados (R2) |
| CA5 | `datos-cuenta.test.js::CA5, R7` | ✅ | Rol inexistente en edición probado |
| CA6 | `datos-cuenta.test.js::CA6`, `rutas-usuarios.test.js` | ✅ | |
| CA7 | `ultimo-admin.test.js::CA7, R7`, `rutas-usuarios.test.js::R1` | ✅ | Id no numérico → 400 antes de la regla (R1) |
| CA8 | `ultimo-admin.test.js::CA8` | ✅ | |
| CA9 | `ultimo-admin.test.js::CA9, R7` | ✅ | Imagen del único Administrador probada |
| CA10 | `ultimo-admin-concurrencia.test.js` (incluido R6) | ✅ | Bloqueo real de InnoDB con la verificación manual de T041 |
| CA11 | `usuarios-avisos.test.jsx`, `modal-confirmacion.test.jsx` | ✅ | Error de red → aviso genérico en español (R3) |

## Conformidad con el plan
- Cambios fuera del plan: ninguno nuevo (`scope.md`: 10 archivos, todos con tarea).
- Partes del plan sin implementar: ninguna.

## Seguimiento de la ronda 1
| ID | Estado | Evidencia |
|---|---|---|
| R1 | resuelto | `user.service.js` `normalizarIdUsuario` en `updateUsuario` y `deleteUsuario`; `rutas-usuarios.test.js::R1` (4 casos, fallan sin la normalización) |
| R2 | resuelto | `datos-cuenta.test.js::R2` (correo de otra cuenta en edición, `1062` al editar) |
| R3 | resuelto | `AdminUsuarios.jsx` ignora el mensaje de un `TypeError`; `usuarios-avisos.test.jsx` "error de red"; un cuerpo no JSON ya da "Error interno del servidor" en `services/api.js` |
| R4 | resuelto | `user.controller.js` `conImagenSubida`; `rutas-usuarios.test.js::R4` |
| R5 | resuelto | `user.validacion.js` `vacio` con `trim`; `datos-cuenta.test.js::R5` |
| R6 | resuelto | `user.repository.js` rollback con `.catch`; `ultimo-admin-concurrencia.test.js::R6` |
| R7 | resuelto | Aserciones con argumentos y casos añadidos en T071, T072, T074 |
| R8–R20 | aceptados | En roadmap (ver la ronda 1, `history/review.r1.md`) |

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P2 Tests por feature | ✅ | Huecos de la ronda 1 cubiertos |
| P9 Entrada validada | ✅ | Id de la ruta validado (R1) |
| P13 Auditoría | ❌ aceptado | Excepción hasta el objetivo 3 (usuario, 2026-11-11) |
| P14 Correlación | ❌ aceptado | Excepción hasta el objetivo 3 (usuario, 2026-11-11) |
| P16 Accesibilidad | ✅ | Aviso en español ante error de red (R3) |
| Resto | sin cambios | Ver la ronda 1 |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks) | no ejecutado en local (no instalado); corre en CI |
| SAST | no-aplica |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 (sin cambios de dependencias) |
| Contenedores (trivy) | no ejecutado en local (no instalado); corre en CI |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ✅ | Regla del último Administrador con id validado (R1) |
| Archivos subidos | ✅ | Imagen rechazada no queda huérfana (R4); extensiones siguen en RS5 (R18) |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica (excepción P13).
- Datos sensibles en logs del código tocado: ninguno.
- `request_id` presente en los logs nuevos: no hay logs nuevos (excepción P14).

## Hallazgos
Ninguno nuevo.

## Preparación para release
- Rollback factible: sí; sin migraciones ni flags.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Docs actualizadas (architecture, deployment): sí (T090, T091).

## Tareas añadidas
Ninguna en esta ronda.

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-12 (ronda 1):
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
