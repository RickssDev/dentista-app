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
  return rol;
};

const ADMINISTRADOR = 'Administrador';
const ULTIMO_ADMINISTRADOR = 'Debe quedar al menos un Administrador activo';

const esAdministradorActivo = (cuenta) =>
  cuenta.rol_nombre === ADMINISTRADOR && cuenta.estado === 'activo';

// Dentro de la transacción, con las filas bloqueadas: debe quedar otro Administrador activo
// (spec 021 CA7, CA10). La regla no exime a nadie, tampoco a quien actúa sobre su propia cuenta.
const exigirOtroAdministradorActivo = async (conn, id) => {
  const activos = await repo.bloquearAdministradoresActivos(conn);
  const otros = activos.filter((cuenta) => Number(cuenta.id_usuario) !== Number(id));

  if (otros.length === 0) {
    throw new AppError(ULTIMO_ADMINISTRADOR, 409);
  }
};

// El id de la ruta debe ser un entero positivo: "5abc" llegaría a MySQL como 5 pero a la regla
// del último Administrador como NaN (spec 021, /review R1)
const normalizarIdUsuario = (id) => {
  if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
    throw new AppError('ID de usuario inválido', 400);
  }
  return Number(id);
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

exports.updateUsuario = async (idRecibido, body, imagen = null) => {
  const id = normalizarIdUsuario(idRecibido);
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

  let rolNuevo = null;
  if (cambios.id_rol !== undefined) {
    rolNuevo = await exigirRolExistente(cambios.id_rol);
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

  // Quitarle el rol o desactivar a un Administrador activo pasa por la regla del último
  const quitaElPuesto = esAdministradorActivo(exists) && (
    cambios.estado === 'inactivo' || (rolNuevo !== null && rolNuevo.rol !== ADMINISTRADOR)
  );

  try {
    if (quitaElPuesto) {
      await repo.conTransaccion(async (conn) => {
        await exigirOtroAdministradorActivo(conn, id);
        await repo.updateUsuario(id, cambios, conn);
      });
    } else {
      await repo.updateUsuario(id, cambios);
    }
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

exports.deleteUsuario = async (idRecibido) => {
  const id = normalizarIdUsuario(idRecibido);
  const exists = await repo.getUsuarioById(id);

  if (!exists) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Con información asociada (1451) la cuenta se desactiva en lugar de eliminarse (004 CA5)
  const eliminarODesactivar = async (conn) => {
    try {
      await repo.deleteUsuario(id, conn);
      return false;
    } catch (error) {
      if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
        await repo.desactivarUsuario(id, conn);
        return true;
      }
      throw error;
    }
  };

  // Al último Administrador activo no se le elimina ni se le desactiva (spec 021 CA7)
  const desactivado = esAdministradorActivo(exists)
    ? await repo.conTransaccion(async (conn) => {
      await exigirOtroAdministradorActivo(conn, id);
      return eliminarODesactivar(conn);
    })
    : await eliminarODesactivar();

  if (desactivado) {
    return {
      desactivado: true,
      message:
        'El usuario tiene información asociada, por lo que se desactivó en lugar de eliminarse.',
    };
  }

  // La imagen se borra solo después del commit
  await borrarArchivo(exists.imagen);

  return { desactivado: false, message: 'Usuario eliminado correctamente' };
};