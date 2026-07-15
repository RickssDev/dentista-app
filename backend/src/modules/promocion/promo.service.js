const repo = require('./promo.repository');
const AppError = require('../../utils/AppError');

exports.createPromocion = async (data, file) => {
  const {
    id_servicio,
    nombre_promocion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado
  } = data;

  if (!id_servicio || !nombre_promocion || !descripcion || !fecha_inicio || !fecha_fin) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  const imagen = file
    ? `/uploads/${file.filename}`
    : null;

  return await repo.createPromocion({
    id_servicio,
    nombre_promocion,
    imagen,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado
  });
};

exports.getPromocion = async () => {
  return await repo.getPromocion();
};

exports.getPromocionById = async (id) => {
  const promocion = await repo.getPromocionById(id);

  if (!promocion) {
    throw new AppError('Promoción no encontrada', 404);
  }

  return promocion;
};

exports.updatePromocion = async (id, data, file) => {
  const exists = await repo.getPromocionById(id);

  if (!exists) {
    throw new AppError('Promoción no encontrada', 404);
  }

  const imagen = file
    ? `/uploads/${file.filename}`
    : exists.imagen;

  await repo.updatePromocion(id, {
    ...data,
    imagen
  });

  return await repo.getPromocionById(id);
};

exports.deletePromocion = async (id) => {
  const exists = await repo.getPromocionById(id);

  if (!exists) {
    throw new AppError('Promoción no encontrada', 404);
  }

  await repo.deletePromocion(id);

  return {
    message: 'Promoción eliminada correctamente'
  };
};

exports.getPromocionPublicos = async () => {
  return await repo.getPromocionPublicos();
};