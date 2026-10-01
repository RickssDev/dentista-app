const { pool } = require("../../config/db");

exports.getComentarioById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM comentarios WHERE id_comentario = ?",
    [id],
  );

  return rows[0];
};

exports.getComentarioByCita = async (idCita) => {
  const [rows] = await pool.query(
    "SELECT * FROM comentarios WHERE id_cita = ?",
    [idCita],
  );

  return rows[0];
};

exports.getComentarios = async (estado = "todos") => {
  let query = `
    SELECT
      c.id_comentario,
      c.comentario,
      c.calificacion,
      c.fecha,
      c.estado,
      c.respuesta_admin,
      ci.id_cita,
      u.nombre_usuario,
      u.apellido,
      s.nombre_servicio
    FROM comentarios c
    JOIN citas ci
      ON c.id_cita = ci.id_cita
    JOIN paciente p
      ON ci.id_paciente = p.id_paciente
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    JOIN servicio s
      ON ci.id_servicio = s.id_servicio
  `;

  const params = [];

  if (estado !== "todos") {
    query += " WHERE c.estado = ?";
    params.push(estado);
  }

  query += " ORDER BY c.fecha DESC";

  const [rows] = await pool.query(query, params);

  return rows;
};

exports.getComentariosPublicos = async () => {
  const [rows] = await pool.query(`
    SELECT
      c.id_comentario,
      c.comentario,
      c.calificacion,
      c.fecha,
      u.nombre_usuario
    FROM comentarios c
    JOIN citas ci
      ON c.id_cita = ci.id_cita
    JOIN paciente p
      ON ci.id_paciente = p.id_paciente
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE c.estado = 'visible'
    ORDER BY c.fecha DESC
  `);

  return rows;
};

exports.createComentario = async (data) => {
  const [result] = await pool.query(
    `
      INSERT INTO comentarios
      (
        comentario,
        calificacion,
        id_cita,
        estado
      )
      VALUES (?, ?, ?, "oculto")
    `,
    [data.comentario, data.calificacion, data.id_cita],
  );

  return result.insertId;
};

exports.replyComentario = async (id, respuesta) => {
  await pool.query(
    `
      UPDATE comentarios
      SET respuesta_admin = ?
      WHERE id_comentario = ?
    `,
    [respuesta, id],
  );
};

exports.updateEstadoComentario = async (id, estado) => {
  await pool.query(
    `
    UPDATE comentarios
    SET estado = ?
    WHERE id_comentario = ?
    `,
    [estado, id],
  );
};

exports.deleteComentario = async (id) => {
  await pool.query(
    `
      DELETE FROM comentarios
      WHERE id_comentario = ?
    `,
    [id],
  );
};


