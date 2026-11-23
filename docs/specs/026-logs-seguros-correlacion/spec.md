---
id: 026
slug: logs-seguros-correlacion
status: implemented
created: 2026-11-22
extends: []
---

# 026 · Logs seguros y correlación por petición

## Problema
Los mensajes técnicos del servidor son texto libre, sin nivel ni forma de saber qué mensajes
pertenecen a la misma petición, y algunos imprimen datos que no deberían salir del sistema. Por
ejemplo, las respuestas completas del proveedor de WhatsApp, que pueden traer el teléfono, y el
destinatario y el cuerpo de los correos con el enlace de recuperación de contraseña. Quien opera
la clínica no puede reconstruir un incidente, y cualquiera con acceso a los logs ve datos
personales sin el control de acceso del expediente. Esta spec atiende las brechas OB2, OB3 y OB4
de `docs/observability.md`. Dentro del objetivo 3, OB1 y OB5 quedan atendidas parcialmente: esta spec no implementa ninguna de sus correcciones (OB1 → specs 027 y 028; OB5 → Pendientes y deuda; ver "Cobertura de riesgos"). Es la primera de las tres del objetivo 3 del roadmap. El registro de
auditoría (OB1) queda para las specs 027 y 028.

## Historias de usuario
- Como persona que opera el sistema, quiero que cada petición tenga un identificador que aparezca en la respuesta y en todos sus mensajes, para reconstruir lo que pasó cuando alguien reporta un error.
- Como persona que opera el sistema, quiero mensajes con nivel, fecha y forma fija, y una línea por petición con su resultado, para distinguir los errores del servidor de los errores del cliente.
- Como paciente, quiero que mis datos personales no aparezcan en los logs técnicos, para que solo los vea quien tiene permiso sobre mi expediente.
- Como Administrador, quiero que un error en un servicio externo (WhatsApp, correo, Google) quede registrado sin exponer los datos del mensaje, para poder diagnosticarlo sin filtrar información.

## Criterios de aceptación
- [x] CA1 · Dada una petición a la API sin identificador, cuando el servidor responde, entonces la respuesta incluye `X-Request-Id` con un identificador nuevo, distinto en cada petición. Vale también para las respuestas 4xx, 5xx, las rechazadas por un limitador y la ruta de salud.
- [x] CA2 · Dada una petición con un `X-Request-Id` válido (de 8 a 64 caracteres, solo letras, dígitos, guion y guion bajo), cuando el servidor responde, entonces devuelve ese mismo valor y lo usa en los mensajes de la petición.
- [x] CA3 · (abuso) Como atacante, envío un `X-Request-Id` inválido (más largo que el límite, con saltos de línea, espacios u otros caracteres) para falsear o romper los logs → se ignora, se genera uno nuevo, la petición se atiende con normalidad y el valor recibido no aparece en ningún mensaje.
- [x] CA4 · Dada una petición que genera mensajes (incluidos los de error y los de envíos de WhatsApp o correo que dispara), cuando se revisan los logs, entonces todos llevan el identificador de esa petición.
- [x] CA5 · Dada una ejecución del trabajo programado de recordatorios, cuando se revisan los logs, entonces todos sus mensajes comparten un identificador propio de esa ejecución, distinto en cada ejecución.
- [x] CA6 · Dado cualquier mensaje del servidor, entonces es una sola línea estructurada con fecha, nivel, texto, identificador de la petición o del trabajo (si lo hay) e identificador numérico del usuario (si hay sesión). Nunca lleva su nombre ni su correo.
- [x] CA7 · Dado el servidor en producción, cuando se emite un mensaje de depuración, entonces no aparece. Dado el servidor en local, sí aparece. El nivel mínimo por entorno es `info` en producción y `debug` en local.
- [x] CA8 · Dada una petición terminada, entonces queda una línea con método, ruta sin parámetros de consulta, estado y duración. Una respuesta 2xx o 3xx se registra como informativa; una 4xx como advertencia, sin traza de pila; una 5xx como error, con traza de pila.
- [x] CA9 · (abuso) Dados los flujos que hoy imprimen datos, cuando se ejecutan con datos de prueba reconocibles, entonces ningún mensaje contiene teléfono, correo, nombre, dirección, texto o variables del mensaje enviado, enlace o token de recuperación, contraseña, cabecera de autorización, credencial de Google ni cuerpo de la petición o de la respuesta del proveedor. Los flujos son:
  - los avisos de WhatsApp de confirmación, reprogramación, cancelación y recordatorio, con éxito y con error del proveedor;
  - el envío de correo de recuperación, de aviso de contraseña y de Google, con éxito y con error;
  - la verificación fallida de Google;
  - un login fallido;
  - un error 4xx y uno 5xx con cuerpo.
- [x] CA10 · Dado un mensaje que incluye información adicional con campos de nombre sensible (correo, teléfono, contraseña, token, autorización, credencial y sus variantes), cuando se registra, entonces el valor de esos campos aparece reemplazado por un marcador y el resto del mensaje se conserva.
- [x] CA11 · Dado un error de un servicio externo (WhatsApp, correo o Google), cuando se registra, entonces el mensaje dice qué servicio falló, el estado HTTP y el código de error del proveedor si lo da, más el identificador de la cita o del envío cuando exista. Para un correo en local o en producción, el mensaje dice qué tipo de correo se envió y el identificador del proveedor, sin destinatario ni contenido.
- [x] CA12 · Dado un fallo al escribir un mensaje de log, cuando ocurre durante una petición, entonces la petición se responde igual que sin el fallo.

## Fuera de alcance
- Registro de auditoría (quién vio o cambió qué): specs 027 y 028 (OB1).
- Mostrar el identificador de la petición al usuario en la interfaz (por ejemplo «código de referencia» en los mensajes de error).
- Agregar, centralizar o retener los logs fuera de `docker compose logs`, y la rotación en el servidor (brecha por confirmar en `docs/observability.md`).
- Métricas, monitor de disponibilidad y alertas (OB5).
- Logs del navegador (`console.*` del frontend).
- Cambiar los mensajes o el formato de las respuestas de la API, salvo la cabecera nueva.
- Poder imprimir el enlace de recuperación en desarrollo, ni siquiera con una opción explícita (decisión del usuario).

## Seguridad y privacidad
- Datos sensibles involucrados: personales (teléfono, correo, nombre) y credenciales (tokens de recuperación, contraseñas, credenciales de Google) que hoy pueden llegar a los logs. La spec los saca de ahí. No toca datos de salud ni cambia quién accede a qué.
- Quién puede hacer qué: sin cambios de permisos. Los logs siguen siendo accesibles solo para quien opera el servidor.
- Casos de abuso:
  - Como atacante, envío un identificador de petición manipulado para inyectar líneas falsas en los logs o desbordarlos → se descarta y se genera otro (CA3).
  - Como atacante, provoco errores con cuerpos que contienen datos o credenciales para que queden en los logs → ningún cuerpo de petición se registra (CA9).
  - Como persona con acceso de lectura a los logs, busco teléfonos, correos o enlaces de recuperación → no aparecen (CA9, CA10, CA11).

## Cobertura de riesgos
| Corrección | Alcance | Criterios / motivo y destino |
|---|---|---|
| OB2.a — Dejar de imprimir respuestas completas de WhatsApp | dentro | CA9, CA11 |
| OB2.b — No imprimir destinatario ni cuerpo de correos, tampoco en desarrollo | dentro | CA9, CA11 |
| OB2.c — Revisar y sanear los `console.*` restantes, incluidos los stack de `errorHandler` | dentro | CA6, CA8, CA9, CA10 |
| OB3.a — Middleware que asigne `X-Request-Id` y lo devuelva en la respuesta | dentro | CA1, CA2, CA3 |
| OB3.b — Incluir `request_id` en cada log de la petición | dentro | CA4, CA5 |
| OB4.a — Adoptar un logger JSON con niveles, con ADR | dentro | CA6, CA7 |
| OB4.b — Registrar método, ruta y estado, separando 4xx de 5xx | dentro | CA8 |
| OB1.a — Crear la tabla de auditoría de solo anexado con retención de 5 años | fuera | Partición del objetivo 3 → spec 027 (prevista) |
| OB1.b — Auditar logins y accesos denegados | fuera | → spec 027 (prevista) |
| OB1.c — Auditar lecturas de historial clínico y datos de paciente | fuera | → spec 028 (prevista) |
| OB1.d — Auditar altas y cambios de pacientes e historial clínico | fuera | → spec 028 (prevista) |
| OB1.e — Auditar cambios de roles, acciones administrativas y exportaciones | fuera | → spec 028 (prevista) |
| OB1.f — Exponer la consulta solo al Administrador y auditar cada lectura | fuera | → spec 027 (prevista) |
| OB5.a — Monitor externo de disponibilidad | fuera | No es del objetivo 3 → Pendientes y deuda del roadmap |
| OB5.b — Alertas por tasa de errores 5xx | fuera | Necesita antes la línea por petición de esta spec → Pendientes y deuda del roadmap |

## Auditoría
No aplica: la spec no cambia el acceso a datos sensibles, la autenticación ni los permisos. Solo
cambia qué se escribe en los logs técnicos. El registro de auditoría es el de las specs 027 y 028.

## Requisitos no funcionales
- Los mensajes siguen saliendo por la salida estándar, legibles con `docker compose logs`.
- La suite de pruebas no imprime mensajes de log salvo que una prueba los capture.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-22 | brecha | ¿Una spec o varias para el objetivo 3? | Tres: 026 logs y correlación (OB2, OB3, OB4); 027 base de auditoría con la tabla, logins, accesos denegados y la consulta (OB1.a, b, f); 028 auditoría de pacientes, historial, roles, acciones administrativas y exportaciones (OB1.c, d, e) | usuario |
| 2026-11-22 | brecha | ¿Entra OB4 (logger con niveles y línea por petición), que no es del objetivo 3? | Sí: así las llamadas de log se tocan una sola vez | usuario |
| 2026-11-22 | brecha | ¿Cómo se ve el enlace de recuperación en desarrollo si no se imprime? | No se imprime nada, ni con opción explícita; para probar hace falta un buzón de pruebas o un correo real | usuario |
| 2026-11-22 | implícita | ¿Se acepta el identificador del cliente? | Sí, si es válido; si no, se genera | docs/observability.md → Correlación |
| 2026-11-22 | implícita | ¿Los trabajos programados llevan identificador? | Sí, «y de los trabajos que dispare» | docs/observability.md → Correlación |
| 2026-11-22 | implícita | Campos de cada mensaje | Fecha, nivel, identificador de petición, usuario si hay sesión, texto y contexto | docs/observability.md → Logs |
| 2026-11-22 | implícita | Nivel por entorno | `info` en producción, `debug` en local | docs/observability.md → Logs; constitución P15 |
| 2026-11-22 | implícita | Qué nunca se registra | Datos personales, de salud, contraseñas, tokens, secretos y cuerpos completos de petición | docs/observability.md → Logs; constitución P15 |
| 2026-11-22 | supuesto | Formato válido del identificador recibido | De 8 a 64 caracteres, letras, dígitos, guion y guion bajo: cubre UUID y los identificadores de Cloudflare | usuario (confirmado 2026-11-22, /analyze A20) |
| 2026-11-22 | supuesto | ¿La ruta de salud genera la línea por petición? | Sí, pero como mensaje de depuración, para no llenar el log de producción con las comprobaciones del contenedor | usuario (confirmado 2026-11-22, /analyze A20) |
| 2026-11-22 | supuesto | ¿Qué se registra del usuario? | Solo su identificador numérico, nunca nombre ni correo | usuario (confirmado 2026-11-22, /analyze A20) |
| 2026-11-22 | supuesto | Tamaño de la spec (12 criterios) | Se mantiene junta: los tres riesgos tocan las mismas llamadas de log | agente |

## Notas para /plan
- Constitución P3: un logger de terceros es dependencia nueva de producción y requiere ADR (OB4.a ya lo pide).
- `backend/src/middlewares/errorHandler.js` tiene definido `errorHandler` dos veces y un bloque `if` suelto después de `module.exports`; revisarlo al tocarlo.
- `email.service.js` lanza `Resend respondió <estado>: <detalle>` con el cuerpo completo de la respuesta; ese mensaje acaba en el log.
- El encadenamiento del identificador hasta los envíos de WhatsApp y correo que no reciben la petición es la parte delicada de CA4.
- Cloudflare y Caddy van delante; decidir si se reutiliza algún identificador que ya traen.

## Historial
| Fecha | Cambio | Motivo |
|---|---|---|
| 2026-11-22 | Redacción del Problema sobre OB1 y OB5; tres supuestos confirmados por el usuario | /analyze A19, A20 |
