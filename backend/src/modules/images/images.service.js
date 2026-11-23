const repo = require('./images.repository');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');
const {
  MAX_IMAGENES_GALERIA,
  MENSAJE_GALERIA_LLENA,
  MENSAJE_GALERIA_OCUPADA,
} = require('./images.limites');

exports.getImagen = async () => {

return await repo.getImagen();
};

exports.getImagenById = async (id) => {
  const i = await repo.getImagenById(id);

  if (!i) {
    throw new AppError('Imagen no encontrada', 404);
  }

  return i;
};

// Alta con el límite de la galería (spec 029). La ruta de la imagen es la del archivo subido en esta
// petición, nunca un valor del cuerpo (TM6). Si el alta se rechaza por cualquier motivo, se borra
// ese archivo para no dejarlo huérfano en el disco (TM3, decisión del usuario /analyze A10).
exports.createImagen = async (data, rutaArchivo) => {
  try {
    const { titulo, visible } = data;

    if (!titulo || !rutaArchivo || visible === undefined) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    const resultado = await repo.crearImagenConLimite(
      { titulo, imagen: rutaArchivo, visible },
      MAX_IMAGENES_GALERIA,
    );

    if (resultado.bloqueo === false) {
      throw new AppError(MENSAJE_GALERIA_OCUPADA, 503);
    }

    if (!resultado.creada) {
      throw new AppError(MENSAJE_GALERIA_LLENA, 409);
    }

    return resultado.id;
  } catch (error) {
    if (rutaArchivo) await borrarArchivo(rutaArchivo);
    throw error;
  }
};

// `data.imagen` solo llega del archivo subido en esta petición (el controller descarta la del
// cuerpo, spec 029 TM6). Si la edición falla antes de guardarse, se borra para no dejarla huérfana
// (ficha 2026-11-23-fix-foto-huerfana-edicion-galeria).
exports.updateImagen = async (id, data) => {
  let exists;
  try {
    exists = await repo.getImagenById(id);

    if (!exists) {
      throw new AppError('Imagen no encontrada', 404);
    }

    if (!data.titulo && !data.imagen && data.visible === undefined) {
      throw new AppError('No hay campos para actualizar', 400);
    }

    await repo.updateImagen(id, { ...data });
  } catch (error) {
    if (data.imagen) await borrarArchivo(data.imagen);
    throw error;
  }

  if (data.imagen && exists.imagen && data.imagen !== exists.imagen) {
    await borrarArchivo(exists.imagen);
  }

  return await repo.getImagenById(id);
};

exports.deleteImagen = async (id) => {
  const exists = await repo.getImagenById(id);

  if (!exists) {
    throw new AppError('Imagen no encontrada', 404);
  }

  await repo.deleteImagen(id);
  await borrarArchivo(exists.imagen);

  return { message: 'Imagen eliminada correctamente' };
};

exports.getImagenesPublicas = async () => {
  return await repo.getImagenesPublicas();
};