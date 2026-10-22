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
  apellido,
  correo,
  contrasena,
  id_rol,
}) => {
  const [result] = await pool.query(
  `INSERT INTO usuarios (nombre_usuario, apellido, correo, contrasena, id_rol, estado)
   VALUES (?, ?, ?, ?, ?, 'activo')`,
  [nombre_usuario, apellido, correo, contrasena, id_rol],
);

  return {
    id: result.insertId,
    nombre_usuario,
    apellido,
    correo,
    id_rol,
  };
};

exports.findUserById = async (idUsuario) => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM usuarios
    WHERE id_usuario = ?
    `,
    [idUsuario]
  );

  return rows[0] || null;
};
exports.updatePassword = async (
  idUsuario,
  nuevaContrasena
) => {
  await pool.query(
    `
    UPDATE usuarios
    SET contrasena = ?
    WHERE id_usuario = ?
    `,
    [nuevaContrasena, idUsuario]
  );
};

exports.createGoogleUser = async ({ nombre_usuario, apellido, correo, google_id, id_rol }) => {
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre_usuario, apellido, correo, google_id, id_rol, estado)
     VALUES (?, ?, ?, ?, ?, 'activo')`,
    [nombre_usuario, apellido, correo, google_id, id_rol],
  );
  return { id: result.insertId, nombre_usuario, apellido, correo, id_rol };
};

exports.linkGoogleId = async (idUsuario, googleId) => {
  await pool.query(
    `UPDATE usuarios SET google_id = ? WHERE id_usuario = ?`,
    [googleId, idUsuario],
  );
};