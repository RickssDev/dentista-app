const repo = require('./images.repository');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');

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

exports.createImagen = async (data, file) => {
  const {
    titulo,
    imagen,
    visible
  } = data;

  if (!titulo || !imagen || visible === undefined) {
    throw new AppError('Todos los campos son obligatorios', 400);
  }

  return await repo.createImagen({
   titulo,
   imagen: data.imagen,
   visible
  });
};

exports.updateImagen = async (id, data) => {
  const exists = await repo.getImagenById(id);

  if (!exists) {
    throw new AppError('Imagen no encontrada', 404);
  }

  if (!data.titulo && !data.imagen && data.visible === undefined) {
  throw new AppError('No hay campos para actualizar', 400);
}

  await repo.updateImagen(id, { ...data });
  
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