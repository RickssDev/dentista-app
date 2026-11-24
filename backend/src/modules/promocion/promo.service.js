const repo = require('./promo.repository');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');

const rutaSubida = (file) => (file ? `/uploads/${file.filename}` : null);

// Si el alta o la edición fallan antes de guardarse, la foto que multer ya escribió se borra para
// no dejarla huérfana; nunca la que ya referencia la base (ficha 2026-11-23-fix-foto-huerfana-promociones)
const borrarSubidaSiFalla = async (file, operacion) => {
  try {
    return await operacion();
  } catch (error) {
    if (file) await borrarArchivo(rutaSubida(file));
    throw error;
  }
};

exports.createPromocion = async (data, file) => borrarSubidaSiFalla(file, async () => {
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

    const imagen = rutaSubida(file);

    return await repo.createPromocion({
      id_servicio,
      nombre_promocion,
      imagen,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado
    });
});

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
  // Lo anterior al guardado: si falla, se borra la foto subida (no la anterior)
  const exists = await borrarSubidaSiFalla(file, async () => {
    const actual = await repo.getPromocionById(id);

    if (!actual) {
      throw new AppError('Promoción no encontrada', 404);
    }

    const cambios = { ...data };
    delete cambios.imagen;

    if (cambios.estado && !['activo', 'inactivo'].includes(cambios.estado)) {
      throw new AppError('Estado inválido', 400);
    }

    if (file) {
      cambios.imagen = rutaSubida(file);
    }

    await repo.updatePromocion(id, cambios);
    return actual;
  });

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