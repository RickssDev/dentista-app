const { pool } = require("../../config/db");

exports.getImagen = async () => {
  const [rows] = await pool.query(`
        SELECT 
        id_imagen,
        titulo,
        imagen,
        fecha_publicada,
        visible
    FROM imagenes;
  `);

  return rows;
};

exports.getImagenById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
      id_imagen,
      titulo,
      imagen,
      fecha_publicada,
      visible
    FROM imagenes
    WHERE id_imagen = ?
  `,
    [id],
  );

  return rows[0];
};

exports.createImagen = async (data) => {
  const { titulo, imagen, visible } = data;

  const [result] = await pool.query(
    `
    INSERT INTO imagenes (titulo, imagen, visible)
    VALUES (?, ?, ?)
  `,
    [titulo, imagen, visible],
  );

  return result.insertId;
};

exports.updateImagen = async (id, data) => {
  const fieldMap = {
    titulo: "titulo",
    imagen: "imagen",
    visible: "visible",
  };

  const entries = Object.entries(data).filter(
    ([key, value]) => fieldMap[key] && value !== undefined && value !== "",
  );

  if (entries.length === 0) return;

  const fields = entries.map(([key]) => `${fieldMap[key]} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  const query = `UPDATE imagenes SET ${fields} WHERE id_imagen = ?`;

  await pool.query(query, [...values, id]);
};

exports.deleteImagen = async (id) => {
  await pool.query(`DELETE FROM imagenes WHERE id_imagen = ?`, [id]);
};

exports.getImagenesPublicas = async () => {
  const [rows] = await pool.query(`
    SELECT
      id_imagen,
      titulo,
      imagen,
      fecha_publicada
    FROM imagenes
    WHERE visible = 1
    ORDER BY fecha_publicada DESC;
  `);

  return rows;
};
