const cron = require("node-cron");
const citasRepo = require("../modules/citas/citas.repository");
const { sendTemplateMessage } = require("./whatp.service");

cron.schedule("* * * * *", async () => {
  try {
    const citas = await citasRepo.getCitasParaRecordatorio();

    //console.log("CITAS ENCONTRADAS:", citas.length);

    for (const cita of citas) {

  if (!cita.telefono) {
    console.log(
      `Cita ${cita.id_cita} sin teléfono`
    );
    continue;
  }

  const fechaFormateada = new Date(
  cita.fecha_agendada
).toLocaleDateString("es-MX");

const horaFormateada = new Date(
  `1970-01-01T${cita.hora}`
).toLocaleTimeString("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

const result = await sendTemplateMessage(
  cita.telefono,
  "cita_recordatorio",
  [
    cita.nombre_usuario,
    fechaFormateada,
    horaFormateada
  ]
);

console.log(
  "RESPUESTA META:",
  JSON.stringify(result, null, 2)
);

console.log(
  `Recordatorio enviado para cita ${cita.id_cita}`
);

  await citasRepo.marcarRecordatorioEnviado(
    cita.id_cita
  );
}

   } catch (error) {
    console.log(
      JSON.stringify(
        error.response?.data,
        null,
        2
      )
    );
  }
});   