const { pool } = require("../../config/db");

exports.createPromocion = async (data) => {
  const query = `
    INSERT INTO promocion (
      id_servicio,
      nombre_promocion,
      imagen,
      descripcion,
      fecha_inicio,
      fecha_fin,
      estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.id_servicio,
    data.nombre_promocion,
    data.imagen,
    data.descripcion,
    data.fecha_inicio,
    data.fecha_fin,
    data.estado,
  ];

  const [result] = await pool.query(query, values);

  return {
    id_promocion: result.insertId,
    ...data,
  };
};

exports.getPromocion = async () => {
  const query = `
    SELECT
      p.id_promocion,
      p.nombre_promocion,
      p.imagen,
      s.nombre_servicio,
      p.descripcion,
      p.fecha_inicio,
      p.fecha_fin,
      p.estado
    FROM promocion p
    INNER JOIN servicio s
      ON p.id_servicio = s.id_servicio
    ORDER BY p.id_promocion DESC
  `;

  const [rows] = await pool.query(query);
  return rows;
};

exports.getPromocionById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM promocion WHERE id_promocion = ?",
    [id],
  );

  return rows[0];
};

exports.updatePromocion = async (id, data) => {
  const query = `
    UPDATE promocion
    SET
      id_servicio = ?,
      imagen = ?,
      nombre_promocion = ?,
      descripcion = ?,
      fecha_inicio = ?,
      fecha_fin = ?,
      estado = ?
    WHERE id_promocion = ?
  `;

  const values = [
    data.id_servicio,
    data.imagen,
    data.nombre_promocion,
    data.descripcion,
    data.fecha_inicio,
    data.fecha_fin,
    data.estado,
    id,
  ];

  const [result] = await pool.query(query, values);
  return result.affectedRows > 0;
};

exports.deletePromocion = async (id) => {
  const [result] = await pool.query(
    "DELETE FROM promocion WHERE id_promocion = ?",
    [id],
  );

  return result.affectedRows > 0;
};
exports.getPromocionPublicos = async () => {
  const query = `
    SELECT
      p.id_promocion,
      p.nombre_promocion,
      p.imagen,
      s.nombre_servicio,
      p.descripcion,
      p.fecha_inicio,
      p.fecha_fin
    FROM promocion p
    INNER JOIN servicio s
      ON p.id_servicio = s.id_servicio
    WHERE p.estado = 'activo'
    ORDER BY p.id_promocion DESC
  `;

  const [rows] = await pool.query(query);
  return rows;
};
