---
spec: 029-limite-galeria
verdict: changes_requested
round: 1
date: 2026-11-23
base: 567c0b9
head: 2ad5b83
human_signoff: pending
---

# Review · 029 Límite de 15 imágenes en la galería

## Resumen
`changes_requested`. No hay bloqueantes: la implementación cumple los nueve criterios y los seis
controles del modelo de amenazas. Los tres hallazgos importantes son huecos de prueba: el reemplazo
de foto al editar (CA3), la autorización del `PUT` modificado (P8) y una verificación de P20 que
solo mira colores. El usuario decidió corregirlos junto con los seis menores baratos (T030–T037).
Los otros tres menores van al roadmap.
Revisores independientes: spec (A), constitución y calidad (C+D), seguridad (S) y accesibilidad.
Plan y alcance (B), en el agente principal. El plugin `design` de Anthropic no está en esta sesión:
la accesibilidad se revisó con la lista propia de la skill.
Conteo: bloqueante 0 · importante 3 · menor 9

## Verificación automática
| Comando | Resultado |
|---|---|
| `npm test` | ✅ backend 35 suites, 419 pasan y 5 `todo`; frontend 28 archivos y 243 pruebas (línea base: 389 y 228, sin fallos) |
| Tests nuevos de UI (`galeria-limite`, `encabezado-modulo`) dos veces | ✅ 15/15 en las dos corridas |
| `npm run lint --prefix backend` | ✅ 1 error previo (`faqs.service.js`), ninguno en lo tocado |
| `npm run lint --prefix frontend` | ✅ 12 problemas previos (7 errores), ninguno en lo tocado |
| `npm run build --prefix frontend` | ✅ |
| `aidd.py validate docs/specs/029-limite-galeria` | ✅ 0 errores |

## Criterios de aceptación
| CA | Test | Estado | Nota |
|---|---|---|---|
| CA1 | `backend/tests/galeria/limite-galeria.test.js::CA1`, `rutas-galeria.test.js::CA1` | ✅ | |
| CA2 | `limite-galeria.test.js::CA2`, `limite-galeria-concurrencia.test.js::CA2`, `frontend/tests/galeria-limite.test.jsx::409` | ✅ | |
| CA3 | `limite-galeria.test.js::CA3`, `rutas-galeria.test.js::A17` | ⚠ | Falta el reemplazo de foto con archivo y el cambio de visibilidad con 15 (R1); las aserciones del test de servicio son débiles (R5) |
| CA4 | `limite-galeria.test.js::CA4`, `galeria-limite.test.jsx::agregar y eliminar` | ✅ | `toBeDefined()` débil (R5) |
| CA5 | `galeria-limite.test.jsx::CA5` (3 casos) | ✅ | Verificación manual del usuario (T023) |
| CA6 | `galeria-limite.test.jsx::CA6`, `encabezado-modulo.test.jsx` | ✅ | Verificación manual con el Narrador (T023) |
| CA7 | `limite-galeria-concurrencia.test.js::TM1` + verificación con MySQL real (T021) | ✅ | El test de servicio con un repositorio que serializa solo prueba el 409 (R4) |
| CA8 | `rutas-galeria.test.js::CA8` (los dos roles) | ✅ | |
| CA9 | `galeria-limite.test.jsx::CA9`, `galeria-estados.test.jsx` | ✅ | |

## Conformidad con el plan
- Cambios fuera del plan: ninguno (`scope.md`: 0 archivos sin tarea).
- Partes del plan sin implementar: ninguna. T001 solo tocó documentos (`docs/design/system.md` y
  `system.html`), por eso no aparece en el diff de código.

## Constitution Check (sobre el código)
| Principio | Resultado | Evidencia |
|---|---|---|
| P1 | ✅ | spec, plan y tareas aprobados; análisis `pass` (ronda 3) |
| P2 | ✅ | cada CA con test; R1, R4 y R5 son huecos de calidad, no criterios sin test |
| P3 | ➖ | `deps.stat` vacío |
| P4 | ✅ | estructura de módulo intacta |
| P5, P6 | ✅ | rollback sin migración (ver Preparación) |
| P7 | ➖ | sin cambios de esquema |
| P8 | ⚠ | `POST` probado por rol; el `PUT` modificado sin test de 401/403 (R2) |
| P9 | ✅ | `limite-galeria-concurrencia.test.js::P9` |
| P10 | ✅ | sin secretos en el diff; gitleaks corre en el CI del PR |
| P11 | ✅ | `npm audit`: 0 altas y 0 críticas |
| P12 | ✅ | TM1–TM6 con control y test |
| P13 | ❌ aceptado | excepción del usuario (2026-11-11, extendida el 2026-11-23) |
| P14, P15 | ✅ | `rutas-galeria.test.js::P14 y P15` |
| P16 | ✅ | test de roles y contraste; verificación manual del usuario |
| P17 | ✅ | el límite vive en `images.service`; el panel solo lo refleja |
| P18, P19 | ➖ | sin rutas indexables nuevas |
| P20 | ⚠ | reglas nuevas solo con tokens, pero el test no detecta espaciados ni radios literales (R3) |

## Seguridad
| Herramienta | Resultado |
|---|---|
| Secretos (gitleaks, `en-ci`) | no instalado en el equipo: se ejecuta en el CI del PR |
| SAST | ➖ `no-aplica` (decisión del usuario, `docs/security.md`) |
| SCA (`npm audit --audit-level=high`) | crít: 0 · alta: 0 · media: 20 previas en el backend; frontend 0. Una corrida dio código 1 por un fallo pasajero; repetida dos veces, 0 |
| Contenedores (trivy, `en-ci`) | no instalado en el equipo: se ejecuta en el CI del PR; el diff no toca imágenes |

| Tema OWASP | Resultado | Evidencia |
|---|---|---|
| A01:2025 Control de acceso (TM5, TM6) | ✅ | rutas con `verifyToken` + `authorizeRoles` antes de multer; `imagen` solo de `req.file` en alta y edición |
| A05:2025 Inyección | ✅ | `GET_LOCK(?, ?)`, `RELEASE_LOCK(?)` e `INSERT` parametrizados; test P9 |
| A06:2025 Diseño inseguro (TM1, TM2, TM3) | ✅ | bloqueo con nombre, límite en el servicio, borrado del archivo subido en los rechazos |
| A09:2025 Registro | ⚠ | el `catch` del `RELEASE_LOCK` no deja log (R8) |
| A10:2025 Condiciones excepcionales (TM4) | ✅ | `finally` con `RELEASE_LOCK`, `destroy()` si falla, 503 sin detalles |
| A03:2025 Cadena de suministro | ✅ | sin dependencias nuevas |
| Proceso: rutas protegidas e instrucciones a agentes | ✅ | ninguna ruta protegida tocada; sin instrucciones sospechosas |

## Observabilidad
- Eventos de auditoría de la spec emitidos y probados: no hay (excepción P13 aceptada).
- Datos sensibles en logs del código tocado: ninguno (`rutas-galeria.test.js` comprueba título y archivo).
- `request_id` presente en los logs nuevos: no hay logs nuevos; la línea «Petición atendida» del 409
  lleva el mismo `request_id` que la respuesta.

## Hallazgos
| ID | Severidad | Archivo:línea | Hallazgo | Sugerencia |
|---|---|---|---|---|
| R1 | importante | `backend/src/modules/images/images.controller.js:32` | El `PUT` con archivo (reemplazar foto, CA3) cambió y ningún test lo prueba; tampoco el cambio de visibilidad con 15 | Test HTTP: `PUT` con archivo e `imagen` ajena con 15 → guarda la ruta subida, borra la foto anterior y no la ajena, sin `crearImagenConLimite`; `PUT` solo de `visible` |
| R2 | importante | `backend/tests/galeria/rutas-galeria.test.js` | P8: el `PUT /imagenes/:id` modificado no tiene tests de 401 y 403 | Sin token → 401 y Paciente → 403, sin llamar a `repo.updateImagen` |
| R3 | importante | `frontend/tests/galeria-limite.test.jsx` (P20) | La verificación de P20 solo detecta colores literales, no espaciados, radios, sombras ni duraciones | Detectar también `px`, `rem`, `em`, `ms` y `s` literales, salvo `0` y el `1px` del borde, con control positivo |
| R4 | menor | `backend/tests/galeria/limite-galeria-concurrencia.test.js:26` | El test «CA7» de servicio usa un repositorio que serializa: solo prueba la conversión a 409 | Renombrarlo por lo que prueba; CA7 lo cubren TM1 y la verificación con MySQL real |
| R5 | menor | `backend/tests/galeria/limite-galeria.test.js:132,151` | CA3 tiene aserciones triviales y CA4 usa `toBeDefined()` | CA3: el valor devuelto y que no lanza; CA4: `toBe(114)` |
| R6 | menor | `backend/src/modules/images/images.repository.js:35` | `createImagen` (INSERT sin límite) ya no se usa: código muerto que permitiría saltarse el máximo | Eliminarlo, también de los mocks de los tests |
| R7 | menor | `backend/src/modules/images/images.repository.js:70` | El nombre del bloqueo es global a la instancia de MySQL: dos bases en la misma instancia se bloquearían entre sí | → roadmap (producción tiene una sola base por instancia) |
| R8 | menor | `backend/src/modules/images/images.repository.js:106` | Si `RELEASE_LOCK` falla, el `catch` no deja log (A09) | `logger.warn` con solo el `code` del error |
| R9 | menor | `backend/src/modules/images/images.service.js:56` | Un `PUT` con archivo nuevo que falla (404, 400 o error del repositorio) deja la foto en disco (previo a la spec) | → roadmap: ficha `/fix` aparte |
| R10 | menor | `backend/tests/galeria/limite-galeria-concurrencia.test.js` | No se prueba el `INSERT` y el `RELEASE_LOCK` fallando juntos, y el caso del `INSERT` no comprueba que no hay `destroy()` | Caso combinado: error del `INSERT`, `destroy()` una vez y sin `release()`; en el otro, `destroy` sin llamar |
| R11 | menor | `frontend/src/styles/adminpanel.css:144` | El `:hover` oscurece el botón con `aria-disabled` como si se pudiera usar | Limitar el `:hover` a botones disponibles |
| R12 | menor | `frontend/src/styles/adminpanel.css:132` | El objetivo de toque no se midió en navegador (44px según el CSS) | → roadmap; lo cubre la verificación manual del usuario |

## Preparación para release
- Rollback factible: sí. Sin migración; se revierte el código y se reconstruyen backend y frontend.
- Migraciones compatibles con la versión anterior: no hay migraciones.
- Feature flags: el plan no pide ninguno.
- Docs actualizadas: `docs/architecture.md` (T090); `docs/deployment.md` sin cambios (T091).
- Cobertura de riesgos: RS5, OB1, DS1, DS2 y DS10 fuera de alcance, sin cambios de estado. Correcto.

## Tareas añadidas
- T030 ← R1, R2
- T031 ← R4, R5, R10
- T032 ← R3
- T033 ← R6
- T034, T035 ← R8
- T036, T037 ← R11

## Aceptados sin tarea
Aceptados por el usuario el 2026-11-23:
- **R7** → roadmap: el bloqueo `dentissa_galeria_alta` es global a la instancia de MySQL; si un día se comparte la instancia entre bases, incluir la base en el nombre.
- **R9** → roadmap: un `PUT /imagenes/:id` con archivo nuevo que falla deja la foto en disco (defecto previo a la 029); ficha `/fix`.
- **R12** → roadmap: medir en navegador el objetivo de toque del botón del encabezado a 390 px.
