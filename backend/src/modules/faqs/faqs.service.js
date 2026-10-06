const repo = require('./faqs.repository');
const AppError = require('../../utils/AppError');

exports.createFaqs = async (data, file) => {
  const {
    pregunta,
    respuesta
  } = data;

  if (!pregunta || !respuesta) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  return await repo.createFaqs({
   pregunta,
   respuesta
  });
};

exports.getFaqs = async () => {
  return await repo.getFaqs();
};

exports.getFaqsById = async (id) => {
  const faq = await repo.getFaqsById(id);

  if (!faq) {
    throw new AppError('Pregunta no encontrada', 404);
  }

  return faq;
};

exports.updateFaqs = async (id, data) => {
  const { pregunta, respuesta } = data;

  if (!pregunta || !respuesta) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  const exists = await repo.getFaqsById(id);

  if (!exists) {
    throw new AppError('Pregunta no encontrada', 404);
  }

  await repo.updateFaqs(id, { pregunta, respuesta });

  return await repo.getFaqsById(id);
};

exports.deleteFaqs = async (id) => {
  const exists = await repo.getFaqsById(id);

  if (!exists) {
    throw new AppError('Pregunta no encontrada', 404);
  }

  await repo.deleteFaqs(id);

  return {
    message: 'Pregunta eliminada correctamente'
  };
};