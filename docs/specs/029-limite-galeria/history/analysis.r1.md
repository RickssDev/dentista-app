---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-23
spec_sha: 7390108d98ec
plan_sha: a1e3ce64e848
tasks_sha: 4b9baf3bee18
---

# Análisis · 029 Límite de 15 imágenes en la galería

## Resumen
No pasa. El borrado de la foto en los rechazos (TM3) usa `data.imagen`, que llega del cuerpo de la
petición cuando no hay archivo subido: permitiría borrar cualquier archivo de `uploads/` (A1,
crítica). Además: el cuerpo del 503 está mal descrito, el `finally` del bloqueo puede borrar la foto
de un alta ya guardada, el contador copiaría un color literal (P20), DS10 se marca parcial sin serlo
y la decisión de auditoría cita una fuente que dice lo contrario.
Conteo: CRÍTICA 1 · ALTA 5 · MEDIA 4 · BAJA 6

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 9 |
| Amenazas con control y test | 5 / 5 (control de TM3 defectuoso: A1; falta una amenaza nueva) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Seguridad | CRÍTICA | plan.md «Cambios por módulo» (`images.service.js`), «Contratos y datos», TM3; tasks.md T010, T021 | `data.imagen` es `req.body.imagen`. El controller solo lo sobrescribe con `req.file` (`images.controller.js:16-18`), así que un alta sin archivo con `imagen=/uploads/<ajeno>` y la galería llena (409) o sin título (400) borraría un archivo ajeno de `uploads/`. Esta entrada no está en el modelo de amenazas, y la spec 021 ya fijó «imagen solo del archivo subido» | Solo se borra el archivo que escribió multer en esa misma petición, y el alta toma `imagen` solo del archivo subido; nueva TM6 (Tampering, A01:2025). Tests: en `rutas-galeria.test.js`, un POST sin archivo con `imagen:'/uploads/ajeno.jpg'`, con 15 imágenes y también sin título, no llama a `borrarArchivo` con esa ruta y el repositorio no recibe `imagen` del cuerpo; el equivalente en `limite-galeria.test.js` → `/plan --fix`, `/tasks --fix` |
| A2 | Inconsistencia | ALTA | plan.md «Contratos y datos»; tasks.md T012 | `AppError(…, 503)` produce `status: "error"`, y el errorHandler añade `success: false` a todo. El cuerpo prometido (`status: "fail"` sin `success`) no es el real | El contrato refleja el cuerpo real: 409 `{ success: false, status: "fail", message }` y 503 `{ success: false, status: "error", message }`, sin tocar `AppError` ni el errorHandler. Test: T012 con `toEqual` de cada cuerpo → `/plan --fix`, `/tasks --fix` |
| A3 | Inconsistencia técnica | ALTA | plan.md Enfoque, Riesgos; tasks.md T011, T020 | Si `RELEASE_LOCK` lanza tras un `INSERT` ya guardado, el servicio borra la foto de una fila existente y el `release()` no corre. Tampoco se trata `GET_LOCK` = `NULL` | Un fallo al soltar el bloqueo tras un `INSERT` correcto no convierte el alta en error ni borra el archivo; la conexión se libera siempre; `NULL` cuenta como «sin bloqueo». Tests en `limite-galeria-concurrencia.test.js`: `RELEASE_LOCK` lanza tras `INSERT` → `creada: true` y `release()` llamado; `GET_LOCK` `NULL` → `{ bloqueo: false }` sin `COUNT` → `/plan --fix`, `/tasks --fix` |
| A4 | Constitución (P20) | ALTA | plan.md `adminpanel.css`; design.md Resultado; tasks.md T013, T022 | «`.encabezado-detalle` igual que `.encabezado-descripcion`» copia el literal `#5b6472` (`adminpanel.css:125`): viola P20 y hace fallar el test de T013. Ese test, además, pasaría en vacío si la regla no existe | La regla del contador no tiene literales de color (token del sistema). T013 exige primero que cada selector nuevo exista y después que no tenga literales, con control positivo → `/plan --fix`, `/tasks --fix` |
| A5 | Cobertura de riesgos | ALTA | plan.md Impacto y Riesgos; design.md «Cambios a incorporar»; tasks.md T001 | DS10 es «trampa de foco del modal y `:disabled` de `.dt-btn`». El `aria-disabled` de `EncabezadoModulo` no es ninguna de esas dos correcciones: no puede marcarse como avance de DS10 | DS10 sigue «pendiente»; el cambio de `EncabezadoModulo` se registra en `system.md` como mejora propia. Se comprueba en `/review` → `/plan --fix`, `/tasks --fix` (y el texto de `design.md`) |
| A6 | Constitución (decisiones) | ALTA | spec.md Decisiones (fila `implícita` de auditoría); plan.md P13 | `docs/observability.md` exige registrar las «Acciones administrativas». La base real para no auditar es la excepción P13 del usuario (2026-11-11, objetivo 3), no «no aplica» | La fila de la spec cita la excepción P13 del usuario como fuente; en el plan, P13 figura como excepción vigente con destino en el objetivo 3 (specs 027 y 028). Se comprueba en `/review` → `/specify --edit` (solo Decisiones), `/plan --fix` |
| A7 | Cobertura de riesgos | MEDIA | plan.md Riesgos | El plan toca el flujo de subida y no cita RS5 («Subida de archivos confía en el cliente», RS5.a y RS5.b pendientes) | Citar RS5 con RS5.a y RS5.b fuera de alcance, con motivo y destino → `/plan --fix` |
| A8 | Constitución (P20) | MEDIA | plan.md P20 | `/admin/galeria` y `EncabezadoModulo` conservan literales previos (DS1, DS2). P20 prohíbe literales en pantallas «modificadas», así que su alcance es ambiguo | Decisión del usuario sobre el alcance de P20 en esta spec → `/plan --fix` |
| A9 | Cobertura | MEDIA | plan.md Contratos; tasks.md T010, T012 | El repositorio nuevo devuelve `{ creada, id }` y nada exige que el 201 conserve su `payload` de hoy (el id) | El 201 conserva el `payload`. Test: en `rutas-galeria.test.js`, con 14 → 201 y el mismo `payload`; T010 afirma el valor devuelto → `/tasks --fix` |
| A10 | Inconsistencia | MEDIA | plan.md Decisiones; tasks.md T010 | Borrar la foto en los 400 de hoy cambia el comportamiento sin un CA ni una Decisión en la spec | Decisión del usuario, registrada en la spec → `/specify --edit` (Decisiones) |
| A11 | Ambigüedad | BAJA | tasks.md T011 | `origen` es un pool falso con `getConnection()`, no una conexión | Redactarlo así |
| A12 | Inconsistencia | BAJA | plan.md Cambios, Riesgos | `EncabezadoModulo` está en 14 páginas en total: 13 además de la galería, 3 de ellas del portal del paciente | Corregir la cifra |
| A13 | Cobertura (P14, P15) | BAJA | tasks.md T012 | El test de logs es casi vacío y P14 pide el `request_id` también en los logs | Título distintivo; la línea «Petición atendida» con `status` 409 y el `request_id` de la cabecera; el título no aparece en ninguna línea |
| A14 | Inconsistencia | BAJA | plan.md Cambios, Estrategia | Pedir otra vez `/imagenes` tras un 409 solo aparece en Riesgos y en las tareas | Alinear el plan con T013 y T023 |
| A15 | Seguridad (DoS) | BAJA | plan.md TM4 | Cada alta en espera retiene una conexión del pool hasta 5 s | Riesgo residual aceptado en TM4 |
| A16 | Ambigüedad | BAJA | spec.md CA5; `Admingaleria.jsx` | Si `GET /imagenes` falla, el panel muestra «0 de 15» con el botón activo | Decisión del usuario sobre qué muestra el contador si la carga falla; test con `api` rechazado |

## Decisiones pendientes del usuario
Respondidas por el usuario el 2026-11-23:
- **A8:** P20 se aplica solo a las reglas nuevas; los literales previos siguen como DS1 y DS2 en el
  roadmap.
- **A10:** la foto se borra en todo rechazo del alta (galería llena, bloqueo ocupado y 400 por
  campos faltantes).
- **A16:** si la lista no carga, no se muestran el contador ni el aviso, y el botón queda como hoy.

## Aceptados
Ninguno se acepta sin corregir: los 16 van a `/specify --edit` (A6, A10, A16), `/plan 029 --fix` (A1–A9,
A12, A14, A15) y `/tasks 029 --fix` (A1–A5, A9, A11, A13, A16). Después, `/analyze 029` en modo delta.
