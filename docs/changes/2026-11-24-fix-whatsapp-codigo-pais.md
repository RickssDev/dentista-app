---
lane: fix
status: released
released: v1.9.1 (2026-11-24)
base: 59a9e98
relates: [007]
covers: [CA1, CA3]
escalated_to: null
---

# Fix: los avisos de WhatsApp se envían sin código de país

## Problema
Los teléfonos de los pacientes se guardan con 10 dígitos («742…»), y `sendTemplateMessage` los
envía tal cual a la API de WhatsApp Cloud. La API exige el formato internacional (para México, 52
seguido de los 10 dígitos), así que ningún aviso llegaría aunque las credenciales sean correctas
(spec 007, CA1 y CA3). Detectado el 2026-11-24 al preparar una demostración local: el diagnóstico
de la cita 19 muestra un teléfono de 10 dígitos sin código de país.

## Reproducción
- `backend/tests/services/whatsapp.test.js` → «el teléfono se envía en formato internacional»,
  antes del arreglo: `Expected: "525500000000" / Received: "5500000000"`. Fallan los 4 casos sin
  código de país; los que ya traen 52 o 521 pasan.
- Diagnóstico local (2026-11-24): el teléfono de la cita 19 tiene 10 dígitos sin código de país.
  Meta rechaza además el `WHATSAPP_PHONE_NUMBER_ID` configurado en local (código 100, subcódigo
  33), un problema de credenciales que no es de esta ficha.

## Causa raíz
Los pacientes guardan exactamente 10 dígitos (`pacientes.service.js`, `limpiarTelefono`), y
`sendTemplateMessage` los mandaba tal cual en `to`. La API de WhatsApp Cloud exige el número
internacional. `sendTemplateMessage` es el único punto que envía el teléfono fuera: lo usan el
recordatorio y los avisos de alta, reprogramación y cancelación.

## Cambio
- `backend/src/services/whatp.service.js`: `formatoInternacional` quita todo lo que no es dígito y
  antepone 52 si quedan 10 dígitos; si no, deja los dígitos. Un teléfono sin dígitos no se manda a
  Meta: el envío falla con «El teléfono no tiene dígitos», sin el valor (hallazgo 1 de la review).
- `backend/tests/services/whatsapp.test.js`: 6 formatos y el caso sin dígitos.
- Commit `fix(fix-whatsapp-codigo-pais): los avisos de WhatsApp se envían en formato internacional`.

## Escalado
`lane-check` sin motivos al empezar y al cerrar: 1 archivo de código.

## Verificación
- `tests/services/whatsapp.test.js` 9/9; backend completo en verde; lint solo con el error previo.
- Review ligera (subagente): sin bloqueantes.
  - Revirtiendo solo el servicio (comprobado con hash), fallan los 4 casos sin código de país; restaurado, pasan.
  - Confirma la causa y que no hay otro punto que envíe el teléfono fuera.
  - Confirma que los logs no incluyen el teléfono (spec 026).
  - Hallazgo 1 (teléfono sin dígitos enviado vacío): corregido con su test.
  - Hallazgos 2 y 3: ver Decisiones.

## Decisiones
| Fecha | Tipo | Pregunta / conflicto | Decisión | Fuente |
|---|---|---|---|---|
| 2026-11-24 | implícita | ¿Qué código de país se añade? | 52 (México): la clínica y sus pacientes están en México y los teléfonos se capturan con 10 dígitos | `docs/architecture.md` (Lázaro Cárdenas, Michoacán); síntoma |
| 2026-11-24 | supuesto | ¿Qué pasa con un número que ya trae código de país? | Se envía solo con sus dígitos, sin añadir nada: 12 dígitos que empiezan por 52 o 13 que empiezan por 521. Los espacios, guiones, paréntesis y el «+» se quitan | /fix (formato E.164 sin «+» que acepta la API) |
| 2026-11-24 | brecha | ¿Corregirlo en el código o solo en los datos locales? | En el código, para todos los pacientes | usuario |
| 2026-11-24 | supuesto | Review: prefijos antiguos de México (044, 045, 1 + 10 dígitos) y números extranjeros de 10 dígitos | Solo se completan los 10 dígitos de México; lo demás se envía con sus dígitos. Los pacientes ya fuerzan 10 dígitos | review ligera |
| 2026-11-24 | supuesto | Review: en el recordatorio, un fallo de envío corta las citas siguientes de esa ejecución | Comportamiento previo, fuera de esta ficha | review ligera |
