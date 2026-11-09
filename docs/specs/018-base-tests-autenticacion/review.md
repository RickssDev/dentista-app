---
spec: 018-base-tests-autenticacion
verdict: approved
round: 2
date: 2026-11-09
base: 4f3ae1b
head: d0e5b2c
human_signoff: RickssDev 2026-11-09
---

# Review · 018 Base de tests, integración continua y autenticación

## Resumen
Aprobada: R1 a R10 están resueltos, comprobados rompiendo cada regla, y el código de producción sigue sin cambios. Ronda delta sin subagentes (`code.diff` de 11.8 KB). R11 y los menores quedan aceptados. Las vulnerabilidades previas siguen abiertas y bloquean `/release` hasta el `/chore`.
Conteo: bloqueante 0 · importante 1 (aceptado) · menor 11 (aceptados)

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (dos veces) | ✅ 61 pruebas y 6 pendientes en backend, 5 en frontend; sin fallos |
| `npm run lint --prefix backend` | ✅ Solo los 5 errores previos |
| `npm run lint --prefix frontend` | ✅ Solo los 15 problemas previos |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `npm test`; PR #64 | ✅ | |
| CA2 | `backend/tests/auth/*`, `frontend/tests/login-redireccion.test.jsx` | ✅ | R2, R4, R5, R6 y R7 resueltos |
| CA3 | `seguridad/pendientes.test.js` | ✅ | R1 resuelto |
| CA4 | `git diff e3d311c` sin cambios | ✅ | `minimatch` aceptado por el usuario (T027) |
| CA5 | T028, T034 | ✅ | R3 registrado como pendiente y en el roadmap |
| CA6 | `seguridad/guard.test.js` | ✅ | |
| CA7 | `seguridad/red.test.js` | ✅ | R8 resuelto |
| CA8 | `seguridad/fixtures.test.js`, gitleaks en CI | ✅ | |
| CA9 | `seguridad/cadena-suministro.test.js`; PR #64 y #65 | ✅ | R9 resuelto |
| CA10 | `seguridad/cadena-suministro.test.js`; PR #64 | ✅ | R22 aceptado |

## Conformidad con el plan
- Cambios fuera del plan: ninguno; `reporters: ['default']` forma parte de T032.
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1 | ✅ | Spec, plan y análisis vigentes |
| P2 | ✅ | `npm test` en el job "Lint y build" |
| P3 | ✅ | ADR 0004 y `cadena-suministro.test.js` |
| P4 | ➖ | No contradice la arquitectura |
| P5 | ✅ | Sin cambios en el despliegue |
| P6 | ✅ | Rollout del plan |
| P7, P8, P9 | ➖ | Sin cambios de esquema, endpoints ni producción |
| P10 | ✅ | `fixtures.test.js`, gitleaks en CI |
| P11 | ⚠ | Prueba de `npm audit` en el workflow (R10); las críticas y altas previas bloquean `/release` hasta el `/chore` |
| P12 | ✅ | TM1 a TM5 con control y test |
| P13 a P20 | ➖ | Sin cambios de flujos, interfaz ni rutas |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks) | ✅ Sin hallazgos en CI hasta `69b495f`. Los commits posteriores se escanearán al subirlos |
| SAST | ➖ `no-aplica` por decisión del usuario |
| SCA (npm audit) | backend crít: 1 · alta: 9 · media: 21; frontend alta: 10 · media: 2. Sin cambios respecto a la ronda 1; se atienden con `/chore` |
| Contenedores (trivy) | ⚠ No ejecutado: R11 |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ➖ | Sin cambios en producción |
| A02:2025 Configuración | ✅ | TM1 a TM3; bloqueo de sockets y de `fetch` comprobados por separado (R8) |
| A03:2025 Cadena de suministro | ✅ | Sin dependencias nuevas en esta ronda |
| A04:2025 Criptografía | ➖ | Sin cambios en producción |
| A05:2025 Inyección | ✅ | Sin entradas nuevas |
| A06:2025 Diseño inseguro | ✅ | Modelo de amenazas con control y test |
| A07:2025 Autenticación | ➖ | Sin cambios; defectos previos como pendientes |
| A08:2025 Integridad y CI | ✅ | Paso de pruebas y auditoría protegidos por prueba (R9, R10) |
| A09:2025 Registro | ➖ | Sin cambios de flujos |
| A10:2025 Condiciones excepcionales | ✅ | La simulación y el bloqueo fallan en cerrado |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no aplica; la spec no cambia flujos.
- Datos sensibles en logs del código tocado: ninguno; las pruebas usan datos ficticios.
- `request_id` presente en los logs nuevos: no aplica; no hay logs nuevos de producción.

## SEO
| Tema | Resultado | Evidencia |
|---|---|---|
| Todos | ➖ | El diff no toca rutas públicas, metadatos, `robots.txt` ni hosting |
- Sección "Descubribilidad" del plan aplicada: `No aplica`, sin rutas.

## Hallazgos
Seguimiento de la ronda 1:

| ID | Severidad | Estado | Evidencia |
|---|---|---|---|
| R1 | bloqueante | resuelto | `seguridad/pendientes.test.js` falla sin `verbose` o sin `reporters` |
| R2 | bloqueante | resuelto | 001 CA6 acotado; prueba de caracterización que falla al cambiar la respuesta |
| R3 | importante | resuelto | `test.todo` visible y línea en el roadmap |
| R4 | importante | resuelto | Detecta `.length` y los bordes de 72 bytes y 8 caracteres |
| R5 | importante | resuelto | Detecta la retirada de `r.token_hash = ?` |
| R6 | importante | resuelto | Detecta la retirada de `WHERE usuarios.correo = ?` |
| R7 | importante | resuelto | Detecta la retirada de `commit` y de cada `rollback` |
| R8 | importante | resuelto | Detecta la retirada del parche de sockets y del bloqueo de `fetch` |
| R9 | importante | resuelto | Detecta paso comentado, `continue-on-error` e `if` |
| R10 | importante | resuelto | Detecta la retirada de la auditoría |

Nuevos:

| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R22 | menor | `backend/tests/seguridad/cadena-suministro.test.js` | La prueba de CA10 aceptaría un paso comentado, la debilidad que R9 corrigió en el paso de pruebas. | Anclar el patrón del paso. |

## Preparación para release
- Rollback factible: sí; revertir el commit de integración, sin datos ni esquema.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Docs actualizadas (architecture, deployment): sí; T090 y T091.
- Vulnerabilidades críticas o altas: siguen abiertas y bloquean `/release` hasta el `/chore` (decisión del usuario, 2026-11-09).
- Cobertura de riesgos: RD8.a, RD8.c y la parte de autenticación de RD8.b implementadas y probadas; la parte de citas de RD8.b sigue pendiente → spec 019. Ninguno declarado mitigado.

## Tareas añadidas
Ronda 1: T031 a T041. Ninguna en esta ronda.

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-09:
- **R11** → roadmap: Trivy no se ha ejecutado; se exige antes de liberar (T095).
- **R12** → roadmap: enlazar cada dependencia de producción registrada con su ADR.
- **R13** → roadmap: ampliar la prueba de permisos del workflow.
- **R14** → roadmap: indicar que la antigüedad de versiones es control de proceso.
- **R15** → roadmap: anotar `minimatch` en el ADR 0004.
- **R16** → roadmap: restaurar solo las variables tocadas en la prueba de 001 CA3.
- **R17** → roadmap: reubicar la prueba del doble y simplificar aserciones.
- **R18** → roadmap: ampliar 003 CA1 y CA3.
- **R19** → roadmap: precisar la prueba de red del frontend.
- **R20** → roadmap: exigir el paso de gitleaks en el workflow.
- **R21** → roadmap: añadir `test.todo` del `axios` al corregirlo.
- **R22** → roadmap: anclar el patrón del paso de lint del backend en la prueba de CA10.
