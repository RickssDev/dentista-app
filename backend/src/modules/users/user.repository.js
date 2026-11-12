const {pool} = require('../../config/db');

exports.getUsuarios = async () => {
  const [rows] = await pool.query(`
    SELECT 
      u.id_usuario AS id,
      u.nombre_usuario AS nombre,
      u.telefono,
      u.apellido,
      u.correo AS email,
      u.imagen,
      u.estado,
      r.id_rol AS rol_id,
      r.rol AS rol_nombre
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
  `);

  return rows;
};

exports.getUsuarioById = async (id) => {
  const [rows] = await pool.query(`
    SELECT 
      u.id_usuario,
      u.nombre_usuario,
      u.telefono,
      u.apellido,
      u.correo,
      u.imagen,
      u.estado,
      r.id_rol AS rol_id,
      r.rol AS rol_nombre
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_usuario = ?
  `, [id]);

  return rows[0];
};

exports.getRolById = async (idRol, conn = pool) => {
  const [rows] = await conn.query(
    'SELECT id_rol, rol FROM roles WHERE id_rol = ?',
    [idRol]
  );

  return rows[0];
};

// Otra cuenta con el mismo correo (excluye la cuenta que se edita; null en un alta)
exports.findOtroUsuarioPorCorreo = async (correo, idExcluido = null, conn = pool) => {
  const [rows] = await conn.query(
    'SELECT id_usuario FROM usuarios WHERE correo = ? AND (? IS NULL OR id_usuario <> ?) LIMIT 1',
    [correo, idExcluido, idExcluido]
  );

  return rows[0];
};

exports.createUsuario = async (data) => {
  const { nombre, telefono, correo, apellido, password, id_rol, imagen } = data;

  const [result] = await pool.query(`
    INSERT INTO usuarios (nombre_usuario, telefono, correo, apellido, contrasena, id_rol, estado, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nombre, telefono, correo, apellido, password, id_rol, 'activo', imagen]);

  return result.insertId;
};

// Ejecuta `fn(conn)` en una transacción: commit si termina, rollback si lanza (spec 021 CA10).
// `origen` permite inyectar otro proveedor de conexiones en las pruebas.
exports.conTransaccion = async (fn, origen = pool) => {
  const conn = await origen.getConnection();

  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    // Si el rollback también falla, se conserva el error original (spec 021, /review R6)
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
};

// Bloquea las filas de los Administradores activos hasta que termine la transacción, para que
// dos cambios simultáneos no dejen a la clínica sin Administrador.
exports.bloquearAdministradoresActivos = async (conn) => {
  const [rows] = await conn.query(`
    SELECT u.id_usuario
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE r.rol = 'Administrador' AND u.estado = 'activo'
    FOR UPDATE
  `);

  return rows;
};

exports.updateUsuario = async (id, data, conn = pool) => {
  const fieldMap = {
    nombre: 'nombre_usuario',
    telefono: 'telefono',
    correo: 'correo',
    email: 'correo',
    apellido: 'apellido',
    password: 'contrasena',
    id_rol: 'id_rol',
    estado: 'estado',
    imagen: 'imagen'
  };

  const entries = Object.entries(data)
  .filter(([key, value]) => fieldMap[key] && value !== undefined && value !== '');

  const fields = entries.map(([key]) => `${fieldMap[key]} = ?`).join(', ');
  const values = entries.map(([, value]) => value);

  const query = `UPDATE usuarios SET ${fields} WHERE id_usuario = ?`;

  await conn.query(query, [...values, id]);
};

exports.deleteUsuario = async (id, conn = pool) => {
  await conn.query(`DELETE FROM usuarios WHERE id_usuario = ?`, [id]);
};

exports.desactivarUsuario = async (id, conn = pool) => {
  await conn.query(
    "UPDATE usuarios SET estado = 'inactivo' WHERE id_usuario = ?",
    [id]
  );
};