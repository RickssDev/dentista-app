const { pool } = require("../../config/db");

// Citas del día (sin contar las canceladas)
exports.countCitasDelDia = async (fecha) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM citas
    WHERE fecha_agendada = ?
      AND estado = 'pendiente'
    `,
    [fecha],
  );

  return rows[0].total;
};

// Citas pendientes en un rango de fechas (próximos días)
exports.countCitasProximas = async (desde, hasta) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM citas
    WHERE fecha_agendada BETWEEN ? AND ?
      AND estado = 'pendiente'
    `,
    [desde, hasta],
  );

  return rows[0].total;
};

// Pacientes con perfil cuya cuenta se registró desde la fecha dada
exports.countPacientesNuevos = async (desde) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM paciente p
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE u.fecha_registro >= ?
    `,
    [desde],
  );

  return rows[0].total;
};

exports.countComentariosPendientes = async () => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM comentarios
    WHERE estado = 'oculto'
    `,
  );

  return rows[0].total;
};

// Citas pendientes de hoy, en orden de hora
exports.getCitasPendientesDelDia = async (fecha) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_cita,
      c.id_servicio,
      c.hora,
      c.estado,
      u.nombre_usuario,
      u.apellido,
      s.nombre_servicio
    FROM citas c
    JOIN paciente p
      ON c.id_paciente = p.id_paciente
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    JOIN servicio s
      ON c.id_servicio = s.id_servicio
    WHERE c.fecha_agendada = ?
      AND c.estado = 'pendiente'
    ORDER BY c.hora ASC
    `,
    [fecha],
  );

  return rows;
};