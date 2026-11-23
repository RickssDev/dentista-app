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
    // Sin el mensaje de MySQL, que puede llevar el usuario y el host (spec 026).
    logger.error('No se pudo conectar con la base de datos', logger.resumirError(err));
    process.exit(1);
  }
}

module.exports = { pool, testConnection };