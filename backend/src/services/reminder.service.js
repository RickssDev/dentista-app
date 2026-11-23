const crypto = require("node:crypto");
const cron = require("node-cron");
const citasRepo = require("../modules/citas/citas.repository");
const { sendTemplateMessage, whatsappActivo } = require("./whatp.service");
const logger = require("../utils/logger");
const { ejecutarConContexto } = require("../utils/contexto");

const PLANTILLA = "cita_recordatorio";

const enviarRecordatorios = async () => {
  // Con WhatsApp apagado no se envía nada: las citas no deben marcarse como recordadas.
  if (!whatsappActivo()) return;

  let revisadas = 0;
  let enviadas = 0;
  // Cita en curso: si el envío falla, el error se registra con su id (spec 026, CA11).
  let citaEnCurso = null;

  logger.debug("Recordatorios: inicio de ejecución");

  try {
    const citas = await citasRepo.getCitasParaRecordatorio();

    for (const cita of citas) {
      revisadas += 1;
      citaEnCurso = cita;

      if (!cita.telefono) {
        logger.info("Recordatorio omitido: cita sin teléfono", { id_cita: cita.id_cita });
        continue;
      }

      const fechaFormateada = new Date(cita.fecha_agendada).toLocaleDateString("es-MX");

      const horaFormateada = new Date(`1970-01-01T${cita.hora}`).toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      await sendTemplateMessage(cita.telefono, PLANTILLA, [
        cita.nombre_usuario,
        fechaFormateada,
        horaFormateada,
      ]);

      logger.info("Aviso de WhatsApp enviado", { id_cita: cita.id_cita, plantilla: PLANTILLA });
      enviadas += 1;

      await citasRepo.marcarRecordatorioEnviado(cita.id_cita);
    }
  } catch (error) {
    // Como antes, un error detiene la ejecución; las citas pendientes se intentan en la siguiente.
    if (citaEnCurso) {
      logger.error("Aviso de WhatsApp no enviado", {
        id_cita: citaEnCurso.id_cita,
        plantilla: PLANTILLA,
        ...logger.resumirErrorExterno("whatsapp", error),
      });
    } else {
      logger.error("Recordatorios: no se pudieron consultar las citas", logger.resumirError(error));
    }
  }

  logger.info("Recordatorios: fin de ejecución", { revisadas, enviadas });
};

// Cada ejecución tiene su propio identificador en todos sus mensajes (spec 026, CA5).
cron.schedule("* * * * *", () =>
  ejecutarConContexto({ jobId: crypto.randomUUID() }, enviarRecordatorios)
);
