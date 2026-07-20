const repo = require("./citas.repository");
const AppError = require("../../utils/AppError");
const { sendTemplateMessage } = require("../../services/whatp.service");
const servicioRepo = require("../servicios/servicios.repository");
const pacienteRepo = require("../pacientes/pacientes.repository");

const timeToMinutes = (time) => {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
};

const durationToMinutes = (duration) => {
  const [h, m] = duration.split(":");
  return Number(h) * 60 + Number(m);
};

const formatearHora = (hora) => {
  const [h, m] = hora.split(":");

  let horas = parseInt(h);
  const periodo = horas >= 12 ? "PM" : "AM";

  horas = horas % 12;
  horas = horas || 12;

  return `${horas}:${m} ${periodo}`;
};

exports.getCitas = async () => {
  const citas = await repo.getCitas();

  return citas.map((c) => ({
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    id_servicio: c.id_servicio,
    nombre_servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
    id_paciente: c.id_paciente,
    nombre_paciente: `${c.nombre_usuario} ${c.apellido}`,
  }));
};

exports.getCitaById = async (id) => {
  if (!id || isNaN(id)) throw new Error("ID de cita inválido");

  const c = await repo.getCitaById(id);
  if (!c) throw new AppError("Cita no encontrada", 404);

  return {
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    id_servicio: c.id_servicio,
    nombre_servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
    id_paciente: c.id_paciente,
    nombre_paciente: `${c.nombre_usuario} ${c.apellido}`,
  };
};

exports.getCitasByEstado = async (estado) => {
  if (!estado) throw new AppError("Estado requerido", 400);
  const citas = await repo.getCitasByEstado(estado);

  return citas.map((c) => ({
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    id_servicio: c.id_servicio,
    nombre_servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
    id_paciente: c.id_paciente,
    nombre_paciente: `${c.nombre_usuario} ${c.apellido}`,
  }));
};

exports.getCitasByPaciente = async (id_paciente) => {
  if (!id_paciente || isNaN(id_paciente))
    throw new AppError("ID de paciente inválido", 400);

  const citas = await repo.getCitasByPaciente(id_paciente);

  return citas.map((c) => ({
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    id_servicio: c.id_servicio,
    nombre_servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
    id_paciente: c.id_paciente,
    nombre_paciente: `${c.nombre_usuario} ${c.apellido}`,
  }));
};

exports.createCita = async (data) => {
  if (!data || Object.keys(data).length === 0)
    throw new AppError("No se recibieron datos", 400);

  const {
    id_paciente,
    fecha_agendada,
    hora,
    id_servicio,
    estado = "pendiente",
    motivo,
  } = data;

  if (!id_paciente || !fecha_agendada || !hora || !id_servicio) {
    throw new AppError(
      "Faltan campos obligatorios: id_paciente, fecha_agendada, hora, id_servicio",
      400,
    );
  }

  const citaExistente = await repo.findCitaExistente(fecha_agendada, hora);

  if (citaExistente) {
    throw new AppError("Ya existe una cita en ese horario", 400);
  }

  const id = await repo.createCita({
    id_paciente,
    fecha_agendada,
    hora,
    id_servicio,
    estado,
    motivo,
  });

  return { id };
};

exports.updateCita = async (id, data) => {
  if (!id || isNaN(id)) {
    throw new AppError("ID de cita inválido", 400);
  }

  const citaActual = await repo.getCitaById(id);

  if (!citaActual) {
    throw new AppError("Cita no encontrada", 404);
  }

  if (citaActual.estado === "cancelada") {
    throw new AppError("No se puede modificar una cita cancelada", 400);
  }

  const cleanedData = {};

  for (const key in data) {
    if (data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      cleanedData[key] = data[key];
    }
  }

  if (Object.keys(cleanedData).length === 0) {
    throw new AppError("No hay campos para actualizar", 400);
  }

  if ((cleanedData.fecha_agendada || cleanedData.hora) && !cleanedData.motivo) {
    throw new AppError("Debe proporcionar un motivo al reagendar la cita", 400);
  }

  if (cleanedData.fecha_agendada || cleanedData.hora) {
    const nuevaFecha = cleanedData.fecha_agendada || citaActual.fecha_agendada;

    const nuevaHora = cleanedData.hora || citaActual.hora;

    const ahoraMexico = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
    );

    const fechaActual = ahoraMexico.toLocaleDateString("en-CA");

    const horaActual = ahoraMexico.toTimeString().slice(0, 5);

    if (
      nuevaFecha < fechaActual ||
      (nuevaFecha === fechaActual && nuevaHora < horaActual)
    ) {
      throw new AppError(
        "No se puede reagendar una cita a una fecha u hora pasada",
        400,
      );
    }

    const servicio = await servicioRepo.getServicioById(citaActual.id_servicio);

    const citasDelDia = await repo.getCitasDelDia(nuevaFecha);

    const nuevaInicio = timeToMinutes(nuevaHora);

    const nuevaFin = nuevaInicio + durationToMinutes(servicio.duracion);

    for (const cita of citasDelDia) {
      if (cita.id_cita === Number(id)) {
        continue;
      }

      const existenteInicio = timeToMinutes(cita.hora);

      const existenteFin = existenteInicio + durationToMinutes(cita.duracion);

      const hayConflicto = nuevaInicio < existenteFin && nuevaFin > existenteInicio;

      if (hayConflicto) {
        throw new AppError("Ese horario se traslapa con otra cita", 400);
      }
    }

    cleanedData.recordatorio_enviado = false;
  }
  await repo.updateCita(id, cleanedData);

  if (cleanedData.fecha_agendada || cleanedData.hora) {
    try {
      const datos = await repo.getDatosWhatsAppCita(id);

      if (datos?.telefono) {
        const fechaFormateada = new Date(
          datos.fecha_agendada,
        ).toLocaleDateString("es-MX");

        const horaFormateada = new Date(
          `1970-01-01T${datos.hora}`,
        ).toLocaleTimeString("es-MX", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        await sendTemplateMessage(datos.telefono, "reprogramada_cita", [
          datos.nombre_usuario,
          "Clínica Dental Dentissa",
          fechaFormateada,
          horaFormateada,
        ]);

        console.log(`WhatsApp de reprogramación enviado para cita ${id}`);
      }
    } catch (error) {
      console.error("ERROR WHATSAPP:", error.response?.data || error.message);
    }
  }

  return {
    message: "Cita actualizada correctamente",
  };
};

exports.deleteCita = async (id) => {
  if (!id || isNaN(id)) throw new AppError("ID de cita inválido", 400);

  await repo.deleteCita(id);
  return { message: "Cita eliminada correctamente" };
};
exports.getCitasPorPeriodo = async (tipo) => {
  const tiposValidos = ["diaria", "semanal", "mensual"];

  if (!tiposValidos.includes(tipo)) {
    throw new AppError("Tipo de filtro inválido", 400);
  }

  return await repo.getCitasPorPeriodo(tipo);
};
exports.cancelarCita = async (id, motivo) => {
  if (!id || isNaN(id)) {
    throw new AppError("ID de cita inválido", 400);
  }

  if (!motivo) {
    throw new AppError("Debe proporcionar un motivo para cancelar", 400);
  }

  const cita = await repo.getCitaById(id);

  if (!cita) {
    throw new AppError("Cita no encontrada", 404);
  }

  if (cita.estado === "cancelada") {
    throw new AppError("La cita ya está cancelada", 400);
  }

  await repo.updateCita(id, {
    estado: "cancelada",
    motivo,
  });

  try {
    const datos = await repo.getDatosWhatsAppCita(id);

    if (datos?.telefono) {
      const fechaFormateada = new Date(datos.fecha_agendada).toLocaleDateString(
        "es-MX",
      );

      await sendTemplateMessage(datos.telefono, "cancelada_cita", [
        datos.nombre_usuario,
        fechaFormateada,
      ]);

      console.log(`WhatsApp de cancelación enviado para cita ${id}`);
    }
  } catch (error) {
    console.error("ERROR WHATSAPP:", error.response?.data || error.message);
  }

  return {
    message: "Cita cancelada correctamente",
  };
};

exports.getMisCitas = async (id_paciente) => {
  if (!id_paciente || isNaN(id_paciente)) {
    throw new AppError("ID de paciente inválido", 400);
  }

  const citas = await repo.getMisCitas(id_paciente);

  return citas.map((c) => ({
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
  }));
};
exports.createCitaPaciente = async (data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No se recibieron datos", 400);
  }

  const { id_paciente, fecha_agendada, hora, id_servicio } = data;

  if (!id_paciente || !fecha_agendada || !hora || !id_servicio) {
    throw new AppError("Faltan campos obligatorios", 400);
  }

  const ahoraMexico = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
  );
  const fechaActual = ahoraMexico.toLocaleDateString("en-CA");

  const horaActual = ahoraMexico.toTimeString().slice(0, 5);

  if (
    fecha_agendada < fechaActual ||
    (fecha_agendada === fechaActual && hora < horaActual)
  ) {
    throw new AppError(
      "No se puede agendar una cita en una fecha u hora pasada",
      400,
    );
  }

  const servicio = await servicioRepo.getServicioById(id_servicio);

  const citasDelDia = await repo.getCitasDelDia(fecha_agendada);

  const nuevaInicio = timeToMinutes(hora);

  const nuevaFin = nuevaInicio + durationToMinutes(servicio.duracion);

  for (const cita of citasDelDia) {
    const existenteInicio = timeToMinutes(cita.hora);

    const existenteFin = existenteInicio + durationToMinutes(cita.duracion);

    const hayConflicto =
      nuevaInicio < existenteFin && nuevaFin > existenteInicio;

    if (hayConflicto) {
      throw new AppError("Ese horario se traslapa con otra cita", 400);
    }
  }

  const id = await repo.createCita({
    id_paciente,
    fecha_agendada,
    hora,
    id_servicio,
    estado: "pendiente",
  });

  try {
    const paciente = await repo.getPacienteWhatsApp(id_paciente);
    const servicio = await servicioRepo.getServicioById(id_servicio);

    if (paciente?.telefono) {
      await sendTemplateMessage(
        paciente.telefono,
        "appointment_confirmation_1",
        [
          paciente.nombre_usuario,
          "Clínica Dental Dentissa",
          servicio.nombre_servicio,
          fecha_agendada,
          formatearHora(hora),
        ],
      );
    }
  } catch (error) {
    console.error("ERROR WHATSAPP:", error.response?.data || error.message);
  }
  return { id };
};

exports.getProximaCita = async (idUsuario) => {
  const paciente = await pacienteRepo.findByUserId(idUsuario);

  if (!paciente) {
    throw new AppError("Paciente no encontrado.", 404);
  }

  return await repo.getProximaCita(paciente.id_paciente);
};
