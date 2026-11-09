---
id: 008
slug: perfil-paciente
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 008 · Perfil del paciente

## Problema
La clínica necesita los datos de contacto y generales del paciente antes de atenderlo.

## Historias de usuario
- Como paciente, quiero completar y actualizar mi perfil para poder agendar citas.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado un teléfono que no tiene 10 dígitos, cuando se crea el perfil, entonces responde 400.
- [ ] CA2 · Dado un usuario sin perfil, cuando envía dirección, nacimiento, género y teléfono, entonces se crea su perfil.
- [ ] CA3 · Dado un usuario con perfil, cuando intenta crear otro, entonces responde 400.
- [ ] CA4 · Dado un paciente con perfil, entonces consulta y actualiza su teléfono, dirección y género.
- [ ] CA5 · Dado personal autenticado, entonces puede buscar pacientes y consultar el perfil por usuario.
- [ ] CA6 · (abuso) El perfil se resuelve siempre con el usuario del token; no se puede leer ni editar el de otro paciente por `/perfil`.

## Fuera de alcance
- Historial clínico (009).

## Seguridad y privacidad
- Datos sensibles involucrados: dirección, fecha de nacimiento, género, teléfono.
- Quién puede hacer qué: el paciente sobre su perfil; el personal puede consultar.
- Casos de abuso:
  - Como paciente, intento ver el perfil de otro → solo se usa el identificador del token (CA6).

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/pacientes/*`, `frontend/src/pages/paciente/CompletarPerfil.jsx`, `PerfilPaciente.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- La actualización no valida el formato del teléfono, a diferencia de la creación.
- `POST /pacientes` no restringe por rol.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
