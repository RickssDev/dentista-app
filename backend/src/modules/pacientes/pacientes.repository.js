const { pool } = require("../../config/db");

exports.findByUserId = async (idUsuario) => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM paciente
    WHERE id_usuario = ?
    `,
    [idUsuario]
  );

  return rows[0] || null;
};

//funcion tras registrar la cuenta de usuario, se crea el perfil del paciente
exports.create = async ({
  direccion,
  fecha_nacimiento,
  genero,
  id_usuario
}) => {
  const [result] = await pool.query(
    `
    INSERT INTO paciente
    (direccion, fecha_nacimiento, genero, id_usuario)
    VALUES (?, ?, ?, ?)
    `,
    [direccion, fecha_nacimiento, genero, id_usuario]
  );

  return {
    id_paciente: result.insertId,
    direccion,
    fecha_nacimiento,
    genero,
    id_usuario
  };
};
exports.findPerfilByUserId = async (idUsuario) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.nombre_usuario,
      u.apellido,
      u.correo,
      u.telefono,
      p.direccion,
      p.fecha_nacimiento,
      p.genero
    FROM usuarios u
    LEFT JOIN paciente p
      ON u.id_usuario = p.id_usuario
    WHERE u.id_usuario = ?
    `,
    [idUsuario]
  );

  return rows[0];
};
exports.updatePerfilByUserId = async (
  idUsuario,
  {
    telefono,
    direccion,
    genero
  }
) => {
  await pool.query(
    `
    UPDATE usuarios
    SET telefono = ?
    WHERE id_usuario = ?
    `,
    [telefono, idUsuario]
  );

  await pool.query(
    `
    UPDATE paciente
    SET direccion = ?, genero = ?
    WHERE id_usuario = ?
    `,
    [direccion, genero, idUsuario]
  );
};

exports.getPacientesSelect = async () => {
    const [rows] = await pool.query(`
        SELECT
    p.id_paciente,
    CONCAT(
        u.nombre_usuario,
        ' ',
        u.apellido
    ) AS nombre
FROM paciente p
INNER JOIN usuarios u
    ON p.id_usuario = u.id_usuario
WHERE u.estado = 'activo'
ORDER BY u.nombre_usuario, u.apellido;
    `);

    return rows;
};
