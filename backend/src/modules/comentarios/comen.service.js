const comentarioRepo = require("./comen.repository");
const citaRepo = require("../citas/citas.repository");
const AppError = require("../../utils/AppError");

exports.getComentarios = async (estado = "todos") => {
  return await comentarioRepo.getComentarios(estado);
};

exports.getComentarioById = async (id) => {
  const comentario = await comentarioRepo.getComentarioById(id);

  if (!comentario) {
    throw new AppError("Comentario no encontrado", 404);
  }

  return comentario;
};

exports.getComentariosPublicos = async () => {
  return await comentarioRepo.getComentariosPublicos();
};

exports.createComentario = async (data, usuario) => {
  const { comentario, calificacion, id_cita } = data;

  if (!comentario || !calificacion || !id_cita) {
    throw new AppError("Faltan campos obligatorios", 400);
  }

  // Un objeto, una lista o un texto no numérico llegaría a MySQL y respondería 500
  const esEntero = (valor) =>
    (typeof valor === "number" || typeof valor === "string") &&
    Number.isInteger(Number(valor));

  if (typeof comentario !== "string") {
    throw new AppError("El comentario debe ser texto", 400);
  }

  if (!esEntero(calificacion)) {
    throw new AppError("La calificación debe ser un número entero entre 1 y 5", 400);
  }

  if (!esEntero(id_cita) || Number(id_cita) < 1) {
    throw new AppError("La cita no es válida", 400);
  }

  const cita = await citaRepo.getCitaConUsuario(id_cita);

  if (!cita) {
    throw new AppError("La cita no existe", 404);
  }

  if (Number(cita.id_usuario) !== Number(usuario.id)) {
    throw new AppError("No puedes comentar una cita que no es tuya", 403);
  }

  if (cita.estado !== "completada") {
    throw new AppError("Solo se pueden comentar citas completadas", 400);
  }

  const existingComment = await comentarioRepo.getComentarioByCita(id_cita);

  if (existingComment) {
    throw new AppError("La cita ya tiene una reseña", 400);
  }

  if (Number(calificacion) < 1 || Number(calificacion) > 5) {
    throw new AppError("La calificación debe estar entre 1 y 5", 400);
  }

  const id = await comentarioRepo.createComentario({
    comentario,
    calificacion: Number(calificacion),
    id_cita: Number(id_cita),
  });

  return { id };
};

exports.replyComentario = async (id, respuesta_admin) => {
  const comentario = await comentarioRepo.getComentarioById(id);

  if (!comentario) {
    throw new AppError("Comentario no encontrado", 404);
  }

  await comentarioRepo.replyComentario(id, respuesta_admin);

  return {
    message: "Respuesta registrada correctamente",
  };
};

exports.updateEstadoComentario = async (id, estado) => {
  const comentario = await comentarioRepo.getComentarioById(id);

  if (!comentario) {
    throw new AppError("Comentario no encontrado", 404);
  }

  const estadosValidos = ["visible", "oculto"];

  if (!estadosValidos.includes(estado)) {
    throw new AppError("Estado inválido", 400);
  }

  await comentarioRepo.updateEstadoComentario(id, estado);

  return {
    message: "Estado actualizado correctamente",
  };
};

exports.deleteComentario = async (id) => {
  const comentario = await comentarioRepo.getComentarioById(id);

  if (!comentario) {
    throw new AppError("Comentario no encontrado", 404);
  }

  await comentarioRepo.deleteComentario(id);

  return {
    message: "Comentario eliminado correctamente",
  };
};
