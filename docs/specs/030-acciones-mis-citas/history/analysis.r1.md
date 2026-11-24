---
result: fail
round: 1
mode: full
constitution_version: 1.0.0
date: 2026-11-23
spec_sha: c2ef47fa9c06
plan_sha: 44dba40c20dc
tasks_sha: 66c37bbc7a77
---

# Análisis · 030 Reprogramar y cancelar desde «Mis citas»

## Resumen
No pasa. Hay cuatro hallazgos altos, todos del Constitution Check:
- la excepción P13 citada no cubre las citas del paciente;
- falta probar por rol las rutas de paciente;
- la verificación de P20 no es un test;
- el foco al cerrar no tiene un destino con foco visible.
Las decisiones del usuario resuelven además el momento en que una cita deja de ser modificable y el
bloqueo de las pendientes pasadas en el servidor.
Conteo: CRÍTICA 0 · ALTA 4 · MEDIA 4 · BAJA 9

## Cobertura
| Métrica | Valor |
|---|---|
| Criterios con tarea de test e implementación | 9 / 9 |
| Amenazas con control y test | 3 / 3 (TM2 parcial: A8) |
| Principios de la constitución evaluados | 20 / 20 |

## Seguimiento de rondas anteriores
Primera ronda.

## Hallazgos nuevos
| ID | Categoría | Severidad | Ubicación | Hallazgo | Corrección |
|---|---|---|---|---|---|
| A1 | Constitución (P13) | ALTA | plan P13; spec Auditoría y Decisiones | La excepción P13 de la 021 solo cubre cambios de rol y acciones administrativas; reprogramar y cancelar citas del paciente quedan fuera | Decisión del usuario: se extiende la excepción → `/specify --edit`, `/plan --fix` |
| A2 | Constitución (P8) | ALTA | plan P8; T010 | Las rutas de paciente no tienen `authorizeRoles` y el plan solo prueba 401 | Decisión del usuario: se mantiene; T010 prueba que Administrador y Asistente solo ven y cambian sus propias citas → `/plan --fix`, `/tasks --fix` |
| A3 | Constitución (P20) | ALTA | plan P20; T021 | La verificación de P20 no es un test; `ModalAccionCita` heredaría `ancho={500}` | El componente nuevo no lleva valores visuales literales (test que lo lea); el ancho lo pasa cada pantalla como hoy → `/plan --fix`, `/tasks --fix` |
| A4 | Constitución (P16) | ALTA | design Accesibilidad; T022 | El foco iría al título de la tarjeta, que no tiene estilo de foco | El foco va siempre a un control con foco visible del sistema; test → `design --fix`, `/tasks --fix` |
| A5 | Ambigüedad | MEDIA | design; T021, T022 | No se define cuándo vuelve el foco con el aviso de éxito de por medio, ni dónde vive esa lógica | Secuencia fijada en la pantalla, sin tocar el componente compartido; test → `/tasks --fix` |
| A6 | Inconsistencia | MEDIA | plan; spec CA1, CA2 | `modificable` usaba el fin de la cita; la spec dice «aún no pasan» | Decisión del usuario: hasta que empieza; tests de límite → `/specify --edit`, `/plan --fix`, `/tasks --fix` |
| A7 | Cobertura | MEDIA | T010, T020 | `fecha_agendada` llega como `Date` del driver; un test con texto pasaría sin detectar el fallo | T010 simula `Date` → `/tasks --fix` |
| A8 | Seguridad | MEDIA | plan TM2 | La API deja reprogramar y cancelar una pendiente pasada | Decisión del usuario: se bloquea en el servidor → `/specify --edit`, `/plan --fix`, `/tasks --fix` |
| A9 | Inconsistencia | BAJA | plan P1 | «`design.md` por aprobar» | Actualizar |
| A10 | Inconsistencia | BAJA | spec K1; design | Los botones en «Mis citas» reparten el ancho; en Inicio no | K1 refleja el ancho repartido |
| A11 | Inconsistencia | BAJA | plan Contratos | `id_servicio` y `modificable` en snake_case, contra la convención camelCase | Decisión: se sigue la convención del endpoint |
| A12 | Cobertura | BAJA | T011 | Falta que Inicio vuelva a pedir la próxima cita al montarse | Añadirlo a T011 |
| A13 | Cobertura | BAJA | T012 | Casos negativos sin comprobar rompiendo; CA6 sin afirmar el id | Añadirlo a T012 |
| A14 | Duplicación | BAJA | T011, T012 | Textos duplicados entre pantallas | Los tests comprueban los mismos textos literales |
| A15 | Inconsistencia | BAJA | spec Seguridad | La clasificación de citas en `security.md` es «confidencial» | Alinear la redacción |
| A16 | Inconsistencia | BAJA | plan P11 | «0 altas» sin citar la excepción GHSA-fc5q | Citar el comando y la excepción |
| A17 | Inconsistencia | BAJA | spec 005 | Nadie actualiza la 005 inferida | T090 lo incluye |

## Decisiones pendientes del usuario
Respondidas por el usuario el 2026-11-23:
- **A1:** la excepción P13 se extiende a las acciones del paciente sobre sus citas, hasta el objetivo 3.
- **A2:** se mantiene que las rutas de paciente sirvan a cualquier cuenta con perfil, cada una solo
  sobre sus citas; se prueba.
- **A6:** las acciones se ofrecen hasta que la cita **empieza**.
- **A8:** el servidor bloquea reprogramar y cancelar las pendientes pasadas. Supuesto, para no
  cambiar Inicio (CA7): «pasada» en el servidor es la cita que ya **terminó**, porque la tarjeta
  «Próxima cita» sigue mostrando la cita en curso.

## Aceptados
Ninguno se acepta sin corregir: los 17 van a `/specify --edit`, `/plan 030 --fix` y `/tasks 030 --fix`.
Después, `/analyze 030` en modo delta.
