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

exports.createUsuario = async (data) => {
  const { nombre, telefono, correo, apellido, password, id_rol, imagen } = data;

  const [result] = await pool.query(`
    INSERT INTO usuarios (nombre_usuario, telefono, correo, apellido, contrasena, id_rol, estado, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nombre, telefono, correo, apellido, password, id_rol, 'activo', imagen]);

  return result.insertId;
};

exports.updateUsuario = async (id, data) => {
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

  await pool.query(query, [...values, id]);
};

exports.deleteUsuario = async (id) => {
  await pool.query(`DELETE FROM usuarios WHERE id_usuario = ?`, [id]);
};

exports.desactivarUsuario = async (id) => {
  await pool.query(
    "UPDATE usuarios SET estado = 'inactivo' WHERE id_usuario = ?",
    [id]
  );
};