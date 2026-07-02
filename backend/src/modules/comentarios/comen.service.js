const comentarioRepo = require("./comen.repository");
const citaRepo = require("../citas/citas.repository");
const AppError = require("../../utils/AppError");

exports.getComentarios = async () => {
  return await comentarioRepo.getComentarios();
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

exports.createComentario = async (data) => {
  const { comentario, calificacion, id_cita } = data;

  if (!comentario || !calificacion || !id_cita) {
    throw new AppError("Faltan campos obligatorios", 400);
  }
  const cita = await citaRepo.getCitaById(id_cita);

  if (!cita) {
    throw new AppError("La cita no existe", 404);
  }

  if (cita.estado !== "completada") {
    throw new AppError("Solo se pueden comentar citas completadas", 400);
  }

  const existingComment = await comentarioRepo.getComentarioByCita(id_cita);

  if (existingComment) {
    throw new AppError("La cita ya tiene una reseña", 400);
  }
  if (calificacion < 1 || calificacion > 5) {
    throw new AppError("La calificación debe estar entre 1 y 5", 400);
  }
  const id = await comentarioRepo.createComentario(data);

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