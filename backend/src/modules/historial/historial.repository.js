const { pool } = require("../../config/db");

exports.crearHistorial = async (client, data) => {
  const query = `
    INSERT INTO h_clinico
    (
      id_paciente,
      fecha,
      servicio,
      diagnostico,
      observaciones
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    data.id_paciente,
    data.fecha,
    data.servicio,
    data.diagnostico,
    data.observaciones,
  ];

  const [result] = await client.query(query, values);

  return {
    id_historial: result.insertId,
    ...data,
  };
};

exports.getHistorialById = async (idHistorial, client = pool) => {
  const query = `
    SELECT 
      h.id_historial,
      h.fecha,
      h.servicio,
      h.diagnostico,
      h.observaciones,
      p.id_paciente,
      u.nombre_usuario
    FROM h_clinico h
    INNER JOIN paciente p ON h.id_paciente = p.id_paciente
    INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
    WHERE h.id_historial = ?
  `;

  const [rows] = await client.query(query, [idHistorial]);

  return rows[0];
};

exports.finalizarCita = async (client, idCita) => {
  const query = `
    UPDATE citas
    SET estado = 'completada'
    WHERE id_cita = ?
  `;

  await client.query(query, [idCita]);
};

exports.getCitaPendiente = async (idCita, client = pool) => {
  const query = `
    SELECT 
      c.id_cita,
      c.fecha_agendada,
      c.hora,
      s.nombre_servicio AS servicio_realizado,
      c.estado,
      p.id_paciente,
      u.nombre_usuario
    FROM citas c
    INNER JOIN paciente p
      ON c.id_paciente = p.id_paciente
    INNER JOIN servicio s
      ON c.id_servicio = s.id_servicio
    INNER JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    WHERE c.id_cita = ?
  `;

  const [rows] = await client.query(query, [idCita]);

  return rows[0];
};
exports.getHistoriales = async () => {
  const query = `
    SELECT 
      p.id_paciente,
      u.nombre_usuario,
      MAX(h.fecha) AS ultima_consulta
    FROM h_clinico h
    INNER JOIN paciente p
      ON h.id_paciente = p.id_paciente
    INNER JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    GROUP BY p.id_paciente, u.nombre_usuario
    ORDER BY ultima_consulta DESC
  `;

  const [rows] = await pool.query(query);

  return rows;
};

exports.actualizarHistorial = async (client, idHistorial, data) => {
  const query = `
    UPDATE h_clinico
    SET
      fecha = ?,
      servicio = ?,
      diagnostico = ?,
      observaciones = ?
    WHERE id_historial = ?
  `;

  const values = [
    data.fecha,
    data.servicio,
    data.diagnostico,
    data.observaciones,
    idHistorial
  ];

  const [result] = await client.query(query, values);
  return result;
};
