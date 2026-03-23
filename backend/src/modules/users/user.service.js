const repo = require('./user.repository');
const PasswordHash = require('../../utils/PasswordHash');

exports.getUsuarios = async () => {
  const usuarios = await repo.getUsuarios();

  return usuarios.map(u => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
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
    throw new Error('Usuario no encontrado');
  }

  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
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
    throw new Error('No hay campos para actualizar');
  }

  await repo.updateUsuario(id, cleanedData);

  return { message: 'Usuario actualizado correctamente' };
};

exports.deleteUsuario = async (id) => {
  await repo.deleteUsuario(id);

  return { message: 'Usuario eliminado correctamente' };
};