---
spec: 018-base-tests-autenticacion
verdict: changes_requested
round: 1
date: 2026-11-09
base: e3d311c
head: 4f3ae1b
human_signoff: pending
---

# Review · 018 Base de tests, integración continua y autenticación

## Resumen
Se piden cambios: 018 CA3 y 001 CA6 no se cumplen del todo, y varias pruebas seguirían pasando con lo protegido roto, comprobado ejecutando esas roturas. El código de producción no cambió. Todas las correcciones son de pruebas o de documentos.
Conteo: bloqueante 2 · importante 9 · menor 10

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` (dos veces) | ✅ 54 pruebas y 5 pendientes en backend, 5 en frontend; sin fallos |
| `npm run lint --prefix backend` | ✅ Solo los 5 errores previos; ninguno en archivos nuevos |
| `npm run lint --prefix frontend` | ✅ Solo los 15 problemas previos |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate` | ✅ 0 errores |

Sin revisor de accesibilidad ni de SEO: el diff no toca vistas, rutas ni metadatos.

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `npm test`; PR #64 | ✅ | |
| CA2 | `backend/tests/auth/*`, `frontend/tests/login-redireccion.test.jsx` | ⚠ | R2, R4, R5, R6, R7 |
| CA3 | `test.todo` en `backend/tests/auth/*` | ❌ | R1 |
| CA4 | `git diff e3d311c` sin cambios | ✅ | `minimatch` aceptado por el usuario (T027) |
| CA5 | `tasks.md` T028 | ⚠ | R3 |
| CA6 | `seguridad/guard.test.js` | ✅ | |
| CA7 | `seguridad/red.test.js` | ⚠ | R8 |
| CA8 | `seguridad/fixtures.test.js`, gitleaks en CI | ✅ | |
| CA9 | `seguridad/cadena-suministro.test.js`; PR #64 y #65 | ⚠ | R9 |
| CA10 | `seguridad/cadena-suministro.test.js`; PR #64 | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: `frontend/tests/red.test.js`, justificado por A21 (nota de T015).
- Partes del plan sin implementar: ninguna. T027 a T030 no aparecen en `code.diff` porque solo comprueban o cambian documentos.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1 | ✅ | Spec, plan y análisis vigentes |
| P2 | ✅ | `npm test` en el job "Lint y build" |
| P3 | ✅ | ADR 0004; `cadena-suministro.test.js`, ver R12 |
| P4 | ➖ | No contradice la arquitectura |
| P5 | ✅ | Sin cambios en el despliegue |
| P6 | ✅ | Rollout del plan |
| P7, P8, P9 | ➖ | Sin cambios de esquema, endpoints ni producción |
| P10 | ✅ | `fixtures.test.js`, gitleaks en CI |
| P11 | ⚠ | Vulnerabilidades previas pendientes del `/chore`; ver R10 y R11 |
| P12 | ✅ | TM1 a TM5 con control |
| P13 a P20 | ➖ | Sin cambios de flujos, interfaz ni rutas |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks) | ✅ Sin hallazgos en CI hasta `69b495f`; los 2 commits siguientes solo tocan `docs/` |
| SAST | ➖ `no-aplica` por decisión del usuario |
| SCA (npm audit) | backend crít: 1 · alta: 9 · media: 21; frontend alta: 10 · media: 2. Todas las críticas y altas son previas; se atienden con `/chore` |
| Contenedores (trivy) | ⚠ No ejecutado: R11 |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ➖ | Sin cambios en producción |
| A02:2025 Configuración | ✅ | TM1 a TM3; `Dockerfile.prod` con `--omit=dev`; ver R8 |
| A03:2025 Cadena de suministro | ✅ | Entradas nuevas `dev` del registro oficial; ver R15 |
| A04:2025 Criptografía | ➖ | Sin cambios en producción |
| A05:2025 Inyección | ✅ | `test-all.mjs` con argumentos constantes; `BASE_REF` por `env` |
| A06:2025 Diseño inseguro | ✅ | Modelo de amenazas con control y test |
| A07:2025 Autenticación | ➖ | Sin cambios; defectos previos como pendientes |
| A08:2025 Integridad y CI | ✅ | `contents: read`, sin `pull_request_target` ni secretos; acciones fijadas por SHA |
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
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | bloqueante | `backend/package.json` | 018 CA3: `npm test` muestra "5 todo" sin los nombres de los pendientes, verificado en su salida. | La salida muestra cada pendiente por nombre; una prueba lo exige. |
| R2 | bloqueante | `backend/src/modules/auth/auth.service.js:332` | 001 CA6 marcado como cubierto, pero una cuenta solo de Google responde 400 con mensaje propio. | Acotar CA6 a cuentas con contraseña y caracterizar la respuesta (decisión del usuario, 2026-11-09). |
| R3 | importante | `backend/src/modules/auth/auth.service.js:339` | Login sin contraseña en el cuerpo responde 500, verificado. Defecto nuevo sin registrar (CA5). | `test.todo` y línea en el roadmap. |
| R4 | importante | `backend/tests/auth/registro-login.test.js:89` | El límite de 72 bytes pasa con `.length` en lugar de bytes (rotura ejecutada). Sin bordes aceptados. | Probar contraseña multibyte y los bordes de 72 bytes y 8 caracteres. |
| R5 | importante | `backend/tests/auth/contrasenas.test.js:147` | 003 CA6: sin aserción sobre un token inexistente; quitar `r.token_hash = ?` no se detecta (rotura ejecutada). | Exigir 400 y la condición en el texto del SQL. |
| R6 | importante | `backend/tests/support/fake-db.js:43` | Sin `WHERE usuarios.correo = ?` las pruebas pasan (rotura ejecutada). | El patrón del doble exige la consulta completa. |
| R7 | importante | `backend/tests/support/fake-db.js:103` | Sin `connection.commit()` las pruebas pasan (rotura ejecutada). | Registrar commit y rollback y comprobarlos. |
| R8 | importante | `backend/tests/seguridad/red.test.js:20` | Sin el parche de sockets la prueba pasa (rotura ejecutada). | Exigir el registro del intento por socket. |
| R9 | importante | `backend/tests/seguridad/cadena-suministro.test.js:58` | La prueba acepta un paso comentado, con `continue-on-error` o en otro job. | Exigir el paso activo y bloqueante en el job `calidad`. |
| R10 | importante | `.github/workflows/ai-dd.yml:96` | Ninguna prueba exige `npm audit --audit-level=high` en el workflow. | Añadir la aserción. |
| R11 | importante | `.github/workflows/ai-dd.yml` | Trivy no se ejecutó: no está instalado, Docker no corre y en CI solo corre en el job semanal. | Ejecutarlo antes de liberar (T095). |
| R12 | menor | `backend/tests/seguridad/cadena-suministro.test.js` | La lista de dependencias no exige un ADR por paquete. | Enlazar cada entrada con su ADR. |
| R13 | menor | `backend/tests/seguridad/cadena-suministro.test.js:51` | La prueba de permisos no detecta otros `write` ni `secrets[...]`. | Ampliar la comprobación. |
| R14 | menor | `plan.md` TM4 | La antigüedad de versiones es de proceso, no automática. | Indicarlo en el modelo de amenazas. |
| R15 | menor | `docs/adr/0004-herramientas-de-pruebas.md` | El ADR no registra el cambio de `minimatch`. | Anotarlo. |
| R16 | menor | `backend/tests/auth/registro-login.test.js:82` | `process.env = original` reemplaza el objeto y no usa `try/finally`. | Restaurar solo las claves tocadas. |
| R17 | menor | `backend/tests/auth/registro-login.test.js`, `frontend/tests/login-redireccion.test.jsx` | Una prueba del doble está en un archivo de autenticación; `toBeTruthy` es redundante con `findByText`. | Mover y simplificar. |
| R18 | menor | `backend/tests/auth/contrasenas.test.js:67,92` | 003 CA1 no compara cuenta inactiva; 003 CA3 no exige el aviso de Google. | Añadir esos casos. |
| R19 | menor | `frontend/tests/red.test.js:3` | Solo comprueba el doble de `fetch`. | Renombrar o registrar intentos. |
| R20 | menor | `backend/tests/seguridad/cadena-suministro.test.js` | Ninguna prueba exige el paso de gitleaks, del que depende CA8. | Añadir la aserción. |
| R21 | menor | `docs/roadmap.md` | El defecto de `axios` no tiene `test.todo`; lo halló el linter, no una prueba. | Añadirlo al corregirlo con `/fix`. |

Descartados tras verificarlos: el test de `.env` no es vacío (falla si `app.js` carga `dotenv`, rotura ejecutada), y leer `backend/.env` en la guarda contradice la decisión registrada en A4.

## Preparación para release
- Rollback factible: sí; revertir el commit de integración, sin datos ni esquema.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Docs actualizadas (architecture, deployment): sí; T090 y T091.
- Vulnerabilidades críticas o altas: siguen abiertas y bloquean `/release` hasta el `/chore` (decisión del usuario, 2026-11-09).
- Cobertura de riesgos: RD8.a, RD8.c y la parte de autenticación de RD8.b siguen en curso, sin ninguno declarado mitigado.

## Tareas añadidas
- T031, T032 ← R1
- T033 ← R2
- T034 ← R3
- T035 ← R4
- T036 ← R5
- T037 ← R6
- T038 ← R7
- T039 ← R8
- T040 ← R9
- T041 ← R10

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
