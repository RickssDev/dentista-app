const repo = require('./historial.repository');
const {pool} = require('../../config/db');
const AppError = require('../../utils/AppError');

exports.crearDesdeCita = async (idCita, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const cita = await repo.getCitaPendiente(idCita, connection);

    if (!cita) {
      throw new AppError('La cita no existe', 404);
    }

    if (cita.estado !== 'pendiente') {
      throw new AppError('La cita ya fue procesada', 400);
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
    throw new AppError('Cita no encontrada', 404);
  }

  return cita;
};
exports.getHistoriales = async () => {
  return await repo.getHistoriales();
};