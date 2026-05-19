const repo = require('./images.repository');
const PasswordHash = require('../../utils/PasswordHash');
const AppError = require('../../utils/AppError');

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
  await repo.updateImagen(id, {
    ...data
  });

  return await repo.getImagenById(id);
};

exports.deleteImagen = async (id) => {
  await repo.deleteImagen(id);
  return { message: 'Imagen eliminada correctamente' };
};

 