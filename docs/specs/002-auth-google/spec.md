---
id: 002
slug: auth-google
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 002 · Acceso con Google

## Problema
Los pacientes pueden entrar con su cuenta de Google sin crear una contraseña. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como paciente, quiero registrarme e iniciar sesión con Google para no recordar otra contraseña.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [x] CA1 · Dada una credencial que no verifica contra `GOOGLE_CLIENT_ID`, entonces responde 401.
- [x] CA2 · Dada una cuenta de Google con correo no verificado, entonces responde 401.
- [x] CA3 · Dada una credencial válida de un correo nuevo, cuando se envía a `/auth/google/register`, entonces se crea un usuario Paciente sin contraseña.
- [x] CA4 · Dado un correo ya registrado, cuando se intenta registrar con Google, entonces responde 400.
- [x] CA5 · Dada una cuenta existente sin `google_id`, cuando inicia sesión con Google, entonces se vincula y devuelve la sesión.
- [x] CA6 · (abuso) Dada una cuenta vinculada a otro `google_id`, entonces responde 401.
- [x] CA7 · Dada una cuenta inactiva, entonces responde 403.
- [ ] CA8 · (abuso) El login no revela si un correo existe. **HOY NO SE CUMPLE:** un correo sin cuenta responde 404 (RS8).

## Fuera de alcance
- Otros proveedores de identidad.

## Seguridad y privacidad
- Datos sensibles involucrados: correo, nombre, `google_id`.
- Quién puede hacer qué: cualquier cuenta de Google verificada puede registrarse como Paciente.
- Casos de abuso:
  - Como atacante, intento usar una credencial de otra aplicación → se rechaza por `audience` (CA1).
  - Como atacante, intento suplantar una cuenta vinculada → se rechaza (CA6).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS4.a — Fijar `TRUST_PROXY` según la cadena real o tomar la IP de una cabecera confiable | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.b — Comprobar con un test que `req.ip` es el cliente detrás de la cadena | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.c — Persistir los contadores en un almacén compartido | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS8.a — Unificar las respuestas o limitar lo que revelan | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/auth/auth.service.js:185-226,414-460`, `frontend/src/main.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- Comparte el limitador de login y su problema de identificación de cliente (RS4).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
