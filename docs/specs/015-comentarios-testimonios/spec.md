---
id: 015
slug: comentarios-testimonios
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 015 · Reseñas de pacientes

## Problema
Los pacientes pueden valorar su atención y la clínica publica los testimonios que elige. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como paciente, quiero reseñar una cita completada.
- Como personal, quiero moderar y responder reseñas.
- Como visitante, quiero leer testimonios.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dada una reseña sin comentario, calificación o cita, entonces responde 400.
- [ ] CA2 · Dada una cita inexistente, entonces responde 404.
- [ ] CA3 · (abuso) Dada la cita de otro paciente, entonces responde 403.
- [ ] CA4 · Dada una cita que no está `completada`, entonces responde 400.
- [ ] CA5 · (abuso) Dada una cita ya reseñada, aunque se haya eliminado la reseña, entonces responde 400.
- [ ] CA6 · Dada una calificación fuera de 1 a 5, entonces responde 400.
- [ ] CA7 · Dado un estado distinto de `visible` u `oculto`, entonces responde 400.
- [ ] CA8 · Dada una reseña eliminada, entonces queda oculta y marcada como eliminada.
- [ ] CA9 · Dado un visitante, entonces `/comentarios/publicos` no incluye reseñas eliminadas.
- [ ] CA10 · (abuso) Solo Administrador y Asistente moderan y responden.

## Fuera de alcance
- Reseñas sin cita asociada.

## Seguridad y privacidad
- Datos sensibles involucrados: nombre del paciente publicado junto a su reseña.
- Quién puede hacer qué: el paciente sobre sus citas completadas; el personal modera.
- Casos de abuso:
  - Como usuario, intento publicar reseñas falsas sobre citas ajenas → se rechaza (CA3).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RD1.a — Exportar a un archivo versionado el esquema actual, sin datos | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RD1.b — Adoptar una herramienta de migraciones con ADR y ajustar la regla `*.sql` del `.gitignore` | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RD1.c — Mover a migraciones los cambios documentados dentro de repositories | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/comentarios/*`, `frontend/src/pages/admin/AdminComentarios.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- La columna `eliminado` se añadió con un `ALTER TABLE` documentado en `comen.repository.js:10` (RD1).
- La calificación no se valida como número entero.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
