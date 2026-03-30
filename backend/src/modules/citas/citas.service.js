const repo = require("./citas.repository");

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
  if (!c) throw new Error("Cita no encontrada");

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
  if (!estado) throw new Error("Estado requerido");

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
  if (!id_paciente || isNaN(id_paciente)) throw new Error("ID de paciente inválido");

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
  if (!data || Object.keys(data).length === 0) throw new Error("No se recibieron datos");

  const { id_paciente, fecha_agendada, hora, id_servicio, estado = "pendiente", motivo } = data;

  if (!id_paciente || !fecha_agendada || !hora || !id_servicio) {
    throw new Error("Faltan campos obligatorios: id_paciente, fecha_agendada, hora, id_servicio");
  }

 const citaExistente = await repo.findCitaExistente(fecha_agendada, hora);

  if (citaExistente) {
    throw new Error("Ya existe una cita en ese horario");
  }

  const id = await repo.createCita({ id_paciente, fecha_agendada, hora, id_servicio, estado, motivo });

  return { id };
};

exports.updateCita = async (id, data) => {
  if (!id || isNaN(id)) throw new Error("ID de cita inválido");

  const cleanedData = {};
  for (const key in data) {
    if (data[key] !== "" && data[key] !== undefined && data[key] !== null) {
      cleanedData[key] = data[key];
    }
  }

  if (Object.keys(cleanedData).length === 0) throw new Error("No hay campos para actualizar");

  if ((cleanedData.fecha_agendada || cleanedData.hora) && !cleanedData.motivo) {
  throw new Error("Debe proporcionar un motivo al reagendar la cita");
}

if (cleanedData.fecha_agendada || cleanedData.hora) {
    const citaActual = await repo.getCitaById(id);

    const nuevaFecha = cleanedData.fecha_agendada || citaActual.fecha_agendada;
    const nuevaHora = cleanedData.hora || citaActual.hora;
    const citaExistente = await repo.findCitaExistente(nuevaFecha, nuevaHora);

    if (citaExistente && citaExistente.id_cita !== id) {
      throw new Error("Ese horario ya está ocupado");
    }
  }
  
  await repo.updateCita(id, cleanedData);
  return { message: "Cita actualizada correctamente" };
};

exports.deleteCita = async (id) => {
  if (!id || isNaN(id)) throw new Error("ID de cita inválido");

  await repo.deleteCita(id);
  return { message: "Cita eliminada correctamente" };
};
exports.getCitasPorPeriodo = async (tipo) => {
  const tiposValidos = ['diaria', 'semanal', 'mensual'];

  if (!tiposValidos.includes(tipo)) {
    throw new Error('Tipo de filtro inválido');
  }

  return await repo.getCitasPorPeriodo(tipo);
};

