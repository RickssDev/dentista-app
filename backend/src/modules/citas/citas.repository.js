const { pool } = require("../../config/db");

exports.getCitas = async () => {
  const [rows] = await pool.query(`
    SELECT 
    c.id_cita,
    c.fecha_agendada,
    c.hora,
    c.id_servicio,
    c.estado,
    c.motivo,
    c.id_paciente,
    u.nombre_usuario,
    u.apellido,
    s.nombre_servicio
    FROM citas c
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    JOIN servicio s ON c.id_servicio = s.id_servicio;
  `);
  return rows;
};

exports.getCitaById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
    c.id_cita,
    c.fecha_agendada,
    c.hora,
    c.id_servicio,
    c.estado,
    c.motivo,
    c.id_paciente,
    u.nombre_usuario,
    u.apellido,
    s.nombre_servicio
    FROM citas c
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    JOIN servicio s ON c.id_servicio = s.id_servicio
    WHERE c.id_cita = ?;
  `,
    [id],
  );
  return rows[0];
};

exports.getCitasByEstado = async (estado) => {
  const [rows] = await pool.query(
    `
    SELECT 
    c.id_cita,
    c.fecha_agendada,
    c.hora,
    c.id_servicio,
    c.estado,
    c.motivo,
    c.id_paciente,
    u.nombre_usuario,
    u.apellido,
    s.nombre_servicio
    FROM citas c
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    JOIN servicio s ON c.id_servicio = s.id_servicio
    WHERE c.estado = ?;
  `,
    [estado],
  );
  return rows;
};

exports.getCitasByPaciente = async (id_paciente) => {
  const [rows] = await pool.query(
    `
    SELECT 
    c.id_cita,
    c.fecha_agendada,
    c.hora,
    c.id_servicio,
    c.estado,
    c.motivo,
    u.nombre_usuario,
    u.apellido,
    s.nombre_servicio
    FROM citas c
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    JOIN servicio s ON c.id_servicio = s.id_servicio
    WHERE c.id_paciente = ?;
  `,
    [id_paciente],
  );
  return rows;
};

exports.createCita = async (data) => {
  const { id_paciente, fecha_agendada, hora, id_servicio, estado } = data;
  const [result] = await pool.query(
    `
    INSERT INTO citas (id_paciente, fecha_agendada, hora, id_servicio, estado)
    VALUES (?, ?, ?, ?, ?)
  `,
    [id_paciente, fecha_agendada, hora, id_servicio, estado],
  );
  return result.insertId;
};

exports.updateCita = async (id, data) => {
  const fields = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(data);
  const [result] = await pool.query(
    `
    UPDATE citas SET ${fields} WHERE id_cita = ?
`,
    [...values, id],
  );
  return result;
};

exports.deleteCita = async (id) => {
  await pool.query(`DELETE FROM citas WHERE id_cita = ?`, [id]);
};

exports.findCitaExistente = async (fecha_agendada, hora) => {
  const [rows] = await pool.query(
    `
    SELECT * FROM citas
    WHERE fecha_agendada = ?
    AND hora = ?
    AND estado != 'cancelada'
`,
    [fecha_agendada, hora],
  );

  return rows[0];
};

exports.getCitasPorPeriodo = async (tipo) => {
  let query = '';

  if (tipo === 'diaria') {
    query = `
      SELECT * 
      FROM citas
      WHERE DATE(fecha_agendada) = CURDATE()
    `;
  }

  if (tipo === 'semanal') {
    query = `
      SELECT * 
      FROM citas
      WHERE YEARWEEK(fecha_agendada, 1) = YEARWEEK(CURDATE(), 1)
    `;
  }

  if (tipo === 'mensual') {
    query = `
      SELECT * 
      FROM citas
      WHERE MONTH(fecha_agendada) = MONTH(CURDATE())
      AND YEAR(fecha_agendada) = YEAR(CURDATE())
    `;
  }

  const [rows] = await pool.query(query);
  return rows;
};
exports.getMisCitas = async (id_paciente) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_cita,
      c.fecha_agendada,
      c.hora,
      c.estado,
      c.motivo,
      s.nombre_servicio
    FROM citas c
    JOIN servicio s
      ON c.id_servicio = s.id_servicio
    WHERE c.id_paciente = ?
    ORDER BY c.fecha_agendada DESC, c.hora DESC
    `,
    [id_paciente]
  );

  return rows;
};

exports.getPacienteWhatsApp = async (id_paciente) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.telefono,
      u.nombre_usuario,
      u.apellido
    FROM paciente p
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE p.id_paciente = ?
    `,
    [id_paciente]
  );

  return rows[0];
};

exports.getCitasParaRecordatorio = async () => {
  const [rows] = await pool.query(`
    SELECT
      c.id_cita,
      c.fecha_agendada,
      c.hora,
      c.id_paciente,
      u.telefono,
      u.nombre_usuario
    FROM citas c
    JOIN paciente p
      ON c.id_paciente = p.id_paciente
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE DATE(c.fecha_agendada) = DATE(DATE_ADD(CURDATE(), INTERVAL 1 DAY))
      AND c.estado = 'pendiente'
      AND c.recordatorio_enviado = FALSE
  `);

  return rows;
};
exports.marcarRecordatorioEnviado = async (id_cita) => {
  await pool.query(
    `
    UPDATE citas
    SET recordatorio_enviado = TRUE
    WHERE id_cita = ?
    `,
    [id_cita]
  );
};

exports.getDatosWhatsAppCita = async (id_cita) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.fecha_agendada,
      c.hora,
      u.telefono,
      u.nombre_usuario
    FROM citas c
    JOIN paciente p
      ON c.id_paciente = p.id_paciente
    JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE c.id_cita = ?
    `,
    [id_cita]
  );

  return rows[0];
};

exports.getCitasDelDia = async (
  fecha_agendada
) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_cita,
      c.hora,
      s.duracion
    FROM citas c
    JOIN servicio s
      ON c.id_servicio = s.id_servicio
    WHERE c.fecha_agendada = ?
      AND c.estado != 'cancelada'
    `,
    [fecha_agendada]
  );

  return rows;
};
