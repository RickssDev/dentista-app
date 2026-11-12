// Spec 021 · P9: las consultas nuevas o modificadas del repositorio de usuarios llevan los valores
// del usuario solo en los parámetros, nunca en el texto del SQL.
// La conexión falsa se pasa como último argumento (`conn`), así que no se usa tests/support/fake-db.js.
const repo = require('../../src/modules/users/user.repository');

const MARCAS = {
  correo: 'marca-correo-q7@example.test',
  nombre: 'MarcaNombreQ7',
  apellido: 'MarcaApellidoQ7',
  telefono: '5500000777',
  id: 777123,
};

const conexionFalsa = (filas = []) => {
  const llamadas = [];
  return {
    llamadas,
    query: jest.fn(async (sql, params = []) => {
      llamadas.push({ sql, params });
      return [filas];
    }),
  };
};

const sinValoresEnElTexto = ({ sql, params }, valores) => {
  for (const valor of valores) {
    expect(sql).not.toContain(String(valor));
    expect(params.map(String)).toContain(String(valor));
  }
};

test('getRolById lleva el id en los parámetros', async () => {
  const conn = conexionFalsa([{ id_rol: 1, rol: 'Administrador' }]);
  await repo.getRolById(MARCAS.id, conn);
  expect(conn.llamadas).toHaveLength(1);
  sinValoresEnElTexto(conn.llamadas[0], [MARCAS.id]);
});

test('findOtroUsuarioPorCorreo lleva el correo y el id excluido en los parámetros', async () => {
  const conn = conexionFalsa();
  await repo.findOtroUsuarioPorCorreo(MARCAS.correo, MARCAS.id, conn);
  expect(conn.llamadas).toHaveLength(1);
  sinValoresEnElTexto(conn.llamadas[0], [MARCAS.correo, MARCAS.id]);
});

test('bloquearAdministradoresActivos usa la conexión recibida y no interpola nada', async () => {
  const conn = conexionFalsa([{ id_usuario: 1 }]);
  await repo.bloquearAdministradoresActivos(conn);
  expect(conn.llamadas).toHaveLength(1);
  expect(conn.llamadas[0].sql).toMatch(/FOR UPDATE/i);
  expect(conn.llamadas[0].sql).not.toMatch(/\$\{/);
});

test('updateUsuario arma el SET dinámico con los valores solo en los parámetros', async () => {
  const conn = conexionFalsa();
  await repo.updateUsuario(MARCAS.id, {
    nombre: MARCAS.nombre,
    apellido: MARCAS.apellido,
    correo: MARCAS.correo,
    telefono: MARCAS.telefono,
  }, conn);
  expect(conn.llamadas).toHaveLength(1);
  sinValoresEnElTexto(conn.llamadas[0], [MARCAS.nombre, MARCAS.apellido, MARCAS.correo, MARCAS.telefono, MARCAS.id]);
});

test('deleteUsuario lleva el id en los parámetros', async () => {
  const conn = conexionFalsa();
  await repo.deleteUsuario(MARCAS.id, conn);
  expect(conn.llamadas).toHaveLength(1);
  sinValoresEnElTexto(conn.llamadas[0], [MARCAS.id]);
});

test('desactivarUsuario lleva el id en los parámetros', async () => {
  const conn = conexionFalsa();
  await repo.desactivarUsuario(MARCAS.id, conn);
  expect(conn.llamadas).toHaveLength(1);
  sinValoresEnElTexto(conn.llamadas[0], [MARCAS.id]);
});
