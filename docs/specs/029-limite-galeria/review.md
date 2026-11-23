---
spec: 029-limite-galeria
verdict: approved
round: 2
date: 2026-11-23
base: 2ad5b83
head: d705c3c
human_signoff: RickssDev 2026-11-23 (revisó y fusionó el PR #96)
---

# Review · 029 Límite de 15 imágenes en la galería

## Resumen
`approved`. Las tareas T030–T037 corrigen los tres hallazgos importantes y los seis menores de la
ronda 1, y el diff desde entonces no introduce hallazgos nuevos. Ronda `--rerun` sin subagentes:
el diff de código desde `2ad5b83` ocupa 13 KB y se releyó desde cero.
Conteo (nuevos): bloqueante 0 · importante 0 · menor 0

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 35 suites, 425 pasan y 5 `todo`; frontend 28 archivos y 245 pruebas |
| Tests de UI tocados (`galeria-limite`, `encabezado-modulo`) dos veces | ✅ 17/17 en las dos corridas |
| `npm run lint --prefix backend` | ✅ 1 error previo (`faqs.service.js`) |
| `npm run lint --prefix frontend` | ✅ 12 problemas previos (7 errores) |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/029-limite-galeria` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `limite-galeria.test.js::CA1`, `rutas-galeria.test.js::CA1` | ✅ | |
| CA2 | `limite-galeria.test.js::CA2`, `limite-galeria-concurrencia.test.js::CA2`, `galeria-limite.test.jsx::409` | ✅ | |
| CA3 | `limite-galeria.test.js::CA3`, `rutas-galeria.test.js::A17` y `::R1, R2` (reemplazo de foto y visibilidad con 15) | ✅ | R1 y R5 resueltos |
| CA4 | `limite-galeria.test.js::CA4` (`toBe(114)`), `galeria-limite.test.jsx::agregar y eliminar` | ✅ | |
| CA5 | `galeria-limite.test.jsx::CA5` | ✅ | verificación manual del usuario (T023) |
| CA6 | `galeria-limite.test.jsx::CA6`, `::hover`, `encabezado-modulo.test.jsx` | ✅ | verificación manual con el Narrador (T023) |
| CA7 | `limite-galeria-concurrencia.test.js::TM1`, `::R10`, `::R8` + verificación con MySQL real (T021) | ✅ | el test de servicio ya dice lo que prueba (R4) |
| CA8 | `rutas-galeria.test.js::CA8` | ✅ | |
| CA9 | `galeria-limite.test.jsx::CA9`, `galeria-estados.test.jsx` | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (`scope.md`: 0 archivos sin tarea). En T035 se tocó también el
  test de T034, que estaba mal (anotado en la tarea).
- Partes del plan sin implementar: ninguna.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P8 | ✅ | `rutas-galeria.test.js`: 401 y 403 en `POST` y `PUT` (R2) |
| P15 | ✅ | el aviso de `RELEASE_LOCK` solo lleva `code`; test R8 sin título, ruta ni SQL |
| P20 | ✅ | reglas nuevas sin colores ni medidas literales; test con control positivo (R3) |
| Resto | sin cambios desde la ronda 1 | ver [ronda 1](history/review.r1.md) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks, `en-ci`) | se ejecuta en el CI del PR |
| SAST | ➖ `no-aplica` |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 (backend 20 moderadas previas; frontend 0) |
| Contenedores (trivy, `en-ci`) | se ejecuta en el CI del PR |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso | ✅ | `PUT` con tests de 401 y 403; `imagen` del cuerpo descartada en alta y edición |
| A09:2025 Registro | ✅ | `logger.warn` al fallar `RELEASE_LOCK` (R8) |
| A10:2025 Condiciones excepcionales | ✅ | `INSERT` y `RELEASE_LOCK` fallando a la vez: sube el error del `INSERT` y la conexión se cierra (R10) |
| A06:2025 Diseño inseguro | ✅ | sin `createImagen` sin límite en el repositorio (R6) |

## Observabilidad
- Eventos de auditoría de la spec: no hay (excepción P13 aceptada).
- Datos sensibles en logs del código tocado: ninguno; el aviso nuevo solo lleva `code`.
- `request_id` en los logs nuevos: el aviso se escribe dentro de la petición, con el contexto de la
  spec 026.

## Hallazgos
Seguimiento de la ronda 1:

| ID | Estado | Evidencia |
|---|---|---|
| R1 | resuelto | T030: `PUT` con archivo e `imagen` ajena con 15 guarda la subida, borra la anterior y no la ajena; `PUT` solo de `visible` |
| R2 | resuelto | T030: `PUT` sin token 401 y Paciente 403, sin `updateImagen` |
| R3 | resuelto | T032: detector de medidas con control positivo; comprobado con `padding: 12px` |
| R4 | resuelto | T031: test renombrado y comentado |
| R5 | resuelto | T031: CA3 afirma la imagen devuelta; CA4 `toBe(114)` |
| R6 | resuelto | T033: `createImagen` eliminado del repositorio y de los mocks |
| R7 | aceptado | → roadmap |
| R8 | resuelto | T034, T035 |
| R9 | aceptado | → roadmap |
| R10 | resuelto | T031 |
| R11 | resuelto | T036, T037 |
| R12 | aceptado | → roadmap |

Hallazgos nuevos: ninguno.

## Preparación para release
- Rollback factible: sí. Sin migración: se revierte el código y se reconstruyen backend y frontend.
- Migraciones: no hay.
- Feature flags: no aplica.
- Docs actualizadas: `docs/architecture.md` (T090); `docs/deployment.md` sin cambios (T091).
- Cobertura de riesgos: RS5, OB1, DS1, DS2 y DS10 fuera de alcance, sin cambios de estado.

## Tareas añadidas
Ninguna en esta ronda (las de la ronda 1, T030–T037, están hechas).

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-23 (ronda 1):
- **R7** → roadmap: el bloqueo `dentissa_galeria_alta` es global a la instancia de MySQL; si un día se comparte la instancia entre bases, incluir la base en el nombre.
- **R9** → roadmap: un `PUT /imagenes/:id` con archivo nuevo que falla deja la foto en disco (defecto previo a la 029); ficha `/fix`.
- **R12** → roadmap: medir en navegador el objetivo de toque del botón del encabezado a 390 px.
