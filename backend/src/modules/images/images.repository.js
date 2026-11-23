const { pool } = require("../../config/db");
const logger = require("../../utils/logger");

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

// Alta con límite de la galería (spec 029, CA7). Un bloqueo con nombre serializa las altas: con él
// tomado se cuenta y se inserta en la misma conexión, así dos altas simultáneas no pasan del máximo.
// `origen` permite inyectar otro proveedor de conexiones en las pruebas.
const BLOQUEO_ALTA = 'dentissa_galeria_alta';
const ESPERA_BLOQUEO_S = 5;

exports.crearImagenConLimite = async (data, max, origen = pool) => {
  const { titulo, imagen, visible } = data;
  const conn = await origen.getConnection();
  // MySQL solo suelta el bloqueo al cerrar la conexión: si RELEASE_LOCK falla, la conexión se cierra
  // en vez de volver al pool con el bloqueo tomado (/analyze A18)
  let cerrar = false;

  try {
    const [[{ bloqueo }]] = await conn.query('SELECT GET_LOCK(?, ?) AS bloqueo', [
      BLOQUEO_ALTA,
      ESPERA_BLOQUEO_S,
    ]);

    // 0 = no llegó en el tiempo de espera; NULL = error de MySQL al pedirlo
    if (Number(bloqueo) !== 1) return { bloqueo: false };

    let resultado;
    try {
      const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM imagenes');

      if (Number(total) >= max) {
        resultado = { creada: false, total: Number(total) };
      } else {
        const [insercion] = await conn.query(
          `
          INSERT INTO imagenes (titulo, imagen, visible)
          VALUES (?, ?, ?)
        `,
          [titulo, imagen, visible],
        );
        resultado = { creada: true, id: insercion.insertId };
      }
    } finally {
      try {
        await conn.query('SELECT RELEASE_LOCK(?)', [BLOQUEO_ALTA]);
      } catch (error) {
        // El alta ya quedó guardada (o su error sigue su curso): no se convierte en otro error.
        // Solo el código: ni el SQL ni los valores (spec 026; review R8)
        logger.warn('No se pudo soltar el bloqueo de la galería', { code: error?.code });
        cerrar = true;
      }
    }

    return resultado;
  } finally {
    if (cerrar) conn.destroy();
    else conn.release();
  }
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
