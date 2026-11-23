const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('Base de datos conectada');
    conn.release();
  } catch (err) {
    // Solo el nombre y el código: el mensaje y la pila de un error de conexión citan el host y el
    // puerto, y los de MySQL, el usuario (spec 026, /review R5).
    logger.error('No se pudo conectar con la base de datos', {
      error_name: err?.name || 'Error',
      code: err?.code,
      errno: err?.errno,
    });
    process.exit(1);
  }
}

module.exports = { pool, testConnection };