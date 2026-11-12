---
updated: 2026-11-12
---

# Roadmap

**Etapa actual:** production

## Objetivos
| # | Objetivo | Criterio de éxito | Spec | Estado |
|---|---|---|---|---|
| 1 | Tests y CI | Framework de tests adoptado con ADR; autenticación, citas, perfil del paciente y portada cubiertos en verde; CI ejecuta validación, lint, build y tests en cada PR. Riesgos: RD8.a, RD8.b, RD8.c | [018](specs/018-base-tests-autenticacion/spec.md), 019 y 020 (previstas) | en curso |
| 2 | Permisos del Asistente | Un Asistente recibe 403 en toda ruta de `/usuarios` y nadie puede asignar un rol sin ser Administrador, con tests por rol. Riesgos: RS1.a, RS1.b, RS1.c, RS1.d | ficha 2026-11-09-fix-permisos-asistente (v1.1.0), [021](specs/021-proteccion-cuentas-admin/spec.md) (v1.2.0) | cumplido |
| 3 | Auditoría y logs | Todo evento obligatorio de `docs/observability.md` queda en la tabla de solo anexado; cada petición devuelve `X-Request-Id`; ningún log contiene datos personales. Riesgos: OB1.a, OB1.b, OB1.c, OB1.d, OB1.e, OB1.f, OB2.a, OB2.b, OB2.c, OB3.a, OB3.b | — | pendiente |

## Próxima etapa
El proyecto ya está en producción. Pasar a una operación estable requiere cerrar los tres objetivos
y las correcciones pendientes de RS1.

## Pendientes y deuda
Detectados por `/init` y aún sin objetivo; el usuario decide cuáles promover.

**Datos y operación** (propuesto y no elegido como objetivo, 2026-11-08)
- RD1 Esquema sin versionar: RD1.a mitigada en v1.1.0; pendientes RD1.b, RD1.c
- RD2 Respaldos manuales: RD2.a con script liberado en v1.1.0, falta programarlo; pendientes RD2.b, RD2.c
- RS4 Limitadores detrás de varios proxies: RS4.a y RS4.b mitigadas en v1.1.0; pendiente RS4.c
- RD3 Rollback: RD3.a, RD3.b · RD4 Staging: RD4.a · RD5 Health check: RD5.a · RD6 Cron: RD6.a · RD7 Variables: RD7.a

**Seguridad**
- RS3 Dependencias vulnerables: mitigado en v1.1.0 (RS3.a, RS3.b)
- RS2 Sesión: RS2.a, RS2.b · RS5 Subidas: RS5.a, RS5.b · RS6 Cabeceras: RS6.a, RS6.b
- RS7 Límite general: RS7.a · RS8 Enumeración: RS8.a · RS9 Guarda con rol: RS9.a

**Observabilidad**
- OB4 Logger: OB4.a, OB4.b · OB5 Alertas: OB5.a, OB5.b · OB6 Avisos apagados: OB6.a mitigada en v1.1.0

**SEO**
- SE1 Renderizado (alta): SE1.a, SE1.b
- SE2 a SE4 Sitio indexable: SE2.a, SE2.b, SE3.a, SE3.b, SE4.a
- SE5 Open Graph: SE5.a, SE5.b · SE6 Datos estructurados: SE6.a · SE7 Íconos: SE7.a

**Diseño**
- Deuda DS1 a DS12 en `docs/design/system.md`; prioritarias: DS1 (dos rosas de marca) y DS4 (contraste del botón principal).

**Funcional, por confirmar con el usuario**
- Teléfono y dirección de `frontend/src/data/site.js` parecen de ejemplo (spec 017).

**Hallado al liberar v1.1.0**
- La API aún acepta citas fuera de horario si se llama directamente: resuelto en v1.1.1 (nadie agenda fuera de horario).
- Cambiar contraseña con valores que no son texto responde 500: resuelto en v1.1.1.
- Trivy (DS002): `backend/Dockerfile` (desarrollo) y `frontend/Dockerfile` corren como root.

**Hallado al liberar v1.1.1**
- `npm audit`: 2 vulnerabilidades moderadas en producción (`uuid` < 11.1.1 vía `exceljs`) y moderadas en Jest (solo desarrollo); sin altas ni críticas.
- El registro no normaliza el correo (sin `trim` ni minúsculas), a diferencia de la recuperación (ficha 2026-11-10-fix-registro-campos-no-texto).
- Una fecha de cita con formato ISO completo recibe el mensaje "fuera del horario de atención" en lugar de uno de formato (ficha 2026-11-11-fix-horario-cita-personal).
- `db.js` no usa `dateStrings`: las columnas `DATE` llegan como `Date`; revisar otros usos que comparen fechas como texto.

**Deuda de la spec 018** (aceptada en /review)
- 018/R11 Trivy se ejecutó al liberar v1.1.0 sin vulnerabilidades altas: resuelto.
- 018/R12 Enlazar cada dependencia de producción registrada con su ADR.
- 018/R13 Ampliar la prueba de permisos del workflow.
- 018/R14 Indicar que la antigüedad de versiones es control de proceso.
- 018/R15 Anotar `minimatch` en el ADR 0004.
- 018/R16 Restaurar solo las variables tocadas en la prueba de 001 CA3.
- 018/R17 Reubicar la prueba del doble y simplificar aserciones.
- 018/R18 Ampliar las pruebas de 003 CA1 y CA3.
- 018/R19 Precisar la prueba de red del frontend.
- 018/R20 Exigir el paso de gitleaks en el workflow.
- 018/R21 `axios` corregido en v1.1.0; su prueba existe: resuelto.
- 018/R22 Anclar el patrón del paso de lint del backend en la prueba de CA10.

**Deuda de la spec 021** (aceptada en /review, ronda 1)
- 021/R8 Carrera con tres peticiones simultáneas: releer la cuenta con `FOR UPDATE` dentro de la transacción.
- 021/R9 Mover `validarContrasena` a `src/utils/` y quitar la dependencia `users` → `auth.service`.
- 021/R10 Extraer la fábrica de mocks del repositorio de usuarios a `tests/support/`.
- 021/R11 Probar "sobre su propia cuenta" por HTTP con el JWT de la cuenta.
- 021/R12 La aserción de lista sin recargar al eliminar es de regresión.
- 021/R14 Foco de los modales: restaurarlo al cerrar y atraparlo dentro (previo).
- 021/R15 Escape cierra dos modales apilados (previo).
- 021/R16 Anuncio repetido del error, error asociado al campo y confirmación de eliminar abierta hasta la respuesta (previo).
- 021/R17 Documentar que `mensaje` de `ModalConfirmacion` debe ser texto.
- 021/R18 Extensiones de las subidas: ya en RS5.a/RS5.b.
- 021/R19 Test de integración del bloqueo contra una BD de pruebas.
- 021/R20 `aria-describedby` solo con mensaje no vacío.

**Calidad**
- 15 problemas de lint previos en el frontend y 4 errores previos en el backend.
- Lint de estilos que exige el principio P20 de la constitución.
- Aprobar `docs/constitution.md`, que sigue en `draft`.
- Limpiar la duplicación de `backend/src/middlewares/errorHandler.js`.
