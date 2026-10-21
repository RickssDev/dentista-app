const { pool } = require("../../config/db");

exports.getServicioByName = async (nombre) => {
  const [rows] = await pool.query(
    "SELECT * FROM servicio WHERE nombre_servicio = ?",
    [nombre],
  );
  return rows[0];
};

exports.getServicios = async () => {
  const [rows] = await pool.query(`
    SELECT 
      s.id_servicio,
      s.nombre_servicio,
      s.descripcion,
      s.duracion,
      s.estado,
      s.imagen
    FROM servicio s
  `);

  return rows;
};

exports.getServicioById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
      s.id_servicio,
      s.nombre_servicio,
      s.descripcion,
      s.duracion,
      s.estado,
      s.imagen
    FROM servicio s
    WHERE s.id_servicio = ?
  `,
    [id],
  );

  return rows[0];
};

exports.createServicio = async (data) => {
  const { nombre, descripcion, duracion, imagen } = data;

  const [result] = await pool.query(
    `INSERT INTO servicio (nombre_servicio, descripcion, duracion, estado, imagen)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, descripcion, duracion, "activo", imagen],
  );

  return result.insertId;
};

exports.updateServicio = async (id, data) => {
  const fieldMap = {
    nombre: "nombre_servicio",
    descripcion: "descripcion",
    duracion: "duracion",
    estado: "estado",
    imagen: "imagen",
  };

  const entries = Object.entries(data).filter(
    ([key, value]) => fieldMap[key] && value !== undefined && value !== "",
  );
  if (entries.length === 0) return;
  const fields = entries.map(([key]) => `${fieldMap[key]} = ?`).join(", ");
  const values = entries.map(([, value]) => value);

  const query = `UPDATE servicio SET ${fields} WHERE id_servicio = ?`;

  await pool.query(query, [...values, id]);
};

exports.deleteServicio = async (id) => {
  await pool.query(`DELETE FROM servicio WHERE id_servicio = ?`, [id]);
};

exports.getServiciosPublicos = async () => {
  const [rows] = await pool.query(`
    SELECT 
      s.id_servicio,
      s.nombre_servicio,
      s.descripcion,
      s.duracion,
      s.imagen
    FROM servicio s
    where s.estado = 'activo'
  `);

  return rows;
};

exports.desactivarServicio = async (id) => {
  await pool.query(
    "UPDATE servicio SET estado = 'inactivo' WHERE id_servicio = ?",
    [id]
  );
};