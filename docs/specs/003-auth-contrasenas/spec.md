---
id: 003
slug: auth-contrasenas
status: inferred
confidence: alta
created: 2026-11-08
extends: []
---

# 003 · Recuperar y cambiar contraseña

## Problema
Los usuarios necesitan recuperar el acceso si olvidan su contraseña y poder cambiarla. Como spec inferida, atiende los riesgos que cita solo parcialmente: los documenta sin corregirlos.

## Historias de usuario
- Como usuario, quiero recibir un enlace por correo para restablecer mi contraseña.
- Como usuario autenticado, quiero cambiar mi contraseña.

## Criterios de aceptación
<!-- Spec inferida: [x] = cubierto por un test; [ ] = observado en el código, sin test. -->
- [x] CA1 · Dado cualquier correo con formato válido, cuando se solicita recuperación, entonces la respuesta es la misma exista o no la cuenta.
- [x] CA2 · Dada una cuenta activa con contraseña, entonces se envía un enlace con un token de 32 bytes y solo se guarda su hash SHA-256.
- [x] CA3 · Dada una cuenta creada solo con Google, cuando se solicita recuperación, entonces se envía un correo que lo indica, con enlace a iniciar sesión y sin enlace para restablecer contraseña.
- [x] CA4 · Dado un fallo al enviar el correo, entonces el token se elimina.
- [x] CA5 · Dado un token válido de menos de 15 minutos, cuando se restablece, entonces la contraseña cambia y se notifica por correo.
- [x] CA6 · (abuso) Dado un token inválido o expirado, entonces responde 400.
- [x] CA7 · Dada una contraseña nueva igual a la actual, entonces responde 400.
- [x] CA8 · Dado un usuario autenticado, cuando cambia su contraseña con la actual correcta, entonces se actualiza.
- [ ] CA9 · (abuso) Tras 5 intentos fallidos de un cliente en 15 minutos, se bloquea para ese cliente. **HOY NO SE CUMPLE:** el límite no identifica al cliente real (RS4).
- [ ] CA10 · (abuso) Cambiar la contraseña invalida las sesiones abiertas. **HOY NO SE CUMPLE:** no hay revocación (RS2).

## Fuera de alcance
- Registro e inicio de sesión (001).

## Seguridad y privacidad
- Datos sensibles involucrados: correo, contraseña, token de recuperación.
- Quién puede hacer qué: el titular de la cuenta.
- Casos de abuso:
  - Como atacante, intento descubrir cuentas por recuperación → respuesta genérica (CA1).
  - Como atacante, intento reutilizar o adivinar un token → se rechaza (CA6).

## Cobertura de riesgos
Esta spec documenta el comportamiento actual y no corrige los riesgos citados.

| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| OB2.a — Dejar de imprimir respuestas completas de WhatsApp | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB2.b — No imprimir destinatario ni cuerpo de correos, tampoco en desarrollo | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| OB2.c — Revisar y sanear los `console.*` restantes, incluidos los stack de `errorHandler` | fuera | Spec inferida: describe el estado actual → objetivo 3 del roadmap |
| RS2.a — Mover la sesión a cookie HttpOnly o reducir la vida del token con renovación | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS2.b — Revocar sesiones en el servidor al cerrar sesión y al cambiar contraseña | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.a — Fijar `TRUST_PROXY` según la cadena real o tomar la IP de una cabecera confiable | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.b — Comprobar con un test que `req.ip` es el cliente detrás de la cadena | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |
| RS4.c — Persistir los contadores en un almacén compartido | fuera | Spec inferida: describe el estado actual → Pendientes y deuda del roadmap |

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-09 | brecha | ¿Qué enlace lleva el correo de recuperación de una cuenta solo de Google? (/analyze A2 de la spec 018) | Enlace a iniciar sesión, porque esas cuentas no tienen contraseña; las cuentas normales reciben el enlace para restablecer | usuario |

## Evidencia (solo si status=inferred)
- Archivos: `backend/src/modules/auth/auth.service.js:22-183,350-412`, `backend/src/services/email.service.js`, `frontend/src/pages/admin/RestablecerContrasena.jsx`
- Tests: sin tests

## Observaciones (solo si status=inferred)
- Fuera de producción, el enlace con el token se imprime en consola (OB2).

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-08 | Spec inferida del código | /init |
| 2026-11-09 | Corregida la redacción de CA3 para reflejar el comportamiento actual | /analyze A2 de la spec 018, confirmado por el usuario |
| 2026-11-11 | Corregido por la ficha 2026-11-10-fix-cambiar-contrasena-tipos en v1.1.1 (CA8) | /release |
