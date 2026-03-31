const { pool } = require("../../config/db");

exports.findUserByEmail = async (correo) => {
  const [rows] = await pool.query(
    `SELECT usuarios.*, roles.rol AS rol
    FROM usuarios
    INNER JOIN roles ON usuarios.id_rol = roles.id_rol
    WHERE usuarios.correo = ?`,
    [correo],
  );

  return rows[0];
};

exports.createUser = async ({
  nombre_usuario,
  telefono,
  apellido,
  correo,
  contrasena,
  id_rol,
}) => {
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre_usuario, telefono, apellido, correo, contrasena, id_rol)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre_usuario, telefono, apellido, correo, contrasena, id_rol],
  );

  return {
    id: result.insertId,
    nombre_usuario,
    telefono,
    apellido,
    correo,
    id_rol,
  };
};
