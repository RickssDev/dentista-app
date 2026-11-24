---
id: 012
slug: gestion-servicios
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 012 · Catálogo de servicios

## Problema
La clínica publica sus tratamientos, y su duración determina los horarios de las citas. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como personal, quiero mantener el catálogo de servicios.
- Como visitante, quiero conocer los servicios de la clínica.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado un alta sin nombre, descripción o duración, entonces responde 400.
- [ ] CA2 · Dado un nombre ya existente, cuando se crea o edita, entonces responde 400.
- [ ] CA3 · Dada una imagen nueva, entonces la anterior se borra del disco.
- [ ] CA4 · Dado un servicio con citas asociadas, cuando se elimina, entonces se desactiva.
- [ ] CA5 · Dado un visitante, cuando consulta `/servicios/publicos`, entonces solo ve servicios `activo`.
- [ ] CA6 · (abuso) Solo Administrador y Asistente escriben o consultan el listado completo.

## Fuera de alcance
- Precios.

## Seguridad y privacidad
- Datos sensibles involucrados: No aplica: contenido público del catálogo.

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS5.a — Validar el contenido real y una lista de extensiones permitidas | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS5.b — Servir `/uploads` con `X-Content-Type-Options: nosniff` y sin contenido activo | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/servicios/*`, `frontend/src/pages/admin/AdminServicios.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- La subida de imágenes confía en el tipo declarado por el cliente (RS5).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-23 | Corregido por la ficha 2026-11-23-fix-imagen-servicios en v1.8.1 | /release |
