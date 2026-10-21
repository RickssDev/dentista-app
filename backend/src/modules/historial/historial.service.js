const bcrypt = require("bcrypt"); 
const crypto = require("crypto");
const repo = require("./historial.repository");
const { pool } = require("../../config/db");
const AppError = require("../../utils/AppError");

exports.crearDesdeCita = async (idCita, data) => {
  if (!data.diagnostico?.trim()) {
  throw new AppError("El diagnóstico es obligatorio", 400);
}

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
      diagnostico: data.diagnostico.trim(),
      observaciones: data.observaciones?.trim() || null,
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
  if (data.servicio !== undefined && !data.servicio?.trim()) {
    throw new AppError("El servicio no puede estar vacío", 400);
  }

  if (data.diagnostico !== undefined && !data.diagnostico?.trim()) {
    throw new AppError("El diagnóstico no puede estar vacío", 400);
  }

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

exports.getHistorialPaciente = async (idPaciente) => {
  const paciente = await repo.getPacientePerfil(idPaciente);

  if (!paciente) {
    throw new AppError("Paciente no encontrado", 404);
  }

  const consultas = await repo.getConsultasByPaciente(idPaciente);
  return { paciente, consultas };
};


exports.getServicios = async () => {
  return await repo.getServiciosDisponibles();
};

const GENEROS = ["masculino", "femenino", "otro"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^[\d\s+()-]{7,20}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v) => (typeof v === "string" ? v.trim() : "");

const esFechaValida = (v) =>
  FECHA_RE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());

exports.registrarPaciente = async (data = {}) => {
  const nombre = texto(data.nombre);
  const apellido = texto(data.apellido);
  const correo = texto(data.correo).toLowerCase();
  const telefono = texto(data.telefono) || null;
  const direccion = texto(data.direccion) || null;
  const fechaNacimiento = texto(data.fecha_nacimiento) || null;
  const genero = texto(data.genero) || null;

  if (!nombre || !apellido) {
    throw new AppError("El nombre y el apellido son obligatorios", 400);
  }
  if (nombre.length > 55 || apellido.length > 55) {
    throw new AppError("El nombre y el apellido admiten máximo 55 caracteres", 400);
  }
  if (!correo || !EMAIL_RE.test(correo) || correo.length > 100) {
    throw new AppError("Ingresa un correo válido", 400);
  }
  if (telefono && !TEL_RE.test(telefono)) {
    throw new AppError("El teléfono no es válido", 400);
  }
  if (direccion && direccion.length > 400) {
    throw new AppError("La dirección admite máximo 400 caracteres", 400);
  }
  if (genero && !GENEROS.includes(genero)) {
    throw new AppError("El género no es válido", 400);
  }
  if (fechaNacimiento) {
    if (!esFechaValida(fechaNacimiento)) {
      throw new AppError("La fecha de nacimiento no es válida", 400);
    }
    if (new Date(`${fechaNacimiento}T00:00:00Z`) > new Date()) {
      throw new AppError("La fecha de nacimiento no puede ser futura", 400);
    }
  }

  let consulta = null;
  if (data.consulta) {
    const fecha = texto(data.consulta.fecha);
    const servicio = texto(data.consulta.servicio);
    const diagnostico = texto(data.consulta.diagnostico);

    if (!esFechaValida(fecha)) {
      throw new AppError("La fecha de la consulta no es válida", 400);
    }
    if (!servicio) {
      throw new AppError("El servicio de la consulta es obligatorio", 400);
    }
    if (!diagnostico) {
      throw new AppError("El diagnóstico es obligatorio", 400);
    }

    consulta = {
      fecha,
      servicio,
      diagnostico,
      observaciones: texto(data.consulta.observaciones) || null,
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (await repo.correoExiste(connection, correo)) {
      throw new AppError("Ya existe un usuario registrado con ese correo", 409);
    }

    if (consulta && !(await repo.servicioExiste(connection, consulta.servicio))) {
      throw new AppError("El servicio seleccionado no es válido", 400);
    }

    const idRol = await repo.getIdRolPaciente(connection);
    if (!idRol) {
      throw new AppError("No se encontró el rol de paciente en el sistema", 500);
    }


    const passwordHash = await bcrypt.hash(
      crypto.randomBytes(24).toString("hex"),
      10
    );

    const idUsuario = await repo.crearUsuarioPaciente(connection, {
      nombre,
      apellido,
      telefono,
      correo,
      passwordHash,
      id_rol: idRol,
    });

    const idPaciente = await repo.crearPaciente(connection, {
      direccion,
      fecha_nacimiento: fechaNacimiento,
      genero,
      id_usuario: idUsuario,
    });

    let historial = null;
    if (consulta) {
      historial = await repo.crearHistorial(connection, {
        id_paciente: idPaciente,
        ...consulta,
      });
    }

    await connection.commit();

    return {
      id_usuario: idUsuario,
      id_paciente: idPaciente,
      id_historial: historial ? historial.id_historial : null,
    };
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError("Ya existe un usuario registrado con ese correo", 409);
    }
    throw error;
  } finally {
    connection.release();
  }
};