---
lane: fix
status: released
released: v1.1.0 (2026-11-09)
base: 49cf01a
relates: [005, 017]
covers: []
escalated_to: null
---

# Fix: horario distinto entre el sitio y el agendado

## Problema
El agendado ofrecía de 8:00 a 16:00 todos los días y el sitio publicaba otro horario.

## Reproducción
`backend/tests/services/horarios.test.js` y `frontend/tests/horario.test.js`: antes del arreglo, el sábado llegaba a 15:00, el domingo tenía horarios y el sitio mostraba otro horario.

## Causa raíz
El horario está definido por separado en `getHorariosDisponibles` y en `frontend/src/data/site.js`, sin relación entre ambos.

## Cambio
Lunes a viernes de 8:00 a 16:00, sábado de 8:00 a 14:00 y domingo cerrado, en el agendado y en el sitio.

## Escalado
Cambia una regla de negocio; se mantiene en el carril por decisión del usuario.

## Verificación
Las pruebas fallan sin el arreglo y pasan con él. Suite completa, lint y build correctos. Revisión ligera: la API aún acepta citas fuera de horario si se llama directamente; pendiente de decisión del usuario.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | brecha | ¿Cuál es el horario real de la clínica? | Lunes a viernes 8:00–16:00, sábado 8:00–14:00, domingo cerrado | usuario |
| 2026-11-09 | supuesto | ¿Escalar por cambiar una regla de negocio? | Vía ligera para todas las correcciones | usuario |
