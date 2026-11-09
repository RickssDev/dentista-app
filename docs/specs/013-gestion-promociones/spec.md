---
id: 013
slug: gestion-promociones
status: inferred
confidence: media
created: 2026-11-08
extends: []
---

# 013 · Promociones

## Problema
La clínica publica ofertas por tiempo limitado sobre sus servicios.

## Historias de usuario
- Como personal, quiero crear promociones ligadas a un servicio y con vigencia.
- Como visitante, quiero ver las promociones vigentes.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada un alta sin servicio, nombre, descripción o fechas, entonces responde 400.
- [ ] CA2 · Dado un estado distinto de `activo` o `inactivo`, cuando se edita, entonces responde 400.
- [ ] CA3 · Dada una imagen nueva, entonces la anterior se borra del disco.
- [ ] CA4 · Dado un visitante, cuando consulta `/promociones/publicos`, entonces obtiene las promociones según la fecha actual de México.
- [ ] CA5 · (abuso) Solo Administrador y Asistente escriben o consultan el listado completo.

## Fuera de alcance
- Aplicar descuentos a las citas.

## Seguridad y privacidad
- Datos sensibles involucrados: No aplica: contenido público.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/promocion/*`, `frontend/src/pages/admin/AdminPromociones.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- No se valida que la fecha de inicio sea anterior a la de fin.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
