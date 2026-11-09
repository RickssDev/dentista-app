---
id: 001
slug: auth-registro-login
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 001 · Registro e inicio de sesión

## Problema
Pacientes y personal necesitan una cuenta para acceder a sus funciones según su rol. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como paciente, quiero registrarme con correo y contraseña para agendar citas.
- Como usuario, quiero iniciar sesión para acceder a mi panel.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [ ] CA1 · Dado un registro con todos los campos válidos, cuando se envía a `POST /auth/register`, entonces se crea un usuario con rol Paciente y contraseña en bcrypt.
- [ ] CA2 · Dado un registro con campos faltantes o contraseñas distintas, entonces responde 400.
- [ ] CA3 · Dada una contraseña de menos de 8 caracteres en producción o de más de 72 bytes, entonces responde 400.
- [ ] CA4 · Dado un correo ya registrado, entonces responde 400.
- [ ] CA5 · Dadas credenciales válidas, cuando se envían a `POST /auth/login`, entonces devuelve JWT, datos del usuario y `tienePerfilPaciente`.
- [ ] CA6 · Dadas credenciales inválidas, entonces responde 401 con mensaje genérico.
- [ ] CA7 · Dada una cuenta inactiva, entonces responde 403.
- [ ] CA8 · Tras iniciar sesión, el personal va a `/admin`, y el paciente a `/paciente` o, sin perfil, a `/paciente/completar-perfil`.
- [ ] CA9 · (abuso) Tras 10 intentos fallidos de un cliente en 15 minutos, el login se bloquea para ese cliente. **HOY NO SE CUMPLE:** detrás de varios proxies el límite no identifica al cliente real (RS4).
- [ ] CA10 · (abuso) Las respuestas no revelan si un correo existe. **HOY NO SE CUMPLE:** registro y login lo revelan (RS8).

## Fuera de alcance
- Inicio de sesión con Google (002) y gestión de contraseñas (003).

## Seguridad y privacidad
- Datos sensibles involucrados: correo, contraseña.
- Quién puede hacer qué: cualquiera puede registrarse como Paciente; el rol no se acepta del cliente.
- Casos de abuso:
  - Como atacante, intento adivinar contraseñas → se limita (CA9).
  - Como atacante, intento descubrir cuentas → no se revela (CA10).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| RS2.a — Mover la sesión a cookie HttpOnly o reducir la vida del token con renovación | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS2.b — Revocar sesiones en el servidor al cerrar sesión y al cambiar contraseña | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.a — Fijar `TRUST_PROXY` según la cadena real o tomar la IP de una cabecera confiable | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.b — Comprobar con un test que `req.ip` es el cliente detrás de la cadena | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.c — Persistir los contadores en un almacén compartido | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS8.a — Unificar las respuestas o limitar lo que revelan | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/auth/auth.service.js`, `auth.routes.js`, `backend/src/middlewares/rateLimiters.js`, `frontend/src/pages/admin/login.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- El registro y el login no normalizan el correo, y la recuperación de contraseña sí (`trim` y minúsculas).
- La sesión se guarda en `localStorage` (RS2).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
