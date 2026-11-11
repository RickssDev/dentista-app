const repo = require("./citas.repository");
const AppError = require("../../utils/AppError");
const { sendTemplateMessage, whatsappActivo } = require("../../services/whatp.service");
const servicioRepo = require("../servicios/servicios.repository");
const pacienteRepo = require("../pacientes/pacientes.repository");

const CAMPOS_EDITABLES = ["fecha_agendada", "hora", "motivo"];

const timeToMinutes = (time) => {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
};

const durationToMinutes = (duration) => {
  const [h, m] = duration.split(":");
  return Number(h) * 60 + Number(m);
};

// Horario de atención: lunes a viernes de 8 a 16, sábado de 8 a 14, domingo cerrado (null).
const jornadaLaboral = (fecha) => {
  const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();

  if (diaSemana === 0) {
    return null;
  }

  return { inicio: 8 * 60, fin: (diaSemana === 6 ? 14 : 16) * 60 };
};

// La cita del paciente debe empezar y terminar dentro del horario de atención (005 CA1).
const validarHorarioDeAtencion = (fecha, hora, duracion) => {
  const dia = new Date(`${fecha}T00:00:00Z`);
  // Una fecha imposible (2030-02-31) se recorre al mes siguiente: se compara de vuelta
  const esFechaValida =
    !Number.isNaN(dia.getTime()) && dia.toISOString().slice(0, 10) === fecha;
  const jornada = esFechaValida ? jornadaLaboral(fecha) : null;
  const esHoraValida =
    typeof hora === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora);
  const inicio = esHoraValida ? timeToMinutes(hora) : NaN;

  if (
    !jornada ||
    !Number.isFinite(inicio) ||
    inicio < jornada.inicio ||
    inicio + duracion > jornada.fin
  ) {
    throw new AppError("El horario elegido está fuera del horario de atención", 400);
  }
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

    if (whatsappActivo()) console.log(`WhatsApp de confirmación enviado para cita ${id}`);
  }
} catch (error) {
  console.error(
    "ERROR WHATSAPP:",
    error.response?.data || error.message,
  );
}
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

  for (const key of CAMPOS_EDITABLES) {
    const valor = data?.[key];

    if (valor !== "" && valor !== undefined && valor !== null) {
      cleanedData[key] = valor;
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

        if (whatsappActivo()) console.log(`WhatsApp de reprogramación enviado para cita ${id}`);
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

  try {
    await repo.deleteCita(id);
  } catch (error) {
    // Otra tabla apunta a la cita (comentarios, registros): MySQL lo impide con el error 1451
    if (error.errno === 1451 || error.code === "ER_ROW_IS_REFERENCED_2") {
      throw new AppError(
        "La cita tiene información asociada y no se puede eliminar; cancélala en su lugar",
        409,
      );
    }
    throw error;
  }
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

      if (whatsappActivo()) console.log(`WhatsApp de cancelación enviado para cita ${id}`);
    }
  } catch (error) {
    console.error("ERROR WHATSAPP:", error.response?.data || error.message);
  }

  return {
    message: "Cita cancelada correctamente",
  };
};

exports.getMisCitas = async (idUsuario) => {
  if (!idUsuario || isNaN(idUsuario)) {
    throw new AppError("ID de usuario inválido", 400);
  }

  const paciente = await pacienteRepo.findByUserId(idUsuario);

  if (!paciente) {
    return [];
  }

  const citas = await repo.getMisCitas(paciente.id_paciente);

  return citas.map((c) => ({
    id: c.id_cita,
    fecha_agendada: c.fecha_agendada,
    hora: c.hora,
    nombre_servicio: c.nombre_servicio,
    estado: c.estado,
    motivo: c.motivo,
    comentado: Boolean(c.comentado),
  }));
};
exports.createCitaPaciente = async (idUsuario, data) => {
  if (!data || Object.keys(data).length === 0) {
    throw new AppError("No se recibieron datos", 400);
  }

  const {fecha_agendada, hora, id_servicio } = data;

  if (!fecha_agendada || !hora || !id_servicio) {
    throw new AppError("Faltan campos obligatorios", 400);
  }

const paciente = await pacienteRepo.findByUserId(idUsuario);

  if (!paciente) {
    throw new AppError(
      "Debe completar su perfil antes de realizar su cita",
      404
    );
  }

  const id_paciente = paciente.id_paciente;

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

  validarHorarioDeAtencion(fecha_agendada, hora, durationToMinutes(servicio.duracion));

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
    return null;
  }

  // Fecha y hora actuales de México, sin depender de la zona horaria de MySQL
  const ahora = new Date();
  const zona = "America/Mexico_City";
  const fechaHoy = ahora.toLocaleDateString("en-CA", { timeZone: zona });
  const horaAhora = ahora.toLocaleTimeString("en-GB", {
    timeZone: zona,
    hourCycle: "h23",
  });

  return await repo.getProximaCita(paciente.id_paciente, fechaHoy, horaAhora);
};
exports.getHorariosDisponibles = async (fecha, id_servicio) => {
  if (!fecha || !id_servicio) {
    throw new AppError("Fecha e id del servicio son obligatorios", 400);
  }

  const servicio = await servicioRepo.getServicioById(id_servicio);

  if (!servicio) {
    throw new AppError("Servicio no encontrado", 404);
  }

  const duracion = durationToMinutes(servicio.duracion);

  const citasDelDia = await repo.getCitasDelDia(fecha);

  const horariosDisponibles = [];

  const jornada = jornadaLaboral(fecha);

  if (!jornada) {
    return [];
  }

  const inicioLaboral = jornada.inicio;
  const finLaboral = jornada.fin;

  let inicio = inicioLaboral;
  const hoy = new Date();

const opciones = {
  timeZone: "America/Mexico_City",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const horaMexico = new Intl.DateTimeFormat("es-MX", opciones).formatToParts(hoy);

const horaActual = Number(
  horaMexico.find((parte) => parte.type === "hour").value
);

const minutosActuales = Number(
  horaMexico.find((parte) => parte.type === "minute").value
);

const fechaMexico = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
}).format(hoy);

if (fecha === fechaMexico) {
  inicio = Math.ceil((horaActual * 60 + minutosActuales) / 60) * 60;

  if (inicio < inicioLaboral) {
    inicio = inicioLaboral;
  }
}

  // Intervalos cada hora
  for (
  ; inicio + duracion <= finLaboral;
  inicio += 60
  ) {
    const fin = inicio + duracion;

    const ocupado = citasDelDia.some((cita) => {
      const inicioExistente = timeToMinutes(cita.hora);
      const finExistente =
        inicioExistente + durationToMinutes(cita.duracion);

      return inicio < finExistente && fin > inicioExistente;
    });

    if (!ocupado) {
      const hora = String(Math.floor(inicio / 60)).padStart(2, "0");
      const minutos = String(inicio % 60).padStart(2, "0");

      horariosDisponibles.push(`${hora}:${minutos}`);
    }
  }

  return horariosDisponibles;
};

const obtenerCitaPropia = async (idUsuario, idCita) => {
  if (!idCita || isNaN(idCita)) {
    throw new AppError("ID de cita inválido", 400);
  }
 
  const cita = await repo.getCitaConUsuario(idCita);
 
  if (!cita || Number(cita.id_usuario) !== Number(idUsuario)) {
    throw new AppError("Cita no encontrada", 404);
  }
 
  if (cita.estado !== "pendiente") {
    throw new AppError("Solo puedes modificar citas pendientes", 400);
  }
 
  return cita;
};
 
exports.updateMiCita = async (idUsuario, id, data = {}) => {
  await obtenerCitaPropia(idUsuario, id);
 
  const { fecha_agendada, hora, motivo } = data;
 
  if (!fecha_agendada || !hora) {
    throw new AppError("La fecha y la hora son obligatorias", 400);
  }

  // Solo el paciente queda limitado al horario de atención; el personal no (spec 006)
  const cita = await repo.getCitaById(id);
  const servicio = await servicioRepo.getServicioById(cita.id_servicio);
  validarHorarioDeAtencion(fecha_agendada, hora, durationToMinutes(servicio.duracion));

  // Solo se aceptan estos tres campos; cualquier otro del body se ignora
  return exports.updateCita(id, { fecha_agendada, hora, motivo });
};
 
exports.cancelarMiCita = async (idUsuario, id, motivo) => {
  await obtenerCitaPropia(idUsuario, id);
 
  return exports.cancelarCita(id, motivo);
};
