const { pool } = require("../../config/db");

/*
  Borrado lógico: eliminar un comentario NO borra la fila, solo la marca
  con eliminado = 1. Así la cita sigue contando como "ya reseñada" y el
  paciente no puede volver a comentar, sin importar si el comentario fue
  aprobado, quedó pendiente o el administrador lo eliminó.

  Requiere en la base de datos:
    ALTER TABLE comentarios ADD COLUMN eliminado TINYINT(1) NOT NULL DEFAULT 0;
*/

// Los comentarios eliminados ya no existen para el panel del administrador
exports.getComentarioById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM comentarios WHERE id_comentario = ? AND eliminado = 0",
    [id],
  );

  return rows[0];
};

// Incluye los eliminados a propósito: una cita reseñada no se puede reseñar otra vez
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
    WHERE c.eliminado = 0
  `;

  const params = [];

  if (estado !== "todos") {
    query += " AND c.estado = ?";
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
      AND c.eliminado = 0
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

// Borrado lógico: queda oculto y marcado como eliminado, pero la cita sigue reseñada
exports.deleteComentario = async (id) => {
  await pool.query(
    `
      UPDATE comentarios
      SET eliminado = 1, estado = 'oculto'
      WHERE id_comentario = ?
    `,
    [id],
  );
};