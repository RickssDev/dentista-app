---
updated: 2026-11-08
---

# Roadmap

**Etapa actual:** production

## Objetivos
| # | Objetivo | Criterio de éxito | Spec | Estado |
|---|---|---|---|---|
| 1 | Tests y CI | Framework de tests adoptado con ADR; autenticación, citas, perfil del paciente y portada cubiertos en verde; CI ejecuta validación, lint, build y tests en cada PR. Riesgos: RD8.a, RD8.b, RD8.c | [018](specs/018-base-tests-autenticacion/spec.md), 019 y 020 (previstas) | en curso |
| 2 | Permisos del Asistente | Un Asistente recibe 403 en toda ruta de `/usuarios` y nadie puede asignar un rol sin ser Administrador, con tests por rol. Riesgos: RS1.a, RS1.b, RS1.c, RS1.d | — | pendiente |
| 3 | Auditoría y logs | Todo evento obligatorio de `docs/observability.md` queda en la tabla de solo anexado; cada petición devuelve `X-Request-Id`; ningún log contiene datos personales. Riesgos: OB1.a, OB1.b, OB1.c, OB1.d, OB1.e, OB1.f, OB2.a, OB2.b, OB2.c, OB3.a, OB3.b | — | pendiente |

## Próxima etapa
El proyecto ya está en producción. Pasar a una operación estable requiere cerrar los tres objetivos
y las dependencias vulnerables (RS3), que bloquean `/release`.

## Pendientes y deuda
Detectados por `/init` y aún sin objetivo; el usuario decide cuáles promover.

**Datos y operación** (propuesto y no elegido como objetivo, 2026-11-08)
- RD1 Esquema sin versionar: RD1.a, RD1.b, RD1.c
- RD2 Respaldos manuales: RD2.a, RD2.b, RD2.c
- RS4 Limitadores detrás de varios proxies: RS4.a, RS4.b, RS4.c
- RD3 Rollback: RD3.a, RD3.b · RD4 Staging: RD4.a · RD5 Health check: RD5.a · RD6 Cron: RD6.a · RD7 Variables: RD7.a

**Seguridad**
- RS3 Dependencias vulnerables: RS3.a, RS3.b (bloquea `/release`)
- RS2 Sesión: RS2.a, RS2.b · RS5 Subidas: RS5.a, RS5.b · RS6 Cabeceras: RS6.a, RS6.b
- RS7 Límite general: RS7.a · RS8 Enumeración: RS8.a · RS9 Guarda con rol: RS9.a

**Observabilidad**
- OB4 Logger: OB4.a, OB4.b · OB5 Alertas: OB5.a, OB5.b · OB6 Avisos apagados: OB6.a

**SEO**
- SE1 Renderizado (alta): SE1.a, SE1.b
- SE2 a SE4 Sitio indexable: SE2.a, SE2.b, SE3.a, SE3.b, SE4.a
- SE5 Open Graph: SE5.a, SE5.b · SE6 Datos estructurados: SE6.a · SE7 Íconos: SE7.a

**Diseño**
- Deuda DS1 a DS12 en `docs/design/system.md`; prioritarias: DS1 (dos rosas de marca) y DS4 (contraste del botón principal).

**Funcional, por confirmar con el usuario**
- Teléfono y dirección de `frontend/src/data/site.js` parecen de ejemplo (spec 017).

**Calidad**
- 15 problemas de lint previos en el frontend y 5 errores previos en el backend.
- Lint de estilos que exige el principio P20 de la constitución.
- Aprobar `docs/constitution.md`, que sigue en `draft`.
- Limpiar la duplicación de `backend/src/middlewares/errorHandler.js`.
