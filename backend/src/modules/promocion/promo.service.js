const repo = require('./promo.repository');

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
    throw new Error('Todos los campos son obligatorios');
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
    throw new Error('Promoción no encontrada');
  }

  return promocion;
};

exports.updatePromocion = async (id, data, file) => {
  const exists = await repo.getPromocionById(id);

  if (!exists) {
    throw new Error('Promoción no encontrada');
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
    throw new Error('Promoción no encontrada');
  }

  await repo.deletePromocion(id);

  return {
    message: 'Promoción eliminada correctamente'
  };
};