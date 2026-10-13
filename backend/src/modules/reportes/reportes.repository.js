const { pool } = require("../../config/db");

exports.getReporteCitasPorRango = async (fechaInicio, fechaFin) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_cita,
      c.fecha_agendada,
      c.hora,
      c.estado,
      c.motivo,
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
    WHERE c.fecha_agendada BETWEEN ? AND ?
    ORDER BY c.fecha_agendada ASC, c.hora ASC
    `,
    [fechaInicio, fechaFin],
  );

  return rows;
};

exports.getReportePacientesPorRango = async (fechaInicio, fechaFin) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_paciente,
      u.nombre_usuario,
      u.apellido,
      u.correo,
      u.fecha_registro
    FROM paciente p
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE u.fecha_registro >= ?
      AND u.fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)
    ORDER BY u.fecha_registro ASC
    `,
    [fechaInicio, fechaFin],
  );

  return rows;
};
