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
      u.apellido,
      MAX(h.fecha) AS ultima_consulta
    FROM paciente p
    INNER JOIN usuarios u
      ON p.id_usuario = u.id_usuario
    INNER JOIN h_clinico h
      ON h.id_paciente = p.id_paciente
    GROUP BY
      p.id_paciente,
      u.nombre_usuario,
      u.apellido
    ORDER BY
      MAX(h.fecha) DESC,
      p.id_paciente DESC
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

exports.getConsultasByPaciente = async (idPaciente, client = pool) => {
  const query = `
    SELECT id_historial, fecha, servicio, diagnostico, observaciones
    FROM h_clinico
    WHERE id_paciente = ?
    ORDER BY fecha DESC, id_historial DESC
  `;
  const [rows] = await client.query(query, [idPaciente]);
  return rows;
};

exports.getPacientePerfil = async (idPaciente, client = pool) => {
  const query = `
    SELECT
      p.id_paciente,
      u.nombre_usuario,
      u.apellido
    FROM paciente p
    INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
    WHERE p.id_paciente = ?
  `;
  const [rows] = await client.query(query, [idPaciente]);
  return rows[0];
};

exports.correoExiste = async (client, correo) => {
  const [rows] = await client.query(
    "SELECT 1 FROM usuarios WHERE correo = ? LIMIT 1",
    [correo]
  );
  return rows.length > 0;
};

exports.getServiciosDisponibles = async () => {
  const [rows] = await pool.query(
    "SELECT id_servicio, nombre_servicio FROM servicio WHERE estado = 'activo' ORDER BY nombre_servicio ASC"
  );
  return rows;
};

exports.servicioExiste = async (client, nombreServicio) => {
  const [rows] = await client.query(
    "SELECT 1 FROM servicio WHERE nombre_servicio = ? AND estado = 'activo' LIMIT 1",
    [nombreServicio]
  );
  return rows.length > 0;
};

// AJUSTA si tu tabla de roles se llama distinto (ver nota en la respuesta)
exports.getIdRolPaciente = async (client) => {
  const [rows] = await client.query(
    "SELECT id_rol FROM roles WHERE LOWER(rol) = 'paciente' LIMIT 1"
  );
  return rows[0]?.id_rol ?? null;
};

exports.crearUsuarioPaciente = async (
  client,
  { nombre, apellido, telefono, correo, passwordHash, id_rol }
) => {
  const [result] = await client.query(
    `
    INSERT INTO usuarios
    (nombre_usuario, telefono, correo, apellido, contrasena, id_rol, estado, imagen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [nombre, telefono, correo, apellido, passwordHash, id_rol, "activo", null]
  );

  return result.insertId;
};

exports.crearPaciente = async (
  client,
  { direccion, fecha_nacimiento, genero, id_usuario }
) => {
  const [result] = await client.query(
    `
    INSERT INTO paciente
    (direccion, fecha_nacimiento, genero, id_usuario)
    VALUES (?, ?, ?, ?)
    `,
    [direccion, fecha_nacimiento, genero, id_usuario]
  );

  return result.insertId;
};