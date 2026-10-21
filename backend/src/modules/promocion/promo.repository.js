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
  const permitidos = [
    "id_servicio",
    "nombre_promocion",
    "descripcion",
    "fecha_inicio",
    "fecha_fin",
    "estado",
    "imagen",
  ];

  const entries = Object.entries(data).filter(
    ([key, value]) =>
      permitidos.includes(key) && value !== undefined && value !== ""
  );

  if (entries.length === 0) return false;

  const fields = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  const [result] = await pool.query(
    `UPDATE promocion SET ${fields} WHERE id_promocion = ?`,
    [...values, id]
  );

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
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });

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
      AND (p.fecha_fin IS NULL OR DATE(p.fecha_fin) >= ?)
    ORDER BY p.id_promocion DESC
  `;

  const [rows] = await pool.query(query, [hoy]);
  return rows;
};
