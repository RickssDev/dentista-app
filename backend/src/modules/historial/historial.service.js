const repo = require("./historial.repository");
const { pool } = require("../../config/db");
const AppError = require("../../utils/AppError");

exports.crearDesdeCita = async (idCita, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const cita = await repo.getCitaPendiente(idCita, connection);

    if (!cita) {
      throw new AppError("La cita no existe", 404);
    }

    if (cita.estado !== "pendiente") {
      throw new AppError("La cita ya fue procesada", 400);
    }

    const historial = await repo.crearHistorial(connection, {
      id_paciente: cita.id_paciente,
      fecha: cita.fecha_agendada,
      servicio: cita.servicio_realizado,
      diagnostico: data.diagnostico,
      observaciones: data.observaciones,
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
    throw new AppError("Cita no encontrada", 404);
  }
  return cita;
};

exports.getHistorialById = async (idHistorial) => {
  const historial = await repo.getHistorialById(idHistorial);

  if (!historial) {
    throw new AppError("Historial no encontrado", 404);
  }

  return historial;
};

exports.getHistoriales = async () => {
  return await repo.getHistoriales();
};

exports.actualizarHistorial = async (idHistorial, data) => {
  const client = await pool.getConnection();

  try {
    await client.beginTransaction();

    const historial = await repo.getHistorialById(idHistorial, client);

    if (!historial) {
      throw new AppError("Historial no encontrado", 404);
    }

    const datosActualizados = {
      fecha: data.fecha ?? historial.fecha,
      servicio: data.servicio ?? historial.servicio,
      diagnostico: data.diagnostico ?? historial.diagnostico,
      observaciones: data.observaciones ?? historial.observaciones,
    };

    await repo.actualizarHistorial(client, idHistorial, datosActualizados);

    await client.commit();

    return {
      message: "Historial actualizado correctamente",
    };
  } catch (error) {
    await client.rollback();
    throw error;
  } finally {
    client.release();
  }
};

