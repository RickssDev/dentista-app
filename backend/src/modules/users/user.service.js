const repo = require('./user.repository');
const PasswordHash = require('../../utils/PasswordHash');
const AppError = require('../../utils/AppError');
const borrarArchivo = require('../../utils/borrarArchivo');
const { limpiarAlta, limpiarEdicion } = require('./user.validacion');

const CORREO_REGISTRADO = 'El correo ya está registrado';

const esCorreoDuplicado = (error) => error?.errno === 1062 || error?.code === 'ER_DUP_ENTRY';

const exigirRolExistente = async (idRol) => {
  const rol = await repo.getRolById(idRol);
  if (!rol) {
    throw new AppError('El rol no es válido', 400);
  }
};

// El aviso no revela nada de la otra cuenta (spec 021 TM5)
const exigirCorreoLibre = async (correo, idExcluido = null) => {
  const otra = await repo.findOtroUsuarioPorCorreo(correo, idExcluido);
  if (otra) {
    throw new AppError(CORREO_REGISTRADO, 400);
  }
};


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
 
// La imagen llega aparte, solo desde el archivo subido (spec 021 CA1)
exports.createUsuario = async (body, imagen = null) => {
  const datos = limpiarAlta(body);

  await exigirRolExistente(datos.id_rol);
  await exigirCorreoLibre(datos.correo);

  const password = await PasswordHash.apply(datos.password);

  try {
    const id = await repo.createUsuario({ ...datos, password, imagen });
    return { id };
  } catch (error) {
    if (esCorreoDuplicado(error)) {
      throw new AppError(CORREO_REGISTRADO, 400);
    }
    throw error;
  }
};

exports.updateUsuario = async (id, body, imagen = null) => {
  const exists = await repo.getUsuarioById(id);

  if (!exists) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const { cambios, recibidos } = limpiarEdicion(body, exists);

  if (imagen) {
    cambios.imagen = imagen;
  }

  if (recibidos === 0 && !imagen) {
    throw new AppError('No hay campos para actualizar', 400);
  }

  if (cambios.id_rol !== undefined) {
    await exigirRolExistente(cambios.id_rol);
  }

  if (cambios.correo !== undefined) {
    await exigirCorreoLibre(cambios.correo, id);
  }

  if (cambios.password) {
    cambios.password = await PasswordHash.apply(cambios.password);
  }

  // El panel reenvía todos los campos: si nada cambió, no se escribe
  if (Object.keys(cambios).length === 0) {
    return exists;
  }

  try {
    await repo.updateUsuario(id, cambios);
  } catch (error) {
    if (esCorreoDuplicado(error)) {
      throw new AppError(CORREO_REGISTRADO, 400);
    }
    throw error;
  }

  if (cambios.imagen && cambios.imagen !== exists.imagen) {
    await borrarArchivo(exists.imagen);
  }

  return await repo.getUsuarioById(id);
};

exports.deleteUsuario = async (id) => {
  const exists = await repo.getUsuarioById(id);

  if (!exists) {
    throw new AppError('Usuario no encontrado', 404);
  }

  try {
    await repo.deleteUsuario(id);
  } catch (error) {
    if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
      await repo.desactivarUsuario(id);

      return {
        desactivado: true,
        message:
          'El usuario tiene información asociada, por lo que se desactivó en lugar de eliminarse.',
      };
    }

    throw error;
  }

  await borrarArchivo(exists.imagen);

  return { desactivado: false, message: 'Usuario eliminado correctamente' };
};