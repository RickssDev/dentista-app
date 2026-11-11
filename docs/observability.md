---
status: inferred
updated: 2026-11-08
---

# Observabilidad y auditoría de Dentissa

Estado de cada capacidad: **presente** (instalada o declarada) · **configurada** (configurada para
este proyecto) · **en uso** (el código o la operación la ejercitan). Solo "en uso" cuenta como
cubierta.

## Resumen
| Capacidad | Herramienta | Estado | Evidencia |
|---|---|---|---|
| Logs de aplicación | `console.*`, unas 30 llamadas | en uso, sin estructura | `backend/src/services/`, `errorHandler.js` |
| Agregación de logs | ninguna | ausente | compose sin driver de logging |
| Correlación por petición | ninguna | ausente | `backend/src/config/app.js` |
| Registro de auditoría | ninguno | ausente | sin tabla ni servicio de auditoría |
| Métricas | ninguna | ausente | `backend/package.json` |
| Trazas distribuidas | ninguna | ausente | `backend/package.json` |
| Alertas | ninguna | ausente | sin configuración en el repo |
| Health check | `GET /health` | en uso | `backend/src/config/app.js`, compose |

## Logs
- Formato: texto libre. Objetivo: JSON con `timestamp`, `level`, `request_id`, `actor_id` (si hay sesión), `message`, `context`.
- Nivel por entorno: local `debug` · producción `info` (decisión del usuario, 2026-11-08). Hoy no existen niveles.
- Destino y retención: stdout, visible con `docker compose logs`. Retención no definida.
- Qué **nunca** se registra: datos personales (teléfono, correo, dirección), datos de salud, contraseñas, tokens, secretos, cuerpos completos de petición. Hoy no se cumple (OB2).

## Correlación
- Identificador por petición: cabecera `X-Request-Id` (decisión del usuario, 2026-11-08); se acepta del cliente si es válido o se genera; se devuelve en la respuesta y se añade al contexto de todos los logs de la petición y de los trabajos que dispare. Hoy no existe (OB3).

## Registro de auditoría
Separado de los logs técnicos: responde **quién hizo qué, sobre qué, cuándo y con qué resultado**.

| Evento | Obligatorio | Campos |
|---|---|---|
| Login exitoso y fallido | sí | actor (o identificador intentado), IP, resultado, fecha |
| Acceso denegado (401/403) | sí | actor, acción, recurso, fecha |
| Lectura de historial clínico y datos de paciente | sí | actor, recurso, fecha |
| Alta y cambio de pacientes e historial clínico | sí | actor, recurso, campos cambiados (sin valores sensibles), fecha |
| Cambio de permisos o roles | sí | actor, sujeto, antes → después, fecha |
| Acciones administrativas | sí | actor, acción, recurso, fecha |
| Exportación de reportes | sí | actor, tipo, rango, fecha |

(Eventos: decisión del usuario, 2026-11-08.)

- Almacenamiento: tabla propia de **solo anexado**; nadie, tampoco un administrador, puede modificar o borrar entradas desde la aplicación.
- Retención: 5 años (decisión del usuario, 2026-11-08; base: NOM-004-SSA3-2012, confirmar con asesoría legal).
- Quién puede leerlo: solo Administrador (decisión del usuario, 2026-11-08); cada lectura del registro también se audita.

## Métricas y alertas
| Métrica / alerta | Umbral | Canal |
|---|---|---|
| Tasa de errores 5xx | TODO(init) | TODO(init) |
| Logins fallidos por IP o cuenta | TODO(init) | TODO(init) |
| Latencia p95 | TODO(init) | TODO(init) |
| Disponibilidad externa | TODO(init) | TODO(init) |

## Brechas

### OB1 · Alta — Sin registro de auditoría
Nada registra quién consultó o cambió un expediente, ni los logins o accesos denegados.
Atendida por el objetivo 3 de [roadmap](roadmap.md).
Correcciones:
- OB1.a Crear la tabla de auditoría de solo anexado con retención de 5 años — estado: pendiente
- OB1.b Auditar logins y accesos denegados — estado: pendiente
- OB1.c Auditar lecturas de historial clínico y datos de paciente — estado: pendiente
- OB1.d Auditar altas y cambios de pacientes e historial clínico — estado: pendiente
- OB1.e Auditar cambios de roles, acciones administrativas y exportaciones — estado: pendiente
- OB1.f Exponer la consulta solo al Administrador y auditar cada lectura — estado: pendiente

### OB2 · Alta — Datos sensibles en logs
`reminder.service.js:42` y `:57` y `citas.service.js:158, 275, 339, 456` imprimen respuestas de
WhatsApp, que pueden incluir el teléfono; hoy apagado en producción con `WHATSAPP_ENABLED=false`.
`email.service.js:188` imprime destinatario y cuerpo con el enlace de recuperación cuando
`NODE_ENV` no es `production`. Atendida por el objetivo 3 de [roadmap](roadmap.md).
Correcciones:
- OB2.a Dejar de imprimir respuestas completas de WhatsApp — estado: pendiente
- OB2.b No imprimir destinatario ni cuerpo de correos, tampoco en desarrollo — estado: pendiente
- OB2.c Revisar y sanear los `console.*` restantes, incluidos los stack de `errorHandler` — estado: pendiente

### OB3 · Alta — Sin correlación por petición
No hay forma de relacionar los mensajes de una misma petición. Atendida por el objetivo 3 de
[roadmap](roadmap.md).
Correcciones:
- OB3.a Middleware que asigne `X-Request-Id` y lo devuelva en la respuesta — estado: pendiente
- OB3.b Incluir `request_id` en cada log de la petición — estado: pendiente

### OB4 · Media — Logs sin estructura ni niveles
Trece módulos no registran nada y los errores 4xx se imprimen con stack, igual que los 5xx.
Correcciones:
- OB4.a Adoptar un logger JSON con niveles, con ADR — estado: pendiente
- OB4.b Registrar método, ruta y estado, separando 4xx de 5xx — estado: pendiente

### OB5 · Media — Sin métricas ni alertas
Una caída o una ola de errores solo se detecta si alguien avisa.
Correcciones:
- OB5.a Monitor externo de disponibilidad — estado: pendiente
- OB5.b Alertas por tasa de errores 5xx — estado: pendiente

### OB6 · Media — Los avisos apagados se registran como enviados
Con `WHATSAPP_ENABLED=false`, `sendTemplateMessage` no envía nada, pero `reminder.service.js`
imprime "Recordatorio enviado" y marca la cita como enviada; `citas.service.js:153, 272, 336`
también afirman el envío.
Correcciones:
- OB6.a Distinguir "no enviado" de "enviado" en logs y en `recordatorio_enviado` — estado: mitigada (v1.1.0)

## Brechas por confirmar
- Pérdida de logs al recrear contenedores — depende de: configuración de Docker en el servidor — cómo confirmarla: revisar el driver y la rotación.
- Auditoría a nivel de MySQL — depende de: general log o binlog activos — cómo confirmarla: consultar la configuración del servidor.

## No determinado
- Si existe monitoreo externo fuera del repo.
