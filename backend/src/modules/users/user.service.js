const repo = require('./user.repository');
const PasswordHash = require('../../utils/PasswordHash');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');


exports.getUsuarios = async () => {
  const usuarios = await repo.getUsuarios();

  return usuarios.map(u => ({
    id: u.id,
    nombre: u.nombre,
    telefono: u.telefono,
    apellido: u.apellido,
    email: u.email,
    imagen: u.imagen,
    estado: u.estado,
    rol: {
      id: u.rol_id,
      nombre: u.rol_nombre
    }
  }));
};

exports.getUsuarioById = async (id) => {
  const u = await repo.getUsuarioById(id);

  if (!u) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return {
    id: u.id,
    nombre: u.nombre_usuario,
    telefono: u.telefono,
    apellido: u.apellido,
    email: u.correo,
    imagen: u.imagen,
    estado: u.estado,
    rol: {
      id: u.rol_id,
      nombre: u.rol_nombre
    }
  };
};
 
exports.createUsuario = async (data) => {

  const hashedPassword = await PasswordHash.apply(data.password);
  const newData = { ...data, password: hashedPassword, imagen: data.imagen };

  const id = await repo.createUsuario(newData);

  return { id };
};

exports.updateUsuario = async (id, data) => {

const exists = await repo.getUsuarioById(id);

  if (!exists) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const cleanedData = {};
  for (const key in data) {
    if (
      data[key] !== '' &&
      data[key] !== undefined &&
      data[key] !== null
    ) {
      cleanedData[key] = data[key];
    }
  }

  if (cleanedData.password) {
    cleanedData.password = await PasswordHash.apply(cleanedData.password);
  }

  if (Object.keys(cleanedData).length === 0) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  await repo.updateUsuario(id, cleanedData);
  if (cleanedData.imagen && cleanedData.imagen !== exists.imagen) {
    await borrarArchivo(exists.imagen);
  }

  return await repo.getUsuarioById(id);
  };

exports.deleteUsuario = async (id) => {
  const exists = await repo.getUsuarioById(id);

  if (!exists) {
    throw new AppError('Usuario no encontrado', 404);
  }

  await repo.deleteUsuario(id);
  await borrarArchivo(exists.imagen);
  
    return { message: 'Imagen eliminada correctamente' };
};