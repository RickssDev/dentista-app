// Sustituye a src/config/db en las pruebas. Responde solo a las consultas conocidas de
// autenticación y lanza error ante cualquier otra, para que un cambio de SQL no pase inadvertido.
// No ejecuta SQL: las condiciones de las consultas se comprueban sobre su texto (sqlRecibido).

const ROLES = { 1: 'Administrador', 2: 'Asistente', 3: 'Paciente' };

const estado = { usuarios: [], pacientes: [], tokens: [], siguienteId: 1 };
const sqlRecibido = [];
const transacciones = [];

const normalizar = (sql) => sql.replace(/\s+/g, ' ').trim();

const reiniciar = () => {
  estado.usuarios.length = 0;
  estado.pacientes.length = 0;
  estado.tokens.length = 0;
  estado.siguienteId = 1;
  sqlRecibido.length = 0;
  transacciones.length = 0;
};

const agregarUsuario = (datos) => {
  const usuario = {
    id_usuario: estado.siguienteId++,
    id_rol: 3,
    estado: 'activo',
    contrasena: null,
    google_id: null,
    imagen: null,
    apellido: 'Prueba',
    ...datos,
  };
  estado.usuarios.push(usuario);
  return usuario;
};

const agregarToken = ({ id_usuario, token_hash, expirado = false }) => {
  estado.tokens.push({ id_usuario, token_hash, expirado });
};

const conRol = (usuario) => ({ ...usuario, rol: ROLES[usuario.id_rol] });
const porId = (id) => estado.usuarios.filter((u) => u.id_usuario === id);

const consultas = [
  [/^SELECT usuarios\.\*, roles\.rol AS rol FROM usuarios INNER JOIN roles ON usuarios\.id_rol = roles\.id_rol WHERE usuarios\.correo = \?$/, ([correo]) => [
    estado.usuarios.filter((u) => u.correo === correo).map(conRol),
  ]],
  [/^INSERT INTO usuarios \(nombre_usuario, apellido, correo, contrasena, id_rol, estado\)/,
    ([nombre_usuario, apellido, correo, contrasena, id_rol]) => [{
      insertId: agregarUsuario({ nombre_usuario, apellido, correo, contrasena, id_rol }).id_usuario,
    }]],
  [/^INSERT INTO usuarios \(nombre_usuario, apellido, correo, google_id, id_rol, estado\)/,
    ([nombre_usuario, apellido, correo, google_id, id_rol]) => [{
      insertId: agregarUsuario({ nombre_usuario, apellido, correo, google_id, id_rol }).id_usuario,
    }]],
  [/^SELECT \* FROM usuarios WHERE id_usuario = \?$/, ([id]) => [porId(id)]],
  [/^SELECT estado FROM usuarios WHERE id_usuario = \?$/, ([id]) => [porId(id)]],
  [/^SELECT \* FROM paciente WHERE id_usuario = \?$/, ([id]) => [
    estado.pacientes.filter((p) => p.id_usuario === id),
  ]],
  [/^UPDATE usuarios SET contrasena = \? WHERE id_usuario = \?$/, ([contrasena, id]) => {
    porId(id).forEach((u) => { u.contrasena = contrasena; });
    return [{}];
  }],
  [/^UPDATE usuarios SET google_id = \? WHERE id_usuario = \?$/, ([google_id, id]) => {
    porId(id).forEach((u) => { u.google_id = google_id; });
    return [{}];
  }],
  [/^INSERT INTO restablecimiento_contrasenas/, ([id_usuario, token_hash]) => {
    agregarToken({ id_usuario, token_hash });
    return [{}];
  }],
  [/^DELETE FROM restablecimiento_contrasenas WHERE token_hash = \?$/, ([hash]) => {
    estado.tokens.splice(0, estado.tokens.length, ...estado.tokens.filter((t) => t.token_hash !== hash));
    return [{}];
  }],
  [/^DELETE FROM restablecimiento_contrasenas WHERE id_usuario = \?$/, ([id]) => {
    estado.tokens.splice(0, estado.tokens.length, ...estado.tokens.filter((t) => t.id_usuario !== id));
    return [{}];
  }],
  // Reproduce a mano las condiciones del WHERE: expiración, cuenta activa y con contraseña.
  [/^SELECT r\.id_restablecimiento, .* FROM restablecimiento_contrasenas AS r/, ([hash]) => {
    const token = estado.tokens.find((t) => t.token_hash === hash && !t.expirado);
    const usuario = token && porId(token.id_usuario)[0];
    if (!usuario || usuario.estado !== 'activo' || usuario.contrasena === null) return [[]];
    return [[{ id_restablecimiento: 1, ...usuario }]];
  }],
];

const query = async (sql, parametros = []) => {
  const texto = normalizar(sql);
  sqlRecibido.push(texto);
  const coincidencia = consultas.find(([patron]) => patron.test(texto));
  if (!coincidencia) {
    throw new Error(`SQL no simulado: ${texto}`);
  }
  return coincidencia[1](parametros);
};

const pool = {
  query,
  getConnection: async () => ({
    query,
    beginTransaction: async () => { transacciones.push('begin'); },
    commit: async () => { transacciones.push('commit'); },
    rollback: async () => { transacciones.push('rollback'); },
    release: () => { transacciones.push('release'); },
  }),
};

module.exports = {
  pool,
  testConnection: async () => {},
  estado,
  sqlRecibido,
  transacciones,
  reiniciar,
  agregarUsuario,
  agregarToken,
};
