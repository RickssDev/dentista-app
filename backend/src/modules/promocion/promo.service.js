const repo = require('./promo.repository');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');

exports.createPromocion = async (data, file) => {
  const {
    id_servicio,
    nombre_promocion,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado = 'activo'
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

  const cambios = { ...data };
  delete cambios.imagen;

  if (cambios.estado && !['activo', 'inactivo'].includes(cambios.estado)) {
    throw new AppError('Estado inválido', 400);
  }

  if (file) {
    cambios.imagen = `/uploads/${file.filename}`;
  }

  await repo.updatePromocion(id, cambios);

  if (file && exists.imagen) {
    await borrarArchivo(exists.imagen);
  }

  return await repo.getPromocionById(id);
};

exports.deletePromocion = async (id) => {
  const exists = await repo.getPromocionById(id);

  if (!exists) {
    throw new AppError('Promoción no encontrada', 404);
  }

  await repo.deletePromocion(id);
  await borrarArchivo(exists.imagen);

  return {
    message: 'Promoción eliminada correctamente'
  };
};

exports.getPromocionPublicos = async () => {
  return await repo.getPromocionPublicos();
};