const { pool } = require("../../config/db");
const bcrypt = require('bcrypt');

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

// Guardar un token de recuperación.
// MySQL calcula la expiración para evitar diferencias de horario.
exports.createPasswordResetToken = async (idUsuario, tokenHash) => {
  await pool.query(
    `
    INSERT INTO restablecimiento_contrasenas
      (id_usuario, token_hash, fecha_expiracion)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
    `,
    [idUsuario, tokenHash]
  );
};

// Eliminar un token si falló el envío del correo.
exports.deletePasswordResetToken = async (tokenHash) => {
  await pool.query(
    `
    DELETE FROM restablecimiento_contrasenas
    WHERE token_hash = ?
    `,
    [tokenHash]
  );
};


exports.resetPasswordWithToken = async (
  tokenHash,
  nuevaContrasena,
  hashedPassword
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        r.id_restablecimiento,
        r.id_usuario,
        u.correo,
        u.nombre_usuario,
        u.contrasena
      FROM restablecimiento_contrasenas AS r
      INNER JOIN usuarios AS u
        ON u.id_usuario = r.id_usuario
      WHERE r.token_hash = ?
        AND r.fecha_expiracion > NOW()
        AND u.estado = 'activo'
        AND u.contrasena IS NOT NULL
      FOR UPDATE
      `,
      [tokenHash]
    );

    const token = rows[0];

    if (!token) {
      await connection.rollback();

      return {
        estado: 'token_invalido'
      };
    }

    // Verificar si la contraseña nueva es igual a la actual.
    const esMismaContrasena = await bcrypt.compare(
      nuevaContrasena,
      token.contrasena
    );

    if (esMismaContrasena) {
      await connection.rollback();

      return {
        estado: 'misma_contrasena'
      };
    }

    // Actualizar la contraseña.
    await connection.query(
      `
      UPDATE usuarios
      SET contrasena = ?
      WHERE id_usuario = ?
      `,
      [hashedPassword, token.id_usuario]
    );

    // Invalidar todos los enlaces pendientes.
    await connection.query(
      `
      DELETE FROM restablecimiento_contrasenas
      WHERE id_usuario = ?
      `,
      [token.id_usuario]
    );

    await connection.commit();

    return {
      estado: 'actualizada',
      correo: token.correo,
      nombre_usuario: token.nombre_usuario
    };

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};
