---
id: 016
slug: faqs
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 016 · Preguntas frecuentes

## Problema
Los visitantes resuelven dudas comunes sin contactar a la clínica.

## Historias de usuario
- Como personal, quiero mantener las preguntas frecuentes.
- Como visitante, quiero leerlas.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada un alta o edición sin pregunta o respuesta, entonces responde 400.
- [ ] CA2 · Dada una pregunta inexistente, entonces responde 404.
- [ ] CA3 · Dado un visitante, entonces puede listar y consultar preguntas sin sesión.
- [ ] CA4 · (abuso) Solo Administrador y Asistente crean, editan o eliminan.

## Fuera de alcance
- Categorías de preguntas.

## Seguridad y privacidad
- Datos sensibles involucrados: No aplica: contenido público.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/faqs/*`, `frontend/src/pages/admin/Adminfaqs.jsx`
- Tests: sin tests

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
