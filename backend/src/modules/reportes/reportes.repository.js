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
