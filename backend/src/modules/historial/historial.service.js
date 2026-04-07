const repo = require('./historial.repository');
const {pool} = require('../../config/db');

exports.crearDesdeCita = async (idCita, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const cita = await repo.getCitaPendiente(idCita, connection);

    if (!cita) {
      throw new Error('La cita no existe');
    }

    if (cita.estado !== 'pendiente') {
      throw new Error('La cita ya fue procesada');
    }

    const historial = await repo.crearHistorial(connection, {
      id_paciente: cita.id_paciente,
      fecha: cita.fecha_agendada,
      servicio: cita.servicio_realizado,
      diagnostico: data.diagnostico,
      observaciones: data.observaciones
    });

    await repo.finalizarCita(connection, idCita);

    await connection.commit();

    return historial;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.obtenerDatosFormulario = async (idCita) => {
  const cita = await repo.getCitaPendiente(idCita);

  if (!cita) {
    throw new Error('Cita no encontrada');
  }

  return cita;
};
exports.getHistoriales = async () => {
  return await repo.getHistoriales();
};